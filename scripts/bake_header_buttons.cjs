const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.resolve('E:/GithubProjects/water-game-cocos/assets/textures');

// 1. 设置按钮 btn_settings.png (圆形深蓝玻璃镜面，带精美齿轮)
const settingsSVG = `
<svg width="128" height="128" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="circleGlass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="28%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="sheenTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.85)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>

  <circle cx="32" cy="34" r="26" fill="#021c38" />
  <circle cx="32" cy="32" r="26" fill="url(#circleGlass)" stroke="#bae6fd" stroke-width="1.8"/>
  <ellipse cx="32" cy="20" rx="18" ry="10" fill="url(#sheenTop)" />

  <!-- 白色齿轮 ⚙️ -->
  <g transform="translate(32, 32)" fill="#ffffff">
    <circle cx="0" cy="0" r="10" />
    <path d="M -3,-14 L 3,-14 L 4,-10 L -4,-10 Z" />
    <path d="M -3,14 L 3,14 L 4,10 L -4,10 Z" />
    <path d="M -14,-3 L -14,3 L -10,4 L -10,-4 Z" />
    <path d="M 14,-3 L 14,3 L 10,4 L 10,-4 Z" />
    <path d="M -10,-10 L -6,-12 L -4,-8 L -8,-6 Z" />
    <path d="M 10,10 L 6,12 L 4,8 L 8,6 Z" />
    <path d="M 10,-10 L 12,-6 L 8,-4 L 6,-8 Z" />
    <path d="M -10,10 L -12,6 L -8,4 L -6,8 Z" />
    <circle cx="0" cy="0" r="4.5" fill="#0284c7" />
  </g>
</svg>
`;

// 2. 闪电按钮 btn_power.png (圆形深蓝玻璃镜面，带发光闪电)
const powerSVG = `
<svg width="128" height="128" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="circleGlass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="28%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="sheenTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.85)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>

  <circle cx="32" cy="34" r="26" fill="#021c38" />
  <circle cx="32" cy="32" r="26" fill="url(#circleGlass)" stroke="#bae6fd" stroke-width="1.8"/>
  <ellipse cx="32" cy="20" rx="18" ry="10" fill="url(#sheenTop)" />

  <!-- 亮黄发光闪电 ⚡ -->
  <polygon points="34,14 20,33 30,33 28,50 44,28 32,28" fill="#fde047" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
</svg>
`;

async function main() {
  await sharp(Buffer.from(settingsSVG)).png().toFile(path.join(outDir, 'btn_settings.png'));
  await sharp(Buffer.from(powerSVG)).png().toFile(path.join(outDir, 'btn_power.png'));
  console.log('✓ Baked btn_settings.png and btn_power.png');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
