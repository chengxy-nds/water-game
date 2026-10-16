const fs = require('fs');
const path = require('path');

const gmPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
let code = fs.readFileSync(gmPath, 'utf-8');

// 1. 确保从 ../core/waterSortLogic 中引入 releaseObsoleteColorLocks
if (!code.includes('releaseObsoleteColorLocks,')) {
  code = code.replace(
    '  isCompleteBottle,\n} from \'../core/waterSortLogic\';',
    '  isCompleteBottle,\n  releaseObsoleteColorLocks,\n} from \'../core/waterSortLogic\';'
  );
}

// 2. 升级倒水失败提示
const oldFailBlock = `    if (!canPourInto(srcBottle, dstBottle)) {
      const srcTube = this.gameBoard.getTube(srcIndex);
      if (srcTube) srcTube.setSelected(false);

      if (canSelectBottleNoToast(dstBottle)) {
        this._selectedIndex = dstIndex;
        const newTube = this.gameBoard.getTube(dstIndex);
        if (newTube) newTube.setSelected(true);
      } else {
        this._selectedIndex = null;
      }
      return;
    }`;

const newFailBlock = `    if (!canPourInto(srcBottle, dstBottle)) {
      const srcTube = this.gameBoard.getTube(srcIndex);
      if (srcTube) srcTube.setSelected(false);

      const pourColor = srcBottle.layers[srcBottle.layers.length - 1];
      if (dstBottle.frozenTurns && dstBottle.frozenTurns > 0) {
        this.showToast(\`🧊 目标瓶口已被寒冰封印，还需 \${dstBottle.frozenTurns} 步自动解封！\`);
      } else if (dstBottle.special === 'one_way_out') {
        this.showToast('⏫ 单向源泉古瓶：仅可向外倾倒，不可注入秘药！');
      } else if (dstBottle.special === 'color_lock' && dstBottle.requiredColor && pourColor !== dstBottle.requiredColor) {
        const reqObj = COLORS[dstBottle.requiredColor] || COLORS.blue;
        this.showToast(\`🔒 此瓶只能倒入【\${reqObj.name}】！\`);
      }

      if (canSelectBottleNoToast(dstBottle)) {
        this._selectedIndex = dstIndex;
        const newTube = this.gameBoard.getTube(dstIndex);
        if (newTube) newTube.setSelected(true);
      } else {
        this._selectedIndex = null;
      }
      return;
    }`;

code = code.replace(oldFailBlock, newFailBlock);

// 3. 升级倒水结算与破雾、冰座、古瓶、流沙炸弹步进
const oldStepStart = code.indexOf('    // 破雾盲盒揭晓');
const oldStepEnd = code.indexOf('    // 胜负判定');

if (oldStepStart !== -1 && oldStepEnd !== -1) {
  const newStepBlock = `    // 破雾盲盒揭晓
    if (srcBottle.mysteryCount && srcBottle.mysteryCount > 0 && srcBottle.layers.length <= srcBottle.mysteryCount) {
      srcBottle.mysteryCount = Math.max(0, srcBottle.layers.length - 1);
      this.showToast('✨ 金芒破雾：神秘盲盒秘药已显露真彩！');
    }

    // A. 检查单向出水古瓶 (one_way_out) 是否已排空 -> 腾出空间消散
    if (srcBottle.special === 'one_way_out' && srcBottle.layers.length === 0) {
      srcBottle.removed = true;
      srcBottle.countdownMoves = null;
      if (srcTube) {
        await srcTube.playVanishAnimation();
      }
      this.showToast('⏫ 单向古瓶已全部倾注完毕，化作星光腾出桌面！');
    }

    // B. 检查源瓶或目标瓶上的星砂流沙炸弹 (countdownMoves) 是否解除
    if (srcBottle.countdownMoves && srcBottle.countdownMoves > 0 && srcBottle.layers.length === 0) {
      srcBottle.countdownMoves = null;
      this.showToast('⏳ 源瓶已倒空，流沙倒计时危机解除！');
    }
    if (dstBottle.countdownMoves && dstBottle.countdownMoves > 0 && isCompleteBottle(dstBottle)) {
      dstBottle.countdownMoves = null;
      this.showToast('⏳ 满瓶落塞封存，流沙倒计时危机解除！');
    }

    // C. 全局步进结算：冰底座/石底座 + 冰封瓶口 + 流沙倒计时
    for (let bIdx = 0; bIdx < this._bottles.length; bIdx++) {
      const b = this._bottles[bIdx];
      if (b.removed || b.corked) continue;

      // 冰座/石座递减
      const pours = b.poursRemaining ?? b.poursToBreak;
      if ((b.special === 'ice_base' || b.special === 'stone_base') && pours && pours > 0) {
        const nextPours = pours - 1;
        b.poursRemaining = nextPours;
        b.poursToBreak = nextPours;
        if (nextPours === 0) {
          const wasIce = b.special === 'ice_base';
          b.special = 'none';
          this.showToast(wasIce ? '🧊 倾倒共振：极地霜晶底座已震碎破冰！' : '🪨 倾倒共振：曜石底座已震碎破石！');
        }
      }

      // 冰封瓶口递减
      if (b.frozenTurns && b.frozenTurns > 0) {
        b.frozenTurns--;
        if (b.frozenTurns === 0) {
          this.showToast('❄️ 瓶口寒冰消融，已恢复注入状态！');
        }
      } else if (typeof b.countdownMoves === 'number' && b.countdownMoves > 0) {
        if (b.layers.length === 0) {
          b.countdownMoves = null;
        } else {
          b.countdownMoves--;
          if (b.countdownMoves <= 0) {
            b.countdownMoves = null;
            b.frozenTurns = 3;
            this.showToast('⚠️ 流沙倒计时归零！瓶口已被寒冰封印 3 步！');
          }
        }
      }
    }

    // 判定满瓶落塞封存
    if (isCompleteBottle(dstBottle)) {
      dstBottle.corked = true;
      releaseObsoleteColorLocks(this._bottles);
      if (dstTube) {
        await dstTube.playCorkDropAnimation();
      }
      this.showToast(\`🎉 满瓶封存：整瓶【\${COLORS[movingColor].name}】已落塞入库！\`);

      // 礼盒契约解除星缎礼袍
      this._packedTotal++;
      this.unlockBagOrderObstacles();
    }

    // 刷新棋盘上所有试管状态
    for (let i = 0; i < this._bottles.length; i++) {
      const t = this.gameBoard.getTube(i);
      if (t) t.init(i, this._bottles[i]);
    }

    this._selectedIndex = null;
    this._isBusy = false;

`;
  code = code.slice(0, oldStepStart) + newStepBlock + code.slice(oldStepEnd);
}

fs.writeFileSync(gmPath, code, 'utf-8');
console.log('✓ Successfully updated GameManager.ts with full mechanic logic!');
