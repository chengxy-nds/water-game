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
  onClick,
  disabled = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lipRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    getSpoutPos: () => {
      if (!lipRef.current) return null;
      const rect = lipRef.current.getBoundingClientRect();
      const x = tiltAngle >= 0 ? rect.right - 2 : rect.left + 2;
      const y = rect.top + rect.height * 0.5;
      return { x, y };
    },
    getMouthPos: () => {
      if (!lipRef.current) return null;
      const rect = lipRef.current.getBoundingClientRect();
      return { x: rect.left + rect.width * 0.5, y: rect.top + 2 };
    },
    getBoundingBox: () => {
      if (!containerRef.current) return null;
      return containerRef.current.getBoundingClientRect();
    },
  }));

  const isComplete = isTubeComplete(tube, capacity);

  // Compute visual layers
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
    transform: isPouringSource
      ? `translate(${translateX}px, ${translateY}px) rotate(${tiltAngle}deg)`
      : isSelected
      ? 'translateY(-22px)'
      : 'translateY(0)',
    transition: isPouringSource
      ? 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
      : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    zIndex: isPouringSource ? 45 : isSelected ? 30 : 10,
    transformOrigin: isPouringSource ? '50% 12px' : 'center bottom',
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

  // Geometry inside SVG viewBox="0 0 60 190"
  // Inner chamber: X from 8 to 52 (width 44, cx = 30)
  // Inner bottom at Y = 164
  // 4 blocks maximum. Block height = 27px. 164 - 4 * 27 = 56px (max height)
  const CHAMBER_BOTTOM_Y = 164;
  const BLOCK_HEIGHT = 27;
  const RX = 22;
  const RY = 5.6;

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
      {/* Anchor for pour stream tracking */}
      <div
        ref={lipRef}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 pointer-events-none z-50"
      />

      {/* Completion Star Crown */}
      {isComplete && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 bg-amber-400 text-slate-950 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-lg animate-bounce border border-white">
          ★
        </div>
      )}

      {/* 100% Pure Code SVG 3D Crystal Bottle */}
      <div
        className={`relative flex flex-col items-center transition-all duration-200 ${
          isSelected
            ? 'filter drop-shadow-[0_0_16px_rgba(56,189,248,0.95)]'
            : isHintSource
            ? 'filter drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]'
            : isHintTarget
            ? 'filter drop-shadow-[0_0_12px_rgba(52,211,153,0.85)]'
            : 'filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]'
        }`}
      >
        <svg
          viewBox="0 0 60 190"
          className="w-[52px] sm:w-[56px] h-[172px] sm:h-[184px] overflow-visible select-none"
        >
          <defs>
            {/* Deep Cosmic Sapphire Background Gradient */}
            <linearGradient id={`tube-bg-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#081844" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#040e2c" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#020618" stopOpacity="0.85" />
            </linearGradient>

            {/* Rolled Collar Lip Gradient */}
            <linearGradient id={`lip-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.9" />
            </linearGradient>

            {/* 3D Lateral Cylindrical Volume Shading for each Palette Color */}
            {Object.values(COLOR_PALETTE).map((c: ColorDef) => (
              <linearGradient
                key={`grad-${c.id}-${index}`}
                id={`grad-${c.id}-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={c.shadeHex || c.hex} stopOpacity="1" />
                <stop offset="18%" stopColor={c.topHex || c.hex} stopOpacity="1" />
                <stop offset="55%" stopColor={c.hex} stopOpacity="1" />
                <stop offset="90%" stopColor={c.shadeHex || c.hex} stopOpacity="1" />
                <stop offset="100%" stopColor={c.shadeHex || c.hex} stopOpacity="0.95" />
              </linearGradient>
            ))}
          </defs>

          {/* 1. Deep Blue Transparent Glass Back Body */}
          <path
            d="
              M 21 14
              L 21 20
              C 21 30, 5 36, 5 50
              L 5 152
              C 5 168, 14 176, 30 176
              C 46 176, 55 168, 55 152
              L 55 50
              C 55 36, 39 30, 39 20
              L 39 14
              Z
            "
            fill={`url(#tube-bg-${index})`}
          />

          {/* 2. Fluid Layers (Pure Code 3D Cylindrical Gel) */}
          {calculatedLayers.map((layer, lIdx) => {
            const cDef = getColor(layer.colorId);
            const { yBottom, yTop, isBottom, isTop } = layer;

            const bodyPath = isBottom
              ? `
                M 8 ${yTop}
                L 8 150
                C 8 162, 16 166, 30 166
                C 44 166, 52 162, 52 150
                L 52 ${yTop}
                A ${RX} ${RY} 0 0 1 8 ${yTop}
                Z
              `
              : `
                M 8 ${yTop}
                L 8 ${yBottom}
                A ${RX} ${RY} 0 0 0 52 ${yBottom}
                L 52 ${yTop}
                A ${RX} ${RY} 0 0 1 8 ${yTop}
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
                {!isBottom && (
                  <path
                    d={`M 8 ${yBottom} A ${RX} ${RY} 0 0 0 52 ${yBottom}`}
                    stroke="rgba(0, 0, 0, 0.28)"
                    strokeWidth="1.2"
                    fill="none"
                  />
                )}

                {/* Top Meniscus 3D Oval Cap (Only on uppermost surface) */}
                {isTop && layer.heightPercent > 4 && (
                  <g>
                    {/* Elliptical Cap Puck */}
                    <ellipse
                      cx="30"
                      cy={yTop}
                      rx={RX}
                      ry={RY}
                      fill={cDef.topHex || cDef.hex}
                      stroke="rgba(255, 255, 255, 0.45)"
                      strokeWidth="0.8"
                    />

                    {/* Specular Front Crescent Rim Highlight Arc */}
                    <path
                      d={`M 11 ${yTop + 1.8} Q 30 ${yTop + 6} 49 ${yTop + 1.8}`}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.88"
                    />
                  </g>
                )}

                {/* Accessibility Symbol */}
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

          {/* 3. Empty Bottle Video Camera Badge (Pure Code Vector) */}
          {displayTube.length === 0 && !risingColor && (
            <g>
              {/* Frosted Frame */}
              <rect
                x="15"
                y="84"
                width="30"
                height="21"
                rx="6"
                fill="rgba(5, 18, 48, 0.65)"
                stroke="rgba(56, 189, 248, 0.75)"
                strokeWidth="1.4"
              />
              {/* White Camera Body */}
              <rect x="19" y="88.5" width="13" height="12" rx="2.5" fill="#ffffff" />
              {/* Camera Lens Nozzle */}
              <polygon points="33,91.5 38,88 38,100.5 33,97" fill="#ffffff" />
              {/* Cyan Play Arrow */}
              <polygon points="24,91.5 28.5,94.5 24,97.5" fill="#0284c7" />

              {/* Sparkle Star */}
              <text x="11" y="146" fill="#bae6fd" fontSize="12" className="anim-twinkle">
                ✦
              </text>
            </g>
          )}

          {/* 4. Crystal Glass Specular Reflections Layer (OVER the liquid) */}

          {/* Outer Shell Stroke with Soft Luminous Blue Edge */}
          <path
            d="
              M 21 14
              L 21 20
              C 21 30, 5 36, 5 50
              L 5 152
              C 5 168, 14 176, 30 176
              C 46 176, 55 168, 55 152
              L 55 50
              C 55 36, 39 30, 39 20
              L 39 14
              Z
            "
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Left Vertical High-Gloss Specular Stripe (Dual Layer: Soft Cyan Halo + Crisp White Core) */}
          <path
            d="M 9.5 50 L 9.5 154"
            stroke="#38bdf8"
            strokeWidth="3.6"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M 9.5 50 L 9.5 154"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Left Shoulder Curved Specular Arc */}
          <path
            d="M 10 48 Q 15 28 22 22"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />

          {/* Right Shoulder Faceted Glint Polygon */}
          <polygon
            points="46,30 50,32 52,40 48,38"
            fill="#ffffff"
            opacity="0.85"
          />

          {/* Thick Solid Glass Base Refraction Smile Arc */}
          <path
            d="M 14 170 Q 30 177 46 170"
            stroke="#93c5fd"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />

          {/* 5. Top Lip Bead Collar Ring */}
          <ellipse
            cx="30"
            cy="12"
            rx="16.5"
            ry="4.6"
            fill={`url(#lip-${index})`}
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          {/* Inner Mouth Dark Aperture */}
          <ellipse
            cx="30"
            cy="12"
            rx="11.5"
            ry="2.6"
            fill="#03081a"
            stroke="rgba(56, 189, 248, 0.5)"
            strokeWidth="0.8"
          />
          {/* Top Lip Crescent Specular Glint */}
          <path
            d="M 16 10 Q 30 8 44 10"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.92"
          />
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
