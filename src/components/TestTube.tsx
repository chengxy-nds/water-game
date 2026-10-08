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
  isPouringTarget?: boolean;
  isShaking?: boolean;
  tiltAngle?: number;
  translateX?: number;
  translateY?: number;
  showSymbols?: boolean;
  sourceDrainingCount?: number;
  targetRisingCount?: number;
  activePourColor?: string | null;
  completionPhase?: 'cork_drop' | 'whirling' | 'flying' | null;
  flyX?: number;
  flyY?: number;
  hasCork?: boolean;
  isCollected?: boolean;
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
  isPouringTarget = false,
  isShaking = false,
  tiltAngle = 0,
  translateX = 0,
  translateY = 0,
  showSymbols = false,
  sourceDrainingCount = 0,
  targetRisingCount = 0,
  activePourColor = null,
  completionPhase = null,
  flyX = 0,
  flyY = 0,
  hasCork = false,
  isCollected = false,
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
        className="flex flex-col items-center group relative select-none opacity-0 pointer-events-none w-[50px] sm:w-[54px] h-[125px] sm:h-[135px]"
      />
    );
  }

  const isFlying = completionPhase === 'flying';
  const isWhirling = completionPhase === 'whirling';
  const isCorkDropping = completionPhase === 'cork_drop';

  // Compute layers to render
  const displayTube = [...tube];
  let drainingTopPercent = 100;
  if (isPouringSource && sourceDrainingCount > 0 && displayTube.length > 0) {
    drainingTopPercent = Math.max(0, 100 - sourceDrainingCount * 100);
  }

  let risingColor: string | null = null;
  let risingPercent = 0;
  if (isPouringTarget && targetRisingCount > 0 && activePourColor) {
    risingColor = activePourColor;
    risingPercent = Math.min(100, targetRisingCount * 100);
  }

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

  interface RenderLayer {
    colorId: string;
    heightPercent: number;
    isTop: boolean;
    isBottom: boolean;
  }

  const layers: RenderLayer[] = [];
  displayTube.forEach((colorId, idx) => {
    const isTop = idx === displayTube.length - 1 && !risingColor;
    const isBottom = idx === 0;
    const heightPct = isTop && isPouringSource ? drainingTopPercent : 100;
    if (heightPct > 0) {
      layers.push({
        colorId,
        heightPercent: heightPct,
        isTop,
        isBottom,
      });
    }
  });

  if (risingColor && risingPercent > 0) {
    layers.push({
      colorId: risingColor,
      heightPercent: risingPercent,
      isTop: true,
      isBottom: layers.length === 0,
    });
  }

  // Inner chamber coordinates (viewBox 0 0 60 150, 1:2.5 stout potion bottle)
  // 4 full blocks reach y = 138 - (4 * 27.5) = 28, completely filling the cylinder!
  // Leaves 19px (12.7%) for the shoulder & neck, giving a perfectly lush, 100% full look.
  const CHAMBER_BOTTOM_Y = 138;
  const BLOCK_HEIGHT = 27.5;
  const RX = 21.5;
  const RY = 4.8;

  let currentY = CHAMBER_BOTTOM_Y;
  const calculatedLayers = layers.map((layer) => {
    const layerH = BLOCK_HEIGHT * (layer.heightPercent / 100);
    const yBottom = currentY;
    const yTop = yBottom - layerH;
    currentY = yTop;
    return { ...layer, yBottom, yTop };
  });

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
            ? 'filter drop-shadow-[0_0_16px_rgba(56,189,248,0.95)]'
            : isHintSource
            ? 'filter drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]'
            : isHintTarget
            ? 'filter drop-shadow-[0_0_12px_rgba(52,211,153,0.85)]'
            : 'filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]'
        }`}
      >
        <svg
          viewBox="0 0 60 150"
          className="w-[50px] sm:w-[54px] h-[125px] sm:h-[135px] overflow-visible select-none"
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
            <linearGradient id={`tube-bg-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#081844" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#040e2c" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#020618" stopOpacity="0.85" />
            </linearGradient>

            {/* Rolled Collar Lip Gradient */}
            <linearGradient id={`lip-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.95" />
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
                <stop offset="22%" stopColor={c.topHex || '#ffffff'} stopOpacity="0.92" />
                <stop offset="46%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="84%" stopColor={c.shadeHex || c.hex} stopOpacity="1" />
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
          {isPouringSource && tiltAngle !== 0 ? (
            /* Natural Gravity Stream Flow toward mouth lip when tilted */
            <g clipPath={`url(#inner-clip-${index})`}>
              {(() => {
                if (displayTube.length === 0) return null;
                const topColorId = displayTube[displayTube.length - 1];
                const topColorDef = getColor(topColorId);
                const isTiltRight = tiltAngle > 0;

                // Find where the top pouring color run starts (consecutive blocks of same color at top)
                let runStartIdx = displayTube.length - 1;
                while (runStartIdx > 0 && displayTube[runStartIdx - 1] === topColorId) {
                  runStartIdx--;
                }

                // Y-coordinate of boundary with bottom static liquid
                const yBase = CHAMBER_BOTTOM_Y - runStartIdx * BLOCK_HEIGHT;

                // How much of the top liquid is left (1 = full, 0 = drained)
                const drainPct = Math.max(0, drainingTopPercent / 100);

                // As it drains, the upper surface recedes down towards the base
                const fullHeight = (displayTube.length - runStartIdx) * BLOCK_HEIGHT;
                const curHeight = fullHeight * drainPct;
                const ySurfaceLeft = Math.max(14, yBase - curHeight);
                const ySurfaceRight = Math.max(14, yBase - curHeight);

                return (
                  <>
                    {/* Non-draining layers below the pouring fluid */}
                    {displayTube.slice(0, runStartIdx).map((cId, idx) => {
                      const cDef = getColor(cId);
                      const yB = CHAMBER_BOTTOM_Y - idx * BLOCK_HEIGHT;
                      const yT = yB - BLOCK_HEIGHT;
                      return (
                        <path
                          key={`bottom-layer-${idx}`}
                          d={`M 8.5 ${yT + (isTiltRight ? 3 : -3)} L 51.5 ${yT + (isTiltRight ? -3 : 3)} L 51.5 ${yB} L 8.5 ${yB} Z`}
                          fill={`url(#grad-${cDef.id}-${index})`}
                        />
                      );
                    })}

                    {/* Unified, continuous draining fluid slide running smoothly into the neck lip */}
                    {drainPct > 0.05 && (
                      <path
                        key={`draining-wedge-${topColorId}`}
                        d={
                          isTiltRight
                            ? `
                              M 8.5 ${yBase + 3}
                              L 8.5 ${ySurfaceLeft}
                              Q 25 ${Math.max(12, ySurfaceLeft * 0.7)} 30 9
                              L 43 9
                              L 43 16
                              L 51.5 28
                              L 51.5 ${yBase - 3}
                              Z
                            `
                            : `
                              M 51.5 ${yBase + 3}
                              L 51.5 ${ySurfaceRight}
                              Q 35 ${Math.max(12, ySurfaceRight * 0.7)} 30 9
                              L 17 9
                              L 17 16
                              L 8.5 28
                              L 8.5 ${yBase - 3}
                              Z
                            `
                        }
                        fill={`url(#grad-${topColorDef.id}-${index})`}
                      />
                    )}
                  </>
                );
              })()}
            </g>
          ) : (
            /* Standard Rest State: Layered 3D Cylindrical Gel Blocks */
            <g>
              {calculatedLayers.map((layer, lIdx) => {
                const cDef = getColor(layer.colorId);
                const { yBottom, yTop, isBottom, isTop } = layer;

                const bodyPath = isBottom
                  ? `
                    M 8.5 ${yTop}
                    L 8.5 130
                    C 8.5 135, 18 138, 30 138
                    C 42 138, 51.5 135, 51.5 130
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

                    {/* Subtle boundary crease between different stacked colors (only when different colors) */}
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
                          fill={`url(#meniscus-grad-${cDef.id}-${index})`}
                          stroke="rgba(255, 255, 255, 0.5)"
                          strokeWidth="0.8"
                        />
                        <path
                          d={`M 11.5 ${yTop + 1.4} Q 30 ${yTop + 4.8} 48.5 ${yTop + 1.4}`}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.92"
                        />
                      </g>
                    )}

                    {showSymbols && (
                      <text
                        x="30"
                        y={(yTop + yBottom) / 2}
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

          {/* 3. Empty Bottle Video Camera Badge */}
          {displayTube.length === 0 && !risingColor && (
            <g>
              <rect
                x="15"
                y="68"
                width="30"
                height="21"
                rx="6"
                fill="rgba(5, 18, 48, 0.65)"
                stroke="rgba(56, 189, 248, 0.75)"
                strokeWidth="1.4"
              />
              <rect x="19" y="72.5" width="13" height="12" rx="2.5" fill="#ffffff" />
              <polygon points="33,75.5 38,72 38,84.5 33,81" fill="#ffffff" />
              <polygon points="24,75.5 28.5,78.5 24,81.5" fill="#0284c7" />

              <text x="11" y="118" fill="#bae6fd" fontSize="12" className="anim-twinkle">
                ✦
              </text>
            </g>
          )}

          {/* 4. Crystal Glass Specular Reflections Layer (OVER the liquid) */}
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
            stroke="#38bdf8"
            strokeWidth="1.7"
            strokeLinejoin="round"
            opacity="0.82"
          />

          {/* Inner Glass Wall Refraction Line (Visible Glass Thickness) */}
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
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="0.8"
          />

          {/* Left Vertical High-Gloss Specular Stripe (Continuous flow from neck through shoulder to base) */}
          <path
            d="M 19 14 C 15 18, 9.5 22, 9.5 28 L 9.5 128 C 9.5 133, 13 137, 18 138"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.32"
          />
          <path
            d="M 19 14 C 15 18, 9.5 22, 9.5 28 L 9.5 128 C 9.5 133, 13 137, 18 138"
            fill="none"
            stroke={`url(#specular-fade-${index})`}
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Right Shoulder Curved Specular Arc */}
          <path
            d="M 41 14 C 45 18, 50.5 22, 50.5 28"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />

          {/* Right Wall Rim Light (Giving 3D bilateral cylindrical curvature) */}
          <path
            d="M 50.5 30 L 50.5 118"
            stroke="#38bdf8"
            strokeWidth="1.0"
            strokeLinecap="round"
            opacity="0.38"
          />
          <path
            d="M 50.5 35 L 50.5 55"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Solid Crystal Base Refraction Smile Arcs */}
          <path
            d="M 13 139 Q 30 145.5 47 139"
            stroke="#38bdf8"
            strokeWidth="2.4"
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
            opacity="0.95"
          />

          {/* 5. Top Lip Bead Collar Ring (3D Torus Lip) */}
          <ellipse
            cx="30"
            cy="9"
            rx="15.5"
            ry="3.5"
            fill={`url(#lip-${index})`}
            stroke="#38bdf8"
            strokeWidth="1.4"
          />
          {/* Rolled lip 3D depth shadow under rim */}
          <path
            d="M 14.5 9.5 C 14.5 12.5, 45.5 12.5, 45.5 9.5"
            stroke="#0b1938"
            strokeWidth="2"
            fill="none"
            opacity="0.75"
          />
          {/* Inner dark cavity */}
          <ellipse
            cx="30"
            cy="9"
            rx="10.5"
            ry="2.0"
            fill="#020817"
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth="0.8"
          />
          {/* Front crescent specular arc */}
          <path
            d="M 16 7.6 Q 30 6.0 44 7.6"
            stroke="#ffffff"
            strokeWidth="1.4"
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
        className={`w-11 h-2 rounded-[50%] transition-all duration-200 pointer-events-none -mt-0.5 ${
          isSelected || isPouringSource
            ? 'scale-75 opacity-15 translate-y-1'
            : 'scale-100 opacity-55'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, transparent 75%)',
        }}
      />
    </div>
  );
});

TestTube.displayName = 'TestTube';
