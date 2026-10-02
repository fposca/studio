param(
  [string]$PythonLauncher = "py"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$repo = Join-Path $root "server/work/local-ai/SkinTokens"
$venvPython = Join-Path $repo ".venv/Scripts/python.exe"

function Assert-Success([string]$Step) {
  if ($LASTEXITCODE -ne 0) { throw "$Step fallo con codigo $LASTEXITCODE" }
}

if (-not (Test-Path (Join-Path $repo "demo.py"))) {
  & git clone --depth 1 https://github.com/VAST-AI-Research/SkinTokens.git $repo
  Assert-Success "Clonar SkinTokens"
}
if (-not (Test-Path $venvPython)) {
  & $PythonLauncher -3.11 -m venv (Join-Path $repo ".venv")
  Assert-Success "Crear entorno Python"
}

& $venvPython -m pip install torch==2.7.0 torchvision==0.22.0 torchaudio==2.7.0 --index-url https://download.pytorch.org/whl/cu128
Assert-Success "Instalar PyTorch CUDA"
& $venvPython -m pip install -r (Join-Path $repo "requirements.txt") "transformers==4.57.6" scipy
Assert-Success "Instalar SkinTokens"

$fallback = @'
except ImportError:
    def flash_attn_func(q, k, v):
        result = F.scaled_dot_product_attention(q.transpose(1, 2), k.transpose(1, 2), v.transpose(1, 2))
        return result.transpose(1, 2), None
'@
$pattern = 'except Exception as e:\r?\n    from flash_attn\.flash_attn_interface import flash_attn_func as _flash_attn_func\r?\n    def flash_attn_func\(\*args, \*\*kwargs\):\r?\n        res = _flash_attn_func\(\*args, \*\*kwargs\)\r?\n        return res, None'
foreach ($relative in @("src/model/tokenrig.py", "src/model/skin_vae_model.py")) {
  $file = Join-Path $repo $relative
  $source = [IO.File]::ReadAllText($file)
  if ($source.Contains('flash_attention_2')) { $source = $source.Replace('flash_attention_2', 'sdpa') }
  if ([regex]::IsMatch($source, $pattern)) {
    $source = [regex]::Replace($source, $pattern, $fallback.TrimEnd() -replace "`r?`n", "`r`n")
  } elseif (-not $source.Contains('except ImportError:')) { throw "No se pudo adaptar $relative a Windows" }
  [IO.File]::WriteAllText($file, $source, [Text.UTF8Encoding]::new($false))
}
$spec = Join-Path $repo "src/server/spec.py"
$source = [IO.File]::ReadAllText($spec).Replace('flash_attention_2', 'sdpa')
[IO.File]::WriteAllText($spec, $source, [Text.UTF8Encoding]::new($false))
$bpyServer = Join-Path $repo "src/server/bpy_server.py"
$source = [IO.File]::ReadAllText($bpyServer).Replace("host='0.0.0.0'", "host='127.0.0.1'")
[IO.File]::WriteAllText($bpyServer, $source, [Text.UTF8Encoding]::new($false))

Push-Location $repo
try {
  & $venvPython download.py --model
  Assert-Success "Descargar pesos de SkinTokens"
} finally {
  Pop-Location
}

Write-Host "Motor de esqueleto local listo. Reinicia el servidor de Neon Studio."
