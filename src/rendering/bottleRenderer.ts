import { Bottle } from '../types/game';
import { COLORS } from '../constants/colors';
import {
  getBottleLayerMetrics,
  getNeckOffsetY,
} from '../physics/liquidMath';
import {
  buildLiquidLayersMarkup,
  renderRibbonAndDroppingCorkMarkup,
} from '../physics/liquidMarkup';

export function renderBottleSVG(b: Bottle, idx: number, currentLevelId = 1): string {
  const maxCap = b.maxCap || 4;
  const isGiantCat = !!b.isGiantCat;

  let defsHTML = '';
  Object.entries(COLORS).forEach(([key, col]) => {
    defsHTML += `
      <linearGradient id="liq-${key}-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${col.left}" />
        <stop offset="18%" stop-color="${col.mid}" />
        <stop offset="68%" stop-color="${col.mid}" />
        <stop offset="82%" stop-color="${col.highlight}" />
        <stop offset="100%" stop-color="${col.right}" />
      </linearGradient>
      <linearGradient id="top-${key}-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${col.topMid}" />
        <stop offset="58%" stop-color="${col.topRim}" />
        <stop offset="92%" stop-color="${col.topLight}" />
        <stop offset="100%" stop-color="${col.mid}" />
      </linearGradient>
    `;
  });

  defsHTML += `
    <linearGradient id="liq-mystery-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0b0820" />
      <stop offset="35%" stop-color="#1e1545" />
      <stop offset="72%" stop-color="#35256e" />
      <stop offset="100%" stop-color="#09061a" />
    </linearGradient>
    <filter id="glassSheenBlur-${idx}" x="-20%" y="-10%" width="140%" height="120%">
      <feGaussianBlur stdDeviation="1.3" />
    </filter>
    <linearGradient id="neckLipGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#224999"/>
      <stop offset="12%" stop-color="#6092eb"/>
      <stop offset="28%" stop-color="#0d1e54"/>
      <stop offset="54%" stop-color="#152d75"/>
      <stop offset="72%" stop-color="#b8d8ff"/>
      <stop offset="83%" stop-color="#3c6fd1"/>
      <stop offset="93%" stop-color="#75a7f5"/>
      <stop offset="100%" stop-color="#19357a"/>
    </linearGradient>
    <linearGradient id="neckTopRimGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2d57ab"/>
      <stop offset="25%" stop-color="#6ca0f0"/>
      <stop offset="58%" stop-color="#1c3b82"/>
      <stop offset="82%" stop-color="#8ab8ff"/>
      <stop offset="100%" stop-color="#244794"/>
    </linearGradient>
    <linearGradient id="mouthBoreGrad-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#050d26"/>
      <stop offset="65%" stop-color="#112759"/>
      <stop offset="100%" stop-color="#3562b8"/>
    </linearGradient>
    <radialGradient id="leftShoulderDomeGrad-${idx}" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="rgba(210, 230, 255, 0.24)"/>
      <stop offset="55%" stop-color="rgba(170, 200, 250, 0.09)"/>
      <stop offset="100%" stop-color="rgba(150, 185, 245, 0.0)"/>
    </radialGradient>
    <radialGradient id="rightShoulderSoftGrad-${idx}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.38)"/>
      <stop offset="55%" stop-color="rgba(220, 240, 255, 0.16)"/>
      <stop offset="100%" stop-color="rgba(220, 240, 255, 0.0)"/>
    </radialGradient>
    <linearGradient id="glassBodyGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(75, 120, 205, 0.22)"/>
      <stop offset="18%" stop-color="rgba(26, 38, 82, 0.36)"/>
      <stop offset="55%" stop-color="rgba(18, 28, 66, 0.32)"/>
      <stop offset="80%" stop-color="rgba(85, 115, 175, 0.28)"/>
      <stop offset="100%" stop-color="rgba(24, 52, 118, 0.44)"/>
    </linearGradient>
    <linearGradient id="rightPillarSheen-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.0)"/>
      <stop offset="16%" stop-color="rgba(255, 255, 255, 0.22)"/>
      <stop offset="55%" stop-color="rgba(255, 255, 255, 0.13)"/>
      <stop offset="90%" stop-color="rgba(255, 255, 255, 0.05)"/>
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
    </linearGradient>
    <linearGradient id="leftWallSheen-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(195, 222, 255, 0.16)"/>
      <stop offset="65%" stop-color="rgba(180, 210, 255, 0.06)"/>
      <stop offset="100%" stop-color="rgba(180, 210, 255, 0.0)"/>
    </linearGradient>
    <linearGradient id="baseCushionGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2b6cb3"/>
      <stop offset="22%" stop-color="#0a225e"/>
      <stop offset="50%" stop-color="#051342"/>
      <stop offset="78%" stop-color="#0d2b6e"/>
      <stop offset="92%" stop-color="#4287cf"/>
      <stop offset="100%" stop-color="#1d5296"/>
    </linearGradient>
    <linearGradient id="ikeaCorkTopGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbf0dc"/>
      <stop offset="55%" stop-color="#ecd2ad"/>
      <stop offset="100%" stop-color="#d4ad7d"/>
    </linearGradient>
    <linearGradient id="ikeaCorkSideGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b88a58"/>
      <stop offset="24%" stop-color="#ebd0aa"/>
      <stop offset="58%" stop-color="#dfb988"/>
      <stop offset="84%" stop-color="#f2dcc0"/>
      <stop offset="100%" stop-color="#a67846"/>
    </linearGradient>
    <linearGradient id="ikeaCorkPlugGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8c6239"/>
      <stop offset="45%" stop-color="#b88958"/>
      <stop offset="80%" stop-color="#c99b68"/>
      <stop offset="100%" stop-color="#734d28"/>
    </linearGradient>
    <linearGradient id="dissolve-grad-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="82%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <mask id="dissolve-mask-${idx}">
      <rect id="dissolve-rect-${idx}" x="-30" y="-40" width="160" height="390" fill="url(#dissolve-grad-${idx})" />
    </mask>
  `;

  const liquidsHTML = buildLiquidLayersMarkup(b.layers, idx, {
    mysteryCount: b.mysteryCount || 0,
    maxCap,
    isGiantCat,
    currentLevelId,
  });

  // ==================== 分支 A：第 5 关正中央【高定 3D 水晶萌猫造型玻璃瓶】 ====================
  if (isGiantCat) {
    const catClipPath = `
      M 35,10 L 65,10 L 65,26
      L 70,29 L 83,12 Q 90,7 91,18 L 87,44
      Q 95,62 84,82
      Q 96,108 94,148
      L 92,193 A 42,10.5 0 0,1 8,193
      L 6,148 Q 4,108 16,82
      Q 5,62 13,44
      L 9,18 Q 10,7 17,12 L 30,29 L 35,26 Z
    `;
    let catOverFX = '';
    if (b.corked) {
      const animP = typeof b.corkAnimProgress === 'number' ? b.corkAnimProgress : 1.0;
      catOverFX = `<g id="cork-fx-${idx}">${renderRibbonAndDroppingCorkMarkup(idx, animP, 0, 194)}</g>`;
    }

    return `
      <svg class="bottle-svg" viewBox="-12 -6 124 224" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${defsHTML}
          <clipPath id="bclip-${idx}">
            <path d="${catClipPath}" />
          </clipPath>
          <linearGradient id="catEarInnerGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffb8dc" stop-opacity="0.72"/>
            <stop offset="60%" stop-color="#ff6fae" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#b8256e" stop-opacity="0.28"/>
          </linearGradient>
          <radialGradient id="catBellGrad-${idx}" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#fff8c4"/>
            <stop offset="45%" stop-color="#ffd54f"/>
            <stop offset="85%" stop-color="#e68a00"/>
            <stop offset="100%" stop-color="#8c4b00"/>
          </radialGradient>
          <linearGradient id="catCollarGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#9e1446"/>
            <stop offset="28%" stop-color="#ff4d8d"/>
            <stop offset="55%" stop-color="#ff85b3"/>
            <stop offset="82%" stop-color="#e01e63"/>
            <stop offset="100%" stop-color="#800b34"/>
          </linearGradient>
        </defs>

        <!-- 底部 3D 魔法星阵光环与投影 -->
        <ellipse cx="50" cy="206" rx="48" ry="8.5" fill="rgba(2, 6, 20, 0.65)" />
        <ellipse cx="50" cy="204" rx="45" ry="7.2" fill="none" stroke="rgba(255, 130, 195, 0.45)" stroke-width="1.5" stroke-dasharray="10 5" />

        <g mask="url(#dissolve-mask-${idx})" id="bottle-body-wrap-${idx}">
          <!-- 3D 玻璃猫身底色 -->
          <path d="${catClipPath}" fill="url(#glassBodyGrad-${idx})" />

          <!-- 3D 水晶双层猫耳内耳窝 -->
          <path d="M 13.5,16.5 L 27.5,29.5 L 15.5,41.5 Q 11.5,30 13.5,16.5 Z"
                fill="url(#catEarInnerGrad-${idx})" stroke="#b8dcff" stroke-width="1.15" stroke-linejoin="round"/>
          <path d="M 15.5,20.5 L 23.5,28.5 L 16.5,36.5 Z" fill="rgba(255, 220, 240, 0.35)" />
          <path d="M 86.5,16.5 L 72.5,29.5 L 84.5,41.5 Q 88.5,30 86.5,16.5 Z"
                fill="url(#catEarInnerGrad-${idx})" stroke="#b8dcff" stroke-width="1.15" stroke-linejoin="round"/>
          <path d="M 84.5,20.5 L 76.5,28.5 L 83.5,36.5 Z" fill="rgba(255, 220, 240, 0.35)" />

          <!-- 瓶底深海蓝厚玻璃座 -->
          <ellipse cx="50" cy="193" rx="41.5" ry="9.5" fill="#060c3a" stroke="#184986" stroke-width="2" />

          <!-- 猫瓶内部重力药水层 -->
          <g clip-path="url(#bclip-${idx})" id="liquid-group-${idx}">
            ${liquidsHTML}
          </g>

          <!-- 3D 玻璃高光与猫脸立体浮雕反射 -->
          <g clip-path="url(#bclip-${idx})">
            <ellipse cx="26" cy="50" rx="19" ry="15" fill="url(#leftShoulderDomeGrad-${idx})" />
            <path d="M 56,35 Q 80,41 83,64 L 69,66 Q 65,46 52,39 Z"
                  fill="rgba(255, 255, 255, 0.42)" filter="url(#glassSheenBlur-${idx})" />
            <path d="M 74,88 Q 88,118 85,180 L 73,180 Q 76,120 66,88 Z"
                  fill="url(#rightPillarSheen-${idx})" filter="url(#glassSheenBlur-${idx})" />
            <path d="M 12,88 Q 7,125 11,180 L 18,180 Q 15,125 19,88 Z"
                  fill="url(#leftWallSheen-${idx})" />
            <g transform="translate(50, 118)" opacity="0.24" fill="#d8eeff">
              <ellipse cx="0" cy="4" rx="7.5" ry="6" />
              <circle cx="-7.5" cy="-4.5" r="2.8" />
              <circle cx="-2.5" cy="-7.2" r="2.8" />
              <circle cx="2.5" cy="-7.2" r="2.8" />
              <circle cx="7.5" cy="-4.5" r="2.8" />
            </g>
          </g>

          <!-- 3D 宝石猫眼、粉晶心形鼻、腮红与浮雕胡须 -->
          <g>
            <ellipse cx="24" cy="64" rx="6.2" ry="3.4" fill="rgba(255, 120, 185, 0.42)" />
            <ellipse cx="76" cy="64" rx="6.2" ry="3.4" fill="rgba(255, 120, 185, 0.42)" />
            <path d="M 24,56 Q 32,48 40,56" fill="none" stroke="#091d4a" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M 24,55.5 Q 32,47.5 40,55.5" fill="none" stroke="#d8f0ff" stroke-width="2.0" stroke-linecap="round"/>
            <line x1="23" y1="54" x2="20" y2="51" stroke="#d8f0ff" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M 60,56 Q 68,48 76,56" fill="none" stroke="#091d4a" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M 60,55.5 Q 68,47.5 76,55.5" fill="none" stroke="#d8f0ff" stroke-width="2.0" stroke-linecap="round"/>
            <line x1="77" y1="54" x2="80" y2="51" stroke="#d8f0ff" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M 50,66.5 C 46,63.5 45.5,59.5 48,59.5 C 49.2,59.5 50,60.5 50,61.2 C 50,60.5 50.8,59.5 52,59.5 C 54.5,59.5 54,63.5 50,66.5 Z"
                  fill="#ff6da8" stroke="#ffffff" stroke-width="1.1"/>
            <circle cx="48.5" cy="61.2" r="1.0" fill="#ffffff" opacity="0.9"/>
            <path d="M 43.5,69.5 Q 46.8,73.5 50,68.5 Q 53.2,73.5 56.5,69.5"
                  fill="none" stroke="#d8f0ff" stroke-width="1.65" stroke-linecap="round"/>
            <g stroke="rgba(205, 235, 255, 0.78)" stroke-width="1.45" stroke-linecap="round">
              <line x1="9" y1="57" x2="20" y2="60" />
              <line x1="7" y1="64" x2="19" y2="64" />
              <line x1="10" y1="71" x2="20" y2="68" />
              <line x1="91" y1="57" x2="80" y2="60" />
              <line x1="93" y1="64" x2="81" y2="64" />
              <line x1="90" y1="71" x2="80" y2="68" />
            </g>
          </g>

          <!-- 猫颈丝绒金铃铛项圈 -->
          <g>
            <path d="M 15.5,81 Q 50,91 84.5,81 L 85.2,86.5 Q 50,96.5 14.8,86.5 Z"
                  fill="url(#catCollarGrad-${idx})" stroke="#ffbfd9" stroke-width="1.0" />
            <circle cx="50" cy="89.5" r="6.8" fill="url(#catBellGrad-${idx})" stroke="#fff3b0" stroke-width="1.1" />
            <line x1="45.5" y1="88" x2="54.5" y2="88" stroke="#995200" stroke-width="1.0" />
            <circle cx="50" cy="91.5" r="1.6" fill="#5c2d00" />
            <line x1="50" y1="91.5" x2="50" y2="95.5" stroke="#5c2d00" stroke-width="1.3" />
            <circle cx="48" cy="86.8" r="1.4" fill="#ffffff" opacity="0.88" />
          </g>

          <!-- 瓶底厚水晶底座与轮廓线 -->
          <path d="M 8,193 A 42,10.5 0 0,0 92,193 L 91,199.5 A 41,11.5 0 0,1 9,199.5 Z" fill="url(#baseCushionGrad-${idx})" />
          <path d="M 10,198 A 40,10.5 0 0,0 90,198" fill="none" stroke="#68b5ff" stroke-width="2.0" stroke-linecap="round" />
          <path d="${catClipPath}" fill="none" stroke="#0b2260" stroke-width="3.2" stroke-linejoin="round" opacity="0.7" />
          <path d="${catClipPath}" fill="none" stroke="#5ca4ff" stroke-width="2.4" stroke-linejoin="round" />

          <!-- 鎏金进度铭牌 -->
          <g transform="translate(50, 146)">
            <rect x="-26" y="-11" width="52" height="21" rx="10.5"
                  fill="rgba(10, 22, 62, 0.78)" stroke="#ffdf6b" stroke-width="1.5" />
            <text x="0" y="3.5" text-anchor="middle" fill="#fff5b8" font-size="11.5" font-weight="900">
              🐱 ${b.layers.length}/${maxCap}
            </text>
          </g>

          <!-- 厚玻璃瓶口 -->
          <g id="neck-group-${idx}">
            <path d="M 33.8,22.5 Q 35.2,26.0 34.5,28.8 A 15.8,3.4 0 0,0 65.5,28.8 Q 64.8,26.0 66.2,22.5 Z" fill="#081642" opacity="0.66" />
            <path d="M 28.5,11.0 C 26.8,15.2 28.0,20.5 33.8,23.2 A 17.2,4.2 0 0,0 66.2,23.2 C 72.0,20.5 73.2,15.2 71.5,11.0 A 21.5,4.4 0 0,1 28.5,11.0 Z"
                  fill="url(#neckLipGrad-${idx})" opacity="0.72" stroke="#3b73cc" stroke-width="1.0" />
            <path d="M 58.5,13.2 C 63.0,13.0 65.2,13.5 64.5,17.2 C 63.8,20.2 61.5,22.2 57.5,22.6 C 58.2,19.5 58.8,16.2 58.5,13.2 Z"
                  fill="rgba(225, 242, 255, 0.78)" />
            <ellipse cx="50" cy="11.0" rx="21.2" ry="4.3" fill="url(#neckTopRimGrad-${idx})" opacity="0.76" stroke="#6b9fed" stroke-width="1.0" />
            <path d="M 29.5,11.4 A 20.8,4.1 0 0,0 70.5,11.4" fill="none" stroke="#b8d8ff" stroke-width="1.35" stroke-linecap="round" />
            <ellipse cx="50" cy="10.8" rx="11.6" ry="2.3" fill="url(#mouthBoreGrad-${idx})" opacity="0.65" stroke="#5c92e6" stroke-width="0.95" />
          </g>
        </g>

        ${catOverFX}
      </svg>
    `;
  }

  // ==================== 分支 B：多容量试管瓶 + 7大 3D 特殊机关 ====================
  const neckOffsetY = getNeckOffsetY(maxCap, isGiantCat, currentLevelId);
  const { bottomY: bBotY, layerH: bLayerH, vbMinX, vbMinY, vbW, vbH } = getBottleLayerMetrics(maxCap, isGiantCat, currentLevelId);
  const shoulderTopY = 28 + neckOffsetY;
  const shoulderBotY = 54 + neckOffsetY;
  const neckBoreTopY = 25.5 + neckOffsetY;
  const pillarH = bBotY - 8 - (55 + neckOffsetY);

  let underGlassFX = '';
  let insideGlassDecorFX = '';
  let overGlassFX = '';

  // 8层超长皇冠瓶专属：精致3D鎏金皇冠颈环与水晶刻度线
  if (maxCap === 8) {
    insideGlassDecorFX += `<g opacity="0.55">`;
    for (let tick = 1; tick < 8; tick++) {
      const ty = bBotY - tick * bLayerH;
      const isMajor = tick % 2 === 0;
      insideGlassDecorFX += `
        <line x1="${isMajor ? 72 : 76}" y1="${ty.toFixed(1)}" x2="83.5" y2="${ty.toFixed(1)}"
              stroke="${isMajor ? '#ffdf6b' : '#8ac4ff'}" stroke-width="${isMajor ? 1.5 : 1.0}" stroke-linecap="round" />
      `;
    }
    insideGlassDecorFX += `</g>`;
  }

  // 1) 黑雾盲盒瓶 (mysteryCount > 0)：星芒光晕 + 悬浮神秘符文
  if (b.mysteryCount && b.mysteryCount > 0) {
    underGlassFX += `
      <g opacity="0.92">
        <path d="M 8,92 L 10,87 L 12,92 L 17,94 L 12,96 L 10,101 L 8,96 L 3,94 Z" fill="#ffe57f"/>
        <circle cx="7" cy="134" r="2.0" fill="#ffd54f"/>
        <path d="M 90,108 L 91.5,104 L 93,108 L 97,109.5 L 93,111 L 91.5,115 L 90,111 L 86,109.5 Z" fill="#fff3b0"/>
        <circle cx="93" cy="152" r="2.2" fill="#ffe57f"/>
      </g>
    `;
  }

  // 2) 经典关与限步关的 3D 立体藍晶摄像机解锁瓶 (ad_cam_blue)
  if (b.special === 'ad_cam_blue') {
    overGlassFX += `
      <g transform="translate(50, 114)">
        <ellipse cx="0" cy="22" rx="22" ry="5" fill="rgba(4, 12, 36, 0.55)" />
        <rect x="-24" y="-13" width="38" height="30" rx="9" fill="#174c8f" stroke="#7ec8ff" stroke-width="1.5"/>
        <polygon points="12,-4 26,-11 26,13 12,6" fill="#174c8f" stroke="#7ec8ff" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="-24" y="-17" width="38" height="29" rx="9" fill="url(#camBlueFaceGrad-${idx})" stroke="#ffffff" stroke-width="1.5"/>
        <polygon points="12,-8 25,-14 25,9 12,3" fill="url(#camBlueFaceGrad-${idx})" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>
        <rect x="-20" y="-14" width="30" height="6" rx="3" fill="rgba(255,255,255,0.75)" />
        <circle cx="-5" cy="-2.5" r="8.5" fill="#1e6bb8" stroke="#bce4ff" stroke-width="1.2" />
        <polygon points="-7.5,-7 -7.5,2 1,-2.5" fill="#ffffff" />
      </g>
    `;
  }

  // 3) 奇幻机关阵的 3D 霓虹紫晶摄像机空瓶 (ad_cam)
  if (b.special === 'ad_cam') {
    underGlassFX += `
      <ellipse cx="50" cy="198" rx="46" ry="11" fill="none" stroke="#d57dff" stroke-width="2.4" opacity="0.75" stroke-dasharray="16 7"/>
      <ellipse cx="50" cy="198" rx="37" ry="8" fill="rgba(195, 75, 255, 0.28)" stroke="#ff99eb" stroke-width="1.6"/>
    `;
    overGlassFX += `
      <g transform="translate(50, 108) rotate(-8)">
        <ellipse cx="0" cy="22" rx="22" ry="5" fill="rgba(20, 4, 42, 0.6)" />
        <rect x="-23" y="-11" width="38" height="29" rx="8" fill="#4a0e82" stroke="#e29eff" stroke-width="1.5"/>
        <polygon points="13,-3 26,-10 26,12 13,5" fill="#4a0e82" stroke="#e29eff" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="-23" y="-15" width="38" height="28" rx="8" fill="url(#camPurpleFaceGrad-${idx})" stroke="#f6dbff" stroke-width="1.4"/>
        <polygon points="13,-7 25,-13 25,8 13,2" fill="url(#camPurpleFaceGrad-${idx})" stroke="#f6dbff" stroke-width="1.3" stroke-linejoin="round"/>
        <rect x="-19" y="-12" width="29" height="5.5" rx="2.8" fill="rgba(255,255,255,0.42)" />
        <polygon points="-8,-7 -8,5 4,-1" fill="#76ff03" stroke="#1b5e20" stroke-width="1.1" stroke-linejoin="round"/>
      </g>
    `;
  }

  // 4) 3D 丝绸垂坠礼袍布幔 (silk_drape)
  if (b.special === 'silk_drape') {
    overGlassFX += `
      <g>
        <path d="M 29,10.5 C 36,6.5 64,6.5 71,10.5 L 75,27 Q 92,41 93,69 L 97,173
                 C 93,182 82,184 77,177 C 70,188 52,190 44,181 C 34,175 22,181 13,177 C 5,174 2.5,168 3.5,160
                 L 8,69 Q 9,41 25,27 Z"
              fill="url(#silkDrapeGrad-${idx})" stroke="#e6f2ff" stroke-width="1.4" />
        <path d="M 27,28 Q 21,95 16,176 L 26,177 Q 30,96 34,28 Z" fill="rgba(110, 155, 210, 0.35)" />
        <path d="M 65,28 Q 73,96 77,177 L 87,178 Q 82,96 73,28 Z" fill="rgba(90, 138, 198, 0.42)" />
        <path d="M 36,26 Q 34,95 32,175" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2.2" stroke-linecap="round" />
        <path d="M 60,26 Q 64,95 68,178" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.8" stroke-linecap="round" />
        <path d="M 4,162 C 5,170 13,174 22,173 C 32,172 38,176 46,180 C 55,185 70,183 77,174 C 83,180 92,178 96.5,170"
              fill="none" stroke="#ffdf6b" stroke-width="2.0" stroke-linecap="round" />
        <path d="M 25,26.5 Q 50,32.5 75,26.5 L 76,31.5 Q 50,37.5 24,31.5 Z" fill="#f59e0b" stroke="#fde68a" stroke-width="1" />
        <circle cx="50" cy="30.5" r="5.2" fill="#dc2626" stroke="#fde68a" stroke-width="1.2" />
        <g transform="translate(33, 60)">
          <rect x="-2" y="0" width="38" height="72" rx="19" fill="rgba(18, 42, 92, 0.85)" stroke="#ffdf6b" stroke-width="1.8" />
          <rect x="13" y="6" width="8" height="6" rx="1.5" fill="#d9913b" stroke="#fff3b0" stroke-width="0.9"/>
          <path d="M 11,11 L 23,11 L 23,16 Q 31,21 31,29 L 31,61 A 14,4 0 0,1 3,61 L 3,29 Q 3,21 11,16 Z"
                fill="#10299e" stroke="#ffffff" stroke-width="1.6"/>
          <path d="M 4.5,27 L 29.5,27 L 29.5,60 A 12.5,3.5 0 0,1 4.5,60 Z" fill="#2962ff"/>
          <ellipse cx="17" cy="27" rx="12.5" ry="3.2" fill="#82b1ff"/>
          <rect x="23" y="31" width="3" height="24" rx="1.5" fill="rgba(255,255,255,0.45)" />
        </g>
      </g>
    `;
  }

  // 5) 3D 多切面寒冰晶簇底座 (ice_base)
  if (b.special === 'ice_base') {
    overGlassFX += `
      <g>
        <polygon points="3,152 17,136 31,150 48,134 67,149 84,135 97,151 95,197 78,206 22,206 5,197"
                 fill="url(#iceBaseBackGrad-${idx})" stroke="#b8f4ff" stroke-width="1.4" stroke-linejoin="round"/>
        <polygon points="6,162 24,144 41,162 37,202 10,198"
                 fill="url(#iceFacetLeftGrad-${idx})" stroke="#e6fcff" stroke-width="1.4" stroke-linejoin="round"/>
        <polygon points="29,165 51,142 68,164 62,205 33,203"
                 fill="url(#iceFacetMidGrad-${idx})" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="58,162 81,145 95,164 90,199 61,204"
                 fill="url(#iceFacetRightGrad-${idx})" stroke="#d4f9ff" stroke-width="1.4" stroke-linejoin="round"/>
        <polyline points="14,174 24,152 35,172" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
        <polyline points="40,178 51,149 60,176" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.92"/>
        <g transform="translate(50, 182)">
          <circle cx="0" cy="0" r="11.5" fill="#024b78" stroke="#ffffff" stroke-width="1.8" />
          <text x="0" y="4" text-anchor="middle" fill="#b8f8ff" font-size="12" font-weight="900">❄️${b.poursToBreak || 1}</text>
        </g>
      </g>
    `;
  }

  // 6) 3D 全身极地冰雕封印 (full_ice)
  if (b.special === 'full_ice') {
    overGlassFX += `
      <g>
        <path d="M 24,8 L 76,8 L 78,23 L 71,28 Q 91,37 92,58 L 92,195 A 42,11 0 0,1 8,195 L 8,58 Q 9,37 29,28 L 22,23 Z"
              fill="url(#fullIceGrad-${idx})" stroke="#e0faff" stroke-width="2.0" stroke-linejoin="round" opacity="0.84"/>
        <polygon points="12,58 34,32 50,62 28,125 11,110" fill="rgba(255, 255, 255, 0.28)" />
        <polygon points="50,62 72,34 88,60 86,132 56,118" fill="rgba(30, 165, 235, 0.26)" />
        <polygon points="14,122 50,112 44,192 12,186" fill="rgba(220, 250, 255, 0.30)" />
        <polyline points="26,12 34,32 50,62 56,118 44,192" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.88" stroke-linecap="round"/>
        <polyline points="12,60 50,62 88,60" fill="none" stroke="#cff8ff" stroke-width="1.4" opacity="0.8"/>
        <polyline points="12,120 56,118 87,130" fill="none" stroke="#cff8ff" stroke-width="1.4" opacity="0.8"/>
        <path d="M 22,9 Q 36,3 50,7 Q 65,3 78,9 Q 81,16 74,18 Q 62,14 50,19 Q 36,14 25,18 Q 19,15 22,9 Z"
              fill="#ffffff" stroke="#aceeff" stroke-width="1.2" />
        <g transform="translate(50, 102)">
          <circle cx="0" cy="0" r="15" fill="rgba(8, 68, 118, 0.78)" stroke="#ffffff" stroke-width="1.8" />
          <text x="0" y="5" text-anchor="middle" fill="#ffffff" font-size="15" font-weight="900">🧊</text>
        </g>
      </g>
    `;
  }

  // 7) 3D 曜石金纹岩层底座 (stone_base)
  if (b.special === 'stone_base') {
    overGlassFX += `
      <g>
        <polygon points="2,168 18,148 39,158 56,144 77,156 93,146 98,176 92,202 8,202"
                 fill="#594028" stroke="#3b2816" stroke-width="1.4" stroke-linejoin="round"/>
        <polygon points="4,174 19,154 39,165 36,200 8,197" fill="url(#stoneLeftGrad-${idx})" stroke="#4a331d" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="4,174 19,154 28,172 14,182" fill="#ebd6bc" opacity="0.65" />
        <polygon points="28,174 54,152 74,172 67,205 26,202" fill="url(#stoneMidGrad-${idx})" stroke="#3b2816" stroke-width="1.4" stroke-linejoin="round"/>
        <polygon points="28,174 54,152 60,174 38,182" fill="#f5e4ce" opacity="0.58" />
        <polygon points="62,168 86,150 97,175 90,201 64,202" fill="url(#stoneRightGrad-${idx})" stroke="#4a331d" stroke-width="1.3" stroke-linejoin="round"/>
        <polyline points="18,162 25,176 20,192" fill="none" stroke="#ffca28" stroke-width="1.5" stroke-linecap="round"/>
        <polyline points="54,158 49,175 57,194" fill="none" stroke="#ffd54f" stroke-width="1.7" stroke-linecap="round"/>
        <polyline points="82,158 76,176 84,190" fill="none" stroke="#ffca28" stroke-width="1.4" stroke-linecap="round"/>
        <g transform="translate(50, 184)">
          <circle cx="0" cy="0" r="11.5" fill="#3e2723" stroke="#ffd54f" stroke-width="1.8" />
          <text x="0" y="4" text-anchor="middle" fill="#ffe082" font-size="12" font-weight="900">🪨${b.poursToBreak || 1}</text>
        </g>
      </g>
    `;
  }

  // 8) 3D 折痕牛皮纸礼袋包裹 (paper_bag)
  if (b.special === 'paper_bag') {
    overGlassFX += `
      <g>
        <polygon points="9,50 82,53 84,199 7,195" fill="url(#kraftBagGrad-${idx})" stroke="#6e3f14" stroke-width="1.4" stroke-linejoin="round"/>
        <polygon points="82,53 94,46 96,191 84,199" fill="#875120" stroke="#542f0c" stroke-width="1.3" stroke-linejoin="round"/>
        <line x1="88" y1="50" x2="90" y2="195" stroke="#5e340e" stroke-width="1.1" stroke-dasharray="4 3" />
        <polygon points="9,50 15,44 21,50 27,44 33,51 39,45 45,51 51,45 57,52 63,46 69,52 75,46 82,53 94,46 88,41 82,47"
                 fill="#e6b47e" stroke="#78471a" stroke-width="1.1" stroke-linejoin="round"/>
        <line x1="12" y1="54" x2="10" y2="193" stroke="rgba(255, 235, 205, 0.55)" stroke-width="2.0" />
        <line x1="10" y1="115" x2="83" y2="118" stroke="rgba(95, 52, 14, 0.32)" stroke-width="1.3" />
        <line x1="10" y1="116.5" x2="83" y2="119.5" stroke="rgba(255, 230, 195, 0.35)" stroke-width="1.0" />
        <path d="M 9,66 L 82.5,69 L 94.5,62" fill="none" stroke="#b71c1c" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M 9,66 L 82.5,69 L 94.5,62" fill="none" stroke="#ffdf6b" stroke-width="1.2" stroke-dasharray="5 3" stroke-linejoin="round"/>
        <circle cx="46" cy="68" r="7.5" fill="#d32f2f" stroke="#ffdf6b" stroke-width="1.5" />
        <circle cx="46" cy="68" r="4.8" fill="none" stroke="#ffcdd2" stroke-width="0.8" />
        <g transform="translate(31, 88)">
          <rect x="-2" y="0" width="34" height="66" rx="17" fill="rgba(48, 24, 8, 0.78)" stroke="#ffdf6b" stroke-width="1.6" />
          <rect x="11" y="5" width="8" height="5" rx="1.5" fill="#d9913b" stroke="#fff3b0" stroke-width="0.8"/>
          <path d="M 9,10 L 21,10 L 21,15 Q 29,20 29,28 L 29,57 A 14,3.8 0 0,1 1,57 L 1,28 Q 1,20 9,15 Z"
                fill="#870810" stroke="#ffffff" stroke-width="1.6"/>
          <path d="M 2.5,24 L 27.5,24 L 27.5,56 A 12.5,3.2 0 0,1 2.5,56 Z" fill="#eb1c26"/>
          <ellipse cx="15" cy="24" rx="12.5" ry="3.0" fill="#ff8a80"/>
          <rect x="21" y="28" width="3" height="22" rx="1.5" fill="rgba(255,255,255,0.48)" />
        </g>
      </g>
    `;
  }

  if (b.corked) {
    const animP = typeof b.corkAnimProgress === 'number' ? b.corkAnimProgress : 1.0;
    overGlassFX += `<g id="cork-fx-${idx}">${renderRibbonAndDroppingCorkMarkup(idx, animP, neckOffsetY, bBotY)}</g>`;
  }

  return `
    <svg class="bottle-svg" viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${defsHTML}
        <clipPath id="bclip-${idx}">
          <path d="M 34.5,${neckBoreTopY} L 65.5,${neckBoreTopY} L 65,${shoulderTopY} Q 84.5,${shoulderTopY + 7} 84.5,${shoulderBotY} L 84.5,${bBotY} A 34.5,9.0 0 0,1 15.5,${bBotY} L 15.5,${shoulderBotY} Q 15.5,${shoulderTopY + 7} 34,${shoulderTopY} Z" />
        </clipPath>
        <linearGradient id="camBlueFaceGrad-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/><stop offset="65%" stop-color="#e3f3ff"/><stop offset="100%" stop-color="#b3dcff"/>
        </linearGradient>
        <linearGradient id="camPurpleFaceGrad-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#c56bff"/><stop offset="55%" stop-color="#9c3df5"/><stop offset="100%" stop-color="#6b1fb0"/>
        </linearGradient>
        <linearGradient id="silkDrapeGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#b5d3f0"/><stop offset="28%" stop-color="#ffffff"/><stop offset="62%" stop-color="#d8ebff"/><stop offset="100%" stop-color="#7faadc"/>
        </linearGradient>
        <linearGradient id="iceBaseBackGrad-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(130, 235, 255, 0.72)"/><stop offset="100%" stop-color="rgba(20, 130, 210, 0.85)"/>
        </linearGradient>
        <linearGradient id="iceFacetLeftGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(220, 252, 255, 0.9)"/><stop offset="100%" stop-color="rgba(55, 185, 245, 0.82)"/>
        </linearGradient>
        <linearGradient id="iceFacetMidGrad-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(245, 255, 255, 0.94)"/><stop offset="55%" stop-color="rgba(120, 228, 255, 0.88)"/><stop offset="100%" stop-color="rgba(35, 160, 230, 0.9)"/>
        </linearGradient>
        <linearGradient id="iceFacetRightGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(165, 240, 255, 0.85)"/><stop offset="100%" stop-color="rgba(24, 135, 210, 0.88)"/>
        </linearGradient>
        <linearGradient id="fullIceGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#5cd2ff"/><stop offset="32%" stop-color="#dcffff"/><stop offset="68%" stop-color="#8be4ff"/><stop offset="100%" stop-color="#2296db"/>
        </linearGradient>
        <linearGradient id="stoneLeftGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e3c9a8"/><stop offset="60%" stop-color="#b8936a"/><stop offset="100%" stop-color="#7d5a38"/>
        </linearGradient>
        <linearGradient id="stoneMidGrad-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#edd6b8"/><stop offset="50%" stop-color="#c49d71"/><stop offset="100%" stop-color="#6e4b2a"/>
        </linearGradient>
        <linearGradient id="stoneRightGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d4b28c"/><stop offset="100%" stop-color="#694626"/>
        </linearGradient>
        <linearGradient id="kraftBagGrad-${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#e0a970"/><stop offset="35%" stop-color="#cf9155"/><stop offset="85%" stop-color="#ab6e36"/><stop offset="100%" stop-color="#8c5422"/>
        </linearGradient>
      </defs>

      <ellipse cx="50" cy="${bBotY + 11.5}" rx="34" ry="5.5" fill="rgba(2, 6, 20, 0.55)" />
      ${underGlassFX}

      <g mask="url(#dissolve-mask-${idx})" id="bottle-body-wrap-${idx}">
        <path d="M 35,${20 + neckOffsetY} L 65,${20 + neckOffsetY} L 64,${shoulderTopY} Q 86.5,${shoulderTopY + 7} 86.5,${shoulderBotY} L 86.5,${bBotY} A 36.5,9.8 0 0,1 13.5,${bBotY} L 13.5,${shoulderBotY} Q 13.5,${shoulderTopY + 7} 36,${shoulderTopY} Z"
              fill="url(#glassBodyGrad-${idx})" />

        <ellipse cx="50" cy="${bBotY - 0.5}" rx="33.8" ry="8.6"
                 fill="#060c3a" stroke="#184986" stroke-width="1.8" />
        <ellipse cx="50" cy="${bBotY + 0.2}" rx="31.0" ry="7.2"
                 fill="#080f3c" />

        <g clip-path="url(#bclip-${idx})" id="liquid-group-${idx}">
          ${liquidsHTML}
        </g>

        <g clip-path="url(#bclip-${idx})">
          <ellipse cx="31" cy="${40 + neckOffsetY}" rx="15" ry="11" fill="url(#leftShoulderDomeGrad-${idx})" />
          <rect x="17" y="${55 + neckOffsetY}" width="5.5" height="${pillarH}" rx="2.5" fill="url(#leftWallSheen-${idx})" />

          <ellipse class="shoulder-sheen" cx="65" cy="${41.5 + neckOffsetY}" rx="10.5" ry="6.2"
                   transform="rotate(26, 65, ${41.5 + neckOffsetY})"
                   fill="url(#rightShoulderSoftGrad-${idx})" />

          <rect x="67.5" y="${55 + neckOffsetY}" width="11.5" height="${pillarH}" rx="5.5"
                fill="url(#rightPillarSheen-${idx})" filter="url(#glassSheenBlur-${idx})" />
          <line x1="81.5" y1="${57 + neckOffsetY}" x2="81.5" y2="${bBotY - 9}"
                stroke="rgba(185, 218, 255, 0.36)" stroke-width="1.6" stroke-linecap="round" />
          ${insideGlassDecorFX}
        </g>

        <path d="M 13.5,${bBotY - 0.5} A 36.5,9.5 0 0,0 86.5,${bBotY - 0.5} L 86.0,${bBotY + 4.8} A 36.0,10.5 0 0,1 14.0,${bBotY + 4.8} Z"
              fill="url(#baseCushionGrad-${idx})" />
        <path d="M 14.5,${bBotY + 3.8} A 35.5,10.2 0 0,0 85.5,${bBotY + 3.8}"
              fill="none" stroke="#4892d9" stroke-width="2.0" stroke-linecap="round" />
        <path d="M 24,${bBotY + 7.5} A 26,6.2 0 0,0 76,${bBotY + 7.5}"
              fill="none" stroke="#7ec0ff" stroke-width="1.3" stroke-linecap="round" opacity="0.75" />

        <path d="M 35.5,${22.5 + neckOffsetY} L 35.2,${shoulderTopY + 0.5} Q 15.8,${shoulderTopY + 7.5} 15.8,${shoulderBotY} L 15.8,${bBotY - 1} A 34.2,8.8 0 0,0 84.2,${bBotY - 1} L 84.2,${shoulderBotY} Q 84.2,${shoulderTopY + 7.5} 64.8,${shoulderTopY + 0.5} L 64.5,${22.5 + neckOffsetY}"
              fill="none" stroke="#0b2260" stroke-width="2.2" stroke-linejoin="round" opacity="0.85" />

        <path d="M 28.2,${11.5 + neckOffsetY}
                 C 25.5,${15.5 + neckOffsetY} 26.8,${20.8 + neckOffsetY} 33.8,${24.2 + neckOffsetY}
                 Q 35.2,${26.5 + neckOffsetY} 34.0,${shoulderTopY + 0.5}
                 Q 13.5,${shoulderTopY + 7} 13.5,${shoulderBotY}
                 L 13.5,${bBotY}
                 A 36.5,9.8 0 0,0 86.5,${bBotY}
                 L 86.5,${shoulderBotY}
                 Q 86.5,${shoulderTopY + 7} 66.0,${shoulderTopY + 0.5}
                 Q 64.8,${26.5 + neckOffsetY} 66.2,${24.2 + neckOffsetY}
                 C 73.2,${20.8 + neckOffsetY} 74.5,${15.5 + neckOffsetY} 71.8,${11.5 + neckOffsetY}"
              fill="none" stroke="${b.special === 'ad_cam' ? '#d57dff' : maxCap === 8 ? '#70b5ff' : '#4d88e5'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        ${
          currentLevelId === 2
            ? `
          <g transform="translate(50, 184)">
            <rect x="-16" y="-8" width="32" height="14" rx="7" fill="rgba(8, 22, 64, 0.78)" stroke="#7ec0ff" stroke-width="1" />
            <text x="0" y="2.5" text-anchor="middle" fill="#d8eeff" font-size="9.5" font-weight="900">${maxCap}层</text>
          </g>
        `
            : ''
        }

        <g id="neck-group-${idx}" transform="translate(0, ${neckOffsetY})">
          <path d="M 33.8,22.5
                   Q 35.2,26.0 34.5,28.8
                   A 15.8,3.4 0 0,0 65.5,28.8
                   Q 64.8,26.0 66.2,22.5 Z"
                class="neck-dark-bg" fill="#081642" opacity="0.62" />
          <ellipse cx="50" cy="26.8" rx="11.5" ry="1.8" fill="rgba(120, 175, 255, 0.28)" />
          <path d="M 35.2,27.2 A 15,3.0 0 0,0 64.8,27.2"
                fill="none" stroke="${maxCap === 8 ? '#ffdf6b' : '#457bd6'}" stroke-width="${maxCap === 8 ? '1.6' : '1.15'}" opacity="0.9" />

          <path d="M 28.5,11.0
                   C 26.8,15.2 28.0,20.5 33.8,23.2
                   A 17.2,4.2 0 0,0 66.2,23.2
                   C 72.0,20.5 73.2,15.2 71.5,11.0
                   A 21.5,4.4 0 0,1 28.5,11.0 Z"
                class="neck-glass-lip" fill="url(#neckLipGrad-${idx})" opacity="0.64"
                stroke="#3b73cc" stroke-width="1.0" />

          <path d="M 58.5,13.2
                   C 63.0,13.0 65.2,13.5 64.5,17.2
                   C 63.8,20.2 61.5,22.2 57.5,22.6
                   C 58.2,19.5 58.8,16.2 58.5,13.2 Z"
                fill="rgba(225, 242, 255, 0.78)" />
          <path d="M 30.2,12.8
                   C 32.8,13.2 34.2,14.5 34.5,18.2
                   C 34.8,20.8 33.8,21.8 31.8,21.2
                   C 29.8,19.0 29.5,15.5 30.2,12.8 Z"
                fill="rgba(135, 185, 255, 0.56)" />

          <path d="M 33.2,23.0 A 17.5,4.2 0 0,0 66.8,23.0"
                fill="none" stroke="#6ea6f7" stroke-width="1.45" stroke-linecap="round" />

          <ellipse cx="50" cy="11.0" rx="21.2" ry="4.3"
                   fill="url(#neckTopRimGrad-${idx})" opacity="0.72" stroke="#6b9fed" stroke-width="1.0" />
          <path d="M 29.5,11.4 A 20.8,4.1 0 0,0 70.5,11.4"
                fill="none" stroke="#b8d8ff" stroke-width="1.35" stroke-linecap="round" />

          <ellipse cx="50" cy="10.8" rx="11.6" ry="2.3"
                   class="neck-dark-bg" fill="url(#mouthBoreGrad-${idx})" opacity="0.58" stroke="#5c92e6" stroke-width="0.95" />
          <path d="M 39.5,11.2 A 10.8,2.0 0 0,0 60.5,11.2"
                fill="none" stroke="#8cbaff" stroke-width="0.95" stroke-linecap="round" opacity="0.88" />
        </g>
      </g>

      ${overGlassFX}
      <g id="bottle-vfx-${idx}"></g>
    </svg>
  `;
}
