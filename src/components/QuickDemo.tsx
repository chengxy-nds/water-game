import React, { useEffect, useMemo, useState } from 'react';

const palette = ['#f43f5e', '#22c55e', '#3b82f6', '#facc15', '#a855f7', '#06b6d4'];

interface DemoBottleProps {
  label: string;
  colors: string[];
  leak?: boolean;
  target?: boolean;
  compact?: boolean;
}

const DemoBottle: React.FC<DemoBottleProps> = ({ label, colors, leak = false, target = false, compact = false }) => {
  const total = 4;
  const hidden = Math.max(0, total - colors.length);
  const liquidHeights = [...colors, ...Array(hidden).fill('transparent')];

  return (
    <div className="relative flex flex-col items-center">
      {target && (
        <div className="absolute -top-5 text-[10px] font-bold tracking-[0.22em] text-cyan-200 uppercase">
          TARGET
        </div>
      )}
      <div className="relative">
        <svg
          viewBox="0 0 120 190"
          className={compact ? 'w-[52px] h-[130px]' : 'w-[64px] h-[154px]'}
        >
          <defs>
            <linearGradient id={`glass-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(191,219,254,0.64)" />
              <stop offset="20%" stopColor="rgba(59,130,246,0.18)" />
              <stop offset="100%" stopColor="rgba(11,18,32,0.2)" />
            </linearGradient>
            <linearGradient id={`rim-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dfe9ff" />
              <stop offset="100%" stopColor="#6ea8ff" />
            </linearGradient>
          </defs>

          <path
            d="M42 18 L42 32 C42 40, 28 40, 28 48 L28 146 C28 165, 40 172, 60 172 C80 172, 92 165, 92 146 L92 48 C92 40, 78 40, 78 32 L78 18 Z"
            fill={`url(#glass-${label})`}
            stroke="rgba(191,219,254,0.8)"
            strokeWidth="2"
          />

          <rect x="28" y="18" width="64" height="12" rx="7" fill={`url(#rim-${label})`} />
          <rect x="38" y="20" width="44" height="8" rx="4" fill="rgba(17,24,39,0.82)" />

          <g>
            {liquidHeights.map((color, idx) => {
              const y = 148 - (idx + 1) * 28;
              const isTransparent = color === 'transparent';

              return (
                <g key={`${label}-layer-${idx}`}>
                  <rect
                    x="34"
                    y={y}
                    width="52"
                    height="24"
                    rx="6"
                    fill={isTransparent ? 'rgba(255,255,255,0)' : color}
                    opacity={isTransparent ? 0 : 0.92}
                  />
                  <rect
                    x="34"
                    y={y + 4}
                    width="52"
                    height="5"
                    rx="2"
                    fill="rgba(255,255,255,0.34)"
                    opacity={isTransparent ? 0 : 0.6}
                  />
                </g>
              );
            })}
          </g>

          <path
            d="M48 148 Q60 157 72 148"
            fill="none"
            stroke="rgba(224,242,254,0.8)"
            strokeWidth="2"
          />

          {leak && (
            <g>
              <path d="M56 165 L60 178 L64 165" stroke="rgba(224,242,254,0.9)" strokeWidth="2" fill="none" />
              <path d="M52 165 Q60 172 68 165" stroke="rgba(224,242,254,0.75)" strokeWidth="2" fill="none" />
              <circle cx="60" cy="179" r="2.8" fill="#e0f2fe" />
            </g>
          )}
        </svg>
      </div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-100/90">{label}</div>
    </div>
  );
};

interface QuickDemoProps {
  onEnterGame: () => void;
}

export const QuickDemo: React.FC<QuickDemoProps> = ({ onEnterGame }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 1200);
    return () => window.clearInterval(timer);
  }, []);

  const flow = useMemo(
    () => ({
      from: { x: 185, y: 282 },
      to: { x: 375, y: 220 },
    }),
    []
  );

  const leakFlow = useMemo(
    () => ({
      from: { x: 421, y: 315 },
      to: { x: 560, y: 358 },
    }),
    []
  );

  const streamOffset = (tick % 4) * 25;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#030b1e] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_45%),linear-gradient(180deg,#09132d_0%,#040d1b_40%,#020812_100%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between px-6 pt-6">
          <div>
            <div className="text-[10px] tracking-[0.28em] uppercase text-cyan-200/80">Cocos Demo</div>
            <div className="mt-2 text-2xl font-black tracking-tight">Water Game Prototype</div>
          </div>
          <button
            onClick={onEnterGame}
            className="rounded-full border border-sky-300/60 bg-sky-500/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-100 shadow-[0_0_30px_rgba(125,211,252,0.18)] transition hover:bg-sky-500/30"
          >
            Enter game
          </button>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-16 pt-8">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 720 420" preserveAspectRatio="xMidYMid meet">
            <path
              d={`M ${flow.from.x} ${flow.from.y} C ${flow.from.x + 35} ${flow.from.y - 60}, ${flow.to.x - 40} ${flow.to.y + 20}, ${flow.to.x} ${flow.to.y}`}
              stroke="rgba(96,165,250,0.8)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
            <path
              d={`M ${flow.from.x + 8} ${flow.from.y + 10} C ${flow.from.x + 42} ${flow.from.y - 42}, ${flow.to.x - 30} ${flow.to.y + 26}, ${flow.to.x + 2} ${flow.to.y + 8}`}
              stroke="#38bdf8"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />

            <path
              d={`M ${leakFlow.from.x} ${leakFlow.from.y} C ${leakFlow.from.x + 30} ${leakFlow.from.y + 42}, ${leakFlow.to.x - 38} ${leakFlow.to.y - 24}, ${leakFlow.to.x} ${leakFlow.to.y}`}
              stroke="rgba(96,165,250,0.78)"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />

            {Array.from({ length: 8 }).map((_, idx) => {
              const offset = (idx * 18 + streamOffset) % 90;
              const y = 235 + idx * 7;
              return (
                <circle
                  key={`water-drops-${idx}`}
                  cx={flow.from.x + 90 + idx * 18 + offset * 0.3}
                  cy={y}
                  r={idx % 2 === 0 ? 3.5 : 2.5}
                  fill={palette[idx % palette.length]}
                  opacity={0.85}
                />
              );
            })}
          </svg>

          <div className="relative z-10 flex items-end justify-center gap-6">
            <DemoBottle label="A1" colors={['#f43f5e', '#3b82f6']} />
            <DemoBottle label="A2" colors={['#22c55e', '#facc15']} />
            <DemoBottle label="A3" colors={['#a855f7', '#06b6d4']} />
            <DemoBottle label="A4" colors={['#f43f5e', '#22c55e', '#3b82f6']} target />
            <DemoBottle label="A5" colors={['#facc15', '#f43f5e']} />
            <DemoBottle label="A6" colors={['#3b82f6', '#22c55e']} leak />
          </div>
        </div>
      </div>
    </div>
  );
};
