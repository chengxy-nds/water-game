import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Section 18: Reset Confirmation Modal
 * "确定重新开始？当前进度将被清除。[取消] [重新开始]"
 */
export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xs rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg mb-3">
          <RotateCcw className="w-7 h-7 text-sky-400" />
        </div>

        <h3 className="text-lg font-black text-white tracking-tight mb-1">
          确定重新开始？
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          当前进度与操作步数将被清除，试管将恢复至关卡初始状态。
        </p>

        <div className="w-full flex items-center gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-xs tracking-wide shadow-lg shadow-rose-500/25 transition-all active:scale-95"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
};
