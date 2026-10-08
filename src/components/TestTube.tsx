import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Tube } from '../types/game';
import { LiquidLayer } from './LiquidLayer';
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
  tiltAngle?: number; // degrees
  translateX?: number; // pixels
  translateY?: number; // pixels
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
      return { x: rect.left + rect.width * 0.5, y: rect.top + 4 };
    },
    getBoundingBox: () => {
      if (!containerRef.current) return null;
      return containerRef.current.getBoundingClientRect();
    },
  }));

  const isComplete = isTubeComplete(tube, capacity);

  // Compute visual tube contents
  let displayTube = [...tube];
  let drainingTopPercent = 100;
  if (isPouringSource && sourceDrainingCount > 0 && displayTube.length > 0) {
    drainingTopPercent = Math.max(10, 100 - sourceDrainingCount * 85);
  }

  let risingColor: string | null = null;
  let risingPercent = 0;
  if (isPouringTarget && targetRisingCount > 0 && activePourColor) {
    risingColor = activePourColor;
    risingPercent = Math.min(100, targetRisingCount * 90);
  }

  // Dynamic transform
  const transformStyle: React.CSSProperties = {
    transform: isPouringSource
      ? `translate(${translateX}px, ${translateY}px) rotate(${tiltAngle}deg)`
      : isSelected
      ? 'translateY(-24px) scale(1.03)'
      : 'translateY(0) scale(1)',
    transition: isPouringSource
      ? 'transform 0.38s cubic-bezier(0.25, 1, 0.5, 1)'
      : 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)',
    zIndex: isPouringSource ? 40 : isSelected ? 30 : 10,
    transformOrigin: isPouringSource
      ? '50% 6px'
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
      {/* Hint Badge Indicator */}
      {isHintSource && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-500/50 flex items-center gap-1 animate-bounce">
          <span>起倒</span>
          <span className="text-[9px]">▼</span>
        </div>
      )}
      {isHintTarget && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-lg shadow-emerald-500/50 flex items-center gap-1 animate-bounce">
          <span>注入</span>
          <span className="text-[9px]">▼</span>
        </div>
      )}

      {/* Complete Golden Ribbon */}
      {isComplete && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-lg shadow-amber-400/50 animate-pulse border-2 border-white">
          ★
        </div>
      )}

      {/* Potion Glass Bottle Container (9-Layer Spec Implementation) */}
      <div className="relative flex flex-col items-center">
        {/* Layer: 3D Glass Rim & Lip Collar (Section 10 & 11: Glass Thickness, Inner Hole, Specular Highlight) */}
        <div
          ref={lipRef}
          className="w-9 h-3 rounded-full border border-white/70 z-30 relative flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(191, 219, 254, 0.45) 50%, rgba(96, 165, 250, 0.3) 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -1px 2px rgba(30,58,138,0.3)',
          }}
        >
          {/* Inner Mouth Opening (shows glass wall thickness) */}
          <div
            className="w-6 h-1.5 rounded-full"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.75) 0%, rgba(30, 58, 138, 0.5) 70%, rgba(147, 197, 253, 0.3) 100%)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.7)',
            }}
          />
          {/* Top Edge Specular White Crescent Highlight on Rim */}
          <div
            className="absolute top-0.5 left-2 right-2 h-0.5 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, transparent 100%)',
              filter: 'blur(0.2px)',
            }}
          />
        </div>

        {/* Layer: Bottle Neck (18% proportion, smooth tapering transition) */}
        <div
          className="w-6 h-3.5 -mt-0.5 border-x border-white/50 z-20 relative"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0%, rgba(147, 197, 253, 0.1) 45%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.2) 100%)',
          }}
        >
          {/* Subtle Neck Glass Reflection Bar */}
          <div className="absolute top-0 bottom-0 left-1 w-0.5 bg-white/60 pointer-events-none" />
        </div>

        {/* Layer: Bottle Shoulder Curve (Smooth rounded shoulder expanding into body) */}
        <div
          className="w-14 sm:w-16 h-4 -mt-0.5 rounded-t-[20px] border-t border-x border-white/60 z-20 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(147, 197, 253, 0.12) 60%, rgba(30, 58, 138, 0.35) 100%)',
          }}
        >
          {/* Shoulder Specular Curved Shine */}
          <div
            className="absolute top-0.5 left-2 w-5 h-2 rounded-full bg-white/65 blur-[0.5px] -rotate-12 pointer-events-none"
          />
          <div
            className="absolute top-0.5 right-2 w-3 h-1.5 rounded-full bg-white/35 blur-[0.5px] rotate-12 pointer-events-none"
          />
        </div>

        {/* Layer: Bottle Main Cylindrical Body (Sections 6, 7, 8, 9, 12, 13) */}
        <div
          className={`relative w-14 sm:w-16 h-36 sm:h-40 rounded-b-[22px] transition-all duration-300 p-1 flex flex-col justify-end overflow-hidden
            ${
              isSelected
                ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-[#060b18] shadow-[0_0_28px_rgba(34,211,238,0.85)]'
                : isHintSource
                ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#060b18] shadow-[0_0_22px_rgba(251,191,36,0.75)]'
                : isHintTarget
                ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-[#060b18] shadow-[0_0_22px_rgba(52,211,153,0.75)]'
                : 'border-b-2 border-x border-white/55 shadow-2xl'
            }
          `}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(30, 58, 138, 0.2) 40%, rgba(15, 23, 42, 0.65) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: `
              inset 0 0 12px rgba(147, 197, 253, 0.25),
              inset 2px 0 6px rgba(255, 255, 255, 0.35),
              inset -2px 0 6px rgba(0, 0, 0, 0.45),
              0 14px 28px rgba(0, 0, 0, 0.65)
            `,
          }}
        >
          {/* Section 8: Left Specular Vertical Highlight (Soft white, bright top/mid, tapering down, blurred) */}
          <div
            className="absolute top-1 left-2 bottom-5 w-1.5 rounded-full pointer-events-none z-30"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0.2) 75%, transparent 100%)',
              filter: 'blur(0.4px)',
            }}
          />

          {/* Section 9: Right Ambient Rim Reflection (Subtle environmental light reflection 15-25%) */}
          <div
            className="absolute top-1 right-2 bottom-5 w-1 rounded-full pointer-events-none z-30"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(147,197,253,0.25) 50%, rgba(255,255,255,0.08) 100%)',
              filter: 'blur(0.5px)',
            }}
          />

          {/* Q-version Cute Specular Twinkle Star Accent ✦ */}
          <div className="absolute top-3 right-3 text-cyan-200 pointer-events-none z-30 anim-twinkle drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">
            ✦
          </div>

          {/* Layer: Liquid Segments Container (Clips neatly inside the inner glass walls) */}
          <div className="w-full flex flex-col-reverse rounded-b-[20px] overflow-hidden z-10">
            {displayTube.map((colorId, idx) => {
              const isTopLayer = idx === displayTube.length - 1 && !risingColor;
              const isBottomLayer = idx === 0;
              const heightPct = isTopLayer && isPouringSource ? drainingTopPercent : 100;

              return (
                <LiquidLayer
                  key={`${colorId}-${idx}`}
                  colorId={colorId}
                  isTop={isTopLayer}
                  isBottom={isBottomLayer}
                  showSymbol={showSymbols}
                  heightPercent={heightPct}
                  isDisturbed={isPouringTarget && idx === displayTube.length - 1}
                  tiltAngle={isPouringSource ? tiltAngle : 0}
                />
              );
            })}

            {/* Dynamically Rising Liquid Layer on target during active pour */}
            {risingColor && (
              <LiquidLayer
                colorId={risingColor}
                isTop={true}
                isBottom={displayTube.length === 0}
                showSymbol={showSymbols}
                heightPercent={risingPercent}
                isDisturbed={true}
                tiltAngle={0}
              />
            )}
          </div>

          {/* Section 12: Bottom Thick Glass Lens Base (Pedestal thickness, refraction arc, bottom rim highlight) */}
          <div
            className="absolute bottom-0 left-0 right-0 h-4 rounded-b-[20px] pointer-events-none z-20 border-b-2 border-white/60"
            style={{
              background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.4) 0%, rgba(147, 197, 253, 0.15) 60%, transparent 100%)',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5)',
            }}
          >
            {/* Curved bottom refraction highlight smile */}
            <div
              className="absolute bottom-1 left-3 right-3 h-1 rounded-full bg-white/70 blur-[0.4px]"
            />
          </div>

          {/* Empty bottle glow indicator */}
          {displayTube.length === 0 && !risingColor && (
            <div className="h-full flex items-center justify-center text-blue-200/25 font-black text-[11px] tracking-widest pointer-events-none">
              EMPTY
            </div>
          )}
        </div>
      </div>

      {/* Bottle Number Badge */}
      <div className="mt-2 text-[11px] font-bold text-slate-400 group-hover:text-cyan-300 transition-colors flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-800">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span className="font-mono">#{index + 1}</span>
      </div>

      {/* Drop shadow beneath bottle */}
      <div
        className={`w-12 h-2 rounded-full bg-black/60 blur-sm mt-0.5 transition-all duration-300 pointer-events-none ${
          isSelected || isPouringSource ? 'scale-75 opacity-20' : 'scale-100 opacity-70'
        }`}
      />
    </div>
  );
});

TestTube.displayName = 'TestTube';
