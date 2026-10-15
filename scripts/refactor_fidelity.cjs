const fs = require('fs');
const path = require('path');

const cocosRoot = 'E:/GithubProjects/water-game-cocos';

// ==========================================
// 1. 重构 TubeView.ts
// ==========================================
const tubeViewContent = `import { _decorator, Component, Node, Sprite, Color, tween, Vec3, UITransform, Graphics, Label, assetManager, SpriteFrame } from 'cc';
import { Bottle, ColorKey } from '../core/types';
import { getColor } from '../core/colors';
import { getPhysicalSpillAngleDeg } from '../physics/liquidMath';

const { ccclass, property } = _decorator;

const TUBE_HALF_WIDTH = 24.8; // 普通试管内壁半宽

// 超清全套高奢资产 UUID
const ASSET_UUIDS = {
  glass: '7b422a4d-76c3-45d9-bee7-ae2e085645ca@f9941',
  glassAd: '1b2187b3-caf3-4ab1-b849-f7ac654a0f23@f9941',
  giantCat: '786c6a08-05f9-4264-9e95-e96129d01543@f9941',
  videoBadge: '3b84bfe1-fd95-4fcc-97a1-18318d64f0c5@f9941',
  cork: 'd6e2556a-7292-46b2-9ec4-13935c044f38@f9941',
  iceBase: '268b5093-e2f8-4662-b302-7527c287ceeb@f9941',
  paperBag: 'd539a271-3df0-4270-8dba-4999ec43f990@f9941',
  mysteryBadge: 'a6b820b0-6c2b-498a-9a2c-b47ae5ccb042@f9941',
  cap2: '74d539df-ef18-4924-9620-49367168cd07@f9941',
  cap4: '234d7787-4123-45b4-84dd-54544f7f4e76@f9941',
  cap6: '243a697d-82b8-4700-b421-7a7d040149e6@f9941',
};

@ccclass('TubeView')
export class TubeView extends Component {
  @property(Node)
  public bottleBody: Node = null!;

  @property(Node)
  public corkNode: Node = null!;

  @property(Node)
  public videoBadgeNode: Node = null!;

  // 动态流体 Graphics 绘制节点
  private _liquidGraphicsNode: Node | null = null;
  private _liquidGraphics: Graphics | null = null;

  // 特殊机关节点
  private _obstacleBaseNode: Node | null = null;
  private _obstacleBaseLabel: Label | null = null;
  private _mysteryBadgeNode: Node | null = null;
  private _capBadgeNode: Node | null = null;

  // 纯原生盲盒居中问号 Label 缓存池
  private _mysteryLabels: Node[] = [];
  private _isVariedHeight: boolean = false;

  private _bottleData: Bottle = null!;
  private _index: number = 0;
  private _isSelected: boolean = false;
  private _initialPos: Vec3 = new Vec3();

  // 动态倒水过程中的体积参数
  private _drainUnits: number = 0;
  private _risingUnits: number = 0;
  private _risingColorId: ColorKey | null = null;

  onLoad() {
    this._initialPos.set(this.node.position);
    this.autoBindNodes();
    this.ensureSpecialNodes();
  }

  private autoBindNodes() {
    for (const child of this.node.children) {
      if (child.name.startsWith('Liquid_') || child.name === 'SpecialCover') {
        child.active = false;
      }
    }

    if (!this.bottleBody) {
      this.bottleBody = this.node.getChildByName('GlassBody') || this.node;
    }
    if (!this.videoBadgeNode) {
      this.videoBadgeNode = this.node.getChildByName('VideoBadge')!;
    }
    if (!this.corkNode) {
      this.corkNode = this.node.getChildByName('Cork')!;
    }
  }

  private ensureSpecialNodes() {
    // 1. 流体绘制节点 (置于玻璃瓶身下方)
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

    // 2. 玻璃外壁 (GlassBody)
    if (this.bottleBody) {
      const trans = this.bottleBody.getComponent(UITransform) || this.bottleBody.addComponent(UITransform);
      trans.setContentSize(78, 202);
      this.bottleBody.setPosition(0, 0, 0);
      this.bottleBody.getComponent(Sprite) || this.bottleBody.addComponent(Sprite);
    }

    // 3. 备用瓶电影场记板 (VideoBadge)
    if (!this.videoBadgeNode) {
      this.videoBadgeNode = this.node.getChildByName('VideoBadge')!;
      if (!this.videoBadgeNode) {
        this.videoBadgeNode = new Node('VideoBadge');
        this.videoBadgeNode.layer = this.node.layer;
        this.videoBadgeNode.setParent(this.node);
      }
    }
    if (this.videoBadgeNode) {
      const trans = this.videoBadgeNode.getComponent(UITransform) || this.videoBadgeNode.addComponent(UITransform);
      trans.setContentSize(32, 28);
      this.videoBadgeNode.setPosition(0, -10, 0);
      const sp = this.videoBadgeNode.getComponent(Sprite) || this.videoBadgeNode.addComponent(Sprite);
      if (!sp.spriteFrame) {
        assetManager.loadAny(ASSET_UUIDS.videoBadge, (err, sf: SpriteFrame) => {
          if (!err && sf && sp.isValid) sp.spriteFrame = sf;
        });
      }
    }

    // 4. 原木软木塞 (Cork)
    if (!this.corkNode) {
      this.corkNode = this.node.getChildByName('Cork')!;
      if (!this.corkNode) {
        this.corkNode = new Node('Cork');
        this.corkNode.layer = this.node.layer;
        this.corkNode.setParent(this.node);
      }
    }
    if (this.corkNode) {
      const trans = this.corkNode.getComponent(UITransform) || this.corkNode.addComponent(UITransform);
      trans.setContentSize(38, 28);
      this.corkNode.setPosition(0, 78, 0);
      const sp = this.corkNode.getComponent(Sprite) || this.corkNode.addComponent(Sprite);
      if (!sp.spriteFrame) {
        assetManager.loadAny(ASSET_UUIDS.cork, (err, sf: SpriteFrame) => {
          if (!err && sf && sp.isValid) sp.spriteFrame = sf;
        });
      }
    }

    // 5. 瓶底立体底座机关 (ObstacleBase)
    if (!this._obstacleBaseNode) {
      this._obstacleBaseNode = this.node.getChildByName('ObstacleBase');
      if (!this._obstacleBaseNode) {
        this._obstacleBaseNode = new Node('ObstacleBase');
        this._obstacleBaseNode.layer = this.node.layer;
        this._obstacleBaseNode.setParent(this.node);
        const trans = this._obstacleBaseNode.addComponent(UITransform);
        trans.setContentSize(84, 40);
        this._obstacleBaseNode.addComponent(Sprite);
        this._obstacleBaseNode.setPosition(0, -74, 0);

        const lblNode = new Node('PoursCountLabel');
        lblNode.layer = this.node.layer;
        lblNode.setParent(this._obstacleBaseNode);
        lblNode.setPosition(0, -6, 0);
        this._obstacleBaseLabel = lblNode.addComponent(Label);
        this._obstacleBaseLabel.fontSize = 13;
        this._obstacleBaseLabel.color = new Color(255, 255, 255, 255);
      } else {
        const lblNode = this._obstacleBaseNode.getChildByName('PoursCountLabel');
        this._obstacleBaseLabel = lblNode?.getComponent(Label) || null;
      }
    }

    // 6. 瓶底层数胶囊 (CapBadge: 仅异形关卡微小显示)
    if (!this._capBadgeNode) {
      this._capBadgeNode = this.node.getChildByName('CapBadge');
      if (!this._capBadgeNode) {
        this._capBadgeNode = new Node('CapBadge');
        this._capBadgeNode.layer = this.node.layer;
        this._capBadgeNode.setParent(this.node);
        const trans = this._capBadgeNode.addComponent(UITransform);
        trans.setContentSize(36, 18);
        this._capBadgeNode.addComponent(Sprite);
        this._capBadgeNode.setPosition(0, -78, 0);
      }
    }

    // 7. 隐藏旧的黄色大煎蛋徽章节点
    if (!this._mysteryBadgeNode) {
      this._mysteryBadgeNode = this.node.getChildByName('MysteryBadge');
    }
    if (this._mysteryBadgeNode) {
      this._mysteryBadgeNode.active = false;
    }
  }

  public init(index: number, bottle: Bottle, isVariedHeight: boolean = false) {
    this.autoBindNodes();
    this.ensureSpecialNodes();
    this._initialPos.set(this.node.position);
    this._index = index;
    this._bottleData = bottle;
    this._isVariedHeight = isVariedHeight;
    this._drainUnits = 0;
    this._risingUnits = 0;
    this._risingColorId = null;

    this.node.angle = 0;
    // 保留 GameBoard 赋予的精巧布局缩放
    this.node.active = !bottle.removed;

    const isCat = !!bottle.isGiantCat;
    const maxCap = bottle.maxCap || (isCat ? 8 : 4);
    const trans = this.node.getComponent(UITransform);
    if (trans) {
      if (isCat) {
        trans.setContentSize(116, 210);
      } else {
        const heightMap: Record<number, number> = { 2: 130, 4: 180, 6: 210, 8: 250 };
        trans.setContentSize(68, heightMap[maxCap] || 180);
      }
    }

    this.updateGlassBodySkin();
    this.renderLayers();
    this.updateCorkState();
    this.updateBadgeState();
    this.updateSpecialVisuals();
  }

  /**
   * 根据瓶型装配专属高奢玻璃皮 (灵猫水晶瓶 / 备用粉紫发光霓裳 / 经典水晶琉璃)
   */
  private updateGlassBodySkin() {
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
  }

  public get bottle(): Bottle {
    return this._bottleData;
  }

  public get index(): number {
    return this._index;
  }

  public get isSelected(): boolean {
    return this._isSelected;
  }

  public setSelected(selected: boolean) {
    this._isSelected = selected;
    tween(this.node).stop();
    if (selected) {
      const upPos = new Vec3(this._initialPos.x, this._initialPos.y + 22, this._initialPos.z);
      tween(this.node).to(0.18, { position: upPos }, { easing: 'backOut' }).start();
    } else {
      tween(this.node).to(0.16, { position: this._initialPos }, { easing: 'quadOut' }).start();
    }
  }

  private getLiquidSurfaceC(height: number, slope: number, yMin: number, yMax: number, W: number): number {
    const availableH = yMax - yMin;
    const clampedH = Math.max(0, Math.min(availableH, height));

    if (Math.abs(slope) < 0.001) {
      return yMin + clampedH;
    }

    const targetArea = 2 * W * clampedH;
    let low = yMin - Math.abs(slope) * W;
    let high = yMax + Math.abs(slope) * W;

    const steps = 14;
    const dx = (2 * W) / steps;

    for (let iter = 0; iter < 12; iter++) {
      const mid = (low + high) * 0.5;
      let area = 0;
      for (let s = 0; s < steps; s++) {
        const x = -W + (s + 0.5) * dx;
        const y = Math.max(yMin, Math.min(yMax, slope * x + mid));
        area += (y - yMin) * dx;
      }
      if (area < targetArea) low = mid;
      else high = mid;
    }
    return (low + high) * 0.5;
  }

  private lerpColor(c1: Color, c2: Color, t: number): Color {
    t = Math.max(0, Math.min(1, t));
    return new Color(
      Math.round(c1.r + (c2.r - c1.r) * t),
      Math.round(c1.g + (c2.g - c1.g) * t),
      Math.round(c1.b + (c2.b - c1.b) * t),
      Math.round(c1.a + (c2.a - c1.a) * t)
    );
  }

  private getOrCreateMysteryLabel(idx: number): Node {
    if (!this._mysteryLabels[idx]) {
      const lblNode = new Node(\`MysteryLabel_\${idx}\`);
      lblNode.layer = this.node.layer;
      lblNode.setParent(this.node);
      const trans = lblNode.addComponent(UITransform);
      trans.setContentSize(30, 30);
      const lbl = lblNode.addComponent(Label);
      lbl.string = '?';
      lbl.fontSize = 20;
      lbl.lineHeight = 22;
      lbl.isBold = true;
      lbl.color = new Color(255, 255, 255, 255);
      this._mysteryLabels[idx] = lblNode;
    }
    return this._mysteryLabels[idx];
  }

  /**
   * 核心流体渲染：100% 对齐原版星光琉璃画质与灵猫大瓶
   */
  public renderLayers() {
    if (!this._bottleData || !this._liquidGraphics || this._bottleData.removed) return;
    const g = this._liquidGraphics;
    g.clear();

    const layers = this._bottleData.layers;
    const isCat = !!this._bottleData.isGiantCat;
    const maxCap = this._bottleData.maxCap || (isCat ? 8 : 4);

    if (layers.length === 0 && this._risingUnits <= 0) {
      // 隐藏所有问号
      this._mysteryLabels.forEach((lbl) => (lbl.active = false));
      return;
    }

    // 几何尺寸：灵猫大瓶内部宽阔温润，普通瓶标准直筒
    const W = isCat ? 38 : TUBE_HALF_WIDTH;
    const yMin = isCat ? -76 : -72;
    const yMax = isCat ? 46 : 42;
    const availableH = yMax - yMin;
    const layerH = availableH / maxCap;

    const rad = (this.node.angle * Math.PI) / 180;
    const slope = -Math.tan(rad);
    const absAngle = Math.abs(this.node.angle);

    const layerHeights: number[] = [];
    let remainingDrain = this._drainUnits;

    for (let i = 0; i < layers.length; i++) {
      let h = layerH;
      const revIdx = layers.length - 1 - i;
      if (revIdx === 0 && remainingDrain > 0) {
        const drainH = Math.min(h, remainingDrain * layerH);
        h -= drainH;
        remainingDrain -= drainH / layerH;
      }
      layerHeights.push(Math.max(0, h));
    }

    const cumulativeHeights: number[] = [0];
    let runningTotal = 0;
    for (let i = 0; i < layerHeights.length; i++) {
      runningTotal += layerHeights[i];
      cumulativeHeights.push(runningTotal);
    }

    if (this._risingUnits > 0 && this._risingColorId) {
      runningTotal += this._risingUnits * layerH;
      cumulativeHeights.push(runningTotal);
    }

    const totalDrawLayers = layers.length + (this._risingUnits > 0 && this._risingColorId ? 1 : 0);
    const mysteryCount = this._bottleData.mysteryCount || 0;

    const SLICES = 5;
    const sliceStops = [0, 0.20, 0.55, 0.82, 1.0];

    // 记录盲盒层中心高度
    const mysteryCenters: number[] = [];

    for (let i = 0; i < totalDrawLayers; i++) {
      const isRisingLayer = i === layers.length;
      const colorId = isRisingLayer ? this._risingColorId! : layers[i];
      const hPrev = cumulativeHeights[i];
      const hCurr = cumulativeHeights[i + 1];

      if (hCurr - hPrev <= 0.5) continue;

      const isMystery = !isRisingLayer && i < mysteryCount;
      const cDef = getColor(isMystery ? 'mystery_dark' : colorId);

      const colLeft = Color.fromHEX(new Color(), cDef.left);
      const colMid = Color.fromHEX(new Color(), cDef.mid);
      const colHigh = Color.fromHEX(new Color(), cDef.highlight);
      const colRight = Color.fromHEX(new Color(), cDef.right);
      const colTopLight = Color.fromHEX(new Color(), cDef.topLight);
      const colTopRim = Color.fromHEX(new Color(), cDef.topRim);

      const cTop = this.getLiquidSurfaceC(hCurr, slope, yMin, yMax, W);
      const cBot = this.getLiquidSurfaceC(hPrev, slope, yMin, yMax, W);

      if (isMystery && absAngle < 8) {
        mysteryCenters.push((cTop + cBot) * 0.5);
      }

      // 1. 3D 圆柱面细分光影渐变切片
      for (let s = 0; s < SLICES; s++) {
        const u0 = sliceStops[s];
        const u1 = sliceStops[s + 1];
        const uMid = (u0 + u1) * 0.5;

        const x0 = -W + u0 * (2 * W);
        const x1 = -W + u1 * (2 * W);

        let sliceCol: Color;
        if (uMid < 0.20) {
          sliceCol = this.lerpColor(colLeft, colMid, uMid / 0.20);
        } else if (uMid < 0.65) {
          sliceCol = colMid;
        } else if (uMid < 0.82) {
          sliceCol = this.lerpColor(colMid, colHigh, (uMid - 0.65) / 0.17);
        } else {
          sliceCol = this.lerpColor(colHigh, colRight, (uMid - 0.82) / 0.18);
        }

        const yTop0 = Math.min(yMax, slope * x0 + cTop);
        const yTop1 = Math.min(yMax, slope * x1 + cTop);

        let yBot0: number;
        let yBot1: number;
        if (i === 0) {
          const norm0 = Math.abs(x0 / W);
          const norm1 = Math.abs(x1 / W);
          const curveDepth = isCat ? 18 : 16;
          const uCurve0 = yMin - curveDepth * Math.sqrt(Math.max(0, 1 - norm0 * norm0));
          const uCurve1 = yMin - curveDepth * Math.sqrt(Math.max(0, 1 - norm1 * norm1));
          yBot0 = Math.min(yTop0, uCurve0);
          yBot1 = Math.min(yTop1, uCurve1);
        } else {
          yBot0 = Math.min(yTop0, slope * x0 + cBot);
          yBot1 = Math.min(yTop1, slope * x1 + cBot);
        }

        if (yTop0 <= yBot0 && yTop1 <= yBot1) continue;

        g.fillColor = sliceCol;
        g.moveTo(x0, yTop0);
        g.lineTo(x1, yTop1);
        g.lineTo(x1, yBot1);
        g.lineTo(x0, yBot0);
        g.close();
        g.fill();
      }

      // 2. 右侧通透折射反光条
      const sheenX0 = W * 0.35;
      const sheenX1 = W * 0.68;
      const sheenTop0 = Math.min(yMax, slope * sheenX0 + cTop);
      const sheenTop1 = Math.min(yMax, slope * sheenX1 + cTop);
      const sheenBot0 = (i === 0) ? yMin - 12 : Math.min(sheenTop0, slope * sheenX0 + cBot);
      const sheenBot1 = (i === 0) ? yMin - 12 : Math.min(sheenTop1, slope * sheenX1 + cBot);

      if (sheenTop0 > sheenBot0 + 2) {
        g.fillColor = new Color(255, 255, 255, 42);
        g.moveTo(sheenX0, sheenTop0 - 0.5);
        g.lineTo(sheenX1, sheenTop1 - 0.5);
        g.lineTo(sheenX1, sheenBot1 + 0.5);
        g.lineTo(sheenX0, sheenBot0 + 0.5);
        g.close();
        g.fill();
      }

      // 3. 顶层 2.5D 平躺椭圆盘
      const isTopMost = i === totalDrawLayers - 1;
      if (isTopMost) {
        if (absAngle < 6) {
          const midY = Math.min(yMax, cTop);
          const rx = W - 0.6;
          const ry = isCat ? 5.2 : 4.2;

          g.fillColor = colTopRim;
          g.ellipse(0, midY, rx, ry);
          g.fill();

          g.fillColor = this.lerpColor(colTopLight, new Color(255, 255, 255, 255), 0.5);
          g.ellipse(0, midY + 0.5, rx * 0.8, ry * 0.55);
          g.fill();

          g.strokeColor = new Color(255, 255, 255, 230);
          g.lineWidth = 1.2;
          g.arc(0, midY, rx, ry, 0, Math.PI, false);
          g.stroke();
        } else {
          const yL = Math.min(yMax, -slope * W + cTop);
          const yR = Math.min(yMax, slope * W + cTop);
          g.strokeColor = new Color(255, 255, 255, 220);
          g.lineWidth = 1.6;
          g.moveTo(-W, yL);
          g.lineTo(W, yR);
          g.stroke();
        }
      } else {
        const yL = Math.min(yMax, -slope * W + cBot);
        const yR = Math.min(yMax, slope * W + cBot);
        g.strokeColor = new Color(0, 0, 0, 38);
        g.lineWidth = 1.0;
        g.moveTo(-W, yL);
        g.lineTo(W, yR);
        g.stroke();
      }
    }

    // 4. 精确更新盲盒层的居中纯白 ? 文字 (100% 对齐 HTML 原生纯净视觉)
    for (let m = 0; m < mysteryCenters.length; m++) {
      const lblNode = this.getOrCreateMysteryLabel(m);
      lblNode.active = true;
      lblNode.setPosition(0, mysteryCenters[m], 0);
    }
    for (let m = mysteryCenters.length; m < this._mysteryLabels.length; m++) {
      this._mysteryLabels[m].active = false;
    }
  }

  public playPourTo(targetWorldPos: Vec3, duration: number = 0.45): Promise<void> {
    return new Promise((resolve) => {
      const parentTrans = this.node.parent?.getComponent(UITransform);
      const localTarget = parentTrans
        ? parentTrans.convertToNodeSpaceAR(targetWorldPos)
        : targetWorldPos;

      const isTargetRight = localTarget.x >= this.node.position.x;
      const hoverOffset = isTargetRight ? -52 : 52;
      const targetAngle = isTargetRight ? -65 : 65;
      const hoverPos = new Vec3(localTarget.x + hoverOffset, localTarget.y + 115, 0);

      tween(this.node)
        .to(duration * 0.55, { position: hoverPos }, { easing: 'quadOut' })
        .to(duration * 0.45, { angle: targetAngle }, {
          easing: 'sineOut',
          onUpdate: () => this.renderLayers(),
        })
        .call(() => resolve())
        .start();
    });
  }

  public animateDrainTopLayer(count: number, duration: number = 0.42): Promise<void> {
    return this.playDrainStep(count, duration);
  }

  public animateRiseNewLayer(colorId: ColorKey, count: number, duration: number = 0.42): Promise<void> {
    return this.playRisingStep(colorId, count, duration);
  }

  public playTilt(targetAngle: number, duration: number = 0.28): Promise<void> {
    return new Promise((resolve) => {
      tween(this.node)
        .to(duration, { angle: targetAngle }, {
          easing: 'sineOut',
          onUpdate: () => this.renderLayers(),
        })
        .call(() => resolve())
        .start();
    });
  }

  public playDrainStep(count: number, duration: number = 0.42): Promise<void> {
    return new Promise((resolve) => {
      const obj = { p: 0 };
      tween(obj)
        .to(
          duration,
          { p: count },
          {
            onUpdate: () => {
              this._drainUnits = obj.p;
              this.renderLayers();
            },
          }
        )
        .call(() => {
          this._drainUnits = 0;
          resolve();
        })
        .start();
    });
  }

  public playRisingStep(colorId: ColorKey, count: number, duration: number = 0.42): Promise<void> {
    return new Promise((resolve) => {
      this._risingColorId = colorId;
      const obj = { p: 0 };
      tween(obj)
        .to(
          duration,
          { p: count },
          {
            onUpdate: () => {
              this._risingUnits = obj.p;
              this.renderLayers();
            },
          }
        )
        .call(() => {
          this._risingUnits = 0;
          this._risingColorId = null;
          resolve();
        })
        .start();
    });
  }

  public playReturn(): Promise<void> {
    return new Promise((resolve) => {
      tween(this.node)
        .to(0.22, { angle: 0 }, { easing: 'sineOut' })
        .to(0.25, { position: this._initialPos }, { easing: 'quadOut' })
        .call(() => {
          this._isSelected = false;
          resolve();
        })
        .start();
    });
  }

  public updateCorkState(corked?: boolean) {
    if (!this._bottleData) return;
    if (typeof corked === 'boolean') {
      this._bottleData.corked = corked;
    }
    if (this.corkNode) {
      const isCorked = !!this._bottleData.corked;
      this.corkNode.active = isCorked;
      if (isCorked) {
        const isCat = !!this._bottleData.isGiantCat;
        this.corkNode.setPosition(0, isCat ? 102 : 78, 0);
      }
    }
  }

  public playCorkDropAnimation(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.corkNode) {
        this.updateCorkState(true);
        resolve();
        return;
      }
      const isCat = !!this._bottleData.isGiantCat;
      const targetY = isCat ? 102 : 78;
      this.corkNode.active = true;
      this.corkNode.setPosition(0, targetY + 80, 0);
      this.corkNode.setScale(new Vec3(1, 1.3, 1));

      tween(this.corkNode)
        .to(0.22, { position: new Vec3(0, targetY, 0), scale: new Vec3(1.15, 0.85, 1) }, { easing: 'cubicIn' })
        .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
        .call(() => {
          this.updateCorkState(true);
          resolve();
        })
        .start();
    });
  }

  public updateBadgeState() {
    if (!this._bottleData) return;
    const isSpecialBadge = (this._bottleData.special === 'ad_cam' || this._bottleData.special === 'ad_cam_blue') && !this._bottleData.isGiantCat;
    if (this.videoBadgeNode) {
      this.videoBadgeNode.active = isSpecialBadge;
      if (isSpecialBadge) {
        this.videoBadgeNode.setPosition(0, -10, 0);
        this.videoBadgeNode.setScale(Vec3.ONE);
      }
    }
  }

  public updateSpecialVisuals() {
    if (!this._bottleData) return;
    const special = this._bottleData.special;
    const maxCap = this._bottleData.maxCap || 4;
    const isCat = !!this._bottleData.isGiantCat;

    // 1. 彻底禁用旧版黄色大煎蛋徽章，由 renderLayers 绘制极简纯白 ?
    if (this._mysteryBadgeNode) {
      this._mysteryBadgeNode.active = false;
    }

    // 2. 瓶底立体底座 (ice_base / paper_bag)，灵猫瓶绝对无底座
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
          this._obstacleBaseLabel.string = this._bottleData.poursRemaining ? \`\${this._bottleData.poursRemaining}次\` : '';
          this._obstacleBaseLabel.node.setPosition(0, isIce ? -8 : -24, 0);
        }
      }
    }

    // 3. 瓶底层数胶囊 (CapBadge: 2层, 4层, 6层)
    // 关键对齐：仅在异形瓶关卡 (isVariedHeight) 且非灵猫瓶时才显示！普通关卡绝对不显示！
    if (this._capBadgeNode) {
      const showCapBadge = this._isVariedHeight && !isCat;
      this._capBadgeNode.active = showCapBadge;
      if (showCapBadge) {
        const sp = this._capBadgeNode.getComponent(Sprite);
        const badgeUuid = maxCap === 2 ? ASSET_UUIDS.cap2 : (maxCap === 6 ? ASSET_UUIDS.cap6 : ASSET_UUIDS.cap4);
        if (sp) {
          assetManager.loadAny(badgeUuid, (err, sf: SpriteFrame) => {
            if (!err && sf && sp.isValid) sp.spriteFrame = sf;
          });
        }
      }
    }
  }
}
`;

fs.writeFileSync(path.join(cocosRoot, 'assets/scripts/ui/TubeView.ts'), tubeViewContent, 'utf8');
console.log('✓ Successfully updated TubeView.ts');

// ==========================================
// 2. 重构 GameBoard.ts
// ==========================================
const gameBoardContent = `import { _decorator, Component, Node, instantiate, Vec3, UITransform } from 'cc';
import { Bottle } from '../core/types';
import { TubeView } from './TubeView';

const { ccclass, property } = _decorator;

@ccclass('GameBoard')
export class GameBoard extends Component {
  private _tubes: TubeView[] = [];
  private _onTubeClickedCallback: ((index: number) => void) | null = null;

  public init(bottles: Bottle[], onTubeClicked: (index: number) => void) {
    this._onTubeClickedCallback = onTubeClicked;
    this._tubes = [];

    // 获取当前已有的 Tube 节点
    let tubeNodes = this.node.children.filter((c) => c.name.startsWith('Tube_'));
    tubeNodes.sort((a, b) => {
      const numA = parseInt(a.name.replace(/\\D/g, ''), 10) || 0;
      const numB = parseInt(b.name.replace(/\\D/g, ''), 10) || 0;
      return numA - numB;
    });

    // 节点数量不足时自动克隆
    if (tubeNodes.length < bottles.length && tubeNodes.length > 0) {
      const template = tubeNodes[0];
      const needed = bottles.length - tubeNodes.length;
      for (let i = 0; i < needed; i++) {
        const newIdx = tubeNodes.length;
        const newNode = instantiate(template);
        newNode.name = \`Tube_\${newIdx}\`;
        newNode.setParent(this.node);
        tubeNodes.push(newNode);
      }
    }

    const total = bottles.length;
    const isCatBoss = bottles.some((b) => b.isGiantCat);
    const isVariedHeight = !isCatBoss && bottles.some((b) => b.maxCap && b.maxCap !== 4);

    // ========================================================
    // A. 皇家灵猫 BOSS 关 (第 5 关等)：中央矗立灵猫大瓶，外围 8 瓶环绕
    // ========================================================
    if (isCatBoss) {
      // 找到灵猫大瓶下标（通常为 id 2）
      const catIdx = bottles.findIndex((b) => b.isGiantCat);
      const otherIndices = bottles.map((_, i) => i).filter((i) => i !== catIdx);

      // 外围 8 个普通瓶的精确环绕坐标 (给中央大猫留出完整的黄金舞台，杜绝切脸和重叠遮挡)
      const outerLayout: { x: number; y: number }[] = [
        { x: -200, y: 115 }, // 左上 1 (外)
        { x: -126, y: 115 }, // 左上 2 (内，距大猫左边缘有 35px 留白！)
        { x: 126,  y: 115 }, // 右上 1 (内，距大猫右边缘有 35px 留白！)
        { x: 200,  y: 115 }, // 右上 2 (外)
        { x: -200, y: -115 }, // 左下 1 (外)
        { x: -126, y: -115 }, // 左下 2 (内)
        { x: 126,  y: -115 }, // 右下 1 (内)
        { x: 200,  y: -115 }, // 右下 2 (外)
      ];

      tubeNodes.forEach((node, idx) => {
        if (idx < bottles.length) {
          node.active = !bottles[idx].removed;

          let view = node.getComponent(TubeView);
          if (!view) view = node.addComponent(TubeView);

          if (idx === catIdx) {
            // 灵猫大瓶居中：(0, 0)，比例 1.0 完美展现
            node.setPosition(0, 0, 0);
            node.setScale(new Vec3(1.0, 1.0, 1));
          } else {
            // 外围环绕普通瓶
            const ringPosIdx = otherIndices.indexOf(idx);
            const pos = outerLayout[ringPosIdx] || { x: 0, y: 0 };
            node.setPosition(pos.x, pos.y, 0);
            node.setScale(new Vec3(0.82, 0.82, 1));
          }

          view.init(idx, bottles[idx], isVariedHeight);
          this._tubes[idx] = view;

          node.off(Node.EventType.TOUCH_END);
          node.on(Node.EventType.TOUCH_END, () => {
            if (this._onTubeClickedCallback) {
              this._onTubeClickedCallback(idx);
            }
          });
        } else {
          node.active = false;
        }
      });
      return;
    }

    // ========================================================
    // B. 普通关卡双排/三排优雅布局：充足间距，绝无重叠穿插！
    // ========================================================
    let numRows = 1;
    if (total > 14) numRows = 3;
    else if (total > 5) numRows = 2;

    const itemsPerRow = Math.ceil(total / numRows);
    const spacingX = total > 12 ? 66 : total > 7 ? 74 : 84;
    // 双排中心间距拉大至 230，试管缩放 0.84，留出 55px 纯净呼吸间隔！
    const rowYOffsets =
      numRows === 3 ? [132, 0, -132] : numRows === 2 ? [115, -115] : [0];
    const tubeScale = numRows === 3 ? 0.76 : numRows === 2 ? 0.84 : 1.0;

    tubeNodes.forEach((node, idx) => {
      if (idx < bottles.length) {
        node.active = !bottles[idx].removed;

        const rowIndex = Math.floor(idx / itemsPerRow);
        const colIndex = idx % itemsPerRow;
        const countInThisRow = Math.min(itemsPerRow, total - rowIndex * itemsPerRow);
        const startX = -((countInThisRow - 1) * spacingX) / 2;
        const posX = startX + colIndex * spacingX;
        const posY = rowYOffsets[rowIndex] || 0;

        node.setPosition(posX, posY, 0);
        node.setScale(new Vec3(tubeScale, tubeScale, 1));

        let view = node.getComponent(TubeView);
        if (!view) {
          view = node.addComponent(TubeView);
        }

        view.init(idx, bottles[idx], isVariedHeight);
        this._tubes[idx] = view;

        node.off(Node.EventType.TOUCH_END);
        node.on(Node.EventType.TOUCH_END, () => {
          if (this._onTubeClickedCallback) {
            this._onTubeClickedCallback(idx);
          }
        });
      } else {
        node.active = false;
      }
    });
  }

  public getTube(index: number): TubeView | undefined {
    return this._tubes[index];
  }

  public getAllTubes(): TubeView[] {
    return this._tubes;
  }
}
`;

fs.writeFileSync(path.join(cocosRoot, 'assets/scripts/ui/GameBoard.ts'), gameBoardContent, 'utf8');
console.log('✓ Successfully updated GameBoard.ts');
