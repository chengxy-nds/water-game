const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. 100% 提取自参考图实现 HTML 的三层深度渐变背景 bg_game.png (1080x1920)
// 左上暖金、左下琥珀橘、右侧鼠尾草绿的三层柔和渐变 + 顶部流金星轨与空气感萤火微粒
const bgGameV3SVG = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 三层底色：左上暖金到右侧柔和鼠尾草绿 -->
    <linearGradient id="zenAmberV3Grad" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(25)">
      <stop offset="0%" stop-color="#b89852"/>
      <stop offset="32%" stop-color="#dfb456"/>
      <stop offset="58%" stop-color="#d89b44"/>
      <stop offset="92%" stop-color="#85986b"/>
      <stop offset="100%" stop-color="#728862"/>
    </linearGradient>

    <!-- 左下 28% 58% 处的暖琥珀橘光斑 (参考图核心灵魂光感) -->
    <radialGradient id="leftAmberSpot" cx="28%" cy="58%" r="52%">
      <stop offset="0%" stop-color="rgba(232, 165, 68, 0.92)"/>
      <stop offset="52%" stop-color="rgba(218, 152, 60, 0.45)"/>
      <stop offset="85%" stop-color="rgba(195, 130, 45, 0.0)"/>
    </radialGradient>

    <!-- 左上 46% 18% 处的暖阳金色光晕 -->
    <radialGradient id="topSunSpot" cx="46%" cy="18%" r="42%">
      <stop offset="0%" stop-color="rgba(255, 224, 120, 0.48)"/>
      <stop offset="42%" stop-color="rgba(255, 224, 120, 0.0)"/>
    </radialGradient>

    <!-- 顶部柔雾椭圆光弧 -->
    <radialGradient id="sunEllipse" cx="46%" cy="18%" r="55%">
      <stop offset="0%" stop-color="rgba(255, 240, 150, 0.40)"/>
      <stop offset="48%" stop-color="rgba(232, 165, 68, 0.12)"/>
      <stop offset="78%" stop-color="rgba(120, 80, 20, 0.0)"/>
    </radialGradient>
  </defs>

  <!-- 1. 三层底色 -->
  <rect width="1080" height="1920" fill="url(#zenAmberV3Grad)"/>

  <!-- 2. 左下琥珀橘光斑与左上日光 -->
  <rect width="1080" height="1920" fill="url(#leftAmberSpot)"/>
  <rect width="1080" height="1920" fill="url(#topSunSpot)"/>
  <rect width="1080" height="1920" fill="url(#sunEllipse)"/>

  <!-- 3. 流金星轨弧线 (提取自参考图) -->
  <path d="M -80,260 Q 520,150 1160,320" fill="none" stroke="rgba(255, 245, 190, 0.38)" stroke-width="2.6" stroke-dasharray="14 8"/>
  <path d="M -40,400 Q 500,290 1120,440" fill="none" stroke="rgba(255, 235, 170, 0.24)" stroke-width="1.8"/>

  <!-- 4. 浮动的空气感微粒 -->
  <circle cx="210" cy="190" r="4.5" fill="#fffef0" opacity="0.65"/>
  <circle cx="500" cy="130" r="6.0" fill="#fffef0" opacity="0.85"/>
  <circle cx="790" cy="230" r="3.5" fill="#fffef0" opacity="0.55"/>
  <circle cx="330" cy="390" r="4.2" fill="#fde047" opacity="0.5"/>
  <circle cx="900" cy="350" r="5.2" fill="#fffef0" opacity="0.6"/>
  <circle cx="160" cy="530" r="3.2" fill="#fffef0" opacity="0.45"/>
  <circle cx="690" cy="490" r="4.8" fill="#fde047" opacity="0.55"/>
</svg>
`;

// 2. 顶部左侧磨砂玻璃按钮 btn_settings.png (256x256)
// 100% 提取自参考图 HTML .glass-btn-small（38% 超椭圆圆角，顶部完整弧形高光）
const btnSettingsV3SVG = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="frostedSmall" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.45)"/>
      <stop offset="55%" stop-color="rgba(185, 205, 180, 0.22)"/>
      <stop offset="100%" stop-color="rgba(140, 165, 140, 0.35)"/>
    </linearGradient>
    <linearGradient id="topArcSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.65)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>

  <!-- 柔和阴影 -->
  <rect x="6" y="8" width="52" height="52" rx="20" fill="rgba(65, 78, 52, 0.28)"/>

  <!-- 主体超椭圆面板 (rx: 20 -> 约 38%) -->
  <rect x="6" y="6" width="52" height="52" rx="20" fill="url(#frostedSmall)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.0"/>

  <!-- 顶部完整圆弧反光 ::before -->
  <path d="M 14,8 L 50,8 C 54,8 56,12 56,18 C 50,26 14,26 8,18 C 8,12 10,8 14,8 Z" fill="url(#topArcSheen)"/>

  <!-- 纯白高清齿轮 ⚙️ -->
  <g transform="translate(32, 32)" fill="#ffffff">
    <circle cx="0" cy="0" r="10"/>
    <path d="M -3,-13.5 L 3,-13.5 L 4,-9.5 L -4,-9.5 Z"/>
    <path d="M -3,13.5 L 3,13.5 L 4,9.5 L -4,9.5 Z"/>
    <path d="M -13.5,-3 L -13.5,3 L -9.5,4 L -9.5,-4 Z"/>
    <path d="M 13.5,-3 L 13.5,3 L 9.5,4 L 9.5,-4 Z"/>
    <path d="M -9.5,-9.5 L -6,-11.5 L -4,-7.5 L -7.5,-6 Z"/>
    <path d="M 9.5,9.5 L 6,11.5 L 4,7.5 L 7.5,6 Z"/>
    <path d="M 9.5,-9.5 L 11.5,-6 L 7.5,-4 L 6,-7.5 Z"/>
    <path d="M -9.5,9.5 L -11.5,6 L -7.5,4 L -6,7.5 Z"/>
    <circle cx="0" cy="0" r="4.8" fill="#4a5e42" opacity="0.9"/>
  </g>
</svg>
`;

// 3. 顶部右侧磨砂玻璃规则说明按钮 btn_power.png (256x256)
// 100% 提取自参考图 HTML .rules-question：冰蓝白渐变高定问号 ❓
const btnPowerV3SVG = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="frostedSmallP" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.45)"/>
      <stop offset="55%" stop-color="rgba(185, 205, 180, 0.22)"/>
      <stop offset="100%" stop-color="rgba(140, 165, 140, 0.35)"/>
    </linearGradient>
    <linearGradient id="topArcSheenP" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.65)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
    <linearGradient id="iceBlueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="15%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#b8e1ff"/>
    </linearGradient>
    <filter id="qGlow">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(50, 85, 95, 0.35)"/>
    </filter>
  </defs>

  <rect x="6" y="8" width="52" height="52" rx="20" fill="rgba(65, 78, 52, 0.28)"/>
  <rect x="6" y="6" width="52" height="52" rx="20" fill="url(#frostedSmallP)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.0"/>
  <path d="M 14,8 L 50,8 C 54,8 56,12 56,18 C 50,26 14,26 8,18 C 8,12 10,8 14,8 Z" fill="url(#topArcSheenP)"/>

  <!-- 冰蓝白渐变高定问号 ❓ (对标 HTML .rules-question) -->
  <text x="32" y="42" text-anchor="middle" font-family="'Quicksand', -apple-system, sans-serif" font-size="28" font-weight="900" fill="url(#iceBlueGrad)" filter="url(#qGlow)">?</text>
</svg>
`;

// 4. 底部高定磨砂玻璃洗牌按钮 btn_shuffle.png (256x256)
// 100% 提取自参考图 HTML .glass-btn（34% 超椭圆圆角，顶部完整弧形高光反射）
const btnShuffleV3SVG = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glassBtnBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.48)"/>
      <stop offset="55%" stop-color="rgba(255, 255, 255, 0.18)"/>
      <stop offset="100%" stop-color="rgba(215, 185, 130, 0.32)"/>
    </linearGradient>
    <linearGradient id="glassBtnSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.65)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>

  <rect x="5" y="7" width="54" height="54" rx="18" fill="rgba(110, 74, 24, 0.28)"/>
  <rect x="5" y="5" width="54" height="54" rx="18" fill="url(#glassBtnBg)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.0"/>

  <!-- 顶部圆弧高光 ::before -->
  <path d="M 12,7 L 52,7 C 56,7 57,11 57,18 C 51,26 13,26 7,18 C 7,11 8,7 12,7 Z" fill="url(#glassBtnSheen)"/>

  <!-- 洗牌图标 🔀 纯白加粗 -->
  <g transform="translate(0, 0.5)">
    <path d="M 19,23 L 27,23 L 37,39 L 45,39" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 40,34 L 46,39 L 40,44" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 19,39 L 27,39 L 30.5,33.5" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 33.5,28.5 L 37,23 L 45,23" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 40,18 L 46,23 L 40,28" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

// 5. 底部高定磨砂玻璃撤回按钮 btn_undo.png (256x256)
const btnUndoV3SVG = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glassBtnBgU" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.48)"/>
      <stop offset="55%" stop-color="rgba(255, 255, 255, 0.18)"/>
      <stop offset="100%" stop-color="rgba(215, 185, 130, 0.32)"/>
    </linearGradient>
    <linearGradient id="glassBtnSheenU" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.65)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>

  <rect x="5" y="7" width="54" height="54" rx="18" fill="rgba(110, 74, 24, 0.28)"/>
  <rect x="5" y="5" width="54" height="54" rx="18" fill="url(#glassBtnBgU)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.0"/>
  <path d="M 12,7 L 52,7 C 56,7 57,11 57,18 C 51,26 13,26 7,18 C 7,11 8,7 12,7 Z" fill="url(#glassBtnSheenU)"/>

  <!-- 撤回弧线箭头 ↺ -->
  <g transform="translate(0, 0.5)">
    <path d="M 22,23 L 15,30 L 22,37" fill="none" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 18,30 C 26,20 44,20 48,31 C 52,42 38,48 29,46" fill="none" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/>
  </g>
</svg>
`;

async function main() {
  const assets = [
    { name: 'bg_game.png', svg: bgGameV3SVG },
    { name: 'btn_settings.png', svg: btnSettingsV3SVG },
    { name: 'btn_power.png', svg: btnPowerV3SVG },
    { name: 'btn_shuffle.png', svg: btnShuffleV3SVG },
    { name: 'btn_undo.png', svg: btnUndoV3SVG }
  ];

  for (const item of assets) {
    const pngPath = path.join(outDir, item.name);
    await sharp(Buffer.from(item.svg)).png().toFile(pngPath);
    console.log(`✓ Baked v3 UI asset: ${item.name}`);
  }
}

main().catch(console.error);
