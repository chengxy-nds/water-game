const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';

// 1. glass_modal_bg.png (4x: 1280x1680, viewBox: 0 0 320 420)
// 高奢磨砂琉璃卡片，带顶部半月弧形高光条与白金微弱双层描边
const glassModalBgSVG = `
<svg width="1280" height="1680" viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="modalCardGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#020617" flood-opacity="0.65"/>
    </filter>
    <!-- 卡片主体琉璃暗蓝微透渐变 -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.88"/>
      <stop offset="30%" stop-color="#172554" stop-opacity="0.94"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.96"/>
    </linearGradient>
    <!-- 极细白银流光边框 -->
    <linearGradient id="cardBorder" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="25%" stop-color="#bae6fd" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.4"/>
    </linearGradient>
    <!-- 顶部半月形内高光 -->
    <linearGradient id="topCrescentHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- 卡片主体外框 -->
  <rect x="8" y="8" width="304" height="404" rx="34" fill="url(#cardGrad)" stroke="url(#cardBorder)" stroke-width="2.5" filter="url(#modalCardGlow)"/>

  <!-- 顶部果冻反光天顶盖 (对标 HTML .glass-jelly-card::before) -->
  <path d="M 38,12 L 282,12 C 298,12 304,22 304,36 C 260,54 60,54 16,36 C 16,22 22,12 38,12 Z" fill="url(#topCrescentHighlight)" />
</svg>
`;

// 2. btn_pill_primary.png (4x: 1040x224, viewBox: 0 0 260 56)
// 青蓝渐变果冻胶囊大按钮 (对标 HTML .jelly-primary-pill-btn)
const btnPillPrimarySVG = `
<svg width="1040" height="224" viewBox="0 0 260 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="btnGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0284c7" flood-opacity="0.55"/>
    </filter>
    <linearGradient id="pillBtnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="42%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="pillTopSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- 按钮胶囊底座 -->
  <rect x="4" y="3" width="252" height="50" rx="25" fill="url(#pillBtnGrad)" stroke="#ffffff" stroke-width="2.2" filter="url(#btnGlow)" />
  <!-- 顶部圆润流光高光 -->
  <path d="M 28,5.5 L 232,5.5" stroke="rgba(255,255,255,0.95)" stroke-width="2" stroke-linecap="round" />
  <ellipse cx="130" cy="7" rx="100" ry="3.5" fill="url(#pillTopSheen)" />
</svg>
`;

// 3. mech_pedestal.png (4x: 512x704, viewBox: 0 0 128 176)
// 中间微缩展示台 (对标 HTML .mech-preview-pedestal)
const mechPedestalSVG = `
<svg width="512" height="704" viewBox="0 0 128 176" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pedestalGrad" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#0f172a" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.9"/>
    </radialGradient>
  </defs>
  <rect x="4" y="4" width="120" height="168" rx="28" fill="url(#pedestalGrad)" stroke="rgba(255,255,255,0.75)" stroke-width="2"/>
  <!-- 顶部微光弧 -->
  <ellipse cx="64" cy="7" rx="46" ry="2.2" fill="rgba(255,255,255,0.7)"/>
</svg>
`;

// 4. badge_gold_new.png (4x: 560x128, viewBox: 0 0 140 32)
// 金黄新典藏胶囊 (对标 HTML .new-mech-badge)
const badgeGoldNewSVG = `
<svg width="560" height="128" viewBox="0 0 140 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldBadgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="136" height="28" rx="14" fill="url(#goldBadgeGrad)" stroke="#ffffff" stroke-width="1.8" />
  <path d="M 18,3.5 L 122,3.5" stroke="rgba(255,255,255,0.85)" stroke-width="1.2" stroke-linecap="round" />
</svg>
`;

async function main() {
  const assets = [
    { name: 'glass_modal_bg.png', svg: glassModalBgSVG },
    { name: 'btn_pill_primary.png', svg: btnPillPrimarySVG },
    { name: 'mech_pedestal.png', svg: mechPedestalSVG },
    { name: 'badge_gold_new.png', svg: badgeGoldNewSVG }
  ];

  for (const item of assets) {
    const pngPath = path.join(outDir, item.name);
    await sharp(Buffer.from(item.svg)).png().toFile(pngPath);
    console.log(`✓ Baked ${item.name}`);

    const metaPath = pngPath + '.meta';
    if (!fs.existsSync(metaPath)) {
      const uuid = crypto.randomUUID();
      const meta = {
        ver: '1.0.27',
        importer: 'image',
        imported: true,
        uuid: uuid,
        files: ['.json', '.png'],
        subMetas: {
          '6c48a': {
            importer: 'texture',
            uuid: uuid + '@6c48a',
            displayName: item.name.replace('.png', ''),
            id: '6c48a',
            name: 'texture',
            userData: { wrapModeS: 'clamp-to-edge', wrapModeT: 'clamp-to-edge', imageUuidOrDatabaseUri: uuid, isUuid: true, visible: false },
            ver: '1.0.22', imported: true, files: ['.json'], subMetas: {}
          },
          'f9941': {
            importer: 'sprite-frame',
            uuid: uuid + '@f9941',
            displayName: item.name.replace('.png', ''),
            id: 'f9941',
            name: 'spriteFrame',
            userData: { trimThreshold: 1, rotated: false, packable: true, pixelsToUnit: 100, pivotX: 0.5, pivotY: 0.5, meshType: 0 },
            ver: '1.0.17', imported: true, files: ['.json'], subMetas: {}
          }
        }
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
      console.log(`  Created meta for ${item.name}: ${uuid}`);
    }
  }
}

main().catch(console.error);
