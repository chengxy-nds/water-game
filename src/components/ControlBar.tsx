import React from 'react';

interface ControlBarProps {
  canUndo: boolean;
  undoCount?: number;
  hintCount?: number;
  onUndo: () => void;
  onRestart: () => void;
  onHint: () => void;
  onAddTube: () => void;
  disabled?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  canUndo,
  undoCount = 3,
  hintCount = 3,
  onUndo,
  onRestart,
  onHint,
  onAddTube,
  disabled = false,
}) => {
  return (
    <div className="w-full max-w-md mx-auto px-4 pt-1 pb-4 select-none z-20 flex items-center justify-between gap-2 sm:gap-4">
      {/* 1. 撤销 (Undo) */}
      <button
        onClick={onUndo}
        disabled={!canUndo || disabled}
        title="撤销上一步"
        className={`flex-1 flex flex-col items-center justify-center group active:scale-90 transition-transform duration-150 cursor-pointer ${
          !canUndo ? 'opacity-40 grayscale-[0.4] pointer-events-none' : ''
        }`}
      >
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
          <img
            src="/btn_undo.png"
            alt="撤销"
            className="w-full h-full object-contain pointer-events-none group-hover:brightness-110 transition-all"
            draggable={false}
          />
        </div>
      </button>

      {/* 2. 重来 (Restart) */}
      <button
        onClick={onRestart}
        disabled={disabled}
        title="重来本关"
        className="flex-1 flex flex-col items-center justify-center group active:scale-90 transition-transform duration-150 cursor-pointer"
      >
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
          <img
            src="/btn_restart.png"
            alt="重来"
            className="w-full h-full object-contain pointer-events-none group-hover:brightness-110 transition-all"
            draggable={false}
          />
        </div>
      </button>

      {/* 3. 提示 (Hint) */}
      <button
        onClick={onHint}
        disabled={disabled}
        title="获取提示"
        className="flex-1 flex flex-col items-center justify-center group active:scale-90 transition-transform duration-150 cursor-pointer"
      >
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
          <img
            src="/btn_hint.png"
            alt="提示"
            className="w-full h-full object-contain pointer-events-none group-hover:brightness-110 transition-all"
            draggable={false}
          />
        </div>
      </button>

      {/* 4. 加一瓶 (Add Tube) */}
      <button
        onClick={onAddTube}
        disabled={disabled}
        title="增加一个空试管"
        className="flex-1 flex flex-col items-center justify-center group active:scale-90 transition-transform duration-150 cursor-pointer"
      >
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
          <img
            src="/btn_add.png"
            alt="加一瓶"
            className="w-full h-full object-contain pointer-events-none group-hover:brightness-110 transition-all"
            draggable={false}
          />
        </div>
      </button>
    </div>
  );
};

