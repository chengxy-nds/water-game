const fs = require('fs');
const path = require('path');

console.log('=== Starting Advanced Sync Fixes ===');

// ==========================================
// 1. 升级 TubeView.ts 视觉精修
// ==========================================
const tubeViewPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/TubeView.ts';
let tubeCode = fs.readFileSync(tubeViewPath, 'utf-8');

// 声明 _frozenTurnsLabel 与 _countdownGraphics
if (!tubeCode.includes('private _frozenTurnsLabel: Label | null = null;')) {
  tubeCode = tubeCode.replace(
    'private _countdownBadgeLabel: Label | null = null;',
    `private _countdownBadgeLabel: Label | null = null;
  private _countdownGraphics: Graphics | null = null;
  private _frozenTurnsLabel: Label | null = null;`
  );
}

// 在 ensureSpecialNodes 中初始化 _frozenTurnsLabel 与 _countdownGraphics
if (!tubeCode.includes("this.node.getChildByName('FrozenTurnsLabel')")) {
  const neckEnsure = `    // 6.5 瓶口特殊机关绘制节点 (NeckGraphics)
    if (!this._neckGraphics) {
      let neckNode = this.node.getChildByName('NeckGraphics');
      if (!neckNode) {
        neckNode = new Node('NeckGraphics');
        neckNode.layer = this.node.layer;
        neckNode.setParent(this.node);
      }
      this._neckGraphics = neckNode.getComponent(Graphics) || neckNode.addComponent(Graphics);
    }`;

  const enhancedNeckEnsure = `    // 6.5 瓶口特殊机关绘制节点 (NeckGraphics)
    if (!this._neckGraphics) {
      let neckNode = this.node.getChildByName('NeckGraphics');
      if (!neckNode) {
        neckNode = new Node('NeckGraphics');
        neckNode.layer = this.node.layer;
        neckNode.setParent(this.node);
      }
      this._neckGraphics = neckNode.getComponent(Graphics) || neckNode.addComponent(Graphics);
    }
    if (!this._frozenTurnsLabel) {
      let fNode = this.node.getChildByName('FrozenTurnsLabel');
      if (!fNode) {
        fNode = new Node('FrozenTurnsLabel');
        fNode.layer = this.node.layer;
        fNode.setParent(this.node);
        const trans = fNode.addComponent(UITransform);
        trans.setContentSize(24, 20);
        this._frozenTurnsLabel = fNode.addComponent(Label);
        this._frozenTurnsLabel.fontSize = 11;
        this._frozenTurnsLabel.lineHeight = 12;
        this._frozenTurnsLabel.isBold = true;
        this._frozenTurnsLabel.color = new Color(184, 248, 255, 255);
      } else {
        this._frozenTurnsLabel = fNode.getComponent(Label) || null;
      }
      fNode.active = false;
    }`;

  tubeCode = tubeCode.replace(neckEnsure, enhancedNeckEnsure);
}

// 增强 countdown 怀表节点：添加 Graphics 组件
if (!tubeCode.includes('this._countdownGraphics =')) {
  const countdownEnsureOld = `        this._countdownBadgeLabel = lblNode.addComponent(Label);
        this._countdownBadgeLabel.fontSize = 14;
        this._countdownBadgeLabel.lineHeight = 16;
        this._countdownBadgeLabel.isBold = true;
        this._countdownBadgeLabel.color = new Color(255, 255, 255, 255);
      } else {
        const lblNode = this._countdownBadgeNode.getChildByName('CountdownLabel');
        this._countdownBadgeLabel = lblNode?.getComponent(Label) || null;
      }`;

  const countdownEnsureNew = `        this._countdownBadgeLabel = lblNode.addComponent(Label);
        this._countdownBadgeLabel.fontSize = 13;
        this._countdownBadgeLabel.lineHeight = 14;
        this._countdownBadgeLabel.isBold = true;
        this._countdownBadgeLabel.color = new Color(255, 255, 255, 255);
        this._countdownGraphics = this._countdownBadgeNode.addComponent(Graphics);
      } else {
        const lblNode = this._countdownBadgeNode.getChildByName('CountdownLabel');
        this._countdownBadgeLabel = lblNode?.getComponent(Label) || null;
        this._countdownGraphics = this._countdownBadgeNode.getComponent(Graphics) || this._countdownBadgeNode.addComponent(Graphics);
      }`;

  tubeCode = tubeCode.replace(countdownEnsureOld, countdownEnsureNew);
}

// 重构 updateSpecialVisuals 中 4D 与 5 的绘制逻辑，精美还原 3D 怀表与冰晶盾数字
const oldMouthSectionStart = tubeCode.indexOf('      // 4D. 流沙超时寒冰封口冠 (frozenTurns > 0)');
const oldMouthSectionEnd = tubeCode.indexOf('  }\n}', oldMouthSectionStart);

if (oldMouthSectionStart !== -1 && oldMouthSectionEnd !== -1) {
  const newMouthAndCountdownBlock = `      // 4D. 流沙超时寒冰封口冠 (frozenTurns > 0)
      else if (this._bottleData.frozenTurns && this._bottleData.frozenTurns > 0 && !this._bottleData.corked) {
        // 冰晶覆罩外形与高光描边
        ng.fillColor = new Color(56, 189, 248, 220);
        ng.rect(-20, neckY - 9, 40, 18);
        ng.fill();
        ng.strokeColor = new Color(255, 255, 255, 255);
        ng.lineWidth = 1.6;
        ng.rect(-20, neckY - 9, 40, 18);
        ng.stroke();
        // 中央小冰盾
        ng.fillColor = new Color(2, 75, 120, 240);
        ng.circle(0, neckY, 8.5);
        ng.fill();
        ng.strokeColor = new Color(184, 248, 255, 255);
        ng.lineWidth = 1.2;
        ng.circle(0, neckY, 8.5);
        ng.stroke();

        if (this._frozenTurnsLabel) {
          this._frozenTurnsLabel.node.active = true;
          this._frozenTurnsLabel.string = \`\${this._bottleData.frozenTurns}\`;
          this._frozenTurnsLabel.node.setPosition(0, neckY, 0);
        }
      } else {
        if (this._frozenTurnsLabel) this._frozenTurnsLabel.node.active = false;
      }
    }

    // 5. 倒计时沙漏怀表 (countdownMoves)
    if (this._countdownBadgeNode) {
      const moves = this._bottleData.countdownMoves;
      const isBomb = typeof moves === 'number' && moves > 0 && !this._bottleData.corked;
      this._countdownBadgeNode.active = isBomb;
      if (isBomb) {
        const isDanger = moves <= 2;
        if (this._countdownGraphics) {
          const cg = this._countdownGraphics;
          cg.clear();
          // 悬挂金链 (从瓶身肩部向内悬挂)
          cg.strokeColor = new Color(251, 191, 36, 180);
          cg.lineWidth = 1.5;
          cg.moveTo(-24, 22);
          cg.lineTo(0, 8);
          cg.lineTo(24, 22);
          cg.stroke();

          // 怀表顶冠
          cg.strokeColor = new Color(253, 224, 71, 255);
          cg.lineWidth = 1.2;
          cg.circle(0, 15, 3.0);
          cg.stroke();

          // 3D 怀表外框 (危险时深红，平日金棕)
          cg.fillColor = isDanger ? new Color(185, 28, 28, 250) : new Color(245, 158, 11, 250);
          cg.circle(0, 0, 16);
          cg.fill();
          cg.strokeColor = new Color(255, 255, 255, 255);
          cg.lineWidth = 1.6;
          cg.circle(0, 0, 16);
          cg.stroke();

          // 怀表内芯
          cg.fillColor = isDanger ? new Color(76, 5, 25, 255) : new Color(30, 27, 75, 255);
          cg.circle(0, 0, 13);
          cg.fill();

          // 左侧微缩金质沙漏
          cg.fillColor = new Color(253, 224, 71, 240);
          cg.moveTo(-8, -5);
          cg.lineTo(-2, -5);
          cg.lineTo(-5, 0);
          cg.close();
          cg.fill();
          cg.moveTo(-5, 0);
          cg.lineTo(-2, 5);
          cg.lineTo(-8, 5);
          cg.close();
          cg.fill();
        }

        if (this._countdownBadgeLabel) {
          this._countdownBadgeLabel.string = \`\${moves}\`;
          this._countdownBadgeLabel.color = isDanger
            ? new Color(254, 205, 211, 255)
            : new Color(255, 255, 255, 255);
          this._countdownBadgeLabel.node.setPosition(4, 0, 0);
        }
      }
    }`;

  tubeCode = tubeCode.slice(0, oldMouthSectionStart) + newMouthAndCountdownBlock + tubeCode.slice(oldMouthSectionEnd);
}

fs.writeFileSync(tubeViewPath, tubeCode, 'utf-8');
console.log('✓ Successfully enhanced TubeView.ts visuals');

// ==========================================
// 2. 在 waterSortLogic.ts 中添加 findBestPourMove
// ==========================================
const logicPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/core/waterSortLogic.ts';
let logicCode = fs.readFileSync(logicPath, 'utf-8');

if (!logicCode.includes('findBestPourMove')) {
  const solverFunc = `
/**
 * 启发式智能寻路算法：快速找出当前盘面最具有推进价值的倒水方案
 */
export function findBestPourMove(bottles: Bottle[]): { srcIdx: number; dstIdx: number } | null {
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

      // 避免纯色瓶倒入普通空瓶无意义搬家
      if (dst.layers.length === 0 && isSrcPure && dst.special !== 'color_lock' && dstCap <= (src.maxCap || 4)) {
        continue;
      }
      // 避免杂色倒入单向漏斗瓶
      if (dst.special === 'one_way_in' && dst.layers.length === 0 && srcTopSame < dstCap) {
        continue;
      }

      let score = 0;
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
        // 目标为空瓶
        score += 25;
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
`;
  logicCode += solverFunc;
  fs.writeFileSync(logicPath, logicCode, 'utf-8');
  console.log('✓ Added findBestPourMove to Cocos waterSortLogic.ts');

  // 同步到工作区
  const wsLogicPath = path.join(__dirname, '../src/game/waterSortLogic.ts');
  const wsLogic = fs.readFileSync(wsLogicPath, 'utf-8');
  if (!wsLogic.includes('findBestPourMove')) {
    fs.writeFileSync(wsLogicPath, wsLogic + solverFunc, 'utf-8');
    console.log('✓ Added findBestPourMove to workspace waterSortLogic.ts');
  }
}

// ==========================================
// 3. 升级 GameManager.ts 的辅助技能与智能提示
// ==========================================
const gmPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
let gmCode = fs.readFileSync(gmPath, 'utf-8');

// 引入 findBestPourMove
if (!gmCode.includes('findBestPourMove,')) {
  gmCode = gmCode.replace(
    '  releaseObsoleteColorLocks,\n} from \'../core/waterSortLogic\';',
    '  releaseObsoleteColorLocks,\n  findBestPourMove,\n} from \'../core/waterSortLogic\';'
  );
}

// 重构 handleShuffle 为真实高亮提示
const oldShuffleBlock = `  private handleShuffle() {
    this.showToast('💡 智能提示：请尝试腾挪浅色药水汇入空瓶');
  }`;

const newShuffleBlock = `  private handleShuffle() {
    if (this._isBusy) return;
    const bestMove = findBestPourMove(this._bottles);
    if (bestMove) {
      const srcTube = this.gameBoard.getTube(bestMove.srcIdx);
      const dstTube = this.gameBoard.getTube(bestMove.dstIdx);
      if (this._selectedIndex !== null) {
        const prev = this.gameBoard.getTube(this._selectedIndex);
        if (prev) prev.setSelected(false);
      }
      this._selectedIndex = bestMove.srcIdx;
      if (srcTube) srcTube.setSelected(true);
      const movingColor = this._bottles[bestMove.srcIdx].layers[this._bottles[bestMove.srcIdx].layers.length - 1];
      const colName = COLORS[movingColor]?.name || '药水';
      this.showToast(\`💡 智能推演：将第 \${bestMove.srcIdx + 1} 瓶【\${colName}】倒入第 \${bestMove.dstIdx + 1} 瓶！\`);
    } else {
      this.showToast('⚠️ 当前桌面暂无直接可倒步骤，建议点击【+空瓶】或【撤回】！');
    }
  }`;

gmCode = gmCode.replace(oldShuffleBlock, newShuffleBlock);

// 重构 handleAddBottle 为完整的六级智能救急体系
const oldAddBottleBlock = `  private handleAddBottle() {
    this.showToast('🎬 看广告免费+1备用空瓶');
  }`;

const newAddBottleBlock = `  private handleAddBottle() {
    this._history.push(this.cloneState());

    // 1. 步数危急救急：若步数限制 <= 3 步，优先增加 5 步
    if (this._remainingMoves !== null && this._remainingMoves <= 3) {
      this._remainingMoves += 5;
      this.updateMovesDisplay();
      this.showToast('🎬 激励辅助奖励：已为您增加 +5 步！');
      return;
    }

    // 2. 优先解除流沙超时寒冰封口或流沙炸弹倒计时
    const frozenOrBomb = this._bottles.find(
      (b) => !b.removed && !b.corked && ((b.frozenTurns && b.frozenTurns > 0) || (b.countdownMoves && b.countdownMoves > 0))
    );
    if (frozenOrBomb) {
      const wasFrozen = !!(frozenOrBomb.frozenTurns && frozenOrBomb.frozenTurns > 0);
      frozenOrBomb.frozenTurns = 0;
      frozenOrBomb.countdownMoves = null;
      for (let i = 0; i < this._bottles.length; i++) {
        const t = this.gameBoard.getTube(i);
        if (t) t.init(i, this._bottles[i]);
      }
      this.showToast(wasFrozen ? '❄️ 辅助特权：已为您立即震碎瓶口寒冰封印！' : '⏳ 辅助特权：已为您立即拆除星砂流沙炸弹！');
      return;
    }

    // 3. 优先解锁场上的激励视频备用空瓶 (ad_cam / ad_cam_blue)
    const camBottle = this._bottles.find((b) => !b.removed && (b.special === 'ad_cam' || b.special === 'ad_cam_blue'));
    if (camBottle) {
      camBottle.special = 'none';
      for (let i = 0; i < this._bottles.length; i++) {
        const t = this.gameBoard.getTube(i);
        if (t) t.init(i, this._bottles[i]);
      }
      this.showToast('🎬 辅助特权：已为您免费解锁 +1 备用琉璃空瓶！');
      return;
    }

    // 4. 优先解除一处特殊障碍（冰座、石座、星缎、盲盒等）
    const obstacleBottle = this._bottles.find(
      (b) => !b.removed && !b.corked && (b.special !== 'none' || (b.mysteryCount && b.mysteryCount > 0))
    );
    if (obstacleBottle) {
      if (obstacleBottle.special !== 'none') {
        obstacleBottle.special = 'none';
        obstacleBottle.requiredColor = null;
        obstacleBottle.poursToBreak = 0;
        obstacleBottle.poursRemaining = 0;
        for (let i = 0; i < this._bottles.length; i++) {
          const t = this.gameBoard.getTube(i);
          if (t) t.init(i, this._bottles[i]);
        }
        this.showToast('✨ 辅助特权：已为您直接化解一处特殊障碍！');
      } else {
        obstacleBottle.mysteryCount = 0;
        for (let i = 0; i < this._bottles.length; i++) {
          const t = this.gameBoard.getTube(i);
          if (t) t.init(i, this._bottles[i]);
        }
        this.showToast('✨ 辅助特权：已为您驱散一整瓶星雾盲盒！');
      }
      return;
    }

    // 5. 原地复用已消散古瓶或已入库留下的空槽位 (b.removed === true)，防止撑破 2x6 棋盘
    const removedSlot = this._bottles.find((b) => b.removed);
    if (removedSlot) {
      removedSlot.removed = false;
      removedSlot.corked = false;
      removedSlot.maxCap = 4;
      removedSlot.layers = [];
      removedSlot.special = 'none';
      removedSlot.requiredColor = null;
      removedSlot.mysteryCount = 0;
      removedSlot.countdownMoves = null;
      removedSlot.frozenTurns = 0;
      for (let i = 0; i < this._bottles.length; i++) {
        const t = this.gameBoard.getTube(i);
        if (t) t.init(i, this._bottles[i]);
      }
      this.showToast('➕ 辅助特权：已在空缺槽位为您补充 +1 标准琉璃空瓶！');
      return;
    }

    // 6. 若场上瓶数未达上限，额外陈列 1 瓶
    if (this._bottles.length < 14) {
      this._bottles.push({
        id: this._bottles.length,
        maxCap: 4,
        layers: [],
        special: 'none',
      });
      if (this.gameBoard) {
        this.gameBoard.init(this._bottles, (idx) => this.handleTubeClick(idx));
      }
      this.showToast('➕ 辅助特权：已为您额外陈列 +1 备用琉璃空瓶！');
    } else {
      this.showToast('💡 当前桌面器皿已满，建议点击【提示】或【撤回】！');
    }
  }`;

gmCode = gmCode.replace(oldAddBottleBlock, newAddBottleBlock);

// 升级 handleQuickUnlockAll 彻底清除所有新老障碍
const oldQuickUnlockBlock = `  private handleQuickUnlockAll() {
    this._history.push(this.cloneState());
    for (const b of this._bottles) {
      if (b.special === 'silk_drape' || b.special === 'full_ice' || b.special === 'paper_bag') {
        b.special = 'none';
      }
      if (b.poursRemaining) b.poursRemaining = 0;
      if (b.mysteryCount) b.mysteryCount = 0;
    }
    if (this.gameBoard) {
      this.gameBoard.init(this._bottles, (idx) => this.handleTubeClick(idx));
    }
    this.showToast('⚡ 闪电神威：全场星缎礼袍、冰雕与盲盒已全部解除！');
  }`;

const newQuickUnlockBlock = `  private handleQuickUnlockAll() {
    this._history.push(this.cloneState());
    for (const b of this._bottles) {
      if (['silk_drape', 'full_ice', 'paper_bag', 'color_lock', 'ice_base', 'stone_base'].includes(b.special)) {
        b.special = 'none';
      }
      b.requiredColor = null;
      b.poursToBreak = 0;
      b.poursRemaining = 0;
      b.mysteryCount = 0;
      b.countdownMoves = null;
      b.frozenTurns = 0;
    }
    if (this.gameBoard) {
      this.gameBoard.init(this._bottles, (idx) => this.handleTubeClick(idx));
    }
    this.showToast('⚡ 闪电神威：全场星缎、冰雕、色环锁、流沙炸弹与盲盒已全部解除！');
  }`;

gmCode = gmCode.replace(oldQuickUnlockBlock, newQuickUnlockBlock);

fs.writeFileSync(gmPath, gmCode, 'utf-8');
console.log('✓ Successfully enhanced GameManager.ts logic');

console.log('=== Advanced Sync Fixes Complete ===');
