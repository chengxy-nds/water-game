Add-Type -AssemblyName System.Drawing

$srcFile = "E:\GithubProjects\water-game\materials\shot_2.png"
$srcImg = [System.Drawing.Image]::FromFile($srcFile)

# 创建一张 1080x1920 的画布
$destBmp = New-Object System.Drawing.Bitmap(1080, 1920)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# 绘制完整的 shot_2（它包含神秘盲盒、广告瓶、多层试管，极其精致）
$g.DrawImage($srcImg, 0, 0, 1080, 1920)

$g.Dispose()
$srcImg.Dispose()

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]90)

$destBmp.Save("E:\GithubProjects\water-game\materials\shot_3.jpg", $encoder, $encoderParams)
$destBmp.Dispose()

Write-Output "✓ shot_3.jpg cleanly generated from shot_2 without any annotations"
