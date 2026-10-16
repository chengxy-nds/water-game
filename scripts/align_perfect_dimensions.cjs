const fs = require('fs');
const path = require('path');

const gmPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
let gmContent = fs.readFileSync(gmPath, 'utf8');

// 1. 确保 UI_ASSET_UUIDS 拥有全套完整底部按钮 UUID
const oldUuidsTarget = `  btnSettings: '1ae13f00-daf7-42f7-b70d-3bb84a725891@f9941',
  btnPower: 'd01f6581-c226-428d-b9d0-0be21119a342@f9941',`;

const newUuidsCode = `  btnSettings: '1ae13f00-daf7-42f7-b70d-3bb84a725891@f9941',
  btnPower: 'd01f6581-c226-428d-b9d0-0be21119a342@f9941',
  btnUndo: '3f267627-88c1-4bc6-a4ba-d2dccfba2090@f9941',
  btnShuffle: 'b591d898-4c40-476b-b280-536fa9c0d5b5@f9941',
  btnAddBottle: '21560661-655f-46e2-8805-ca9d1ed4f47d@f9941',
  btnLevel: 'a9ea2da3-f9d8-4558-b2e8-b78298b5d56e@f9941',`;

if (gmContent.includes(oldUuidsTarget) && !gmContent.includes('btnUndo:')) {
  gmContent = gmContent.replace(oldUuidsTarget, newUuidsCode);
}

// 2. 更新 setupHighFidelityFooter 锁死 1:1 物理尺寸与无损贴图
const oldFooterTarget = `  private setupHighFidelityFooter() {
    const footer = this.node.getChildByName('Footer');
    if (!footer) return;

    footer.setPosition(0, -490, 0);

    const shuffleBtn = footer.getChildByName('BtnShuffle');
    if (shuffleBtn) {
      this.ensureButtonBadge(shuffleBtn, UI_ASSET_UUIDS.badgeRed1, 24, 22);
    }

    const addBtn = footer.getChildByName('BtnAddBottle');
    if (addBtn) {
      this.ensureButtonBadge(addBtn, UI_ASSET_UUIDS.badgeVideo, 26, 22);
    }

    const undoBtn = footer.getChildByName('BtnUndo');
    if (undoBtn) {
      this.ensureButtonBadge(undoBtn, UI_ASSET_UUIDS.badgeVideo, 26, 22);
    }
  }`;

const newFooterCode = `  private setupHighFidelityFooter() {
    const footer = this.node.getChildByName('Footer');
    if (!footer) return;

    footer.setPosition(0, -490, 0);

    const btnConfigs = [
      { name: 'BtnShuffle', uuid: UI_ASSET_UUIDS.btnShuffle },
      { name: 'BtnAddBottle', uuid: UI_ASSET_UUIDS.btnAddBottle },
      { name: 'BtnUndo', uuid: UI_ASSET_UUIDS.btnUndo },
    ];

    btnConfigs.forEach((cfg) => {
      const btn = footer.getChildByName(cfg.name);
      if (btn) {
        const trans = btn.getComponent(UITransform) || btn.addComponent(UITransform);
        trans.setContentSize(58, 58);
        const sp = btn.getComponent(Sprite) || btn.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        assetManager.loadAny(cfg.uuid, (err, sf: SpriteFrame) => {
          if (!err && sf && sp.isValid) {
            sp.spriteFrame = sf;
            trans.setContentSize(58, 58);
          }
        });
        this.ensureButtonBadge(btn, UI_ASSET_UUIDS.badgeGold, 22, 22);
      }
    });
  }`;

if (gmContent.includes(oldFooterTarget)) {
  gmContent = gmContent.replace(oldFooterTarget, newFooterCode);
}

// 3. 顶部鹅卵石按钮锁死 48x48
gmContent = gmContent.replace('setTrans.setContentSize(42, 42);', 'setTrans.setContentSize(48, 48);');
gmContent = gmContent.replace('pwrTrans.setContentSize(42, 42);', 'pwrTrans.setContentSize(48, 48);');

fs.writeFileSync(gmPath, gmContent, 'utf8');
console.log('✓ GameManager 按钮尺寸与超清无损贴图已完成 1:1 闭环绑定！');
