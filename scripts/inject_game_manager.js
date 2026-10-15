const gmClass = cc.js.getClassByName('GameManager');
if (gmClass) {
  const UI_UUIDS = {
    cardBg: '981be82b-08a3-42cd-9936-7d200a2cd46c@f9941',
    btnPrimary: '6987067f-4854-43df-b4af-586c314a0220@f9941',
    pedestal: 'ef431f4e-76d5-452a-8b85-85b4d4f89dde@f9941',
    badgeGold: '283182b5-f869-4624-b516-3a18b3b6230d@f9941',
    silkDrape: 'd58023f7-9328-4fa5-9d4c-d94892d84088@f9941',
    iceBase: '268b5093-e2f8-4662-b302-7527c287ceeb@f9941',
    giantCat: '786c6a08-05f9-4264-9e95-e96129d01543@f9941',
    tubeGlass: '7b422a4d-76c3-45d9-bee7-ae2e085645ca@f9941',
  };

  const INTROS = {
    silk_drape: {
      badge: '🧣 第 7 关 · 高定礼盒契约',
      title: '🧣 星缎礼袍封印瓶',
      sub: '礼盒联动 · 满瓶自动揭幕',
      desc: '💡 工坊秘籍：整只琉璃瓶被冰蓝星缎礼袍优雅覆面。只需先利用场上的明牌秘药完成 1 份高定礼盒封存，星缎礼袍便会伴随流光自动掀开！'
    },
    mystery: {
      badge: '✨ 第 4 关 · 星光工坊新典藏',
      title: '❓ 星雾盲盒琉璃瓶',
      sub: '星雾遮蔽 · 倾注破雾显色',
      desc: '💡 工坊秘籍：瓶身下半部分笼罩于深邃星雾中并浮现 ? 印记。唯有先将最顶层的明牌秘药倾倒而出，下方星雾方会伴随金芒消散并显露真彩。'
    },
    giant_cat: {
      badge: '🐱 第 5 关 · 镇店典藏器皿',
      title: '🐱 皇家灵猫水晶瓶',
      sub: '凝萃大典 · 八层秘药归宗',
      desc: '💡 工坊秘籍：正中央矗立着容量 8 层的灵猫水晶大瓶！巧妙腾挪外围药水瓶，将目标秘药尽数汇入灵猫瓶中即可封存通关。'
    },
    ice_base: {
      badge: '❄️ 第 6 关 · 极光冰晶机关',
      title: '❄️ 极地霜晶底座瓶',
      sub: '霜晶凝结 · 共振破冰解封',
      desc: '💡 工坊秘籍：瓶底被极地霜晶凝结固定。在场上任意完成指定次数的倾倒共振，即可震碎霜晶！'
    }
  };

  gmClass.prototype.setupModalAndToast = function() {
    if (!this._modalMaskNode) {
      this._modalMaskNode = this.node.getChildByName('ModalMaskLayer');
      if (!this._modalMaskNode) {
        this._modalMaskNode = new cc.Node('ModalMaskLayer');
        this._modalMaskNode.layer = this.node.layer;
        this._modalMaskNode.setParent(this.node);
        this._modalMaskNode.addComponent(cc.BlockInputEvents);

        const trans = this._modalMaskNode.addComponent(cc.UITransformComponent);
        trans.setContentSize(750, 1334);
        const sp = this._modalMaskNode.addComponent(cc.Sprite);
        sp.color = new cc.Color(5, 10, 26, 195);
      }
      this._modalMaskNode.setPosition(0, 0, 0);
      this._modalMaskNode.active = false;
    }

    if (!this._modalCardNode && this._modalMaskNode) {
      this._modalCardNode = this._modalMaskNode.getChildByName('GlassJellyCard');
      if (!this._modalCardNode) {
        this._modalCardNode = new cc.Node('GlassJellyCard');
        this._modalCardNode.layer = this.node.layer;
        this._modalCardNode.setParent(this._modalMaskNode);

        const cardTrans = this._modalCardNode.addComponent(cc.UITransformComponent);
        cardTrans.setContentSize(320, 420);
        const cardSp = this._modalCardNode.addComponent(cc.Sprite);
        cardSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        cc.assetManager.loadAny(UI_UUIDS.cardBg, (err, sf) => {
          if (!err && sf && cardSp.isValid) cardSp.spriteFrame = sf;
        });

        // 徽章
        const badgeNode = new cc.Node('MechBadge');
        badgeNode.layer = this.node.layer;
        badgeNode.setParent(this._modalCardNode);
        badgeNode.setPosition(0, 160, 0);
        const badgeTrans = badgeNode.addComponent(cc.UITransformComponent);
        badgeTrans.setContentSize(160, 28);
        const badgeSp = badgeNode.addComponent(cc.Sprite);
        badgeSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        cc.assetManager.loadAny(UI_UUIDS.badgeGold, (err, sf) => {
          if (!err && sf && badgeSp.isValid) badgeSp.spriteFrame = sf;
        });
        const badgeLblNode = new cc.Node('Label');
        badgeLblNode.layer = this.node.layer;
        badgeLblNode.setParent(badgeNode);
        this._modalBadgeLabel = badgeLblNode.addComponent(cc.Label);
        this._modalBadgeLabel.fontSize = 11;
        this._modalBadgeLabel.lineHeight = 13;
        this._modalBadgeLabel.isBold = true;
        this._modalBadgeLabel.color = new cc.Color(69, 26, 3, 255);

        // 标题
        const titleNode = new cc.Node('Title');
        titleNode.layer = this.node.layer;
        titleNode.setParent(this._modalCardNode);
        titleNode.setPosition(0, 122, 0);
        this._modalTitleLabel = titleNode.addComponent(cc.Label);
        this._modalTitleLabel.fontSize = 20;
        this._modalTitleLabel.lineHeight = 24;
        this._modalTitleLabel.isBold = true;
        this._modalTitleLabel.color = new cc.Color(255, 255, 255, 255);

        // 副标题
        const subNode = new cc.Node('Sub');
        subNode.layer = this.node.layer;
        subNode.setParent(this._modalCardNode);
        subNode.setPosition(0, 96, 0);
        this._modalSubLabel = subNode.addComponent(cc.Label);
        this._modalSubLabel.fontSize = 12;
        this._modalSubLabel.lineHeight = 15;
        this._modalSubLabel.color = new cc.Color(186, 230, 253, 230);

        // 展示台
        const pedNode = new cc.Node('Pedestal');
        pedNode.layer = this.node.layer;
        pedNode.setParent(this._modalCardNode);
        pedNode.setPosition(0, 5, 0);
        const pedTrans = pedNode.addComponent(cc.UITransformComponent);
        pedTrans.setContentSize(96, 136);
        const pedSp = pedNode.addComponent(cc.Sprite);
        pedSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        cc.assetManager.loadAny(UI_UUIDS.pedestal, (err, sf) => {
          if (!err && sf && pedSp.isValid) pedSp.spriteFrame = sf;
        });

        const prevNode = new cc.Node('PreviewBottle');
        prevNode.layer = this.node.layer;
        prevNode.setParent(pedNode);
        prevNode.setPosition(0, -4, 0);
        const prevTrans = prevNode.addComponent(cc.UITransformComponent);
        prevTrans.setContentSize(56, 120);
        this._modalPreviewSprite = prevNode.addComponent(cc.Sprite);
        this._modalPreviewSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        // 规则说明框
        const ruleBox = new cc.Node('RuleBox');
        ruleBox.layer = this.node.layer;
        ruleBox.setParent(this._modalCardNode);
        ruleBox.setPosition(0, -100, 0);
        const ruleTrans = ruleBox.addComponent(cc.UITransformComponent);
        ruleTrans.setContentSize(276, 56);
        const ruleSp = ruleBox.addComponent(cc.Sprite);
        ruleSp.color = new cc.Color(255, 255, 255, 28);

        const descNode = new cc.Node('DescLabel');
        descNode.layer = this.node.layer;
        descNode.setParent(ruleBox);
        const descTrans = descNode.addComponent(cc.UITransformComponent);
        descTrans.setContentSize(262, 52);
        this._modalDescLabel = descNode.addComponent(cc.Label);
        this._modalDescLabel.fontSize = 11.5;
        this._modalDescLabel.lineHeight = 15;
        this._modalDescLabel.overflow = cc.Label.Overflow.CLAMP;
        this._modalDescLabel.color = new cc.Color(240, 249, 255, 240);

        // 确定按钮
        const btnNode = new cc.Node('ConfirmBtn');
        btnNode.layer = this.node.layer;
        btnNode.setParent(this._modalCardNode);
        btnNode.setPosition(0, -156, 0);
        const btnTrans = btnNode.addComponent(cc.UITransformComponent);
        btnTrans.setContentSize(248, 48);
        const btnSp = btnNode.addComponent(cc.Sprite);
        btnSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        cc.assetManager.loadAny(UI_UUIDS.btnPrimary, (err, sf) => {
          if (!err && sf && btnSp.isValid) btnSp.spriteFrame = sf;
        });

        const btnLblNode = new cc.Node('BtnLabel');
        btnLblNode.layer = this.node.layer;
        btnLblNode.setParent(btnNode);
        this._modalBtnLabel = btnLblNode.addComponent(cc.Label);
        this._modalBtnLabel.fontSize = 14;
        this._modalBtnLabel.lineHeight = 16;
        this._modalBtnLabel.isBold = true;
        this._modalBtnLabel.color = new cc.Color(255, 255, 255, 255);
        this._modalBtnLabel.string = '领略奥秘，开启试炼 →';

        btnNode.on(cc.Node.EventType.TOUCH_END, () => {
          this.closeModal();
        });
      }
      this._modalCardNode.setPosition(0, 20, 0);
    }

    if (!this._toastNode) {
      this._toastNode = this.node.getChildByName('ToastBubble');
      if (!this._toastNode) {
        this._toastNode = new cc.Node('ToastBubble');
        this._toastNode.layer = this.node.layer;
        this._toastNode.setParent(this.node);
        this._toastNode.setPosition(0, 320, 0);

        const trans = this._toastNode.addComponent(cc.UITransformComponent);
        trans.setContentSize(320, 36);
        const sp = this._toastNode.addComponent(cc.Sprite);
        sp.color = new cc.Color(30, 58, 138, 220);

        const lblNode = new cc.Node('ToastLabel');
        lblNode.layer = this.node.layer;
        lblNode.setParent(this._toastNode);
        this._toastLabel = lblNode.addComponent(cc.Label);
        this._toastLabel.fontSize = 12;
        this._toastLabel.lineHeight = 15;
        this._toastLabel.isBold = true;
        this._toastLabel.color = new cc.Color(255, 255, 255, 255);
      }
      this._toastNode.active = false;
    }
  };

  gmClass.prototype.showMechanicIntro = function(key, onClose) {
    this.setupModalAndToast();
    const info = INTROS[key];
    if (!info || !this._modalMaskNode || !this._modalCardNode) return;

    this._onModalCloseCallback = onClose || null;

    const card = this._modalCardNode;
    const badgeLbl = card.getChildByName('MechBadge')?.getChildByName('Label')?.getComponent(cc.Label);
    if (badgeLbl) badgeLbl.string = info.badge;

    const titleLbl = card.getChildByName('Title')?.getComponent(cc.Label);
    if (titleLbl) titleLbl.string = info.title;

    const subLbl = card.getChildByName('Sub')?.getComponent(cc.Label);
    if (subLbl) subLbl.string = info.sub;

    const descLbl = card.getChildByName('RuleBox')?.getChildByName('DescLabel')?.getComponent(cc.Label);
    if (descLbl) descLbl.string = info.desc.replace(/<[^>]+>/g, '');

    const btnLbl = card.getChildByName('ConfirmBtn')?.getChildByName('BtnLabel')?.getComponent(cc.Label);
    if (btnLbl) btnLbl.string = '领略奥秘，开启试炼 →';

    const prevSp = card.getChildByName('Pedestal')?.getChildByName('PreviewBottle')?.getComponent(cc.Sprite);
    if (prevSp) {
      let previewUuid = UI_UUIDS.tubeGlass;
      if (key === 'silk_drape') previewUuid = UI_UUIDS.silkDrape;
      else if (key === 'giant_cat') previewUuid = UI_UUIDS.giantCat;
      else if (key === 'ice_base') previewUuid = UI_UUIDS.iceBase;

      cc.assetManager.loadAny(previewUuid, (err, sf) => {
        if (!err && sf && prevSp.isValid) prevSp.spriteFrame = sf;
      });
    }

    this._modalMaskNode.active = true;
    this._modalCardNode.setScale(new cc.Vec3(0.75, 0.75, 1));
    cc.tween(this._modalCardNode)
      .to(0.24, { scale: new cc.Vec3(1.04, 1.04, 1) }, { easing: 'quadOut' })
      .to(0.12, { scale: new cc.Vec3(1.0, 1.0, 1) }, { easing: 'sineOut' })
      .start();
  };

  gmClass.prototype.showWinModal = function(onNext) {
    this.setupModalAndToast();
    if (!this._modalMaskNode || !this._modalCardNode) return;

    this._onModalCloseCallback = onNext || null;
    const card = this._modalCardNode;

    const badgeLbl = card.getChildByName('MechBadge')?.getChildByName('Label')?.getComponent(cc.Label);
    if (badgeLbl) badgeLbl.string = `🏆 试炼通关 · LV.${this._currentLevelNum}`;

    const titleLbl = card.getChildByName('Title')?.getComponent(cc.Label);
    if (titleLbl) titleLbl.string = '🎉 凝萃圆满 · 大获全胜';

    const subLbl = card.getChildByName('Sub')?.getComponent(cc.Label);
    if (subLbl) subLbl.string = '同色秘药尽数落塞封存 · 获得星光认可';

    const descLbl = card.getChildByName('RuleBox')?.getChildByName('DescLabel')?.getComponent(cc.Label);
    if (descLbl) descLbl.string = '✨ 宗师技艺非凡！秘药纯度达到 100%，已收录入星光工坊典藏史册。';

    const btnLbl = card.getChildByName('ConfirmBtn')?.getChildByName('BtnLabel')?.getComponent(cc.Label);
    if (btnLbl) btnLbl.string = '开启下一试炼 →';

    this._modalMaskNode.active = true;
    this._modalCardNode.setScale(new cc.Vec3(0.75, 0.75, 1));
    cc.tween(this._modalCardNode)
      .to(0.25, { scale: new cc.Vec3(1.05, 1.05, 1) }, { easing: 'backOut' })
      .to(0.1, { scale: new cc.Vec3(1.0, 1.0, 1) })
      .start();
  };

  gmClass.prototype.closeModal = function() {
    if (!this._modalMaskNode || !this._modalCardNode) return;
    cc.tween(this._modalCardNode)
      .to(0.16, { scale: new cc.Vec3(0.8, 0.8, 1) }, { easing: 'quadIn' })
      .call(() => {
        if (this._modalMaskNode) this._modalMaskNode.active = false;
        if (this._onModalCloseCallback) {
          const cb = this._onModalCloseCallback;
          this._onModalCloseCallback = null;
          cb();
        }
      })
      .start();
  };

  gmClass.prototype.showToast = function(msg) {
    this.setupModalAndToast();
    if (!this._toastNode) return;

    const lbl = this._toastNode.getChildByName('ToastLabel')?.getComponent(cc.Label);
    if (lbl) lbl.string = msg;

    this._toastNode.active = true;
    this._toastNode.setScale(new cc.Vec3(0.85, 0.85, 1));
    cc.tween(this._toastNode).stop();

    cc.tween(this._toastNode)
      .to(0.18, { scale: new cc.Vec3(1.05, 1.05, 1) }, { easing: 'backOut' })
      .to(0.1, { scale: new cc.Vec3(1.0, 1.0, 1) })
      .delay(1.8)
      .to(0.2, { scale: new cc.Vec3(0.8, 0.8, 1) })
      .call(() => {
        if (this._toastNode) this._toastNode.active = false;
      })
      .start();
  };

  console.log('✓ Injected modal & toast methods onto GameManager prototype successfully.');
}
