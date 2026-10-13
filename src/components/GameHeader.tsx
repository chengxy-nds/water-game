import React from 'react';
import { Settings, Gamepad2 } from 'lucide-react';
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
        {/* Left: Settings Button (统一与 footer 按钮风格一致) */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="设置"
          aria-label="设置"
          className="header-action-button"
        >
          <Settings size={22} strokeWidth={2.4} className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(5,20,70,0.65)]" />
        </button>

        {/* Center: Authentic 3D Glossy Level Capsule Badge from Figma (Node 9:4) */}
        <button
          type="button"
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

        {/* Right: Challenge Button (统一与 footer 按钮风格一致) */}
        <button
          type="button"
          onClick={onOpenChallenge}
          title="每日挑战"
          aria-label="每日挑战"
          className="header-action-button"
        >
          <Gamepad2 size={22} strokeWidth={2.3} className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(5,20,70,0.65)]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0A0F2E] z-20" />
        </button>
      </div>
    </header>
  );
};
