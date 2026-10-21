const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 按照 TapTap 官方规范构建 H5 zip：
// H5 ZIP root must contain exactly one game directory
const buildDir = path.join(__dirname, '../.taptap_build');
const gameDir = path.join(buildDir, 'game');
const zipPath = path.join(__dirname, '../water_game_taptap_h5.zip');

if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(gameDir, { recursive: true });

// 复制生产产物 index.html 到 game 目录下
const srcIndex = path.join(__dirname, '../dist/index.html');
fs.copyFileSync(srcIndex, path.join(gameDir, 'index.html'));

console.log('✓ Prepared single game directory structure in:', gameDir);

// 压缩整个 buildDir 下的 game 目录
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 使用 PowerShell 压缩（只包含 game 这一层单一根目录）
const cmd = `Compress-Archive -Path "${gameDir}" -DestinationPath "${zipPath}" -Force`;
execSync(`powershell -Command "${cmd}"`, { stdio: 'inherit' });

console.log('✓ Successfully generated compliant TapTap H5 zip package at:', zipPath);
