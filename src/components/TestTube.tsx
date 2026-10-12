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
export const BOTTLE_MOUTH_CENTER = { x: 38.5, y: 14 };
export const BOTTLE_CHAMBER_TOP = 47.5;
export const BOTTLE_CHAMBER_BOTTOM = 210.5;

export const getBottleMouthPoint = () => BOTTLE_MOUTH_CENTER;

export const getBottlePourSpoutPoint = (tiltAngle: number) => ({
  x: tiltAngle >= 0 ? 53 : 24,
  y: 14,
});

export const getBottleLiquidSurfaceY = (units: number, capacity = TUBE_CAPACITY) =>
  BOTTLE_CHAMBER_BOTTOM -
  (Math.max(0, Math.min(capacity, units)) / capacity) * (BOTTLE_CHAMBER_BOTTOM - BOTTLE_CHAMBER_TOP);

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
        className={`flex flex-col items-center group relative select-none opacity-0 pointer-events-none ${
          compact ? 'w-[42px] sm:w-[46px] h-[122px] sm:h-[133px]' : 'w-[54px] sm:w-[60px] h-[156px] sm:h-[174px]'
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
  const RY = 8.0;

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
  const targetSurfaceY = calculatedLayers.length > 0
    ? calculatedLayers[calculatedLayers.length - 1].yTop
    : BOTTLE_CHAMBER_BOTTOM;

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
        : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
      : 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
    opacity: isFlying ? 0.78 : 1,
    zIndex: isFlying ? 90 : isPouringSource ? 45 : isSelected ? 30 : 10,
    transformOrigin: isPouringSource
      ? `50% ${(BOTTLE_MOUTH_CENTER.y / BOTTLE_VIEWBOX_HEIGHT) * 100}%`
      : 'center bottom',
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center group relative cursor-pointer select-none ${
        isShaking ? 'anim-invalid-shake' : ''
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
        className={`relative flex flex-col items-center transition-all duration-200 ${
          isWhirling
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
        <svg
          viewBox="0 0 77 223"
          className={`overflow-visible select-none ${
            compact ? 'w-[44px] sm:w-[50px] h-[127px] sm:h-[145px]' : 'w-[62px] sm:w-[70px] h-[180px] sm:h-[203px]'
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

            {/* 3D Top Meniscus Horizontal Depth Shading (matches side wall lighting) */}
            {Object.values(COLOR_PALETTE).map((c: ColorDef) => (
              <linearGradient
                key={`meniscus-grad-${c.id}-${index}`}
                id={`meniscus-grad-${c.id}-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={c.topHex || c.hex} stopOpacity="1" />
                <stop offset="30%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="100%" stopColor={c.shadeHex || c.hex} stopOpacity="1" />
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

            {/* Inner chamber clip conforming exactly to Figma's inner bottle cavity (clip11_0_1) */}
            <clipPath id={`inner-clip-${index}`}>
              <path
                d="
                  M 6.3 47.5
                  H 70.3
                  V 186.5
                  C 70.3 199.755, 59.555 210.5, 46.3 210.5
                  H 30.3
                  C 17.045 210.5, 6.3 199.755, 6.3 186.5
                  V 47.5
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
            /* Physics-accurate Volume-conserved Fluid Surface when tilted */
            <g clipPath={`url(#inner-clip-${index})`}>
              {(() => {
                if (clampedLayers.length === 0) return null;

                const fluidSurfaceAngle = tiltAngle;
                const rad = (fluidSurfaceAngle * Math.PI) / 180;
                // Keep the layered color bands readable while preserving a volume-based sloped surface.
                const slope = -Math.tan(rad);

                const W = 32;
                const CX = 38.5;
                const Y_MIN = BOTTLE_CHAMBER_TOP;
                const Y_MAX = 210.5;
                const totalH = Y_MAX - Y_MIN;

                // Function to find C such that area under y = m*(x-CX) + C equals target volume
                const findC_SVG = (targetH: number) => {
                  const targetArea = 2 * W * targetH;
                  if (targetArea <= 0.05) return Y_MAX + Math.abs(slope) * W + 10;
                  if (targetArea >= 2 * W * totalH) return Y_MIN - Math.abs(slope) * W - 10;

                  let low = Y_MIN - Math.abs(slope) * W - totalH;
                  let high = Y_MAX + Math.abs(slope) * W + totalH;

                  const steps = 16;
                  const dx = (2 * W) / steps;

                  for (let iter = 0; iter < 14; iter++) {
                    const mid = (low + high) * 0.5;
                    let area = 0;
                    for (let s = 0; s < steps; s++) {
                      const x = (CX - W) + (s + 0.5) * dx;
                      const yLine = Math.max(Y_MIN, Math.min(Y_MAX, slope * (x - CX) + mid));
                      area += (Y_MAX - yLine) * dx;
                    }
                    if (area > targetArea) {
                      low = mid;
                    } else {
                      high = mid;
                    }
                  }
                  return (low + high) * 0.5;
                };

                // Compute cumulative height for each layer
                let runningH = 0;
                const cumulativeHeights = [0];
                for (let i = 0; i < clampedLayers.length; i++) {
                  const nominalH = getBlockNominalHeight(i, capacity);
                  const effectiveH = nominalH * (clampedLayers[i].heightPercent / 100);
                  runningH += effectiveH;
                  cumulativeHeights.push(runningH);
                }

                const boundaryOffsets = cumulativeHeights.map(findC_SVG);
                const yAtBoundary = (x: number, offset: number) =>
                  Math.max(Y_MIN, Math.min(Y_MAX, slope * (x - CX) + offset));

                return (
                  <>
                    {clampedLayers.map((layer, lIdx) => {
                      const cDef = getColor(layer.colorId);
                      const isHiddenLayer = hiddenCount > 0 && lIdx < hiddenCount;
                      const isDimmed = maskHidden && lIdx === 0;
                      const liquidFill = isHiddenLayer ? `url(#fog-grad-${index})` : `url(#tilted-grad-${cDef.id}-${index})`;

                      const hPrev = cumulativeHeights[lIdx];
                      const hCurr = cumulativeHeights[lIdx + 1];
                      if (hCurr - hPrev <= 0.2) return null;

                      const topLeft = yAtBoundary(CX - W, boundaryOffsets[lIdx + 1]);
                      const topRight = yAtBoundary(CX + W, boundaryOffsets[lIdx + 1]);
                      const bottomLeft = yAtBoundary(CX - W, boundaryOffsets[lIdx]);
                      const bottomRight = yAtBoundary(CX + W, boundaryOffsets[lIdx]);
                      const topEdge = `M 6.3 ${topLeft} L 70.3 ${topRight}`;
                      const pathD = lIdx === 0
                        ? `${topEdge} L 70.3 186.5 C 70.3 199.755, 59.555 210.5, 46.3 210.5 H 30.3 C 17.045 210.5, 6.3 199.755, 6.3 186.5 Z`
                        : `${topEdge} L 70.3 ${bottomRight} L 6.3 ${bottomLeft} Z`;

                      const isVeryTop = (lIdx === clampedLayers.length - 1);

                      return (
                        <g key={`tilted-layer-${lIdx}`} opacity={isDimmed ? 0.4 : 1}>
                          <path d={pathD} fill={liquidFill} />
                          {/* Meniscus surface highlight along topmost free surface */}
                          {isVeryTop && (
                            <path
                              d={topEdge}
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.45)"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                            />
                          )}
                          {/* Interface line between distinct color layers */}
                          {lIdx > 0 && clampedLayers[lIdx - 1]?.colorId !== layer.colorId && (
                            <path
                              d={`M 6.3 ${bottomLeft} L 70.3 ${bottomRight}`}
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.25)"
                              strokeWidth="0.8"
                            />
                          )}
                        </g>
                      );
                    })}

                  </>
                );
              })()}
            </g>
          ) : (
            /* Standard Rest State: Layered 3D Cylindrical Gel Blocks */
            <g clipPath={`url(#inner-clip-${index})`}>
              {calculatedLayers.map((layer, lIdx) => {
                const cDef = getColor(layer.colorId);
                const { yBottom, yTop, isBottom, isTop } = layer;
                const isHiddenLayer = hiddenCount > 0 && lIdx < hiddenCount;
                const isDimmed = maskHidden && lIdx === 0;
                const liquidFill = isHiddenLayer ? `url(#fog-grad-${index})` : `url(#grad-${cDef.id}-${index})`;

                const bodyPath = isBottom
                  ? `
                    M 6.3 ${yTop}
                    L 6.3 186.5
                    C 6.3 199.755, 17.045 210.5, 30.3 210.5
                    H 46.3
                    C 59.555 210.5, 70.3 199.755, 70.3 186.5
                    L 70.3 ${yTop}
                    A ${RX} ${RY} 0 0 1 6.3 ${yTop}
                    Z
                  `
                  : `
                    M 6.3 ${yTop}
                    L 6.3 ${yBottom}
                    A ${RX} ${RY} 0 0 0 70.3 ${yBottom}
                    L 70.3 ${yTop}
                    A ${RX} ${RY} 0 0 1 6.3 ${yTop}
                    Z
                  `;

                return (
                  <g key={`liquid-block-${layer.colorId}-${lIdx}`} opacity={isDimmed ? 0.4 : 1}>
                    <ellipse
                      cx="38.5"
                      cy={Math.min(yBottom + 4, 210.5)}
                      rx={24}
                      ry={Math.max(6, (yBottom - yTop) * 0.26)}
                      fill={`url(#liquid-bloom-${index})`}
                      opacity={0.7}
                      filter={`url(#liquid-glow-${index})`}
                    />

                    {/* 3D Fluid Cylinder Body */}
                    <path
                      d={bodyPath}
                      fill={liquidFill}
                    />

                    <path
                      d={bodyPath}
                      fill="none"
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="0.9"
                    />

                    {/* Frosted fog question mark over hidden bottom layers */}
                    {isHiddenLayer && (
                      <text
                        x="38.5"
                        y={(yTop + yBottom) / 2 + 3}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="bold"
                        fill="rgba(25, 35, 65, 0.6)"
                      >
                        ?
                      </text>
                    )}

                    {/* Subtle boundary glare between different stacked colors; no harsh black seam */}
                    {!isBottom && calculatedLayers[lIdx - 1]?.colorId !== layer.colorId && (
                      <path
                        d={`M 6.3 ${yBottom} A ${RX} ${RY} 0 0 0 70.3 ${yBottom}`}
                        stroke="rgba(255, 255, 255, 0.16)"
                        strokeWidth="0.8"
                        fill="none"
                      />
                    )}

                    {/* Top Meniscus 3D Oval Cap */}
                    {isTop && layer.heightPercent > 4 && (
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
                        <ellipse
                          cx="38.5"
                          cy={yTop}
                          rx={RX}
                          ry={RY}
                          fill={isHiddenLayer ? `url(#fog-grad-${index})` : `url(#meniscus-grad-${cDef.id}-${index})`}
                          stroke="rgba(255, 255, 255, 0.3)"
                          strokeWidth="0.65"
                        />
                        <path
                          d={`M 14 ${yTop + 1.4} Q 38.5 ${yTop + 5.5} 63 ${yTop + 1.4}`}
                          stroke="#ffffff"
                          strokeWidth="1.1"
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.42"
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
        className={`w-14 h-2.5 rounded-[50%] transition-all duration-200 pointer-events-none -mt-1 ${
          isSelected || isPouringSource
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
