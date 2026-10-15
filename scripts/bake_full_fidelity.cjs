const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.resolve('E:/GithubProjects/water-game-cocos/assets/textures');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. 备用瓶专属玻璃外壳 tube_glass_ad.png (312x808)
// 包含梦幻粉紫霓虹轮廓 (#d884ff) + 底部紫光漩涡 + 左右紫发光柱 + 四周闪烁十字星芒
const tubeGlassAdSVG = `
<svg width="312" height="808" viewBox="0 0 100 216" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="purpleVortex" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(216, 180, 254, 0.75)"/>
      <stop offset="55%" stop-color="rgba(168, 85, 247, 0.35)"/>
      <stop offset="100%" stop-color="rgba(107, 33, 168, 0.0)"/>
    </radialGradient>
    <radialGradient id="purpleSideGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(232, 121, 249, 0.65)"/>
      <stop offset="100%" stop-color="rgba(168, 85, 247, 0.0)"/>
    </radialGradient>
    <linearGradient id="glassAdBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(88, 28, 135, 0.18)"/>
      <stop offset="50%" stop-color="rgba(22, 10, 48, 0.30)"/>
      <stop offset="100%" stop-color="rgba(107, 33, 168, 0.25)"/>
    </linearGradient>
  </defs>

  <!-- 1. 底部紫色光斑漩涡与虚线光环 -->
  <ellipse cx="50" cy="197" rx="44" ry="11" fill="url(#purpleVortex)" />
  <ellipse cx="50" cy="197" rx="38" ry="8.5" fill="none" stroke="#e879f9" stroke-width="1.6" stroke-dasharray="14 6" opacity="0.9"/>
  <ellipse cx="50" cy="197" rx="28" ry="5.8" fill="none" stroke="#f0abfc" stroke-width="1.3" stroke-dasharray="10 5" opacity="0.95"/>

  <!-- 2. 两侧发光紫色辉光 -->
  <ellipse cx="11" cy="115" rx="5" ry="55" fill="url(#purpleSideGlow)" />
  <ellipse cx="89" cy="115" rx="5" ry="55" fill="url(#purpleSideGlow)" />

  <!-- 3. 十字星芒闪烁微粒 -->
  <path d="M 6,88 L 8,81 L 10,88 L 17,90 L 10,92 L 8,99 L 6,92 L -1,90 Z" fill="#ffffff" stroke="#f0abfc" stroke-width="0.6"/>
  <path d="M 90,76 L 92,69 L 94,76 L 101,78 L 94,80 L 92,87 L 90,80 L 83,78 Z" fill="#ffffff" stroke="#f0abfc" stroke-width="0.6"/>
  <path d="M 12,154 L 13.5,149 L 15,154 L 20,155.5 L 15,157 L 13.5,162 L 12,157 L 7,155.5 Z" fill="#f5d0fe" opacity="0.9"/>
  <path d="M 88,140 L 89,136 L 90,140 L 94,141 L 90,142 L 89,146 L 88,142 L 84,141 Z" fill="#f5d0fe" opacity="0.85"/>

  <!-- 4. 玻璃瓶身微光内腔 -->
  <path d="M 35.0,21 L 65.0,21 C 79.8,29.3 86.2,38.5 86.2,55.0 L 86.2,193 A 36.2,9.6 0 0,1 13.8,193 L 13.8,55.0 C 13.8,38.5 20.2,29.3 35.0,21 Z" fill="url(#glassAdBody)" />
  <ellipse cx="50" cy="192.5" rx="33.8" ry="8.5" fill="#18072b" stroke="#7e22ce" stroke-width="1.6" />

  <!-- 5. 瓶底紫色水晶底座 -->
  <path d="M 13.8,192.5 A 36.2,9.4 0 0,0 86.2,192.5 L 85.6,197.4 A 35.6,10.2 0 0,1 14.4,197.4 Z" fill="#4c1d95" opacity="0.85"/>
  <path d="M 15.0,196.4 A 35.0,9.8 0 0,0 85.0,196.4" fill="none" stroke="#c084fc" stroke-width="1.6" stroke-linecap="round" />

  <!-- 6. 梦幻粉紫色霓虹瓶身外轮廓 (stroke: #d884ff) -->
  <path d="M 30.0,11.5 C 27.6,15.2 28.8,20.2 34.8,23.2 C 35.8,24.5 35.8,25.8 34.6,26.8 C 20.2,31.0 13.8,40.5 13.8,55.0 L 13.8,193 A 36.2,9.6 0 0,0 86.2,193 L 86.2,55.0 C 86.2,40.5 79.8,31.0 65.4,26.8 C 64.2,25.8 64.2,24.5 65.2,23.2 C 71.2,20.2 72.4,15.2 70.0,11.5"
        fill="none" stroke="#d884ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />

  <!-- 7. 紫晶瓶口 -->
  <path d="M 28.5,11.0 C 26.8,15.2 28.0,20.5 33.8,23.2 A 17.2,4.2 0 0,0 66.2,23.2 C 72.0,20.5 73.2,15.2 71.5,11.0 A 21.5,4.4 0 0,1 28.5,11.0 Z"
        fill="#581c87" opacity="0.75" stroke="#c084fc" stroke-width="1.1" />
  <ellipse cx="50" cy="11.0" rx="21.2" ry="4.3" fill="#7e22ce" opacity="0.85" stroke="#f0abfc" stroke-width="1.1" />
  <ellipse cx="50" cy="10.8" rx="11.6" ry="2.3" fill="#2e1065" stroke="#c084fc" stroke-width="1.0" />
</svg>
`;

// 2. 极地霜晶多面体切面底座 ice_base.png (240x160)
// 100% 还原图2左2瓶身底部的立体冰山切面！
const iceBaseSVG = `
<svg width="240" height="160" viewBox="0 140 100 70" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iceFacetLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="iceFacetMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe"/><stop offset="55%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="iceFacetRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>

  <!-- 顶部犬牙交错受光冰刃面 -->
  <polygon points="4,155 16,147 30,156 50,152 70,156 84,147 96,155 88,166 12,166"
           fill="#bae6fd" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>

  <!-- 左侧立体切面 -->
  <polygon points="4,155 26,164 28,199 8,192"
           fill="url(#iceFacetLeftGrad)" stroke="#bae6fd" stroke-width="1.3" stroke-linejoin="round"/>

  <!-- 中间高亮切面 (正面受光) -->
  <polygon points="26,164 52,165 50,203 28,199"
           fill="url(#iceFacetMidGrad)" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>

  <!-- 右侧中调切面 -->
  <polygon points="52,165 76,163 73,202 50,203"
           fill="url(#iceFacetRightGrad)" stroke="#bae6fd" stroke-width="1.3" stroke-linejoin="round"/>

  <!-- 最右深色阴影切面 -->
  <polygon points="76,163 96,155 92,193 73,202"
           fill="#0c4a6e" stroke="#38bdf8" stroke-width="1.3" stroke-linejoin="round"/>

  <!-- 内部冰裂纹理 -->
  <polyline points="20,154 24,166 21,176" fill="none" stroke="#0369a1" stroke-width="1.6" stroke-linecap="round"/>
  <polyline points="56,155 52,168 55,180" fill="none" stroke="#0369a1" stroke-width="1.8" stroke-linecap="round"/>
  <polyline points="78,153 74,164" fill="none" stroke="#0369a1" stroke-width="1.5" stroke-linecap="round"/>

  <!-- 顶部晶亮白棱线 -->
  <polyline points="12,162 26,164 52,165 76,163 90,158" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
</svg>
`;

// 3. 立体折叠牛皮纸盒底座 paper_bag.png (240x160)
// 100% 还原图2右上排最右侧瓶身底座！
const paperBagSVG = `
<svg width="240" height="160" viewBox="0 145 100 65" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="kraftFront" x1="0%" y1="0%" x2="100%" y2="10%">
      <stop offset="0%" stop-color="#e3ae78"/><stop offset="50%" stop-color="#d4985e"/><stop offset="100%" stop-color="#a6682e"/>
    </linearGradient>
    <linearGradient id="kraftSide" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8c5825"/><stop offset="100%" stop-color="#542e0e"/>
    </linearGradient>
  </defs>

  <!-- 投影 -->
  <ellipse cx="50" cy="204" rx="42" ry="5.5" fill="rgba(5, 10, 26, 0.55)" />

  <!-- 纸盒主面板 -->
  <polygon points="10,165 78,168 76,202 8,198"
           fill="url(#kraftFront)" stroke="#78350f" stroke-width="1.3" stroke-linejoin="round"/>

  <!-- 纸盒右侧立体折角 Gusset -->
  <polygon points="78,168 88,162 90,195 76,202"
           fill="url(#kraftSide)" stroke="#451a03" stroke-width="1.2" stroke-linejoin="round"/>

  <!-- 折角阴影与高光折痕 -->
  <line x1="10" y1="166" x2="78" y2="169" stroke="#fff1e0" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="8" y1="190" x2="76" y2="194" stroke="rgba(92, 48, 12, 0.42)" stroke-width="1.2" />
</svg>
`;

// 4. 盲盒问号药丸胶囊 mystery_badge.png (128x128)
// 100% 还原图2瓶身中央浮现的纯白 "?" 黑曜石金边胶囊！
const mysteryBadgeSVG = `
<svg width="128" height="128" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(253, 224, 71, 0.75)"/>
      <stop offset="65%" stop-color="rgba(234, 179, 8, 0.25)"/>
      <stop offset="100%" stop-color="rgba(234, 179, 8, 0.0)"/>
    </radialGradient>
  </defs>

  <!-- 金色星光背景光斑 -->
  <circle cx="32" cy="32" r="28" fill="url(#goldGlow)" />
  <!-- 四周金芒星光微粒 -->
  <circle cx="10" cy="18" r="1.8" fill="#fde047"/>
  <circle cx="54" cy="16" r="2.0" fill="#ffffff"/>
  <circle cx="12" cy="46" r="1.6" fill="#fde047"/>
  <circle cx="52" cy="48" r="1.8" fill="#ffffff"/>

  <!-- 纯黑深邃药丸底座 + 金色边框 -->
  <rect x="18" y="14" width="28" height="36" rx="14" fill="#080e1e" stroke="#facc15" stroke-width="2.2" />
  <!-- 内部粗体白色问号 ? -->
  <text x="32" y="39" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="900" font-family="'Arial Rounded MT Bold', sans-serif">?</text>
</svg>
`;

// 5. 瓶底层数胶囊 cap_badge_2.png, cap_badge_4.png, cap_badge_6.png (128x64)
const makeCapBadgeSVG = (text) => `
<svg width="128" height="64" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="5" width="48" height="22" rx="11" fill="rgba(8, 22, 64, 0.88)" stroke="#7ec0ff" stroke-width="1.6" />
  <text x="32" y="20.5" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="900" font-family="'Arial Rounded MT Bold', sans-serif">${text}</text>
</svg>
`;

async function main() {
  console.log('Baking 100% full-fidelity assets into:', outDir);

  await sharp(Buffer.from(tubeGlassAdSVG)).png().toFile(path.join(outDir, 'tube_glass_ad.png'));
  console.log('✓ tube_glass_ad.png baked (Dreamy Violet Neon Tube).');

  await sharp(Buffer.from(iceBaseSVG)).png().toFile(path.join(outDir, 'ice_base.png'));
  console.log('✓ ice_base.png baked (3D Ice Crystal Pedestal).');

  await sharp(Buffer.from(paperBagSVG)).png().toFile(path.join(outDir, 'paper_bag.png'));
  console.log('✓ paper_bag.png baked (Kraft Box Pedestal).');

  await sharp(Buffer.from(mysteryBadgeSVG)).png().toFile(path.join(outDir, 'mystery_badge.png'));
  console.log('✓ mystery_badge.png baked (Obsidian Question Mark Capsule).');

  await sharp(Buffer.from(makeCapBadgeSVG('2层'))).png().toFile(path.join(outDir, 'cap_badge_2.png'));
  await sharp(Buffer.from(makeCapBadgeSVG('4层'))).png().toFile(path.join(outDir, 'cap_badge_4.png'));
  await sharp(Buffer.from(makeCapBadgeSVG('6层'))).png().toFile(path.join(outDir, 'cap_badge_6.png'));
  console.log('✓ Capacity badges baked (2层, 4层, 6层).');

  console.log('All full-fidelity assets successfully baked!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
