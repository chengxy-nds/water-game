import React from 'react';
import { Level } from '../types/game';
import { Settings } from 'lucide-react';

interface GameHeaderProps {
  currentLevel: Level;
  onOpenLevelSelector: () => void;
  onOpenSettings: () => void;
  onOpenMoreMenu?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentLevel,
  onOpenLevelSelector,
  onOpenSettings,
  onOpenMoreMenu,
}) => {
  return (
    <header className="w-full max-w-md mx-auto px-4 pt-3 pb-1 select-none z-20 flex items-center justify-between">
      {/* 1. Left: Pure Code 3D Crystal Settings Button */}
      <button
        onClick={onOpenSettings}
        title="设置"
        className="w-11 h-11 rounded-[14px] bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1e40af] border-2 border-[#93c5fd] shadow-[0_4px_12px_rgba(29,78,216,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(30,58,138,0.5)] flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0.5 left-1 right-1 h-3 rounded-t-[10px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
        <Settings className="w-5 h-5 stroke-[2.4] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
      </button>

      {/* 2. Center: Pure Code 3D Glossy Blue Level Capsule */}
      <button
        onClick={onOpenLevelSelector}
        title="选择关卡"
        className="px-6 py-1.5 rounded-full bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1d4ed8] border-2 border-[#93c5fd] shadow-[0_4px_12px_rgba(29,78,216,0.45),inset_0_1.5px_2px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(30,58,138,0.5)] text-white font-black text-sm tracking-wide flex items-center justify-center active:scale-95 transition-transform cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0.5 left-2 right-2 h-2.5 rounded-full bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          {typeof currentLevel.id === 'number'
            ? `第 ${currentLevel.id} 关`
            : currentLevel.title}
        </span>
      </button>

      {/* 3. Right: Mini-App / Mobile Capsule Pill ("··· | ◎") */}
      <div
        className="h-8 px-2.5 rounded-full bg-slate-900/80 border border-white/20 backdrop-blur-md flex items-center gap-2 text-white/90 shadow-sm cursor-pointer active:scale-95 transition-transform"
        onClick={onOpenMoreMenu || onOpenLevelSelector}
        title="更多选项"
      >
        {/* Three dots */}
        <div className="flex items-center gap-0.5 px-0.5">
          <span className="w-1 h-1 rounded-full bg-white"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          <span className="w-1 h-1 rounded-full bg-white"></span>
        </div>

        {/* Divider */}
        <span className="w-[1px] h-3.5 bg-white/25"></span>

        {/* Concentric Circle */}
        <div className="w-4 h-4 rounded-full border-[1.8px] border-white flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
      </div>
    </header>
  );
};
