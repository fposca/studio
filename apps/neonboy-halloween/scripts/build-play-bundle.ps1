param(
  [string]$KeystorePath = (Join-Path $env:USERPROFILE '.android\neonboy-halloween-upload.jks'),
  [string]$ProtectedPasswordPath = (Join-Path $env:USERPROFILE '.android\neonboy-halloween-upload-password.dpapi'),
  [string]$Alias = 'neonboy-halloween-upload',
  [string]$ArtifactName = ('neonboy-halloween-v1.0.1-{0}-play.aab' -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
)

$ErrorActionPreference = 'Stop'
$previousAndroidHome = $env:ANDROID_HOME
if (-not $env:ANDROID_HOME -or -not (Test-Path -LiteralPath $env:ANDROID_HOME -PathType Container)) {
  $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
if (-not (Test-Path -LiteralPath $env:ANDROID_HOME -PathType Container)) {
  throw "No se encontró el Android SDK: $env:ANDROID_HOME"
}
$appRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$androidRoot = Join-Path $appRoot 'android'
$unsignedBundle = Join-Path $androidRoot 'app\build\outputs\bundle\release\app-release.aab'
$releaseDir = Join-Path $appRoot 'release-assets'
if ($ArtifactName -notmatch '^[a-zA-Z0-9][a-zA-Z0-9._-]*\.aab$') {
  throw 'El nombre del AAB debe ser un archivo .aab simple, sin rutas.'
}
$signedBundle = Join-Path $releaseDir $ArtifactName
if (Test-Path -LiteralPath $signedBundle) {
  throw "El AAB de destino ya existe y no se sobrescribira: $signedBundle"
}

if (-not (Test-Path -LiteralPath $KeystorePath -PathType Leaf)) { throw "No se encontró la clave de carga: $KeystorePath" }
$hadPasswordInEnvironment = [bool]$env:NEONBOY_UPLOAD_PASSWORD
if (-not $hadPasswordInEnvironment) {
  if (Test-Path -LiteralPath $ProtectedPasswordPath -PathType Leaf) {
    $protectedPassword = Get-Content -LiteralPath $ProtectedPasswordPath -Raw
    $securePassword = ConvertTo-SecureString -String $protectedPassword
  } else {
    $securePassword = Read-Host 'Contraseña de la clave de carga' -AsSecureString
  }
  $env:NEONBOY_UPLOAD_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
}
if (-not $env:NEONBOY_UPLOAD_PASSWORD) { throw 'La contraseña de la clave de carga está vacía.' }

try {
  Push-Location $appRoot
  try {
    & npm.cmd run android:sync
    if ($LASTEXITCODE -ne 0) { throw 'Falló android:sync.' }
  } finally { Pop-Location }

  Push-Location $androidRoot
  try {
    & .\gradlew.bat bundleRelease
    if ($LASTEXITCODE -ne 0) { throw 'Falló bundleRelease.' }
  } finally { Pop-Location }

  if (-not (Test-Path -LiteralPath $unsignedBundle -PathType Leaf)) { throw 'Gradle no generó el AAB.' }
  New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
  Copy-Item -LiteralPath $unsignedBundle -Destination $signedBundle
  & jarsigner.exe -keystore $KeystorePath -storepass:env NEONBOY_UPLOAD_PASSWORD -keypass:env NEONBOY_UPLOAD_PASSWORD -sigalg SHA256withRSA -digestalg SHA-256 $signedBundle $Alias
  if ($LASTEXITCODE -ne 0) { throw 'Falló la firma del AAB.' }
  $verification = & jarsigner.exe -verify $signedBundle 2>&1
  $verification | ForEach-Object { Write-Output $_ }
  if ($LASTEXITCODE -ne 0 -or -not ($verification -match 'jar verified\.')) { throw 'La verificación de firma del AAB falló.' }
  Write-Output "AAB firmado: $signedBundle"
  Get-FileHash -Algorithm SHA256 -LiteralPath $signedBundle | Select-Object Path,Hash
} finally {
  if (-not $hadPasswordInEnvironment) {
    Remove-Item Env:\NEONBOY_UPLOAD_PASSWORD -ErrorAction SilentlyContinue
  }
  if ($previousAndroidHome) {
    $env:ANDROID_HOME = $previousAndroidHome
  } else {
    Remove-Item Env:\ANDROID_HOME -ErrorAction SilentlyContinue
  }
}

