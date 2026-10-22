Add-Type -AssemblyName System.Drawing

# 1. 修复海报 banner_4：平滑擦除副标题
$bannerBmp = [System.Drawing.Bitmap]::FromFile("E:\GithubProjects\water-game\materials\banner_4.png")
$gBanner = [System.Drawing.Graphics]::FromImage($bannerBmp)

# 副标题大约在 X=900~1750, Y=310~450
# 使用背景柔和蓝紫渐变色做无缝渐变填充
$topColor = [System.Drawing.Color]::FromArgb(255, 185, 215, 245)
$bottomColor = [System.Drawing.Color]::FromArgb(255, 210, 205, 240)
$rect = New-Object System.Drawing.Rectangle(850, 310, 950, 160)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $topColor, $bottomColor, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$gBanner.FillRectangle($brush, $rect)
$brush.Dispose()
$gBanner.Dispose()

# 保存高质量 banner_4.jpg
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]92)
$bannerBmp.Save("E:\GithubProjects\water-game\materials\banner_4.jpg", $encoder, $encoderParams)
$bannerBmp.Dispose()
Write-Output "✓ Cleaned banner_4.jpg generated without subtitles"

# 2. 制作纯净的 shot_3：从海报左侧高精度的流体与试管截取竖屏 9:16 (1080x1920) 物理展示图
$srcBanner = [System.Drawing.Bitmap]::FromFile("E:\GithubProjects\water-game\materials\banner_4.png")
$shot3Bmp = New-Object System.Drawing.Bitmap(1080, 1920)
$gShot3 = [System.Drawing.Graphics]::FromImage($shot3Bmp)
$gShot3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gShot3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gShot3.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# 裁剪海报中左半边（X: 0~1080, Y: 0~1080），按比例绘制到竖屏中间，背景用上下渐变延伸
$topBg = $srcBanner.GetPixel(50, 50)
$botBg = $srcBanner.GetPixel(50, 1000)
$fullRect = New-Object System.Drawing.Rectangle(0, 0, 1080, 1920)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($fullRect, $topBg, $botBg, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$gShot3.FillRectangle($bgBrush, $fullRect)
$bgBrush.Dispose()

# 居中绘制主试管物理流体区
$srcCrop = New-Object System.Drawing.Rectangle(80, 50, 1000, 1000)
$destCrop = New-Object System.Drawing.Rectangle(40, 460, 1000, 1000)
$gShot3.DrawImage($srcBanner, $destCrop, $srcCrop, [System.Drawing.GraphicsUnit]::Pixel)

$gShot3.Dispose()
$srcBanner.Dispose()

$shot3Bmp.Save("E:\GithubProjects\water-game\materials\shot_3.jpg", $encoder, $encoderParams)
$shot3Bmp.Dispose()
Write-Output "✓ Clean in-game physics shot_3.jpg generated (pure graphics, zero annotations)"
