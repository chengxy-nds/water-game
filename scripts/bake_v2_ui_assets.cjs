const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. 晨曦流金 Zen Amber & Sage 背景 bg_game.png (1080x1920)
// 100% 还原 demo/v2.html 默认艺术背景（暖金至鼠尾草绿渐变 + 顶部金色星轨与微粒）
const bgGameSVG = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 主渐变：暖金渐变至柔雾鼠尾草绿 -->
    <linearGradient id="zenAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(25)">
      <stop offset="0%" stop-color="#d79646"/>
      <stop offset="28%" stop-color="#e5a143"/>
      <stop offset="52%" stop-color="#df9b3d"/>
      <stop offset="78%" stop-color="#b0914d"/>
      <stop offset="100%" stop-color="#778355"/>
    </linearGradient>

    <!-- 顶部暖阳金色星芒光晕 -->
    <radialGradient id="topSunGlow" cx="46%" cy="13%" r="55%">
      <stop offset="0%" stop-color="rgba(255, 244, 180, 0.55)"/>
      <stop offset="34%" stop-color="rgba(238, 178, 78, 0.25)"/>
      <stop offset="66%" stop-color="rgba(215, 150, 70, 0.0)"/>
    </radialGradient>

    <!-- 椭圆光环 -->
    <radialGradient id="sunEllipse" cx="48%" cy="16%" r="48%">
      <stop offset="0%" stop-color="rgba(255, 245, 190, 0.45)"/>
      <stop offset="48%" stop-color="rgba(235, 175, 70, 0.15)"/>
      <stop offset="85%" stop-color="rgba(120, 80, 20, 0.0)"/>
    </radialGradient>
  </defs>

  <!-- 1. 底层艺术渐变 -->
  <rect width="1080" height="1920" fill="url(#zenAmberGrad)"/>

  <!-- 2. 顶部金色日光与星芒光晕 -->
  <rect width="1080" height="1920" fill="url(#topSunGlow)"/>
  <rect width="1080" height="1920" fill="url(#sunEllipse)"/>

  <!-- 3. 背景流金星轨弧线 (还原 .starfield-bg) -->
  <path d="M -100,280 Q 540,160 1180,340" fill="none" stroke="rgba(255, 245, 190, 0.35)" stroke-width="2.5" stroke-dasharray="12 8"/>
  <path d="M -50,420 Q 520,310 1150,460" fill="none" stroke="rgba(255, 235, 170, 0.22)" stroke-width="1.8"/>

  <!-- 4. 浮动的空气感微粒 -->
  <circle cx="220" cy="180" r="4.5" fill="#fffef0" opacity="0.6"/>
  <circle cx="510" cy="120" r="6.0" fill="#fffef0" opacity="0.8"/>
  <circle cx="780" cy="220" r="3.5" fill="#fffef0" opacity="0.5"/>
  <circle cx="340" cy="380" r="4.0" fill="#fde047" opacity="0.45"/>
  <circle cx="890" cy="340" r="5.0" fill="#fffef0" opacity="0.55"/>
  <circle cx="150" cy="520" r="3.0" fill="#fffef0" opacity="0.4"/>
  <circle cx="680" cy="480" r="4.5" fill="#fde047" opacity="0.5"/>
</svg>
`;

// 2. 磨砂玻璃圆角方块设置按钮 btn_settings.png (256x256)
// 100% 对齐 .frosted-top-box：圆角 16px，柔光半透白金渐变，极细白边，内置纯白齿轮
const btnSettingsSVG = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="frostedBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.45)"/>
      <stop offset="58%" stop-color="rgba(255, 255, 255, 0.20)"/>
      <stop offset="100%" stop-color="rgba(255, 244, 214, 0.32)"/>
    </linearGradient>
  </defs>

  <!-- 柔和投影底座 -->
  <rect x="5" y="7" width="54" height="54" rx="16" fill="rgba(72, 48, 12, 0.22)"/>

  <!-- 磨砂玻璃主体面板 -->
  <rect x="5" y="5" width="54" height="54" rx="16" fill="url(#frostedBg)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.2"/>

  <!-- 左上角柔光折射弧 -->
  <ellipse cx="18" cy="11" rx="9" ry="3.2" fill="rgba(255, 255, 255, 0.65)" transform="rotate(-18 18 11)"/>

  <!-- 高清纯白齿轮 ⚙️ -->
  <g transform="translate(32, 32)" fill="#ffffff">
    <circle cx="0" cy="0" r="10.5"/>
    <path d="M -3.2,-14 L 3.2,-14 L 4.2,-10 L -4.2,-10 Z"/>
    <path d="M -3.2,14 L 3.2,14 L 4.2,10 L -4.2,10 Z"/>
    <path d="M -14,-3.2 L -14,3.2 L -10,4.2 L -10,-4.2 Z"/>
    <path d="M 14,-3.2 L 14,3.2 L 10,4.2 L 10,-4.2 Z"/>
    <path d="M -10,-10 L -6,-12 L -4,-8 L -8,-6 Z"/>
    <path d="M 10,10 L 6,12 L 4,8 L 8,6 Z"/>
    <path d="M 10,-10 L 12,-6 L 8,-4 L 6,-8 Z"/>
    <path d="M -10,10 L -12,6 L -8,4 L -6,8 Z"/>
    <circle cx="0" cy="0" r="5.0" fill="#a16207" opacity="0.85"/>
  </g>
</svg>
`;

// 3. 磨砂玻璃圆角方块闪电/规则按钮 btn_power.png (256x256)
// 100% 对齐 .frosted-top-box：内置亮金羊皮卷轴与闪电
const btnPowerSVG = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="frostedBgP" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.45)"/>
      <stop offset="58%" stop-color="rgba(255, 255, 255, 0.20)"/>
      <stop offset="100%" stop-color="rgba(255, 244, 214, 0.32)"/>
    </linearGradient>
  </defs>

  <rect x="5" y="7" width="54" height="54" rx="16" fill="rgba(72, 48, 12, 0.22)"/>
  <rect x="5" y="5" width="54" height="54" rx="16" fill="url(#frostedBgP)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="2.2"/>
  <ellipse cx="18" cy="11" rx="9" ry="3.2" fill="rgba(255, 255, 255, 0.65)" transform="rotate(-18 18 11)"/>

  <!-- 鎏金闪电标 ⚡ -->
  <polygon points="34,14 20,33 30,33 28,50 44,28 32,28" fill="#fde047" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>
</svg>
`;

// 4. 底部高定悬浮磨砂玻璃圆角方块按钮 btn_shuffle.png (256x256)
// 100% 对齐 .medallion-btn：圆角 20px，半透明香槟磨砂玻璃，极细白金镶边，内置鎏金洗牌图标
const btnShuffleSVG = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="medallionBgS" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.48)"/>
      <stop offset="56%" stop-color="rgba(255, 255, 255, 0.22)"/>
      <stop offset="100%" stop-color="rgba(255, 242, 210, 0.35)"/>
    </linearGradient>
  </defs>

  <rect x="4" y="6" width="56" height="56" rx="20" fill="rgba(92, 52, 10, 0.26)"/>
  <rect x="4" y="4" width="56" height="56" rx="20" fill="url(#medallionBgS)" stroke="rgba(255, 255, 255, 0.88)" stroke-width="2.2"/>
  <ellipse cx="18" cy="11" rx="10" ry="3.5" fill="rgba(255, 255, 255, 0.62)" transform="rotate(-18 18 11)"/>

  <!-- 洗牌图标 🔀 纯白加粗 -->
  <path d="M 19,23 L 27,23 L 37,39 L 45,39" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 40,34 L 46,39 L 40,44" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 19,39 L 27,39 L 30.5,33.5" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 33.5,28.5 L 37,23 L 45,23" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 40,18 L 46,23 L 40,28" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// 5. 底部高定悬浮磨砂玻璃撤回按钮 btn_undo.png (256x256)
const btnUndoSVG = `
<svg width="256" height="256" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="medallionBgU" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.48)"/>
      <stop offset="56%" stop-color="rgba(255, 255, 255, 0.22)"/>
      <stop offset="100%" stop-color="rgba(255, 242, 210, 0.35)"/>
    </linearGradient>
  </defs>

  <rect x="4" y="6" width="56" height="56" rx="20" fill="rgba(92, 52, 10, 0.26)"/>
  <rect x="4" y="4" width="56" height="56" rx="20" fill="url(#medallionBgU)" stroke="rgba(255, 255, 255, 0.88)" stroke-width="2.2"/>
  <ellipse cx="18" cy="11" rx="10" ry="3.5" fill="rgba(255, 255, 255, 0.62)" transform="rotate(-18 18 11)"/>

  <!-- 撤回弧线箭头 ↺ -->
  <path d="M 22,23 L 15,30 L 22,37" fill="none" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 18,30 C 26,20 44,20 48,31 C 52,42 38,48 29,46" fill="none" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/>
</svg>
`;

// 6. 高定暖象牙磨砂白金弹窗卡片 glass_modal_bg.png (1280x1680)
// 100% 对齐 .casual-modal-card：告别蓝框卡通感，暖象牙磨砂渐变 + 柔光白金边框
const glassModalBgSVG = `
<svg width="1280" height="1680" viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="modalWarmGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="rgba(70, 42, 12, 0.32)"/>
    </filter>
    <!-- 高定暖象牙卡片渐变 -->
    <linearGradient id="warmIvoryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffdf7"/>
      <stop offset="45%" stop-color="#fdf6e9"/>
      <stop offset="100%" stop-color="#f5e7cb"/>
    </linearGradient>
    <!-- 极细白金反光边框 -->
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <!-- 顶部圆润流光高光 -->
    <linearGradient id="topCrescent" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.75)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>

  <!-- 卡片底座外框 -->
  <rect x="8" y="8" width="304" height="404" rx="32" fill="url(#warmIvoryGrad)" stroke="url(#goldBorder)" stroke-width="2.6" filter="url(#modalWarmGlow)"/>

  <!-- 顶部圆弧高光 -->
  <path d="M 36,12 L 284,12 C 298,12 304,22 304,36 C 260,52 60,52 16,36 C 16,22 22,12 36,12 Z" fill="url(#topCrescent)"/>
</svg>
`;

// 7. 暖金琥珀渐变胶囊主按钮 btn_pill_primary.png (1040x224)
const btnPillPrimarySVG = `
<svg width="1040" height="224" viewBox="0 0 260 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="goldBtnGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#d97706" flood-opacity="0.45"/>
    </filter>
    <linearGradient id="amberBtnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="45%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="pillTopSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect x="4" y="3" width="252" height="50" rx="25" fill="url(#amberBtnGrad)" stroke="#ffffff" stroke-width="2.2" filter="url(#goldBtnGlow)" />
  <path d="M 28,5.5 L 232,5.5" stroke="rgba(255,255,255,0.95)" stroke-width="2" stroke-linecap="round" />
  <ellipse cx="130" cy="7" rx="100" ry="3.5" fill="url(#pillTopSheen)" />
</svg>
`;

async function main() {
  const assets = [
    { name: 'bg_game.png', svg: bgGameSVG },
    { name: 'btn_settings.png', svg: btnSettingsSVG },
    { name: 'btn_power.png', svg: btnPowerSVG },
    { name: 'btn_shuffle.png', svg: btnShuffleSVG },
    { name: 'btn_undo.png', svg: btnUndoSVG },
    { name: 'glass_modal_bg.png', svg: glassModalBgSVG },
    { name: 'btn_pill_primary.png', svg: btnPillPrimarySVG }
  ];

  for (const item of assets) {
    const pngPath = path.join(outDir, item.name);
    await sharp(Buffer.from(item.svg)).png().toFile(pngPath);
    console.log(`✓ Baked v2 UI asset: ${item.name}`);
  }
}

main().catch(console.error);
