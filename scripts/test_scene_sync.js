const canvas = cc.director.getScene().getChildByName('Canvas');
if (!canvas) {
  console.error('Canvas not found');
  return;
}

const UI_UUIDS = {
  btnSettings: '1ae13f00-daf7-42f7-b70d-3bb84a725891@f9941',
  btnPower: 'd01f6581-c226-428d-b9d0-0be21119a342@f9941',
  levelPill: '9b543135-bf6d-4a99-af58-dc032e2d4343@f9941',
  badgeRed1: '6502b239-5c1a-42bf-8019-dd68055c46ab@f9941',
  badgeVideo: '3024b34c-d827-4621-8f89-524a0904e8f4@f9941',
  bagRed: '2d33f627-93cd-47dc-b9a0-3bedbece8417@f9941',
  bagYellow: 'e2878a3e-c9ca-4611-a762-2a9a963a9a6a@f9941',
  bagBlue: '2c81d24f-0614-42f6-b738-e8121537e898@f9941',
  bagVideo: '554f59c8-6d68-4290-a832-dac372357192@f9941',
  silkDrape: 'd58023f7-9328-4fa5-9d4c-d94892d84088@f9941',
  iceBase: '268b5093-e2f8-4662-b302-7527c287ceeb@f9941',
  tubeGlass: '7b422a4d-76c3-45d9-bee7-ae2e085645ca@f9941',
  tubeAd: '1b2187b3-caf3-4ab1-b849-f7ac654a0f23@f9941',
};

// 1. 顶部 Header 琉璃导航栏
const header = canvas.getChildByName('Header');
if (header) {
  header.setPosition(0, 550, 0);

  // 左设置
  let btnSet = header.getChildByName('BtnSettings');
  if (!btnSet) {
    btnSet = new cc.Node('BtnSettings');
    btnSet.layer = header.layer;
    btnSet.setParent(header);
  }
  btnSet.setPosition(-155, 0, 0);
  let transSet = btnSet.getComponent(cc.UITransform) || btnSet.addComponent(cc.UITransform);
  transSet.setContentSize(42, 42);
  let spSet = btnSet.getComponent(cc.Sprite) || btnSet.addComponent(cc.Sprite);
  spSet.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  cc.assetManager.loadAny(UI_UUIDS.btnSettings, (err, sf) => { if (!err && sf) spSet.spriteFrame = sf; });

  // 右闪电
  let btnPwr = header.getChildByName('BtnPower');
  if (!btnPwr) {
    btnPwr = new cc.Node('BtnPower');
    btnPwr.layer = header.layer;
    btnPwr.setParent(header);
  }
  btnPwr.setPosition(155, 0, 0);
  let transPwr = btnPwr.getComponent(cc.UITransform) || btnPwr.addComponent(cc.UITransform);
  transPwr.setContentSize(42, 42);
  let spPwr = btnPwr.getComponent(cc.Sprite) || btnPwr.addComponent(cc.Sprite);
  spPwr.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  cc.assetManager.loadAny(UI_UUIDS.btnPower, (err, sf) => { if (!err && sf) spPwr.spriteFrame = sf; });

  // 中间圆角胶囊
  let pill = header.getChildByName('LevelPill');
  if (!pill) {
    pill = new cc.Node('LevelPill');
    pill.layer = header.layer;
    pill.setParent(header);
    pill.setSiblingIndex(0);
  }
  pill.setPosition(0, 0, 0);
  let transPill = pill.getComponent(cc.UITransform) || pill.addComponent(cc.UITransform);
  transPill.setContentSize(136, 38);
  let spPill = pill.getComponent(cc.Sprite) || pill.addComponent(cc.Sprite);
  spPill.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  cc.assetManager.loadAny(UI_UUIDS.levelPill, (err, sf) => { if (!err && sf) spPill.spriteFrame = sf; });

  let lbl = header.getChildByName('LevelLabel');
  if (lbl) {
    lbl.setPosition(0, 0, 0);
    const l = lbl.getComponent(cc.Label);
    if (l) {
      l.string = '第 7 关';
      l.fontSize = 17;
      l.lineHeight = 20;
      l.isBold = true;
    }
  }

  let moves = header.getChildByName('MovesLabel');
  if (moves) moves.active = false;
  console.log('✓ Header configured');
}

// 2. 隐藏难看的 ModeBanner
const modeBanner = canvas.getChildByName('ModeBanner');
if (modeBanner) modeBanner.active = false;

// 3. 顶部 4 个 3D 礼盒袋
const bags = canvas.getChildByName('ShoppingBags');
if (bags) {
  bags.active = true;
  bags.setPosition(0, 415, 0);
  const bagCfgs = [
    { name: 'Bag_1_Yellow', x: -126, uuid: UI_UUIDS.bagRed },
    { name: 'Bag_2_Purple', x: -42,  uuid: UI_UUIDS.bagYellow },
    { name: 'Bag_3_Blue',   x: 42,   uuid: UI_UUIDS.bagBlue },
    { name: 'Bag_4_Video',  x: 126,  uuid: UI_UUIDS.bagVideo },
  ];
  bagCfgs.forEach(cfg => {
    let node = bags.getChildByName(cfg.name);
    if (node) {
      node.setPosition(cfg.x, 0, 0);
      let t = node.getComponent(cc.UITransform) || node.addComponent(cc.UITransform);
      t.setContentSize(72, 90);
      let sp = node.getComponent(cc.Sprite) || node.addComponent(cc.Sprite);
      sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      cc.assetManager.loadAny(cfg.uuid, (err, sf) => {
        if (!err && sf) {
          sp.spriteFrame = sf;
          t.setContentSize(72, 90);
        }
      });
    }
  });
  console.log('✓ ShoppingBags configured');
}

// 4. 底部 4 大道具按钮角标
const footer = canvas.getChildByName('Footer');
if (footer) {
  footer.setPosition(0, -490, 0);
  const badgeMap = [
    { btnName: 'BtnShuffle',   uuid: UI_UUIDS.badgeRed1,  w: 24, h: 22 },
    { btnName: 'BtnAddBottle', uuid: UI_UUIDS.badgeVideo, w: 26, h: 22 },
    { btnName: 'BtnUndo',      uuid: UI_UUIDS.badgeVideo, w: 26, h: 22 },
  ];
  badgeMap.forEach(bm => {
    let btn = footer.getChildByName(bm.btnName);
    if (btn) {
      let badge = btn.getChildByName('JellyBadge');
      if (!badge) {
        badge = new cc.Node('JellyBadge');
        badge.layer = btn.layer;
        badge.setParent(btn);
      }
      badge.setPosition(25, 25, 0);
      let t = badge.getComponent(cc.UITransform) || badge.addComponent(cc.UITransform);
      t.setContentSize(bm.w, bm.h);
      let sp = badge.getComponent(cc.Sprite) || badge.addComponent(cc.Sprite);
      sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      cc.assetManager.loadAny(bm.uuid, (err, sf) => { if (!err && sf) sp.spriteFrame = sf; });
    }
  });
  console.log('✓ Footer badges configured');
}

// 5. GameBoard 试管机关与盲盒粒子初始化
const gb = canvas.getChildByName('GameBoard');
if (gb) {
  gb.setPosition(0, 35, 0);
  const gm = canvas.getComponent('GameManager');
  if (gm) {
    gm.loadLevel(7);
    console.log('✓ GM loaded Level 7');
  }

  // 手动强化 Tube_6, Tube_7 的 silk_drape，以及 Tube_1, Tube_4 的 ice_base
  const tubeNodes = gb.children.filter(c => c.name.startsWith('Tube_'));
  tubeNodes.sort((a,b) => (parseInt(a.name.replace(/\D/g,''),10)||0) - (parseInt(b.name.replace(/\D/g,''),10)||0));

  // Tube 6 & 7: silk_drape
  [6, 7].forEach(idx => {
    const t = tubeNodes[idx];
    if (t) {
      let sc = t.getChildByName('SpecialCover');
      if (!sc) {
        sc = new cc.Node('SpecialCover');
        sc.layer = t.layer;
        sc.setParent(t);
      }
      sc.active = true;
      sc.setPosition(0, -10, 0);
      let trans = sc.getComponent(cc.UITransform) || sc.addComponent(cc.UITransform);
      trans.setContentSize(78, 172);
      let sp = sc.getComponent(cc.Sprite) || sc.addComponent(cc.Sprite);
      sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      cc.assetManager.loadAny(UI_UUIDS.silkDrape, (err, sf) => {
        if (!err && sf) {
          sp.spriteFrame = sf;
          trans.setContentSize(78, 172);
        }
      });
      // 位于 GlassBody 上层
      const gbBody = t.getChildByName('GlassBody');
      if (gbBody) sc.setSiblingIndex(gbBody.getSiblingIndex() + 1);
    }
  });

  // Tube 1 & 4: ice_base
  [1, 4].forEach(idx => {
    const t = tubeNodes[idx];
    if (t) {
      let ob = t.getChildByName('ObstacleBase');
      if (ob) {
        ob.active = true;
        ob.setPosition(0, -72, 0);
        let trans = ob.getComponent(cc.UITransform);
        if (trans) trans.setContentSize(76, 38);
        let sp = ob.getComponent(cc.Sprite);
        if (sp) {
          sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
          cc.assetManager.loadAny(UI_UUIDS.iceBase, (err, sf) => {
            if (!err && sf) {
              sp.spriteFrame = sf;
              if (trans) trans.setContentSize(76, 38);
            }
          });
        }
      }
    }
  });

  // 刷新所有 TubeView 的液体与盲盒金星尘光点
  tubeNodes.forEach((t, i) => {
    const view = t.getComponent('TubeView');
    if (view && typeof view.renderLayers === 'function') {
      view.renderLayers();
    }
  });

  console.log('✓ All tubes visuals reinforced');
}
