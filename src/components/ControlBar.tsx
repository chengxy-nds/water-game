import React from 'react';
import { Shuffle, Undo2 } from 'lucide-react';

interface ControlBarProps {
  canUndo: boolean;
  shuffleCount?: number;
  onShuffle?: () => void;
  onUndo: () => void;
  disabled?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  canUndo,
  onShuffle,
  onUndo,
  disabled = false,
}) => {
  return (
    <div className="w-full max-w-xs mx-auto px-6 pt-2 pb-6 select-none z-20 flex items-center justify-around gap-8">
      {/* 1. Left Action: Pure Code 3D Crystal Jelly Shuffle Button */}
      <div className="relative">
        <button
          onClick={onShuffle}
          disabled={disabled}
          title="重新洗牌"
          className="w-[72px] sm:w-[80px] h-[72px] sm:h-[80px] rounded-[22px] bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1e40af] border-2 border-[#93c5fd] shadow-[0_10px_24px_-2px_rgba(29,78,216,0.65),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_5px_rgba(30,58,138,0.65)] flex items-center justify-center text-white active:scale-95 transition-all duration-150 cursor-pointer relative overflow-hidden group"
        >
          {/* Top internal glossy reflection crescent */}
          <div className="absolute top-1 left-2 right-2 h-7 rounded-t-[18px] bg-gradient-to-b from-white/70 via-white/20 to-transparent pointer-events-none" />

          {/* Shuffle Cross Arrows Icon */}
          <Shuffle className="w-9 sm:w-10 h-9 sm:h-10 stroke-[2.8] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:rotate-12 transition-transform duration-200" />
        </button>

        {/* 3D Spherical Red Badge with Counter "1" */}
        <div
          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-white text-white font-black text-xs flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.5)] pointer-events-none animate-bounce"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ff4d6d 0%, #e11d48 60%, #9f1239 100%)',
          }}
        >
          1
        </div>
      </div>

      {/* 2. Right Action: Pure Code 3D Crystal Jelly Undo Button */}
      <div className="relative">
        <button
          onClick={onUndo}
          disabled={!canUndo || disabled}
          title="撤销上一步"
          className={`w-[72px] sm:w-[80px] h-[72px] sm:h-[80px] rounded-[22px] bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1e40af] border-2 border-[#93c5fd] shadow-[0_10px_24px_-2px_rgba(29,78,216,0.65),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_5px_rgba(30,58,138,0.65)] flex items-center justify-center text-white active:scale-95 transition-all duration-150 cursor-pointer relative overflow-hidden group ${
            !canUndo ? 'opacity-40 grayscale-[0.4] pointer-events-none' : ''
          }`}
        >
          {/* Top internal glossy reflection crescent */}
          <div className="absolute top-1 left-2 right-2 h-7 rounded-t-[18px] bg-gradient-to-b from-white/70 via-white/20 to-transparent pointer-events-none" />

          {/* Curved Undo Arrow Icon */}
          <Undo2 className="w-9 sm:w-10 h-9 sm:h-10 stroke-[3] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:-rotate-12 transition-transform duration-200" />
        </button>

        {/* Video Camera Badge matching screenshot */}
        <div className="absolute -top-1.5 -right-1.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none">
          <svg viewBox="0 0 28 20" className="w-6 h-4.5 overflow-visible">
            {/* White Camera Body */}
            <rect x="2" y="3" width="16" height="14" rx="3.5" fill="#ffffff" />
            {/* Camera Lens Cone */}
            <polygon points="18,6.5 25,3 25,17 18,13.5" fill="#ffffff" />
            {/* Blue Play Triangle inside camera */}
            <polygon points="8,7 13,10 8,13" fill="#0284c7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
