import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Bottle, ColorDef } from '../types/game';
import { getColor, COLOR_PALETTE } from '../utils/colors';
import { isBottleComplete, TUBE_CAPACITY } from '../solver/waterSortSolver';

export interface TestTubeRef {
  getSpoutPos: () => { x: number; y: number } | null;
  getMouthPos: () => { x: number; y: number } | null;
  getBoundingBox: () => DOMRect | null;
}

export const BOTTLE_VIEWBOX_WIDTH = 77;
export const BOTTLE_VIEWBOX_HEIGHT = 223;
export const BOTTLE_MOUTH_CENTER = { x: 38.5, y: 5.0 };
export const BOTTLE_CHAMBER_TOP = 47.5;
export const BOTTLE_CHAMBER_BOTTOM = 210.5;

export const getBottleMouthPoint = () => BOTTLE_MOUTH_CENTER;

export const getBottlePourSpoutPoint = (tiltAngle: number) => ({
  x: tiltAngle >= 0 ? 51.0 : 26.0,
  y: 5.0,
});

export const getBottleLiquidSurfaceY = (units: number, capacity = TUBE_CAPACITY) =>
  BOTTLE_CHAMBER_BOTTOM -
  (Math.max(0, Math.min(capacity, units)) / capacity) * (BOTTLE_CHAMBER_BOTTOM - BOTTLE_CHAMBER_TOP);

const INNER_CHAMBER_POLYGON = [
  { x: 26, y: 5 },
  { x: 26, y: 28 },
  ...Array.from({ length: 12 }, (_, index) => {
    const t = (index + 1) / 12;
    const inverse = 1 - t;
    return {
      x: inverse ** 3 * 26 + 3 * inverse ** 2 * t * 26 + 3 * inverse * t ** 2 * 6.3 + t ** 3 * 6.3,
      y: inverse ** 3 * 28 + 3 * inverse ** 2 * t * 38 + 3 * inverse * t ** 2 * 38 + t ** 3 * 47.5,
    };
  }),
  { x: 6.3, y: 196 },
  ...Array.from({ length: 32 }, (_, index) => {
    const angle = Math.PI - ((index + 1) * Math.PI) / 32;
    return { x: 38.3 + 32 * Math.cos(angle), y: 196 + 14.5 * Math.sin(angle) };
  }),
  { x: 70.3, y: 47.5 },
  ...Array.from({ length: 12 }, (_, index) => {
    const t = (index + 1) / 12;
    const inverse = 1 - t;
    return {
      x: inverse ** 3 * 70.3 + 3 * inverse ** 2 * t * 70.3 + 3 * inverse * t ** 2 * 51 + t ** 3 * 51,
      y: inverse ** 3 * 47.5 + 3 * inverse ** 2 * t * 38 + 3 * inverse * t ** 2 * 38 + t ** 3 * 28,
    };
  }),
  { x: 51, y: 5 },
];

const polygonArea = (points: { x: number; y: number }[]) => {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
};

const getTiltedChamberSurfaceY = (tiltAngle: number, fillRatio: number) => {
  const angle = (tiltAngle * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const pivot = { x: BOTTLE_MOUTH_CENTER.x, y: BOTTLE_MOUTH_CENTER.y };
  const points = INNER_CHAMBER_POLYGON.map(({ x, y }) => ({
    x: pivot.x + (x - pivot.x) * cos - (y - pivot.y) * sin,
    y: pivot.y + (x - pivot.x) * sin + (y - pivot.y) * cos,
  }));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const totalArea = polygonArea(points);
  const targetArea = totalArea * Math.max(0, Math.min(1, fillRatio));

  if (targetArea <= 0.01) return maxY;
  if (targetArea >= totalArea - 0.01) return minY;

  const areaBelow = (surfaceY: number) => {
    const clipped: { x: number; y: number }[] = [];
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      const currentInside = current.y >= surfaceY;
      const nextInside = next.y >= surfaceY;

      if (currentInside !== nextInside) {
        const progress = (surfaceY - current.y) / (next.y - current.y);
        clipped.push({
          x: current.x + (next.x - current.x) * progress,
          y: surfaceY,
        });
      }
      if (nextInside) clipped.push(next);
    }
    return polygonArea(clipped);
  };

  let low = minY;
  let high = maxY;
  for (let iteration = 0; iteration < 18; iteration += 1) {
    const middle = (low + high) / 2;
    if (areaBelow(middle) > targetArea) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
};

interface TestTubeProps {
  index: number;
  bottle: Bottle;
  capacity?: number;
  isSelected?: boolean;
  isHintSource?: boolean;
  isHintTarget?: boolean;
  isLeakTarget?: boolean;
  isPouringSource?: boolean;
  isPouringFluid?: boolean;
  isPouringTarget?: boolean;
  isShaking?: boolean;
  tiltAngle?: number;
  translateX?: number;
  translateY?: number;
  sourceDrainingCount?: number;
  drainingTotalCount?: number;
  targetRisingCount?: number;
  activePourColor?: string | null;
  completionPhase?: 'cork_drop' | 'whirling' | 'flying' | null;
  flyX?: number;
  flyY?: number;
  hasCork?: boolean;
  isCollected?: boolean;
  compact?: boolean;
  levelEntryId?: number;
  onClick: (index: number) => void;
  disabled?: boolean;
}

export const TestTube = React.memo(forwardRef<TestTubeRef, TestTubeProps>(({
  index,
  bottle,
  capacity = TUBE_CAPACITY,
  isSelected = false,
  isHintSource = false,
  isHintTarget = false,
  isLeakTarget = false,
  isPouringSource = false,
  isPouringFluid = false,
  isPouringTarget = false,
  isShaking = false,
  tiltAngle = 0,
  translateX = 0,
  translateY = 0,
  sourceDrainingCount = 0,
  drainingTotalCount = 0,
  targetRisingCount = 0,
  activePourColor = null,
  completionPhase = null,
  flyX = 0,
  flyY = 0,
  hasCork = false,
  isCollected = false,
  compact = false,
  levelEntryId = 0,
  onClick,
  disabled = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [entrySwayActive, setEntrySwayActive] = useState(true);

  useEffect(() => {
    if (isPouringSource || isPouringTarget) setEntrySwayActive(false);
  }, [isPouringSource, isPouringTarget]);

  useImperativeHandle(ref, () => ({
    getSpoutPos: () => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const spout = getBottlePourSpoutPoint(tiltAngle);
      return {
        x: rect.left + (spout.x / BOTTLE_VIEWBOX_WIDTH) * rect.width,
        y: rect.top + (spout.y / BOTTLE_VIEWBOX_HEIGHT) * rect.height,
      };
    },
    getMouthPos: () => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: rect.left + (BOTTLE_MOUTH_CENTER.x / BOTTLE_VIEWBOX_WIDTH) * rect.width,
        y: rect.top + (BOTTLE_MOUTH_CENTER.y / BOTTLE_VIEWBOX_HEIGHT) * rect.height,
      };
    },
    getBoundingBox: () => {
      if (!containerRef.current) return null;
      return containerRef.current.getBoundingClientRect();
    },
  }));

  const tube = bottle.layers;
  const isComplete = isBottleComplete(bottle, capacity);

  // Special-bottle derived flags
  const isMasked = bottle.type === 'masked';
  const maskHidden = isMasked && !bottle.maskRevealed;
  const hiddenCount = bottle.type === 'hidden' ? Math.min(tube.length, bottle.hiddenBottomLayers ?? 0) : 0;
  const isLeaky = bottle.type === 'bottom_leak';

  // One-shot cloth drop animation when a masked bottle unlocks
  const [maskFalling, setMaskFalling] = useState(false);
  const prevRevealedRef = useRef<boolean>(!!bottle.maskRevealed);
  useEffect(() => {
    const revealed = !!bottle.maskRevealed;
    const wasRevealed = prevRevealedRef.current;
    prevRevealedRef.current = revealed;
    if (revealed && !wasRevealed) {
      setMaskFalling(true);
      const t = setTimeout(() => setMaskFalling(false), 650);
      return () => clearTimeout(t);
    }
  }, [bottle.maskRevealed]);

  // If already collected into shopping bag, render invisible placeholder to preserve grid alignment
  if (isCollected) {
    return (
      <div
        ref={containerRef}
        className={`flex flex-col items-center group relative select-none opacity-0 pointer-events-none ${compact ? 'w-[42px] sm:w-[46px] h-[122px] sm:h-[133px]' : 'w-[54px] sm:w-[60px] h-[156px] sm:h-[174px]'
          }`}
      />
    );
  }

  const isFlying = completionPhase === 'flying';
  const isWhirling = completionPhase === 'whirling';
  const isCorkDropping = completionPhase === 'cork_drop';

  // Compute layers to render
  const displayTube = [...tube];

  interface RenderLayer {
    colorId: string;
    heightPercent: number;
    isTop: boolean;
    isBottom: boolean;
  }

  // 1. Calculate source liquid layers (with multi-unit draining)
  const rawLayers: RenderLayer[] = [];
  if (isPouringSource && sourceDrainingCount > 0 && displayTube.length > 0) {
    let unitsToDrain = sourceDrainingCount;
    const blocks = displayTube.map((colorId) => ({ colorId, percent: 100 }));
    // Drain from top layer downwards
    for (let i = blocks.length - 1; i >= 0 && unitsToDrain > 0; i--) {
      if (unitsToDrain >= 1) {
        blocks[i].percent = 0;
        unitsToDrain -= 1;
      } else {
        blocks[i].percent = Math.max(0, 100 - unitsToDrain * 100);
        unitsToDrain = 0;
      }
    }
    blocks.forEach((b, idx) => {
      if (b.percent > 0) {
        rawLayers.push({
          colorId: b.colorId,
          heightPercent: b.percent,
          isTop: false,
          isBottom: idx === 0,
        });
      }
    });
  } else {
    displayTube.forEach((colorId, idx) => {
      rawLayers.push({
        colorId,
        heightPercent: 100,
        isTop: false,
        isBottom: idx === 0,
      });
    });
  }

  // 2. Calculate target rising liquid layers (with multi-unit rising)
  if (isPouringTarget && targetRisingCount > 0 && activePourColor) {
    let unitsToRise = targetRisingCount;
    while (unitsToRise > 0) {
      const thisPct = Math.min(100, unitsToRise * 100);
      rawLayers.push({
        colorId: activePourColor,
        heightPercent: thisPct,
        isTop: false,
        isBottom: rawLayers.length === 0,
      });
      unitsToRise -= thisPct / 100;
    }
  }

  // 3. Strict clamping: total fluid can NEVER exceed capacity (4 units)
  let accumulatedUnits = 0;
  const clampedLayers: RenderLayer[] = [];
  for (const layer of rawLayers) {
    const layerUnits = layer.heightPercent / 100;
    if (accumulatedUnits + layerUnits <= capacity) {
      clampedLayers.push({ ...layer });
      accumulatedUnits += layerUnits;
    } else if (accumulatedUnits < capacity) {
      const remainingUnits = capacity - accumulatedUnits;
      clampedLayers.push({
        ...layer,
        heightPercent: remainingUnits * 100,
      });
      accumulatedUnits = capacity;
      break;
    } else {
      break;
    }
  }

  if (clampedLayers.length > 0) {
    clampedLayers[clampedLayers.length - 1].isTop = true;
  }

  // Inner chamber coordinates (viewBox 0 0 77 223, matching Figma's exact glass bottle)
  // Inner chamber runs from CHAMBER_TOP_Y = 47.5 to CHAMBER_BOTTOM_Y = 210.5.
  // Total chamber height = 163px.
  // 4 units capacity: 163 / 4 = 40.75px per unit.
  const CHAMBER_BOTTOM_Y = 210.5;
  const CHAMBER_TOP_Y = 47.5;
  const CHAMBER_HEIGHT = CHAMBER_BOTTOM_Y - CHAMBER_TOP_Y; // 163px
  const RX = 32;
  const RY = 8.0; // 2.5D Top-down perspective depth (matching reference game design)

  const getBlockNominalHeight = (_layerIdx: number, totalCapacity: number = 4): number => {
    return CHAMBER_HEIGHT / totalCapacity;
  };

  const getBoundaryY = (boundaryIdx: number, totalCapacity: number = 4): number => {
    if (boundaryIdx <= 0) return CHAMBER_BOTTOM_Y;
    if (boundaryIdx >= totalCapacity) return CHAMBER_TOP_Y;
    return CHAMBER_BOTTOM_Y - boundaryIdx * (CHAMBER_HEIGHT / totalCapacity);
  };

  let currentY = CHAMBER_BOTTOM_Y;
  const calculatedLayers = clampedLayers.map((layer, lIdx) => {
    const nominalH = getBlockNominalHeight(lIdx, capacity);
    const layerH = nominalH * (layer.heightPercent / 100);
    const yBottom = currentY;
    const yTop = yBottom - layerH;
    currentY = yTop;
    return { ...layer, yBottom, yTop };
  });

  // Seamlessly merge contiguous blocks of the same color into a unified fluid volume
  interface FluidSegment {
    colorId: string;
    yTop: number;
    yBottom: number;
    isBottom: boolean;
    isTop: boolean;
    isHidden: boolean;
    isDimmed: boolean;
  }

  const fluidSegments: FluidSegment[] = [];
  for (let i = 0; i < calculatedLayers.length; i++) {
    const layer = calculatedLayers[i];
    const isHiddenLayer = hiddenCount > 0 && i < hiddenCount;
    const isDimmed = maskHidden && i === 0;

    const prevSeg = fluidSegments[fluidSegments.length - 1];
    if (
      prevSeg &&
      prevSeg.colorId === layer.colorId &&
      prevSeg.isHidden === isHiddenLayer &&
      prevSeg.isDimmed === isDimmed
    ) {
      prevSeg.yTop = layer.yTop;
      prevSeg.isTop = layer.isTop || false;
    } else {
      fluidSegments.push({
        colorId: layer.colorId,
        yBottom: layer.yBottom,
        yTop: layer.yTop,
        isBottom: layer.isBottom || false,
        isTop: layer.isTop || false,
        isHidden: isHiddenLayer,
        isDimmed,
      });
    }
  }

  const targetSurfaceY = calculatedLayers.length > 0
    ? calculatedLayers[calculatedLayers.length - 1].yTop
    : BOTTLE_CHAMBER_BOTTOM;
  const remainingPourUnits = clampedLayers.reduce((sum, layer) => sum + layer.heightPercent / 100, 0);
  const liquidRetreat = isPouringSource && isPouringFluid
    ? 8 + Math.min(5, Math.max(0, capacity - remainingPourUnits) * 1.25)
    : 0;

  const transformStyle: React.CSSProperties = {
    transform: isFlying
      ? `translate(${flyX}px, ${flyY}px) scale(0.22) rotate(-3deg)`
      : isPouringSource
        ? `translate(${translateX}px, ${translateY}px) rotate(${tiltAngle}deg)`
        : isSelected
          ? 'translateY(-18px)'
          : 'translateY(0)',
    transition: isFlying
      ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease-in'
      : isPouringSource
        ? isPouringFluid
          ? 'transform 0s'
          : 'transform 0.38s cubic-bezier(0.25, 1, 0.5, 1)'
        : 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
    opacity: isFlying ? 0.78 : 1,
    zIndex: isFlying ? 90 : isPouringSource ? 45 : isSelected ? 30 : 10,
    willChange: isPouringSource || isFlying ? 'transform' : 'auto',
    transformOrigin: isPouringSource
      ? `50% ${(BOTTLE_MOUTH_CENTER.y / BOTTLE_VIEWBOX_HEIGHT) * 100}%`
      : 'center bottom',
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center group relative cursor-pointer select-none ${isShaking ? 'anim-invalid-shake' : ''
        }`}
      style={transformStyle}
      onClick={() => !disabled && onClick(index)}
    >
      {/* 3D Whirling Magical Particle Halo */}
      {(isWhirling || isFlying) && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-visible flex items-center justify-center">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <div
              key={`whirl-star-${i}`}
              className="absolute text-amber-300 font-bold select-none pointer-events-none drop-shadow-[0_0_8px_rgba(251,191,36,0.95)]"
              style={{
                ['--angle' as string]: `${deg}deg`,
                animation: 'particleSpiral 1.0s cubic-bezier(0.25, 1, 0.5, 1) infinite',
                animationDelay: `${i * 0.12}s`,
                fontSize: i % 2 === 0 ? '14px' : '10px',
              }}
            >
              {i % 2 === 0 ? '✦' : '★'}
            </div>
          ))}
        </div>
      )}

      {/* SVG 3D Crystal Bottle */}
      <div
        className={`relative flex flex-col items-center transition-all duration-200 ${isWhirling
          ? 'anim-whirl-pulse filter drop-shadow-[0_0_24px_rgba(251,191,36,0.95)]'
          : isSelected
            ? 'filter drop-shadow-[0_0_10px_rgba(186,230,253,0.72)]'
            : isHintSource
              ? 'filter drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]'
              : isHintTarget
                ? 'filter drop-shadow-[0_0_12px_rgba(52,211,153,0.85)]'
                : ''
          }`}
      >
        {/* 瓶口中心物理定位锚点（跨平台兼容，消除移动端WebKit矩阵解析Bug） */}
        <div
          id={`tube-mouth-anchor-${index}`}
          className="pointer-events-none absolute"
          style={{
            left: `${(BOTTLE_MOUTH_CENTER.x / BOTTLE_VIEWBOX_WIDTH) * 100}%`,
            top: `${(BOTTLE_MOUTH_CENTER.y / BOTTLE_VIEWBOX_HEIGHT) * 100}%`,
            width: '0px',
            height: '0px',
            visibility: 'hidden',
          }}
        />

        {/* 倒水时的出水嘴物理定位锚点（随试管平移与旋转，零误差咬合瓶口） */}
        {isPouringSource && (
          <div
            id="active-pour-spout-anchor"
            className="pointer-events-none absolute"
            style={{
              left: `${((tiltAngle >= 0 ? 51.0 : 26.0) / BOTTLE_VIEWBOX_WIDTH) * 100}%`,
              top: `${(5.0 / BOTTLE_VIEWBOX_HEIGHT) * 100}%`,
              width: '0px',
              height: '0px',
              visibility: 'hidden',
            }}
          />
        )}

        <svg
          viewBox="0 0 77 223"
          className={`overflow-visible select-none ${compact ? 'w-[44px] sm:w-[50px] h-[127px] sm:h-[145px]' : 'w-[62px] sm:w-[70px] h-[180px] sm:h-[203px]'
            }`}
        >
          <defs>
            <filter id={`liquid-glow-${index}`} x="-30%" y="-30%" width="160%" height="180%">
              <feGaussianBlur stdDeviation="2.0" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id={`liquid-interface-shadow-${index}`} x="-20%" y="-100%" width="140%" height="300%">
              <feGaussianBlur stdDeviation="1.15" />
            </filter>

            <linearGradient id={`liquid-interface-shading-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06112d" stopOpacity="0" />
              <stop offset="46%" stopColor="#06112d" stopOpacity="0.035" />
              <stop offset="66%" stopColor="#06112d" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#06112d" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`liquid-depth-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
              <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#02091f" stopOpacity="0.1" />
            </linearGradient>

            <radialGradient id={`liquid-star-mask-gradient-${index}`} cx="52.8" cy="164.5" r="6.8" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="68%" stopColor="#000000" />
              <stop offset="100%" stopColor="#ffffff" />
            </radialGradient>

            <mask id={`liquid-star-clean-mask-${index}`} maskUnits="userSpaceOnUse" x="0" y="0" width="77" height="223">
              <rect x="0" y="0" width="77" height="223" fill="#ffffff" />
              <circle cx="52.8" cy="164.5" r="6.8" fill={`url(#liquid-star-mask-gradient-${index})`} />
            </mask>

            <radialGradient id={`liquid-bloom-${index}`} cx="50%" cy="18%" r="58%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.52" />
              <stop offset="18%" stopColor="#dfe9ff" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#dfe9ff" stopOpacity="0" />
            </radialGradient>

            {/* 3D Wooden Cork Stopper Gradient */}
            <linearGradient id={`cork-grad-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="25%" stopColor="#d97706" />
              <stop offset="65%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Transparent Crystal Glass (mostly clear, faint cool tint + edge refraction) */}
            <linearGradient id={`tube-bg-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7ea0ff" stopOpacity="0.26" />
              <stop offset="10%" stopColor="#1b2a58" stopOpacity="0.14" />
              <stop offset="45%" stopColor="#0c1838" stopOpacity="0.05" />
              <stop offset="85%" stopColor="#0c1838" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#7ea0ff" stopOpacity="0.28" />
            </linearGradient>

            {/* Rolled Collar Lip Gradient */}
            <linearGradient id={`lip-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b9c7ff" stopOpacity="0.96" />
              <stop offset="42%" stopColor="#5267d2" stopOpacity="0.94" />
              <stop offset="100%" stopColor="#18275f" stopOpacity="1" />
            </linearGradient>

            {/* Left Gloss Specular Fading Gradient */}
            <linearGradient id={`specular-fade-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="8%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="90%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
            </linearGradient>

            {/* 3D Cylindrical Volume Shading (single key light from the left) */}
            {Object.values(COLOR_PALETTE).map((c: ColorDef) => (
              <linearGradient
                key={`grad-${c.id}-${index}`}
                id={`grad-${c.id}-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="14%" stopColor={c.topHex || c.hex} stopOpacity="1" />
                <stop offset="36%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="70%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="100%" stopColor={c.shadeHex || c.hex} stopOpacity="1" />
              </linearGradient>
            ))}

            {Object.values(COLOR_PALETTE).map((c: ColorDef) => (
              <linearGradient
                key={`tilted-grad-${c.id}-${index}`}
                id={`tilted-grad-${c.id}-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={c.topHex || c.hex} />
                <stop offset="16%" stopColor={c.hex} />
                <stop offset="100%" stopColor={c.hex} />
              </linearGradient>
            ))}

            {/* 2.5D Top Meniscus Cap Radiant Shading (Bright top-down light matching reference) */}
            {Object.values(COLOR_PALETTE).map((c: ColorDef) => (
              <linearGradient
                key={`meniscus-grad-${c.id}-${index}`}
                id={`meniscus-grad-${c.id}-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="70%"
              >
                <stop offset="0%" stopColor={c.topHex || c.hex} />
                <stop offset="70%" stopColor={c.topHex || c.hex} />
                <stop offset="100%" stopColor={c.hex} />
              </linearGradient>
            ))}

            {/* Frosted fog for hidden-bottle bottom layers */}
            <linearGradient id={`fog-grad-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b9ab8" />
              <stop offset="30%" stopColor="#c7d0e2" />
              <stop offset="55%" stopColor="#e4e9f4" />
              <stop offset="100%" stopColor="#8795b3" />
            </linearGradient>

            {/* Outer bottle silhouette clip matching Figma */}
            <clipPath id={`outer-clip-${index}`}>
              <path
                d="
                  M 24 14
                  L 24 28
                  C 24 38, 4.5 38, 4.5 47.5
                  L 4.5 186.5
                  C 4.5 204, 15 215, 38.5 215
                  C 62 215, 72.5 204, 72.5 186.5
                  L 72.5 47.5
                  C 72.5 38, 53 38, 53 28
                  L 53 14
                  Z
                "
              />
            </clipPath>

            {/* Inner chamber clip conforming exactly to natural curved bottle base */}
            <clipPath id={`inner-clip-${index}`}>
              <path
                d="
                  M 26 5
                  L 26 28
                  C 26 38, 6.3 38, 6.3 47.5
                  L 6.3 196
                  A 32 14.5 0 0 0 70.3 196
                  L 70.3 47.5
                  C 70.3 38, 51 38, 51 28
                  L 51 5
                  Z
                "
              />
            </clipPath>

            {/* Full-flow internal bottle cavity clip for tilted pouring (connects mouth to base) */}
            <clipPath id={`tilted-chamber-clip-${index}`}>
              <path
                d="
                  M 26.0 5.0
                  L 26.0 28.0
                  C 26.0 38, 6.3 38, 6.3 47.5
                  L 6.3 196.0
                  A 32 14.5 0 0 0 70.3 196.0
                  L 70.3 47.5
                  C 70.3 38, 51.0 38, 51.0 28
                  L 51.0 5.0
                  Z
                "
              />
            </clipPath>
          </defs>

          {/* 1. Crystal-Clear Transparent Glass Bottle (No dark box, no star) */}
          <image
            href="/figma/bottle_empty_clean.png"
            x="0"
            y="0"
            width="77"
            height="223"
            preserveAspectRatio="none"
          />


          <g key={`fluid-layers-${index}-${levelEntryId}`}>
            {/* Dynamic Pouring Stream Flow vs Stacked Liquid Layers */}
            {Math.abs(tiltAngle) > 0.5 ? (
              /* Gravity-aligned liquid layers with curved interfaces */
              <g
                clipPath={`url(#tilted-chamber-clip-${index})`}
              >
                {(() => {
                  if (clampedLayers.length === 0) return null;

                  const fluidSurfaceAngle = tiltAngle;
                  const totalUnits = clampedLayers.reduce((sum, l) => sum + l.heightPercent / 100, 0);
                  if (totalUnits <= 0.01) return null;

                  const boundaryYCache = new Map<number, number>();
                  const getBoundaryYForUnits = (units: number) => {
                    const key = Number(units.toFixed(4));
                    const cached = boundaryYCache.get(key);
                    if (cached !== undefined) return cached;
                    const boundary = getTiltedChamberSurfaceY(fluidSurfaceAngle, units / capacity);
                    boundaryYCache.set(key, boundary);
                    return boundary;
                  };

                  const unitsBelow = clampedLayers.map((_, layerIndex) =>
                    clampedLayers.slice(0, layerIndex).reduce((sum, layer) => sum + layer.heightPercent / 100, 0)
                  );
                  const gravityLayers = [];

                  for (let i = clampedLayers.length - 1; i >= 0; i--) {
                    const layerUnits = clampedLayers[i].heightPercent / 100;
                    const yTop = getBoundaryYForUnits(unitsBelow[i] + layerUnits);
                    const yBottom = i === 0 ? getBoundaryYForUnits(0) + 100 : getBoundaryYForUnits(unitsBelow[i]);
                    gravityLayers.push({
                      layer: clampedLayers[i],
                      lIdx: i,
                      yTop,
                      yBottom,
                    });
                  }

                  const ellipseRx = 28;
                  const ellipseRy = 7.5;
                  const gravityBands: {
                    colorId: string;
                    yTop: number;
                    yBottom: number;
                    isHidden: boolean;
                    isDimmed: boolean;
                    isTop: boolean;
                  }[] = [];

                  for (const [position, entry] of gravityLayers.entries()) {
                    const isHidden = hiddenCount > 0 && entry.lIdx < hiddenCount;
                    const isDimmed = maskHidden && entry.lIdx === 0;
                    const previousBand = gravityBands[gravityBands.length - 1];
                    if (previousBand && previousBand.colorId === entry.layer.colorId && previousBand.isHidden === isHidden && previousBand.isDimmed === isDimmed) {
                      previousBand.yBottom = entry.yBottom;
                    } else {
                      gravityBands.push({
                        colorId: entry.layer.colorId,
                        yTop: entry.yTop,
                        yBottom: entry.yBottom,
                        isHidden,
                        isDimmed,
                        isTop: position === 0,
                      });
                    }
                  }

                  return (
                    <g transform={`translate(0 ${liquidRetreat}) rotate(${-fluidSurfaceAngle}, 38.5, 5)`}>
                      {gravityBands.map((band, bandIndex) => {
                        const cDef = getColor(band.colorId);
                        const liquidFill = band.isHidden ? `url(#fog-grad-${index})` : `url(#grad-${cDef.id}-${index})`;
                        const curve = 4.6;
                        const bodyPath = `
                          M -350 ${band.yTop}
                          Q 38.5 ${band.yTop - curve} 350 ${band.yTop}
                          L 350 ${band.yBottom}
                          Q 38.5 ${band.yBottom - curve} -350 ${band.yBottom}
                          Z
                        `;

                        return (
                          <g key={`tilted-layer-${bandIndex}`} opacity={band.isDimmed ? 0.4 : 1}>
                            <path d={bodyPath} fill={liquidFill} />
                            {!band.isHidden && <path d={bodyPath} fill={`url(#liquid-depth-${index})`} />}

                            {band.isTop && (
                              <>
                                <ellipse
                                  cx="38.5"
                                  cy={band.yTop}
                                  rx={ellipseRx}
                                  ry={ellipseRy * 0.72}
                                  fill={band.isHidden ? `url(#fog-grad-${index})` : `url(#meniscus-grad-${cDef.id}-${index})`}
                                />
                                {!band.isHidden && <ellipse cx="38.5" cy={band.yTop + 1.1} rx="11" ry="1.15" fill="#ffffff" opacity="0.14" />}
                              </>
                            )}
                          </g>
                        );
                      })}
                      {gravityBands.slice(0, -1).map((band, bandIndex) => {
                        const nextBand = gravityBands[bandIndex + 1];
                        if (nextBand.colorId === band.colorId) return null;
                        const edgeY = band.yBottom;
                        return (
                          <path
                            key={`tilted-interface-${bandIndex}`}
                            d={`M -350 ${edgeY - 0.6} Q 38.5 ${edgeY - 2.8} 350 ${edgeY - 0.6} L 350 ${edgeY + 3.5} Q 38.5 ${edgeY + 1.5} -350 ${edgeY + 3.5} Z`}
                            fill={`url(#liquid-interface-shading-${index})`}
                            opacity="0.65"
                          />
                        );
                      })}
                    </g>
                  );
                })()}
              </g>
            ) : (
              /* Standard Rest State: Layered Continuous Fluid Volumes */
              <g clipPath={`url(#inner-clip-${index})`}>
                {fluidSegments.map((seg, sIdx) => {
                  const cDef = getColor(seg.colorId);
                  const liquidFill = seg.isHidden ? `url(#fog-grad-${index})` : `url(#grad-${cDef.id}-${index})`;

                  const bodyPath = seg.isBottom
                    ? `
                    M 6.3 ${seg.yTop}
                    L 6.3 196.0
                    A 32 14.5 0 0 0 70.3 196.0
                    L 70.3 ${seg.yTop}
                    Q 38.5 ${seg.yTop + RY} 6.3 ${seg.yTop}
                    Z
                  `
                    : `
                    M 6.3 ${seg.yTop}
                    L 6.3 ${seg.yBottom}
                    Q 38.5 ${seg.yBottom + RY} 70.3 ${seg.yBottom}
                    L 70.3 ${seg.yTop}
                    Q 38.5 ${seg.yTop + RY} 6.3 ${seg.yTop}
                    Z
                  `;

                  return (
                    <g key={`fluid-seg-${seg.colorId}-${sIdx}`} opacity={seg.isDimmed ? 0.4 : 1}>
                      {/* Unified 3D Fluid Cylinder Body (Same colors completely seamless) */}
                      <path
                        d={bodyPath}
                        fill={liquidFill}
                      />

                      {/* Frosted fog question mark over hidden bottom layers */}
                      {seg.isHidden && (
                        <text
                          x="38.5"
                          y={(seg.yTop + seg.yBottom) / 2 + 3}
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="bold"
                          fill="rgba(25, 35, 65, 0.6)"
                        >
                          ?
                        </text>
                      )}

                      {/* One blurred contact shadow at the color interface */}
                      {!seg.isBottom && (
                        <path
                          d={`M 8 ${seg.yBottom + 0.2} Q 38.5 ${seg.yBottom + RY + 0.2} 69 ${seg.yBottom + 0.2}`}
                          fill="none"
                          stroke="rgba(4, 12, 42, 0.24)"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          filter={`url(#liquid-interface-shadow-${index})`}
                          opacity="0.58"
                        />
                      )}

                      {/* 2.5D Perspective Bright Top Meniscus Cap (only on topmost fluid layer) */}
                      {seg.isTop && (seg.yBottom - seg.yTop) > 2 && (
                        <g
                          className={
                            isShaking
                              ? 'anim-liquid-shake'
                              : isSelected && !isPouringSource && !isPouringTarget
                                ? 'anim-liquid-select'
                                : entrySwayActive && !isPouringSource && !isPouringTarget
                                  ? 'anim-liquid-entry'
                                  : ''
                          }
                          onAnimationStart={(event) => {
                            if (event.animationName !== 'liquidEntrySway') setEntrySwayActive(false);
                          }}
                          onAnimationEnd={(event) => {
                            if (event.animationName === 'liquidEntrySway') setEntrySwayActive(false);
                          }}
                          style={{
                            transformBox: 'fill-box',
                            transformOrigin: '50% 50%',
                            animationDelay: `${(index % 7) * 32}ms`,
                          }}
                        >
                          {/* 2.5D 明亮通透立体顶面椭圆盖 */}
                          <ellipse
                            cx="38.5"
                            cy={seg.yTop}
                            rx={RX}
                            ry={RY}
                            fill={seg.isHidden ? `url(#fog-grad-${index})` : `url(#meniscus-grad-${cDef.id}-${index})`}
                          />
                          {/* Short, soft glint on the near/front edge of the meniscus */}
                          <path
                            d={`M 25 ${seg.yTop + 4.2} Q 38.5 ${seg.yTop + RY * 0.92} 52 ${seg.yTop + 4.2}`}
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.62"
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </g>

          {/* 3. High-Gloss Specular Glass Reflections Overlay (True Alpha Transparency) */}
          <image
            href="/figma/bottle_specular_clean.png"
            x="0"
            y="0"
            width="77"
            height="223"
            preserveAspectRatio="none"
            mask={`url(#liquid-star-clean-mask-${index})`}
            style={{ pointerEvents: 'none', mixBlendMode: 'lighten' }}
          />

          {/* 6. Wooden Cork Stopper */}
          {(hasCork || isCorkDropping || isWhirling || isFlying) && (
            <g className={isCorkDropping ? 'anim-cork-drop' : ''}>
              {/* Tapered Cork Stopper Plug Body */}
              <path
                d="M 28 4 L 29.5 15 C 29.5 17, 47.5 17, 47.5 15 L 49 4 Z"
                fill={`url(#cork-grad-${index})`}
                stroke="#78350f"
                strokeWidth="0.8"
              />
              {/* Top Flange / Rim of Cork */}
              <ellipse
                cx="38.5"
                cy="4"
                rx="11"
                ry="3.5"
                fill="#d97706"
                stroke="#b45309"
                strokeWidth="0.8"
              />
              {/* Specular Highlight on Cork Rim */}
              <ellipse
                cx="38.5"
                cy="3.8"
                rx="8"
                ry="1.8"
                fill="#fef3c7"
                opacity="0.65"
              />
            </g>
          )}

          {/* 7. Masked-bottle authentic cloth cover from Figma (Node 9:58) */}
          {(maskHidden || maskFalling) && (
            <g className={maskFalling ? 'anim-mask-fall' : ''} pointerEvents="none">
              <image
                href="/assets_figma/cloth_cover_clean.png"
                x="-7.5"
                y="0"
                width="92"
                height="223"
                preserveAspectRatio="none"
                style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.4))' }}
              />
            </g>
          )}

          {/* 8. Bottom-leak bottle: cracked glass base + leak hole */}
          {isLeaky && (
            <g pointerEvents="none">
              <path
                d="M 27 207 Q 38.5 195 50 207"
                stroke="rgba(223, 233, 255, 0.88)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 38.5 203 L 38.5 216"
                stroke="#edf5ff"
                strokeWidth="2.0"
                strokeLinecap="round"
                fill="none"
                opacity="1"
              />
              <circle cx="38.5" cy="210" r="1.8" fill="#f1f7ff" />
            </g>
          )}
        </svg>
      </div>

      {/* Ground Shadow */}
      <div
        className={`w-14 h-2.5 rounded-[50%] transition-all duration-200 pointer-events-none -mt-1 ${isSelected || isPouringSource
          ? 'scale-75 opacity-15 translate-y-1'
          : 'scale-100 opacity-55'
          }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(1, 5, 15, 0.55) 0%, rgba(1, 5, 15, 0.34) 38%, rgba(3, 10, 24, 0.12) 64%, transparent 82%)',
        }}
      />
    </div>
  );
}));

TestTube.displayName = 'TestTube';
