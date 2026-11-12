$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$textureRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'src/assets/environments'
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$quality = New-Object System.Drawing.Imaging.EncoderParameters(1)
$quality.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]86)
$textures = @(
    @{ Source = 'castle-interior-stone-v1.png'; Output = 'bridge-stone.chapter11.jpg'; Size = 1024 },
    @{ Source = 'volcanic-black-earth-v1.png'; Output = 'basalt.chapter11.jpg'; Size = 768 }
)
foreach ($texture in $textures) {
    $inputImage = [System.Drawing.Image]::FromFile((Join-Path $textureRoot $texture.Source))
    $outputImage = New-Object System.Drawing.Bitmap($texture.Size, $texture.Size)
    $graphics = [System.Drawing.Graphics]::FromImage($outputImage)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($inputImage, 0, 0, $texture.Size, $texture.Size)
        $outputImage.Save((Join-Path $textureRoot $texture.Output), $encoder, $quality)
    } finally {
        $graphics.Dispose()
        $inputImage.Dispose()
        $outputImage.Dispose()
    }
    Get-Item -LiteralPath (Join-Path $textureRoot $texture.Output) | Select-Object Name, Length
}
$quality.Dispose()
