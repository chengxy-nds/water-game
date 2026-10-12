import React from 'react';
import { Level } from '../types/game';

interface GameHeaderProps {
  currentLevel: Level;
  movesCount?: number;
  coins?: number;
  onOpenLevelSelector: () => void;
  onOpenSettings: () => void;
  onOpenChallenge?: () => void;
  onOpenRules?: () => void;
  onBack?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentLevel,
  onOpenLevelSelector,
  onOpenSettings,
  onOpenChallenge,
}) => {
  const levelNum = typeof currentLevel.id === 'number' ? currentLevel.id : 1;

  return (
    <header className="w-full max-w-[430px] mx-auto px-4 pt-3 pb-0 select-none z-20">
      <div className="flex items-center justify-between w-full h-[46px]">
        {/* Left: Authentic 3D Blue Glossy Settings Button from Figma (Node 9:3) */}
        <button
          onClick={onOpenSettings}
          title="设置"
          className="w-[44px] h-[46px] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <img
            src="/assets_figma/btn_settings.png"
            alt="设置"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
          />
        </button>

        {/* Center: Authentic 3D Glossy Level Capsule Badge from Figma (Node 9:4) */}
        <button
          onClick={onOpenLevelSelector}
          title="选择关卡"
          className="relative w-[116px] h-[46px] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <img
            src="/assets_figma/level_capsule_empty.png"
            alt="关卡徽标"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
          />
          <span className="relative z-10 text-[17px] font-black text-white tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            第 {levelNum} 关
          </span>
        </button>

        {/* Right: Authentic 3D Blue Glossy Challenge Button with Gamepad Icon from Figma (Node 9:5) */}
        <button
          onClick={onOpenChallenge}
          title="每日挑战"
          className="relative w-[44px] h-[46px] rounded-[14px] bg-gradient-to-b from-[#56aaff] via-[#297bee] to-[#1258d4] border-[2px] border-[#93cbfd]/90 shadow-[0_4px_12px_rgba(18,88,212,0.45),inset_0_2px_3px_rgba(255,255,255,0.75),inset_0_-2px_4px_rgba(10,34,100,0.4)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <img
            src="/assets_figma/btn_gamepad.png"
            alt="挑战"
            className="w-7 h-7 object-contain pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] brightness-150"
          />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0A0F2E]" />
        </button>
      </div>
    </header>
  );
};
