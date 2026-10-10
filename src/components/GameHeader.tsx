import React from 'react';
import { Level } from '../types/game';
import { BookOpenText, Settings } from 'lucide-react';

interface GameHeaderProps {
  currentLevel: Level;
  onOpenLevelSelector: () => void;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenMoreMenu?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentLevel,
  onOpenLevelSelector,
  onOpenSettings,
  onOpenRules,
  onOpenMoreMenu,
}) => {
  return (
    <header className="w-full max-w-md mx-auto px-3 pt-2 pb-1.5 select-none z-20">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <button
          onClick={onOpenSettings}
          title="设置"
          className="w-9 h-9 rounded-[12px] bg-gradient-to-b from-[#8bc2ff] via-[#4d9af6] to-[#1e4ac2] border border-[#dfeeff]/80 shadow-[0_8px_18px_rgba(29,78,216,0.42),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-3px_4px_rgba(10,34,100,0.35)] flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
        >
          <Settings className="w-4.5 h-4.5 stroke-[2.4] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
        </button>

        <button
          onClick={onOpenLevelSelector}
          title="选择关卡"
          className="min-w-0 h-9 px-3 rounded-[14px] bg-gradient-to-b from-[#7bb9ff] via-[#3f8ef5] to-[#1f5fd5] border border-[#dfeeff]/80 shadow-[0_8px_18px_rgba(25,90,214,0.38),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-3px_5px_rgba(8,27,82,0.28)] text-white font-black text-[13px] tracking-wide flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <span className="truncate px-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            {typeof currentLevel.id === 'number'
              ? `第${currentLevel.id}关`
              : currentLevel.title}
          </span>
        </button>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onOpenRules}
            title="玩法规则"
            className="w-8 h-8 rounded-[11px] bg-gradient-to-b from-[#7bb9ff] via-[#3f8ef5] to-[#1f5fd5] border border-[#dfeeff]/80 shadow-[0_8px_18px_rgba(25,90,214,0.38),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-3px_4px_rgba(8,27,82,0.28)] flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
          >
            <BookOpenText className="w-3.5 h-3.5 stroke-[2.1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
          </button>

          <div
            className="h-8 px-2 rounded-[11px] bg-slate-900/70 border border-white/15 backdrop-blur-md flex items-center gap-1.5 text-white/90 shadow-[0_6px_14px_rgba(15,23,42,0.28)] cursor-pointer active:scale-95 transition-transform"
            onClick={onOpenMoreMenu || onOpenLevelSelector}
            title="更多选项"
          >
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-white/90" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
              <span className="w-1 h-1 rounded-full bg-white/90" />
            </div>

            <span className="w-[1px] h-3 bg-white/20" />

            <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-white/90 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white/90" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
