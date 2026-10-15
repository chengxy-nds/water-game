import { ColorKey } from '../types/game';
import { COLORS } from '../constants/colors';
import {
  BOTTLE_INNER_POLY,
  getBottleLayerMetrics,
  getNeckOffsetY,
  getShoulderRxAtY,
  getTransformedContour,
  getChordAtGravityY,
} from './liquidMath';

export interface LiquidLayersMarkupOptions {
  topLayerScale?: number;
  tiltAngle?: number;
  pourDir?: number;
  spillProgress?: number;
  mysteryCount?: number;
  maxCap?: number;
  isGiantCat?: boolean;
  sloshPhase?: number;
  sloshAmplitude?: number;
  currentLevelId?: number;
  revealingLayerIdx?: number;
  revealProgress?: number;
}

export function buildLiquidLayersMarkup(
  layers: ColorKey[],
  idx: number,
  options: LiquidLayersMarkupOptions = {}
): string {
  const {
    topLayerScale = 1,
    tiltAngle = 0,
    pourDir = 1,
    spillProgress = 0,
    mysteryCount = 0,
    maxCap = 4,
    isGiantCat = false,
    sloshPhase = 0,
    sloshAmplitude = 0,
    currentLevelId = 1,
    revealingLayerIdx = -1,
    revealProgress = 1,
  } = options;

  if (layers.length === 0) return '';

  const effectiveLayers = layers.map((c, i) => (i < mysteryCount ? ('mystery_dark' as ColorKey) : c));

  let topSameCount = 1;
  for (let i = effectiveLayers.length - 2; i >= 0; i--) {
    if (effectiveLayers[i] === effectiveLayers[effectiveLayers.length - 1]) topSameCount++;
    else break;
  }
  const baseLayersCount = effectiveLayers.length - topSameCount;

  const groups: { colorKey: ColorKey; amount: number; startLayerIdx: number }[] = [];
  let idxCursor = 0;
  while (idxCursor < baseLayersCount) {
    const cKey = effectiveLayers[idxCursor];
    let cnt = 1;
    while (idxCursor + cnt < baseLayersCount && effectiveLayers[idxCursor + cnt] === cKey) {
      cnt++;
    }
    groups.push({ colorKey: cKey, amount: cnt, startLayerIdx: idxCursor });
    idxCursor += cnt;
  }
  const topAmount = topSameCount * Math.max(0, topLayerScale);
  if (topAmount > 0.005) {
    groups.push({
      colorKey: effectiveLayers[effectiveLayers.length - 1],
      amount: topAmount,
      startLayerIdx: baseLayersCount,
    });
  }
  if (groups.length === 0) return '';

  const totalVolume = groups.reduce((acc, g) => acc + g.amount, 0);
  if (totalVolume <= 0.005) return '';

  const { bottomY, layerH, rx, ry } = getBottleLayerMetrics(maxCap, isGiantCat, currentLevelId);
  const leftX = 50 - rx;
  const rightX = 50 + rx;

  const effectiveTiltDeg = tiltAngle;
  const absTilt = Math.abs(effectiveTiltDeg);

  // ==================== 1. 直立状态（支持触感晃水摇曳波纹） ====================
  if (absTilt < 0.08) {
    let html = '';
    let curY = bottomY;

    const sloshSin = Math.sin(sloshPhase);
    const sloshCos = Math.cos(sloshPhase * 1.35);
    const topTiltY = sloshAmplitude * 7.2 * sloshSin;
    const waveCrest = sloshAmplitude * 4.2 * sloshCos;
    const ryDynamic = ry + sloshAmplitude * 1.8 * sloshCos;

    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const h = g.amount * layerH;
      const yBot = curY;
      const yTop = curY - h;
      curY = yTop;
      const yBotDraw = i === 0 ? yBot + 3.5 : yBot;
      const gradId = g.colorKey === 'mystery_dark' ? `liq-mystery-${idx}` : `liq-${g.colorKey}-${idx}`;

      const isTopGroup = i === groups.length - 1;
      const prevTiltY = i > 0 && sloshAmplitude > 0.01 ? topTiltY * 0.32 * (i / groups.length) : 0;
      const curTiltY = isTopGroup ? topTiltY : topTiltY * 0.32 * ((i + 1) / groups.length);
      const curWave = isTopGroup ? waveCrest : waveCrest * 0.25;

      const yTL = yTop - curTiltY;
      const yTR = yTop + curTiltY;
      const yBL = yBotDraw - prevTiltY;
      const yBR = yBotDraw + prevTiltY;

      if (sloshAmplitude > 0.01 && isTopGroup) {
        html += `
          <path d="M ${leftX},${yTL.toFixed(2)}
                   C ${50 - rx * 0.45},${(yTop - curTiltY * 0.3 + curWave).toFixed(2)} ${50 + rx * 0.45},${(yTop + curTiltY * 0.3 - curWave).toFixed(2)} ${rightX},${yTR.toFixed(2)}
                   L ${rightX},${yBR.toFixed(2)}
                   A ${rx},${ry} 0 0,1 ${leftX},${yBL.toFixed(2)}
                   Z"
                fill="url(#${gradId})" />
        `;
      } else {
        html += `
          <path d="M ${leftX},${yTL.toFixed(2)}
                   L ${rightX},${yTR.toFixed(2)}
                   L ${rightX},${yBR.toFixed(2)}
                   A ${rx},${ry} 0 0,1 ${leftX},${yBL.toFixed(2)}
                   Z"
                fill="url(#${gradId})" />
        `;
      }

      // 当？号盲盒液层正在揭晓颜色时，渲染黑幕消散+流光光环过渡特效
      if (
        revealingLayerIdx >= g.startLayerIdx &&
        revealingLayerIdx < g.startLayerIdx + g.amount &&
        revealProgress < 1
      ) {
        const revYBot = bottomY - revealingLayerIdx * layerH;
        const revYTop = revYBot - layerH;
        const curtainH = layerH * (1 - revealProgress);
        const qScale = 1 + revealProgress * 0.85;
        const qOp = Math.max(0, 1 - revealProgress * 1.4);
        const ringRx = rx * (0.35 + revealProgress * 0.72);
        const ringOp = Math.sin(revealProgress * Math.PI);
        const qCenterY = revYBot - layerH * 0.5 + ry * 0.92;
        html += `
          <path d="M ${leftX},${revYTop.toFixed(2)}
                   L ${rightX},${revYTop.toFixed(2)}
                   L ${rightX},${(revYTop + curtainH).toFixed(2)}
                   A ${rx},${ry} 0 0,1 ${leftX},${(revYTop + curtainH).toFixed(2)} Z"
                fill="url(#liq-mystery-${idx})" opacity="${(1 - revealProgress * 0.75).toFixed(2)}" />
          <ellipse cx="50" cy="${(revYTop + curtainH).toFixed(2)}" rx="${ringRx.toFixed(1)}" ry="${(ry * 0.75).toFixed(1)}"
                   fill="none" stroke="#fff59d" stroke-width="2.6" opacity="${ringOp.toFixed(2)}" />
          <g transform="translate(50, ${qCenterY.toFixed(1)}) scale(${qScale.toFixed(2)})" opacity="${qOp.toFixed(2)}">
            <text x="0" y="0" text-anchor="middle" dominant-baseline="central" fill="#ffffff"
                  font-size="20" font-weight="900" font-family="Arial Rounded MT Bold, Arial Black, sans-serif">?</text>
          </g>
        `;
      }
    }

    // 修复问题7（参考图4 image_ad4600.png）：精确补偿上层液面椭圆下弧(+ry)的视觉遮挡偏移，使白色「?」完美居中于每一格黑雾液层正中央！
    if (mysteryCount > 0) {
      for (let m = 0; m < Math.min(mysteryCount, layers.length); m++) {
        const qCenterY = bottomY - (m + 0.5) * layerH + ry * 0.92 + (m === 0 ? 1.5 : 0);
        html += `
          <g transform="translate(50, ${qCenterY.toFixed(1)})">
            <text x="0" y="0" text-anchor="middle" dominant-baseline="central" fill="#ffffff"
                  font-size="20" font-weight="900" font-family="Arial Rounded MT Bold, Arial Black, sans-serif"
                  style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.92));">?</text>
          </g>
        `;
      }
    }

    const topColorKey = groups[groups.length - 1].colorKey;
    const colTop = COLORS[topColorKey] || COLORS.green;
    const surfaceTiltDeg = (Math.atan2(topTiltY * 2, rx * 2) * 180) / Math.PI;

    const shoulderRx = getShoulderRxAtY(curY, maxCap, isGiantCat, currentLevelId);
    const topRxEff = Math.min(rx + 0.6, shoulderRx + 0.5);
    const topRyEff = ryDynamic * (topRxEff / (rx + 0.6));

    html += `
      <g transform="translate(50, ${curY.toFixed(2)}) rotate(${surfaceTiltDeg.toFixed(2)})">
        <ellipse cx="0" cy="${(waveCrest * 0.22).toFixed(2)}" rx="${topRxEff.toFixed(2)}" ry="${topRyEff.toFixed(2)}"
                 fill="url(#top-${topColorKey}-${idx})" />
        <!-- 参考图5：顶层液面右半侧柔和高光反射斑 -->
        <ellipse cx="${(topRxEff * 0.36).toFixed(2)}" cy="${(waveCrest * 0.22 - 0.5).toFixed(2)}"
                 rx="${(topRxEff * 0.44).toFixed(2)}" ry="${(topRyEff * 0.68).toFixed(2)}"
                 fill="rgba(255, 255, 255, 0.26)" />
        <path d="M ${-(topRxEff - 1.2)},${(0.3 + waveCrest * 0.22).toFixed(2)}
                 A ${topRxEff - 1.2},${(topRyEff - 0.3).toFixed(2)} 0 0,0 ${topRxEff - 1.2},${(0.3 + waveCrest * 0.22).toFixed(2)}"
              fill="none" stroke="${colTop.topLight}" stroke-width="1.25" stroke-linecap="round" opacity="0.88" />
        ${
          sloshAmplitude > 0.04
            ? `
          <ellipse cx="${(sloshSin * 5.5).toFixed(1)}" cy="${(waveCrest * 0.35).toFixed(1)}"
                   rx="${(topRxEff * 0.52 + sloshCos * 4).toFixed(1)}" ry="${(3.2 + Math.abs(sloshSin) * 1.4).toFixed(1)}"
                   fill="none" stroke="${colTop.topLight}" stroke-width="1.0" opacity="${(0.55 * sloshAmplitude).toFixed(2)}" />
        `
            : ''
        }
      </g>
    `;
    return html;
  }

  // ==================== 2. 倾斜状态（真实物理重力液面） ====================
  const rad = (effectiveTiltDeg * Math.PI) / 180;
  const absSin = Math.abs(Math.sin(rad));
  const cosR = Math.cos(rad);
  const tPtsTop = getTransformedContour(rad);

  const neckOffsetY = getNeckOffsetY(maxCap, isGiantCat, currentLevelId);
  const scaleLen = bottomY / 193;
  let yBotGravity = -Infinity;
  for (let i = 0; i < tPtsTop.length; i++) {
    const origP = BOTTLE_INNER_POLY[i];
    if (origP.y >= 28) {
      const clampedY = Math.min(bottomY, origP.y * scaleLen);
      const dx = origP.x - 50;
      const dy = clampedY - 115;
      const gY = 115 + dx * Math.sin(rad) + dy * cosR;
      if (gY > yBotGravity) yBotGravity = gY;
    }
  }

  const neckShoulderY = 26.0 + neckOffsetY;
  const lipOffsetFromCenter = 115 - neckShoulderY;
  const yLipGravity = 115 + 14.0 * absSin - lipOffsetFromCenter * cosR;
  const uprightTotalH = totalVolume * layerH;
  const fullSpillDepth = Math.max(12, yBotGravity - yLipGravity);

  const normVol4 = (totalVolume / maxCap) * 4.0;
  const drainFactor =
    normVol4 < 0.85 ? Math.max(0.12, Math.pow(normVol4 / 0.85, 0.52)) : 1.0;
  const spillTotalH = fullSpillDepth * drainFactor;

  const totalGravityDepth = (1 - spillProgress) * uprightTotalH + spillProgress * spillTotalH;
  const yTopGravity = yBotGravity - totalGravityDepth;

  const SAMPLES = 24;
  const dY = totalGravityDepth / SAMPLES;
  const cumArea = new Float64Array(SAMPLES + 1);
  cumArea[0] = 0;
  for (let s = 1; s <= SAMPLES; s++) {
    const sampleY = yBotGravity - (s - 0.5) * dY;
    const chord = getChordAtGravityY(tPtsTop, sampleY);
    const effWidth = 0.45 * (chord.rx * 2) + 0.55 * 69;
    cumArea[s] = cumArea[s - 1] + effWidth * dY;
  }
  const totalArea = cumArea[SAMPLES] || 1;

  const interpY = (targetA: number) => {
    if (targetA <= 0) return yBotGravity;
    if (targetA >= totalArea) return yTopGravity;
    let lo = 0;
    let hi = SAMPLES;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cumArea[mid] < targetA) lo = mid;
      else hi = mid;
    }
    const span = cumArea[hi] - cumArea[lo] || 1e-6;
    const frac = (targetA - cumArea[lo]) / span;
    return yBotGravity - (lo + frac) * dY;
  };

  const numGroups = groups.length;
  const multiLayerShearFade = numGroups > 1 ? Math.max(0, Math.min(1, (82 - absTilt) / 22)) : 0;
  const interfaces: {
    yG: number;
    shearFactor: number;
    chord: { cx: number; rx: number };
  }[] = [];
  let accVol = 0;
  for (let k = 0; k <= numGroups; k++) {
    const volFrac = k === 0 ? 0 : k === numGroups ? 1 : accVol / totalVolume;
    const areaTarget = volFrac * totalArea;
    const yG = k === 0 ? yBotGravity : k === numGroups ? yTopGravity : interpY(areaTarget);

    const rawShear = k === 0 || k === numGroups ? 1.0 : 0.74 + 0.22 * volFrac;
    const shearFactor = 1.0 - (1.0 - rawShear) * multiLayerShearFade;
    const chord = getChordAtGravityY(tPtsTop, yG);
    interfaces.push({ yG, shearFactor, chord });
    if (k < numGroups) accVol += groups[k].amount;
  }

  let html = '';
  for (let i = 0; i < numGroups; i++) {
    const g = groups[i];
    const lowerIf = interfaces[i];
    const upperIf = interfaces[i + 1];

    const upperRelDeg = (1 - upperIf.shearFactor) * effectiveTiltDeg;
    const lowerRelDeg = (1 - lowerIf.shearFactor) * effectiveTiltDeg;
    const upperTan = Math.tan((upperRelDeg * Math.PI) / 180);
    const lowerTan = Math.tan((lowerRelDeg * Math.PI) / 180);

    const minX = -125;
    const maxX = 225;
    const cxU = upperIf.chord.cx;
    const cxL = lowerIf.chord.cx;

    const yUL = upperIf.yG + (minX - cxU) * upperTan;
    const yUR = upperIf.yG + (maxX - cxU) * upperTan;

    const yBotBase = i === 0 ? lowerIf.yG + 18 : lowerIf.yG;
    const yBL = yBotBase + (minX - cxL) * lowerTan;
    const yBR = yBotBase + (maxX - cxL) * lowerTan;

    const botRx = (maxX - minX) * 0.52;
    const botRy = i === 0 ? 4 : Math.min(11.5, Math.max(7.2, lowerIf.chord.rx * 0.23));
    const gradId = g.colorKey === 'mystery_dark' ? `liq-mystery-${idx}` : `liq-${g.colorKey}-${idx}`;

    html += `
      <path d="M ${minX},${yUL.toFixed(2)}
               L ${maxX},${yUR.toFixed(2)}
               L ${maxX},${yBR.toFixed(2)}
               A ${botRx.toFixed(2)},${botRy.toFixed(2)} ${lowerRelDeg.toFixed(2)} 0,1 ${minX},${yBL.toFixed(2)}
               Z"
            fill="url(#${gradId})" />
    `;
  }

  const topIf = interfaces[numGroups];
  const topChord = topIf.chord;
  const topCx = topChord.cx;
  const topRx = topChord.rx + 0.4;
  const maxRyByDepth = Math.max(6.8, totalGravityDepth * 0.72);
  const topRy = Math.min(10.8, maxRyByDepth, Math.max(7.2, topChord.rx * 0.22));
  const topColorKey = groups[numGroups - 1].colorKey;

  html += `
    <ellipse cx="${topCx.toFixed(2)}" cy="${topIf.yG.toFixed(2)}"
             rx="${topRx.toFixed(2)}" ry="${topRy.toFixed(2)}"
             fill="url(#top-${topColorKey}-${idx})" />
  `;

  return `
    <g transform="rotate(${(-effectiveTiltDeg).toFixed(2)}, 50, 115)">
      ${html}
    </g>
  `;
}

// ==================== 3. 真实抛物线重力水流 + 水面波纹水花飞溅 ====================
export interface GravityStreamContext {
  initialDstLayers?: number;
  moveCount?: number;
  currentTotalLayers?: number;
  dstBottle?: { maxCap?: number; isGiantCat?: boolean } | null;
  neckRootX?: number;
  neckRootY?: number;
}

export function buildGravityStreamSVG(
  spoutX: number,
  spoutY: number,
  mouthX: number,
  mouthY: number,
  surfaceY: number,
  dstRect: DOMRect,
  pourDir: number,
  colKey: ColorKey,
  pourProgress: number,
  splashCtx: GravityStreamContext = {}
): string {
  const colObj = COLORS[colKey] || COLORS.red;
  const {
    initialDstLayers = 0,
    moveCount = 1,
    currentTotalLayers = 0,
    dstBottle = null,
  } = splashCtx;

  const headRatio = Math.min(1, pourProgress / 0.1);
  const tailRatio = pourProgress > 0.9 ? Math.min(1, (pourProgress - 0.9) / 0.1) : 0;

  const totalDrop = Math.max(20, surfaceY - spoutY);
  const yStart = spoutY + totalDrop * (tailRatio * tailRatio * 0.82);
  const yEnd = spoutY + totalDrop * (headRatio * headRatio);
  if (yEnd - yStart < 4) return '';

  const N = 22;
  const leftEdge: { x: number; y: number; halfW: number }[] = [];
  const rightEdge: { x: number; y: number; halfW: number }[] = [];
  const centerCurve: string[] = [];

  const archHeight = Math.max(18, mouthY - spoutY + 12);
  const fluxRadiusBoost = 1 + Math.min(2, moveCount - 1) * 0.1;

  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const y = yStart + (yEnd - yStart) * s;
    const dyFromSpout = Math.max(0, y - spoutY);
    const globalS = Math.max(0, Math.min(1, dyFromSpout / totalDrop));

    let x: number;
    if (dyFromSpout < archHeight) {
      const tArch = dyFromSpout / archHeight;
      const easeArch = Math.sin(tArch * Math.PI * 0.5);
      x = spoutX + (mouthX - spoutX) * easeArch;
    } else {
      x = mouthX;
    }

    const mouthTaper = dyFromSpout < 10 ? 0.58 + 0.42 * (dyFromSpout / 10) : 1.0;
    const halfW =
      (4.2 * fluxRadiusBoost - 0.8 * Math.sqrt(globalS)) *
      mouthTaper *
      (tailRatio > 0 ? 1 - tailRatio * 0.45 : 1);

    leftEdge.push({ x: x - halfW, y, halfW });
    rightEdge.push({ x: x + halfW, y, halfW });
    centerCurve.push(`${(x - halfW * 0.15).toFixed(2)},${y.toFixed(2)}`);
  }

  const firstL = leftEdge[0];
  const firstR = rightEdge[0];
  const lastL = leftEdge[leftEdge.length - 1];

  let streamPath = `M ${firstL.x.toFixed(2)},${firstL.y.toFixed(2)} `;
  streamPath += `Q ${((firstL.x + firstR.x) * 0.5).toFixed(2)},${(firstL.y - 1.2).toFixed(2)} ${firstR.x.toFixed(2)},${firstR.y.toFixed(2)} `;
  for (let i = 1; i < rightEdge.length; i++) {
    streamPath += `L ${rightEdge[i].x.toFixed(2)},${rightEdge[i].y.toFixed(2)} `;
  }
  streamPath += `A ${lastL.halfW.toFixed(2)},${(lastL.halfW * 0.7).toFixed(2)} 0 0,1 ${lastL.x.toFixed(2)},${lastL.y.toFixed(2)} `;
  for (let i = leftEdge.length - 2; i >= 0; i--) {
    streamPath += `L ${leftEdge[i].x.toFixed(2)},${leftEdge[i].y.toFixed(2)} `;
  }
  streamPath += 'Z';

  const highlightPath = 'M ' + centerCurve.join(' L ');

  // ==================== 落水点涟漪、气泡与皇冠飞溅水花 ====================
  let impactFoamHTML = '';
  if (headRatio >= 0.98 && tailRatio < 0.88) {
    const isEmptyBottleStart = initialDstLayers === 0;
    const isMultiUnitPour = moveCount >= 2;
    const buildup = isMultiUnitPour ? 0.88 + 0.38 * Math.sin(pourProgress * Math.PI) : 0.85;
    const intensity = (0.85 + Math.min(2, moveCount - 1) * 0.28) * buildup;

    const w1 = Math.sin(pourProgress * (16 + moveCount * 4)) * (1.1 * intensity);
    const w2 = Math.cos(pourProgress * (18 + moveCount * 4)) * (0.95 * intensity);

    let subWaterFX = '';
    let ripplesFX = '';
    let crownAndBubblesFX = '';
    let airborneDropsFX = '';

    if (!isEmptyBottleStart || currentTotalLayers > 0.55) {
      const maxPoolDepthPx = Math.min(48, currentTotalLayers * 24);
      const plungeDepth = Math.min(maxPoolDepthPx, (isEmptyBottleStart ? 11 : 17) * intensity);

      subWaterFX += `
        <path d="M ${(-3.8 * fluxRadiusBoost).toFixed(1)},1
                 Q ${(-2.2 * fluxRadiusBoost).toFixed(1)},${(plungeDepth * 0.7).toFixed(1)} 0,${plungeDepth.toFixed(1)}
                 Q ${(2.2 * fluxRadiusBoost).toFixed(1)},${(plungeDepth * 0.7).toFixed(1)} ${(3.8 * fluxRadiusBoost).toFixed(1)},1 Z"
              fill="${colObj.topLight}" opacity="0.42" />
      `;

      const bubbleCount = (isEmptyBottleStart ? 2 : 4) + Math.min(2, moveCount - 1) * 3;
      for (let b = 0; b < bubbleCount; b++) {
        const phaseB = (pourProgress * (2.6 + b * 0.35) + b * 0.27) % 1.0;
        const spreadDir = (b % 2 === 0 ? 1 : -1) * (1 + (b % 3) * 0.45);
        const bx = spreadDir * (3.2 + phaseB * 9.5 * intensity) + Math.sin(phaseB * 8 + b) * 1.4;
        const by = 3.0 + (1 - phaseB) * Math.min(maxPoolDepthPx - 3, plungeDepth * 1.35);
        const br = (1.5 + (b % 3) * 0.65) * (1 - phaseB * 0.25);
        subWaterFX += `
          <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${br.toFixed(1)}"
                  fill="${colObj.topLight}" stroke="#ffffff" stroke-width="0.45" opacity="${(0.78 - phaseB * 0.45).toFixed(2)}" />
        `;
      }

      const ripplePhase1 = (pourProgress * 3.2) % 1.0;
      const ripplePhase2 = (pourProgress * 3.2 + 0.5) % 1.0;
      const rxMax = isMultiUnitPour ? 28 : 21;
      ripplesFX += `
        <ellipse cx="0" cy="0.6" rx="${(7 + ripplePhase1 * rxMax).toFixed(1)}" ry="${(1.8 + ripplePhase1 * 5.2).toFixed(1)}"
                 fill="none" stroke="${colObj.topLight}" stroke-width="${(1.3 * (1 - ripplePhase1)).toFixed(2)}"
                 opacity="${(0.75 * (1 - ripplePhase1)).toFixed(2)}" />
        <ellipse cx="0" cy="0.6" rx="${(7 + ripplePhase2 * rxMax).toFixed(1)}" ry="${(1.8 + ripplePhase2 * 5.2).toFixed(1)}"
                 fill="none" stroke="#ffffff" stroke-width="${(1.0 * (1 - ripplePhase2)).toFixed(2)}"
                 opacity="${(0.55 * (1 - ripplePhase2)).toFixed(2)}" />
      `;
    }

    if (isEmptyBottleStart && currentTotalLayers < 0.92) {
      const hardFactor = Math.max(0.15, 1 - currentTotalLayers / 0.95);
      const splashDropCount = 5 + Math.min(2, moveCount - 1) * 4;
      const crownSpread = (12 + Math.min(2, moveCount - 1) * 4.5) * (0.75 + 0.25 * hardFactor);
      const crownHeight = (11 + Math.min(2, moveCount - 1) * 4.0) * (0.75 + 0.25 * hardFactor);

      ripplesFX += `
        <ellipse cx="0" cy="0.8" rx="${(15 + Math.min(2, moveCount - 1) * 4 + Math.abs(w1) * 2.5).toFixed(1)}"
                 ry="${(3.4 + Math.abs(w2) * 0.6).toFixed(1)}"
                 fill="${colObj.topLight}" opacity="${(0.58 * hardFactor).toFixed(2)}" />
        <path d="M -3,0
                 Q ${(-crownSpread * 0.55).toFixed(1)},${(-crownHeight * 0.95 - w1).toFixed(1)} ${(-crownSpread).toFixed(1)},${(-crownHeight * 0.55 + w2).toFixed(1)}
                 Q ${(-crownSpread * 0.65).toFixed(1)},${(-crownHeight * 0.15).toFixed(1)} -2,1 Z"
              fill="${colObj.topLight}" opacity="${(0.88 * hardFactor).toFixed(2)}" />
        <path d="M 3,0
                 Q ${(crownSpread * 0.55).toFixed(1)},${(-crownHeight * 0.95 + w2).toFixed(1)} ${(crownSpread).toFixed(1)},${(-crownHeight * 0.55 - w1).toFixed(1)}
                 Q ${(crownSpread * 0.65).toFixed(1)},${(-crownHeight * 0.15).toFixed(1)} 2,1 Z"
              fill="${colObj.topLight}" opacity="${(0.88 * hardFactor).toFixed(2)}" />
      `;

      for (let d = 0; d < splashDropCount; d++) {
        const tDrop = (pourProgress * (3.8 + d * 0.35) + d * 0.17) % 1.0;
        const side = d % 2 === 0 ? 1 : -1;
        const maxXReach = side * (9 + (d % 3) * 5.2 + Math.min(2, moveCount - 1) * 3.5);
        const peakHeight = (10 + (d % 3) * 4.8 + Math.min(2, moveCount - 1) * 3.8) * (0.7 + 0.3 * hardFactor);
        const dx = maxXReach * (0.25 + 0.75 * tDrop);
        const dy = -Math.sin(tDrop * Math.PI) * peakHeight - 1.5;
        const dr = (1.6 + (d % 2) * 0.65 + Math.min(2, moveCount - 1) * 0.25) * (1 - tDrop * 0.35);
        airborneDropsFX += `
          <circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${dr.toFixed(1)}"
                  fill="${colObj.topLight}" stroke="#ffffff" stroke-width="0.35" opacity="${(0.92 * hardFactor).toFixed(2)}" />
        `;
      }
    }

    const cW = 10.5 * intensity;
    const cH = (9.5 + Math.min(2, moveCount - 1) * 3.2) * buildup;
    crownAndBubblesFX += `
      <path d="M ${(-cW).toFixed(1)},-0.5
               Q ${(-cW * 0.65).toFixed(1)},${(-cH - w1).toFixed(1)} 0,${(-cH * 0.82 + w2).toFixed(1)}
               Q ${(cW * 0.65).toFixed(1)},${(-cH - w2).toFixed(1)} ${cW.toFixed(1)},-0.5 Z"
            fill="${colObj.mid}" />
      <path d="M ${(-cW * 0.7).toFixed(1)},-0.5
               Q 0,${(-cH * 1.12 - w1).toFixed(1)} ${(cW * 0.7).toFixed(1)},-0.5 Z"
            fill="${colObj.topMid}" opacity="0.94" />
    `;

    const bScale = 0.86 + Math.min(2, moveCount - 1) * 0.18;
    crownAndBubblesFX += `
      <g transform="translate(${(-4.6 * bScale + w1 * 0.25).toFixed(1)}, ${(0.8 + w2 * 0.15).toFixed(1)}) scale(${bScale.toFixed(2)})">
        <circle cx="0" cy="0" r="4.1" fill="${colObj.right}" opacity="0.62" />
        <circle cx="0.5" cy="-0.8" r="3.3" fill="${colObj.topMid}" />
        <circle cx="0.9" cy="-1.3" r="2.0" fill="${colObj.topLight}" />
      </g>
      <g transform="translate(${(4.6 * bScale - w2 * 0.25).toFixed(1)}, ${(1.0 - w1 * 0.15).toFixed(1)}) scale(${bScale.toFixed(2)})">
        <circle cx="0" cy="0" r="3.9" fill="${colObj.right}" opacity="0.62" />
        <circle cx="-0.5" cy="-0.8" r="3.1" fill="${colObj.topMid}" />
        <circle cx="-0.9" cy="-1.3" r="1.8" fill="${colObj.topLight}" />
      </g>
    `;

    impactFoamHTML = `
      <g transform="translate(${mouthX.toFixed(2)}, ${surfaceY.toFixed(2)})">
        ${subWaterFX}
        ${ripplesFX}
        ${crownAndBubblesFX}
        ${airborneDropsFX}
      </g>
    `;
  }

  return `
    <defs>
      <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${colObj.left}" />
        <stop offset="35%" stop-color="${colObj.mid}" />
        <stop offset="72%" stop-color="${colObj.highlight}" />
        <stop offset="100%" stop-color="${colObj.right}" />
      </linearGradient>
    </defs>
    <path d="${streamPath}" fill="url(#streamGrad)" />
    <path d="${highlightPath}" fill="none" stroke="${colObj.topLight}" stroke-width="1.3" opacity="0.88" stroke-linecap="round" />
    ${impactFoamHTML}
  `;
}

// ==================== 4. 软木塞加塞形变与螺旋光带粒子 ====================
function hash01(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function renderIkeaWoodCorkSVG(idx: number, isSeated = true): string {
  return `
    <g>
      <path d="M 38.5,12.5 L 61.5,12.5 L 57.2,28.5 A 7.5,2.2 0 0,1 42.8,28.5 Z"
            fill="url(#ikeaCorkPlugGrad-${idx})" opacity="0.90" />
      ${
        isSeated
          ? `
        <path d="M 28.5,11.0
                 C 26.8,15.2 28.0,20.5 33.8,23.2
                 A 17.2,4.2 0 0,0 66.2,23.2
                 C 72.0,20.5 73.2,15.2 71.5,11.0
                 A 21.5,4.4 0 0,0 28.5,11.0 Z"
              fill="url(#neckLipGrad-${idx})" opacity="0.56" />
        <path d="M 33.2,23.0 A 17.5,4.2 0 0,0 66.8,23.0"
              fill="none" stroke="#6ea6f7" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />
      `
          : ''
      }
      <path d="M 34.2,5.2
               L 36.5,13.0
               A 13.8,3.0 0 0,0 63.5,13.0
               L 65.8,5.2
               A 15.8,3.4 0 0,1 34.2,5.2 Z"
            fill="url(#ikeaCorkSideGrad-${idx})" stroke="#b88b58" stroke-width="0.85" />
      <ellipse cx="50" cy="5.2" rx="15.8" ry="3.4"
               fill="url(#ikeaCorkTopGrad-${idx})" stroke="#f7e7ce" stroke-width="0.8" />
      <ellipse cx="50" cy="5.1" rx="9.8" ry="1.8"
               fill="none" stroke="#c99c68" stroke-width="0.65" opacity="0.55" />
      <path d="M 36.5,6.6 A 13.8,2.8 0 0,0 63.5,6.6"
            fill="none" stroke="#fff9ed" stroke-width="1.0" stroke-linecap="round" opacity="0.82" />
      <circle cx="43.5" cy="9.2" r="0.75" fill="#a87948" opacity="0.55" />
      <circle cx="54.8" cy="10.2" r="0.9" fill="#a87948" opacity="0.5" />
      <circle cx="48.5" cy="11.2" r="0.65" fill="#a87948" opacity="0.45" />
      <line x1="41.5" y1="7.5" x2="42.2" y2="12.0" stroke="#b88854" stroke-width="0.7" opacity="0.45" stroke-linecap="round" />
      <line x1="57.8" y1="7.2" x2="57.0" y2="11.8" stroke="#b88854" stroke-width="0.7" opacity="0.45" stroke-linecap="round" />
      ${
        isSeated
          ? `
        <path d="M 29.5,11.4 A 20.8,4.1 0 0,0 70.5,11.4"
              fill="none" stroke="#b8d8ff" stroke-width="1.35" stroke-linecap="round" opacity="0.9" />
      `
          : ''
      }
    </g>
  `;
}

export function renderRibbonAndDroppingCorkMarkup(
  idx: number,
  animP = 0.0,
  neckOffsetY = 0,
  bBotY = 193,
  useSpiral = true
): string {
  let fx = `<g transform="translate(0, ${neckOffsetY})">`;

  if (animP < 0.18) {
    const t = animP / 0.18;
    const easeIn = t * t * t;
    const corkY = -88 * (1 - easeIn);
    const stretchY = 1 + 0.18 * t;
    const scaleX = 1 - 0.06 * t;
    fx += `
      <rect x="37" y="${(corkY - 22).toFixed(1)}" width="26" height="22" rx="8"
            fill="rgba(245, 226, 196, ${(0.35 * t).toFixed(2)})" />
      <g transform="translate(50, ${corkY.toFixed(1)}) scale(${scaleX.toFixed(3)}, ${stretchY.toFixed(3)}) translate(-50, 0)">
        ${renderIkeaWoodCorkSVG(idx, false)}
      </g>
    `;
  } else {
    let impactOffsetY = 0;
    let impactScaleX = 1;
    let impactScaleY = 1;

    if (animP < 0.38) {
      const hitP = (animP - 0.18) / 0.2;
      const squash = Math.sin(hitP * Math.PI * 2.2) * Math.exp(-3.2 * hitP);
      impactOffsetY = squash * 5.2;
      impactScaleX = 1 + squash * 0.11;
      impactScaleY = 1 - squash * 0.14;

      const shockP = Math.min(1, hitP * 1.4);
      const shockRx = 18 + shockP * 26;
      const shockRy = 4 + shockP * 5;
      const shockOp = Math.max(0, (1 - shockP) * 0.9);
      fx += `
        <ellipse cx="50" cy="11.5" rx="${shockRx.toFixed(1)}" ry="${shockRy.toFixed(1)}"
                 fill="none" stroke="#ffffff" stroke-width="${(3.2 * (1 - shockP)).toFixed(2)}"
                 opacity="${shockOp.toFixed(2)}" />
      `;
    }

    fx += `
      <g transform="translate(50, ${(11.5 + impactOffsetY).toFixed(2)}) scale(${impactScaleX.toFixed(3)}, ${impactScaleY.toFixed(3)}) translate(-50, -11.5)">
        ${renderIkeaWoodCorkSVG(idx, true)}
      </g>
    `;

    if (useSpiral && animP >= 0.26) {
      const swirlP = Math.min(1, (animP - 0.26) / 0.74);
      const botY = bBotY + 5 - neckOffsetY;
      const frontY = botY - swirlP * (botY - 8);
      const tailY = Math.min(botY + 4, frontY + 95);

      fx += `<g style="filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.9));">`;

      const buildSpiralRibbon = (phaseOffset: number) => {
        const N = 26;
        const leftPts: string[] = [];
        const rightPts: string[] = [];
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const y = tailY - (tailY - frontY) * u;
          const globalHeightFrac = (botY - y) / Math.max(40, botY - 10);
          const theta = globalHeightFrac * Math.PI * 3.6 - swirlP * Math.PI * 5.0 + phaseOffset;
          const radiusX = y < 38 ? 16 + (y - 10) * 0.78 : 38;
          const x = 50 + Math.sin(theta) * radiusX;
          const halfW = Math.sin(u * Math.PI) * 3.8;
          leftPts.push(`${(x - halfW).toFixed(1)},${y.toFixed(1)}`);
          rightPts.push(`${(x + halfW).toFixed(1)},${y.toFixed(1)}`);
        }
        return `M ${leftPts.join(' L ')} L ${rightPts.reverse().join(' L ')} Z`;
      };

      fx += `<path d="${buildSpiralRibbon(0)}" fill="#ffffff" opacity="0.95" />`;
      fx += `<path d="${buildSpiralRibbon(Math.PI)}" fill="#fff5cc" opacity="0.88" />`;

      for (let p = 0; p < 95; p++) {
        const u1 = hash01(p * 3 + 1);
        const u2 = hash01(p * 3 + 2);
        const u3 = hash01(p * 3 + 3);
        const py = tailY + 10 - u1 * (tailY - frontY + 22);
        if (py >= 4 && py <= botY + 6) {
          const hFrac = (botY - py) / Math.max(40, botY - 10);
          const ang =
            hFrac * Math.PI * 3.6 - swirlP * Math.PI * 5.0 + (p % 2) * Math.PI + (u2 - 0.5) * 1.4;
          const radX = (py < 38 ? 16 + (py - 10) * 0.78 : 38) + (u3 - 0.5) * 16;
          const px = 50 + Math.sin(ang) * radX;
          const pr = 0.65 + (p % 4) * 0.45;
          const op = Math.sin(u1 * Math.PI) * (0.55 + 0.45 * u3);
          const pCol = p % 3 === 0 ? '#ffe885' : '#ffffff';
          fx += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(2)}" fill="${pCol}" opacity="${op.toFixed(2)}" />`;
        }
      }

      if (swirlP > 0.15) {
        const ringRx = frontY < 38 ? 19 : 37;
        fx += `
          <ellipse cx="50" cy="${frontY.toFixed(1)}" rx="${ringRx}" ry="6.5"
                   fill="rgba(255, 255, 255, 0.35)" stroke="#ffffff" stroke-width="2.0" />
        `;
      }
      fx += `</g>`;
    }
  }

  fx += `</g>`;
  return fx;
}
