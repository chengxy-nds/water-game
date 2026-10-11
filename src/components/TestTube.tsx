import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Bottle, ColorDef } from '../types/game';
import { getColor, COLOR_PALETTE } from '../utils/colors';
import { isBottleComplete, TUBE_CAPACITY } from '../solver/waterSortSolver';

export interface TestTubeRef {
  getSpoutPos: () => { x: number; y: number } | null;
  getMouthPos: () => { x: number; y: number } | null;
  getBoundingBox: () => DOMRect | null;
}

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

export const TestTube = forwardRef<TestTubeRef, TestTubeProps>(({
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
      // When tilted, spout is the lower mouth lip.
      // Scale viewBox units (77x223) to the rendered CSS pixels.
      const scale = rect.width / 77;
      const mouthY = rect.top + 14 * (rect.height / 223);
      const cx = rect.left + rect.width * 0.5;
      // Neck half-width is 16 in viewBox units (x 22.5..54.5).
      const spoutX = tiltAngle > 0 ? cx + 16 * scale : tiltAngle < 0 ? cx - 16 * scale : cx;
      const spoutY = mouthY + 5 * (rect.height / 223);
      return { x: spoutX, y: spoutY };
    },
    getMouthPos: () => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      return { x: rect.left + rect.width * 0.5, y: rect.top + 14 * (rect.height / 223) };
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
  const RY = 6.0;

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

  const transformStyle: React.CSSProperties = {
    transform: isFlying
      ? `translate(${flyX}px, ${flyY}px) scale(0.38) rotate(-6deg)`
      : isPouringSource
      ? `translate(${translateX}px, ${translateY}px) rotate(${tiltAngle}deg)`
      : isSelected
      ? 'translateY(-18px)'
      : 'translateY(0)',
    transition: isFlying
      ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease-in'
      : isPouringSource
      ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
      : 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
    opacity: isFlying ? 0.05 : 1,
    zIndex: isFlying ? 90 : isPouringSource ? 45 : isSelected ? 30 : 10,
    transformOrigin: isPouringSource ? '50% 9px' : 'center bottom',
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
          viewBox="0 0 60 150"
          className={`overflow-visible select-none ${
            compact ? 'w-[42px] sm:w-[46px] h-[120px] sm:h-[132px]' : 'w-[54px] sm:w-[60px] h-[154px] sm:h-[171px]'
          }`}
        >
          <defs>
            <filter id={`liquid-glow-${index}`} x="-30%" y="-30%" width="160%" height="180%">
              <feGaussianBlur stdDeviation="1.7" result="blur" />
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

            {/* Outer bottle silhouette clip so the cloth cover never overflows the glass */}
            <clipPath id={`outer-clip-${index}`}>
              <path d="M 17 9 L 17 16 C 17 22, 6 22, 6 28 L 6 130 C 6 136, 16 141, 30 141 C 44 141, 54 136, 54 130 L 54 28 C 54 22, 43 22, 43 16 L 43 9 Z" />
            </clipPath>

            {/* Inner chamber clip conforming exactly to inner bottle cavity */}
            <clipPath id={`inner-clip-${index}`}>
              <path
                d="
                  M 17 16
                  C 17 22, 8.5 22, 8.5 28
                  L 8.5 130
                  C 8.5 135, 18 138, 30 138
                  C 42 138, 51.5 135, 51.5 130
                  L 51.5 28
                  C 51.5 22, 43 22, 43 16
                  L 43 9
                  L 17 9
                  Z
                "
              />
            </clipPath>
          </defs>

          {/* 1. Transparent Glass Back Body */}
          <path
            d="
              M 17 9
              L 17 16
              C 17 22, 6 22, 6 28
              L 6 130
              C 6 136, 16 141, 30 141
              C 44 141, 54 136, 54 130
              L 54 28
              C 54 22, 43 22, 43 16
              L 43 9
              Z
            "
            fill={`url(#tube-bg-${index})`}
          />

          {/* Far (back) wall — slightly narrower & raised for front/back parallax */}
          <path
            d="
              M 18 4.2
              L 18 11.2
              C 18 17.2, 7 17.2, 7 23.2
              L 7 125.2
              C 7 131.2, 17 136.2, 30 136.2
              C 43 136.2, 53 131.2, 53 125.2
              L 53 23.2
              C 53 17.2, 42 17.2, 42 11.2
              L 42 4.2
              Z
            "
            fill="rgba(150, 180, 255, 0.10)"
            stroke="rgba(200, 215, 255, 0.30)"
            strokeWidth="0.8"
          />

          <g key={`fluid-layers-${index}-${levelEntryId}`}>
          {/* Dynamic Pouring Stream Flow vs Stacked Liquid Layers */}
          {Math.abs(tiltAngle) > 0.5 ? (
            /* Physics-accurate Volume-conserved Fluid Surface when tilted */
            <g clipPath={`url(#inner-clip-${index})`}>
              {(() => {
                if (clampedLayers.length === 0) return null;

                const isTiltRight = tiltAngle > 0;
                const rad = (tiltAngle * Math.PI) / 180;
                // In SVG coords (+Y is down), tiltAngle > 0 tilts clockwise so surface slopes with m = -tan(tiltAngle)
                const slope = -Math.tan(rad);

                const W = 21.5;
                const CX = 30;
                const Y_MIN = 9;
                const Y_MAX = 138;
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

                  for (let iter = 0; iter < 16; iter++) {
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

                const sampleCount = 18;
                const dx = (2 * W) / sampleCount;

                return (
                  <>
                    {clampedLayers.map((layer, lIdx) => {
                      const cDef = getColor(layer.colorId);
                      const isHiddenLayer = hiddenCount > 0 && lIdx < hiddenCount;
                      const isDimmed = maskHidden && lIdx === 0;
                      const liquidFill = isHiddenLayer ? `url(#fog-grad-${index})` : `url(#grad-${cDef.id}-${index})`;

                      const hPrev = cumulativeHeights[lIdx];
                      const hCurr = cumulativeHeights[lIdx + 1];
                      if (hCurr - hPrev <= 0.2) return null;

                      const cTop = findC_SVG(hCurr);
                      const cBot = findC_SVG(hPrev);

                      // Build polygon path
                      const ptsTop: Array<[number, number]> = [];
                      const ptsBot: Array<[number, number]> = [];

                      for (let s = 0; s <= sampleCount; s++) {
                        const x = (CX - W) + s * dx;
                        const yTop = Math.max(Y_MIN, Math.min(Y_MAX, slope * (x - CX) + cTop));
                        let yBot: number;
                        if (lIdx === 0) {
                          const norm = (x - CX) / W;
                          const uBottom = 130 + 8 * (norm * norm);
                          yBot = Math.min(yTop, uBottom);
                        } else {
                          yBot = Math.max(Y_MIN, Math.min(Y_MAX, slope * (x - CX) + cBot));
                        }
                        ptsTop.push([x, yTop]);
                        ptsBot.push([x, yBot]);
                      }

                      let pathD = `M ${ptsTop[0][0]} ${ptsTop[0][1]} `;
                      for (let s = 1; s <= sampleCount; s++) {
                        pathD += `L ${ptsTop[s][0]} ${ptsTop[s][1]} `;
                      }
                      for (let s = sampleCount; s >= 0; s--) {
                        pathD += `L ${ptsBot[s][0]} ${ptsBot[s][1]} `;
                      }
                      pathD += 'Z';

                      const isVeryTop = (lIdx === clampedLayers.length - 1);

                      return (
                        <g key={`tilted-layer-${lIdx}`} opacity={isDimmed ? 0.4 : 1}>
                          <path d={pathD} fill={liquidFill} />
                          {/* Meniscus surface highlight along topmost free surface */}
                          {isVeryTop && (
                            <path
                              d={`M ${ptsTop[0][0]} ${ptsTop[0][1]} ` + ptsTop.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ')}
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.45)"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                            />
                          )}
                          {/* Interface line between distinct color layers */}
                          {lIdx > 0 && clampedLayers[lIdx - 1]?.colorId !== layer.colorId && (
                            <path
                              d={`M ${ptsBot[0][0]} ${ptsBot[0][1]} ` + ptsBot.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ')}
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.25)"
                              strokeWidth="0.8"
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Smooth fluid guide filament along the lip when pouring stream is active */}
                    {isPouringSource && isPouringFluid && (
                      <path
                        d={
                          isTiltRight
                            ? 'M 51.5 35 L 51.5 28 C 51.5 22, 43 22, 43 16 L 43 9'
                            : 'M 8.5 35 L 8.5 28 C 8.5 22, 17 22, 17 16 L 17 9'
                        }
                        stroke={`url(#grad-${getColor(clampedLayers[clampedLayers.length - 1]?.colorId || 'blue').id}-${index})`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        fill="none"
                        opacity={0.88}
                      />
                    )}
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
                    M 8.5 ${yTop}
                    L 8.5 138
                    L 51.5 138
                    L 51.5 ${yTop}
                    A ${RX} ${RY} 0 0 1 8.5 ${yTop}
                    Z
                  `
                  : `
                    M 8.5 ${yTop}
                    L 8.5 ${yBottom}
                    A ${RX} ${RY} 0 0 0 51.5 ${yBottom}
                    L 51.5 ${yTop}
                    A ${RX} ${RY} 0 0 1 8.5 ${yTop}
                    Z
                  `;

                return (
                  <g key={`liquid-block-${layer.colorId}-${lIdx}`} opacity={isDimmed ? 0.4 : 1}>
                    <ellipse
                      cx="30"
                      cy={Math.min(yBottom + 4, 138)}
                      rx={18.8}
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
                        x="30"
                        y={(yTop + yBottom) / 2 + 3}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill="rgba(25, 35, 65, 0.6)"
                      >
                        ?
                      </text>
                    )}

                    {/* Subtle boundary glare between different stacked colors; no harsh black seam */}
                    {!isBottom && calculatedLayers[lIdx - 1]?.colorId !== layer.colorId && (
                      <path
                        d={`M 8.5 ${yBottom} A ${RX} ${RY} 0 0 0 51.5 ${yBottom}`}
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
                          cx="30"
                          cy={yTop}
                          rx={RX}
                          ry={RY}
                          fill={isHiddenLayer ? `url(#fog-grad-${index})` : `url(#meniscus-grad-${cDef.id}-${index})`}
                          stroke="rgba(255, 255, 255, 0.3)"
                          strokeWidth="0.65"
                        />
                        <path
                          d={`M 11.5 ${yTop + 1.4} Q 30 ${yTop + 4.8} 48.5 ${yTop + 1.4}`}
                          stroke="#ffffff"
                          strokeWidth="0.9"
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

          {/* Crystal Glass Specular Reflections Layer (OVER the liquid) */}
          {/* Outer Glass Contour Outline */}
          <path
            d="
              M 17 9
              L 17 16
              C 17 22, 6 22, 6 28
              L 6 130
              C 6 136, 16 141, 30 141
              C 44 141, 54 136, 54 130
              L 54 28
              C 54 22, 43 22, 43 16
              L 43 9
            "
            fill="none"
            stroke="#536be9"
            strokeWidth="3.0"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Inner Glass Wall Refraction Line (Visible Glass Thickness) */}
          <path
            d="M 40 32 C 43 30, 46 33, 46 38 L 46 50 C 45 53, 42 51, 41 48 Z"
            fill="rgba(224, 233, 255, 0.28)"
          />
          <path
            d="M 42 34 C 44 34, 45 36, 45 39 L 45 43"
            fill="none"
            stroke="rgba(255, 255, 255, 0.68)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="
              M 18 11
              L 18 16.5
              C 18 21.5, 7.5 22.5, 7.5 28
              L 7.5 129
              C 7.5 134, 17 140.5, 30 140.5
              C 43 140.5, 52.5 134, 52.5 129
              L 52.5 28
              C 52.5 22.5, 42 21.5, 42 16.5
              L 42 11
            "
            fill="none"
            stroke="rgba(198, 211, 255, 0.55)"
            strokeWidth="0.85"
          />

          {/* Left Vertical High-Gloss Specular Stripe (Continuous flow from neck through shoulder to base) */}
          <path
            d="M 19 14 C 15 18, 9.5 22, 9.5 28 L 9.5 128 C 9.5 131, 13 135, 18 136"
            fill="none"
            stroke="#5b72f2"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.38"
          />
          <path
            d="M 19 14 C 15 18, 9.5 22, 9.5 28 L 9.5 128 C 9.5 131, 13 135, 18 136"
            fill="none"
            stroke={`url(#specular-fade-${index})`}
            strokeWidth="1.25"
            strokeLinecap="round"
          />

          {/* Solid Crystal Base Refraction Smile Arcs */}
          <path
            d="M 13 136 Q 30 141.5 47 136"
            stroke="#5268e5"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.82"
          />
          <path
            d="M 18 137.5 Q 30 142 42 137.5"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.72"
          />

          {/* 5. Top Lip Bead Collar Ring (3D Torus Lip) */}
          <ellipse
            cx="30"
            cy="9.8"
            rx="16.5"
            ry="4.8"
            fill="#172457"
            stroke="#6e83ff"
            strokeWidth="1.1"
            opacity="0.95"
          />
          <ellipse
            cx="30"
            cy="9"
            rx="15.8"
            ry="4.6"
            fill={`url(#lip-${index})`}
            stroke="#91a2ff"
            strokeWidth="1.8"
          />
          {/* Rolled lip 3D depth shadow under rim */}
          <path
            d="M 14.5 9 C 14.5 14, 45.5 14, 45.5 9"
            stroke="#0b1938"
            strokeWidth="2.4"
            fill="none"
            opacity="0.75"
          />
          {/* Inner dark cavity */}
          <ellipse
            cx="30"
            cy="9"
            rx="12.5"
            ry="3.0"
            fill="#020817"
            stroke="rgba(159, 174, 255, 0.82)"
            strokeWidth="1.15"
          />
          <path
            d="M 20 10.4 Q 30 13.6 40 10.4"
            stroke="rgba(201, 216, 255, 0.95)"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
          {/* Front crescent specular arc */}
          <path
            d="M 15.5 7.1 Q 30 4.9 44.5 7.1"
            stroke="#ffffff"
            strokeWidth="1.7"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
          />

          {/* 6. Wooden Cork Stopper */}
          {(hasCork || isCorkDropping || isWhirling || isFlying) && (
            <g className={isCorkDropping ? 'anim-cork-drop' : ''}>
              {/* Tapered Cork Stopper Plug Body */}
              <path
                d="M 21.5 1 L 22.5 10.5 C 22.5 12, 37.5 12, 37.5 10.5 L 38.5 1 Z"
                fill={`url(#cork-grad-${index})`}
                stroke="#78350f"
                strokeWidth="0.8"
              />
              {/* Top Flange / Rim of Cork */}
              <ellipse
                cx="30"
                cy="1"
                rx="8.5"
                ry="2.6"
                fill="#d97706"
                stroke="#b45309"
                strokeWidth="0.8"
              />
              {/* Specular Highlight on Cork Rim */}
              <ellipse
                cx="30"
                cy="0.8"
                rx="6"
                ry="1.4"
                fill="#fef3c7"
                opacity="0.65"
              />
            </g>
          )}

          {/* 7. Masked-bottle cloth cover (hides layers; bottom layer peeks dimly) */}
          {(maskHidden || maskFalling) && (
            <g clipPath={`url(#outer-clip-${index})`} className={maskFalling ? 'anim-mask-fall' : ''}>
              <defs>
                <linearGradient id={`cloth-grad-${index}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#b58a60" />
                  <stop offset="20%" stopColor="#dcab76" />
                  <stop offset="50%" stopColor="#c89662" />
                  <stop offset="80%" stopColor="#dcab76" />
                  <stop offset="100%" stopColor="#a87a50" />
                </linearGradient>
              </defs>
              {/* Burlap cloth body from shoulder down to just above the bottom layer */}
              <path
                d="M 6 28 L 6 96 C 6 101, 10 103, 13 100 L 17 103 C 20 106, 25 106, 28 103 L 31 105 C 34 107, 38 106, 40 103 L 44 104 C 47 105, 51 102, 54 97 L 54 28 C 54 22, 43 22, 43 16 L 17 16 C 17 22, 6 22, 6 28 Z"
                fill={`url(#cloth-grad-${index})`}
                stroke="#7a5230"
                strokeWidth="1.1"
              />
              {/* Fabric fold creases */}
              <path d="M 30 24 L 29 100" stroke="#7a5230" strokeWidth="1.4" opacity="0.45" fill="none" />
              <path d="M 18 27 L 20 98" stroke="#7a5230" strokeWidth="1" opacity="0.3" fill="none" />
              <path d="M 42 27 L 40 98" stroke="#7a5230" strokeWidth="1" opacity="0.3" fill="none" />
              {/* Sewn question mark */}
              <text x="30" y="67" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#5f3d1e" opacity="0.85">
                ?
              </text>
            </g>
          )}

          {/* 8. Bottom-leak bottle: cracked glass base + leak hole */}
          {isLeaky && (
            <g pointerEvents="none">
              <path
                d="M 21 136.5 Q 30 127 39 136.5"
                stroke="rgba(223, 233, 255, 0.88)"
                strokeWidth="1.25"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 23.5 138.5 C 26.5 135.2, 27.8 134.2, 30 133.6 C 32.2 134.2, 33.5 135.2, 36.5 138.5"
                stroke="rgba(210, 228, 255, 0.9)"
                strokeWidth="1.1"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 30 133.3 L 30 144.4"
                stroke="#edf5ff"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
                opacity="1"
              />
              <path
                d="M 18.5 141.8 Q 30 144.8 41.5 141.8"
                stroke="rgba(233, 242, 255, 0.92)"
                strokeWidth="1.15"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 23.5 141.7 L 26.4 138.1 L 28.6 135.9 L 30 134.3 L 31.4 135.9 L 33.6 138.1 L 36.5 141.7"
                stroke="rgba(215, 230, 255, 0.9)"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M 17 139.2 L 24 136.6 L 20.4 134.8 L 27.2 132.5 L 25 130.1 L 30 128.8 L 35 130.1 L 32.8 132.5 L 39.6 134.8 L 36 136.6 L 43 139.2"
                stroke="rgba(170, 198, 255, 0.7)"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="30" cy="138.7" r="1.4" fill="#f1f7ff" />
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
});

TestTube.displayName = 'TestTube';
