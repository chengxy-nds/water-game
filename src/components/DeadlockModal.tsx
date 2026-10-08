import React from 'react';
import { AlertCircle, RotateCcw, Undo2, PlusCircle } from 'lucide-react';

interface DeadlockModalProps {
  onUndo: () => void;
  onReset: () => void;
  onAddTube?: () => void;
  canAddTube?: boolean;
}

/**
 * Section 15 & 16: Non-punitive Deadlock Feedback
 * In Water Sort, when there are no legal moves remaining and the puzzle is not solved:
 * We NEVER show a frustrating "GAME OVER"!
 * Instead we present a supportive dialog: "似乎走进了死路"
 * Offering:
 * - [撤销一步] (Undo)
 * - [增加空瓶] (Add Tube)
 * - [重新开始] (Restart)
 */
export const DeadlockModal: React.FC<DeadlockModalProps> = ({
  onUndo,
  onReset,
  onAddTube,
  canAddTube = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden">
        {/* Ambient Warm Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center shadow-lg mb-3">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>

        <h3 className="text-xl font-black text-white tracking-tight mb-1">
          似乎走进了死路
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-6 px-2">
          当前所有瓶子间暂无可行的倒水路径。不用担心，随时可以撤销或重整策略！
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* 1. Undo Step */}
          <button
            onClick={onUndo}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Undo2 className="w-4 h-4" />
            <span>撤销上一步</span>
          </button>

          {/* 2. Add Extra Tube (if available) */}
          {canAddTube && onAddTube && (
            <button
              onClick={onAddTube}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-sky-400/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-sky-400" />
              <span>加一个空瓶破局</span>
            </button>
          )}

          {/* 3. Restart */}
          <button
            onClick={onReset}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新开始本关</span>
          </button>
        </div>
      </div>
    </div>
  );
};
