import { Bag, Bottle, ColorKey } from '../types/game';

export function isCompleteBottle(b: Bottle): boolean {
  if (!b || b.removed) return false;
  const cap = b.maxCap || 4;
  return (
    b.special === 'none' &&
    (!b.mysteryCount || b.mysteryCount === 0) &&
    b.layers.length === cap &&
    b.layers.every((c) => c === b.layers[0])
  );
}

export function canSelectBottle(b: Bottle | undefined, showToast?: (msg: string) => void): boolean {
  if (!b || b.removed || b.corked) return false;
  if (b.frozenTurns && b.frozenTurns > 0) {
    showToast?.(`🧊 再倒水 ${b.frozenTurns} 步解封`);
    return false;
  }
  if (b.isGiantCat) {
    showToast?.('🐱 请把目标秘药倒入大猫瓶');
    return false;
  }
  if (b.special === 'one_way_in') {
    showToast?.('⏬ 漏斗瓶：只进不出');
    return false;
  }
  if (b.special === 'silk_drape' || b.special === 'full_ice' || b.special === 'paper_bag') {
    const leftBags = b.unlockOrder || 1;
    showToast?.(`🔒 再装满 ${leftBags} 瓶自动解锁`);
    return false;
  }
  if (b.special === 'ice_base') {
    const leftCnt = b.poursToBreak || 1;
    showToast?.(`❄️ 同色合并 ${leftCnt} 次破冰（可接水）`);
    return false;
  }
  if (b.special === 'stone_base') {
    const leftCnt = b.poursToBreak || 1;
    showToast?.(`🔒 同色合并 ${leftCnt} 次解锁（可接水）`);
    return false;
  }
  if (b.special === 'ad_cam' || b.special === 'ad_cam_blue') return false;
  if (b.layers.length === 0 || isCompleteBottle(b)) return false;
  return true;
}

export function canSelectBottleNoToast(b: Bottle | undefined): boolean {
  if (!b || b.removed || b.corked) return false;
  if (b.frozenTurns && b.frozenTurns > 0) return false;
  if (b.isGiantCat) return false;
  if (
    [
      'silk_drape',
      'full_ice',
      'paper_bag',
      'ice_base',
      'stone_base',
      'one_way_in',
      'ad_cam',
      'ad_cam_blue',
    ].includes(b.special)
  ) {
    return false;
  }
  if (b.layers.length === 0 || isCompleteBottle(b)) return false;
  return true;
}

export function canPourInto(src: Bottle, dst: Bottle): boolean {
  if (!src || !dst || src.removed || dst.removed || src.corked || dst.corked) return false;
  if ((src.frozenTurns && src.frozenTurns > 0) || (dst.frozenTurns && dst.frozenTurns > 0)) return false;
  const openMouthSpecials = ['none', 'ice_base', 'stone_base', 'one_way_in', 'color_lock'];
  if (!openMouthSpecials.includes(dst.special)) return false;
  const dstCap = dst.maxCap || 4;
  if (dst.layers.length >= dstCap || src.layers.length === 0) return false;
  const pourColor = src.layers[src.layers.length - 1];
  if (dst.special === 'color_lock' && dst.requiredColor && pourColor !== dst.requiredColor) {
    return false;
  }
  if (dst.layers.length === 0) return true;
  return pourColor === dst.layers[dst.layers.length - 1];
}

/**
 * 当某种颜色的所有药水已集满封存后，自动解除场上剩余空色环瓶的限制，防止卡死
 */
export function releaseObsoleteColorLocks(bottles: Bottle[]): void {
  bottles.forEach((b) => {
    if (!b || b.removed || b.corked || b.special !== 'color_lock' || !b.requiredColor) return;
    const reqC = b.requiredColor;
    let remainingLayersOfReq = 0;
    bottles.forEach((other) => {
      if (!other || other.removed || other.corked) return;
      remainingLayersOfReq += other.layers.filter((c) => c === reqC).length;
    });
    if (remainingLayersOfReq === 0) {
      b.special = 'none';
      b.requiredColor = null;
    }
  });
}

export function getPourableCount(src: Bottle, dst: Bottle): number {
  if (!canPourInto(src, dst)) return 0;
  const color = src.layers[src.layers.length - 1];
  const srcRevealedStart = src.mysteryCount || 0;
  let sameColorCount = 0;
  const dstCap = dst.maxCap || 4;

  for (let i = src.layers.length - 1; i >= srcRevealedStart; i--) {
    if (src.layers[i] === color && dst.layers.length + sameColorCount < dstCap) {
      sameColorCount++;
    } else {
      break;
    }
  }
  return sameColorCount;
}

export function pickNextNeededBagColor(bottles: Bottle[], bags: Bag[]): ColorKey {
  const activeBagColors = bags.filter((b) => !b.locked && b.color).map((b) => b.color);
  const remainingColors: ColorKey[] = [];
  bottles.forEach((b) => {
    if (b.removed) return;
    b.layers.forEach((c) => {
      if (c && c !== 'mystery_dark' && !remainingColors.includes(c)) {
        remainingColors.push(c);
      }
    });
  });
  return remainingColors.find((c) => !activeBagColors.includes(c)) || remainingColors[0] || 'red';
}

export function checkGameWon(bottles: Bottle[], wasGiantCat?: boolean): boolean {
  if (wasGiantCat) return true;
  return bottles.every((b) => b.corked || b.removed || b.layers.length === 0);
}

/**
 * 启发式智能寻路算法：快速找出当前盘面最具有推进价值的倒水方案（V9 极值加权与导流）
 */
export function findBestPourMove(bottles: Bottle[], bags?: Bag[]): { srcIdx: number; dstIdx: number } | null {
  let bestMove: { srcIdx: number; dstIdx: number } | null = null;
  let bestScore = -1e9;

  for (let i = 0; i < bottles.length; i++) {
    const src = bottles[i];
    if (!canSelectBottleNoToast(src)) continue;
    const pourCol = src.layers[src.layers.length - 1];
    const srcRevealedStart = src.mysteryCount || 0;
    let srcTopSame = 0;
    for (let k = src.layers.length - 1; k >= srcRevealedStart; k--) {
      if (src.layers[k] === pourCol) srcTopSame++;
      else break;
    }
    const isSrcPure = srcRevealedStart === 0 && srcTopSame === src.layers.length;

    for (let j = 0; j < bottles.length; j++) {
      if (i === j) continue;
      const dst = bottles[j];
      if (!canPourInto(src, dst)) continue;

      const dstCap = dst.maxCap || 4;
      const freeSpace = dstCap - dst.layers.length;

      // 避免把纯色瓶倒入同尺寸空瓶做无意义搬家（但高低异形关中，将纯色水倒入恰好匹配其层数的空瓶可直接满瓶落塞！）
      const isExactFitEmpty = dst.layers.length === 0 && dstCap === src.layers.length && dstCap !== (src.maxCap || 4);
      if (dst.layers.length === 0 && isSrcPure && dst.special !== 'color_lock' && dstCap <= (src.maxCap || 4) && !isExactFitEmpty) {
        continue;
      }
      // 避免将未凑齐的杂色误倒入单向漏斗瓶
      if (dst.special === 'one_way_in' && dst.layers.length === 0 && srcTopSame < dstCap) {
        continue;
      }

      let score = 0;
      const matchesOpenBag = bags && bags.some((bg) => bg && !bg.locked && bg.color === pourCol && (!bg.packedBottle || bg.packedBottle === ''));
      if (matchesOpenBag) score += 68;
      if (dst.special === 'ice_base' || dst.special === 'stone_base') score += 65;
      if (dst.special === 'color_lock' && dst.requiredColor === pourCol) score += 75;
      if (dst.special === 'one_way_in') score += 55;

      if (dst.layers.length > 0) {
        score += 100;
        // 一次性转移全部同色
        if (freeSpace >= srcTopSame) score += 50;
        // 凑满封瓶
        if (dst.layers.length + Math.min(freeSpace, srcTopSame) === dstCap) score += 80;
        // 揭开盲盒
        if (src.mysteryCount && src.mysteryCount > 0 && src.layers.length - Math.min(freeSpace, srcTopSame) <= src.mysteryCount) {
          score += 70;
        }
        // 排空单向古瓶或解除流沙
        if (src.special === 'one_way_out' && srcTopSame <= freeSpace && src.layers.length === srcTopSame) {
          score += 90;
        }
      } else {
        // 目标为空瓶：精准满塞给予最高优先级 +220 分！
        score += isExactFitEmpty ? 220 : 25;
        if (src.mysteryCount && src.mysteryCount > 0 && src.layers.length - srcTopSame <= src.mysteryCount) score += 45;
        if (new Set(src.layers).size > 1) score += 20;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = { srcIdx: i, dstIdx: j };
      }
    }
  }
  return bestMove;
}
