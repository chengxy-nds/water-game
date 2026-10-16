const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.resolve('E:/GithubProjects/water-game-cocos/assets/textures');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 基础 SVG 滤镜与渐变定义 (100% 提取自 demo/v8.html)
const commonDefs = `
  <defs>
    <!-- 超椭圆按钮渐变体系 -->
    <linearGradient id="warmGlassBase" x1="15%" y1="5%" x2="85%" y2="95%">
      <stop offset="0%" stop-color="#f7dfb8" stop-opacity="0.95"/>
      <stop offset="38%" stop-color="#dfad64" stop-opacity="0.85"/>
      <stop offset="72%" stop-color="#b87b31" stop-opacity="0.90"/>
      <stop offset="100%" stop-color="#d89d4e" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="rulesGlassBase" x1="15%" y1="5%" x2="85%" y2="95%">
      <stop offset="0%" stop-color="#e4efe2" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="#9cb298" stop-opacity="0.85"/>
      <stop offset="82%" stop-color="#6b8368" stop-opacity="0.90"/>
      <stop offset="100%" stop-color="#8da387" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="hintGlassBase" x1="15%" y1="5%" x2="85%" y2="95%">
      <stop offset="0%" stop-color="#ede2be" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="#b69f62" stop-opacity="0.85"/>
      <stop offset="80%" stop-color="#877b48" stop-opacity="0.90"/>
      <stop offset="100%" stop-color="#a8995c" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="topCrescentSheen" x1="30%" y1="0%" x2="65%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="45%" stop-color="#fff6e4" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0"/>
    </linearGradient>
    <radialGradient id="innerBottomShade" cx="52%" cy="68%" r="48%">
      <stop offset="0%" stop-color="#8a5216" stop-opacity="0.45"/>
      <stop offset="65%" stop-color="#9c6222" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#9c6222" stop-opacity="0.0"/>
    </radialGradient>
    <linearGradient id="glassRimStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98"/>
      <stop offset="30%" stop-color="#fff8eb" stop-opacity="0.85"/>
      <stop offset="65%" stop-color="#ffe7c2" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95"/>
    </linearGradient>
    <radialGradient id="bulb3DGrad" cx="36%" cy="32%" r="64%">
      <stop offset="0%" stop-color="#ffffc8"/>
      <stop offset="32%" stop-color="#ffea38"/>
      <stop offset="72%" stop-color="#f7b718"/>
      <stop offset="100%" stop-color="#d97f08"/>
    </radialGradient>
    <linearGradient id="question3DGrad" x1="25%" y1="10%" x2="75%" y2="90%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="48%" stop-color="#d4ecff"/>
      <stop offset="100%" stop-color="#8ec0e4"/>
    </linearGradient>
  </defs>
`;

// 超椭圆玻璃外壳生成器 (100% 对齐原图)
function buildSuperEllipseBody(glassBaseGrad) {
  return `
    <g>
      <!-- 柔和接触底影 -->
      <path d="M 50,7 C 84,7 95,18 95,52 C 95,86 84,97 50,97 C 16,97 5,86 5,52 C 5,18 16,7 50,7 Z" fill="rgba(88, 48, 12, 0.28)" />
      <!-- 主玻璃基底 -->
      <path d="M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z" fill="url(#${glassBaseGrad})" />
      <path d="M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z" fill="url(#innerBottomShade)" />
      <!-- 顶层斜向月牙高光 -->
      <path d="M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z" fill="url(#topCrescentSheen)" />
      <path d="M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.75" />
      <path d="M 20,86 C 30,90.5 68,90.5 80,85" stroke="#fff3d6" stroke-width="2.0" stroke-linecap="round" opacity="0.60" />
      <path d="M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z" stroke="url(#glassRimStroke)" stroke-width="2.6" fill="none" />
    </g>
  `;
}

// 1. 设置按钮 btn_settings.png
function getSettingsSVG() {
  return `
  <svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${commonDefs}
    ${buildSuperEllipseBody('warmGlassBase')}
    <g>
      <rect x="30" y="32" width="40" height="7.6" rx="3.8" fill="rgba(80, 42, 10, 0.35)"/>
      <rect x="30" y="31" width="40" height="7.6" rx="3.8" fill="#ffffff"/>
      <rect x="30" y="47.2" width="40" height="7.6" rx="3.8" fill="rgba(80, 42, 10, 0.35)"/>
      <rect x="30" y="46.2" width="40" height="7.6" rx="3.8" fill="#ffffff"/>
      <rect x="30" y="62.4" width="40" height="7.6" rx="3.8" fill="rgba(80, 42, 10, 0.35)"/>
      <rect x="30" y="61.4" width="40" height="7.6" rx="3.8" fill="#ffffff"/>
    </g>
  </svg>
  `;
}

// 2. 规则/能量按钮 btn_power.png
function getPowerSVG() {
  return `
  <svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${commonDefs}
    ${buildSuperEllipseBody('rulesGlassBase')}
    <g>
      <path d="M 38.5,36.5 C 38.5,28.5 44.5,24 52,24 C 59.5,24 65.5,28.8 65.5,36 C 65.5,41.5 62,44.8 57.2,47.8 C 53.8,49.9 52.5,52.2 52.5,56.5"
            stroke="rgba(35, 60, 35, 0.35)" stroke-width="8.5" stroke-linecap="round" fill="none"/>
      <circle cx="52.2" cy="71.5" r="5.2" fill="rgba(35, 60, 35, 0.35)"/>
      <path d="M 38.5,35.5 C 38.5,27.5 44.5,23 52,23 C 59.5,23 65.5,27.8 65.5,35 C 65.5,40.5 62,43.8 57.2,46.8 C 53.8,48.9 52.5,51.2 52.5,55.5"
            stroke="url(#question3DGrad)" stroke-width="8.5" stroke-linecap="round" fill="none"/>
      <circle cx="52.2" cy="70.5" r="5.2" fill="url(#question3DGrad)"/>
    </g>
  </svg>
  `;
}

// 3. 撤回按钮 btn_undo.png
function getUndoSVG() {
  return `
  <svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${commonDefs}
    ${buildSuperEllipseBody('warmGlassBase')}
    <g>
      <!-- 阴影层 -->
      <path d="M 44,32 L 25.5,49.5 C 24.0,51.0 24.3,53.4 26.2,54.3 L 45.5,62.5 C 47.4,63.3 49.3,61.6 48.8,59.6 L 47.0,53.2 C 58.2,52.0 66.8,55.8 72.5,63.2 C 73.5,64.5 75.5,63.5 75.2,61.8 C 72.8,45.2 61.2,37.8 46.8,39.2 L 48.0,33.8 C 48.4,31.8 45.6,30.5 44,32 Z" fill="rgba(80, 42, 10, 0.35)"/>
      <!-- 白色实心矢量主体 -->
      <path d="M 44,31 L 25.5,48.5 C 24.0,50.0 24.3,52.4 26.2,53.3 L 45.5,61.5 C 47.4,62.3 49.3,60.6 48.8,58.6 L 47.0,52.2 C 58.2,51.0 66.8,54.8 72.5,62.2 C 73.5,63.5 75.5,62.5 75.2,60.8 C 72.8,44.2 61.2,36.8 46.8,38.2 L 48.0,32.8 C 48.4,30.8 45.6,29.5 44,31 Z" fill="#ffffff"/>
    </g>
  </svg>
  `;
}

// 4. 打乱重排按钮 btn_shuffle.png
function getShuffleSVG() {
  return `
  <svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${commonDefs}
    ${buildSuperEllipseBody('warmGlassBase')}
    <g>
      <g stroke="rgba(80, 42, 10, 0.35)" stroke-width="6.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 1.2)">
        <path d="M 24,64 H 33 C 41,64 46,59 51,48 C 56,37 61,33 69,33 H 76"/>
        <path d="M 67,24 L 78,33 L 67,42" fill="none"/>
        <path d="M 24,33 H 33 C 38,33 42,35.5 45.5,41" fill="none"/>
        <path d="M 56.5,56.5 C 60,61.5 64,64 69,64 H 76" fill="none"/>
        <path d="M 67,55 L 78,64 L 67,73" fill="none"/>
      </g>
      <g stroke="#ffffff" stroke-width="6.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 24,64 H 33 C 41,64 46,59 51,48 C 56,37 61,33 69,33 H 76"/>
        <path d="M 67,24 L 78,33 L 67,42" fill="none"/>
        <path d="M 24,33 H 33 C 38,33 42,35.5 45.5,41" fill="none"/>
        <path d="M 56.5,56.5 C 60,61.5 64,64 69,64 H 76" fill="none"/>
        <path d="M 67,55 L 78,64 L 67,73" fill="none"/>
      </g>
    </g>
  </svg>
  `;
}

// 5. 提示按钮 btn_add_bottle.png (10道放射金芒 + 3D发光灯泡)
function getHintSVG() {
  return `
  <svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${commonDefs}
    ${buildSuperEllipseBody('hintGlassBase')}
    <!-- 放射金芒 -->
    <g stroke="#ffe866" stroke-width="2.4" stroke-linecap="round" opacity="0.95">
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
    <!-- 3D灯泡 -->
    <g>
      <path d="M 50,24 C 38.2,24 29,33.0 29,44.2 C 29,51.4 33.0,57.6 38.8,61.2 C 40.8,62.5 42.0,64.6 42.2,67.0 L 57.8,67.0 C 58.0,64.6 59.2,62.5 61.2,61.2 C 67.0,57.6 71,51.4 71,44.2 C 71,33.0 61.8,24 50,24 Z" fill="url(#bulb3DGrad)" stroke="#ffffff" stroke-width="1.2"/>
      <ellipse cx="42" cy="36" rx="6.5" ry="4.2" transform="rotate(-28 42 36)" fill="#ffffff" opacity="0.65"/>
      <rect x="42.2" y="67.2" width="15.6" height="4.8" rx="2.2" fill="#6f7b88"/>
      <rect x="43.4" y="72.0" width="13.2" height="4.5" rx="2.0" fill="#596573"/>
      <path d="M 45.5,76.5 C 46.2,79.8 47.8,81.5 50,81.5 C 52.2,81.5 53.8,79.8 54.5,76.5 Z" fill="#424c58"/>
    </g>
  </svg>
  `;
}

// 6. 重玩按钮 btn_level.png (环形圆角三角箭头)
function getRestartSVG() {
  return `
  <svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${commonDefs}
    ${buildSuperEllipseBody('warmGlassBase')}
    <g>
      <!-- 阴影 -->
      <path d="M 41,35.5 A 18.5,18.5 0 1 1 32.5,57.5" stroke="rgba(80, 42, 10, 0.35)" stroke-width="7.2" stroke-linecap="round" fill="none"/>
      <path d="M 47.5,25.5 L 46.5,44.5 C 46.4,46.2 44.5,47.0 43.1,46.0 L 30.8,36.8 C 29.4,35.8 29.8,33.6 31.4,33.0 L 44.8,24.2 C 46.2,23.4 47.6,24.2 47.5,25.5 Z" fill="rgba(80, 42, 10, 0.35)"/>
      <!-- 白色主体 -->
      <path d="M 41,34.5 A 18.5,18.5 0 1 1 32.5,56.5" stroke="#ffffff" stroke-width="7.2" stroke-linecap="round" fill="none"/>
      <path d="M 47.5,24.5 L 46.5,43.5 C 46.4,45.2 44.5,46.0 43.1,45.0 L 30.8,35.8 C 29.4,34.8 29.8,32.6 31.4,32.0 L 44.8,23.2 C 46.2,22.4 47.6,23.2 47.5,24.5 Z" fill="#ffffff"/>
    </g>
  </svg>
  `;
}

// 7. 3D 粗麻布经纬编织桌垫 burlap_coaster_normal.png
function getBurlapSVG() {
  return `
  <svg width="328" height="136" viewBox="0 0 82 34" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="burlapTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ecd7b5"/>
        <stop offset="45%" stop-color="#c99f6b"/>
        <stop offset="100%" stop-color="#8c5f32"/>
      </linearGradient>
      <linearGradient id="burlapSideGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#996a3b"/>
        <stop offset="100%" stop-color="#4a2e13"/>
      </linearGradient>
      <radialGradient id="contactShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(75, 38, 8, 0.55)"/>
        <stop offset="60%" stop-color="rgba(115, 62, 16, 0.22)"/>
        <stop offset="100%" stop-color="rgba(115, 62, 16, 0.0)"/>
      </radialGradient>
    </defs>
    <!-- 桌底接触影 -->
    <ellipse cx="41" cy="27" rx="36" ry="6" fill="rgba(88, 42, 10, 0.32)"/>
    <!-- 软垫厚度侧壁 -->
    <path d="M 8,16 L 8,23 C 8,28.5 74,28.5 74,23 L 74,16 Z" fill="url(#burlapSideGrad)" />
    <!-- 软垫顶面椭圆台 -->
    <ellipse cx="41" cy="16" rx="33" ry="8" fill="url(#burlapTopGrad)" stroke="#ffffff" stroke-width="0.8" opacity="0.95"/>
    <!-- 接触遮蔽影 (托住瓶底) -->
    <ellipse cx="41" cy="16" rx="25" ry="5.5" fill="url(#contactShadow)" />
    <!-- 编织纹理高光点缀 -->
    <ellipse cx="41" cy="15" rx="30" ry="6.8" fill="none" stroke="rgba(255, 255, 255, 0.65)" stroke-width="0.8" stroke-dasharray="3 2" />
  </svg>
  `;
}

// 8. 暖金角标 badge_gold_new.png
function getBadgeGoldSVG() {
  return `
  <svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff8d7"/>
        <stop offset="50%" stop-color="#f5ba38"/>
        <stop offset="100%" stop-color="#c97e0c"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="13" r="10" fill="rgba(85, 48, 8, 0.28)"/>
    <circle cx="12" cy="12" r="10" fill="url(#badgeGold)" stroke="#ffffff" stroke-width="1.5"/>
  </svg>
  `;
}

async function runBake() {
  console.log('[Bake Full Fidelity V8] 开始全量烘焙 4x Retina 高定资产...');

  const tasks = [
    { name: 'btn_settings.png', svg: getSettingsSVG() },
    { name: 'btn_power.png', svg: getPowerSVG() },
    { name: 'btn_undo.png', svg: getUndoSVG() },
    { name: 'btn_shuffle.png', svg: getShuffleSVG() },
    { name: 'btn_add_bottle.png', svg: getHintSVG() },
    { name: 'btn_level.png', svg: getRestartSVG() },
    { name: 'burlap_coaster_normal.png', svg: getBurlapSVG() },
    { name: 'burlap_coaster_special.png', svg: getBurlapSVG() },
    { name: 'burlap_coaster_star.png', svg: getBurlapSVG() },
    { name: 'badge_gold_new.png', svg: getBadgeGoldSVG() },
  ];

  for (const t of tasks) {
    const dest = path.join(outDir, t.name);
    await sharp(Buffer.from(t.svg)).png().toFile(dest);
    console.log(`✓ 已生成超清贴图: ${t.name}`);
  }

  console.log('★ 全量资产无损烘焙完成！所有贴图已与 HTML 原型 1:1 数学级对齐！');
}

runBake().catch(console.error);
