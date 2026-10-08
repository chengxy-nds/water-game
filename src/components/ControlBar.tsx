import React from 'react';
import { RotateCcw, Undo2, PlusCircle, Lightbulb, Play, Pause } from 'lucide-react';

interface ControlBarProps {
  canUndo: boolean;
  canAddTube: boolean;
  extraTubesAdded: number;
  isAutoSolving: boolean;
  isHintActive: boolean;
  onUndo: () => void;
  onReset: () => void;
  onAddTube: () => void;
  onHint: () => void;
  onToggleAutoSolve: () => void;
  disabled?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  canUndo,
  canAddTube,
  extraTubesAdded,
  isAutoSolving,
  isHintActive,
  onUndo,
  onReset,
  onAddTube,
  onHint,
  onToggleAutoSolve,
  disabled = false,
}) => {
  return (
    <div className="w-full max-w-sm mx-auto px-4 py-2 flex items-center justify-around gap-3 select-none z-20">
      {/* 1. Add Bottle / Prop Button (Blue Candy Square with red badge, matching Image 1 & 3!) */}
      <button
        onClick={onAddTube}
        disabled={!canAddTube || disabled || isAutoSolving}
        title={extraTubesAdded >= 2 ? '加瓶已达上限' : '增加空瓶道具'}
        className="relative w-14 h-14 rounded-2xl btn-candy-blue flex flex-col items-center justify-center text-white active:scale-90 transition-all shadow-xl disabled:opacity-40 disabled:pointer-events-none group"
      >
        <PlusCircle className="w-6 h-6 drop-shadow group-hover:scale-110 transition-transform" />
        <span className="text-[9px] font-black tracking-tight mt-0.5">加瓶</span>

        {/* Badge counter on top right corner */}
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-md">
          {extraTubesAdded > 0 ? `+${extraTubesAdded}` : '1'}
        </span>
      </button>

      {/* 2. Reset Button */}
      <button
        onClick={onReset}
        disabled={disabled || isAutoSolving}
        title="重置本关"
        className="w-12 h-12 rounded-2xl btn-candy-slate flex flex-col items-center justify-center text-slate-800 active:scale-90 transition-all shadow-lg disabled:opacity-40 disabled:pointer-events-none group"
      >
        <RotateCcw className="w-5 h-5 drop-shadow group-hover:-rotate-90 transition-transform duration-300" />
        <span className="text-[9px] font-bold mt-0.5">重置</span>
      </button>

      {/* 3. Hint (Solver AI) Button (Amber Candy Button) */}
      <button
        onClick={onHint}
        disabled={disabled || isAutoSolving}
        title="Solver 智能提示"
        className={`w-14 h-14 rounded-2xl btn-candy-amber flex flex-col items-center justify-center text-slate-950 active:scale-90 transition-all shadow-xl disabled:opacity-40 disabled:pointer-events-none relative ${
          isHintActive ? 'ring-4 ring-amber-300 animate-pulse' : ''
        }`}
      >
        <Lightbulb className="w-6 h-6 fill-slate-950/80 drop-shadow" />
        <span className="text-[9px] font-black tracking-tight mt-0.5">提示</span>

        <span className="absolute -top-1 -right-1 text-[8px] bg-sky-950 text-cyan-300 font-black px-1.5 py-0.5 rounded-full border border-cyan-400 shadow-sm">
          AI
        </span>
      </button>

      {/* 4. Auto-Solve / Demo Button */}
      <button
        onClick={onToggleAutoSolve}
        disabled={disabled}
        title={isAutoSolving ? '暂停演示' : '自动解题推演'}
        className="w-12 h-12 rounded-2xl btn-candy-purple flex flex-col items-center justify-center text-white active:scale-90 transition-all shadow-lg disabled:opacity-40 disabled:pointer-events-none"
      >
        {isAutoSolving ? (
          <Pause className="w-5 h-5 fill-white drop-shadow" />
        ) : (
          <Play className="w-5 h-5 fill-white drop-shadow" />
        )}
        <span className="text-[9px] font-bold mt-0.5">
          {isAutoSolving ? '暂停' : '演示'}
        </span>
      </button>

      {/* 5. Undo Button (Silver / Blue Candy Square, matching Image 1 & 3!) */}
      <button
        onClick={onUndo}
        disabled={!canUndo || disabled || isAutoSolving}
        title="撤销上一步"
        className="w-14 h-14 rounded-2xl btn-candy-slate flex flex-col items-center justify-center text-slate-800 active:scale-90 transition-all shadow-xl disabled:opacity-40 disabled:pointer-events-none group"
      >
        <Undo2 className="w-6 h-6 drop-shadow group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-[9px] font-black tracking-tight mt-0.5">撤销</span>
      </button>
    </div>
  );
};
