const fs = require('fs');
const file = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. 微调大数字与副标题字号，增加胶囊背景
const oldHeaderSetup = `    // A. 上方纯白立体艺术大字 (大关卡号或剩余步数)
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
    subtitleNode.setPosition(0, -18, 0);`;

const newHeaderSetup = `    // A. 上方纯白立体艺术大字 (100% 对标 v5: "第 X 关")
    let bigNumNode = centerGroup.getChildByName('BigNum');
    if (!bigNumNode) {
      bigNumNode = new Node('BigNum');
      bigNumNode.layer = header.layer;
      bigNumNode.setParent(centerGroup);
      const trans = bigNumNode.addComponent(UITransform);
      trans.setContentSize(160, 32);
      this._bigNumLabel = bigNumNode.addComponent(Label);
      this._bigNumLabel.fontSize = 24;
      this._bigNumLabel.lineHeight = 26;
      this._bigNumLabel.isBold = true;
      this._bigNumLabel.color = new Color(255, 255, 255, 255);
    } else {
      this._bigNumLabel = bigNumNode.getComponent(Label);
      if (this._bigNumLabel) {
        this._bigNumLabel.fontSize = 24;
        this._bigNumLabel.lineHeight = 26;
      }
    }
    bigNumNode.setPosition(0, 10, 0);

    // B. 下方副标题胶囊 (100% 对标 v5: "已封存 0/X" / "剩余步数 X")
    let subtitleNode = centerGroup.getChildByName('Subtitle');
    if (!subtitleNode) {
      subtitleNode = new Node('Subtitle');
      subtitleNode.layer = header.layer;
      subtitleNode.setParent(centerGroup);
      const trans = subtitleNode.addComponent(UITransform);
      trans.setContentSize(150, 26);
      
      const pillSp = subtitleNode.addComponent(Sprite);
      pillSp.sizeMode = Sprite.SizeMode.CUSTOM;
      assetManager.loadAny(UI_ASSET_UUIDS.levelPill, (err, sf) => {
        if (!err && sf && pillSp.isValid) pillSp.spriteFrame = sf;
      });

      const lblNode = new Node('Label');
      lblNode.layer = header.layer;
      lblNode.setParent(subtitleNode);
      this._levelLabel = lblNode.addComponent(Label);
      this._levelLabel.fontSize = 12;
      this._levelLabel.lineHeight = 14;
      this._levelLabel.isBold = true;
      this._levelLabel.color = new Color(255, 255, 255, 255);
    } else {
      this._levelLabel = subtitleNode.getComponentInChildren(Label);
    }
    subtitleNode.setPosition(0, -18, 0);`;

if (code.includes(oldHeaderSetup)) {
  code = code.replace(oldHeaderSetup, newHeaderSetup);
}

// 2. 优化更新 Header 文本逻辑
const oldUpdateHeader = `    if (this._bigNumLabel) {
      if (this._remainingMoves !== null) {
        this._bigNumLabel.string = \`\${this._remainingMoves}\`;
      } else {
        this._bigNumLabel.string = \`\${this._currentLevelNum}\`;
      }
    }
    if (this._levelLabel) {
      const tag = this._currentCfg.intro ? this._currentCfg.intro.badge : this._currentCfg.title;
      this._levelLabel.string =
        this._remainingMoves !== null
          ? \`步数 · \${tag}\`
          : \`第 \${this._currentLevelNum} 关 · \${tag}\`;
    }`;

const newUpdateHeader = `    const doneCnt = this._bottles.filter(b => b.corked && !b.removed).length;
    const targetDenom = Math.max(1, this._bottles.filter(b => !b.removed).length - 2);

    if (this._bigNumLabel) {
      this._bigNumLabel.string = \`第 \${this._currentLevelNum} 关\`;
    }
    if (this._levelLabel) {
      if (this._remainingMoves !== null) {
        this._levelLabel.string = \`剩余步数 \${this._remainingMoves}\`;
      } else {
        this._levelLabel.string = \`已封存 \${doneCnt}/\${targetDenom}\`;
      }
    }`;

if (code.includes(oldUpdateHeader)) {
  code = code.replace(oldUpdateHeader, newUpdateHeader);
}

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully updated GameManager.ts header!');
