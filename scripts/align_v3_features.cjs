const fs = require('fs');
const path = require('path');

const gmPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
let code = fs.readFileSync(gmPath, 'utf-8');

// 1. 在 GameManager 中添加大数字动画与浮动飘字方法
if (!code.includes('private playBigNumPulse(')) {
  const helperMethods = `
  /**
   * 100% 对齐 demo/v3.html: 满瓶金辉脉冲 (zenSealBurstAnim) 与步进弹跳 (zenStepTickAnim)
   */
  private playBigNumPulse(isSealBurst: boolean = false) {
    if (!this._bigNumLabel) return;
    const n = this._bigNumLabel.node;
    tween(n).stop();
    n.setScale(Vec3.ONE);
    if (isSealBurst) {
      tween(n)
        .to(0.20, { scale: new Vec3(1.28, 1.28, 1) }, { easing: 'backOut' })
        .to(0.24, { scale: new Vec3(1.0, 1.0, 1) }, { easing: 'quadOut' })
        .start();
    } else {
      tween(n)
        .to(0.10, { scale: new Vec3(1.16, 1.16, 1) }, { easing: 'quadOut' })
        .to(0.16, { scale: new Vec3(1.0, 1.0, 1) }, { easing: 'quadIn' })
        .start();
    }
  }

  /**
   * 100% 对齐 demo/v3.html: 大数字旁飘起浮字 (+1 / -1 / +5)
   */
  private spawnFloatDelta(text: string, colHex: string = '#fff8a6') {
    if (!this._bigNumLabel) return;
    const parentNode = this._bigNumLabel.node.parent || this._bigNumLabel.node;
    const floatNode = new Node('FloatDelta');
    floatNode.layer = parentNode.layer;
    floatNode.setParent(parentNode);
    floatNode.setPosition(45, 14, 0);

    const lbl = floatNode.addComponent(Label);
    lbl.string = text;
    lbl.fontSize = 16;
    lbl.lineHeight = 18;
    lbl.isBold = true;
    lbl.color = Color.fromHEX(new Color(), colHex);

    tween(floatNode)
      .to(0.20, { position: new Vec3(45, 20, 0), scale: new Vec3(1.15, 1.15, 1) })
      .to(0.50, { position: new Vec3(45, 34, 0), scale: new Vec3(0.9, 0.9, 1) })
      .call(() => floatNode.destroy())
      .start();
  }
`;
  // 插入到 class 结束前
  const lastBraceIdx = code.lastIndexOf('}');
  code = code.slice(0, lastBraceIdx) + helperMethods + '\n}\n';
}

// 2. 满瓶落塞封存时触发金辉脉冲
if (!code.includes('this.playBigNumPulse(true);')) {
  code = code.replace(
    'this.showToast(`🎉 满瓶封存：整瓶【${COLORS[movingColor].name}】已落塞入库！`);',
    'this.playBigNumPulse(true);\n      this.showToast(`🎉 满瓶封存：整瓶【${COLORS[movingColor].name}】已落塞入库！`);'
  );
}

// 3. 步数减少时触发步进弹性弹跳
if (!code.includes('this.playBigNumPulse(false);')) {
  code = code.replace(
    '      this._remainingMoves = Math.max(0, this._remainingMoves - 1);\n      this.updateMovesDisplay();',
    '      this._remainingMoves = Math.max(0, this._remainingMoves - 1);\n      this.updateMovesDisplay();\n      this.playBigNumPulse(false);\n      this.spawnFloatDelta("-1步", "#fecdd3");'
  );
}

// 4. 辅助技能增加步数时飘字 +5步
if (!code.includes('this.spawnFloatDelta("+5步"')) {
  code = code.replace(
    '      this._remainingMoves += 5;\n      this.updateMovesDisplay();',
    '      this._remainingMoves += 5;\n      this.updateMovesDisplay();\n      this.playBigNumPulse(true);\n      this.spawnFloatDelta("+5步", "#fde047");'
  );
}

fs.writeFileSync(gmPath, code, 'utf-8');
console.log('✓ Successfully enhanced GameManager.ts with v3 animations and floating delta text');
