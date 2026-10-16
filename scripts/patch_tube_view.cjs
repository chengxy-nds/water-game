const fs = require('fs');
const file = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/TubeView.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. ASSET_UUIDS
if (!code.includes('burlapNormal')) {
  code = code.replace(
    "cap6: '243a697d-82b8-4700-b421-7a7d040149e6@f9941',",
    "cap6: '243a697d-82b8-4700-b421-7a7d040149e6@f9941',\n  burlapNormal: 'b8fa0110-3882-4aa1-92be-b1e600a01001@f9941',\n  burlapSpecial: 'b8fa0110-3882-4aa1-92be-b1e600a01002@f9941',\n  burlapStar: 'b8fa0110-3882-4aa1-92be-b1e600a01003@f9941',"
  );
}

// 2. Class properties
if (!code.includes('_burlapCoasterNode')) {
  code = code.replace(
    '  private _risingColorId: ColorKey | null = null;',
    '  private _risingColorId: ColorKey | null = null;\n\n  // 独立 3D 粗麻布编织桌垫节点 (留在桌面原位)\n  private _burlapCoasterNode: Node | null = null;\n  private _burlapCoasterSprite: Sprite | null = null;'
  );
}

// 3. In init()
if (!code.includes('this.updateBurlapCoaster()')) {
  code = code.replace(
    'this.updateSpecialVisuals();',
    'this.updateSpecialVisuals();\n    this.updateBurlapCoaster();'
  );
}

// 4. In setSelected()
const oldSetSelected = `  public setSelected(selected: boolean) {
    this._isSelected = selected;
    tween(this.node).stop();
    if (selected) {
      const upPos = new Vec3(this._initialPos.x, this._initialPos.y + 22, this._initialPos.z);
      tween(this.node).to(0.18, { position: upPos }, { easing: 'backOut' }).start();
    } else {
      tween(this.node).to(0.16, { position: this._initialPos }, { easing: 'quadOut' }).start();
    }
  }`;

const newSetSelected = `  public setSelected(selected: boolean) {
    this._isSelected = selected;
    tween(this.node).stop();
    if (this._burlapCoasterNode) tween(this._burlapCoasterNode).stop();

    if (selected) {
      const upPos = new Vec3(this._initialPos.x, this._initialPos.y + 22, this._initialPos.z);
      tween(this.node).to(0.18, { position: upPos }, { easing: 'backOut' }).start();

      // 桌垫留在原位，阴影柔和微调
      if (this._burlapCoasterNode) {
        tween(this._burlapCoasterNode)
          .to(0.18, { scale: new Vec3(this.node.scale.x * 0.96, this.node.scale.y * 0.96, 1) }, { easing: 'quadOut' })
          .start();
      }
    } else {
      tween(this.node).to(0.16, { position: this._initialPos }, { easing: 'quadOut' }).start();

      // 桌垫恢复接触阴影
      if (this._burlapCoasterNode) {
        tween(this._burlapCoasterNode)
          .to(0.16, { scale: this.node.scale }, { easing: 'quadOut' })
          .start();
      }
    }
  }`;

if (code.includes(oldSetSelected)) {
  code = code.replace(oldSetSelected, newSetSelected);
}

// 5. Add updateBurlapCoaster and onDestroy
if (!code.includes('public updateBurlapCoaster()')) {
  const coasterMethod = `
  /**
   * 100% 对齐 v5 原版：独立 3D 粗麻布编织软垫底座
   * 垫子稳稳留在桌面上，瓶身被提走或飞去倒水时绝对不被带飞
   */
  public updateBurlapCoaster() {
    if (!this.node.parent || !this._bottleData) return;

    if (!this._burlapCoasterNode) {
      const coasterName = \`BurlapCoaster_\${this._index}\`;
      this._burlapCoasterNode = this.node.parent.getChildByName(coasterName);
      if (!this._burlapCoasterNode) {
        this._burlapCoasterNode = new Node(coasterName);
        this._burlapCoasterNode.layer = this.node.layer;
        this._burlapCoasterNode.setParent(this.node.parent);
        this._burlapCoasterNode.setSiblingIndex(0); // 垫在所有试管底层
      }
      const trans = this._burlapCoasterNode.getComponent(UITransform) || this._burlapCoasterNode.addComponent(UITransform);
      trans.setContentSize(96, 46);
      this._burlapCoasterSprite = this._burlapCoasterNode.getComponent(Sprite) || this._burlapCoasterNode.addComponent(Sprite);
      this._burlapCoasterSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    const isCat = !!this._bottleData.isGiantCat;
    const trans = this._burlapCoasterNode.getComponent(UITransform);
    if (trans) {
      trans.setContentSize(isCat ? 128 : 96, isCat ? 56 : 46);
    }
    const coasterY = this._initialPos.y - (isCat ? 86 : 76);
    this._burlapCoasterNode.setPosition(this._initialPos.x, coasterY, 0);
    this._burlapCoasterNode.setScale(this.node.scale);
    this._burlapCoasterNode.active = !this._bottleData.removed;

    let targetUuid = ASSET_UUIDS.burlapNormal;
    if (this._bottleData.corked || isCat) {
      targetUuid = ASSET_UUIDS.burlapStar;
    } else if (
      (this._bottleData.special && this._bottleData.special !== 'none') ||
      (this._bottleData.mysteryCount && this._bottleData.mysteryCount > 0)
    ) {
      targetUuid = ASSET_UUIDS.burlapSpecial;
    }

    if (this._burlapCoasterSprite) {
      assetManager.loadAny(targetUuid, (err, sf) => {
        if (!err && sf && this._burlapCoasterSprite && this._burlapCoasterSprite.isValid) {
          this._burlapCoasterSprite.spriteFrame = sf;
        }
      });
    }
  }

  onDestroy() {
    if (this._burlapCoasterNode && this._burlapCoasterNode.isValid) {
      this._burlapCoasterNode.destroy();
      this._burlapCoasterNode = null;
    }
  }
`;
  const lastBrace = code.lastIndexOf('}');
  code = code.slice(0, lastBrace) + coasterMethod + '\n}\n';
}

// 6. In updateCorkState, trigger updateBurlapCoaster
if (!code.includes('this.updateBurlapCoaster();\n    if (this.corkNode) {')) {
  code = code.replace(
    '    if (this.corkNode) {',
    '    this.updateBurlapCoaster();\n    if (this.corkNode) {'
  );
}

fs.writeFileSync(file, code, 'utf8');
console.log('Successfully patched TubeView.ts!');
