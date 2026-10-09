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
                ? 'scale-105 filter drop-shadow-[0_0_8px_rgba(186,220,255,0.42)]'
                : 'filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            <svg
              viewBox="0 0 54 84"
              className="w-[70px] sm:w-[74px] h-[108px] sm:h-[114px] overflow-visible select-none"
            >
              <defs>
                <linearGradient id={`gusset-grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f5fafc" />
                  <stop offset="28%" stopColor="#c9d9e0" />
                  <stop offset="100%" stopColor="#718697" />
                </linearGradient>
                <linearGradient id={`bag-front-grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="48%" stopColor="#fbfdfe" />
                  <stop offset="84%" stopColor="#edf3f6" />
                  <stop offset="100%" stopColor="#d2dfe5" />
                </linearGradient>
                <linearGradient id={`bag-window-grad-${idx}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8d9ca7" />
                  <stop offset="42%" stopColor="#c7d0d6" />
                  <stop offset="100%" stopColor="#8998a3" />
                </linearGradient>
                <linearGradient id={`bag-fold-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.78" />
                  <stop offset="100%" stopColor="#b9c9d1" stopOpacity="0.18" />
                </linearGradient>
                <linearGradient id={`bag-band-grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={cDef.shadeHex || cDef.hex} />
                  <stop offset="48%" stopColor={cDef.hex} />
                  <stop offset="100%" stopColor={cDef.shadeHex || cDef.hex} />
                </linearGradient>
              </defs>

              {/* Rear handles */}
              <path
                d="M 17 22 C 16 1, 26 1, 25 22 M 29 22 C 28 1, 38 1, 37 22"
                stroke="#778b9a"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 17 21 C 16.5 4, 25.5 4, 25 21 M 29 21 C 28.5 4, 37.5 4, 37 21"
                stroke="#f8fcff"
                strokeWidth="0.9"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              />

              <g transform="translate(4 0) scale(0.85 1)">
              {/* 2. 3D Side Gusset (Depth Perspective) */}
              <polygon
                points="40,21 48,16 48,68 40,75"
                fill={`url(#gusset-grad-${idx})`}
                stroke="#8497a3"
                strokeWidth="0.6"
              />
              <path d="M 42 23 L 42 71" stroke="#ffffff" strokeWidth="0.7" opacity="0.42" />
              <path d="M 46.8 18 L 46.8 68" stroke="#526777" strokeWidth="0.65" opacity="0.32" />
              <polygon points="40,21 48,16 48,20 40,25" fill="#f5fafc" opacity="0.78" />
              {/* Side Bottom Darker Color Band */}
              <polygon
                points="40,59 48,53 48,68 40,75"
                fill={cDef.shadeHex || cDef.hex}
              />
              <path d="M 40 59 L 48 53" stroke="#ffffff" strokeWidth="0.7" opacity="0.55" />

              {/* 3. Front Face Pure White Bag Body */}
              <rect
                x="8"
                y="21"
                width="32"
                height="54"
                rx="1"
                fill={`url(#bag-front-grad-${idx})`}
                stroke="#d6e5ec"
                strokeWidth="0.8"
              />
              <path d="M 9 22 H 39" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
              <path d="M 9 23 H 39" stroke="#aebfc8" strokeWidth="0.55" opacity="0.7" />
              <path d="M 10 25 L 10 57" stroke="#ffffff" strokeWidth="0.65" opacity="0.45" />
              <path d="M 38.5 24 L 38.5 57" stroke="#a8b8c1" strokeWidth="0.75" opacity="0.55" />

              {/* Front Bottom Vibrant Color Band */}
              <rect
                x="8"
                y="59"
                width="32"
                height="16"
                rx="1"
                fill={`url(#bag-band-grad-${idx})`}
              />
              <path d="M 9 60 H 39" stroke="#fff8" strokeWidth="0.8" />
              <path d="M 9 73 Q 24 75 39 73" stroke={cDef.shadeHex || cDef.hex} strokeWidth="0.8" opacity="0.72" fill="none" />
              <polygon points="8,69 13,71 13,75 8,75" fill={cDef.shadeHex || cDef.hex} opacity="0.52" />

              {/* Recessed window bezel and frosted glass */}
              <rect x="13" y="26" width="22" height="40" rx="5" fill="#d4e0e6" opacity="0.7" />
              <rect
                x="14"
                y="27"
                width="20"
                height="38"
                rx="4.5"
                fill="#eaf4f8"
                stroke={cDef.hex}
                strokeWidth="1.8"
              />
              <rect
                x="15.4"
                y="28.5"
                width="17.2"
                height="35"
                rx="3.4"
                fill={`url(#bag-window-grad-${idx})`}
                stroke="#ffffff"
                strokeWidth="0.55"
              />

              {/* Broad glass reflection and fine highlight */}
              <path d="M 17 30 L 20 30 L 28 59 L 24.5 59 Z" fill="url(#bag-fold-grad-${idx})" opacity="0.42" />
              <path
                d="M 17.5 31 L 24 57"
                stroke="#ffffff"
                strokeWidth="0.9"
                strokeLinecap="round"
                opacity="0.62"
              />
              <path d="M 31 31 L 31 56" stroke="#ffffff" strokeWidth="0.55" opacity="0.55" />

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
              </g>

              {/* Front handle eyelets */}
              {[17, 25, 29, 37].map((x) => (
                <g key={`eyelet-${x}`}>
                  <circle cx={x} cy="21" r="1.65" fill="#8293a0" />
                  <circle cx={x} cy="20.7" r="0.78" fill="#f8fcff" />
                </g>
              ))}
              {/* Front double rope handles */}
              <path
                d="M 17 21 C 16 0, 26 0, 25 21 M 29 21 C 28 0, 38 0, 37 21"
                stroke="#657987"
                strokeWidth="2.0"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 17 20 C 16.5 3, 25.5 3, 25 20 M 29 20 C 28.5 3, 37.5 3, 37 20"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.96"
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
              className="w-[70px] sm:w-[74px] h-[108px] sm:h-[114px] overflow-visible select-none"
        >
          <defs>
            <linearGradient id="bonus-gusset-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f5fafc" />
              <stop offset="28%" stopColor="#c9d9e0" />
              <stop offset="100%" stopColor="#718697" />
            </linearGradient>
            <linearGradient id="bonus-front-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="48%" stopColor="#f6fafc" />
              <stop offset="84%" stopColor="#e8eef2" />
              <stop offset="100%" stopColor="#cbd8df" />
            </linearGradient>
            <linearGradient id="bonus-window-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7f8d98" />
              <stop offset="48%" stopColor="#b8c2c9" />
              <stop offset="100%" stopColor="#7b8994" />
            </linearGradient>
          </defs>

          {/* Rear handles */}
          <path
            d="M 17 22 C 16 1, 26 1, 25 22 M 29 22 C 28 1, 38 1, 37 22"
            stroke="#778b9a"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M 17 21 C 16.5 4, 25.5 4, 25 21 M 29 21 C 28.5 4, 37.5 4, 37 21" stroke="#f8fcff" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.9" />

          <g transform="translate(4 0) scale(0.85 1)">
          {/* 3D Side Gusset */}
          <polygon
            points="40,21 48,16 48,68 40,75"
            fill="url(#bonus-gusset-grad)"
            stroke="#8497a3"
            strokeWidth="0.6"
          />
          <path d="M 42 23 L 42 71" stroke="#ffffff" strokeWidth="0.7" opacity="0.42" />
          <path d="M 46.8 18 L 46.8 68" stroke="#526777" strokeWidth="0.65" opacity="0.32" />
          <polygon points="40,21 48,16 48,20 40,25" fill="#f5fafc" opacity="0.78" />
          <polygon
            points="40,59 48,53 48,68 40,75"
            fill="#64748b"
          />
          <path d="M 40 59 L 48 53" stroke="#ffffff" strokeWidth="0.7" opacity="0.55" />

          {/* Front Face Light Gray Paper */}
          <rect
            x="8"
            y="21"
            width="32"
            height="54"
            rx="1"
            fill="url(#bonus-front-grad)"
            stroke="#cbd5e1"
            strokeWidth="0.8"
          />
          <path d="M 9 22 H 39" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
          <path d="M 9 23 H 39" stroke="#aebfc8" strokeWidth="0.55" opacity="0.7" />
          <path d="M 10 25 L 10 57" stroke="#ffffff" strokeWidth="0.65" opacity="0.45" />
          <path d="M 38.5 24 L 38.5 57" stroke="#a8b8c1" strokeWidth="0.75" opacity="0.55" />

          {/* Bottom Gray Band */}
          <rect
            x="8"
            y="59"
            width="32"
            height="16"
            rx="1"
            fill="#94a3b8"
          />
          <path d="M 9 60 H 39" stroke="#ffffff" strokeWidth="0.8" opacity="0.72" />
          <path d="M 9 73 Q 24 75 39 73" stroke="#64748b" strokeWidth="0.8" opacity="0.72" fill="none" />
          <polygon points="8,69 13,71 13,75 8,75" fill="#64748b" opacity="0.5" />

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
          <rect x="15.4" y="28.5" width="17.2" height="35" rx="3.4" fill="url(#bonus-window-grad)" stroke="#ffffff" strokeWidth="0.55" />
          <path d="M 17 30 L 20 30 L 28 59 L 24.5 59 Z" fill="#ffffff" opacity="0.18" />
          <path d="M 17.5 31 L 24 57" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.62" />
          <path d="M 31 31 L 31 56" stroke="#ffffff" strokeWidth="0.55" opacity="0.55" />

          {/* 3D Video Camera Icon inside Window */}
          <g>
            {/* White Camera Body */}
            <rect x="19.5" y="42" width="9" height="8" rx="1.5" fill="#ffffff" />
            {/* Camera Lens Cone */}
            <polygon points="29,43.5 33,41 33,51 29,48.5" fill="#ffffff" />
            {/* Cyan Play Triangle */}
            <polygon points="23,43.5 26.5,46 23,48.5" fill="#0284c7" />
          </g>
          </g>

          {/* Front handle eyelets and double handles */}
          {[17, 25, 29, 37].map((x) => (
            <g key={`bonus-eyelet-${x}`}>
              <circle cx={x} cy="21" r="1.65" fill="#8293a0" />
              <circle cx={x} cy="20.7" r="0.78" fill="#f8fcff" />
            </g>
          ))}
          <path
            d="M 17 21 C 16 0, 26 0, 25 21 M 29 21 C 28 0, 38 0, 37 21"
            stroke="#657987"
            strokeWidth="2.0"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M 17 20 C 16.5 3, 25.5 3, 25 20 M 29 20 C 28.5 3, 37.5 3, 37 20" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.96" />
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
