import React from 'react';
import { Level, PlayerStats } from '../types/game';
import { getDailyChallenge } from '../generator/levelGenerator';
import { Calendar, Trophy, Star, ArrowRight, X, Flame } from 'lucide-react';

interface DailyChallengeModalProps {
  stats: PlayerStats;
  onPlayDaily: (level: Level) => void;
  onClose: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  stats,
  onPlayDaily,
  onClose,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const dailyLevel = getDailyChallenge(today);
  const todayRecord = stats.dailyChallengeCompleted[today];
  const isDone = !!todayRecord;

  // Calculate streak
  const streak = Object.keys(stats.dailyChallengeCompleted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden">
        {/* Header decoration */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Calendar Badge */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
          <Calendar className="w-8 h-8 text-slate-950" />
        </div>

        <h3 className="text-xl font-black text-white mb-1">每日倒水挑战</h3>
        <p className="text-xs text-cyan-400 font-mono mb-4">{today}</p>

        {/* Streak counter */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-400 text-xs font-bold mb-4">
          <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
          <span>累计通关天数：{streak} 天</span>
        </div>

        {/* Card info */}
        <div className="w-full bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 mb-5 flex flex-col gap-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">关卡难度</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              大师级 (Solver认证)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">试管与颜色</span>
            <span className="text-xs font-bold text-slate-200">
              {dailyLevel.tubes.length - 2} 色 · {dailyLevel.tubes.length} 瓶
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">理论最优解</span>
            <span className="text-xs font-bold text-cyan-400 font-mono">
              {dailyLevel.optimalSteps} 步
            </span>
          </div>

          {isDone && (
            <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-emerald-400 font-bold">
              <span>今日已达成</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= todayRecord.stars
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
                <span className="ml-1 text-[11px] text-slate-400 font-normal">
                  ({todayRecord.steps}步)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onPlayDaily(dailyLevel);
            onClose();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <span>{isDone ? '再次挑战今日谜题' : '开始今日挑战'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
