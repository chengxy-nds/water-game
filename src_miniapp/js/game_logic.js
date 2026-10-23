/**
 * 游戏核心状态机与规则逻辑 (GameLogic.js)
 * 纯数据模型驱动，零 DOM 依赖
 */

class GameLogic {
  constructor(levelsModule, platformModule) {
    this.levels = levelsModule;
    this.platform = platformModule;

    this.currentLevel = 162;
    this.bottles = [];
    this.bags = [];
    this.packedTotal = 0;
    this.remainingMoves = null;

    this.selectedIndex = null;
    this.activeHintPair = null;
    this.history = [];

    this.shuffleCount = 3;
    this.undoCount = 5;
    this.hintCount = 3;

    this.isAnimating = false;
    this.isVictory = false;
    this.isGameOver = false;
  }

  loadLevel(lv) {
    this.currentLevel = lv;
    const cfg = this.levels.getLevelConfig(lv);
    this.bottles = JSON.parse(JSON.stringify(cfg.bottles));
    this.bags = JSON.parse(JSON.stringify(cfg.bags));
    this.packedTotal = 0;
    this.remainingMoves = cfg.stepLimit;

    this.selectedIndex = null;
    this.activeHintPair = null;
    this.history = [];
    this.isAnimating = false;
    this.isVictory = false;
    this.isGameOver = false;
  }

  restart() {
    this.loadLevel(this.currentLevel);
  }

  cloneState() {
    return JSON.stringify({
      bottles: this.bottles,
      bags: this.bags,
      packedTotal: this.packedTotal,
      remainingMoves: this.remainingMoves
    });
  }

  canSelectBottle(index) {
    if (this.isAnimating || this.isVictory || this.isGameOver) return false;
    const b = this.bottles[index];
    if (!b || b.corked || b.removed) return false;
    if (b.special === 'ad_bottle') return false;
    if (b.layers.length === 0) return false;
    if (this.isComplete(b)) return false;
    return true;
  }

  canPourInto(srcIdx, dstIdx) {
    if (srcIdx === dstIdx) return false;
    const src = this.bottles[srcIdx];
    const dst = this.bottles[dstIdx];
    if (!src || !dst || src.corked || dst.corked || src.removed || dst.removed) return false;
    if (dst.special === 'ad_bottle') return false;

    const dstCap = dst.maxCap || 4;
    if (dst.layers.length >= dstCap || src.layers.length === 0) return false;

    const pourCol = src.layers[src.layers.length - 1];
    if (dst.special === 'color_lock' && dst.requiredColor && dst.requiredColor !== pourCol) {
      return false;
    }

    if (dst.layers.length === 0) return true;
    return dst.layers[dst.layers.length - 1] === pourCol;
  }

  isComplete(b) {
    if (!b || b.layers.length === 0) return false;
    const cap = b.maxCap || 4;
    return b.layers.length === cap && b.layers.every(c => c === b.layers[0]);
  }

  handleBottleTap(index) {
    if (this.isAnimating || this.isVictory || this.isGameOver) return null;
    const b = this.bottles[index];
    if (!b) return null;

    // 点击广告试管，解锁成为普通试管
    if (b.special === 'ad_bottle') {
      this.history.push(this.cloneState());
      b.special = 'none';
      return { type: 'UNLOCK_AD', index };
    }

    // 尚未选中任何试管
    if (this.selectedIndex === null) {
      if (this.canSelectBottle(index)) {
        this.selectedIndex = index;
        this.activeHintPair = null;
        return { type: 'SELECT', index };
      }
      return null;
    }

    // 再次点击同一支试管，放下取消选择
    if (this.selectedIndex === index) {
      this.selectedIndex = null;
      return { type: 'DESELECT', index };
    }

    // 尝试倒水
    const srcIdx = this.selectedIndex;
    if (this.canPourInto(srcIdx, index)) {
      const src = this.bottles[srcIdx];
      const dst = this.bottles[index];
      const pourCol = src.layers[src.layers.length - 1];
      const dstCap = dst.maxCap || 4;

      let count = 0;
      for (let k = src.layers.length - 1; k >= 0; k--) {
        if (src.layers[k] === pourCol && dst.layers.length + count < dstCap) {
          count++;
        } else {
          break;
        }
      }

      const plan = {
        fromIndex: srcIdx,
        toIndex: index,
        colorKey: pourCol,
        count
      };

      this.selectedIndex = null;
      this.activeHintPair = null;
      return { type: 'POUR', plan };
    }

    // 若无法倒入，但点击的是另一支可选择的试管，直接切换选中
    if (this.canSelectBottle(index)) {
      this.selectedIndex = index;
      return { type: 'SELECT', index };
    }

    this.selectedIndex = null;
    return { type: 'DESELECT' };
  }

  applyPour(plan) {
    this.history.push(this.cloneState());

    if (this.remainingMoves !== null) {
      this.remainingMoves = Math.max(0, this.remainingMoves - 1);
    }

    const src = this.bottles[plan.fromIndex];
    const dst = this.bottles[plan.toIndex];

    for (let i = 0; i < plan.count; i++) {
      src.layers.pop();
      dst.layers.push(plan.colorKey);
    }

    // 揭开源试管问号
    if (src.mysteryCount && src.layers.length <= src.mysteryCount) {
      src.mysteryCount = Math.max(0, src.layers.length - 1);
    }

    // 目标试管震碎冰座或曜石座
    if ((dst.special === 'ice_base' || dst.special === 'stone_base') && dst.poursToBreak > 0) {
      dst.poursToBreak--;
      if (dst.poursToBreak <= 0) {
        dst.special = 'none';
      }
    }

    // 满瓶封存检测
    if (this.isComplete(dst)) {
      dst.corked = true;
      this.packBag(plan.colorKey);
    }

    // 胜利或失败判定
    this.checkStatus();
    return { isVictory: this.isVictory, isGameOver: this.isGameOver };
  }

  packBag(colorKey) {
    const bag = this.bags.find(b => !b.locked && !b.packedBottle && b.color === colorKey);
    if (bag) {
      bag.packedBottle = colorKey;
      this.packedTotal++;

      // 解锁后续盲袋
      const nextLocked = this.bags.find(b => b.locked);
      if (nextLocked) nextLocked.locked = false;
    }
  }

  checkStatus() {
    const allPacked = this.bags.length > 0 && this.bags.every(b => b.packedBottle);
    const allCorked = this.bottles.every(b => b.corked || b.layers.length === 0 || b.special === 'ad_bottle');

    if (allPacked || allCorked) {
      this.isVictory = true;
      return;
    }

    if (this.remainingMoves !== null && this.remainingMoves <= 0) {
      this.isGameOver = true;
    }
  }

  undo() {
    if (this.isAnimating || this.history.length === 0) return false;
    const snap = JSON.parse(this.history.pop());
    this.bottles = snap.bottles;
    this.bags = snap.bags;
    this.packedTotal = snap.packedTotal;
    this.remainingMoves = snap.remainingMoves;
    this.selectedIndex = null;
    this.activeHintPair = null;
    this.isVictory = false;
    this.isGameOver = false;
    return true;
  }

  shuffle() {
    if (this.isAnimating || this.isVictory) return false;
    const pool = [];
    const targets = [];
    this.bottles.forEach(b => {
      if (!b.corked && b.special !== 'ad_bottle' && b.layers.length > 0) {
        while (b.layers.length > 0) pool.push(b.layers.pop());
        targets.push(b);
      }
    });

    if (pool.length === 0) return false;
    this.history.push(this.cloneState());

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }

    let ptr = 0;
    while (pool.length > 0 && targets.length > 0) {
      const b = targets[ptr % targets.length];
      if (b.layers.length < (b.maxCap || 4)) {
        b.layers.push(pool.pop());
      } else {
        targets.splice(ptr % targets.length, 1);
        continue;
      }
      ptr++;
    }

    this.selectedIndex = null;
    return true;
  }

  hint() {
    if (this.isAnimating || this.isVictory) return null;
    for (let i = 0; i < this.bottles.length; i++) {
      if (!this.canSelectBottle(i)) continue;
      for (let j = 0; j < this.bottles.length; j++) {
        if (i === j) continue;
        if (this.canPourInto(i, j)) {
          this.activeHintPair = [i, j];
          this.selectedIndex = i;
          return this.activeHintPair;
        }
      }
    }
    return null;
  }

  addEmptyBottle() {
    const adBottle = this.bottles.find(b => b.special === 'ad_bottle');
    if (adBottle) {
      this.history.push(this.cloneState());
      adBottle.special = 'none';
      return true;
    }
    return false;
  }
}

if (typeof module !== 'undefined') {
  module.exports = GameLogic;
}
