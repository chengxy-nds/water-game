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

  // Actual pixel height
  const pixelHeight = Math.max(0, heightPercent * 0.36);

  return (
    <div
      className={`relative w-full transition-[height] duration-250 ease-out select-none overflow-visible ${
        isBottom ? 'rounded-b-[20px]' : ''
      }`}
      style={{
        height: `${pixelHeight}px`,
        backgroundColor: colorDef.hex,
        backgroundImage: colorDef.gradient || `linear-gradient(180deg, ${colorDef.hex}ee 0%, ${colorDef.hex} 100%)`,
        boxShadow: `inset 0 -3px 8px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.5), 0 0 14px ${colorDef.shadow || 'rgba(0,0,0,0.2)'}`,
      }}
    >
      {/* 3D Jelly Glass/Fluid Cylindrical Reflection Gradient (translucent jelly gloss) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.35) 18%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.02) 65%, rgba(0,0,0,0.35) 100%)`,
        }}
      />

      {/* Internal vertical jelly refraction highlight bar */}
      <div
        className="absolute left-2 top-0 bottom-0 w-1.5 rounded-full pointer-events-none jelly-shimmer"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.5) 100%)',
          filter: 'blur(0.3px)',
        }}
      />

      {/* Secondary subtle right edge specular sheen */}
      <div
        className="absolute right-2 top-0 bottom-0 w-0.5 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 100%)',
        }}
      />

      {/* Internal Jelly Fluid Bottom Light Glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5 pointer-events-none"
        style={{
          background: 'linear-gradient(0deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
        }}
      />

      {/* Top 3D Elliptical Meniscus (The signature 3D puck surface seen in the reference) */}
      {isTop && (
        <div
          className="absolute -top-2 left-0 right-0 h-4 pointer-events-none z-20 overflow-visible transition-transform duration-300"
          style={{
            transform: isTilted ? `rotate(${slantDeg}deg)` : 'none',
            transformOrigin: 'center center',
          }}
        >
          {/* Elliptical Cap with Jelly Gradient */}
          <div
            className="w-full h-3.5 rounded-[50%] relative"
            style={{
              backgroundColor: colorDef.hex,
              backgroundImage: colorDef.gradient || `linear-gradient(180deg, ${colorDef.hex}ee 0%, ${colorDef.hex} 100%)`,
              boxShadow: `0 2px 5px rgba(0,0,0,0.35), inset 0 2px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.3)`,
              border: `1px solid rgba(255,255,255,0.5)`,
            }}
          >
            {/* Specular White Highlight Crescent on Top Ellipse */}
            <div
              className="absolute top-0.5 left-2 right-2 h-1.5 rounded-[50%]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.15) 100%)',
                filter: 'blur(0.4px)',
              }}
            />
          </div>

          {/* Active Pouring Effervescent Foam / Boiling Froth Cluster (as shown in reference Image 3!) */}
          {isDisturbed && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-0.5 z-30 pointer-events-none">
              <div
                className="w-4 h-4 rounded-full anim-foam shadow-md border border-white/60"
                style={{
                  backgroundColor: colorDef.hex,
                  animationDelay: '0s',
                }}
              />
              <div
                className="w-5 h-5 rounded-full anim-foam shadow-md -ml-1 border border-white/80"
                style={{
                  backgroundColor: colorDef.hex,
                  animationDelay: '0.15s',
                }}
              />
              <div
                className="w-3.5 h-3.5 rounded-full anim-foam shadow-md -ml-1 border border-white/60"
                style={{
                  backgroundColor: colorDef.hex,
                  animationDelay: '0.3s',
                }}
              />
              <div
                className="w-4 h-4 rounded-full anim-foam shadow-md -ml-0.5 border border-white/70"
                style={{
                  backgroundColor: colorDef.hex,
                  animationDelay: '0.2s',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Internal Rising Bubbles */}
      <div
        className="absolute bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-white/50 bubble-anim pointer-events-none"
        style={{ animationDuration: '2.4s' }}
      />
      <div
        className="absolute bottom-2 right-3 w-1 h-1 rounded-full bg-white/40 bubble-anim pointer-events-none"
        style={{ animationDuration: '3.1s', animationDelay: '0.7s' }}
      />

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
