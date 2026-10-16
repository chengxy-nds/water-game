const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 100% 提取自 v7.html 的 3D 粗麻布软垫底座（暖琥珀柔和遮蔽影，杜绝发灰发脏）
function createBurlapSVG(type) {
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

    <linearGradient id="burlapSideWall" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${sideStop0}"/>
      <stop offset="38%" stop-color="${sideStop1}"/>
      <stop offset="78%" stop-color="${sideStop2}"/>
      <stop offset="100%" stop-color="${sideStop3}"/>
    </linearGradient>

    <linearGradient id="burlapTopShade" x1="12%" y1="8%" x2="88%" y2="92%">
      <stop offset="0%" stop-color="#fff8e6" stop-opacity="0.38"/>
      <stop offset="45%" stop-color="#d49e5c" stop-opacity="0.06"/>
      <stop offset="82%" stop-color="#5c3b18" stop-opacity="0.36"/>
      <stop offset="100%" stop-color="#38220c" stop-opacity="0.58"/>
    </linearGradient>

    <radialGradient id="terracottaShadowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(148, 62, 14, 0.62)"/>
      <stop offset="48%" stop-color="rgba(168, 78, 20, 0.36)"/>
      <stop offset="78%" stop-color="rgba(185, 92, 28, 0.12)"/>
      <stop offset="100%" stop-color="rgba(185, 92, 28, 0.0)"/>
    </radialGradient>

    <!-- v7.html 最新升级：瓶底暖琥珀柔和遮蔽影 (避免发灰发脏) -->
    <radialGradient id="contactAO" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(98, 52, 12, 0.42)"/>
      <stop offset="60%" stop-color="rgba(115, 62, 16, 0.18)"/>
      <stop offset="100%" stop-color="rgba(115, 62, 16, 0.0)"/>
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

  <!-- 5. 瓶底接触 AO 阴影 (v7.html 暖琥珀柔和微光) -->
  <ellipse cx="128" cy="48" rx="72" ry="16" fill="url(#contactAO)" opacity="0.75"/>
</svg>
`;
}

async function bake() {
  console.log('[Bake v7] 正在重新烘焙 v7.html 最新升级高定资产...');
  await sharp(Buffer.from(createBurlapSVG('normal'))).png().toFile(path.join(outDir, 'burlap_coaster_normal.png'));
  await sharp(Buffer.from(createBurlapSVG('special'))).png().toFile(path.join(outDir, 'burlap_coaster_special.png'));
  await sharp(Buffer.from(createBurlapSVG('star'))).png().toFile(path.join(outDir, 'burlap_coaster_star.png'));
  await sharp(Buffer.from(createBurlapSVG('normal'))).png().toFile(path.join(outDir, 'mech_pedestal.png'));
  console.log('✓ 麻布软垫底座系列烘焙更新成功 (暖琥珀柔和遮蔽影)');
}

bake().catch(console.error);
