Add-Type -AssemblyName System.Drawing

$srcBanner = [System.Drawing.Bitmap]::FromFile("E:\GithubProjects\water-game\materials\banner_4.png")
$g = [System.Drawing.Graphics]::FromImage($srcBanner)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# 抹平右侧所有英文文字 (X: 750~1850, Y: 150~550)
$brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 205, 222, 248))
$g.FillRectangle($brushBg, 750, 150, 1100, 380)
$brushBg.Dispose()

# 构造纯净中文标题字符串："倒水不能停"
$ch1 = [char]0x5012
$ch2 = [char]0x6C34
$ch3 = [char]0x4E0D
$ch4 = [char]0x80FD
$ch5 = [char]0x505C
$titleStr = "$ch1  $ch2  $ch3  $ch4  $ch5"

$fontFamily = New-Object System.Drawing.FontFamily("Microsoft YaHei")
$font = New-Object System.Drawing.Font($fontFamily, 68, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

# 阴影
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 70, 110, 160))
$g.DrawString($titleStr, $font, $shadowBrush, 864, 264)
$shadowBrush.Dispose()

# 白色主标题
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.DrawString($titleStr, $font, $textBrush, 860, 260)
$textBrush.Dispose()
$font.Dispose()
$fontFamily.Dispose()

$g.Dispose()

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]95)

$finalBannerPath = "E:\GithubProjects\water-game\materials\banner_4.jpg"
$srcBanner.Save($finalBannerPath, $encoder, $encoderParams)
$srcBanner.Dispose()

Write-Output "✓ Successfully generated compliant Chinese title banner_4: $finalBannerPath"
