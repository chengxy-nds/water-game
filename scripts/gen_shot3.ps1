Add-Type -AssemblyName System.Drawing

$fileItem = Get-ChildItem -Path "public" -Recurse -Filter "image.png" | Select-Object -First 1
if ($fileItem) {
    $srcImg = [System.Drawing.Image]::FromFile($fileItem.FullName)
    $destBmp = New-Object System.Drawing.Bitmap(1080, 1920)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, 1080, 1920)
    $g.Dispose()
    $srcImg.Dispose()
    
    $outPath = "E:\GithubProjects\water-game\materials\shot_3.png"
    $destBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Output "✓ Successfully generated: $outPath"
} else {
    Write-Error "image.png not found"
}
