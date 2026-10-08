import React from 'react';
import { getColor } from '../utils/colors';

interface LiquidLayerProps {
  colorId: string;
  isTop: boolean;
  isBottom: boolean;
  showSymbol: boolean;
  heightPercent: number; // 0 to 100 relative to normal slot
  isDisturbed?: boolean; // when liquid is actively being poured in
  tiltAngle?: number; // degrees
}

export const LiquidLayer: React.FC<LiquidLayerProps> = ({
  colorId,
  isTop,
  isBottom,
  showSymbol,
  heightPercent = 100,
  isDisturbed = false,
  tiltAngle = 0,
}) => {
  const colorDef = getColor(colorId);

  // When tilted, slant the liquid surface
  const isTilted = Math.abs(tiltAngle) > 20;
  const slantDeg = tiltAngle > 0 ? -38 : 38;

  // Actual pixel height (standardized to 36px per full slot)
  const pixelHeight = Math.max(0, (heightPercent / 100) * 36);

  return (
    <div
      className={`relative w-full transition-[height] duration-250 ease-out select-none overflow-visible ${
        isBottom ? 'rounded-b-[20px]' : 'rounded-b-[50%] [border-bottom-left-radius:50%_7px] [border-bottom-right-radius:50%_7px]'
      }`}
      style={{
        height: `${pixelHeight}px`,
        backgroundColor: colorDef.hex,
        backgroundImage: colorDef.gradient || `linear-gradient(180deg, ${colorDef.hex} 0%, ${colorDef.hex} 100%)`,
        boxShadow: `inset 0 -3px 6px rgba(0,0,0,0.32), inset 0 2px 4px rgba(255,255,255,0.35), 0 0 10px ${colorDef.shadow || 'rgba(0,0,0,0.2)'}`,
      }}
    >
      {/* 3D Cylindrical Reflection Gradient (Subtle smooth cylindrical lighting across body) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.25) 18%, rgba(255,255,255,0.05) 45%, rgba(0,0,0,0.03) 65%, rgba(0,0,0,0.22) 100%)`,
        }}
      />

      {/* Internal vertical specular highlight line on left */}
      <div
        className="absolute left-2 top-0 bottom-0 w-1 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.4) 100%)',
          filter: 'blur(0.2px)',
        }}
      />

      {/* Meniscus bottom downward-curved boundary line (contact with layer underneath) */}
      {!isBottom && (
        <div
          className="absolute -bottom-1.5 left-0 right-0 h-3 rounded-[50%] pointer-events-none z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, transparent 80%)',
          }}
        />
      )}

      {/* Top 3D Elliptical Meniscus (The signature 3D puck surface seen in Image 1 & 2) */}
      {isTop && heightPercent > 5 && (
        <div
          className="absolute -top-[6px] left-0 right-0 h-[13px] pointer-events-none z-20 overflow-visible transition-transform duration-300"
          style={{
            transform: isTilted ? `rotate(${slantDeg}deg)` : 'none',
            transformOrigin: 'center center',
          }}
        >
          {/* Elliptical Cap with Lighter 3D Top Tint (Exact Image 1 Match) */}
          <div
            className="w-full h-full rounded-[50%] relative"
            style={{
              backgroundColor: colorDef.topHex || colorDef.hex,
              boxShadow: `0 2px 4px rgba(0,0,0,0.25), inset 0 1.5px 2px rgba(255,255,255,0.95), inset 0 -1px 2px rgba(0,0,0,0.2)`,
              border: `1px solid rgba(255,255,255,0.45)`,
            }}
          >
            {/* Specular White Highlight Crescent on Front Edge */}
            <div
              className="absolute top-[1.5px] left-2.5 right-2.5 h-[1.5px] rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 25%, rgba(255,255,255,0.95) 75%, transparent 100%)',
                filter: 'blur(0.2px)',
              }}
            />
          </div>

          {/* Active Pour Impact Foam Splash Bubble Cluster (Exact Image 2 Match) */}
          {isDisturbed && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-30">
              <div
                className="w-3 h-3 rounded-full animate-bounce -mr-1 shadow-sm border border-white/80"
                style={{ backgroundColor: colorDef.topHex || colorDef.hex }}
              />
              <div
                className="w-4.5 h-4.5 rounded-full animate-pulse z-10 shadow-md border-1.5 border-white/95"
                style={{ backgroundColor: colorDef.topHex || colorDef.hex }}
              />
              <div
                className="w-3 h-3 rounded-full animate-bounce -ml-1 shadow-sm border border-white/80"
                style={{ backgroundColor: colorDef.topHex || colorDef.hex, animationDelay: '0.12s' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Accessibility Symbol */}
      {showSymbol && (
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-black drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] z-10 select-none"
          style={{ color: colorDef.textColor }}
        >
          {colorDef.symbol}
        </div>
      )}
    </div>
  );
};
