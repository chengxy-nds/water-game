const fs = require('fs');
const path = require('path');

const gmPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
let code = fs.readFileSync(gmPath, 'utf-8');

// 1. 在 private 变量区声明 _bigNumLabel
if (!code.includes('private _bigNumLabel: Label | null = null;')) {
  code = code.replace(
    'private _levelLabel: Label | null = null;',
    `private _levelLabel: Label | null = null;
  private _bigNumLabel: Label | null = null;`
  );
}

// 2. 升级 setupHighFidelityHeader
const oldHeaderSetupStart = code.indexOf('    // 3. 中间琉璃发光圆角胶囊底座 (LevelPill)');
const oldHeaderSetupEnd = code.indexOf('  private setupHighFidelityFooter() {');

if (oldHeaderSetupStart !== -1 && oldHeaderSetupEnd !== -1) {
  const newHeaderSetupBlock = `    // 3. 顶部中央大字号艺术数字与副标题 (100% 对齐 demo/v2.html .zen-big-num & .level-pill)
    let centerGroup = header.getChildByName('CenterGroup');
    if (!centerGroup) {
      centerGroup = new Node('CenterGroup');
      centerGroup.layer = header.layer;
      centerGroup.setParent(header);
      centerGroup.setPosition(0, 0, 0);
    }

    // A. 上方纯白立体艺术大字 (大关卡号或剩余步数)
    let bigNumNode = centerGroup.getChildByName('BigNum');
    if (!bigNumNode) {
      bigNumNode = new Node('BigNum');
      bigNumNode.layer = header.layer;
      bigNumNode.setParent(centerGroup);
      const trans = bigNumNode.addComponent(UITransform);
      trans.setContentSize(120, 46);
      this._bigNumLabel = bigNumNode.addComponent(Label);
      this._bigNumLabel.fontSize = 38;
      this._bigNumLabel.lineHeight = 40;
      this._bigNumLabel.isBold = true;
      this._bigNumLabel.color = new Color(255, 255, 255, 255);
    } else {
      this._bigNumLabel = bigNumNode.getComponent(Label);
    }
    bigNumNode.setPosition(0, 10, 0);

    // B. 下方副标题 (关卡名称 / 模式标签)
    let subtitleNode = centerGroup.getChildByName('Subtitle');
    if (!subtitleNode) {
      subtitleNode = new Node('Subtitle');
      subtitleNode.layer = header.layer;
      subtitleNode.setParent(centerGroup);
      const trans = subtitleNode.addComponent(UITransform);
      trans.setContentSize(160, 24);
      this._levelLabel = subtitleNode.addComponent(Label);
      this._levelLabel.fontSize = 13;
      this._levelLabel.lineHeight = 16;
      this._levelLabel.isBold = true;
      this._levelLabel.color = new Color(255, 253, 245, 240);
    } else {
      this._levelLabel = subtitleNode.getComponent(Label);
    }
    subtitleNode.setPosition(0, -18, 0);

    // 点击中央区域可切换测试下一关
    centerGroup.off(Node.EventType.TOUCH_END);
    centerGroup.on(Node.EventType.TOUCH_END, () => {
      this.bounceButton(centerGroup!);
      this.handleNextLevelCheat();
    });

    // 隐藏废弃节点
    const oldPill = header.getChildByName('LevelPill');
    if (oldPill) oldPill.active = false;
    const oldLbl = header.getChildByName('LevelLabel');
    if (oldLbl) oldLbl.active = false;
    const oldMoves = header.getChildByName('MovesLabel');
    if (oldMoves) oldMoves.active = false;
  }
`;
  code = code.slice(0, oldHeaderSetupStart) + newHeaderSetupBlock + code.slice(oldHeaderSetupEnd);
}

// 3. 升级 updateLevelDisplay 与 updateMovesDisplay 显示逻辑
const oldUpdateDisplay = `    if (this._levelLabel) {
      this._levelLabel.string = \`第 \${this._currentLevelNum} 关\`;
    }
    this.updateMovesDisplay();`;

const newUpdateDisplay = `    if (this._bigNumLabel) {
      if (this._remainingMoves !== null) {
        this._bigNumLabel.string = \`\${this._remainingMoves}\`;
      } else {
        this._bigNumLabel.string = \`\${this._currentLevelNum}\`;
      }
    }
    if (this._levelLabel) {
      const tag = this._currentCfg?.shortTag || this._currentCfg?.title || \`第 \${this._currentLevelNum} 关\`;
      this._levelLabel.string = this._remainingMoves !== null ? \`步数 · \${tag}\` : \`第 \${this._currentLevelNum} 关 · \${tag}\`;
    }`;

code = code.replace(oldUpdateDisplay, newUpdateDisplay);

const oldMovesUpdate = `    if (!this._movesLabel) return;
    if (this._remainingMoves !== null) {
      this._movesLabel.node.active = true;
      this._movesLabel.string = \`剩余步数: \${this._remainingMoves}\`;
    } else {
      this._movesLabel.node.active = false;
    }`;

const newMovesUpdate = `    if (this._remainingMoves !== null && this._bigNumLabel) {
      this._bigNumLabel.string = \`\${this._remainingMoves}\`;
      if (this._levelLabel) {
        const tag = this._currentCfg?.shortTag || \`第 \${this._currentLevelNum} 关\`;
        this._levelLabel.string = \`剩余步数 · \${tag}\`;
      }
    }`;

code = code.replace(oldMovesUpdate, newMovesUpdate);

fs.writeFileSync(gmPath, code, 'utf-8');
console.log('✓ Successfully aligned GameManager.ts with v2.html Header layout');
