import React from 'react';
import { BookText, Sparkles, X } from 'lucide-react';

export interface MechanicIntroData {
  key: 'normal' | 'masked' | 'hidden' | 'bottom_leak';
  title: string;
  subtitle: string;
  bullets: string[];
}

interface MechanicIntroModalProps {
  data: MechanicIntroData;
  onClose: () => void;
}

const GLOSSY_BLUE =
  'bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1e40af] border-2 border-[#93c5fd] shadow-[0_4px_12px_rgba(29,78,216,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(30,58,138,0.5)]';

const PREVIEW_COLORS = {
  normal: ['#ff6b6b', '#4ecdc4', '#ffd93d', '#7c5cff'],
  masked: ['#ff7a59', '#ffb703', '#8ecae6', '#90be6d'],
  hidden: ['#ffb703', '#8ecae6', '#7c5cff', '#38bdf8'],
  bottom_leak: ['#f72585', '#4cc9f0', '#f9c74f', '#90be6d'],
} as const;

const BottlePreview: React.FC<{ type: MechanicIntroData['key'] }> = ({ type }) => {
  const colors = PREVIEW_COLORS[type];
  const isMasked = type === 'masked';
  const isHidden = type === 'hidden';
  const isLeak = type === 'bottom_leak';

  const bottlePath = 'M17 9 L17 16 C17 22, 6 22, 6 28 L6 130 C6 136, 16 141, 30 141 C44 141, 54 136, 54 130 L54 28 C54 22, 43 22, 43 16 L43 9 Z';
  const innerPath = 'M 17 16 C 17 22, 8.5 22, 8.5 28 L 8.5 130 C 8.5 136, 16 141, 30 141 C 44 141, 51.5 136, 51.5 130 L 51.5 28 C 51.5 22, 43 22, 43 16 Z';

  return (
    <div className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/30 p-4">
      <svg viewBox="0 0 60 150" className="h-32 w-24 drop-shadow-[0_8px_20px_rgba(59,130,246,0.25)]">
        <defs>
          <linearGradient id={`glass-${type}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7ea0ff" stopOpacity="0.26" />
            <stop offset="10%" stopColor="#1b2a58" stopOpacity="0.14" />
            <stop offset="45%" stopColor="#0c1838" stopOpacity="0.05" />
            <stop offset="85%" stopColor="#0c1838" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#7ea0ff" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id={`lip-${type}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b9c7ff" stopOpacity="0.96" />
            <stop offset="42%" stopColor="#5267d2" stopOpacity="0.94" />
            <stop offset="100%" stopColor="#18275f" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`fluid-${type}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="10%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
          <clipPath id={`inner-${type}`}>
            <path d={innerPath} />
          </clipPath>
        </defs>

        <path d={bottlePath} fill={`url(#glass-${type})`} stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
        <path d="M17 9 h26 v7 h-26 z" fill={`url(#lip-${type})`} stroke="rgba(255,255,255,0.28)" strokeWidth="1" />

        <g clipPath={`url(#inner-${type})`}>
          <rect x="8.5" y="18" width="43" height="112" fill="rgba(255,255,255,0.04)" />
          {[0, 1, 2, 3].map((idx) => {
            const top = 138 - (idx + 1) * 25.4;
            const h = idx === 0 ? 33 : 25.67;
            return (
              <rect
                key={`${type}-${idx}`}
                x="8.5"
                y={top}
                width="43"
                height={h}
                fill={colors[idx]}
                opacity={isHidden && idx === 0 ? 0.18 : 1}
              />
            );
          })}
          <rect x="8.5" y="16" width="43" height="116" fill={`url(#fluid-${type})`} opacity="0.35" />
        </g>

        {isMasked && (
          <>
            <path d="M28 35 Q30 25 17 22 L17 75 Q30 82 43 75 L43 22 Q30 25 28 35 Z" fill="rgba(15,23,42,0.8)" opacity="0.9" />
            <path d="M16 32 Q30 22 44 32" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" fill="none" />
          </>
        )}

        {isHidden && (
          <>
            <rect x="11" y="110" width="38" height="26" fill="rgba(148,163,184,0.35)" />
            <rect x="11" y="100" width="38" height="8" fill="rgba(255,255,255,0.25)" />
          </>
        )}

        {isLeak && (
          <>
            <path d="M30 135 L30 144" stroke="rgba(148,163,184,0.85)" strokeWidth="2" strokeLinecap="round" />
            <path d="M30 144 Q25 150 30 154 Q35 150 30 144" fill="rgba(56,189,248,0.8)" />
          </>
        )}
      </svg>
    </div>
  );
};

export const MechanicIntroModal: React.FC<MechanicIntroModalProps> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03081a]/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1a2a55]/85 via-[#0e1e42]/80 to-[#0a1630]/85 backdrop-blur-2xl border border-white/15 shadow-2xl p-5 flex flex-col overflow-hidden">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        <div className="relative flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-300/30 text-cyan-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white">新机制入门</h3>
          </div>
          <button
            onClick={onClose}
            className={`relative p-1.5 rounded-xl text-white active:scale-95 transition-transform cursor-pointer overflow-hidden ${GLOSSY_BLUE}`}
          >
            <div className="absolute top-0.5 left-1 right-1 h-2 rounded-t-[10px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
            <X className="relative w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          </button>
        </div>

        <div className="relative mt-4 space-y-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
            <div className="flex items-center gap-2 text-cyan-200">
              <BookText className="w-4 h-4" />
              <span className="text-sm font-black uppercase tracking-[0.12em]">{data.title}</span>
            </div>
            <div className="mt-3 flex items-center justify-center">
              <BottlePreview type={data.key} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">{data.subtitle}</p>
          </div>

          <ul className="space-y-2">
            {data.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2 text-sm leading-6 text-slate-100/90">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onClose}
            className={`mt-2 w-full rounded-2xl px-4 py-2.5 text-sm font-black text-white active:scale-[0.99] transition-transform ${GLOSSY_BLUE}`}
          >
            开始挑战
          </button>
        </div>
      </div>
    </div>
  );
};
