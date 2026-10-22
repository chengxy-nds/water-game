const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 准备打包目录
const buildDir = path.join(__dirname, '../.miniapp_build');
const zipPath = path.join(__dirname, '../water_game_miniapp.zip');

if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// 1. 生成标准的 game.json
const gameConfig = {
  deviceOrientation: "portrait"
};
fs.writeFileSync(path.join(buildDir, 'game.json'), JSON.stringify(gameConfig, null, 2), 'utf8');

// 2. 复制 index.html
const srcHtml = path.join(__dirname, '../dist/index.html');
fs.copyFileSync(srcHtml, path.join(buildDir, 'index.html'));

// 3. 同时提供一份 game.js 入口（避免小游戏环境必须找 game.js）
// 如果小游戏容器有 DOM 模拟环境或 webview 转发，提供基本声明
const gameJsContent = `// TapTap Mini Game Entry\nconsole.log('TapTap Mini Game Starting...');\n`;
fs.writeFileSync(path.join(buildDir, 'game.js'), gameJsContent, 'utf8');

console.log('✓ Prepared mini-app files: game.json, index.html, game.js');

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 压缩整个目录内的文件到 zip 根路径
const cmd = `Compress-Archive -Path "${buildDir}\\*" -DestinationPath "${zipPath}" -Force`;
execSync(`powershell -Command "${cmd}"`, { stdio: 'inherit' });

console.log('✓ Successfully created:', zipPath);
