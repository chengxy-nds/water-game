const fs = require('fs');
const path = require('path');

const gmPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
const tubePath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/TubeView.ts';

// 1. 同步 GameManager.ts (Fredoka 高定字体加载与绑定)
let gmContent = fs.readFileSync(gmPath, 'utf8');

if (!gmContent.includes('fontFredoka')) {
  gmContent = gmContent.replace(
    "  tubeGlass: '7b422a4d-76c3-45d9-bee7-ae2e085645ca@f9941',",
    "  tubeGlass: '7b422a4d-76c3-45d9-bee7-ae2e085645ca@f9941',\n  fontFredoka: 'd4a89601-3882-4aa1-92be-b1e600a01001',"
  );
}

// 绑定字体到 _bigNumLabel
const fontBindingCode = `
      assetManager.loadAny(UI_ASSET_UUIDS.fontFredoka, (err, font: any) => {
        if (!err && font && this._bigNumLabel?.isValid) {
          this._bigNumLabel.font = font;
        }
      });`;

if (!gmContent.includes('UI_ASSET_UUIDS.fontFredoka') && gmContent.includes('this._bigNumLabel.color = new Color(255, 255, 255, 255);')) {
  gmContent = gmContent.replace(
    'this._bigNumLabel.color = new Color(255, 255, 255, 255);',
    'this._bigNumLabel.color = new Color(255, 255, 255, 255);' + fontBindingCode
  );
}

fs.writeFileSync(gmPath, gmContent, 'utf8');
console.log('✓ GameManager.ts Fredoka 高定字体同步成功！');

// 2. 同步 TubeView.ts (三层立体夹心架构: BackFloor + LiquidGraphics + FrontShell)
let tubeContent = fs.readFileSync(tubePath, 'utf8');

// 增加 ASSET_UUIDS
if (!tubeContent.includes('glassBack')) {
  tubeContent = tubeContent.replace(
    "  glass: '7b422a4d-76c3-45d9-bee7-ae2e085645ca@f9941',",
    "  glass: '7b422a4d-76c3-45d9-bee7-ae2e085645ca@f9941',\n  glassBack: 'e8a0110-3882-4aa1-92be-b1e600a01011@f9941',\n  glassFront: 'e8a0110-3882-4aa1-92be-b1e600a01012@f9941',"
  );
}

// 增加属性 _backFloorNode
if (!tubeContent.includes('private _backFloorNode:')) {
  tubeContent = tubeContent.replace(
    '  // 动态流体 Graphics 绘制节点',
    '  // 3D 沉底厚玻璃后壁与内底台面节点 (位于流体下方)\n  private _backFloorNode: Node | null = null;\n\n  // 动态流体 Graphics 绘制节点'
  );
}

// 修改 ensureSpecialNodes 建立三层架构
const oldEnsureNodesTarget = `    // 1. 流体绘制节点 (置于玻璃瓶身下方)
    if (!this._liquidGraphicsNode) {
      this._liquidGraphicsNode = this.node.getChildByName('LiquidGraphics');
      if (!this._liquidGraphicsNode) {
        this._liquidGraphicsNode = new Node('LiquidGraphics');
        this._liquidGraphicsNode.layer = this.node.layer;
        this._liquidGraphicsNode.setParent(this.node);
      }
      if (this.bottleBody) {
        this._liquidGraphicsNode.setSiblingIndex(Math.max(0, this.bottleBody.getSiblingIndex()));
      }
      this._liquidGraphics =
        this._liquidGraphicsNode.getComponent(Graphics) ||
        this._liquidGraphicsNode.addComponent(Graphics);
    }

    // 1.5 机关礼袍覆面 (SpecialCover)
    if (!this._specialCoverNode) {
      this._specialCoverNode = this.node.getChildByName('SpecialCover');
      if (!this._specialCoverNode) {
        this._specialCoverNode = new Node('SpecialCover');
        this._specialCoverNode.layer = this.node.layer;
        this._specialCoverNode.setParent(this.node);
      }
      const trans = this._specialCoverNode.getComponent(UITransform) || this._specialCoverNode.addComponent(UITransform);
      trans.setContentSize(78, 172);
      this._specialCoverNode.setPosition(0, -10, 0);
      const sp = this._specialCoverNode.getComponent(Sprite) || this._specialCoverNode.addComponent(Sprite);
      sp.sizeMode = Sprite.SizeMode.CUSTOM;
      sp.type = Sprite.Type.SIMPLE;
      if (this.bottleBody) {
        this._specialCoverNode.setSiblingIndex(this.bottleBody.getSiblingIndex() + 1);
      }
    }

    // 2. 玻璃外壁 (GlassBody)
    if (this.bottleBody) {
      const trans = this.bottleBody.getComponent(UITransform) || this.bottleBody.addComponent(UITransform);
      trans.setContentSize(78, 202);
      this.bottleBody.setPosition(0, 0, 0);
      this.bottleBody.getComponent(Sprite) || this.bottleBody.addComponent(Sprite);
    }`;

const newEnsureNodesCode = `    // 0. 3D 沉底厚玻璃后壁与内底台面 (BackFloor) - 位于最底层
    if (!this._backFloorNode) {
      this._backFloorNode = this.node.getChildByName('BackFloor');
      if (!this._backFloorNode) {
        this._backFloorNode = new Node('BackFloor');
        this._backFloorNode.layer = this.node.layer;
        this._backFloorNode.setParent(this.node);
      }
      const trans = this._backFloorNode.getComponent(UITransform) || this._backFloorNode.addComponent(UITransform);
      trans.setContentSize(78, 202);
      this._backFloorNode.setPosition(0, 0, 0);
      const sp = this._backFloorNode.getComponent(Sprite) || this._backFloorNode.addComponent(Sprite);
      sp.sizeMode = Sprite.SizeMode.CUSTOM;
      sp.type = Sprite.Type.SIMPLE;
      this._backFloorNode.setSiblingIndex(0);
    }

    // 1. 流体绘制节点 (置于内底台面之上，玻璃前壁之下)
    if (!this._liquidGraphicsNode) {
      this._liquidGraphicsNode = this.node.getChildByName('LiquidGraphics');
      if (!this._liquidGraphicsNode) {
        this._liquidGraphicsNode = new Node('LiquidGraphics');
        this._liquidGraphicsNode.layer = this.node.layer;
        this._liquidGraphicsNode.setParent(this.node);
      }
      this._liquidGraphics =
        this._liquidGraphicsNode.getComponent(Graphics) ||
        this._liquidGraphicsNode.addComponent(Graphics);
    }
    this._liquidGraphicsNode.setSiblingIndex(1);

    // 2. 玻璃前壁与沉底厚玻璃外壳 (GlassBody / FrontShell)
    if (this.bottleBody) {
      const trans = this.bottleBody.getComponent(UITransform) || this.bottleBody.addComponent(UITransform);
      trans.setContentSize(78, 202);
      this.bottleBody.setPosition(0, 0, 0);
      this.bottleBody.getComponent(Sprite) || this.bottleBody.addComponent(Sprite);
      this.bottleBody.setSiblingIndex(2);
    }

    // 2.5 机关礼袍覆面 (SpecialCover) - 覆盖于玻璃外壁之上
    if (!this._specialCoverNode) {
      this._specialCoverNode = this.node.getChildByName('SpecialCover');
      if (!this._specialCoverNode) {
        this._specialCoverNode = new Node('SpecialCover');
        this._specialCoverNode.layer = this.node.layer;
        this._specialCoverNode.setParent(this.node);
      }
      const trans = this._specialCoverNode.getComponent(UITransform) || this._specialCoverNode.addComponent(UITransform);
      trans.setContentSize(78, 172);
      this._specialCoverNode.setPosition(0, -10, 0);
      const sp = this._specialCoverNode.getComponent(Sprite) || this._specialCoverNode.addComponent(Sprite);
      sp.sizeMode = Sprite.SizeMode.CUSTOM;
      sp.type = Sprite.Type.SIMPLE;
      this._specialCoverNode.setSiblingIndex(3);
    }`;

if (tubeContent.includes(oldEnsureNodesTarget)) {
  tubeContent = tubeContent.replace(oldEnsureNodesTarget, newEnsureNodesCode);
}

// 修改 updateGlassBodySkin 装配三层立体贴图
const oldSkinTarget = `  private updateGlassBodySkin() {
    if (!this.bottleBody) return;
    const sp = this.bottleBody.getComponent(Sprite);
    if (!sp) return;

    const isCat = !!this._bottleData?.isGiantCat;
    const isAd = this._bottleData?.special === 'ad_cam' || this._bottleData?.special === 'ad_cam_blue';
    const targetUuid = isCat ? ASSET_UUIDS.giantCat : (isAd ? ASSET_UUIDS.glassAd : ASSET_UUIDS.glass);

    assetManager.loadAny(targetUuid, (err, sf: SpriteFrame) => {
      if (!err && sf && sp.isValid) {
        sp.spriteFrame = sf;
      }
    });

    const trans = this.bottleBody.getComponent(UITransform);
    if (trans) {
      if (isCat) {
        trans.setContentSize(116, 210);
      } else {
        trans.setContentSize(78, 202);
      }
    }
  }`;

const newSkinCode = `  private updateGlassBodySkin() {
    const isCat = !!this._bottleData?.isGiantCat;
    const isAd = this._bottleData?.special === 'ad_cam' || this._bottleData?.special === 'ad_cam_blue';

    // 1. 底层内壁椭圆台面 BackFloor (灵猫瓶自带封闭底，普通瓶启用三层立体夹心)
    if (this._backFloorNode) {
      this._backFloorNode.active = !isCat;
      if (!isCat) {
        const backSp = this._backFloorNode.getComponent(Sprite);
        if (backSp) {
          assetManager.loadAny(ASSET_UUIDS.glassBack, (err, sf: SpriteFrame) => {
            if (!err && sf && backSp.isValid) backSp.spriteFrame = sf;
          });
        }
      }
    }

    // 2. 顶层外壳 FrontShell (沉底厚玻璃高折射层、月牙焦散弧、瓶肩高光)
    if (!this.bottleBody) return;
    const sp = this.bottleBody.getComponent(Sprite);
    if (!sp) return;

    const targetUuid = isCat ? ASSET_UUIDS.giantCat : (isAd ? ASSET_UUIDS.glassAd : ASSET_UUIDS.glassFront);

    assetManager.loadAny(targetUuid, (err, sf: SpriteFrame) => {
      if (!err && sf && sp.isValid) {
        sp.spriteFrame = sf;
      }
    });

    const trans = this.bottleBody.getComponent(UITransform);
    if (trans) {
      if (isCat) {
        trans.setContentSize(116, 210);
      } else {
        trans.setContentSize(78, 202);
      }
    }
  }`;

if (tubeContent.includes(oldSkinTarget)) {
  tubeContent = tubeContent.replace(oldSkinTarget, newSkinCode);
}

fs.writeFileSync(tubePath, tubeContent, 'utf8');
console.log('✓ TubeView.ts 三层立体夹心架构改造成功！');
