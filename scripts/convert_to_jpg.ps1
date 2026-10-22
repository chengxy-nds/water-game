Add-Type -AssemblyName System.Drawing

function Convert-To-Jpg($srcPng, $dstJpg, $quality) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPng)
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
    $srcImg.Save($dstJpg, $encoder, $encoderParams)
    $srcImg.Dispose()
    $size = (Get-Item $dstJpg).Length
    Write-Output "✓ Converted: $dstJpg ($size bytes)"
}

Convert-To-Jpg "E:\GithubProjects\water-game\materials\banner_4.png" "E:\GithubProjects\water-game\materials\banner_4.jpg" 92
Convert-To-Jpg "E:\GithubProjects\water-game\materials\icon.png" "E:\GithubProjects\water-game\materials\icon.jpg" 95
Convert-To-Jpg "E:\GithubProjects\water-game\materials\shot_1.png" "E:\GithubProjects\water-game\materials\shot_1.jpg" 90
Convert-To-Jpg "E:\GithubProjects\water-game\materials\shot_2.png" "E:\GithubProjects\water-game\materials\shot_2.jpg" 90
Convert-To-Jpg "E:\GithubProjects\water-game\materials\shot_3.png" "E:\GithubProjects\water-game\materials\shot_3.jpg" 90
