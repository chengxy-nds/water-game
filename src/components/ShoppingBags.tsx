import React from 'react';
import { Tube } from '../types/game';
import { getColor } from '../utils/colors';
import { isTubeComplete } from '../solver/waterSortSolver';

interface ShoppingBagsProps {
  tubes: Tube[];
  onUnlockBonus?: () => void;
  bonusUnlocked?: boolean;
  activeGulpColor?: string | null;
  collectedColors?: Set<string>;
}

export const ShoppingBags: React.FC<ShoppingBagsProps> = ({
  tubes,
  onUnlockBonus,
  bonusUnlocked = false,
  activeGulpColor = null,
  collectedColors = new Set(),
}) => {
  const completedColors = collectedColors;

  const puzzleColors: string[] = [];
  tubes.forEach((t) => {
    t.forEach((c) => {
      if (!puzzleColors.includes(c)) puzzleColors.push(c);
    });
  });
  collectedColors.forEach((c) => {
    if (!puzzleColors.includes(c)) puzzleColors.push(c);
  });

  // Preferred visual order matching reference screenshot (Yellow -> Purple -> Blue)
  const preferredColors = ['yellow', 'purple', 'blue'];
  const bagColors: string[] = preferredColors.filter((c) => puzzleColors.includes(c));
  puzzleColors.forEach((c) => {
    if (!bagColors.includes(c) && bagColors.length < 3) bagColors.push(c);
  });
  while (bagColors.length < 3) {
    bagColors.push(preferredColors[bagColors.length] || 'yellow');
  }

  return (
    <div id="shopping-bags-container" className="w-full max-w-sm mx-auto flex items-center justify-center gap-2.5 sm:gap-3.5 px-3 py-1 select-none">
      {bagColors.map((colorId, idx) => {
        const cDef = getColor(colorId);
        const isDone = completedColors.has(colorId);
        const isGulping = activeGulpColor === colorId;

        return (
          <div
            key={`bag-pure-svg-${idx}-${colorId}`}
            id={`shopping-bag-${colorId}`}
            className={`relative flex flex-col items-center transition-all duration-300 ${
              isGulping
                ? 'anim-bag-gulp z-30'
                : isDone
                ? 'scale-105 filter drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]'
                : 'filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            <svg
              viewBox="0 0 54 84"
              className="w-[56px] sm:w-[62px] h-[86px] sm:h-[94px] overflow-visible select-none"
            >
              <defs>
                {/* 3D Gusset Side Shadow Gradient */}
                <linearGradient id={`gusset-grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
              </defs>

              {/* 1. Back Rope Handle */}
              <path
                d="M 19 21 C 19 3, 31 3, 31 21"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />

              {/* 2. 3D Side Gusset (Depth Perspective) */}
              <polygon
                points="40,21 48,16 48,68 40,75"
                fill={`url(#gusset-grad-${idx})`}
                stroke="#64748b"
                strokeWidth="0.5"
              />
              {/* Side Bottom Darker Color Band */}
              <polygon
                points="40,59 48,53 48,68 40,75"
                fill={cDef.shadeHex || cDef.hex}
              />

              {/* 3. Front Face Pure White Bag Body */}
              <rect
                x="8"
                y="21"
                width="32"
                height="54"
                rx="1"
                fill="#ffffff"
                stroke="#e2e8f0"
                strokeWidth="0.8"
              />

              {/* Front Bottom Vibrant Color Band */}
              <rect
                x="8"
                y="59"
                width="32"
                height="16"
                rx="1"
                fill={cDef.hex}
              />

              {/* 4. Clear Window Frame (Recessed Look) */}
              <rect
                x="14"
                y="27"
                width="20"
                height="38"
                rx="4.5"
                fill="#f1f5f9"
                stroke={cDef.hex}
                strokeWidth="2.5"
              />

              {/* Window Glass Diagonal Highlight */}
              <path
                d="M 17 31 L 23 59"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Completed Mini Bottle inside Bag Window */}
              {isDone && (
                <g>
                  {/* Miniature Bottle Body */}
                  <rect
                    x="19"
                    y="36"
                    width="10"
                    height="20"
                    rx="3"
                    fill={cDef.hex}
                    stroke={cDef.shadeHex || cDef.hex}
                    strokeWidth="0.8"
                  />
                  {/* Miniature Bottle Neck */}
                  <rect x="22" y="33" width="4" height="4" fill="#93c5fd" opacity="0.8" />
                  {/* Miniature Wooden Cork */}
                  <rect x="22.5" y="31.5" width="3" height="2.5" rx="0.5" fill="#d97706" stroke="#b45309" strokeWidth="0.4" />
                  {/* Mini Gloss line */}
                  <line x1="20.5" y1="38" x2="20.5" y2="52" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
                  {/* Golden Sparkle Star */}
                  <text x="24" y="27" fill="#fde047" fontSize="7" fontWeight="black" textAnchor="middle">✦</text>
                </g>
              )}

              {/* 5. Front Rope Handle */}
              <path
                d="M 17 21 C 17 1, 29 1, 29 21"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 17 21 C 17 1, 29 1, 29 21"
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        );
      })}

      {/* Bag 4: Pure Code 3D Video Camera Bonus Bag */}
      <div
        className="relative flex flex-col items-center cursor-pointer active:scale-95 transition-transform filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]"
        onClick={onUnlockBonus}
        title="解锁额外空瓶"
      >
        <svg
          viewBox="0 0 54 84"
          className="w-[56px] sm:w-[62px] h-[86px] sm:h-[94px] overflow-visible select-none"
        >
          {/* Back Rope Handle */}
          <path
            d="M 19 21 C 19 3, 31 3, 31 21"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* 3D Side Gusset */}
          <polygon
            points="40,21 48,16 48,68 40,75"
            fill="#94a3b8"
          />
          <polygon
            points="40,59 48,53 48,68 40,75"
            fill="#64748b"
          />

          {/* Front Face Light Gray Paper */}
          <rect
            x="8"
            y="21"
            width="32"
            height="54"
            rx="1"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="0.8"
          />

          {/* Bottom Gray Band */}
          <rect
            x="8"
            y="59"
            width="32"
            height="16"
            rx="1"
            fill="#94a3b8"
          />

          {/* Window Frame */}
          <rect
            x="14"
            y="27"
            width="20"
            height="38"
            rx="4.5"
            fill="#cbd5e1"
            stroke="#64748b"
            strokeWidth="2.2"
          />

          {/* 3D Video Camera Icon inside Window */}
          <g>
            {/* White Camera Body */}
            <rect x="19.5" y="42" width="9" height="8" rx="1.5" fill="#ffffff" />
            {/* Camera Lens Cone */}
            <polygon points="29,43.5 33,41 33,51 29,48.5" fill="#ffffff" />
            {/* Cyan Play Triangle */}
            <polygon points="23,43.5 26.5,46 23,48.5" fill="#0284c7" />
          </g>

          {/* Front Rope Handle */}
          <path
            d="M 17 21 C 17 1, 29 1, 29 21"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        {bonusUnlocked && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md">
            ✓
          </span>
        )}
      </div>
    </div>
  );
};
