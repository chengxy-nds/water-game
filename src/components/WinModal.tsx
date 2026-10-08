import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, RotateCcw, Menu, Star } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface WinModalProps {
  levelTitle: string;
  movesCount: number;
  optimalSteps?: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onSelectLevel: () => void;
  hasNextLevel: boolean;
}

export const WinModal: React.FC<WinModalProps> = ({
  levelTitle,
  movesCount,
  optimalSteps,
  onNextLevel,
  onReplay,
  onSelectLevel,
  hasNextLevel,
}) => {
  // Calculate stars
  let stars = 3;
  if (optimalSteps) {
    if (movesCount > optimalSteps * 1.5) {
      stars = 1;
    } else if (movesCount > optimalSteps + 2) {
      stars = 2;
    }
  }

  useEffect(() => {
    soundManager.playVictory();

    // Fire fireworks / confetti burst
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#38bdf8', '#34d399', '#f59e0b', '#ec4899'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#6366f1', '#a855f7', '#f43f5e'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-10 h-10 text-slate-950" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-slate-900">
            PASSED
          </div>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-1">
          {levelTitle}
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          颜色全部归位，水序归序！
        </p>

        {/* Animated Stars */}
        <div className="flex items-center gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`transition-all duration-500 transform ${
                s <= stars
                  ? 'text-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                  : 'text-slate-700 scale-90'
              }`}
            >
              <Star className={`w-8 h-8 ${s <= stars ? 'fill-amber-400' : ''}`} />
            </div>
          ))}
        </div>

        {/* Evaluation Card (Section 21 & 22: Optimal Solver Score & Difference) */}
        <div className="w-full bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 mb-5 flex items-center justify-around">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">本次用步</span>
            <span className="text-xl font-black text-white">{movesCount} 步</span>
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">理论最优解</span>
            <span className="text-xl font-black text-cyan-400">
              {optimalSteps !== undefined ? `${optimalSteps} 步` : '已测通'}
            </span>
          </div>

          {optimalSteps !== undefined && (
            <>
              <div className="w-px h-8 bg-slate-700" />
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium">最优解差距</span>
                <span
                  className={`text-xl font-black ${
                    movesCount <= optimalSteps
                      ? 'text-emerald-400'
                      : movesCount <= optimalSteps + 2
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {movesCount <= optimalSteps
                    ? '0 (完美)'
                    : `+${movesCount - optimalSteps}`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Commentary */}
        <div className="text-xs text-slate-300 font-medium mb-6">
          {stars === 3 ? (
            <span className="text-amber-400 font-bold">
              ✨ 绝妙解法！你的操作逼近理论极致！
            </span>
          ) : stars === 2 ? (
            <span className="text-sky-300">
              ⚡ 表现亮眼！差一点点就能拿下三星！
            </span>
          ) : (
            <span className="text-slate-400">
              💪 顺利突围！多加尝试可以节省更多步数！
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>进入下一关</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="w-full flex items-center gap-2">
            <button
              onClick={onReplay}
              className="flex-1 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>再玩一次</span>
            </button>

            <button
              onClick={onSelectLevel}
              className="flex-1 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>关卡选单</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
