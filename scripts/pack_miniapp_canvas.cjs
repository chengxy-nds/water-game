/**
 * Canvas 小游戏与 Web 预览统一打包构建器
 * 严格遵从工业级游戏架构标准：
 * 1. 以 src_miniapp 为唯一真实源 (Single Source of Truth)
 * 2. 构建完全自包含的 Mini App Zip (game.js + game.json)
 * 3. 100% 同构同步更新 demo/v11-canvas.html 与根目录 index.html
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src_miniapp');
const srcJsDir = path.join(srcDir, 'js');
const buildDir = path.join(rootDir, '.miniapp_build');
const zipPath = path.join(rootDir, 'water_game_miniapp.zip');

console.log('=== 开始构建纯 Canvas 工业级全机制小游戏包 ===');

// 1. 清理并重置构建目录
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(path.join(buildDir, 'js'), { recursive: true });

// 2. 拷贝 game.json
const gameJsonSrc = path.join(srcDir, 'game.json');
fs.copyFileSync(gameJsonSrc, path.join(buildDir, 'game.json'));
console.log('✓ 已生成 game.json');

// 3. 读取 src_miniapp/js/ 核心模块
const modules = [
  'platform.js',
  'levels.js',
  'game_logic.js',
  'audio.js',
  'renderer.js'
];

let bundledModules = '';
modules.forEach(file => {
  const p = path.join(srcJsDir, file);
  const content = fs.readFileSync(p, 'utf8');
  bundledModules += `\n/* ==================== MODULE: ${file} ==================== */\n` + content + '\n';
  fs.copyFileSync(p, path.join(buildDir, 'js', file));
});

// 读取入口逻辑并剥离打包时已存在的模块重新声明
let gameEntryCode = fs.readFileSync(path.join(srcDir, 'game.js'), 'utf8');
gameEntryCode = gameEntryCode
  .replace(/var Platform =[\s\S]*?var AudioManager =.*?;/m, '// Modules loaded in scope');

// 4. 生成统一合并版 game.js (适用于 TapTap 与微信小游戏沙箱)
const bundledGameJs = `/**
 * 《倒水不能停》TapTap & 微信小游戏统一标准工业级纯 Canvas 引擎
 * Standalone Minigame Bundle
 */
(function() {
  'use strict';
  console.log('[Minigame Engine] Booting Water Sort Pure Canvas Engine...');

  if (typeof window === 'undefined') {
    globalThis.window = globalThis;
  }

  ${bundledModules}

  ${gameEntryCode}
})();
`;

const gameJsDest = path.join(buildDir, 'game.js');
fs.writeFileSync(gameJsDest, bundledGameJs, 'utf8');
console.log('✓ 已生成自包含纯 Canvas game.js');

// 5. 生成 100% 同构的单文件 Web 预览版 (demo/v11-canvas.html 与 index.html)
const webHtmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>倒水不能停 - 纯 Canvas 工业级全机制版</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
    }
    html, body {
      width: 100%;
      height: 100%;
      height: 100dvh;
      overflow: hidden;
      background: #1a150e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    }
    #game-canvas {
      display: block;
      width: 100vw;
      height: 100dvh;
      max-width: 460px;
      max-height: 960px;
      touch-action: none;
      box-shadow: 0 0 35px rgba(0, 0, 0, 0.55);
    }
  </style>
</head>
<body>
  <canvas id="game-canvas"></canvas>

  <script>
    'use strict';
    console.log('[Pure Canvas Web Engine] Starting Water Sort...');
    ${bundledModules}

    window.addEventListener('DOMContentLoaded', () => {
      ${gameEntryCode}
    });
  </script>
</body>
</html>
`;

// 输出到 demo/v11-canvas.html
fs.writeFileSync(path.join(rootDir, 'demo', 'v11-canvas.html'), webHtmlContent, 'utf8');
// 输出到根目录 index.html (供本地 vite / http-server 预览)
fs.writeFileSync(path.join(rootDir, 'index.html'), webHtmlContent, 'utf8');
// 输出到 build/index.html (供 webview 降级)
fs.writeFileSync(path.join(buildDir, 'index.html'), webHtmlContent, 'utf8');
console.log('✓ 已同步生成 demo/v11-canvas.html 与根目录 index.html');

// 6. 语法静态检测
try {
  execSync(`node --check "${gameJsDest}"`, { stdio: 'inherit' });
  console.log('✓ 语法静态分析通过 (Syntax OK)');
} catch (e) {
  console.error('❌ 语法检查失败:', e);
  process.exit(1);
}

// 7. 生成 ZIP 包
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const zipCmd = `Compress-Archive -Path "${buildDir}\\*" -DestinationPath "${zipPath}" -Force`;
execSync(`powershell -Command "${zipCmd}"`, { stdio: 'inherit' });

const stats = fs.statSync(zipPath);
console.log(`✓ 成功构建小游戏包体: ${zipPath} (${(stats.size / 1024).toFixed(2)} KB)`);
console.log('=== 构建完毕 ===\n');

