const fs = require('fs');
const path = require('path');

const tubePath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/TubeView.ts';
let code = fs.readFileSync(tubePath, 'utf8');

// 1. ASSET_UUIDS
if (!code.includes('silkDrape:')) {
  code = code.replace(
    "paperBag: 'd539a271-3df0-4270-8dba-4999ec43f990@f9941',",
    "paperBag: 'd539a271-3df0-4270-8dba-4999ec43f990@f9941',\n  silkDrape: 'd58023f7-9328-4fa5-9d4c-d94892d84088@f9941',"
  );
}

// 2. 特殊机关节点
if (!code.includes('_specialCoverNode:')) {
  code = code.replace(
    'private _obstacleBaseNode: Node | null = null;',
    'private _specialCoverNode: Node | null = null;\n  private _obstacleBaseNode: Node | null = null;'
  );
}

// 3. ensureSpecialNodes
if (!code.includes('this._specialCoverNode = this.node.getChildByName')) {
  const target = '// 2. 玻璃外壁 (GlassBody)';
  const replacement = `// 1.5 机关礼袍覆面 (SpecialCover)
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

    // 2. 玻璃外壁 (GlassBody)`;
  code = code.replace(target, replacement);
}

// 4. renderLayers 中的星尘粒子与广告瓶星光
const renderLayersMarker = `// 4. 精确更新盲盒层的居中纯白 ? 文字 (100% 对齐 HTML 原生纯净视觉)`;
const starsCode = `// 3.5 盲盒金色悬浮星尘光点与紫色广告瓶微星 (100% 对标 HTML underGlassFX)
    if (mysteryCount > 0 && absAngle < 8) {
      // 两侧微弱金光纵向发光条
      g.fillColor = new Color(253, 224, 71, 28);
      g.ellipse(-36, -26, 4.5, 38);
      g.fill();
      g.ellipse(36, -26, 4.5, 38);
      g.fill();

      // 8 颗微型金色与纯白悬浮光点 (对标 HTML (8,84),(6,108),(9,136),(7,162) 与 (92,90),(94,118)...)
      const goldStars = [
        { x: -37, y: 17, r: 1.5, c: new Color(254, 240, 138, 235) },
        { x: -39, y: -7, r: 1.1, c: new Color(253, 224, 71, 210) },
        { x: -36, y: -35, r: 1.6, c: new Color(255, 255, 255, 245) },
        { x: -38, y: -61, r: 1.2, c: new Color(253, 224, 71, 220) },
        { x: 37, y: 11, r: 1.4, c: new Color(254, 240, 138, 235) },
        { x: 39, y: -17, r: 1.7, c: new Color(255, 255, 255, 245) },
        { x: 36, y: -45, r: 1.2, c: new Color(253, 224, 71, 220) },
        { x: 38, y: -69, r: 1.5, c: new Color(254, 240, 138, 210) },
      ];
      for (const st of goldStars) {
        g.fillColor = st.c;
        g.circle(st.x, st.y, st.r);
        g.fill();
      }
    }

    const isAd = (this._bottleData.special === 'ad_cam' || this._bottleData.special === 'ad_cam_blue') && !isCat;
    if (isAd && absAngle < 8) {
      // 紫色广告瓶两侧微弱紫光与四角星
      g.fillColor = new Color(232, 121, 249, 30);
      g.ellipse(-36, -26, 4.5, 42);
      g.fill();
      g.ellipse(36, -26, 4.5, 42);
      g.fill();

      const adStars = [
        { x: -36, y: 22, r: 2.2, c: new Color(255, 255, 255, 245) },
        { x: -38, y: -42, r: 1.8, c: new Color(245, 208, 254, 230) },
        { x: 37, y: 32, r: 2.4, c: new Color(255, 255, 255, 245) },
        { x: 38, y: -28, r: 1.6, c: new Color(245, 208, 254, 230) },
      ];
      for (const st of adStars) {
        g.fillColor = st.c;
        g.moveTo(st.x, st.y + st.r);
        g.lineTo(st.x + st.r * 0.35, st.y + st.r * 0.35);
        g.lineTo(st.x + st.r, st.y);
        g.lineTo(st.x + st.r * 0.35, st.y - st.r * 0.35);
        g.lineTo(st.x, st.y - st.r);
        g.lineTo(st.x - st.r * 0.35, st.y - st.r * 0.35);
        g.lineTo(st.x - st.r, st.y);
        g.lineTo(st.x - st.r * 0.35, st.y + st.r * 0.35);
        g.close();
        g.fill();
      }
    }

    ${renderLayersMarker}`;

if (!code.includes('盲盒金色悬浮星尘光点')) {
  code = code.replace(renderLayersMarker, starsCode);
}

// 5. updateSpecialVisuals 处理 silk_drape
const updateSpecialMarker = `// 2. 瓶底立体底座 (ice_base / paper_bag)，灵猫瓶绝对无底座`;
const silkVisualCode = `// 1.5 优雅星缎礼袍覆面 (special === 'silk_drape')
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

    ${updateSpecialMarker}`;

if (!code.includes('优雅星缎礼袍覆面')) {
  code = code.replace(updateSpecialMarker, silkVisualCode);
}

fs.writeFileSync(tubePath, code, 'utf8');
fs.writeFileSync('E:/GithubProjects/water-game/scripts/TubeView.ts.txt', code, 'utf8');
console.log('✓ TubeView.ts updated with Silk Drape & Gold Particles & Ad Stars.');
