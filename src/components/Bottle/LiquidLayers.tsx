import React from 'react';
import { ColorKey } from '../../types/game';
import { COLORS } from '../../constants/colors';
import {
  BOTTLE_INNER_POLY,
  getTransformedContour,
  getChordAtGravityY,
  getNeckOffsetY,
  getBottleLayerMetrics,
} from '../../physics/liquidMath';

interface LiquidLayersProps {
  layers: ColorKey[];
  bottleIdx: number;
  maxCap?: number;
  isGiantCat?: boolean;
  levelId?: number;
  mysteryCount?: number;
  tiltAngle?: number;
  pourDir?: number;
  topLayerScale?: number;
  spillProgress?: number;
  sloshPhase?: number;
  sloshAmplitude?: number;
}

export const LiquidLayers: React.FC<LiquidLayersProps> = ({
  layers,
  bottleIdx,
  maxCap = 4,
  isGiantCat = false,
  levelId = 1,
  mysteryCount = 0,
  tiltAngle = 0,
  pourDir = 1,
  topLayerScale = 1,
  spillProgress = 0,
  sloshPhase = 0,
  sloshAmplitude = 0,
}) => {
  if (layers.length === 0) return null;

  const effectiveLayers = layers.map((c, i) => (i < mysteryCount ? ('mystery_dark' as ColorKey) : c));

  let topSameCount = 1;
  for (let i = effectiveLayers.length - 2; i >= 0; i--) {
    if (effectiveLayers[i] === effectiveLayers[effectiveLayers.length - 1]) topSameCount++;
    else break;
  }
  const baseLayersCount = effectiveLayers.length - topSameCount;

  const groups: { colorKey: ColorKey; amount: number }[] = [];
  let idxCursor = 0;
  while (idxCursor < baseLayersCount) {
    const cKey = effectiveLayers[idxCursor];
    let cnt = 1;
    while (idxCursor + cnt < baseLayersCount && effectiveLayers[idxCursor + cnt] === cKey) {
      cnt++;
    }
    groups.push({ colorKey: cKey, amount: cnt });
    idxCursor += cnt;
  }
  const topAmount = topSameCount * Math.max(0, topLayerScale);
  if (topAmount > 0.005) {
    groups.push({ colorKey: effectiveLayers[effectiveLayers.length - 1], amount: topAmount });
  }
  if (groups.length === 0) return null;

  const totalVolume = groups.reduce((acc, g) => acc + g.amount, 0);
  const { bottomY, layerH, rx, ry } = getBottleLayerMetrics(maxCap, isGiantCat, levelId);

  const effectiveTiltDeg = tiltAngle * pourDir;
  const absTilt = Math.abs(tiltAngle);

  // 1. 直立静止与抖动状态
  if (absTilt < 0.5) {
    const leftX = 50 - rx;
    const rightX = 50 + rx;
    let curY = bottomY;

    const sloshSin = Math.sin(sloshPhase);
    const sloshCos = Math.cos(sloshPhase);
    const topTiltY = sloshSin * sloshAmplitude * 4.6;
    const waveCrest = sloshCos * sloshAmplitude * 2.2;
    const ryDynamic = Math.max(2.6, ry - Math.abs(sloshSin) * sloshAmplitude * 1.5);

    const firstColor = groups[0].colorKey;
    const firstGrad = firstColor === 'mystery_dark' ? `liq-mystery-${bottleIdx}` : `liq-${firstColor}-${bottleIdx}`;

    return (
      <g id={`liquid-group-${bottleIdx}`}>
        {/* 瓶底弧形水托 */}
        <path
          d={`M ${leftX},${(bottomY - 4).toFixed(2)}
              L ${rightX},${(bottomY - 4).toFixed(2)}
              A ${rx},${ry} 0 0,1 ${leftX},${(bottomY - 4).toFixed(2)} Z`}
          fill={`url(#${firstGrad})`}
        />

        {groups.map((g, i) => {
          const h = g.amount * layerH;
          const yBot = curY;
          const yTop = curY - h;
          curY = yTop;
          const yBotDraw = i === 0 ? yBot + 3.5 : yBot;
          const gradId = g.colorKey === 'mystery_dark' ? `liq-mystery-${bottleIdx}` : `liq-${g.colorKey}-${bottleIdx}`;

          const isTopGroup = i === groups.length - 1;
          const prevTiltY = i > 0 && sloshAmplitude > 0.01 ? topTiltY * 0.32 * (i / groups.length) : 0;
          const curTiltY = isTopGroup ? topTiltY : topTiltY * 0.32 * ((i + 1) / groups.length);
          const curWave = isTopGroup ? waveCrest : waveCrest * 0.25;

          const yTL = yTop - curTiltY;
          const yTR = yTop + curTiltY;
          const yBL = yBotDraw - prevTiltY;
          const yBR = yBotDraw + prevTiltY;

          const pathD =
            sloshAmplitude > 0.01 && isTopGroup
              ? `M ${leftX},${yTL.toFixed(2)}
                 C ${(50 - rx * 0.45).toFixed(2)},${(yTop - curTiltY * 0.3 + curWave).toFixed(2)} ${(50 + rx * 0.45).toFixed(2)},${(yTop + curTiltY * 0.3 - curWave).toFixed(2)} ${rightX},${yTR.toFixed(2)}
                 L ${rightX},${yBR.toFixed(2)}
                 A ${rx},${ry} 0 0,1 ${leftX},${yBL.toFixed(2)}
                 Z`
              : `M ${leftX},${yTL.toFixed(2)}
                 L ${rightX},${yTR.toFixed(2)}
                 L ${rightX},${yBR.toFixed(2)}
                 A ${rx},${ry} 0 0,1 ${leftX},${yBL.toFixed(2)}
                 Z`;

          return <path key={`layer-${i}`} d={pathD} fill={`url(#${gradId})`} />;
        })}

        {mysteryCount > 0 &&
          Array.from({ length: Math.min(mysteryCount, layers.length) }).map((_, m) => {
            const qY = bottomY - m * layerH - layerH * 0.28;
            return (
              <g key={`mystery-${m}`} transform={`translate(50, ${qY.toFixed(1)})`}>
                <circle cx="0" cy="-5" r="11.5" fill="rgba(255, 215, 64, 0.16)" stroke="rgba(255, 224, 130, 0.45)" strokeWidth="1" />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  fill="#ffe57f"
                  fontSize="19"
                  fontWeight="900"
                  fontFamily="Arial Rounded MT Bold, Arial Black, sans-serif"
                  style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.92))' }}
                >
                  ?
                </text>
              </g>
            );
          })}

        {(() => {
          const topColorKey = groups[groups.length - 1].colorKey;
          const colTop = (COLORS as Record<string, { topLight: string }>)[topColorKey] || COLORS.green;
          const surfaceTiltDeg = (Math.atan2(topTiltY * 2, rx * 2) * 180) / Math.PI;
          let topRxEff = rx + 0.6;
          if (isGiantCat) {
            topRxEff = curY < 102 ? 33.5 : 42.5;
          }

          return (
            <g transform={`translate(50, ${curY.toFixed(2)}) rotate(${surfaceTiltDeg.toFixed(2)})`}>
              <ellipse cx="0" cy={(waveCrest * 0.22).toFixed(2)} rx={topRxEff.toFixed(2)} ry={ryDynamic.toFixed(2)} fill={`url(#top-${topColorKey}-${bottleIdx})`} />
              <path
                d={`M ${-(topRxEff - 1.5)},${(0.3 + waveCrest * 0.22).toFixed(2)}
                    A ${topRxEff - 1.5},${(ryDynamic - 0.3).toFixed(2)} 0 0,0 ${topRxEff - 1.5},${(0.3 + waveCrest * 0.22).toFixed(2)}`}
                fill="none"
                stroke={colTop.topLight}
                strokeWidth="1.25"
                strokeLinecap="round"
                opacity="0.86"
              />
              {sloshAmplitude > 0.04 && (
                <ellipse
                  cx={(sloshSin * 5.5).toFixed(1)}
                  cy={(waveCrest * 0.35).toFixed(1)}
                  rx={(topRxEff * 0.52 + sloshCos * 4).toFixed(1)}
                  ry={(3.2 + Math.abs(sloshSin) * 1.4).toFixed(1)}
                  fill="none"
                  stroke={colTop.topLight}
                  strokeWidth="1.0"
                  opacity={(0.55 * sloshAmplitude).toFixed(2)}
                />
              )}
            </g>
          );
        })()}
      </g>
    );
  }

  // 2. 倾斜状态（真实物理重力液面）
  const rad = (effectiveTiltDeg * Math.PI) / 180;
  const absSin = Math.abs(Math.sin(rad));
  const cosR = Math.cos(rad);
  const tPtsTop = getTransformedContour(rad);

  const neckOffsetY = getNeckOffsetY(maxCap, isGiantCat, levelId);
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
  const drainFactor = normVol4 < 0.85 ? Math.max(0.12, Math.pow(normVol4 / 0.85, 0.52)) : 1.0;
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
    let lo = 0,
      hi = SAMPLES;
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
  const interfaces: { yG: number; shearFactor: number; chord: { cx: number; rx: number } }[] = [];
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

  const minX = -125;
  const maxX = 225;

  return (
    <g id={`liquid-group-${bottleIdx}`} transform="rotate(0)">
      {groups.map((g, i) => {
        const lowerIf = interfaces[i];
        const upperIf = interfaces[i + 1];

        const upperRelDeg = (1 - upperIf.shearFactor) * effectiveTiltDeg;
        const lowerRelDeg = (1 - lowerIf.shearFactor) * effectiveTiltDeg;
        const upperTan = Math.tan((upperRelDeg * Math.PI) / 180);
        const lowerTan = Math.tan((lowerRelDeg * Math.PI) / 180);

        const cxU = upperIf.chord.cx;
        const cxL = lowerIf.chord.cx;

        const yUL = upperIf.yG + (minX - cxU) * upperTan;
        const yUR = upperIf.yG + (maxX - cxU) * upperTan;
        const yBotBase = i === 0 ? lowerIf.yG + 18 : lowerIf.yG;
        const yBL = yBotBase + (minX - cxL) * lowerTan;
        const yBR = yBotBase + (maxX - cxL) * lowerTan;

        const gradId = g.colorKey === 'mystery_dark' ? `liq-mystery-${bottleIdx}` : `liq-${g.colorKey}-${bottleIdx}`;

        return (
          <polygon
            key={`tilted-layer-${i}`}
            points={`${minX.toFixed(1)},${yUL.toFixed(1)} ${maxX.toFixed(1)},${yUR.toFixed(1)} ${maxX.toFixed(1)},${yBR.toFixed(1)} ${minX.toFixed(1)},${yBL.toFixed(1)}`}
            fill={`url(#${gradId})`}
            transform="rotate(0)"
          />
        );
      })}
    </g>
  );
};
