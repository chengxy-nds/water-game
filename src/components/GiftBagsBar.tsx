import React from 'react';
import { Bottle } from '../types/game';
import { getColor } from '../utils/colors';
import { isBottleComplete, TUBE_CAPACITY } from '../solver/waterSortSolver';
import { Check } from 'lucide-react';

interface GiftBagsBarProps {
  bottles: Bottle[];
}

export const GiftBagsBar: React.FC<GiftBagsBarProps> = ({ bottles }) => {
  // Extract all unique colors present in the puzzle
  const uniqueColors = Array.from(
    new Set(bottles.flatMap((b) => b.layers))
  ).filter(Boolean);

  // Find which colors are fully completed in any bottle
  const completedColors = new Set<string>();
  for (const b of bottles) {
    if (isBottleComplete(b, TUBE_CAPACITY)) {
      completedColors.add(b.layers[0]);
    }
  }

  // Display at most 5-6 gift bags for the active level
  const displayColors = uniqueColors.slice(0, 6);

  if (displayColors.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto flex items-center justify-center gap-3 sm:gap-4 py-2 px-2 select-none">
      {displayColors.map((colorId) => {
        const color = getColor(colorId);
        const isDone = completedColors.has(colorId);

        return (
          <div
            key={colorId}
            className={`relative flex flex-col items-center transition-all duration-300 ${
              isDone ? 'scale-105' : 'opacity-85'
            }`}
          >
            {/* Bag Handle Loop */}
            <div className="w-6 h-4 border-2 border-slate-300 rounded-t-full -mb-1 z-0 shadow-sm" />

            {/* Bag Body */}
            <div
              className={`w-12 sm:w-14 h-16 rounded-t-md rounded-b-lg border border-slate-300/40 relative flex flex-col justify-between overflow-hidden shadow-lg transition-all ${
                isDone
                  ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                  : 'bg-slate-100'
              }`}
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 65%, #e2e8f0 100%)',
              }}
            >
              {/* Inner Cutout Window / Label */}
              <div className="mx-auto mt-2 w-8 h-7 rounded border border-slate-300 bg-white/80 flex items-center justify-center shadow-inner">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold">待收</span>
                )}
              </div>

              {/* Bottom Colored Fold Base (matches reference image 1 & 3!) */}
              <div
                className="w-full h-4 transition-colors relative"
                style={{
                  backgroundColor: color.hex,
                  boxShadow: `inset 0 1px 2px rgba(255,255,255,0.4)`,
                }}
              >
                {/* 3D Fold shading */}
                <div className="absolute inset-0 bg-black/15" />
              </div>
            </div>

            {/* Completed Sparkle */}
            {isDone && (
              <span className="absolute -top-1 -right-1 text-xs text-amber-300 anim-twinkle">
                ✦
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
