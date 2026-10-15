const fs = require('fs');

const gmPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
let code = fs.readFileSync(gmPath, 'utf8');

// 1. 引入 ModalManager
if (!code.includes("import { ModalManager } from './ModalManager';")) {
  code = code.replace(
    "import { WaterStream } from './WaterStream';",
    "import { WaterStream } from './WaterStream';\nimport { ModalManager } from './ModalManager';"
  );
}

if (!code.includes('private _modalManager: ModalManager | null = null;')) {
  code = code.replace(
    "private _history: MoveHistoryItem[] = [];",
    "private _history: MoveHistoryItem[] = [];\n  private _modalManager: ModalManager | null = null;\n  private _shownIntros: Set<string> = new Set();"
  );
}

if (!code.includes('this._modalManager = this.node.getComponent(ModalManager)')) {
  code = code.replace(
    "this.setupHighFidelityHeader();",
    "if (!this._modalManager) {\n      this._modalManager = this.node.getComponent(ModalManager) || this.node.addComponent(ModalManager);\n    }\n    this.setupHighFidelityHeader();"
  );
}

// 2. loadLevel 中增加新玩法解锁弹窗展示
if (!code.includes('this._modalManager.showMechanicIntro')) {
  const target = "if (this.gameBoard) {";
  const introCode = `// 4. 商业级新玩法/新机关登场弹窗 (对标 HTML 图 2)
    const introKey = this._currentCfg.introMechanicKey;
    if (introKey && !this._shownIntros.has(introKey) && this._modalManager) {
      this._shownIntros.add(introKey);
      this._modalManager.showMechanicIntro(introKey);
    }

    if (this.gameBoard) {`;
  code = code.replace(target, introCode);
}

// 3. 通关判定触发胜利弹窗
if (!code.includes('this._modalManager.showWinModal')) {
  const winOld = `console.log('🎉 恭喜达成全部目标，工坊试炼通关！');`;
  const winNew = `console.log('🎉 恭喜达成全部目标，工坊试炼通关！');
    if (this._modalManager) {
      this._modalManager.showWinModal(this._currentLevelNum, () => {
        this.loadLevel(this._currentLevelNum + 1);
      });
    }`;
  code = code.replace(winOld, winNew);
}

// 4. 解封飘字 Toast 联动
if (!code.includes('showToast')) {
  const unlockOld = `console.log(\`[GameManager] \${b.special === 'silk_drape' ? '星缎礼袍' : '极地霜晶'}已自动解封！\`);`;
  const unlockNew = `const msg = b.special === 'silk_drape' ? '🧣 礼盒契约达成：星缎礼袍已揭幕！' : '🧊 极地霜晶已震碎破冰！';
      console.log(\`[GameManager] \${msg}\`);
      if (this._modalManager) this._modalManager.showToast(msg);`;
  code = code.replace(unlockOld, unlockNew);
}

fs.writeFileSync(gmPath, code, 'utf8');
console.log('✓ GameManager.ts successfully integrated with ModalManager.');
