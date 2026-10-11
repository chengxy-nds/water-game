import React from 'react';
import { Level } from '../types/game';

interface GameHeaderProps {
  currentLevel: Level;
  movesCount?: number;
  coins?: number;
  onOpenLevelSelector: () => void;
  onOpenSettings: () => void;
  onBack?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentLevel,
  movesCount = 0,
  coins = 280,
  onOpenLevelSelector,
  onOpenSettings,
  onBack,
}) => {
  const levelNum = typeof currentLevel.id === 'number' ? currentLevel.id : 1;

  return (
    <header className="w-full max-w-[430px] mx-auto px-4 pt-3 pb-2 select-none z-20 flex flex-col gap-3">
      {/* 1. Navigation Row: Back Button, Game Title "瓶中有序", Settings Button */}
      <div className="flex items-center justify-between w-full h-[44px]">
        {/* Back Button */}
        <button
          onClick={onBack || onOpenLevelSelector}
          title="返回 / 关卡列表"
          className="w-11 h-11 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <img
            src="/figma/btn_back.png"
            alt="返回"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
          />
        </button>

        {/* Center Title */}
        <h1 className="text-white text-[19px] font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          瓶中有序
        </h1>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="设置"
          className="w-11 h-11 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <img
            src="/figma/btn_settings.png"
            alt="设置"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
          />
        </button>
      </div>

      {/* 2. Level Banner Card + Coin Badge Row */}
      <div className="flex items-center justify-between w-full">
        {/* Level Card */}
        <button
          onClick={onOpenLevelSelector}
          title="选择关卡"
          className="relative w-[158px] h-[55px] rounded-[18px] flex items-center px-4 overflow-hidden active:scale-95 transition-transform cursor-pointer shadow-[0_4px_14px_rgba(15,23,42,0.4)] border-[2.5px] border-[#72CDFF]"
          style={{
            background: 'linear-gradient(180deg, #8194D7 0%, #4C65AC 100%)',
          }}
        >
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-medium text-white/70 leading-tight">
              缤纷初旅
            </span>
            <span className="text-[22px] font-extrabold text-white tracking-wide leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              第 {levelNum} 关
            </span>
          </div>
        </button>

        {/* Coin Balance Pill */}
        <div
          className="relative w-[106px] h-[40px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          onClick={onOpenLevelSelector}
          title="金币"
        >
          <img
            src="/figma/coin_pill.png"
            alt="金币"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
          />
        </div>
      </div>

      {/* 3. Game Data Bar (Difficulty, Steps, Target) */}
      <div className="flex items-center justify-between w-full px-1 text-[13px] text-sky-200/80 font-medium">
        {/* Difficulty */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
          <span>轻松难度</span>
        </div>

        {/* Steps */}
        <div>
          <span>步数 {movesCount}</span>
        </div>

        {/* Target */}
        <div className="flex items-center gap-1">
          <span>⚑</span>
          <span>收集 4 瓶同色</span>
        </div>
      </div>
    </header>
  );
};
