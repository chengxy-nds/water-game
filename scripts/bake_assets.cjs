const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.resolve('E:/GithubProjects/water-game-cocos/assets/textures');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. 玻璃瓶 tube_glass.png (312x808)
const tubeGlassSVG = `
<svg width="312" height="808" viewBox="11 6 78 202" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(70, 118, 205, 0.20)"/>
      <stop offset="16%" stop-color="rgba(22, 36, 78, 0.34)"/>
      <stop offset="55%" stop-color="rgba(15, 25, 60, 0.30)"/>
      <stop offset="82%" stop-color="rgba(82, 118, 182, 0.24)"/>
      <stop offset="100%" stop-color="rgba(26, 56, 124, 0.42)"/>
    </linearGradient>
    <radialGradient id="leftShoulderDomeGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="rgba(215, 235, 255, 0.22)"/>
      <stop offset="58%" stop-color="rgba(170, 205, 250, 0.08)"/>
      <stop offset="100%" stop-color="rgba(150, 185, 245, 0.0)"/>
    </radialGradient>
    <filter id="naturalGlassBlur" x="-15%" y="-10%" width="130%" height="120%">
      <feGaussianBlur stdDeviation="1.05" />
    </filter>
    <linearGradient id="naturalRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#5b9cf5"/>
      <stop offset="18%" stop-color="#5390e8"/>
      <stop offset="55%" stop-color="#386ec2"/>
      <stop offset="88%" stop-color="#4e8be0"/>
      <stop offset="100%" stop-color="#68abff"/>
    </linearGradient>
    <linearGradient id="windowShoulderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.16)"/>
      <stop offset="50%" stop-color="rgba(255, 255, 255, 0.28)"/>
      <stop offset="90%" stop-color="rgba(225, 240, 255, 0.18)"/>
      <stop offset="100%" stop-color="rgba(210, 235, 255, 0.04)"/>
    </linearGradient>
    <linearGradient id="rightPillarSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.22)"/>
      <stop offset="40%" stop-color="rgba(255, 255, 255, 0.15)"/>
      <stop offset="85%" stop-color="rgba(255, 255, 255, 0.06)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
    <linearGradient id="leftWallSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(195, 222, 255, 0.15)"/>
      <stop offset="65%" stop-color="rgba(180, 210, 255, 0.05)"/>
      <stop offset="100%" stop-color="rgba(180, 210, 255, 0.0)"/>
    </linearGradient>
    <linearGradient id="baseCushionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2b6cb3"/>
      <stop offset="22%" stop-color="#0a225e"/>
      <stop offset="50%" stop-color="#051342"/>
      <stop offset="78%" stop-color="#0d2b6e"/>
      <stop offset="92%" stop-color="#4287cf"/>
      <stop offset="100%" stop-color="#1d5296"/>
    </linearGradient>
    <linearGradient id="neckLipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#224999"/>
      <stop offset="14%" stop-color="#6092eb"/>
      <stop offset="30%" stop-color="#0d1e54"/>
      <stop offset="55%" stop-color="#152d75"/>
      <stop offset="73%" stop-color="#b8d8ff"/>
      <stop offset="84%" stop-color="#3c6fd1"/>
      <stop offset="94%" stop-color="#75a7f5"/>
      <stop offset="100%" stop-color="#19357a"/>
    </linearGradient>
    <linearGradient id="neckTopRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2d57ab"/>
      <stop offset="25%" stop-color="#6ca0f0"/>
      <stop offset="58%" stop-color="#1c3b82"/>
      <stop offset="82%" stop-color="#8ab8ff"/>
      <stop offset="100%" stop-color="#244794"/>
    </linearGradient>
    <linearGradient id="mouthBoreGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#050d26"/>
      <stop offset="65%" stop-color="#112759"/>
      <stop offset="100%" stop-color="#3562b8"/>
    </linearGradient>
  </defs>

  <ellipse cx="50" cy="204.5" rx="34" ry="5.5" fill="rgba(2, 6, 20, 0.52)" />
  <path d="M 35.0,21 L 65.0,21 C 79.8,29.3 86.2,38.5 86.2,55.0 L 86.2,193 A 36.2,9.6 0 0,1 13.8,193 L 13.8,55.0 C 13.8,38.5 20.2,29.3 35.0,21 Z" fill="url(#glassBodyGrad)" />
  <ellipse cx="50" cy="192.5" rx="33.8" ry="8.5" fill="#050b2e" stroke="#163e78" stroke-width="1.6" />
  <ellipse cx="50" cy="193.3" rx="30.5" ry="7.0" fill="#07103a" />

  <ellipse cx="32" cy="37.5" rx="15" ry="9.5" fill="url(#leftShoulderDomeGrad)" />
  <rect x="17.5" y="44.5" width="6.5" height="139.5" rx="3.2" fill="url(#leftWallSheen)" />

  <g filter="url(#naturalGlassBlur)">
    <path d="M 55.0,28.5 C 68.5,30.8 77.2,35.5 79.2,42.2 L 64.5,43.0 C 62.8,36.5 58.2,31.8 51.5,30.2 Z" fill="url(#windowShoulderGrad)" />
    <rect x="65.2" y="44.5" width="13.2" height="139.5" rx="2.8" fill="url(#rightPillarSheen)" />
  </g>
  <path d="M 67.5,30.5 C 77.8,34.8 81.8,40.5 82.4,47.5" fill="none" stroke="rgba(225, 242, 255, 0.52)" stroke-width="1.5" stroke-linecap="round" />

  <path d="M 13.8,192.5 A 36.2,9.4 0 0,0 86.2,192.5 L 85.6,197.4 A 35.6,10.2 0 0,1 14.4,197.4 Z" fill="url(#baseCushionGrad)" />
  <path d="M 15.0,196.4 A 35.0,9.8 0 0,0 85.0,196.4" fill="none" stroke="#3c80d4" stroke-width="1.6" stroke-linecap="round" opacity="0.88" />
  <path d="M 25,199.8 A 25,5.6 0 0,0 75,199.8" fill="none" stroke="#75baff" stroke-width="1.1" stroke-linecap="round" opacity="0.65" />

  <path d="M 35.5,25.5 L 64.5,25.5 C 78.8,29.7 85.3,39.0 85.3,55.0 L 85.3,193 A 35.3,9.0 0 0,1 14.7,193 L 14.7,55.0 C 14.7,39.0 21.2,29.7 35.5,25.5 Z" fill="none" stroke="rgba(10, 26, 72, 0.35)" stroke-width="1.2" stroke-linejoin="round" />

  <path d="M 30.0,11.5 C 27.6,15.2 28.8,20.2 34.8,23.2 C 35.8,24.5 35.8,25.8 34.6,26.8 C 20.2,31.0 13.8,40.5 13.8,55.0 L 13.8,193 A 36.2,9.6 0 0,0 86.2,193 L 86.2,55.0 C 86.2,40.5 79.8,31.0 65.4,26.8 C 64.2,25.8 64.2,24.5 65.2,23.2 C 71.2,20.2 72.4,15.2 70.0,11.5"
        fill="none" stroke="url(#naturalRimGrad)" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />

  <g id="neck-group">
    <path d="M 33.8,22.5 Q 35.2,26.0 34.5,28.5 A 15.8,3.2 0 0,0 65.5,28.5 Q 64.8,26.0 66.2,22.5 Z" fill="#081642" opacity="0.62" />
    <ellipse cx="50" cy="26.5" rx="11.5" ry="1.8" fill="rgba(120, 175, 255, 0.25)" />
    <path d="M 35.2,27.0 A 15,2.8 0 0,0 64.8,27.0" fill="none" stroke="#457bd6" stroke-width="1.1" opacity="0.88" />

    <path d="M 28.5,11.0 C 26.8,15.2 28.0,20.5 33.8,23.2 A 17.2,4.2 0 0,0 66.2,23.2 C 72.0,20.5 73.2,15.2 71.5,11.0 A 21.5,4.4 0 0,1 28.5,11.0 Z"
          fill="url(#neckLipGrad)" opacity="0.66" stroke="#3b73cc" stroke-width="1.0" />

    <path d="M 58.5,13.2 C 63.0,13.0 65.2,13.5 64.5,17.2 C 63.8,20.2 61.5,22.2 57.5,22.6 C 58.2,19.5 58.8,16.2 58.5,13.2 Z" fill="rgba(225, 242, 255, 0.78)" />
    <path d="M 30.2,12.8 C 32.8,13.2 34.2,14.5 34.5,18.2 C 34.8,20.8 33.8,21.8 31.8,21.2 C 29.8,19.0 29.5,15.5 30.2,12.8 Z" fill="rgba(135, 185, 255, 0.56)" />

    <path d="M 33.2,23.0 A 17.5,4.2 0 0,0 66.8,23.0" fill="none" stroke="#6ea6f7" stroke-width="1.4" stroke-linecap="round" />

    <ellipse cx="50" cy="11.0" rx="21.2" ry="4.3" fill="url(#neckTopRimGrad)" opacity="0.72" stroke="#6b9fed" stroke-width="1.0" />
    <path d="M 29.5,11.4 A 20.8,4.1 0 0,0 70.5,11.4" fill="none" stroke="#b8d8ff" stroke-width="1.3" stroke-linecap="round" />
    <ellipse cx="50" cy="10.8" rx="11.6" ry="2.3" fill="url(#mouthBoreGrad)" opacity="0.58" stroke="#5c92e6" stroke-width="0.95" />
    <path d="M 39.5,11.2 A 10.8,2.0 0 0,0 60.5,11.2" fill="none" stroke="#8cbaff" stroke-width="0.95" stroke-linecap="round" opacity="0.88" />
  </g>
</svg>
`;

// 2. 精致小巧版备用瓶电影场记板 video_badge.png (紧凑 128x128，无巨大外扩光环，精确嵌在瓶内)
const videoBadgeSVG = `
<svg width="128" height="128" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="camPurpleFace" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="55%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#581c87"/>
    </linearGradient>
    <linearGradient id="playTriGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="100%" stop-color="#65a30d"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- 瓶身中心柔和紫色星辉微光 -->
  <circle cx="32" cy="32" r="26" fill="rgba(168, 85, 247, 0.22)" />
  <circle cx="32" cy="32" r="22" fill="none" stroke="#e879f9" stroke-width="1.0" stroke-dasharray="6 4" opacity="0.7"/>

  <!-- 精致小巧电影场记板 🎬 (倾斜 12 度) -->
  <g transform="translate(32, 33) rotate(-12)" filter="url(#softGlow)">
    <!-- 阴影底座 -->
    <rect x="-14" y="-5" width="28" height="20" rx="3.5" fill="#3b0764" stroke="#c084fc" stroke-width="1.0"/>
    <!-- 亮紫主面板 -->
    <rect x="-14" y="-7" width="28" height="19" rx="3.5" fill="url(#camPurpleFace)" />

    <!-- 旋转开合的黑白斑马纹顶夹板 -->
    <g transform="rotate(-10, -14, -7)">
      <rect x="-14" y="-12" width="28" height="5.5" rx="1.8" fill="#2e0550" stroke="#f3e8ff" stroke-width="0.7"/>
      <polygon points="-10,-12 -6,-12 -8,-6.5 -12,-6.5" fill="#ffffff"/>
      <polygon points="-1,-12 3,-12 1,-6.5 -3,-6.5" fill="#ffffff"/>
      <polygon points="8,-12 12,-12 10,-6.5 6,-6.5" fill="#ffffff"/>
    </g>

    <!-- 苹果绿发光三角播放键 -->
    <polygon points="-3,-2 -3,7 5,2.5" fill="url(#playTriGrad)" stroke="#365314" stroke-width="0.7" stroke-linejoin="round"/>
  </g>

  <!-- 闪耀微粒 -->
  <path d="M 8,14 L 9,9 L 10,14 L 15,15 L 10,16 L 9,21 L 8,16 L 3,15 Z" fill="#ffffff" opacity="0.85"/>
  <path d="M 54,46 L 55,42 L 56,46 L 60,47 L 56,48 L 55,52 L 54,48 L 50,47 Z" fill="#ffffff" opacity="0.8"/>
</svg>
`;

// 3. 宜家原木实木塞 cork.png (160x120)
const corkSVG = `
<svg width="160" height="120" viewBox="20 0 60 45" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ikeaCorkTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe89e"/>
      <stop offset="55%" stop-color="#f5c356"/>
      <stop offset="100%" stop-color="#d4922a"/>
    </linearGradient>
    <linearGradient id="ikeaCorkSideGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b87b28"/>
      <stop offset="25%" stop-color="#ffd978"/>
      <stop offset="58%" stop-color="#eab347"/>
      <stop offset="85%" stop-color="#ffe28a"/>
      <stop offset="100%" stop-color="#9e6216"/>
    </linearGradient>
    <linearGradient id="ikeaCorkPlugGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8c581c"/>
      <stop offset="45%" stop-color="#c48838"/>
      <stop offset="80%" stop-color="#d69a4a"/>
      <stop offset="100%" stop-color="#704210"/>
    </linearGradient>
  </defs>

  <path d="M 39.0,12.2 L 61.0,12.2 L 57.0,27.5 A 7.2,2.2 0 0,1 43.0,27.5 Z" fill="url(#ikeaCorkPlugGrad)" opacity="0.92" />
  <path d="M 34.5,4.8 L 36.8,12.8 A 13.5,3.0 0 0,0 63.2,12.8 L 65.5,4.8 A 15.5,3.4 0 0,1 34.5,4.8 Z"
        fill="url(#ikeaCorkSideGrad)" stroke="#b88b58" stroke-width="0.85" />
  <ellipse cx="50" cy="4.8" rx="15.5" ry="3.3" fill="url(#ikeaCorkTopGrad)" stroke="#f7e7ce" stroke-width="0.8" />
  <ellipse cx="50" cy="4.7" rx="9.5" ry="1.7" fill="none" stroke="#c99c68" stroke-width="0.65" opacity="0.55" />
  <path d="M 36.8,6.2 A 13.5,2.7 0 0,0 63.2,6.2" fill="none" stroke="#fff9ed" stroke-width="1.0" stroke-linecap="round" opacity="0.85" />
  <circle cx="43.5" cy="8.8" r="0.7" fill="#a87948" opacity="0.55" />
  <circle cx="54.8" cy="9.8" r="0.85" fill="#a87948" opacity="0.5" />
  <line x1="41.8" y1="7.2" x2="42.4" y2="11.6" stroke="#b88854" stroke-width="0.7" opacity="0.45" stroke-linecap="round" />
  <line x1="57.6" y1="7.0" x2="56.8" y2="11.4" stroke="#b88854" stroke-width="0.7" opacity="0.45" stroke-linecap="round" />
</svg>
`;

// 4. 高奢果冻拟物按钮贴图 (128x128)
// A. btn_shuffle.png (洗牌提示，青蓝水晶果冻)
const btnShuffleSVG = `
<svg width="128" height="128" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="jellyCyan" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="35%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="sheenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.75)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>
  <!-- 阴影底座 -->
  <rect x="4" y="6" width="56" height="52" rx="16" fill="#02416b" />
  <!-- 果冻主面板 -->
  <rect x="4" y="4" width="56" height="52" rx="16" fill="url(#jellyCyan)" stroke="#bae6fd" stroke-width="1.8"/>
  <!-- 顶部玻璃反光镜面 -->
  <rect x="8" y="7" width="48" height="20" rx="10" fill="url(#sheenGrad)" />
  <!-- 洗牌图标 🔀 -->
  <path d="M 20,24 L 28,24 L 36,38 L 44,38" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 40,34 L 45,38 L 40,42" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 20,38 L 28,38 L 31,33" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 33,29 L 36,24 L 44,24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 40,20 L 45,24 L 40,28" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="32" y="50" text-anchor="middle" fill="#e0f2fe" font-size="9" font-weight="900" font-family="sans-serif">洗牌</text>
</svg>
`;

// B. btn_add_bottle.png (加瓶，琥珀金黄果冻)
const btnAddBottleSVG = `
<svg width="128" height="128" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="jellyGold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="35%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="sheenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.75)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>
  <!-- 阴影底座 -->
  <rect x="4" y="6" width="56" height="52" rx="16" fill="#78350f" />
  <!-- 果冻主面板 -->
  <rect x="4" y="4" width="56" height="52" rx="16" fill="url(#jellyGold)" stroke="#fef08a" stroke-width="1.8"/>
  <!-- 顶部玻璃反光镜面 -->
  <rect x="8" y="7" width="48" height="20" rx="10" fill="url(#sheenGrad)" />
  <!-- 试管加号图标 🧪+ -->
  <g transform="translate(30, 26)">
    <path d="M -8,-9 L -4,-9 L -4,-7 L -3,-5 L -3,6 C -3,8.5 -8,8.5 -8,6 L -8,-7 Z" fill="#ffffff" opacity="0.9" stroke="#78350f" stroke-width="0.8"/>
    <ellipse cx="-5.5" cy="-9" rx="2.5" ry="0.8" fill="#fef08a" />
    <path d="M 4,-4 L 12,-4 M 8,-8 L 8,0" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
  </g>
  <text x="32" y="50" text-anchor="middle" fill="#fffbeb" font-size="9" font-weight="900" font-family="sans-serif">加瓶</text>
</svg>
`;

// C. btn_level.png (关卡选单，晶莹天蓝果冻 + 四宫格矩阵)
const btnLevelSVG = `
<svg width="128" height="128" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="jellyCyanLvl" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="35%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="sheenGradLvl" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.75)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>
  <!-- 阴影底座 -->
  <rect x="4" y="6" width="56" height="52" rx="16" fill="#02416b" />
  <!-- 果冻主面板 -->
  <rect x="4" y="4" width="56" height="52" rx="16" fill="url(#jellyCyanLvl)" stroke="#bae6fd" stroke-width="1.8"/>
  <!-- 顶部玻璃反光镜面 -->
  <rect x="8" y="7" width="48" height="20" rx="10" fill="url(#sheenGradLvl)" />
  <!-- 四宫格关卡微缩矩阵图标 -->
  <g transform="translate(20, 15)">
    <rect x="0" y="0" width="10" height="10" rx="3" fill="#ffffff" />
    <rect x="14" y="0" width="10" height="10" rx="3" fill="#fde047" />
    <rect x="0" y="13" width="10" height="10" rx="3" fill="#bae6fd" />
    <rect x="14" y="13" width="10" height="10" rx="3" fill="#ffffff" />
  </g>
  <text x="32" y="50" text-anchor="middle" fill="#e0f2fe" font-size="9" font-weight="900" font-family="sans-serif">关卡</text>
</svg>
`;

// D. btn_undo.png (撤回，晶莹天蓝果冻)
const btnUndoSVG = `
<svg width="128" height="128" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="jellyCyan" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="35%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="sheenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.75)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
  </defs>
  <!-- 阴影底座 -->
  <rect x="4" y="6" width="56" height="52" rx="16" fill="#02416b" />
  <!-- 果冻主面板 -->
  <rect x="4" y="4" width="56" height="52" rx="16" fill="url(#jellyCyan)" stroke="#bae6fd" stroke-width="1.8"/>
  <!-- 顶部玻璃反光镜面 -->
  <rect x="8" y="7" width="48" height="20" rx="10" fill="url(#sheenGrad)" />
  <!-- 撤回弧线箭头 ↩️ -->
  <path d="M 42,35 C 42,24 35,21 26,21 L 20,21" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M 24,16 L 18,21 L 24,26" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="32" y="50" text-anchor="middle" fill="#e0f2fe" font-size="9" font-weight="900" font-family="sans-serif">撤回</text>
</svg>
`;

async function main() {
  console.log('Baking refined assets into:', outDir);
  
  await sharp(Buffer.from(tubeGlassSVG)).png().toFile(path.join(outDir, 'tube_glass.png'));
  console.log('✓ tube_glass.png baked.');

  await sharp(Buffer.from(videoBadgeSVG)).png().toFile(path.join(outDir, 'video_badge.png'));
  console.log('✓ video_badge.png baked (refined 128x128 compact clapperboard).');

  await sharp(Buffer.from(corkSVG)).png().toFile(path.join(outDir, 'cork.png'));
  console.log('✓ cork.png baked.');

  await sharp(Buffer.from(btnShuffleSVG)).png().toFile(path.join(outDir, 'btn_shuffle.png'));
  console.log('✓ btn_shuffle.png baked (Jelly Cyan).');

  await sharp(Buffer.from(btnAddBottleSVG)).png().toFile(path.join(outDir, 'btn_add_bottle.png'));
  console.log('✓ btn_add_bottle.png baked (Jelly Gold).');

  await sharp(Buffer.from(btnLevelSVG)).png().toFile(path.join(outDir, 'btn_level.png'));
  console.log('✓ btn_level.png baked (Jelly Indigo).');

  await sharp(Buffer.from(btnUndoSVG)).png().toFile(path.join(outDir, 'btn_undo.png'));
  console.log('✓ btn_undo.png baked (Jelly Cyan).');

  console.log('All textures successfully refined and baked!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
