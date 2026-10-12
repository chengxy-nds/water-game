import React from 'react';

// Map color IDs to Figma's authentic transparent 2x shopping bag assets
export const COLOR_BAG_MAP: Record<string, string> = {
  red: '/assets_figma/bag_red.png',
  blue: '/assets_figma/bag_blue.png',
  yellow: '/assets_figma/bag_yellow.png',
  green: '/assets_figma/bag_green.png',
  purple: '/assets_figma/bag_purple.png',
  orange: '/assets_figma/bag_orange.png',
  pink: '/assets_figma/bag_pink.png',
  cyan: '/assets_figma/bag_cyan.png',
  lime: '/assets_figma/bag_green.png',
  indigo: '/assets_figma/bag_purple.png',
  emerald: '/assets_figma/bag_green.png',
  amber: '/assets_figma/bag_yellow.png',
};

// 拟态可爱卡通手部 SVG 组件：自上方伸出，指节自然扣紧购物袋纸绳把手
const HandGrabber: React.FC = () => (
  <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-50 anim-hand-grab filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 休闲天蓝色短袖口 */}
      <rect x="20" y="0" width="16" height="8" rx="3" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
      {/* 露出手腕 */}
      <path d="M22 7 L34 7 L35 18 L21 18 Z" fill="#FDE68A" />
      {/* 手背与掌部 */}
      <path
        d="M18 16 C18 12 38 12 38 16 C41 22 40 28 36 32 C32 35 24 35 20 32 C17 28 17 22 18 16 Z"
        fill="#FDE68A"
        stroke="#D97706"
        strokeWidth="1"
      />
      {/* 4 个可爱的抓提手弯曲手指，自然扣在提手绳上 */}
      <circle cx="21" cy="30" r="4" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
      <circle cx="26" cy="32" r="4.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
      <circle cx="31" cy="31" r="4.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
      <circle cx="36" cy="29" r="3.8" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
      {/* 指腹高光 */}
      <ellipse cx="21" cy="31" rx="1.5" ry="1" fill="#FEF3C7" opacity="0.8" />
      <ellipse cx="26" cy="33" rx="1.6" ry="1.1" fill="#FEF3C7" opacity="0.8" />
      <ellipse cx="31" cy="32" rx="1.6" ry="1.1" fill="#FEF3C7" opacity="0.8" />
      <ellipse cx="36" cy="30" rx="1.4" ry="0.9" fill="#FEF3C7" opacity="0.8" />
      {/* 大拇指侧面扣压 */}
      <path
        d="M16 23 C14 25 15 29 19 30 C21 30 22 28 21 25 C20 23 18 22 16 23 Z"
        fill="#FDE68A"
        stroke="#D97706"
        strokeWidth="0.8"
      />
    </svg>
  </div>
);

export interface ShoppingBagsProps {
  // 左侧最多 3 个当前正在展示的颜色（null 表示已收集完毕且无后续补充）
  activeBagColors: (string | null)[];
  // 当前正在被手拎走的槽位索引 (0, 1, 2)
  liftingSlotIndex?: number | null;
  // 当前正在从上方掉落弹入补位的槽位索引 (0, 1, 2)
  replenishingSlotIndex?: number | null;
  // 正在吞咽的颜色 ID
  activeGulpColor?: string | null;
  // 全部已收集的颜色集合
  collectedColors?: Set<string>;
  // 右侧看视频解锁加瓶
  onUnlockBonus?: () => void;
  bonusUnlocked?: boolean;
  // 看视频解锁出的第 4 个购物袋颜色 (null 时展示无色摄像机袋)
  unlockedBonusColor?: string | null;
}

export const ShoppingBags: React.FC<ShoppingBagsProps> = ({
  activeBagColors,
  liftingSlotIndex = null,
  replenishingSlotIndex = null,
  activeGulpColor = null,
  collectedColors = new Set(),
  onUnlockBonus,
  bonusUnlocked = false,
  unlockedBonusColor = null,
}) => {
  // 固定 3 个左侧槽位
  const slots = [0, 1, 2];

  // 第 4 个槽位颜色（如果看视频解锁了，则为解锁颜色）
  const bonusBagImg = unlockedBonusColor
    ? COLOR_BAG_MAP[unlockedBonusColor] || '/assets_figma/bag_yellow.png'
    : '/assets_figma/bag_camera.png';

  const isBonusGulping = !!unlockedBonusColor && activeGulpColor === unlockedBonusColor;
  const isBonusDone = !!unlockedBonusColor && collectedColors.has(unlockedBonusColor);
  const isBonusLifting = liftingSlotIndex === 3;

  return (
    <div
      id="shopping-bags-container"
      className="w-full max-w-[370px] mx-auto flex items-center justify-center gap-2 sm:gap-2.5 px-3 py-1 select-none"
    >
      {/* 左边 3 个颜色目标购物袋 */}
      {slots.map((slotIdx) => {
        const colorId = activeBagColors[slotIdx];
        const isLifting = liftingSlotIndex === slotIdx;
        const isReplenishing = replenishingSlotIndex === slotIdx;
        const isGulping = !!colorId && activeGulpColor === colorId;
        const isDone = !!colorId && collectedColors.has(colorId);

        // 如果该槽位已经空了（且不在拎走动画中）
        if (!colorId && !isLifting) {
          return (
            <div
              key={`bag-empty-slot-${slotIdx}`}
              className="relative flex flex-col items-center justify-center w-[68px] sm:w-[74px] h-[132px] sm:h-[144px]"
            >
              <div className="w-12 h-16 rounded-xl border border-sky-400/20 bg-sky-900/10 flex items-center justify-center">
                <span className="text-sky-300/30 text-lg">✦</span>
              </div>
            </div>
          );
        }

        const bagImg = colorId ? (COLOR_BAG_MAP[colorId] || '/assets_figma/bag_yellow.png') : '/assets_figma/bag_yellow.png';

        return (
          <div
            key={`bag-slot-${slotIdx}-${colorId || 'none'}`}
            id={colorId ? `shopping-bag-${colorId}` : undefined}
            data-slot={slotIdx}
            className={`relative flex flex-col items-center transition-all ${
              isLifting
                ? 'anim-bag-lift-away z-50 pointer-events-none'
                : isReplenishing
                ? 'anim-bag-drop-in z-30'
                : isGulping
                ? 'anim-bag-gulp z-40'
                : isDone
                ? 'filter drop-shadow-[0_0_12px_rgba(186,220,255,0.65)]'
                : 'filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]'
            }`}
          >
            {/* 当该袋子被手拎走时，手部伸出抓握提手 */}
            {isLifting && <HandGrabber />}

            <div className="relative w-[68px] sm:w-[74px] h-[132px] sm:h-[144px]">
              <img
                src={bagImg}
                alt={`购物袋-${colorId}`}
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />

              {/* 完成闪烁星星 */}
              {isDone && !isLifting && (
                <div className="absolute top-1 -right-1 w-5 h-5 anim-twinkle pointer-events-none">
                  <img
                    src="/assets_figma/deco_star.png"
                    alt="完成"
                    className="w-full h-full object-contain drop-shadow-[0_0_6px_#fde047]"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 右侧第 4 个：看视频解锁袋（未解锁为无色摄像机袋；解锁后化身真实目标颜色购物袋） */}
      <div
        id={unlockedBonusColor ? `shopping-bag-${unlockedBonusColor}` : 'shopping-bag-bonus'}
        data-slot={3}
        className={`relative flex flex-col items-center transition-all ${
          !bonusUnlocked ? 'cursor-pointer active:scale-95' : ''
        } ${
          isBonusLifting
            ? 'anim-bag-lift-away z-50 pointer-events-none'
            : isBonusGulping
            ? 'anim-bag-gulp z-40'
            : isBonusDone
            ? 'filter drop-shadow-[0_0_12px_rgba(186,220,255,0.65)]'
            : bonusUnlocked
            ? 'filter drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]'
            : 'filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]'
        }`}
        onClick={!bonusUnlocked ? onUnlockBonus : undefined}
        title={!bonusUnlocked ? '看视频解锁颜色与空瓶' : `已解锁: ${unlockedBonusColor || '奖励袋'}`}
      >
        {isBonusLifting && <HandGrabber />}

        <div className="relative w-[68px] sm:w-[74px] h-[132px] sm:h-[144px]">
          <img
            src={bonusBagImg}
            alt={unlockedBonusColor ? `已解锁购物袋-${unlockedBonusColor}` : '看视频解锁购物袋'}
            className={`w-full h-full object-contain pointer-events-none ${
              bonusUnlocked && unlockedBonusColor ? 'anim-bag-drop-in' : ''
            }`}
            draggable={false}
          />

          {/* 解锁标记徽章 */}
          {bonusUnlocked && (
            <span className="absolute top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow-md anim-twinkle">
              ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
