const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const htmlPath = path.resolve(__dirname, 'render_canvas.html');
const sheetPath = path.resolve(__dirname, 'chrome_sheet.png');
const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

console.log('[Native Chrome Bake] 正在使用系统真实 Chrome 引擎渲染 HTML 资产...');

// 1. 运行 Headless Chrome 对 HTML 进行像素级透明渲染
const cmd = `"${chromePath}" --headless=new --default-background-color=00000000 --screenshot="${sheetPath}" --window-size=1200,800 "file:///${htmlPath.replace(/\\/g, '/')}"`;
execSync(cmd, { stdio: 'inherit' });

if (!fs.existsSync(sheetPath)) {
  throw new Error('Chrome 渲染截图失败，未找到 chrome_sheet.png');
}

console.log('✓ Chrome 原生高保真渲染成功！正在精准切片...');

// 2. 元素切片配置
const slices = [
  { name: 'btn_level.png', left: 0, top: 0, width: 200, height: 200 },
  { name: 'btn_shuffle.png', left: 200, top: 0, width: 200, height: 200 },
  { name: 'btn_undo.png', left: 400, top: 0, width: 200, height: 200 },
  { name: 'btn_add_bottle.png', left: 600, top: 0, width: 200, height: 200 },
  { name: 'btn_settings.png', left: 0, top: 200, width: 200, height: 200 },
  { name: 'btn_power.png', left: 200, top: 200, width: 200, height: 200 },
  { name: 'badge_gold_new.png', left: 400, top: 200, width: 100, height: 100 },
  { name: 'burlap_coaster_normal.png', left: 0, top: 400, width: 300, height: 140 },
  { name: 'burlap_coaster_special.png', left: 300, top: 400, width: 300, height: 140 },
  { name: 'burlap_coaster_star.png', left: 600, top: 400, width: 300, height: 140 },
];

async function sliceAll() {
  for (const s of slices) {
    const dest = path.join(outDir, s.name);
    await sharp(sheetPath)
      .extract({ left: s.left, top: s.top, width: s.width, height: s.height })
      .toFile(dest);
    console.log(`  -> 导出 100% Chrome 原生切图: ${s.name}`);
  }

  // 清理临时 sheet
  if (fs.existsSync(sheetPath)) {
    fs.unlinkSync(sheetPath);
  }
  console.log('★ 全量资产已完全由 Chrome 浏览器原生生成并注入 Cocos！');
}

sliceAll().catch(console.error);
