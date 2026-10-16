const fs = require('fs');
const path = require('path');

const tubeViewPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/TubeView.ts';
let code = fs.readFileSync(tubeViewPath, 'utf-8');

// 1. 确保在 private 变量区声明新节点引用
if (!code.includes('private _neckGraphics: Graphics | null = null;')) {
  code = code.replace(
    'private _capBadgeNode: Node | null = null;',
    `private _capBadgeNode: Node | null = null;
  private _neckGraphics: Graphics | null = null;
  private _countdownBadgeNode: Node | null = null;
  private _countdownBadgeLabel: Label | null = null;`
  );
}

// 2. 确保在 ensureSpecialNodes 中初始化 _neckGraphics 与 _countdownBadgeNode
if (!code.includes("this.node.getChildByName('NeckGraphics')")) {
  const ensureSearch = `// 7. 隐藏旧的黄色大煎蛋徽章节点`;
  const ensureInsert = `    // 6.5 瓶口特殊机关绘制节点 (NeckGraphics)
    if (!this._neckGraphics) {
      let neckNode = this.node.getChildByName('NeckGraphics');
      if (!neckNode) {
        neckNode = new Node('NeckGraphics');
        neckNode.layer = this.node.layer;
        neckNode.setParent(this.node);
      }
      this._neckGraphics = neckNode.getComponent(Graphics) || neckNode.addComponent(Graphics);
    }

    // 6.6 倒计时沙漏怀表节点 (CountdownBadge)
    if (!this._countdownBadgeNode) {
      this._countdownBadgeNode = this.node.getChildByName('CountdownBadge');
      if (!this._countdownBadgeNode) {
        this._countdownBadgeNode = new Node('CountdownBadge');
        this._countdownBadgeNode.layer = this.node.layer;
        this._countdownBadgeNode.setParent(this.node);
        const trans = this._countdownBadgeNode.addComponent(UITransform);
        trans.setContentSize(42, 42);
        this._countdownBadgeNode.setPosition(0, 15, 0);

        const lblNode = new Node('CountdownLabel');
        lblNode.layer = this.node.layer;
        lblNode.setParent(this._countdownBadgeNode);
        lblNode.setPosition(5, 0, 0);
        this._countdownBadgeLabel = lblNode.addComponent(Label);
        this._countdownBadgeLabel.fontSize = 14;
        this._countdownBadgeLabel.lineHeight = 16;
        this._countdownBadgeLabel.isBold = true;
        this._countdownBadgeLabel.color = new Color(255, 255, 255, 255);
      } else {
        const lblNode = this._countdownBadgeNode.getChildByName('CountdownLabel');
        this._countdownBadgeLabel = lblNode?.getComponent(Label) || null;
      }
    }

    // 7. 隐藏旧的黄色大煎蛋徽章节点`;
  code = code.replace(ensureSearch, ensureInsert);
}

// 3. 增加消失动画 playVanishAnimation
if (!code.includes('playVanishAnimation(')) {
  const methodInsert = `  public playVanishAnimation(): Promise<void> {
    return new Promise((resolve) => {
      tween(this.node)
        .to(0.35, { scale: new Vec3(0.01, 0.01, 1) }, { easing: 'backIn' })
        .call(() => {
          this.node.active = false;
          resolve();
        })
        .start();
    });
  }

  public updateBadgeState() {`;
  code = code.replace('public updateBadgeState() {', methodInsert);
}

// 4. 在 updateSpecialVisuals 中渲染这 4 种新机关
const newSpecialVisualsCode = `  public updateSpecialVisuals() {
    if (!this._bottleData) return;
    const special = this._bottleData.special;
    const maxCap = this._bottleData.maxCap || 4;
    const isCat = !!this._bottleData.isGiantCat;

    // 1. 彻底禁用旧版黄色大煎蛋徽章，由 renderLayers 绘制极简纯白 ?
    if (this._mysteryBadgeNode) {
      this._mysteryBadgeNode.active = false;
    }

    // 1.5 优雅星缎礼袍覆面 (special === 'silk_drape')
    if (this._specialCoverNode) {
      const isSilk = special === 'silk_drape' && !isCat;
      this._specialCoverNode.active = isSilk;
      if (isSilk) {
        const trans = this._specialCoverNode.getComponent(UITransform);
        if (trans) trans.setContentSize(78, 172);
        this._specialCoverNode.setPosition(0, -10, 0);
        const sp = this._specialCoverNode.getComponent(Sprite);
        if (sp) {
          sp.sizeMode = Sprite.SizeMode.CUSTOM;
          sp.type = Sprite.Type.SIMPLE;
          assetManager.loadAny(ASSET_UUIDS.silkDrape, (err, sf: SpriteFrame) => {
            if (!err && sf && sp.isValid) {
              sp.spriteFrame = sf;
              if (trans) trans.setContentSize(78, 172);
            }
          });
        }
      }
    }

    // 2. 瓶底立体底座 (ice_base / paper_bag / stone_base)，灵猫瓶绝对无底座
    if (this._obstacleBaseNode) {
      const isIce = (special === 'ice_base' || special === 'full_ice') && !isCat;
      const isPaper = (special === 'paper_bag' || special === 'stone_base') && !isCat;
      this._obstacleBaseNode.active = isIce || isPaper;

      if (this._obstacleBaseNode.active) {
        const trans = this._obstacleBaseNode.getComponent(UITransform);
        const sp = this._obstacleBaseNode.getComponent(Sprite);
        if (sp) {
          sp.sizeMode = Sprite.SizeMode.CUSTOM;
          sp.type = Sprite.Type.SIMPLE;
        }

        if (isIce) {
          if (trans) trans.setContentSize(76, 38);
          this._obstacleBaseNode.setPosition(0, -72, 0);
        } else if (isPaper) {
          if (trans) trans.setContentSize(74, 76);
          this._obstacleBaseNode.setPosition(0, -52, 0);
        }

        const targetUuid = isIce ? ASSET_UUIDS.iceBase : ASSET_UUIDS.paperBag;
        if (sp) {
          assetManager.loadAny(targetUuid, (err, sf: SpriteFrame) => {
            if (!err && sf && sp.isValid) {
              sp.spriteFrame = sf;
              if (trans) trans.setContentSize(isIce ? 76 : 74, isIce ? 38 : 76);
            }
          });
        }
        if (this._obstacleBaseLabel) {
          const pours = this._bottleData.poursRemaining ?? this._bottleData.poursToBreak;
          this._obstacleBaseLabel.string = pours ? \`\${pours}次\` : '';
          this._obstacleBaseLabel.node.setPosition(0, isIce ? -8 : -24, 0);
        }
      }
    }

    // 3. 瓶底层数胶囊 (CapBadge: 2层, 4层, 6层)
    if (this._capBadgeNode) {
      const showCapBadge = this._isVariedHeight && !isCat;
      this._capBadgeNode.active = showCapBadge;
      if (showCapBadge) {
        const sp = this._capBadgeNode.getComponent(Sprite);
        const badgeUuid = maxCap === 2 ? ASSET_UUIDS.cap2 : maxCap === 6 ? ASSET_UUIDS.cap6 : ASSET_UUIDS.cap4;
        if (sp) {
          assetManager.loadAny(badgeUuid, (err, sf: SpriteFrame) => {
            if (!err && sf && sp.isValid) sp.spriteFrame = sf;
          });
        }
      }
    }

    // 4. 瓶口机关特效 (NeckGraphics: 色环瓶 / 单向漏斗 / 单向古瓶 / 冰封瓶口)
    if (this._neckGraphics) {
      const ng = this._neckGraphics;
      ng.clear();
      const neckY = isCat ? 98 : 74;

      // 4A. 专属色环瓶 (color_lock)
      if (special === 'color_lock' && this._bottleData.requiredColor && !this._bottleData.corked) {
        const reqC = getColor(this._bottleData.requiredColor);
        const colHex = Color.fromHEX(new Color(), reqC.mid);
        // 外金环
        ng.lineWidth = 3.5;
        ng.strokeColor = new Color(245, 158, 11, 255);
        ng.circle(0, neckY, 14);
        ng.stroke();
        // 宝石色内环
        ng.fillColor = colHex;
        ng.circle(0, neckY, 11);
        ng.fill();
        // 高光星芒
        ng.fillColor = new Color(255, 255, 255, 220);
        ng.circle(-3, neckY + 3, 2.5);
        ng.fill();
      }
      // 4B. 单向漏斗瓶 (one_way_in)
      else if (special === 'one_way_in' && !this._bottleData.corked) {
        // 金色漏斗外框
        ng.fillColor = new Color(245, 158, 11, 230);
        ng.moveTo(-16, neckY + 12);
        ng.lineTo(16, neckY + 12);
        ng.lineTo(7, neckY - 6);
        ng.lineTo(-7, neckY - 6);
        ng.close();
        ng.fill();
        // 翡翠向下箭头
        ng.fillColor = new Color(52, 211, 153, 255);
        ng.moveTo(-5, neckY + 8);
        ng.lineTo(5, neckY + 8);
        ng.lineTo(0, neckY - 2);
        ng.close();
        ng.fill();
      }
      // 4C. 单向古瓶 (one_way_out)
      else if (special === 'one_way_out' && !this._bottleData.corked) {
        // 金色双翼向上喷泉出水口
        ng.fillColor = new Color(234, 179, 8, 240);
        ng.moveTo(-14, neckY - 6);
        ng.lineTo(14, neckY - 6);
        ng.lineTo(0, neckY + 14);
        ng.close();
        ng.fill();
        // 向上白色泉芯
        ng.fillColor = new Color(255, 255, 255, 255);
        ng.moveTo(-5, neckY - 2);
        ng.lineTo(5, neckY - 2);
        ng.lineTo(0, neckY + 8);
        ng.close();
        ng.fill();
      }
      // 4D. 流沙超时寒冰封口冠 (frozenTurns > 0)
      else if (this._bottleData.frozenTurns && this._bottleData.frozenTurns > 0 && !this._bottleData.corked) {
        ng.fillColor = new Color(56, 189, 248, 220);
        ng.rect(-18, neckY - 8, 36, 18);
        ng.fill();
        ng.strokeColor = new Color(255, 255, 255, 255);
        ng.lineWidth = 2.0;
        ng.rect(-18, neckY - 8, 36, 18);
        ng.stroke();
      }
    }

    // 5. 倒计时沙漏怀表 (countdownMoves)
    if (this._countdownBadgeNode) {
      const moves = this._bottleData.countdownMoves;
      const isBomb = typeof moves === 'number' && moves > 0 && !this._bottleData.corked;
      this._countdownBadgeNode.active = isBomb;
      if (isBomb && this._countdownBadgeLabel) {
        this._countdownBadgeLabel.string = \`\${moves}\`;
        const isDanger = moves <= 2;
        this._countdownBadgeLabel.color = isDanger
          ? new Color(255, 99, 132, 255)
          : new Color(255, 255, 255, 255);
      }
    }
  }`;

// 替换 updateSpecialVisuals
const oldStartIdx = code.indexOf('public updateSpecialVisuals() {');
if (oldStartIdx !== -1) {
  code = code.slice(0, oldStartIdx) + newSpecialVisualsCode + '\n}\n';
}

fs.writeFileSync(tubeViewPath, code, 'utf-8');
console.log('✓ Successfully updated TubeView.ts with all 4 new mechanics!');
