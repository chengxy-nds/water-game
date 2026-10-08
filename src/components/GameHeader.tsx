import React from 'react';
import { Level } from '../types/game';
import { Settings, Sparkles, Map, Calendar } from 'lucide-react';

interface GameHeaderProps {
  currentLevel: Level;
  movesCount: number;
  optimalSteps?: number;
  starsCollected: number;
  totalLevelsCount: number;
  onOpenLevelSelector: () => void;
  onOpenDaily: () => void;
  onOpenWorkshop: () => void;
  onOpenSettings: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentLevel,
  movesCount,
  optimalSteps,
  starsCollected,
  onOpenLevelSelector,
  onOpenDaily,
  onOpenWorkshop,
  onOpenSettings,
}) => {
  return (
    <header className="w-full max-w-xl mx-auto px-4 pt-3 pb-1 flex flex-col gap-2 z-20 select-none">
      {/* Top Navbar matching Image 1 & 3 */}
      <div className="flex items-center justify-between">
        {/* Left: 3D Glossy Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          title="设置"
          className="w-10 h-10 rounded-2xl btn-candy-blue flex items-center justify-center text-white active:scale-90 transition-all shadow-lg"
        >
          <Settings className="w-5 h-5 drop-shadow" />
        </button>

        {/* Center: Glossy Level Pill (Reference Match: "第 2 关") */}
        <div className="flex flex-col items-center">
          <div className="px-5 py-1.5 rounded-full btn-candy-blue border border-sky-300/40 shadow-lg flex items-center gap-1.5 text-white font-black text-sm tracking-wide">
            <span>
              {typeof currentLevel.id === 'number'
                ? `第 ${currentLevel.id} 关`
                : currentLevel.title}
            </span>
          </div>

          {/* Subtext: Moves & Optimal */}
          <div className="text-[11px] font-bold text-sky-200/90 mt-1 flex items-center gap-2">
            <span>步数: <span className="text-white font-mono">{movesCount}</span></span>
            {optimalSteps !== undefined && (
              <span className="text-cyan-300">
                (最优: <span className="font-mono">{optimalSteps}</span>步)
              </span>
            )}
          </div>
        </div>

        {/* Right action buttons: Workshop & Map */}
        <div className="flex items-center gap-1.5">
          {/* Daily Challenge */}
          <button
            onClick={onOpenDaily}
            title="每日挑战"
            className="w-9 h-9 rounded-xl btn-candy-amber flex items-center justify-center text-slate-950 active:scale-90 transition-all shadow-md relative"
          >
            <Calendar className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-ping" />
          </button>

          {/* Level Workshop / Solver */}
          <button
            onClick={onOpenWorkshop}
            title="关卡工坊 & Solver"
            className="w-9 h-9 rounded-xl btn-candy-purple flex items-center justify-center text-white active:scale-90 transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Level Map */}
          <button
            onClick={onOpenLevelSelector}
            title="选关"
            className="w-9 h-9 rounded-xl btn-candy-blue flex items-center justify-center text-white active:scale-90 transition-all shadow-md"
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
