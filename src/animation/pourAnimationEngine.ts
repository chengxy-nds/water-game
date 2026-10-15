import { Bag, Bottle, ColorDef, ColorKey } from '../types/game';
import { COLORS } from '../constants/colors';
import { audioEngine } from '../audio/audioEngine';
import {
  getBottleLayerMetrics,
  getNeckOffsetY,
  getPhysicalSpillAngleDeg,
} from '../physics/liquidMath';
import {
  buildLiquidLayersMarkup,
  buildGravityStreamSVG,
  renderRibbonAndDroppingCorkMarkup,
  renderIkeaWoodCorkSVG,
} from '../physics/liquidMarkup';

function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 倒水瓶星芒光效渲染器（彻底移除不规则斜向多边形灰白块，对齐 demo/index.html Section 8B）
export function buildBottleMoveTrailSVG(
  startCenterX: number,
  startCenterY: number,
  curCenterX: number,
  curCenterY: number,
  bottleW: number,
  bottleH: number,
  curDeg: number,
  colObj: ColorDef,
  animTimeSec: number,
  intensity = 1.0
): string {
  if (intensity <= 0.02) return '';
  const dx = curCenterX - startCenterX;
  const dy = curCenterY - startCenterY;
  const dist = Math.hypot(dx, dy);
  const dirX = dist > 4 ? dx / dist : 1;

  const rad = (curDeg * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const hw = bottleW * 0.44;
  const hh = bottleH * 0.36;

  let html = '';

  for (let i = 0; i < 16; i++) {
    const u1 = hash01(i * 7 + 1);
    const u2 = hash01(i * 7 + 3);
    const side = i % 2 === 0 ? -1 : 1;
    const phase = (animTimeSec * (2.0 + (i % 4) * 0.4) + u1) % 1.0;
    const localY = (u2 - 0.48) * hh * 1.65;
    const localX = side * (hw + 4 + phase * 13) - dirX * phase * 14;

    const px = curCenterX + localX * cosA - localY * sinA;
    const py = curCenterY + localX * sinA + localY * cosA;
    const pr = (1.2 + (i % 3) * 0.95) * (1 - phase * 0.45) * intensity;
    const pOp = Math.sin(phase * Math.PI) * 0.9 * intensity;
    const pCol = i % 3 === 0 ? '#fde047' : i % 3 === 1 ? colObj.topLight : '#ffffff';

    html += `
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(2)}"
              fill="${pCol}" opacity="${pOp.toFixed(2)}" />
    `;
  }

  return html;
}

export interface BottleVFExtraOpts {
  layerIdx?: number;
  colorKey?: ColorKey;
  fullBody?: boolean;
  coverType?: string;
  duration?: number;
}

// 特殊瓶揭晓/破冰/碎石/掀布过渡特效引擎（对齐 demo/index.html Section 8）
export function triggerBottleVFX(
  bottleIdx: number,
  vfxType: 'mystery_reveal' | 'ice_shatter' | 'stone_shatter' | 'cover_unveil',
  extraOpts: BottleVFExtraOpts = {}
) {
  const startT = performance.now();
  const dur = extraOpts.duration || 540;

  function stepVFX(now: number) {
    const vfxEl = document.getElementById(`bottle-vfx-${bottleIdx}`);
    if (!vfxEl) return;
    const p = Math.min(1, (now - startT) / dur);
    const easeOut = 1 - Math.pow(1 - p, 3);
    const fade = Math.max(0, 1 - Math.pow(p, 1.6));

    let html = '';

    if (vfxType === 'mystery_reveal') {
      const layerIdx = typeof extraOpts.layerIdx === 'number' ? extraOpts.layerIdx : 1;
      const colorKey = extraOpts.colorKey || 'green';
      const col = COLORS[colorKey] || COLORS.green;
      const { bottomY, layerH, rx } = getBottleLayerMetrics(4, false);
      const cy = bottomY - layerIdx * layerH - layerH * 0.45;

      const mistOp = Math.max(0, (1 - p * 1.35) * 0.88);
      if (mistOp > 0.01) {
        html += `
          <rect x="${(50 - rx).toFixed(1)}" y="${(bottomY - (layerIdx + 1) * layerH).toFixed(1)}"
                width="${(rx * 2).toFixed(1)}" height="${layerH.toFixed(1)}"
                rx="4" fill="#090c16" opacity="${mistOp.toFixed(2)}" />
        `;
      }

      const ringRx = 10 + easeOut * (rx + 12);
      const ringRy = 4 + easeOut * 11;
      html += `
        <ellipse cx="50" cy="${cy.toFixed(1)}" rx="${ringRx.toFixed(1)}" ry="${ringRy.toFixed(1)}"
                 fill="none" stroke="${col.topLight}" stroke-width="${(3.8 * fade).toFixed(2)}" opacity="${fade.toFixed(2)}" />
        <ellipse cx="50" cy="${cy.toFixed(1)}" rx="${(ringRx * 0.72).toFixed(1)}" ry="${(ringRy * 0.72).toFixed(1)}"
                 fill="${col.topLight}" opacity="${(0.45 * fade).toFixed(2)}" />
      `;

      const qScale = p < 0.35 ? 1 + (p / 0.35) * 0.65 : 1.65 * (1 - (p - 0.35) / 0.65);
      const qRot = p * 38;
      const qY = cy + 6 - easeOut * 22;
      html += `
        <g transform="translate(50, ${qY.toFixed(1)}) rotate(${qRot.toFixed(1)}) scale(${Math.max(0.05, qScale).toFixed(2)})"
           opacity="${fade.toFixed(2)}">
          <text x="0" y="0" text-anchor="middle" fill="#fef08a" font-size="24" font-weight="900"
                style="filter: drop-shadow(0 0 8px ${col.topLight});">?</text>
        </g>
      `;

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 + 0.3;
        const dist = 8 + easeOut * 34 * (0.7 + 0.3 * (i % 3));
        const px = 50 + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist * 0.65 - easeOut * 14;
        const pr = (2.2 + (i % 3) * 0.9) * fade;
        const pColor = i % 2 === 0 ? '#fde047' : col.topLight;
        html += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(2)}" fill="${pColor}" opacity="${fade.toFixed(2)}" />`;
      }
    } else if (vfxType === 'ice_shatter') {
      const cy = extraOpts.fullBody ? 115 : 172;
      const ringRx = 16 + easeOut * 42;
      html += `
        <ellipse cx="50" cy="${cy}" rx="${ringRx.toFixed(1)}" ry="${(ringRx * 0.32).toFixed(1)}"
                 fill="none" stroke="#bae6fd" stroke-width="${(3.5 * fade).toFixed(2)}" opacity="${fade.toFixed(2)}" />
      `;
      const shardCount = extraOpts.fullBody ? 16 : 11;
      for (let i = 0; i < shardCount; i++) {
        const seedA = (i / shardCount) * Math.PI * 2 + 0.2;
        const vx = Math.cos(seedA) * (26 + (i % 4) * 11);
        const vy = Math.sin(seedA) * 18 - 22;
        const gravityY = 48 * p * p;
        const sx = 50 + vx * easeOut;
        const sy = (extraOpts.fullBody ? 55 + (i % 5) * 28 : 170) + vy * easeOut + gravityY;
        const rot = (i % 2 === 0 ? 1 : -1) * p * (140 + i * 18);
        const sScale = (0.85 + (i % 3) * 0.25) * fade;
        const shardCol = i % 3 === 0 ? '#e0f2fe' : i % 3 === 1 ? '#7dd3fc' : '#38bdf8';
        html += `
          <g transform="translate(${sx.toFixed(1)}, ${sy.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sScale.toFixed(2)})"
             opacity="${fade.toFixed(2)}">
            <polygon points="0,-8 7,-2 4,7 -5,6 -7,-3" fill="${shardCol}" stroke="#ffffff" stroke-width="0.9" />
          </g>
        `;
      }
    } else if (vfxType === 'stone_shatter') {
      const cy = 178;
      for (let c = 0; c < 6; c++) {
        const cAng = (c / 6) * Math.PI * 2;
        const cx = 50 + Math.cos(cAng) * easeOut * 34;
        const cY = cy + Math.sin(cAng) * easeOut * 12 - easeOut * 8;
        const cr = (8 + easeOut * 12) * fade;
        html += `<circle cx="${cx.toFixed(1)}" cy="${cY.toFixed(1)}" r="${cr.toFixed(1)}" fill="rgba(231, 203, 169, ${(0.45 * fade).toFixed(2)})" />`;
      }
      for (let i = 0; i < 10; i++) {
        const seedA = (i / 10) * Math.PI * 2 + 0.4;
        const vx = Math.cos(seedA) * (28 + (i % 3) * 12);
        const vy = Math.sin(seedA) * 14 - 26;
        const gravityY = 58 * p * p;
        const sx = 50 + vx * easeOut;
        const sy = cy + vy * easeOut + gravityY;
        const rot = (i % 2 === 0 ? 1 : -1) * p * 165;
        const rScale = (0.85 + (i % 3) * 0.22) * fade;
        const rockCol = i % 2 === 0 ? '#e7cba9' : '#cfa67e';
        html += `
          <g transform="translate(${sx.toFixed(1)}, ${sy.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${rScale.toFixed(2)})"
             opacity="${fade.toFixed(2)}">
            <polygon points="-6,-6 5,-7 8,2 2,7 -7,5" fill="${rockCol}" stroke="#785230" stroke-width="1.0" />
          </g>
        `;
      }
    } else if (vfxType === 'cover_unveil') {
      const liftY = -easeOut * 95;
      const scaleX = 1 + easeOut * 0.16;
      const isSilk = extraOpts.coverType === 'silk_drape';
      const fillCol = isSilk ? 'rgba(219, 234, 254, 0.78)' : 'rgba(223, 168, 114, 0.78)';
      const strokeCol = isSilk ? '#ffffff' : '#f5d0a9';
      html += `
        <g transform="translate(50, ${(105 + liftY).toFixed(1)}) scale(${scaleX.toFixed(2)}, ${(1 - p * 0.35).toFixed(2)}) translate(-50, -105)"
           opacity="${fade.toFixed(2)}">
          <path d="M 12,35 Q 50,20 88,35 L 92,165 Q 50,180 8,165 Z"
                fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.5" />
        </g>
      `;
      for (let s = 0; s < 10; s++) {
        const ang = (s / 10) * Math.PI * 2;
        const sx = 50 + Math.cos(ang) * (14 + easeOut * 32);
        const sy = 105 + Math.sin(ang) * (24 + easeOut * 36) - easeOut * 25;
        html += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(2.6 * fade).toFixed(1)}" fill="#fef08a" opacity="${fade.toFixed(2)}" />`;
      }
    }

    vfxEl.innerHTML = html;
    if (p < 1) {
      requestAnimationFrame(stepVFX);
    } else {
      vfxEl.innerHTML = '';
    }
  }

  requestAnimationFrame(stepVFX);
}

export interface PourAnimationParams {
  srcIdx: number;
  dstIdx: number;
  bottles: Bottle[];
  bags: Bag[];
  moveCount: number;
  pourColor: ColorKey;
  gridEl: HTMLElement;
  bagsStageEl: HTMLElement | null;
  fxOverlayEl: SVGSVGElement;
  currentLevelId: number;
  hasBags: boolean;
  onFinish: (result: {
    srcIdx: number;
    dstIdx: number;
    moveCount: number;
    pourColor: ColorKey;
    isDstCompleted: boolean;
    wasGiantCat: boolean;
    targetBagIdx: number;
    revealedMysteryLayerIdx?: number;
    revealedMysteryColor?: ColorKey | null;
    brokenSpecials?: { bIdx: number; type: string; wasIce?: boolean }[];
  }) => void;
}

export function performLiquidPourAnimation(params: PourAnimationParams) {
  const {
    srcIdx,
    dstIdx,
    bottles,
    bags,
    moveCount,
    pourColor,
    gridEl,
    bagsStageEl,
    fxOverlayEl,
    currentLevelId,
    hasBags,
    onFinish,
  } = params;

  const srcBottle = bottles[srcIdx];
  const dstBottle = bottles[dstIdx];
  const srcEl = gridEl.children[srcIdx] as HTMLElement;
  const dstEl = gridEl.children[dstIdx] as HTMLElement;

  if (!srcBottle || !dstBottle || !srcEl || !dstEl) {
    onFinish({
      srcIdx,
      dstIdx,
      moveCount,
      pourColor,
      isDstCompleted: false,
      wasGiantCat: false,
      targetBagIdx: 0,
    });
    return;
  }

  const srcCap = srcBottle.maxCap || 4;
  const dstCap = dstBottle.maxCap || 4;

  const srcRect = srcEl.getBoundingClientRect();
  const dstRect = dstEl.getBoundingClientRect();

  const pourDir = dstRect.left >= srcRect.left ? 1 : -1;

  srcEl.classList.add('pouring-source');
  dstEl.classList.add('pouring-target');

  const { vbMinX: srcVbMinX, vbMinY: srcVbMinY, vbW: srcVbW, vbH: srcVbH } =
    getBottleLayerMetrics(srcCap, !!srcBottle.isGiantCat, currentLevelId);
  const {
    bottomY: dstBotY,
    layerH: dstLayerH,
    vbMinX: dstVbMinX,
    vbMinY: dstVbMinY,
    vbW: dstVbW,
    vbH: dstVbH,
  } = getBottleLayerMetrics(dstCap, !!dstBottle.isGiantCat, currentLevelId);

  const srcNeckOffsetY = getNeckOffsetY(srcCap, !!srcBottle.isGiantCat, currentLevelId);
  const dstNeckOffsetY = getNeckOffsetY(dstCap, !!dstBottle.isGiantCat, currentLevelId);

  const initialDstLayers = dstBottle.layers.length;
  const dstFullLayers = [...dstBottle.layers, ...Array(moveCount).fill(pourColor)];

  let srcTopSameCount = 0;
  for (let i = srcBottle.layers.length - 1; i >= 0; i--) {
    if (srcBottle.layers[i] === pourColor) srcTopSameCount++;
    else break;
  }
  srcTopSameCount = Math.max(1, srcTopSameCount);

  const dstInitialScale = initialDstLayers === 0 ? 0.001 : 1.0;

  const pivotSvgX = 50 + pourDir * 12.0;
  const pivotSvgY = 12.5 + srcNeckOffsetY;
  const pivotXRatio = (pivotSvgX - srcVbMinX) / srcVbW;
  const pivotYRatio = (pivotSvgY - srcVbMinY) / srcVbH;
  srcEl.style.transformOrigin = `${(pivotXRatio * 100).toFixed(2)}% ${(pivotYRatio * 100).toFixed(2)}%`;

  const srcLipX = srcRect.left + srcRect.width * pivotXRatio;
  const srcLipY = srcRect.top + srcRect.height * pivotYRatio;

  const dstMouthX = dstRect.left + dstRect.width * ((50 - dstVbMinX) / dstVbW);
  const dstMouthY = dstRect.top + dstRect.height * ((11.5 + dstNeckOffsetY - dstVbMinY) / dstVbH);

  const targetLipX = dstMouthX - pourDir * 1.0;
  const targetLipY = dstMouthY - 6.0;

  const targetTranslateX = targetLipX - srcLipX;
  const targetTranslateY = targetLipY - srcLipY;

  const startVol = srcBottle.layers.length;
  const endVol = srcBottle.layers.length - moveCount;
  const startTiltDeg = pourDir * getPhysicalSpillAngleDeg(startVol, srcCap);
  const endTiltDeg = pourDir * getPhysicalSpillAngleDeg(endVol, srcCap);

  const srcLiquidGroup = document.getElementById(`liquid-group-${srcIdx}`);
  const dstLiquidGroup = document.getElementById(`liquid-group-${dstIdx}`);

  const startCenterX = srcRect.left + srcRect.width * 0.5;
  const startCenterY = srcRect.top + srcRect.height * 0.5;

  function getTiltedBottleCenter(transX: number, transY: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    const dxFromPivot = (0.5 - pivotXRatio) * srcRect.width;
    const dyFromPivot = (0.5 - pivotYRatio) * srcRect.height;
    const curPivotX = srcLipX + transX;
    const curPivotY = srcLipY + transY;
    const cx = curPivotX + dxFromPivot * Math.cos(rad) - dyFromPivot * Math.sin(rad);
    const cy = curPivotY + dxFromPivot * Math.sin(rad) + dyFromPivot * Math.cos(rad);
    return { cx, cy };
  }

  const moveDuration = 260;
  const pourDuration = 460 + (moveCount - 1) * 105;
  const returnDuration = 240;
  const startTime = performance.now();
  let soundPlayed = false;
  const colObj = COLORS[pourColor] || COLORS.green;

  function step(now: number) {
    const elapsed = now - startTime;
    const animTimeSec = elapsed / 1000;

    // ---------- 阶段 1：平滑飞向目标瓶口上方咬合 (260ms) ----------
    if (elapsed < moveDuration) {
      const p = elapsed / moveDuration;
      const ease = 1 - Math.pow(1 - p, 3);
      const curX = targetTranslateX * ease;
      const curY = targetTranslateY * ease;
      const curDeg = startTiltDeg * ease;

      srcEl.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px) rotate(${curDeg.toFixed(2)}deg)`;
      if (srcLiquidGroup) {
        srcLiquidGroup.innerHTML = buildLiquidLayersMarkup(srcBottle.layers, srcIdx, {
          topLayerScale: 1,
          tiltAngle: curDeg,
          pourDir,
          spillProgress: ease,
          mysteryCount: srcBottle.mysteryCount || 0,
          maxCap: srcCap,
          isGiantCat: !!srcBottle.isGiantCat,
          currentLevelId,
        });
      }

      const bCenter = getTiltedBottleCenter(curX, curY, curDeg);
      fxOverlayEl.innerHTML = buildBottleMoveTrailSVG(
        startCenterX,
        startCenterY,
        bCenter.cx,
        bCenter.cy,
        srcRect.width,
        srcRect.height,
        curDeg,
        colObj,
        animTimeSec,
        Math.sin(p * Math.PI * 0.5)
      );

      requestAnimationFrame(step);

      // ---------- 阶段 2：倾斜注水，水流与重力液体冲击 ----------
    } else if (elapsed < moveDuration + pourDuration) {
      if (!soundPlayed) {
        soundPlayed = true;
        audioEngine.playPour({
          maxCap: dstCap,
          isGiantCat: !!dstBottle.isGiantCat,
          initialLayers: initialDstLayers,
          moveCount,
          durationMs: pourDuration,
        });
      }

      const p = (elapsed - moveDuration) / pourDuration;
      const curRemainingVol = startVol - moveCount * p;
      const curDeg = pourDir * getPhysicalSpillAngleDeg(curRemainingVol, srcCap);

      srcEl.style.transform = `translate(${targetTranslateX.toFixed(2)}px, ${targetTranslateY.toFixed(2)}px) rotate(${curDeg.toFixed(2)}deg)`;

      const srcEndScale = (srcTopSameCount - moveCount) / srcTopSameCount;
      const curSrcScale = 1 - (1 - srcEndScale) * p;
      if (srcLiquidGroup) {
        srcLiquidGroup.innerHTML = buildLiquidLayersMarkup(srcBottle.layers, srcIdx, {
          topLayerScale: curSrcScale,
          tiltAngle: curDeg,
          pourDir,
          spillProgress: 1,
          mysteryCount: srcBottle.mysteryCount || 0,
          maxCap: srcCap,
          isGiantCat: !!srcBottle.isGiantCat,
          currentLevelId,
        });
      }

      const fillP = Math.max(0, Math.min(1, (p - 0.08) / 0.92));
      const curDstScale = dstInitialScale + (1 - dstInitialScale) * fillP;
      if (dstLiquidGroup) {
        dstLiquidGroup.innerHTML = buildLiquidLayersMarkup(dstFullLayers, dstIdx, {
          topLayerScale: curDstScale,
          tiltAngle: 0,
          mysteryCount: dstBottle.mysteryCount || 0,
          maxCap: dstCap,
          isGiantCat: !!dstBottle.isGiantCat,
          currentLevelId,
        });
      }

      const currentTotalLayers = initialDstLayers + moveCount * fillP;
      const svgSurfaceY = dstBotY - currentTotalLayers * dstLayerH;
      const screenSurfaceY = dstRect.top + ((svgSurfaceY - dstVbMinY) / dstVbH) * dstRect.height;

      const spoutStartX = dstMouthX;
      const spoutStartY = targetLipY - 1.5;

      const bCenter = getTiltedBottleCenter(targetTranslateX, targetTranslateY, curDeg);
      const trailHTML = buildBottleMoveTrailSVG(
        startCenterX,
        startCenterY,
        bCenter.cx,
        bCenter.cy,
        srcRect.width,
        srcRect.height,
        curDeg,
        colObj,
        animTimeSec,
        0.92
      );

      const streamHTML = buildGravityStreamSVG(
        spoutStartX,
        spoutStartY,
        dstMouthX,
        dstMouthY,
        screenSurfaceY + 2,
        dstRect,
        pourDir,
        pourColor,
        p,
        {
          initialDstLayers,
          moveCount,
          currentTotalLayers,
          dstBottle,
          neckRootX: spoutStartX,
          neckRootY: spoutStartY,
        }
      );

      fxOverlayEl.innerHTML = trailHTML + streamHTML;
      requestAnimationFrame(step);

      // ---------- 阶段 3：平滑回正飞回原位 (240ms) ----------
    } else if (elapsed < moveDuration + pourDuration + returnDuration) {
      const p = (elapsed - moveDuration - pourDuration) / returnDuration;
      const ease = 1 - Math.pow(1 - p, 3);
      const curX = targetTranslateX * (1 - ease);
      const curY = targetTranslateY * (1 - ease);
      const curDeg = endTiltDeg * (1 - ease);

      srcEl.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px) rotate(${curDeg.toFixed(2)}deg)`;

      const remainingSrcLayers = srcBottle.layers.slice(0, srcBottle.layers.length - moveCount);
      const nextSrcMystery = Math.min(
        srcBottle.mysteryCount || 0,
        Math.max(0, remainingSrcLayers.length - 1)
      );
      if (srcLiquidGroup) {
        srcLiquidGroup.innerHTML = buildLiquidLayersMarkup(remainingSrcLayers, srcIdx, {
          topLayerScale: 1,
          tiltAngle: curDeg,
          pourDir,
          spillProgress: 1 - ease,
          mysteryCount: nextSrcMystery,
          maxCap: srcCap,
          isGiantCat: !!srcBottle.isGiantCat,
          currentLevelId,
        });
      }

      if (dstLiquidGroup) {
        dstLiquidGroup.innerHTML = buildLiquidLayersMarkup(dstFullLayers, dstIdx, {
          topLayerScale: 1,
          tiltAngle: 0,
          mysteryCount: dstBottle.mysteryCount || 0,
          maxCap: dstCap,
          isGiantCat: !!dstBottle.isGiantCat,
          currentLevelId,
        });
      }

      const bCenter = getTiltedBottleCenter(curX, curY, curDeg);
      fxOverlayEl.innerHTML = buildBottleMoveTrailSVG(
        startCenterX,
        startCenterY,
        bCenter.cx,
        bCenter.cy,
        srcRect.width,
        srcRect.height,
        curDeg,
        colObj,
        animTimeSec,
        Math.max(0, 1 - ease) * 0.75
      );

      requestAnimationFrame(step);

      // ---------- 倒水位移结束，清理样式并检测加塞与装袋 ----------
    } else {
      fxOverlayEl.innerHTML = '';
      srcEl.style.transform = '';
      srcEl.style.transformOrigin = '';
      srcEl.classList.remove('pouring-source');
      dstEl.classList.remove('pouring-target');

      const isComplete =
        dstFullLayers.length === dstCap &&
        dstFullLayers.every((c) => c === dstFullLayers[0]) &&
        (!dstBottle.mysteryCount || dstBottle.mysteryCount === 0);

      // 确定匹配颜色的手提礼盒袋（如果有）
      let targetBagIdx = bags.findIndex(
        (b) => !b.locked && b.color === pourColor && !b.packedBottle
      );
      if (targetBagIdx === -1) {
        targetBagIdx = bags.findIndex((b) => !b.locked && b.color === pourColor);
      }
      if (targetBagIdx === -1) {
        targetBagIdx = bags.findIndex((b) => !b.locked && !b.packedBottle);
        if (targetBagIdx === -1) targetBagIdx = bags.findIndex((b) => !b.locked);
      }
      if (targetBagIdx === -1) targetBagIdx = 0;

      // 盲盒揭晓判定
      let revealedMysteryLayerIdx: number | undefined;
      let revealedMysteryColor: ColorKey | null = null;
      if (
        srcBottle.mysteryCount &&
        srcBottle.mysteryCount > 0 &&
        srcBottle.layers.length - moveCount <= srcBottle.mysteryCount
      ) {
        revealedMysteryLayerIdx = srcBottle.layers.length - moveCount - 1;
        revealedMysteryColor = srcBottle.layers[revealedMysteryLayerIdx];
      }

      // 底座障碍判定
      const brokenSpecials: { bIdx: number; type: string; wasIce?: boolean }[] = [];
      bottles.forEach((b, bIdx) => {
        if (!b.removed && (b.special === 'ice_base' || b.special === 'stone_base') && b.poursToBreak) {
          const wasIce = b.special === 'ice_base';
          if (b.poursToBreak - 1 <= 0) {
            brokenSpecials.push({ bIdx, type: wasIce ? 'ice_shatter' : 'stone_shatter', wasIce });
          }
        }
      });

      if (isComplete) {
        runCorkAndPackAnimation({
          dstIdx,
          dstBottle,
          targetBagIdx,
          pourColor,
          gridEl,
          bagsStageEl,
          fxOverlayEl,
          currentLevelId,
          hasBags,
          onComplete: () => {
            onFinish({
              srcIdx,
              dstIdx,
              moveCount,
              pourColor,
              isDstCompleted: true,
              wasGiantCat: !!dstBottle.isGiantCat,
              targetBagIdx,
              revealedMysteryLayerIdx,
              revealedMysteryColor,
              brokenSpecials,
            });
          },
        });
      } else {
        onFinish({
          srcIdx,
          dstIdx,
          moveCount,
          pourColor,
          isDstCompleted: false,
          wasGiantCat: !!dstBottle.isGiantCat,
          targetBagIdx,
          revealedMysteryLayerIdx,
          revealedMysteryColor,
          brokenSpecials,
        });
      }
    }
  }

  requestAnimationFrame(step);
}

interface CorkAndPackParams {
  dstIdx: number;
  dstBottle: Bottle;
  targetBagIdx: number;
  pourColor: ColorKey;
  gridEl: HTMLElement;
  bagsStageEl: HTMLElement | null;
  fxOverlayEl: SVGSVGElement;
  currentLevelId: number;
  hasBags: boolean;
  onComplete: () => void;
}

function runCorkAndPackAnimation(params: CorkAndPackParams) {
  const {
    dstIdx,
    dstBottle,
    targetBagIdx,
    pourColor,
    gridEl,
    bagsStageEl,
    fxOverlayEl,
    currentLevelId,
    hasBags,
    onComplete,
  } = params;

  const targetSlotEl = gridEl.children[dstIdx] as HTMLElement;
  const neckGroupEl = document.getElementById(`neck-group-${dstIdx}`);
  const corkFxEl = document.getElementById(`cork-fx-${dstIdx}`);

  const dstCap = dstBottle.maxCap || 4;
  const neckOff = getNeckOffsetY(dstCap, !!dstBottle.isGiantCat, currentLevelId);
  const { bottomY: dstBotY } = getBottleLayerMetrics(dstCap, !!dstBottle.isGiantCat, currentLevelId);

  const corkStart = performance.now();
  const useBagSpiral = hasBags && !!bagsStageEl;
  const corkDur = useBagSpiral ? 680 : 480;
  let slamSoundPlayed = false;
  let packSoundPlayed = false;

  function stepCorkAnim(tNow: number) {
    const cp = Math.min(1, (tNow - corkStart) / corkDur);

    if (cp >= 0.16 && !slamSoundPlayed) {
      slamSoundPlayed = true;
      audioEngine.playSound('cork_slam');
    }

    if (cp >= 0.16 && cp < 0.38) {
      const hitP = (cp - 0.16) / 0.22;
      const squash = Math.sin(hitP * Math.PI * 2.2) * Math.exp(-3.0 * hitP);
      if (targetSlotEl) {
        const bScaleX = 1 + squash * 0.07;
        const bScaleY = 1 - squash * 0.09;
        const bTransY = squash * 6.5;
        targetSlotEl.style.transformOrigin = '50% 100%';
        targetSlotEl.style.transform = `translateY(${bTransY.toFixed(2)}px) scale(${bScaleX.toFixed(3)}, ${bScaleY.toFixed(3)})`;
      }
      if (neckGroupEl) {
        const nScaleX = 1 + squash * 0.12;
        const nScaleY = 1 - squash * 0.22;
        const nTransY = squash * 5.2;
        neckGroupEl.setAttribute(
          'transform',
          `translate(50, ${(16 + neckOff + nTransY).toFixed(2)}) scale(${nScaleX.toFixed(3)}, ${nScaleY.toFixed(3)}) translate(-50, -16)`
        );
      }
    } else if (cp >= 0.38) {
      if (targetSlotEl) targetSlotEl.style.transform = '';
      if (neckGroupEl) neckGroupEl.setAttribute('transform', `translate(0, ${neckOff})`);
    }

    if (useBagSpiral && cp >= 0.2 && !packSoundPlayed) {
      packSoundPlayed = true;
      audioEngine.playSound('pack');
    } else if (!useBagSpiral && cp >= 0.35 && !packSoundPlayed) {
      packSoundPlayed = true;
      audioEngine.playSound('pack');
    }

    if (corkFxEl) {
      corkFxEl.innerHTML = renderRibbonAndDroppingCorkMarkup(
        dstIdx,
        cp,
        neckOff,
        dstBotY,
        useBagSpiral
      );
    }

    if (cp < 1) {
      requestAnimationFrame(stepCorkAnim);
    } else {
      if (useBagSpiral && bagsStageEl) {
        if (corkFxEl) {
          corkFxEl.innerHTML = `<g transform="translate(0, ${neckOff})">${renderIkeaWoodCorkSVG(dstIdx, true)}</g>`;
        }
        packBottleIntoBagAnimation({
          bottleIdx: dstIdx,
          targetBagIdx,
          colorKey: pourColor,
          gridEl,
          bagsStageEl,
          fxOverlayEl,
          onDone: onComplete,
        });
      } else {
        // 无购物袋直通凝萃模式：原地保留木塞完成封存
        if (corkFxEl) {
          corkFxEl.innerHTML = `<g transform="translate(0, ${neckOff})">${renderIkeaWoodCorkSVG(dstIdx, true)}</g>`;
        }
        onComplete();
      }
    }
  }

  requestAnimationFrame(stepCorkAnim);
}

interface FlyToBagParams {
  bottleIdx: number;
  targetBagIdx: number;
  colorKey: ColorKey;
  gridEl: HTMLElement;
  bagsStageEl: HTMLElement;
  fxOverlayEl: SVGSVGElement;
  onDone: () => void;
}

function packBottleIntoBagAnimation(params: FlyToBagParams) {
  const { bottleIdx, targetBagIdx, colorKey, gridEl, bagsStageEl, fxOverlayEl, onDone } = params;

  const bottleEl = gridEl.children[bottleIdx] as HTMLElement;
  const bagEl = bagsStageEl.children[targetBagIdx] as HTMLElement;

  if (!bottleEl || !bagEl) {
    onDone();
    return;
  }

  const bRect = bottleEl.getBoundingClientRect();
  const bagRect = bagEl.getBoundingClientRect();
  const colObj = COLORS[colorKey] || COLORS.green;

  const startCx = bRect.left + bRect.width * 0.5;
  const startCy = bRect.top + bRect.height * 0.5;
  const bagMouthX = bagRect.left + bagRect.width * 0.48;
  const bagMouthAboveY = bagRect.top - bagRect.height * 0.18;
  const bagInsideWindowY = bagRect.top + bagRect.height * 0.58;

  bottleEl.style.zIndex = '120';
  bottleEl.style.transition = 'none';
  bottleEl.style.transformOrigin = '50% 50%';

  const flyStart = performance.now();
  const arcDur = 360;
  const diveDur = 240;

  function stepFlyIntoBag(now: number) {
    const elapsed = now - flyStart;
    const animTimeSec = elapsed / 1000;

    if (elapsed < arcDur) {
      const p = elapsed / arcDur;
      const ease = 1 - Math.pow(1 - p, 2.6);
      const curCx = startCx + (bagMouthX - startCx) * ease;
      const arcLift = -Math.sin(p * Math.PI) * 58;
      const curCy = startCy + (bagMouthAboveY - startCy) * ease + arcLift;
      const scale = 1 - 0.46 * ease;
      const tilt = Math.sin(p * Math.PI) * (bagMouthX >= startCx ? 12 : -12);

      const dx = curCx - startCx;
      const dy = curCy - startCy;
      bottleEl.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg) scale(${scale.toFixed(3)})`;

      fxOverlayEl.innerHTML = buildBottleMoveTrailSVG(
        startCx,
        startCy,
        curCx,
        curCy,
        bRect.width,
        bRect.height,
        tilt,
        colObj,
        animTimeSec,
        0.85
      );
      requestAnimationFrame(stepFlyIntoBag);
    } else if (elapsed < arcDur + diveDur) {
      const p = (elapsed - arcDur) / diveDur;
      const easeIn = p * p;
      const curCx = bagMouthX;
      const curCy = bagMouthAboveY + (bagInsideWindowY - bagMouthAboveY) * easeIn;
      const scale = 0.54 - 0.2 * easeIn;
      const op = p > 0.65 ? Math.max(0, 1 - (p - 0.65) / 0.35) : 1;

      const dx = curCx - startCx;
      const dy = curCy - startCy;
      bottleEl.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      bottleEl.style.opacity = op.toFixed(2);

      const ringR = 14 + p * 18;
      fxOverlayEl.innerHTML = `
        <ellipse cx="${bagMouthX.toFixed(1)}" cy="${(bagRect.top + bagRect.height * 0.24).toFixed(1)}"
                 rx="${ringR.toFixed(1)}" ry="${(ringR * 0.35).toFixed(1)}"
                 fill="none" stroke="${colObj.topLight}" stroke-width="2.5" opacity="${(1 - p).toFixed(2)}" />
      `;
      requestAnimationFrame(stepFlyIntoBag);
    } else {
      fxOverlayEl.innerHTML = '';
      bottleEl.style.transform = '';
      bottleEl.style.opacity = '';
      bottleEl.style.zIndex = '';

      audioEngine.playSound('cork_slam');
      bagEl.classList.add('packing-bounce');
      setTimeout(() => {
        bagEl.classList.remove('packing-bounce');
        onDone();
      }, 400);
    }
  }

  requestAnimationFrame(stepFlyIntoBag);
}
