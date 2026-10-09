import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Tube, ColorDef } from '../types/game';
import { getColor, COLOR_PALETTE } from '../utils/colors';
import { isTubeComplete, TUBE_CAPACITY } from '../solver/waterSortSolver';

export interface TestTubeRef {
  getSpoutPos: () => { x: number; y: number } | null;
  getMouthPos: () => { x: number; y: number } | null;
  getBoundingBox: () => DOMRect | null;
}

interface TestTubeProps {
  index: number;
  tube: Tube;
  capacity?: number;
  isSelected?: boolean;
  isHintSource?: boolean;
  isHintTarget?: boolean;
  isPouringSource?: boolean;
  isPouringFluid?: boolean;
  isPouringTarget?: boolean;
  isShaking?: boolean;
  tiltAngle?: number;
  translateX?: number;
  translateY?: number;
  showSymbols?: boolean;
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
  onClick: (index: number) => void;
  disabled?: boolean;
}

export const TestTube = forwardRef<TestTubeRef, TestTubeProps>(({
  index,
  tube,
  capacity = TUBE_CAPACITY,
  isSelected = false,
  isHintSource = false,
  isHintTarget = false,
  isPouringSource = false,
  isPouringFluid = false,
  isPouringTarget = false,
  isShaking = false,
  tiltAngle = 0,
  translateX = 0,
  translateY = 0,
  showSymbols = false,
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
  onClick,
  disabled = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    getSpoutPos: () => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      // When tilted, spout is the lower mouth lip
      // Center of mouth is at rect.left + rect.width*0.5, rect.top + mouthCenterY
      const mouthY = rect.top + 9 * (rect.height / 150);
      const cx = rect.left + rect.width * 0.5;
      const spoutX = tiltAngle > 0 ? cx + 11 : tiltAngle < 0 ? cx - 11 : cx;
      const spoutY = mouthY + 4;
      return { x: spoutX, y: spoutY };
    },
    getMouthPos: () => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      return { x: rect.left + rect.width * 0.5, y: rect.top + 9 * (rect.height / 150) };
    },
    getBoundingBox: () => {
      if (!containerRef.current) return null;
      return containerRef.current.getBoundingClientRect();
    },
  }));

  const isComplete = isTubeComplete(tube, capacity);

  // If already collected into shopping bag, render invisible placeholder to preserve grid alignment
  if (isCollected) {
    return (
      <div
        ref={containerRef}
        className={`flex flex-col items-center group relative select-none opacity-0 pointer-events-none ${
          compact ? 'w-[42px] sm:w-[46px] h-[120px] sm:h-[132px]' : 'w-[54px] sm:w-[60px] h-[154px] sm:h-[171px]'
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

  // Inner chamber coordinates (viewBox 0 0 60 150, 1:2.5 stout potion bottle)
  // Chamber cylinder runs y = 28 to 130; bottom curved U-dome runs y = 130 to 138. Total height = 110px.
  // Visual compensation: base layer has 8px in the curved dome, so giving it 33px nominal height
  // ensures its visible straight side-wall (130 - 105 = 25.0px) matches upper layers (77 / 3 = 25.67px).
  // All 4 layers have visually identical side-wall profiles (~25.0px to 25.7px).
  const CHAMBER_BOTTOM_Y = 138;
  const CHAMBER_TOP_Y = 28;
  const CHAMBER_HEIGHT = CHAMBER_BOTTOM_Y - CHAMBER_TOP_Y; // 110px
  const RX = 21.5;
  const RY = 4.8;

  const getBlockNominalHeight = (layerIdx: number, totalCapacity: number = 4): number => {
    if (totalCapacity === 4) {
      return layerIdx === 0 ? 33.0 : 25.67;
    }
    return CHAMBER_HEIGHT / totalCapacity;
  };

  const getBoundaryY = (boundaryIdx: number, totalCapacity: number = 4): number => {
    if (boundaryIdx <= 0) return CHAMBER_BOTTOM_Y;
    if (boundaryIdx >= totalCapacity) return CHAMBER_TOP_Y;
    if (totalCapacity === 4) {
      const boundaries = [138, 105, 79.33, 53.67, 28];
      if (boundaryIdx < boundaries.length) return boundaries[boundaryIdx];
      return CHAMBER_TOP_Y;
    }
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
            : 'filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]'
        }`}
      >
        <svg
          viewBox="0 0 60 150"
          className={`overflow-visible select-none ${
            compact ? 'w-[42px] sm:w-[46px] h-[120px] sm:h-[132px]' : 'w-[54px] sm:w-[60px] h-[154px] sm:h-[171px]'
          }`}
        >
          <defs>
            {/* 3D Wooden Cork Stopper Gradient */}
            <linearGradient id={`cork-grad-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="25%" stopColor="#d97706" />
              <stop offset="65%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Deep Cosmic Sapphire Background Gradient */}
            <linearGradient id={`tube-bg-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#586fe8" stopOpacity="0.58" />
              <stop offset="12%" stopColor="#172448" stopOpacity="0.78" />
              <stop offset="50%" stopColor="#0a1430" stopOpacity="0.48" />
              <stop offset="88%" stopColor="#172448" stopOpacity="0.76" />
              <stop offset="100%" stopColor="#657cff" stopOpacity="0.52" />
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

            {/* 3D Cylindrical Volume Shading for each Palette Color (with vertical glossy light core) */}
            {Object.values(COLOR_PALETTE).map((c: ColorDef) => (
              <linearGradient
                key={`grad-${c.id}-${index}`}
                id={`grad-${c.id}-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={c.shadeHex || c.hex} stopOpacity="0.95" />
                <stop offset="7%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="22%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="46%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="84%" stopColor={c.shadeHex || c.hex} stopOpacity="1" />
                <stop offset="100%" stopColor={c.shadeHex || '#000000'} stopOpacity="0.95" />
              </linearGradient>
            ))}

            {/* 3D Cylindrical Volume Shading for tilted fluid aligned to bottle width */}
            {Object.values(COLOR_PALETTE).map((c: ColorDef) => (
              <linearGradient
                key={`tilted-grad-${c.id}-${index}`}
                id={`tilted-grad-${c.id}-${index}`}
                gradientUnits="userSpaceOnUse"
                x1="6"
                y1="0"
                x2="54"
                y2="0"
              >
                <stop offset="0%" stopColor={c.shadeHex || c.hex} stopOpacity="0.95" />
                <stop offset="12%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="28%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="50%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="86%" stopColor={c.shadeHex || c.hex} stopOpacity="1" />
                <stop offset="100%" stopColor={c.shadeHex || '#000000'} stopOpacity="0.95" />
              </linearGradient>
            ))}

            {/* 3D Top Meniscus Radial Depth Shading for each Color */}
            {Object.values(COLOR_PALETTE).map((c: ColorDef) => (
              <linearGradient
                key={`meniscus-grad-${c.id}-${index}`}
                id={`meniscus-grad-${c.id}-${index}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={c.shadeHex || c.hex} stopOpacity="0.75" />
                <stop offset="50%" stopColor={c.hex} stopOpacity="0.95" />
                <stop offset="100%" stopColor={c.topHex || '#ffffff'} stopOpacity="1" />
              </linearGradient>
            ))}

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

          {/* 1. Deep Blue Transparent Glass Back Body */}
          <path
            d="
              M 17 9
              L 17 16
              C 17 22, 6 22, 6 28
              L 6 130
              C 6 139, 16 145, 30 145
              C 44 145, 54 139, 54 130
              L 54 28
              C 54 22, 43 22, 43 16
              L 43 9
              Z
            "
            fill={`url(#tube-bg-${index})`}
          />

          {/* 2. Fluid Layers (Dynamic Pouring Stream Flow vs Stacked Gel Blocks) */}
          {isPouringSource && isPouringFluid && tiltAngle !== 0 ? (
            /* Natural Gravity Stream Flow toward mouth lip when tilted */
            <g clipPath={`url(#inner-clip-${index})`}>
              {(() => {
                if (displayTube.length === 0) return null;
                const topColorId = displayTube[displayTube.length - 1];
                const topColorDef = getColor(topColorId);

                const isTiltRight = tiltAngle > 0;
                const rad = (tiltAngle * Math.PI) / 180;
                const tanTheta = Math.tan(rad);

                // Spout lip anchor where horizontal water level meets pouring lip (Y=9)
                const spoutLipX = isTiltRight ? 43 : 17;
                const spoutAnchorY = 9 + (spoutLipX - 30) * tanTheta;

                // Total units to pour and progress
                const totalToPour = drainingTotalCount > 0 ? drainingTotalCount : 1;
                const pourProgress = Math.min(1, Math.max(0, sourceDrainingCount / totalToPour));

                // Number of full layers below the draining fluid
                const baseRemainingUnits = Math.max(0, displayTube.length - totalToPour);

                // Start surface (at pouring lip) and End surface (at remaining layers' level)
                const yStart = spoutAnchorY;
                const yEnd = baseRemainingUnits === 0 ? 145 : getBoundaryY(baseRemainingUnits, capacity);
                const ySurfaceTop = yStart + pourProgress * (yEnd - yStart);

                return (
                  <>
                    <defs>
                      {/* Dynamic gradients for tilted layers rotated back to bottle frame */}
                      <linearGradient
                        id={`tilted-top-grad-${index}`}
                        gradientUnits="userSpaceOnUse"
                        x1="8.5"
                        y1="0"
                        x2="51.5"
                        y2="0"
                        gradientTransform={`rotate(${tiltAngle}, 30, ${ySurfaceTop})`}
                      >
                        <stop offset="0%" stopColor={topColorDef.shadeHex || topColorDef.hex} stopOpacity="0.95" />
                        <stop offset="12%" stopColor={topColorDef.hex} stopOpacity="1" />
                        <stop offset="30%" stopColor={topColorDef.hex} stopOpacity="1" />
                        <stop offset="52%" stopColor={topColorDef.hex} stopOpacity="1" />
                        <stop offset="86%" stopColor={topColorDef.shadeHex || topColorDef.hex} stopOpacity="1" />
                        <stop offset="100%" stopColor={topColorDef.shadeHex || topColorDef.hex} stopOpacity="0.95" />
                      </linearGradient>
                      {Array.from({ length: baseRemainingUnits }).map((_, i) => {
                        const k = baseRemainingUnits - 1 - i;
                        const cId = displayTube[k];
                        const cDef = getColor(cId);
                        const yAnchorK = getBoundaryY(k + 1, capacity);
                        return (
                          <linearGradient
                            key={`tilted-k-grad-${index}-${k}`}
                            id={`tilted-k-grad-${index}-${k}`}
                            gradientUnits="userSpaceOnUse"
                            x1="8.5"
                            y1="0"
                            x2="51.5"
                            y2="0"
                            gradientTransform={`rotate(${tiltAngle}, 30, ${yAnchorK})`}
                          >
                            <stop offset="0%" stopColor={cDef.shadeHex || cDef.hex} stopOpacity="0.95" />
                            <stop offset="12%" stopColor={cDef.hex} stopOpacity="1" />
                            <stop offset="30%" stopColor={cDef.hex} stopOpacity="1" />
                            <stop offset="52%" stopColor={cDef.hex} stopOpacity="1" />
                            <stop offset="86%" stopColor={cDef.shadeHex || cDef.hex} stopOpacity="1" />
                            <stop offset="100%" stopColor={cDef.shadeHex || cDef.hex} stopOpacity="0.95" />
                          </linearGradient>
                        );
                      })}
                    </defs>

                    {/* 1. Top Pouring Layer: rendered FIRST from ySurfaceTop downwards */}
                    {pourProgress < 0.99 && (
                      <g key="tilted-top-run" transform={`rotate(${-tiltAngle}, 30, ${ySurfaceTop})`}>
                        {/* 3D Volumetric Fluid Body */}
                        <rect
                          x="-150"
                          y={ySurfaceTop}
                          width="360"
                          height="320"
                          fill={`url(#tilted-top-grad-${index})`}
                        />

                        {/* Gleaming Meniscus Specular Highlight along level liquid surface */}
                        <line
                          x1="-150"
                          y1={ySurfaceTop}
                          x2="210"
                          y2={ySurfaceTop}
                          stroke="#ffffff"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          opacity="0.9"
                        />
                      </g>
                    )}

                    {/* 2. Non-draining layers below the pouring fluid:
                        Rendered in DESCENDING order (from baseRemainingUnits - 1 DOWN to 0)
                        so lower layers overwrite upper layers below each boundary,
                        preserving natural gravitational stacking! */}
                    {Array.from({ length: baseRemainingUnits })
                      .map((_, i) => baseRemainingUnits - 1 - i)
                      .map((k) => {
                        const cId = displayTube[k];
                        const yAnchorK = getBoundaryY(k + 1, capacity);
                        const colorAbove = k === baseRemainingUnits - 1 ? topColorId : displayTube[k + 1];
                        const hasDifferentColorAbove = colorAbove !== cId;

                        return (
                          <g key={`tilted-layer-${k}`} transform={`rotate(${-tiltAngle}, 30, ${yAnchorK})`}>
                            {/* Liquid body from this layer's surface downwards */}
                            <rect
                              x="-150"
                              y={yAnchorK}
                              width="360"
                              height="320"
                              fill={`url(#tilted-k-grad-${index}-${k})`}
                            />

                            {/* Crisp Meniscus Interface between different colors */}
                            {hasDifferentColorAbove && (
                              <>
                                <line
                                  x1="-150"
                                  y1={yAnchorK}
                                  x2="210"
                                  y2={yAnchorK}
                                  stroke="rgba(0, 0, 0, 0.28)"
                                  strokeWidth="1.2"
                                />
                                <line
                                  x1="-150"
                                  y1={yAnchorK - 0.6}
                                  x2="210"
                                  y2={yAnchorK - 0.6}
                                  stroke="rgba(255, 255, 255, 0.5)"
                                  strokeWidth="0.8"
                                />
                              </>
                            )}

                            {/* If top pouring fluid is fully drained, this layer becomes the top free surface */}
                            {k === baseRemainingUnits - 1 && pourProgress >= 0.99 && (
                              <line
                                x1="-150"
                                y1={yAnchorK}
                                x2="210"
                                y2={yAnchorK}
                                stroke="#ffffff"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                opacity="0.9"
                              />
                            )}
                          </g>
                        );
                      })}

                    {/* 3. Liquid stream guide along the lower neck wall into spout */}
                    {pourProgress < 0.98 && (
                      <>
                        <path
                          d={
                            isTiltRight
                              ? 'M 51.5 45 L 51.5 28 C 51.5 22, 43 22, 43 16 L 43 9'
                              : 'M 8.5 45 L 8.5 28 C 8.5 22, 17 22, 17 16 L 17 9'
                          }
                          stroke={`url(#tilted-top-grad-${index})`}
                          strokeWidth="4"
                          strokeLinecap="round"
                          fill="none"
                          opacity={pourProgress < 0.9 ? 0.9 : 0.9 * (1 - (pourProgress - 0.9) / 0.08)}
                        />
                        <path
                          d={
                            isTiltRight
                              ? 'M 50.5 45 L 50.5 28 L 42.5 16 L 42.5 9'
                              : 'M 9.5 45 L 9.5 28 L 17.5 16 L 17.5 9'
                          }
                          stroke="rgba(255, 255, 255, 0.6)"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          fill="none"
                          opacity={pourProgress < 0.9 ? 0.8 : 0.8 * (1 - (pourProgress - 0.9) / 0.08)}
                        />
                      </>
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
                  <g key={`liquid-block-${layer.colorId}-${lIdx}`}>
                    {/* 3D Fluid Cylinder Body */}
                    <path
                      d={bodyPath}
                      fill={`url(#grad-${cDef.id}-${index})`}
                    />

                    {/* Subtle boundary crease between different stacked colors */}
                    {!isBottom && calculatedLayers[lIdx - 1]?.colorId !== layer.colorId && (
                      <path
                        d={`M 8.5 ${yBottom} A ${RX} ${RY} 0 0 0 51.5 ${yBottom}`}
                        stroke="rgba(0, 0, 0, 0.3)"
                        strokeWidth="1.2"
                        fill="none"
                      />
                    )}

                    {/* Top Meniscus 3D Oval Cap */}
                    {isTop && layer.heightPercent > 4 && (
                      <g>
                        <ellipse
                          cx="30"
                          cy={yTop}
                          rx={RX}
                          ry={RY}
                          fill={cDef.hex}
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

                    {showSymbols && (
                      <text
                        x="30"
                        y={isBottom ? (yTop + Math.min(132, yBottom)) / 2 : (yTop + yBottom) / 2}
                        fill={cDef.textColor}
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {cDef.symbol}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Crystal Glass Specular Reflections Layer (OVER the liquid) */}
          {/* Outer Glass Contour Outline */}
          <path
            d="
              M 17 9
              L 17 16
              C 17 22, 6 22, 6 28
              L 6 130
              C 6 139, 16 145, 30 145
              C 44 145, 54 139, 54 130
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
              C 7.5 137, 17 143.5, 30 143.5
              C 43 143.5, 52.5 137, 52.5 129
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
            d="M 19 14 C 15 18, 9.5 22, 9.5 28 L 9.5 128 C 9.5 133, 13 137, 18 138"
            fill="none"
            stroke="#5b72f2"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.38"
          />
          <path
            d="M 19 14 C 15 18, 9.5 22, 9.5 28 L 9.5 128 C 9.5 133, 13 137, 18 138"
            fill="none"
            stroke={`url(#specular-fade-${index})`}
            strokeWidth="1.25"
            strokeLinecap="round"
          />

          {/* Right Shoulder Curved Specular Arc */}
          <path
            d="M 41 14 C 45 18, 50.5 22, 50.5 28"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.62"
          />

          {/* Right Wall Rim Light (Giving 3D bilateral cylindrical curvature) */}
          <path
            d="M 50.5 30 L 50.5 118"
            stroke="#8194ff"
            strokeWidth="1.0"
            strokeLinecap="round"
            opacity="0.46"
          />
          <path
            d="M 50.5 35 L 50.5 55"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.48"
          />

          {/* Solid Crystal Base Refraction Smile Arcs */}
          <path
            d="M 13 139 Q 30 145.5 47 139"
            stroke="#5268e5"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.82"
          />
          <path
            d="M 18 140.5 Q 30 146 42 140.5"
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
            rx="10.8"
            ry="2.8"
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
