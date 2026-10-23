// ============================================================================
// 06_game_state_logic.js: 纯数据驱动的游戏核心状态机与倒水判定逻辑
// ============================================================================

class GameState {
  constructor(audioManager, particlePool) {
    this.audio = audioManager;
    this.particles = particlePool;

    this.levelId = 1;
    this.cfg = null;
    this.bottles = [];
    this.bags = [];
    this.packedTotal = 0;
    this.remainingMoves = null;

    this.selectedIndex = null;
    this.activeHintPair = null;
    this.moveHistory = [];

    this.shuffleUses = 3;
    this.undoUses = 5;
    this.hintUses = 3;
    this.addBottleUses = 2;

    this.isAnimating = false;
    this.pourAnim = null; // { srcIdx, dstIdx, startMs, durMs, color, count, srcX, srcY, dstX, dstY }
    this.toastMsg = '';
    this.toastAlpha = 0;
  }

  showToast(msg) {
    this.toastMsg = msg;
    this.toastAlpha = 1.0;
  }

  cloneState() {
    return JSON.stringify({
      bottles: this.bottles,
      bags: this.bags,
      packedTotal: this.packedTotal,
      remainingMoves: this.remainingMoves
    });
  }

  loadLevel(lv) {
    this.levelId = lv;
    this.cfg = getLevelConfig(lv);
    this.bottles = this.cfg.createBottles();
    this.bags = this.cfg.bags ? this.cfg.bags.map(b => Object.assign({}, b)) : [];
    this.packedTotal = 0;
    this.remainingMoves = this.cfg.stepLimit;
    this.selectedIndex = null;
    this.activeHintPair = null;
    this.moveHistory = [];
    this.isAnimating = false;
    this.pourAnim = null;
  }

  canSelectBottle(b, idx) {
    if (!b || b.removed || b.corked) return false;
    if (b.frozenTurns && b.frozenTurns > 0) {
      this.showToast(`🧊 瓶口冰封，还需 ${b.frozenTurns} 步`);
      return false;
    }
    if (b.special === 'one_way_in') {
      this.showToast('⏬ 漏斗瓶：只进不出');
      return false;
    }
    if (b.layers.length === 0 || this.isCompleteBottle(b)) {
      return false;
    }
    return true;
  }

  canPourInto(src, dst) {
    if (!src || !dst || src.removed || dst.removed || src.corked || dst.corked) return false;
    if ((src.frozenTurns && src.frozenTurns > 0) || (dst.frozenTurns && dst.frozenTurns > 0)) return false;
    if (dst.special === 'one_way_out') return false;
    const dstCap = dst.maxCap || 4;
    if (dst.layers.length >= dstCap || src.layers.length === 0) return false;

    const pourColor = src.layers[src.layers.length - 1];
    if (dst.special === 'color_lock' && dst.requiredColor && pourColor !== dst.requiredColor) {
      return false;
    }
    if (dst.layers.length === 0) return true;
    return pourColor === dst.layers[dst.layers.length - 1];
  }

  isCompleteBottle(b) {
    if (!b || b.layers.length === 0) return false;
    const cap = b.maxCap || 4;
    return b.layers.length === cap && b.layers.every(c => c === b.layers[0]);
  }

  findBestPourMove() {
    let bestMove = null;
    let bestScore = -1e9;

    for (let i = 0; i < this.bottles.length; i++) {
      const src = this.bottles[i];
      if (!this.canSelectBottle(src, i)) continue;
      const pourCol = src.layers[src.layers.length - 1];

      for (let j = 0; j < this.bottles.length; j++) {
        if (i === j) continue;
        const dst = this.bottles[j];
        if (!this.canPourInto(src, dst)) continue;

        const dstCap = dst.maxCap || 4;
        const freeSpace = dstCap - dst.layers.length;
        let score = 0;

        if (dst.layers.length > 0) {
          score += 100;
          if (dst.layers.length + 1 === dstCap) score += 60;
        } else {
          score += 20;
        }
        if (dst.special === 'ice_base' || dst.special === 'stone_base') score += 50;

        if (score > bestScore) {
          bestScore = score;
          bestMove = { srcIdx: i, dstIdx: j };
        }
      }
    }
    return bestMove;
  }

  handleBottleClick(idx, bottleCoords) {
    if (this.isAnimating) return;
    const clicked = this.bottles[idx];
    if (!clicked || clicked.removed || clicked.corked) return;

    if (this.selectedIndex === null) {
      if (this.canSelectBottle(clicked, idx)) {
        this.selectedIndex = idx;
        this.audio.playSound('select');
      }
      return;
    }

    if (this.selectedIndex === idx) {
      this.selectedIndex = null;
      this.audio.playSound('deselect');
      return;
    }

    const src = this.bottles[this.selectedIndex];
    const dst = clicked;

    if (this.canPourInto(src, dst)) {
      this.startPour(this.selectedIndex, idx, bottleCoords);
    } else {
      if (this.canSelectBottle(dst, idx)) {
        this.selectedIndex = idx;
        this.audio.playSound('select');
      } else {
        this.selectedIndex = null;
        this.audio.playSound('deselect');
      }
    }
  }

  startPour(srcIdx, dstIdx, bottleCoords) {
    this.isAnimating = true;
    this.moveHistory.push(this.cloneState());

    if (this.remainingMoves !== null) {
      this.remainingMoves = Math.max(0, this.remainingMoves - 1);
    }

    const src = this.bottles[srcIdx];
    const dst = this.bottles[dstIdx];
    const pourCol = src.layers[src.layers.length - 1];
    const dstCap = dst.maxCap || 4;

    let moveCount = 0;
    while (src.layers.length > 0 && src.layers[src.layers.length - 1] === pourCol && dst.layers.length + moveCount < dstCap) {
      src.layers.pop();
      moveCount++;
    }

    const srcBox = bottleCoords[srcIdx];
    const dstBox = bottleCoords[dstIdx];

    this.pourAnim = {
      srcIdx,
      dstIdx,
      startMs: Date.now(),
      durMs: 650,
      color: COLORS[pourCol] || COLORS.blue,
      pourColKey: pourCol,
      moveCount,
      srcX: srcBox.x,
      srcY: srcBox.y,
      dstX: dstBox.x,
      dstY: dstBox.y,
      pourProgress: 0
    };

    this.audio.playSound('pour');
    this.selectedIndex = null;
  }

  finishPour(onWinCallback, onFailCallback) {
    if (!this.pourAnim) return;
    const { dstIdx, pourColKey, moveCount } = this.pourAnim;
    const dst = this.bottles[dstIdx];

    for (let k = 0; k < moveCount; k++) {
      dst.layers.push(pourColKey);
    }

    // 检查破冰或石座
    if ((dst.special === 'ice_base' || dst.special === 'stone_base') && dst.poursToBreak > 0) {
      dst.poursToBreak--;
      if (dst.poursToBreak <= 0) {
        this.audio.playSound(dst.special === 'ice_base' ? 'ice_break' : 'stone_break');
        dst.special = 'none';
        this.showToast('✨ 底座封印已解除！');
      }
    }

    // 检查满瓶封存
    if (this.isCompleteBottle(dst)) {
      dst.corked = true;
      dst.corkAnimProgress = 1.0;
      this.audio.playSound('cork_slam');
      this.particles.spawnCorkStars(this.pourAnim.dstX + 35, this.pourAnim.dstY + 10);

      // 匹配盲袋
      this.packBottleIntoBag(pourColKey);
    }

    this.isAnimating = false;
    this.pourAnim = null;

    // 通关或步数耗尽检测
    this.checkGameOutcome(onWinCallback, onFailCallback);
  }

  packBottleIntoBag(colKey) {
    const bag = this.bags.find(b => !b.locked && !b.packedBottle && b.color === colKey);
    if (bag) {
      bag.packedBottle = colKey;
      this.packedTotal++;
      this.showToast(`🎁 成功打包【${(COLORS[colKey] && COLORS[colKey].name) || '秘药'}】礼袋！`);

      // 解锁后续盲袋
      const nextLocked = this.bags.find(b => b.locked);
      if (nextLocked) nextLocked.locked = false;
    }
  }

  checkGameOutcome(onWin, onFail) {
    const isAllPacked = this.bags.length > 0 && this.bags.every(b => b.packedBottle);
    const isAllCorked = this.bottles.every(b => b.corked || b.layers.length === 0);

    if (isAllPacked || isAllCorked) {
      this.audio.playSound('win');
      if (onWin) onWin();
      return;
    }

    if (this.remainingMoves !== null && this.remainingMoves <= 0) {
      if (onFail) onFail();
    }
  }

  // 道具 1：撤回
  executeUndo() {
    if (this.isAnimating || this.moveHistory.length === 0) return;
    const snap = JSON.parse(this.moveHistory.pop());
    this.bottles = snap.bottles;
    this.bags = snap.bags;
    this.packedTotal = snap.packedTotal;
    this.remainingMoves = snap.remainingMoves;
    this.selectedIndex = null;
    this.activeHintPair = null;
    this.audio.playSound('btn_undo');
    this.showToast('↶ 已撤回上一步');
  }

  // 道具 2：打乱
  executeShuffle() {
    if (this.isAnimating) return;
    const pool = [];
    const targets = [];
    this.bottles.forEach(b => {
      if (!b.corked && b.layers.length > 0) {
        while (b.layers.length > 0) pool.push(b.layers.pop());
        targets.push(b);
      }
    });

    if (pool.length === 0) return;
    // 随机洗牌
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
    this.audio.playSound('btn_shuffle');
    this.showToast('🔀 盘面剩余药水已打乱重排');
  }

  // 道具 3：提示
  executeHint() {
    if (this.isAnimating) return;
    const move = this.findBestPourMove();
    if (move) {
      this.activeHintPair = move;
      this.selectedIndex = move.srcIdx;
      this.audio.playSound('btn_hint');
      this.showToast('💡 提示：将 ①号瓶 倒入 ②号瓶');
    } else {
      this.showToast('💡 当前无路可走，请点击【打乱】或【撤回】');
    }
  }

  // 道具 4：增加空瓶
  executeAddBottle() {
    if (this.isAnimating) return;
    const newId = this.bottles.length;
    this.bottles.push({
      id: newId,
      maxCap: 4,
      layers: [],
      special: 'none',
      corked: false,
      removed: false
    });
    this.audio.playSound('btn_tap');
    this.showToast('🍾 已为您免费增加 +1 空试管！');
  }
}
