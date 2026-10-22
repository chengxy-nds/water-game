Add-Type -AssemblyName System.Drawing

$fileItem = Get-ChildItem -Path "public" -Recurse -Filter "image.png" | Select-Object -First 1
$srcImg = [System.Drawing.Image]::FromFile($fileItem.FullName)

# 目标 1080 x 1920 竖屏
$destBmp = New-Object System.Drawing.Bitmap(1080, 1920)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# 纯净背景
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
$g.FillRectangle($brush, 0, 0, 1080, 1920)
$brush.Dispose()

# 纯净裁剪原图左侧的购物袋主体（完全避开右侧所有标注文本）
# 购物袋主体在 X=20, Y=30, Width=630, Height=1380
$srcRect = New-Object System.Drawing.Rectangle(20, 30, 630, 1380)
$destRect = New-Object System.Drawing.Rectangle(140, 84, 800, 1752)
$g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$srcImg.Dispose()

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]92)

$outPath = "E:\GithubProjects\water-game\materials\shot_3.jpg"
$destBmp.Save($outPath, $encoder, $encoderParams)
$destBmp.Dispose()

Write-Output "✓ Successfully generated pure clean 3D shopping bag shot_3.jpg without any text/annotations"
