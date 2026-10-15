export interface Point {
  x: number;
  y: number;
}

export interface TransformedPoint {
  X: number;
  Y: number;
}

export interface ChordResult {
  leftX: number;
  rightX: number;
  cx: number;
  rx: number;
}

export interface LayerMetrics {
  bottomY: number;
  layerH: number;
  rx: number;
  ry: number;
  vbMinX: number;
  vbMinY: number;
  vbW: number;
  vbH: number;
}

export const BOTTLE_INNER_POLY: Point[] = (() => {
  const pts: Point[] = [];
  pts.push({ x: 36, y: 11 });
  pts.push({ x: 64, y: 11 });
  pts.push({ x: 65, y: 28 });
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const mt = 1 - t;
    pts.push({
      x: mt * mt * 67 + 2 * mt * t * 84.5 + t * t * 84.5,
      y: mt * mt * 28 + 2 * mt * t * 37 + t * t * 58,
    });
  }
  for (let i = 1; i <= 10; i++) {
    pts.push({ x: 84.5, y: 58 + (193 - 58) * (i / 10) });
  }
  for (let i = 1; i < 12; i++) {
    const ang = (i / 12) * Math.PI;
    pts.push({
      x: 50 + 34.5 * Math.cos(ang),
      y: 193 + 10.5 * Math.sin(ang),
    });
  }
  for (let i = 0; i <= 10; i++) {
    pts.push({ x: 15.5, y: 193 - (193 - 58) * (i / 10) });
  }
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const mt = 1 - t;
    pts.push({
      x: mt * mt * 15.5 + 2 * mt * t * 15.5 + t * t * 33,
      y: mt * mt * 58 + 2 * mt * t * 37 + t * t * 28,
    });
  }
  return pts;
})();

export function getTransformedContour(rad: number): TransformedPoint[] {
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const tPts: TransformedPoint[] = new Array(BOTTLE_INNER_POLY.length);
  for (let i = 0; i < BOTTLE_INNER_POLY.length; i++) {
    const p = BOTTLE_INNER_POLY[i];
    const dx = p.x - 50;
    const dy = p.y - 115;
    tPts[i] = {
      X: 50 + dx * cosA - dy * sinA,
      Y: 115 + dx * sinA + dy * cosA,
    };
  }
  return tPts;
}

export function getChordAtGravityY(tPts: TransformedPoint[], targetY: number): ChordResult {
  let minX = Infinity;
  let maxX = -Infinity;
  const n = tPts.length;
  for (let i = 0; i < n; i++) {
    const p1 = tPts[i];
    const p2 = tPts[(i + 1) % n];
    if ((p1.Y <= targetY && p2.Y >= targetY) || (p2.Y <= targetY && p1.Y >= targetY)) {
      const dy = p2.Y - p1.Y;
      if (Math.abs(dy) < 1e-5) {
        if (p1.X < minX) minX = p1.X;
        if (p1.X > maxX) maxX = p1.X;
      } else {
        const t = (targetY - p1.Y) / dy;
        const x = p1.X + t * (p2.X - p1.X);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (minX > maxX) {
    return { leftX: 15.5, rightX: 84.5, cx: 50, rx: 34.5 };
  }
  const cx = 0.5 * (minX + maxX);
  const rx = Math.max(8, 0.5 * (maxX - minX));
  return { leftX: minX, rightX: maxX, cx, rx };
}

export function getPhysicalSpillAngleDeg(volumeLayers: number, maxCap = 4): number {
  const normV = (volumeLayers / maxCap) * 4.0;
  const v = Math.max(0.0, Math.min(4.0, normV));
  if (v >= 1.0) {
    return 96.0 - (v - 1.0) * 11.0;
  }
  return 96.0 + (1.0 - v) * 7.0;
}

export function getNeckOffsetY(maxCap: number, isGiantCat?: boolean, levelId?: number): number {
  if (isGiantCat) return 0;
  if (maxCap === 2) return 82;
  if (maxCap === 4 && levelId === 2) return 38;
  return 0;
}

export function getBottleLayerMetrics(maxCap: number, isGiantCat?: boolean, levelId?: number): LayerMetrics {
  if (isGiantCat) {
    return { bottomY: 194, layerH: 18.8, rx: 43.5, ry: 9.5, vbMinX: -12, vbMinY: -6, vbW: 124, vbH: 224 };
  }
  if (maxCap === 8) {
    return { bottomY: 288, layerH: 30.5, rx: 34.5, ry: 8.6, vbMinX: 11, vbMinY: 6, vbW: 78, vbH: 298 };
  }
  if (maxCap === 2) {
    return { bottomY: 193, layerH: 34.5, rx: 34.5, ry: 8.8, vbMinX: 11, vbMinY: 6, vbW: 78, vbH: 202 };
  }
  if (maxCap === 4 && levelId === 2) {
    return { bottomY: 193, layerH: 27.8, rx: 34.5, ry: 8.8, vbMinX: 11, vbMinY: 6, vbW: 78, vbH: 202 };
  }
  if (maxCap === 6) {
    return { bottomY: 193, layerH: 24.8, rx: 34.5, ry: 8.8, vbMinX: 11, vbMinY: 6, vbW: 78, vbH: 202 };
  }
  // 标准4层瓶：4 * 37.3 = 149.2 -> 顶层液面位于 y = 193 - 149.2 = 43.8（恰好位于瓶肩饱满弧线处！）
  return { bottomY: 193, layerH: 37.3, rx: 34.5, ry: 8.8, vbMinX: 11, vbMinY: 6, vbW: 78, vbH: 202 };
}

export function getShoulderRxAtY(y: number, maxCap: number, isGiantCat?: boolean, levelId?: number): number {
  if (isGiantCat) {
    return y < 102 ? 33.5 : 42.5;
  }
  const neckOff = getNeckOffsetY(maxCap, isGiantCat, levelId);
  const shTop = 28 + neckOff;
  const shBot = 54 + neckOff;
  if (y >= shBot) return 34.5;
  if (y <= shTop) return 15.5;
  const u = (y - shTop) / (shBot - shTop);
  // 二次贝塞尔瓶肩曲线插值半宽
  const easeU = 1 - Math.pow(1 - u, 1.85);
  return 15.5 + (34.5 - 15.5) * easeU;
}

export function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
