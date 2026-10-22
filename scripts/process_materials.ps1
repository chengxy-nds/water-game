Add-Type -AssemblyName System.Drawing

$destDir = "E:\GithubProjects\water-game\materials"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

function Resize-Image($srcPath, $dstPath, $newWidth, $newHeight) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $destBmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $newWidth, $newHeight)
    $g.Dispose()
    $srcImg.Dispose()
    $destBmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Output "✓ Generated: $dstPath ($newWidth x $newHeight)"
}

function Crop-Square-Image($srcPath, $dstPath, $cropX, $cropY, $cropSize, $outSize) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $destBmp = New-Object System.Drawing.Bitmap($outSize, $outSize)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropSize, $cropSize)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $outSize, $outSize)
    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $srcImg.Dispose()
    $destBmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Output "✓ Generated: $dstPath ($outSize x $outSize)"
}

$rawBanner = "C:\Users\Administrator\.gemini\antigravity-ide\brain\70af0a25-ca3a-4bf5-8e88-71c5e5be1970\taptap_banner_4_1792647055420.jpg"
$rawShot1  = "C:\Users\Administrator\.gemini\antigravity-ide\brain\70af0a25-ca3a-4bf5-8e88-71c5e5be1970\taptap_shot_1_1792647072076.jpg"
$rawShot2  = "C:\Users\Administrator\.gemini\antigravity-ide\brain\70af0a25-ca3a-4bf5-8e88-71c5e5be1970\taptap_shot_2_1792647089771.jpg"
$rawBag    = "E:\GithubProjects\water-game\public\购物袋\image.png"

# 1. 宣传海报 1920x1080
Resize-Image $rawBanner "$destDir\banner_4.png" 1920 1080

# 2. 游戏图标 512x512（从海报左侧倾斜魔瓶裁剪并缩放）
Crop-Square-Image $rawBanner "$destDir\icon.png" 100 80 500 512

# 3. 截图 1 (1080x1920)
Resize-Image $rawShot1 "$destDir\shot_1.png" 1080 1920

# 4. 截图 2 (1080x1920)
Resize-Image $rawShot2 "$destDir\shot_2.png" 1080 1920

# 5. 截图 3 (1080x1920)
Resize-Image $rawBag "$destDir\shot_3.png" 1080 1920

Write-Output "All 5 store assets successfully prepared in $destDir"
