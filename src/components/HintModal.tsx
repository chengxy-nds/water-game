import React from 'react';
import { Lightbulb, ArrowRight, X, Sparkles } from 'lucide-react';
import { getColor } from '../utils/colors';

export interface HintData {
  tier: 1 | 2 | 3;
  colorId: string;
  fromTubeIndex: number;
  toTubeIndex: number;
}

interface HintModalProps {
  hint: HintData;
  onUpgradeTier?: () => void;
  onApplyHighlight: () => void;
  onClose: () => void;
}

/**
 * Section 19 & 20: Three-Tier Hint System
 * - Tier 1: Direction hint ("先处理蓝色", does not reveal tubes)
 * - Tier 2: Bottle hint ("尝试将 2 号瓶顶部的蓝色移走")
 * - Tier 3: Specific operation ("将 2 号瓶倒入 5 号瓶")
 * Rule 20: Hint does NOT auto-execute; player executes it manually.
 */
export const HintModal: React.FC<HintModalProps> = ({
  hint,
  onUpgradeTier,
  onApplyHighlight,
  onClose,
}) => {
  const colorDef = getColor(hint.colorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Bulb Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400/20 to-yellow-300/20 border border-amber-400/40 flex items-center justify-center shadow-lg mb-3">
          <Lightbulb className="w-7 h-7 text-amber-400 fill-amber-400/30" />
        </div>

        {/* Tier Indicator Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[11px] font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {hint.tier === 1
              ? '一级提示 · 颜色方向'
              : hint.tier === 2
              ? '二级提示 · 试管定位'
              : '三级提示 · 明确步骤'}
          </span>
        </div>

        {/* Dynamic Tier Hint Content */}
        <div className="w-full bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 mb-5">
          {hint.tier === 1 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400">解题策略建议：</span>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                  style={{ backgroundColor: colorDef.hex }}
                />
                <span className="text-base font-black text-white">
                  先集中处理「{colorDef.name}」
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                思考如何调配或腾出空间收拢这种颜色的液体。
              </p>
            </div>
          )}

          {hint.tier === 2 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400">试管位置指引：</span>
              <div className="text-base font-black text-white flex items-center gap-1.5">
                <span>尝试移走</span>
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-sky-300 border border-blue-500/30 font-mono">
                  #{hint.fromTubeIndex + 1}
                </span>
                <span>号瓶顶部的</span>
                <span
                  className="inline-block w-3.5 h-3.5 rounded-full border border-white/30"
                  style={{ backgroundColor: colorDef.hex }}
                />
                <span>{colorDef.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                腾出该瓶下层液体，将为全局流通创造空间。
              </p>
            </div>
          )}

          {hint.tier === 3 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400">Solver 精准操作：</span>
              <div className="text-base font-black text-white flex items-center gap-2 my-1">
                <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono">
                  #{hint.fromTubeIndex + 1} 号瓶
                </div>
                <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />
                <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono">
                  #{hint.toTubeIndex + 1} 号瓶
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                将顶部的 {colorDef.name} 液体倾倒入目标瓶。
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2">
          {hint.tier < 3 && onUpgradeTier && (
            <button
              onClick={onUpgradeTier}
              className="w-full py-3 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span>查看更详细的{hint.tier === 1 ? '二级' : '三级'}提示</span>
            </button>
          )}

          <button
            onClick={() => {
              onApplyHighlight();
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <span>高亮棋盘并自行操作</span>
          </button>
        </div>
      </div>
    </div>
  );
};
