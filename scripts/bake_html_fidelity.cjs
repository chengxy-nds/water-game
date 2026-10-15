const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';

// 1. 星级礼袍 silk_drape.png (4x: 392x808, viewBox: 0 0 98 202)
const silkDrapeSVG = `
<svg width="392" height="808" viewBox="0 0 98 202" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="silkDrapeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#bfdbfe"/>
      <stop offset="28%" stop-color="#ffffff"/>
      <stop offset="62%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#7dd3fc"/>
    </linearGradient>
  </defs>

  <!-- 礼袍外披主体 -->
  <path d="M 29,10
           C 29,6 69,6 69,10
           L 72,26
           C 85,35 89,48 91,74
           L 95,168
           C 95,175 87,178 81,173
           C 74,184 55,186 45,178
           C 35,171 23,179 13,176
           C 5,174 2,168 3,160
           L 7,74
           C 9,48 13,35 26,26 Z"
        fill="url(#silkDrapeGrad)" stroke="#e0f2fe" stroke-width="1.3" />

  <!-- 领口立体滚边 -->
  <ellipse cx="49" cy="10" rx="20" ry="4.2" fill="#dbeafe" stroke="#ffffff" stroke-width="1.1" />

  <!-- 丝绸褶皱暗部受光面 -->
  <path d="M 25,26 C 19,70 15,125 13,175 L 24,175 C 26,125 29,70 33,26 Z" fill="rgba(125, 172, 222, 0.36)" />
  <path d="M 63,26 C 69,72 74,126 77,177 L 89,174 C 85,124 79,70 71,26 Z" fill="rgba(96, 148, 206, 0.44)" />

  <!-- 丝绸流光高光脊线 -->
  <path d="M 37,22 C 35,75 34,128 33,173" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 57,22 C 61,75 65,128 68,180" fill="none" stroke="rgba(255,255,255,0.76)" stroke-width="2.2" stroke-linecap="round" />

  <!-- 中央水滴视窗，露出高定迷你药水瓶 -->
  <g transform="translate(34, 62)">
    <!-- 视窗白色描边 -->
    <path d="M 10,5 L 20,5 L 20,11 C 27,15 29,21 29,29 L 29,63 A 14,4 0 0,1 1,63 L 1,29 C 1,21 3,15 10,11 Z"
          fill="#ffffff" stroke="#7dd3fc" stroke-width="1.6" stroke-linejoin="round"/>
    <!-- 木塞 -->
    <rect x="11.5" y="1" width="7" height="6" rx="1.5" fill="#d9913b" stroke="#78350f" stroke-width="0.8"/>
    <!-- 内部深邃蓝药水 -->
    <path d="M 10.5,6.5 L 19.5,6.5 L 19.5,11.5 C 25.5,15 27.5,20 27.5,28 L 27.5,61.5 A 12.5,3.5 0 0,1 2.5,61.5 L 2.5,28 C 2.5,20 4.5,15 10.5,11.5 Z"
          fill="#1e3a8a" stroke="#60a5fa" stroke-width="1.2"/>
    <path d="M 3.5,22 L 26.5,22 L 26.5,61 A 11.5,3.2 0 0,1 3.5,61 Z" fill="#2563eb"/>
    <ellipse cx="15" cy="22" rx="11.5" ry="2.8" fill="#60a5fa"/>
    <rect x="21" y="26" width="2.8" height="28" rx="1.4" fill="rgba(255,255,255,0.48)" />
  </g>
</svg>
`;

// 2. 晶莹冰封底座 ice_base.png (4x: 384x240, viewBox: 0 144 96 60)
const iceBaseSVG = `
<svg width="384" height="240" viewBox="0 144 96 60" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iceFacetLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="iceFacetMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd"/>
      <stop offset="55%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="iceFacetRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
  </defs>

  <!-- 顶部晶莹冰台 -->
  <polygon points="4,155 16,147 30,156 50,152 70,156 84,147 96,155 88,166 12,166"
           fill="#bae6fd" stroke="#e0f2fe" stroke-width="1.3" stroke-linejoin="round"/>
  <!-- 左棱面 -->
  <polygon points="4,155 26,164 28,199 8,192"
           fill="url(#iceFacetLeftGrad)" stroke="#bae6fd" stroke-width="1.2" stroke-linejoin="round"/>
  <!-- 中棱面 -->
  <polygon points="26,164 52,165 50,203 28,199"
           fill="url(#iceFacetMidGrad)" stroke="#e0f2fe" stroke-width="1.3" stroke-linejoin="round"/>
  <!-- 右棱面 -->
  <polygon points="52,165 76,163 73,202 50,203"
           fill="url(#iceFacetRightGrad)" stroke="#bae6fd" stroke-width="1.2" stroke-linejoin="round"/>
  <!-- 侧翼切面 -->
  <polygon points="76,163 96,155 92,193 73,202"
           fill="#2589bd" stroke="#7dd3fc" stroke-width="1.2" stroke-linejoin="round"/>

  <!-- 冰裂折射纹 -->
  <polyline points="20,154 24,166 21,176" fill="none" stroke="#0369a1" stroke-width="1.6" stroke-linecap="round"/>
  <polyline points="56,155 52,168 55,180" fill="none" stroke="#0369a1" stroke-width="1.8" stroke-linecap="round"/>
  <polyline points="78,153 74,164" fill="none" stroke="#0369a1" stroke-width="1.5" stroke-linecap="round"/>
  <!-- 纯白冰棱高光脊线 -->
  <polyline points="12,162 26,164 52,165 76,163 90,158" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linecap="round" opacity="0.95"/>
</svg>
`;

async function main() {
  console.log('Baking HTML-fidelity assets into:', outDir);
  await sharp(Buffer.from(silkDrapeSVG)).png().toFile(path.join(outDir, 'silk_drape.png'));
  console.log('✓ Baked silk_drape.png (4x Retina Star Silk Drape).');

  await sharp(Buffer.from(iceBaseSVG)).png().toFile(path.join(outDir, 'ice_base.png'));
  console.log('✓ Baked ice_base.png (4x Retina Crystalline Ice Base).');
}

main().catch(console.error);
