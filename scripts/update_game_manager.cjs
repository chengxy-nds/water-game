const fs = require('fs');

const gmPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/GameManager.ts';
let code = fs.readFileSync(gmPath, 'utf8');

// 1. 检查 import，加入 assetManager, Sprite, SpriteFrame
if (!code.includes('assetManager')) {
  code = code.replace(
    "import { _decorator, Component, Node, UITransform, Label, tween, Vec3 } from 'cc';",
    "import { _decorator, Component, Node, UITransform, Label, tween, Vec3, assetManager, Sprite, SpriteFrame } from 'cc';"
  );
}

// 2. 插入 UI_ASSET_UUIDS
const uiUuidsCode = `
// 4x Retina 高保真 UI 视觉资产 UUID 表
const UI_ASSET_UUIDS = {
  btnSettings: '1ae13f00-daf7-42f7-b70d-3bb84a725891@f9941',
  btnPower: 'd01f6581-c226-428d-b9d0-0be21119a342@f9941',
  levelPill: '9b543135-bf6d-4a99-af58-dc032e2d4343@f9941',
  badgeRed1: '6502b239-5c1a-42bf-8019-dd68055c46ab@f9941',
  badgeVideo: '3024b34c-d827-4621-8f89-524a0904e8f4@f9941',
  bagRed: '2d33f627-93cd-47dc-b9a0-3bedbece8417@f9941',
  bagYellow: 'e2878a3e-c9ca-4611-a762-2a9a963a9a6a@f9941',
  bagBlue: '2c81d24f-0614-42f6-b738-e8121537e898@f9941',
  bagVideo: '554f59c8-6d68-4290-a832-dac372357192@f9941',
};
`;

if (!code.includes('const UI_ASSET_UUIDS =')) {
  code = code.replace("const { ccclass, property } = _decorator;", `${uiUuidsCode}\nconst { ccclass, property } = _decorator;`);
}

// 3. start() 默认加载第 7 关（与 HTML 截图完全对标）
code = code.replace('this.loadLevel(1);', 'this.loadLevel(7);');

// 4. 重构 autoBindDependencies，加入 Header / Footer / Bags 的高保真装配
const autoBindOld = `  private autoBindDependencies() {
    if (!this.gameBoard) {
      const gbNode = this.node.getChildByName('GameBoard');
      if (gbNode) {
        this.gameBoard = gbNode.getComponent(GameBoard) || gbNode.addComponent(GameBoard);
      }
    }
    if (!this.waterStream) {
      const wsNode = this.node.getChildByName('WaterStream');
      if (wsNode) {
        this.waterStream = wsNode.getComponent(WaterStream) || wsNode.addComponent(WaterStream);
      }
    }
    if (!this._shoppingBagsNode) {
      this._shoppingBagsNode = this.node.getChildByName('ShoppingBags');
    }
    if (!this._modeBannerNode) {
      this._modeBannerNode = this.node.getChildByName('ModeBanner');
    }

    const header = this.node.getChildByName('Header');
    if (header) {
      const lblNode = header.getChildByName('LevelLabel');
      this._levelLabel = lblNode?.getComponent(Label) || null;

      const movesNode = header.getChildByName('MovesLabel');
      this._movesLabel = movesNode?.getComponent(Label) || null;
    }

    if (this._modeBannerNode) {
      const txtNode = this._modeBannerNode.getChildByName('BannerText');
      this._modeBannerTextLabel = txtNode?.getComponent(Label) || null;
      const progNode = this._modeBannerNode.getChildByName('BannerProgress');
      this._modeBannerProgressLabel = progNode?.getComponent(Label) || null;
    }
  }`;

const autoBindNew = `  private autoBindDependencies() {
    if (!this.gameBoard) {
      const gbNode = this.node.getChildByName('GameBoard');
      if (gbNode) {
        this.gameBoard = gbNode.getComponent(GameBoard) || gbNode.addComponent(GameBoard);
      }
    }
    if (!this.waterStream) {
      const wsNode = this.node.getChildByName('WaterStream');
      if (wsNode) {
        this.waterStream = wsNode.getComponent(WaterStream) || wsNode.addComponent(WaterStream);
      }
    }
    if (!this._shoppingBagsNode) {
      this._shoppingBagsNode = this.node.getChildByName('ShoppingBags');
    }
    if (!this._modeBannerNode) {
      this._modeBannerNode = this.node.getChildByName('ModeBanner');
    }

    this.setupHighFidelityHeader();
    this.setupHighFidelityFooter();
    this.setupHighFidelityBags();

    if (this._modeBannerNode) {
      const txtNode = this._modeBannerNode.getChildByName('BannerText');
      this._modeBannerTextLabel = txtNode?.getComponent(Label) || null;
      const progNode = this._modeBannerNode.getChildByName('BannerProgress');
      this._modeBannerProgressLabel = progNode?.getComponent(Label) || null;
    }
  }

  /**
   * 100% 对标 HTML .top-bar 高定果冻琉璃导航栏
   */
  private setupHighFidelityHeader() {
    const header = this.node.getChildByName('Header');
    if (!header) return;

    // 1. 左侧齿轮设置按钮 (BtnSettings)
    let btnSettings = header.getChildByName('BtnSettings');
    if (!btnSettings) {
      btnSettings = new Node('BtnSettings');
      btnSettings.layer = header.layer;
      btnSettings.setParent(header);
    }
    btnSettings.setPosition(-155, 0, 0);
    const setTrans = btnSettings.getComponent(UITransform) || btnSettings.addComponent(UITransform);
    setTrans.setContentSize(42, 42);
    const setSp = btnSettings.getComponent(Sprite) || btnSettings.addComponent(Sprite);
    setSp.sizeMode = Sprite.SizeMode.CUSTOM;
    assetManager.loadAny(UI_ASSET_UUIDS.btnSettings, (err, sf: SpriteFrame) => {
      if (!err && sf && setSp.isValid) setSp.spriteFrame = sf;
    });
    btnSettings.off(Node.EventType.TOUCH_END);
    btnSettings.on(Node.EventType.TOUCH_END, () => {
      this.bounceButton(btnSettings!);
      console.log('[Header] 点击工坊荣誉设置面板');
    });

    // 2. 右侧能量闪电按钮 (BtnPower)
    let btnPower = header.getChildByName('BtnPower');
    if (!btnPower) {
      btnPower = new Node('BtnPower');
      btnPower.layer = header.layer;
      btnPower.setParent(header);
    }
    btnPower.setPosition(155, 0, 0);
    const pwrTrans = btnPower.getComponent(UITransform) || btnPower.addComponent(UITransform);
    pwrTrans.setContentSize(42, 42);
    const pwrSp = btnPower.getComponent(Sprite) || btnPower.addComponent(Sprite);
    pwrSp.sizeMode = Sprite.SizeMode.CUSTOM;
    assetManager.loadAny(UI_ASSET_UUIDS.btnPower, (err, sf: SpriteFrame) => {
      if (!err && sf && pwrSp.isValid) pwrSp.spriteFrame = sf;
    });
    btnPower.off(Node.EventType.TOUCH_END);
    btnPower.on(Node.EventType.TOUCH_END, () => {
      this.bounceButton(btnPower!);
      console.log('[Header] 点击闪电能量：快捷解除全场封印！');
      this.handleQuickUnlockAll();
    });

    // 3. 中间琉璃发光圆角胶囊底座 (LevelPill)
    let pillNode = header.getChildByName('LevelPill');
    if (!pillNode) {
      pillNode = new Node('LevelPill');
      pillNode.layer = header.layer;
      pillNode.setParent(header);
      pillNode.setSiblingIndex(0);
    }
    pillNode.setPosition(0, 0, 0);
    const pillTrans = pillNode.getComponent(UITransform) || pillNode.addComponent(UITransform);
    pillTrans.setContentSize(136, 38);
    const pillSp = pillNode.getComponent(Sprite) || pillNode.addComponent(Sprite);
    pillSp.sizeMode = Sprite.SizeMode.CUSTOM;
    assetManager.loadAny(UI_ASSET_UUIDS.levelPill, (err, sf: SpriteFrame) => {
      if (!err && sf && pillSp.isValid) pillSp.spriteFrame = sf;
    });
    pillNode.off(Node.EventType.TOUCH_END);
    pillNode.on(Node.EventType.TOUCH_END, () => {
      this.bounceButton(pillNode!);
      this.handleNextLevelCheat();
    });

    // 4. 关卡文字置于胶囊中央
    let lblNode = header.getChildByName('LevelLabel');
    if (lblNode) {
      lblNode.setPosition(0, 0, 0);
      this._levelLabel = lblNode.getComponent(Label);
      if (this._levelLabel) {
        this._levelLabel.fontSize = 17;
        this._levelLabel.lineHeight = 20;
        this._levelLabel.isBold = true;
      }
    }

    const movesNode = header.getChildByName('MovesLabel');
    this._movesLabel = movesNode?.getComponent(Label) || null;
  }

  /**
   * 100% 对标 HTML 底部 4 大道具栏带右上角果冻角标
   */
  private setupHighFidelityFooter() {
    const footer = this.node.getChildByName('Footer');
    if (!footer) return;

    // 1. 提示按钮挂载红底白字 1 角标
    const shuffleBtn = footer.getChildByName('BtnShuffle');
    if (shuffleBtn) {
      this.ensureButtonBadge(shuffleBtn, UI_ASSET_UUIDS.badgeRed1, 24, 22);
    }

    // 2. +空瓶按钮挂载紫色 🎬 视频角标
    const addBtn = footer.getChildByName('BtnAddBottle');
    if (addBtn) {
      this.ensureButtonBadge(addBtn, UI_ASSET_UUIDS.badgeVideo, 26, 22);
    }

    // 3. 撤回按钮挂载紫色 🎬 视频角标
    const undoBtn = footer.getChildByName('BtnUndo');
    if (undoBtn) {
      this.ensureButtonBadge(undoBtn, UI_ASSET_UUIDS.badgeVideo, 26, 22);
    }
  }

  private ensureButtonBadge(btnNode: Node, uuid: string, w: number, h: number) {
    let badge = btnNode.getChildByName('JellyBadge');
    if (!badge) {
      badge = new Node('JellyBadge');
      badge.layer = btnNode.layer;
      badge.setParent(btnNode);
    }
    badge.setPosition(25, 25, 0);
    const trans = badge.getComponent(UITransform) || badge.addComponent(UITransform);
    trans.setContentSize(w, h);
    const sp = badge.getComponent(Sprite) || badge.addComponent(Sprite);
    sp.sizeMode = Sprite.SizeMode.CUSTOM;
    assetManager.loadAny(uuid, (err, sf: SpriteFrame) => {
      if (!err && sf && sp.isValid) sp.spriteFrame = sf;
    });
  }

  /**
   * 100% 对标 HTML 顶部 4 个 3D 礼盒购物袋 (红、黄、蓝、视频)
   */
  private setupHighFidelityBags() {
    if (!this._shoppingBagsNode) return;
    this._shoppingBagsNode.setPosition(0, 286, 0);

    const bagConfigs = [
      { name: 'Bag_1_Yellow', x: -126, uuid: UI_ASSET_UUIDS.bagRed },
      { name: 'Bag_2_Purple', x: -42,  uuid: UI_ASSET_UUIDS.bagYellow },
      { name: 'Bag_3_Blue',   x: 42,   uuid: UI_ASSET_UUIDS.bagBlue },
      { name: 'Bag_4_Video',  x: 126,  uuid: UI_ASSET_UUIDS.bagVideo },
    ];

    bagConfigs.forEach(cfg => {
      const node = this._shoppingBagsNode!.getChildByName(cfg.name);
      if (node) {
        node.setPosition(cfg.x, 0, 0);
        const trans = node.getComponent(UITransform) || node.addComponent(UITransform);
        trans.setContentSize(72, 90);
        const sp = node.getComponent(Sprite) || node.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        assetManager.loadAny(cfg.uuid, (err, sf: SpriteFrame) => {
          if (!err && sf && sp.isValid) {
            sp.spriteFrame = sf;
            trans.setContentSize(72, 90);
          }
        });
      }
    });
  }

  /**
   * 快捷解除当前关卡所有封印 (对标 HTML quick-unlock-btn)
   */
  private handleQuickUnlockAll() {
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
  }`;

code = code.replace(autoBindOld, autoBindNew);

fs.writeFileSync(gmPath, code, 'utf8');
console.log('✓ GameManager.ts updated with High-Fidelity UI, Header, Footer & Bags.');
