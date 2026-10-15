const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.resolve('E:/GithubProjects/water-game-cocos/assets/textures');

// 皇家灵猫水晶瓶 tube_giant_cat.png (4x: 496x896, viewBox: -12 -6 124 224)
const catBottleSVG = `
<svg width="496" height="896" viewBox="-12 -6 124 224" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="catGlassBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(70, 118, 205, 0.22)"/>
      <stop offset="20%" stop-color="rgba(22, 36, 78, 0.38)"/>
      <stop offset="55%" stop-color="rgba(15, 25, 60, 0.32)"/>
      <stop offset="80%" stop-color="rgba(82, 118, 182, 0.26)"/>
      <stop offset="100%" stop-color="rgba(26, 56, 124, 0.45)"/>
    </linearGradient>
    <linearGradient id="catEarInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffb8dc" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#ff6fae" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#b8256e" stop-opacity="0.45"/>
    </linearGradient>
    <radialGradient id="catBellGrad" cx="35%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#fff8c4"/>
      <stop offset="45%" stop-color="#ffd54f"/>
      <stop offset="85%" stop-color="#e68a00"/>
      <stop offset="100%" stop-color="#8c4b00"/>
    </radialGradient>
    <linearGradient id="catCollarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9e1446"/>
      <stop offset="28%" stop-color="#ff4d8d"/>
      <stop offset="55%" stop-color="#ff85b3"/>
      <stop offset="82%" stop-color="#e01e63"/>
      <stop offset="100%" stop-color="#800b34"/>
    </linearGradient>
    <linearGradient id="catRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="50%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>

  <!-- 1. 瓶底立体投影 -->
  <ellipse cx="50" cy="206" rx="48" ry="8.5" fill="rgba(2, 6, 20, 0.65)" />
  <ellipse cx="50" cy="204" rx="45" ry="7.2" fill="none" stroke="#f472b6" stroke-width="1.8" stroke-dasharray="10 5" opacity="0.8" />

  <!-- 2. 猫咪水晶瓶外轮廓 -->
  <!-- catClipPath: 耳朵与瓶身连通曲线 -->
  <path d="M 35,10 L 65,10 L 65,26 L 70,29 L 83,12 Q 90,7 91,18 L 87,44 Q 95,62 84,82 Q 96,108 94,148 L 92,193 A 42,10.5 0 0,1 8,193 L 6,148 Q 4,108 16,82 Q 5,62 13,44 L 9,18 Q 10,7 17,12 L 30,29 L 35,26 Z"
        fill="url(#catGlassBody)" stroke="url(#catRimGrad)" stroke-width="2.6" stroke-linejoin="round" />

  <!-- 3. 立体高光粉红猫耳内廓 -->
  <path d="M 13.5,16.5 L 27.5,29.5 L 15.5,41.5 Q 11.5,30 13.5,16.5 Z"
        fill="url(#catEarInnerGrad)" stroke="#fbcfe8" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M 15.5,20.5 L 23.5,28.5 L 16.5,36.5 Z" fill="rgba(255, 255, 255, 0.45)" />

  <path d="M 86.5,16.5 L 72.5,29.5 L 84.5,41.5 Q 88.5,30 86.5,16.5 Z"
        fill="url(#catEarInnerGrad)" stroke="#fbcfe8" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M 84.5,20.5 L 76.5,28.5 L 83.5,36.5 Z" fill="rgba(255, 255, 255, 0.45)" />

  <!-- 4. 瓶底深邃玻璃腔与水晶垫底 -->
  <ellipse cx="50" cy="193" rx="41.5" ry="9.5" fill="#060c3a" stroke="#38bdf8" stroke-width="2.2" />

  <!-- 5. 可爱猫咪五官面部细节 -->
  <!-- 左右粉嫩腮红 -->
  <ellipse cx="24" cy="64" rx="6.5" ry="3.6" fill="rgba(255, 120, 185, 0.6)" />
  <ellipse cx="76" cy="64" rx="6.5" ry="3.6" fill="rgba(255, 120, 185, 0.6)" />
  <!-- 闭目弯弯笑眼 -->
  <path d="M 24,56 Q 32,48 40,56" fill="none" stroke="#d8f0ff" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M 60,56 Q 68,48 76,56" fill="none" stroke="#d8f0ff" stroke-width="2.8" stroke-linecap="round"/>
  <!-- 小爱心鼻头 -->
  <path d="M 50,66.5 C 46,63.5 45.5,59.5 48,59.5 C 49.2,59.5 50,60.5 50,61.2 C 50,60.5 50.8,59.5 52,59.5 C 54.5,59.5 54,63.5 50,66.5 Z"
        fill="#ff6da8" stroke="#ffffff" stroke-width="1.2"/>
  <!-- 微笑猫咪嘴巴 ω -->
  <path d="M 43.5,69.5 Q 46.8,73.5 50,68.5 Q 53.2,73.5 56.5,69.5"
        fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
  <!-- 俏皮猫胡须 -->
  <g stroke="rgba(205, 235, 255, 0.85)" stroke-width="1.6" stroke-linecap="round">
    <line x1="9" y1="57" x2="20" y2="60" />
    <line x1="7" y1="64" x2="19" y2="64" />
    <line x1="10" y1="71" x2="20" y2="68" />
    <line x1="91" y1="57" x2="80" y2="60" />
    <line x1="93" y1="64" x2="81" y2="64" />
    <line x1="90" y1="71" x2="80" y2="68" />
  </g>

  <!-- 6. 红色高定猫咪项圈与黄金大铃铛 -->
  <path d="M 15.5,81 Q 50,91 84.5,81 L 85.2,86.5 Q 50,96.5 14.8,86.5 Z"
        fill="url(#catCollarGrad)" stroke="#ffbfd9" stroke-width="1.2" />
  <circle cx="50" cy="89.5" r="7.5" fill="url(#catBellGrad)" stroke="#fff3b0" stroke-width="1.3" />
  <line x1="45" y1="88" x2="55" y2="88" stroke="#995200" stroke-width="1.1" />
  <circle cx="50" cy="91.5" r="1.8" fill="#5c2d00" />
  <circle cx="48" cy="86.8" r="1.5" fill="#ffffff" opacity="0.95" />

  <!-- 7. 瓶身落地窗反光高光 -->
  <path d="M 56,35 Q 80,41 83,64 L 69,66 Q 65,46 52,39 Z" fill="rgba(255, 255, 255, 0.32)" />
  <path d="M 74,88 Q 88,118 85,180 L 73,180 Q 76,120 66,88 Z" fill="rgba(255, 255, 255, 0.22)" />
</svg>
`;

async function main() {
  await sharp(Buffer.from(catBottleSVG)).png().toFile(path.join(outDir, 'tube_giant_cat.png'));
  console.log('✓ Baked tube_giant_cat.png (496x896 4x Retina Royal Cat Bottle)!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
