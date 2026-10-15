import React from 'react';
import { ColorKey } from '../../types/game';
import { COLORS } from '../../constants/colors';

export interface PourStreamState {
  spoutX: number;
  spoutY: number;
  mouthX: number;
  mouthY: number;
  surfaceY: number;
  pourDir: number;
  colorKey: ColorKey;
  pourProgress: number; // 0 to 1
  moveCount?: number;
}

interface WaterStreamProps {
  streamState: PourStreamState | null;
}

export const WaterStream: React.FC<WaterStreamProps> = ({ streamState }) => {
  if (!streamState) return null;

  const {
    spoutX,
    spoutY,
    mouthX,
    mouthY,
    surfaceY,
    colorKey,
    pourProgress,
    moveCount = 1,
  } = streamState;

  const colObj = (COLORS as Record<string, { left: string; mid: string; right: string; topLight: string }>)[colorKey] || COLORS.green;

  const headRatio = Math.min(1, pourProgress / 0.1);
  const tailRatio = pourProgress > 0.9 ? Math.min(1, (pourProgress - 0.9) / 0.1) : 0;

  const totalDrop = Math.max(20, surfaceY - spoutY);
  const yStart = spoutY + totalDrop * (tailRatio * tailRatio * 0.82);
  const yEnd = spoutY + totalDrop * (headRatio * headRatio);
  if (yEnd - yStart < 4) return null;

  const N = 22;
  const leftEdge: { x: number; y: number }[] = [];
  const rightEdge: { x: number; y: number }[] = [];
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

    leftEdge.push({ x: x - halfW, y });
    rightEdge.push({ x: x + halfW, y });
    centerCurve.push(`${(x - halfW * 0.15).toFixed(2)},${y.toFixed(2)}`);
  }

  const firstL = leftEdge[0];
  const firstR = rightEdge[0];
  const lastL = leftEdge[leftEdge.length - 1];
  const lastR = rightEdge[rightEdge.length - 1];

  let streamPath = `M ${firstL.x.toFixed(2)},${firstL.y.toFixed(2)} `;
  streamPath += `Q ${((firstL.x + firstR.x) * 0.5).toFixed(2)},${(firstL.y - 1.2).toFixed(2)} ${firstR.x.toFixed(2)},${firstR.y.toFixed(2)} `;
  for (let i = 1; i < rightEdge.length; i++) {
    streamPath += `L ${rightEdge[i].x.toFixed(2)},${rightEdge[i].y.toFixed(2)} `;
  }
  streamPath += `A 4,2.8 0 0,1 ${lastL.x.toFixed(2)},${lastL.y.toFixed(2)} `;
  for (let i = leftEdge.length - 2; i >= 0; i--) {
    streamPath += `L ${leftEdge[i].x.toFixed(2)},${leftEdge[i].y.toFixed(2)} `;
  }
  streamPath += 'Z';

  return (
    <svg className="fx-overlay" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', pointerEvents: 'none', zIndex: 95 }}>
      <defs>
        <linearGradient id="liveStreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colObj.left} />
          <stop offset="45%" stopColor={colObj.topLight} />
          <stop offset="82%" stopColor={colObj.mid} />
          <stop offset="100%" stopColor={colObj.right} />
        </linearGradient>
      </defs>

      <path d={streamPath} fill="url(#liveStreamGrad)" />
      <path
        d={`M ${centerCurve.join(' L ')}`}
        fill="none"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* 溅水波纹与泡沫 */}
      {headRatio >= 0.98 && tailRatio < 0.88 && (
        <g transform={`translate(${mouthX}, ${surfaceY})`}>
          <ellipse cx="0" cy="0" rx="12" ry="4" fill="rgba(255,255,255,0.35)" />
          <ellipse cx="0" cy="0" rx="7" ry="2.5" fill={colObj.topLight} />
          <circle cx="-3" cy="-1" r="2.2" fill="#ffffff" />
          <circle cx="3" cy="-1" r="2.0" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
};
