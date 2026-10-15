const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = 'E:/GithubProjects/water-game-cocos/assets/textures';

// 1. level_pill.png (4x: 480x152, viewBox: 0 0 120 38)
const levelPillSVG = `
<svg width="480" height="152" viewBox="0 0 120 38" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 外发光阴影 -->
    <filter id="pillGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#030a1c" flood-opacity="0.55"/>
    </filter>
    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="50%" stop-color="#94c5ff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.32"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#bfdbfe" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="innerTopLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- 琉璃胶囊底座 -->
  <rect x="4" y="3" width="112" height="32" rx="16" fill="url(#pillGrad)" stroke="url(#borderGrad)" stroke-width="1.8" filter="url(#pillGlow)" />
  <!-- 顶部内高光弧线 -->
  <path d="M 20,4.5 L 100,4.5" stroke="rgba(255,255,255,0.9)" stroke-width="1.4" stroke-linecap="round" />
  <ellipse cx="60" cy="5" rx="46" ry="2.2" fill="url(#innerTopLight)" />
</svg>
`;

// 2. badge_red_1.png (4x: 104x96, viewBox: 0 0 26 24)
const badgeRed1SVG = `
<svg width="104" height="96" viewBox="0 0 26 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
  </defs>

  <rect x="2" y="1" width="22" height="20" rx="10" fill="url(#redGrad)" stroke="#ffffff" stroke-width="1.8" filter="url(#badgeShadow)" />
  <!-- 顶部微光高光 -->
  <path d="M 7,3 C 11,2 15,2 19,3" stroke="rgba(255,255,255,0.85)" stroke-width="1.1" stroke-linecap="round" fill="none"/>
  <!-- 居中加粗数字 1 -->
  <text x="13" y="15.2" text-anchor="middle" fill="#ffffff" font-size="11.5" font-weight="900" font-family="PingFang SC, Arial Rounded MT Bold, sans-serif">1</text>
</svg>
`;

// 3. badge_video.png (4x: 112x96, viewBox: 0 0 28 24)
const badgeVideoSVG = `
<svg width="112" height="96" viewBox="0 0 28 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="videoBadgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="48%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
  </defs>

  <rect x="2" y="1" width="24" height="20" rx="10" fill="url(#purpleGrad)" stroke="#ffffff" stroke-width="1.8" filter="url(#videoBadgeShadow)" />
  <!-- 顶部微光高光 -->
  <path d="M 7,3 C 12,2 16,2 21,3" stroke="rgba(255,255,255,0.85)" stroke-width="1.1" stroke-linecap="round" fill="none"/>
  <!-- 居中精美电影场记板/视频摄像图标 -->
  <g transform="translate(7.2, 5.2)">
    <!-- 场记板主体 -->
    <rect x="0" y="3.5" width="13.5" height="9.5" rx="1.8" fill="#581c87" stroke="#e9d5ff" stroke-width="0.8"/>
    <!-- 场记板顶栏条纹 -->
    <rect x="0" y="0" width="13.5" height="3.2" rx="1" fill="#3b0764"/>
    <polygon points="2,0 4.2,0 2.8,3.2 0.6,3.2" fill="#ffffff"/>
    <polygon points="6,0 8.2,0 6.8,3.2 4.6,3.2" fill="#ffffff"/>
    <polygon points="10,0 12.2,0 10.8,3.2 8.6,3.2" fill="#ffffff"/>
    <!-- 绿色播放角标 -->
    <polygon points="4.8,5.8 4.8,10.6 9.4,8.2" fill="#a3e635"/>
  </g>
</svg>
`;

async function main() {
  console.log('Baking UI badges into:', outDir);
  await sharp(Buffer.from(levelPillSVG)).png().toFile(path.join(outDir, 'level_pill.png'));
  console.log('✓ Baked level_pill.png');

  await sharp(Buffer.from(badgeRed1SVG)).png().toFile(path.join(outDir, 'badge_red_1.png'));
  console.log('✓ Baked badge_red_1.png');

  await sharp(Buffer.from(badgeVideoSVG)).png().toFile(path.join(outDir, 'badge_video.png'));
  console.log('✓ Baked badge_video.png');
}

main().catch(console.error);
