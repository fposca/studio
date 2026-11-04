$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '..\..'))
$sourcePath = Join-Path $workspaceRoot 'src\assets\icono-android.png'
$resRoot = Join-Path $projectRoot 'android\app\src\main\res'
$storeIconPath = Join-Path $projectRoot 'release-assets\play-store-icon-512.png'
if (-not (Test-Path -LiteralPath $sourcePath)) { throw "No existe $sourcePath" }

$source = [System.Drawing.Image]::FromFile($sourcePath)
try {
    if ($source.Width -ne $source.Height -or $source.Width -lt 512) {
        throw 'El icono de origen debe ser cuadrado y tener al menos 512 px.'
    }

    function Save-Icon([string]$path, [int]$size, [string]$kind) {
        $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            if ($kind -eq 'foreground') {
                # Android masks adaptive icons. Keep the face and wordmark near the safe center.
                $artSize = [int][Math]::Round($size * 0.68)
                $x = [int][Math]::Round(($size - $artSize) / 2)
                $y = [int][Math]::Round(($size - $artSize) / 2 - $size * 0.025)
                $graphics.DrawImage($source, [System.Drawing.Rectangle]::new($x, $y, $artSize, $artSize))
            } elseif ($kind -eq 'round') {
                $circle = [System.Drawing.Drawing2D.GraphicsPath]::new()
                $circle.AddEllipse(0, 0, $size - 1, $size - 1)
                $graphics.SetClip($circle)
                $background = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(11, 6, 21))
                $graphics.FillEllipse($background, 0, 0, $size, $size)
                $artSize = [int][Math]::Round($size * 0.86)
                $offset = [int][Math]::Round(($size - $artSize) / 2)
                $graphics.DrawImage($source, [System.Drawing.Rectangle]::new($offset, $offset, $artSize, $artSize))
                $background.Dispose()
                $circle.Dispose()
            } else {
                $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0, 0, $size, $size))
            }
            [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($path)) | Out-Null
            $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }

    $densities = [ordered]@{ mdpi = 1; hdpi = 1.5; xhdpi = 2; xxhdpi = 3; xxxhdpi = 4 }
    foreach ($density in $densities.Keys) {
        $scale = $densities[$density]
        $folder = Join-Path $resRoot "mipmap-$density"
        Save-Icon (Join-Path $folder 'ic_launcher.png') ([int](48 * $scale)) 'square'
        Save-Icon (Join-Path $folder 'ic_launcher_round.png') ([int](48 * $scale)) 'round'
        Save-Icon (Join-Path $folder 'ic_launcher_foreground.png') ([int](108 * $scale)) 'foreground'
    }
    Save-Icon $storeIconPath 512 'square'
    Write-Output "Iconos Android generados desde $sourcePath"
    Write-Output "Icono para Play Console: $storeIconPath"
} finally {
    $source.Dispose()
}