import React from 'react';
import { soundManager } from '../utils/audio';
import { X, Volume2, VolumeX, Eye, Vibrate, Info, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  showSymbols: boolean;
  onToggleSound: () => void;
  onToggleVibrate: () => void;
  onToggleSymbols: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  soundEnabled,
  vibrateEnabled,
  showSymbols,
  onToggleSound,
  onToggleVibrate,
  onToggleSymbols,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-white">游戏设置</h3>
            <p className="text-xs text-slate-400">个性化触感与体验偏好</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggles */}
        <div className="py-4 flex flex-col gap-3">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">水流音效</div>
                <div className="text-[11px] text-slate-400">实时玻璃与水流物理合成声</div>
              </div>
            </div>
            <button
              onClick={() => {
                onToggleSound();
                soundManager.playSelect();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Haptics */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Vibrate className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">触感振动</div>
                <div className="text-[11px] text-slate-400">倾倒与碰撞微触觉反馈</div>
              </div>
            </div>
            <button
              onClick={onToggleVibrate}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                vibrateEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  vibrateEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Colorblind symbols */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">色盲辅助符号</div>
                <div className="text-[11px] text-slate-400">在液体层标注清晰几何图案</div>
              </div>
            </div>
            <button
              onClick={onToggleSymbols}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                showSymbols ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  showSymbols ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Solver explanation */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex flex-col gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Info className="w-3.5 h-3.5" />
            <span>关于 Solver (智能解题器)</span>
          </div>
          <p>
            游戏内置基于状态对称性剪枝的高性能广度优先搜索 (BFS) 解题引擎。每个关卡均保证存在最优解，星级评价由理论最小步数严格裁定。
          </p>
        </div>

        {/* TapTap badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>TapTap 独立游戏品鉴版 · 极简无打扰</span>
        </div>
      </div>
    </div>
  );
};
