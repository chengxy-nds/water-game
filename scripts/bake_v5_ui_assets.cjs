const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// ========================================================
// 1. 3D 粗麻布编织软垫底座 (Burlap Coasters) - 100% 提取自 v5.html
// ========================================================
function createBurlapSVG(type) {
  // type: 'normal' | 'special' | 'star'
  const isDarkStarTile = (type === 'star');
  const hasBeadedRing = (type === 'special');

  const patBg = isDarkStarTile ? '#362718' : '#8c6236';
  const r1Fill = isDarkStarTile ? '#7c6348' : '#edd1a1';
  const r1Hi = isDarkStarTile ? '#9c8062' : '#fff0cf';
  const r2Fill = isDarkStarTile ? '#634d36' : '#d9b077';
  const r2Hi = isDarkStarTile ? '#94785a' : '#f7dfb2';
  const r3Fill = isDarkStarTile ? '#5e4832' : '#d6ac72';
  const r3Hi = isDarkStarTile ? '#755c42' : '#f5dca8';
  const r4Fill = isDarkStarTile ? '#755c42' : '#e8c896';
  const r4Hi = isDarkStarTile ? '#94785a' : '#ffeed0';

  const sideStop0 = isDarkStarTile ? '#69523a' : '#c4945a';
  const sideStop1 = isDarkStarTile ? '#473524' : '#8c6032';
  const sideStop2 = isDarkStarTile ? '#2b1f14' : '#543618';
  const sideStop3 = isDarkStarTile ? '#1a110a' : '#331f0c';

  const rimStroke = isDarkStarTile ? 'rgba(255, 232, 185, 0.45)' : 'rgba(255, 248, 225, 0.75)';

  let surfaceInlay = '';
  if (isDarkStarTile) {
    surfaceInlay = `
      <g transform="translate(128, 54) scale(2.4, 1.25)">
        <path d="M0,-14 L4.2,-4.5 L14.5,-3.2 L6.8,3.8 L8.8,14 L0,8.8 L-8.8,14 L-6.8,3.8 L-14.5,-3.2 L-4.2,-4.5 Z"
              fill="#ffee44" stroke="#d97706" stroke-width="1.6" stroke-linejoin="round"
              filter="drop-shadow(0px 3px 5px rgba(255, 190, 0, 0.75))"/>
      </g>
    `;
  } else if (hasBeadedRing) {
    surfaceInlay = `
      <g transform="translate(128, 50)">
        <ellipse cx="0" cy="0" rx="58" ry="16" fill="none" stroke="#fffdf7" stroke-width="4.5" stroke-dasharray="4.5 7.5" stroke-linecap="round" opacity="0.92"/>
        <ellipse cx="0" cy="0" rx="44" ry="12" fill="none" stroke="#fffdf7" stroke-width="3.5" stroke-dasharray="3.5 6.5" stroke-linecap="round" opacity="0.82"/>
      </g>
    `;
  }

  return `
<svg width="256" height="120" viewBox="0 0 256 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 经纬交错粗麻线节 pattern -->
    <pattern id="burlapPat" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="${patBg}"/>
      <rect x="1.2" y="1.5" width="8.2" height="7.2" rx="2.5" fill="${r1Fill}"/>
      <rect x="2.2" y="2.2" width="6.0" height="3.0" rx="1.2" fill="${r1Hi}" opacity="0.75"/>
      <rect x="11.0" y="1.2" width="7.2" height="8.2" rx="2.5" fill="${r2Fill}"/>
      <rect x="12.0" y="2.2" width="3.2" height="6.0" rx="1.2" fill="${r2Hi}" opacity="0.65"/>
      <rect x="1.2" y="11.0" width="7.2" height="8.2" rx="2.5" fill="${r3Fill}"/>
      <rect x="2.2" y="12.0" width="3.2" height="6.0" rx="1.2" fill="${r3Hi}" opacity="0.65"/>
      <rect x="11.2" y="11.5" width="8.2" height="7.2" rx="2.5" fill="${r4Fill}"/>
      <rect x="12.2" y="12.2" width="6.0" height="3.0" rx="1.2" fill="${r4Hi}" opacity="0.72"/>
    </pattern>

    <!-- 侧壁渐变 -->
    <linearGradient id="burlapSideWall" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${sideStop0}"/>
      <stop offset="38%" stop-color="${sideStop1}"/>
      <stop offset="78%" stop-color="${sideStop2}"/>
      <stop offset="100%" stop-color="${sideStop3}"/>
    </linearGradient>

    <!-- 顶面立体球面光影罩 -->
    <linearGradient id="burlapTopShade" x1="12%" y1="8%" x2="88%" y2="92%">
      <stop offset="0%" stop-color="#fff8e6" stop-opacity="0.38"/>
      <stop offset="45%" stop-color="#d49e5c" stop-opacity="0.06"/>
      <stop offset="82%" stop-color="#5c3b18" stop-opacity="0.36"/>
      <stop offset="100%" stop-color="#38220c" stop-opacity="0.58"/>
    </linearGradient>

    <!-- 暖赤陶色柔和地面投影 -->
    <radialGradient id="terracottaShadowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(148, 62, 14, 0.62)"/>
      <stop offset="48%" stop-color="rgba(168, 78, 20, 0.36)"/>
      <stop offset="78%" stop-color="rgba(185, 92, 28, 0.12)"/>
      <stop offset="100%" stop-color="rgba(185, 92, 28, 0.0)"/>
    </radialGradient>

    <!-- 瓶底接触深色 AO -->
    <radialGradient id="contactAO" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(36, 20, 6, 0.75)"/>
      <stop offset="58%" stop-color="rgba(52, 30, 10, 0.35)"/>
      <stop offset="100%" stop-color="rgba(52, 30, 10, 0.0)"/>
    </radialGradient>
  </defs>

  <!-- 1. 暖赤陶色地面柔影 -->
  <ellipse cx="108" cy="88" rx="115" ry="29" transform="rotate(-5, 108, 88)" fill="url(#terracottaShadowGrad)"/>
  <ellipse cx="123" cy="80" rx="98" ry="22" fill="rgba(115, 48, 8, 0.36)"/>

  <!-- 2. 3D 软垫厚实侧面 -->
  <path d="M 28,50.7
           C 28,33.8 64,26 128,26
           C 192,26 228,33.8 228,50.7
           L 224,71.5
           C 220,92.3 184,102.7 128,102.7
           C 72,102.7 36,92.3 32,71.5 Z"
        fill="url(#burlapSideWall)"/>
  <path d="M 28,50.7
           C 28,33.8 64,26 128,26
           C 192,26 228,33.8 228,50.7
           L 224,71.5
           C 220,92.3 184,102.7 128,102.7
           C 72,102.7 36,92.3 32,71.5 Z"
        fill="url(#burlapPat)" opacity="0.32"/>

  <!-- 3. 3D 软垫饱满拱起顶面 -->
  <path d="M 128,19.5
           C 195,19.5 228,29.9 228,49.9
           C 228,69.7 195,81.1 128,81.1
           C 61,81.1 28,69.7 28,49.9
           C 28,29.9 61,19.5 128,19.5 Z"
        fill="url(#burlapPat)"/>
  <path d="M 128,19.5
           C 195,19.5 228,29.9 228,49.9
           C 228,69.7 195,81.1 128,81.1
           C 61,81.1 28,69.7 28,49.9
           C 28,29.9 61,19.5 128,19.5 Z"
        fill="url(#burlapTopShade)"
        stroke="${rimStroke}" stroke-width="2.6"/>

  <!-- 4. 表面镶嵌纹饰 -->
  ${surfaceInlay}

  <!-- 5. 瓶底接触 AO 阴影 -->
  <ellipse cx="128" cy="48" rx="80" ry="18.5" fill="url(#contactAO)"/>
</svg>
`;
}

// ========================================================
// 2. 原图级超椭圆鹅卵石 SVG 按钮模板 (Squircle Pebble Glass Buttons)
// ========================================================
function createSquircleButtonSVG(iconSvg, baseGradId = 'warmGlassBase') {
  return `
<svg width="256" height="256" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 按钮外发光与柔和立体阴影 -->
    <filter id="btnDropShadow" x="-20%" y="-15%" width="140%" height="145%">
      <feDropShadow dx="0" dy="6" stdDeviation="5.5" flood-color="rgba(80, 52, 14, 0.42)"/>
      <feDropShadow dx="0" dy="1.5" stdDeviation="2.0" flood-color="rgba(255, 235, 185, 0.35)"/>
    </filter>

    <filter id="iconShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="2.2" stdDeviation="2.0" flood-color="rgba(70, 42, 10, 0.52)"/>
    </filter>

    <filter id="bulbGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="5.0" flood-color="rgba(255, 235, 90, 0.95)"/>
      <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" flood-color="rgba(120, 65, 8, 0.45)"/>
    </filter>

    <!-- 暖果冻磨砂玻璃渐变 -->
    <linearGradient id="warmGlassBase" x1="15%" y1="5%" x2="85%" y2="95%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.72)"/>
      <stop offset="28%" stop-color="rgba(255, 246, 218, 0.48)"/>
      <stop offset="68%" stop-color="rgba(226, 172, 88, 0.38)"/>
      <stop offset="100%" stop-color="rgba(175, 118, 48, 0.52)"/>
    </linearGradient>

    <!-- 规则磨砂玻璃渐变 (浅绿松/淡鼠尾草) -->
    <linearGradient id="rulesGlassBase" x1="15%" y1="5%" x2="85%" y2="95%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.70)"/>
      <stop offset="30%" stop-color="rgba(235, 250, 240, 0.42)"/>
      <stop offset="70%" stop-color="rgba(145, 190, 168, 0.36)"/>
      <stop offset="100%" stop-color="rgba(95, 145, 122, 0.48)"/>
    </linearGradient>

    <!-- 顶部新月斜向弧形高光 -->
    <linearGradient id="topCrescentSheen" x1="30%" y1="0%" x2="65%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.90)"/>
      <stop offset="55%" stop-color="rgba(255, 255, 255, 0.38)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>

    <!-- 底部内敛暖阴影 -->
    <radialGradient id="innerBottomShade" cx="52%" cy="68%" r="48%">
      <stop offset="55%" stop-color="rgba(115, 68, 16, 0.0)"/>
      <stop offset="100%" stop-color="rgba(98, 52, 10, 0.35)"/>
    </radialGradient>

    <!-- 纯白双层琉璃轮廓描边 -->
    <linearGradient id="glassRimStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.98)"/>
      <stop offset="35%" stop-color="rgba(255, 255, 255, 0.55)"/>
      <stop offset="75%" stop-color="rgba(255, 242, 210, 0.78)"/>
      <stop offset="100%" stop-color="rgba(220, 165, 78, 0.65)"/>
    </linearGradient>

    <radialGradient id="bulb3DGrad" cx="36%" cy="32%" r="64%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="32%" stop-color="#fffb99"/>
      <stop offset="75%" stop-color="#f5b800"/>
      <stop offset="100%" stop-color="#c97e00"/>
    </radialGradient>
  </defs>

  <!-- 1. 按钮主体超椭圆鹅卵石 -->
  <g filter="url(#btnDropShadow)">
    <path d="M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z" fill="url(#${baseGradId})"/>
    <path d="M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z" fill="url(#innerBottomShade)"/>
    <!-- 新月斜向弧光带 -->
    <path d="M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z" fill="url(#topCrescentSheen)"/>
    <path d="M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.65"/>
    <path d="M 20,86 C 30,90.5 68,90.5 80,85" stroke="#fff3d6" stroke-width="1.8" stroke-linecap="round" opacity="0.5"/>
    <!-- 高精度外轮廓描边 -->
    <path d="M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z" stroke="url(#glassRimStroke)" stroke-width="2.5"/>
  </g>

  <!-- 2. 图标层 -->
  <g filter="url(#iconShadow)">
    ${iconSvg}
  </g>
</svg>
`;
}

// ========================================================
// 各按钮图标 SVG 代码
// ========================================================
// 重玩 (Restart)
const iconRestart = `
  <path d="M 41,34.5 A 18.5,18.5 0 1 1 32.5,56.5" stroke="#ffffff" stroke-width="7.2" stroke-linecap="round" fill="none"/>
  <path d="M 47.5,24.5 L 46.5,43.5 C 46.4,45.2 44.5,46.0 43.1,45.0 L 30.8,35.8 C 29.4,34.8 29.8,32.6 31.4,32.0 L 44.8,23.2 C 46.2,22.4 47.6,23.2 47.5,24.5 Z" fill="#ffffff"/>
`;

// 洗牌 (Shuffle)
const iconShuffle = `
  <path d="M 24,64 H 33 C 41,64 46,59 51,48 C 56,37 61,33 69,33 H 76" stroke="#ffffff" stroke-width="6.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 67,24 L 78,33 L 67,42" stroke="#ffffff" stroke-width="6.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 24,33 H 33 C 38,33 42,35.5 45.5,41" stroke="#ffffff" stroke-width="6.8" stroke-linecap="round"/>
  <path d="M 56.5,56.5 C 60,61.5 64,64 69,64 H 76" stroke="#ffffff" stroke-width="6.8" stroke-linecap="round"/>
  <path d="M 67,55 L 78,64 L 67,73" stroke="#ffffff" stroke-width="6.8" stroke-linecap="round" stroke-linejoin="round"/>
`;

// 撤回 (Undo)
const iconUndo = `
  <path d="M 44,31 L 25.5,48.5 C 24.0,50.0 24.3,52.4 26.2,53.3 L 45.5,61.5 C 47.4,62.3 49.3,60.6 48.8,58.6 L 47.0,52.2 C 58.2,51.0 66.8,54.8 72.5,62.2 C 73.5,63.5 75.5,62.5 75.2,60.8 C 72.8,44.2 61.2,36.8 46.8,38.2 L 48.0,32.8 C 48.4,30.8 45.6,29.5 44,31 Z" fill="#ffffff"/>
`;

// 提示 (Hint / Light Bulb)
const iconHintBulb = `
  <g stroke="#ffe866" stroke-width="2.2" stroke-linecap="round" opacity="0.92">
    <line x1="50" y1="13" x2="50" y2="20"/>
    <line x1="33" y1="17.5" x2="36.8" y2="23.5"/>
    <line x1="67" y1="17.5" x2="63.2" y2="23.5"/>
    <line x1="21" y1="29" x2="27" y2="32.5"/>
    <line x1="79" y1="29" x2="73" y2="32.5"/>
    <line x1="17" y1="44.5" x2="24" y2="44.5"/>
    <line x1="83" y1="44.5" x2="76" y2="44.5"/>
    <line x1="22" y1="59.5" x2="28" y2="56"/>
    <line x1="78" y1="59.5" x2="72" y2="56"/>
  </g>
  <g filter="url(#bulbGlow)">
    <path d="M 50,24 C 38.2,24 29,33.0 29,44.2 C 29,51.4 33.0,57.6 38.8,61.2 C 40.8,62.5 42.0,64.6 42.2,67.0 L 57.8,67.0 C 58.0,64.6 59.2,62.5 61.2,61.2 C 67.0,57.6 71,51.4 71,44.2 C 71,33.0 61.8,24 50,24 Z" fill="url(#bulb3DGrad)"/>
    <ellipse cx="42" cy="36" rx="6.5" ry="4.2" transform="rotate(-28 42 36)" fill="#ffffff" opacity="0.55"/>
  </g>
  <rect x="42.2" y="67.2" width="15.6" height="4.8" rx="2.2" fill="#6f7b88"/>
  <rect x="43.4" y="72.0" width="13.2" height="4.5" rx="2.0" fill="#596573"/>
  <path d="M 45.5,76.5 C 46.2,79.8 47.8,81.5 50,81.5 C 52.2,81.5 53.8,79.8 54.5,76.5 Z" fill="#424c58"/>
`;

// 设置 (Settings - 齿轮 / 三横条)
const iconSettings = `
  <rect x="30" y="31" width="40" height="7.6" rx="3.8" fill="#ffffff"/>
  <rect x="30" y="46.2" width="40" height="7.6" rx="3.8" fill="#ffffff"/>
  <rect x="30" y="61.4" width="40" height="7.6" rx="3.8" fill="#ffffff"/>
`;

// 加瓶 (+ 空瓶)
const iconAddBottle = `
  <path d="M 50,25 L 50,75 M 25,50 L 75,50" stroke="#ffffff" stroke-width="8.5" stroke-linecap="round"/>
`;

async function bake() {
  console.log('[Bake] 开始烘焙 v5 原版高定资产...');

  // 1. 烘焙 3 款麻布软垫底座
  await sharp(Buffer.from(createBurlapSVG('normal'))).png().toFile(path.join(outDir, 'burlap_coaster_normal.png'));
  await sharp(Buffer.from(createBurlapSVG('special'))).png().toFile(path.join(outDir, 'burlap_coaster_special.png'));
  await sharp(Buffer.from(createBurlapSVG('star'))).png().toFile(path.join(outDir, 'burlap_coaster_star.png'));
  // 同步替换 mech_pedestal.png，保证向下兼容
  await sharp(Buffer.from(createBurlapSVG('normal'))).png().toFile(path.join(outDir, 'mech_pedestal.png'));
  console.log('✓ 麻布软垫底座系列烘焙成功 (burlap_coaster_*.png & mech_pedestal.png)');

  // 2. 烘焙鹅卵石超椭圆按钮
  await sharp(Buffer.from(createSquircleButtonSVG(iconRestart))).png().toFile(path.join(outDir, 'btn_level.png')); // 复用为重玩
  await sharp(Buffer.from(createSquircleButtonSVG(iconShuffle))).png().toFile(path.join(outDir, 'btn_shuffle.png'));
  await sharp(Buffer.from(createSquircleButtonSVG(iconUndo))).png().toFile(path.join(outDir, 'btn_undo.png'));
  await sharp(Buffer.from(createSquircleButtonSVG(iconHintBulb))).png().toFile(path.join(outDir, 'btn_power.png')); // 提示/灯泡
  await sharp(Buffer.from(createSquircleButtonSVG(iconSettings, 'rulesGlassBase'))).png().toFile(path.join(outDir, 'btn_settings.png'));
  await sharp(Buffer.from(createSquircleButtonSVG(iconAddBottle))).png().toFile(path.join(outDir, 'btn_add_bottle.png'));
  console.log('✓ 鹅卵石超椭圆 SVG 按钮系列烘焙成功 (btn_*.png)');

  console.log('[Bake] 全部资产烘焙完毕！');
}

bake().catch(console.error);
