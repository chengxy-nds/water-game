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
    const count = 82;
    const defaults = { origin: { y: 0.68 }, zIndex: 100 };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 38,
      startVelocity: 34,
      gravity: 0.82,
      ticks: 180,
      colors: ['#8be5ff', '#b8d7ff', '#ffe38b', '#ffc9df'],
    });
    fire(0.2, {
      spread: 72,
      startVelocity: 27,
      gravity: 0.78,
      ticks: 165,
      colors: ['#a9c7ff', '#d1baff', '#ffd4a8'],
    });
    fire(0.35, {
      spread: 92,
      decay: 0.94,
      scalar: 0.62,
      ticks: 170,
    });
    fire(0.1, {
      spread: 105,
      startVelocity: 18,
      decay: 0.94,
      scalar: 0.8,
      ticks: 180,
    });
  }, []);

  return (
    <div className="win-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="win-card relative w-full max-w-sm rounded-[32px] p-6 flex flex-col items-center text-center overflow-hidden">
        <div className="win-card-glint" aria-hidden="true" />
        <div className="win-ambient-glow" aria-hidden="true" />

        {/* Trophy icon */}
        <div className="win-trophy-wrap relative mb-3">
          <div className="win-trophy-badge w-20 h-20 rounded-[26px] flex items-center justify-center">
            <Trophy className="w-10 h-10" />
          </div>
        </div>

        {/* Animated Stars */}
        <div className="flex items-center gap-2 mb-5 mt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`win-star transition-all duration-500 transform ${
                s <= stars
                  ? 'text-amber-300 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                  : 'text-slate-400/50 scale-90'
              }`}
            >
              <Star className={`w-9 h-9 ${s <= stars ? 'fill-amber-300' : ''}`} />
            </div>
          ))}
        </div>

        {/* Evaluation Card (Section 21 & 22: Optimal Solver Score & Difference) */}
        <div className="win-stats w-full rounded-[24px] p-3.5 mb-4 grid grid-cols-1 items-center">
          <div className="flex flex-col">
            <span className="win-stat-label text-[11px] font-medium">本次用步</span>
            <span className="win-stat-value text-xl font-black">{movesCount} 步</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              className="win-primary-button relative w-full py-4 px-4 rounded-full font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>进入下一关</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="w-full flex items-center gap-2">
            <button
              onClick={onReplay}
              className="win-secondary-button flex-1 py-3.5 px-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>再玩一次</span>
            </button>

            <button
              onClick={onSelectLevel}
              className="win-secondary-button flex-1 py-3.5 px-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
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
