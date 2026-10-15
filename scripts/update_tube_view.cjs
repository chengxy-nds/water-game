const fs = require('fs');
const path = require('path');

const targetPath = 'E:/GithubProjects/water-game-cocos/assets/scripts/ui/TubeView.ts';

const content = `import { _decorator, Component, Node, Sprite, Color, tween, Vec3, UITransform, Graphics, Label } from 'cc';
import { Bottle, ColorKey } from '../core/types';
import { getColor } from '../core/colors';
import { getBottleLayerMetrics, getNeckOffsetY, getPhysicalSpillAngleDeg } from '../physics/liquidMath';

const { ccclass, property } = _decorator;

const TUBE_HALF_WIDTH = 25.5; // 试管内壁半宽，匹配超清 4x 玻璃瓶内壁

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
  private _specialCoverNode: Node | null = null;
  private _specialCoverLabel: Label | null = null;
  private _obstacleBaseNode: Node | null = null;
  private _obstacleBaseLabel: Label | null = null;

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
    // 隐藏旧场景静态遗留
    for (const child of this.node.children) {
      if (child.name.startsWith('Liquid_')) {
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
        if (this.bottleBody) {
          this._liquidGraphicsNode.setSiblingIndex(this.bottleBody.getSiblingIndex());
        }
      }
      this._liquidGraphics =
        this._liquidGraphicsNode.getComponent(Graphics) ||
        this._liquidGraphicsNode.addComponent(Graphics);
    }

    // 2. 备用瓶电影场记板节点 (VideoBadge)
    if (!this.videoBadgeNode) {
      this.videoBadgeNode = this.node.getChildByName('VideoBadge')!;
      if (!this.videoBadgeNode) {
        this.videoBadgeNode = new Node('VideoBadge');
        this.videoBadgeNode.layer = this.node.layer;
        this.videoBadgeNode.setParent(this.node);
        const trans = this.videoBadgeNode.addComponent(UITransform);
        trans.setContentSize(52, 52);
        this.videoBadgeNode.addComponent(Sprite);
        this.videoBadgeNode.setPosition(0, 0, 0);
      }
    }

    // 3. 原木软木塞节点 (Cork)
    if (!this.corkNode) {
      this.corkNode = this.node.getChildByName('Cork')!;
      if (!this.corkNode) {
        this.corkNode = new Node('Cork');
        this.corkNode.layer = this.node.layer;
        this.corkNode.setParent(this.node);
        const trans = this.corkNode.addComponent(UITransform);
        trans.setContentSize(42, 32);
        this.corkNode.addComponent(Sprite);
        this.corkNode.setPosition(0, 72, 0);
      }
    }

    // 4. 特殊遮罩层节点 (silk_drape / full_ice / paper_bag)
    if (!this._specialCoverNode) {
      this._specialCoverNode = this.node.getChildByName('SpecialCover');
      if (!this._specialCoverNode) {
        this._specialCoverNode = new Node('SpecialCover');
        this._specialCoverNode.layer = this.node.layer;
        this._specialCoverNode.setParent(this.node);
        const sp = this._specialCoverNode.addComponent(Sprite);
        sp.color = new Color(220, 235, 255, 230);
        const trans = this._specialCoverNode.getComponent(UITransform)!;
        trans.setContentSize(60, 140);
        this._specialCoverNode.setPosition(0, 0, 0);

        const lblNode = new Node('UnlockOrderLabel');
        lblNode.layer = this.node.layer;
        lblNode.setParent(this._specialCoverNode);
        lblNode.setPosition(0, 0, 0);
        this._specialCoverLabel = lblNode.addComponent(Label);
        this._specialCoverLabel.fontSize = 22;
        this._specialCoverLabel.color = new Color(40, 60, 110, 255);
      } else {
        const lblNode = this._specialCoverNode.getChildByName('UnlockOrderLabel');
        this._specialCoverLabel = lblNode?.getComponent(Label) || null;
      }
    }

    // 5. 特殊底座节点 (ice_base / stone_base)
    if (!this._obstacleBaseNode) {
      this._obstacleBaseNode = this.node.getChildByName('ObstacleBase');
      if (!this._obstacleBaseNode) {
        this._obstacleBaseNode = new Node('ObstacleBase');
        this._obstacleBaseNode.layer = this.node.layer;
        this._obstacleBaseNode.setParent(this.node);
        const sp = this._obstacleBaseNode.addComponent(Sprite);
        sp.color = new Color(125, 211, 252, 240);
        const trans = this._obstacleBaseNode.getComponent(UITransform)!;
        trans.setContentSize(68, 32);
        this._obstacleBaseNode.setPosition(0, -68, 0);

        const lblNode = new Node('PoursCountLabel');
        lblNode.layer = this.node.layer;
        lblNode.setParent(this._obstacleBaseNode);
        lblNode.setPosition(0, 0, 0);
        this._obstacleBaseLabel = lblNode.addComponent(Label);
        this._obstacleBaseLabel.fontSize = 18;
        this._obstacleBaseLabel.color = new Color(15, 23, 42, 255);
      } else {
        const lblNode = this._obstacleBaseNode.getChildByName('PoursCountLabel');
        this._obstacleBaseLabel = lblNode?.getComponent(Label) || null;
      }
    }
  }

  public init(index: number, bottle: Bottle) {
    this.autoBindNodes();
    this.ensureSpecialNodes();
    this._initialPos.set(this.node.position);
    this._index = index;
    this._bottleData = bottle;
    this._drainUnits = 0;
    this._risingUnits = 0;
    this._risingColorId = null;

    this.node.angle = 0;
    this.node.setScale(Vec3.ONE);
    this.node.active = !bottle.removed;

    // 自适应高度与瓶型适配
    const maxCap = bottle.maxCap || 4;
    const trans = this.node.getComponent(UITransform);
    if (trans) {
      const heightMap: Record<number, number> = { 2: 120, 4: 170, 6: 200, 8: 240 };
      trans.setContentSize(68, heightMap[maxCap] || 170);
    }

    this.renderLayers();
    this.updateCorkState();
    this.updateBadgeState();
    this.updateSpecialVisuals();
  }

  public get bottle(): Bottle {
    return this._bottleData;
  }

  public get index(): number {
    return this._index;
  }

  update() {
    if (this.node.angle !== 0 || this._drainUnits > 0 || this._risingUnits > 0) {
      this.renderLayers();
    }
  }

  /**
   * 重力液面二分找平：严格体积守恒
   */
  private findSurfaceC(targetHeight: number, slope: number, yMin: number, yMax: number): number {
    const W = TUBE_HALF_WIDTH;
    const maxH = yMax - yMin;

    if (targetHeight <= 0.05) return yMin - Math.abs(slope) * W - 100;
    if (targetHeight >= maxH) return yMax + Math.abs(slope) * W + 100;

    const targetArea = 2 * W * targetHeight;
    let low = yMin - Math.abs(slope) * W - maxH;
    let high = yMax + Math.abs(slope) * W + maxH;

    const steps = 16;
    const dx = (2 * W) / steps;

    for (let iter = 0; iter < 14; iter++) {
      const mid = (low + high) * 0.5;
      let area = 0;
      for (let s = 0; s < steps; s++) {
        const x = -W + (s + 0.5) * dx;
        const y = Math.max(yMin, Math.min(yMax, slope * x + mid));
        area += (y - yMin) * dx;
      }
      if (area < targetArea) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) * 0.5;
  }

  /**
   * 颜色线性插值辅助函数
   */
  private lerpColor(c1: Color, c2: Color, t: number): Color {
    t = Math.max(0, Math.min(1, t));
    return new Color(
      c1.r + (c2.r - c1.r) * t,
      c1.g + (c2.g - c1.g) * t,
      c1.b + (c2.b - c1.b) * t,
      c1.a + (c2.a - c1.a) * t
    );
  }

  /**
   * 核心流体渲染：蜕变升级为 3D 圆柱立体渐变 + 2.5D 平躺椭圆盘光泽
   */
  public renderLayers() {
    if (!this._bottleData || !this._liquidGraphics || this._bottleData.removed) return;
    const g = this._liquidGraphics;
    g.clear();

    const layers = this._bottleData.layers;
    if (layers.length === 0 && this._risingUnits <= 0) return;

    const maxCap = this._bottleData.maxCap || 4;
    const W = TUBE_HALF_WIDTH;
    const trans = this.node.getComponent(UITransform);
    const boxH = trans ? trans.height : 170;
    
    // 液体腔高度基准
    const yMin = -boxH * 0.43;
    const yMax = boxH * 0.35;
    const availableH = yMax - yMin;
    const layerH = availableH / maxCap;

    const rad = (this.node.angle * Math.PI) / 180;
    const slope = -Math.tan(rad);
    const absAngle = Math.abs(this.node.angle);

    // 计算流出缩减
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

    // 细分切片定义：5 阶段圆柱立体着色 (对应 HTML 原型 left -> mid -> highlight -> right)
    // u 代表从左 (-W) 到右 (+W) 的比例 [0, 1]
    const SLICES = 6;
    const sliceStops = [0, 0.20, 0.50, 0.72, 0.86, 1.0];

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

      const cTop = this.findSurfaceC(hCurr, slope, yMin, yMax);
      const cBot = this.findSurfaceC(hPrev, slope, yMin, yMax);

      // 1. 绘制 3D 圆柱面细分切片 (从左至右渐变)
      for (let s = 0; s < SLICES; s++) {
        const u0 = sliceStops[s];
        const u1 = sliceStops[s + 1];
        const uMid = (u0 + u1) * 0.5;

        const x0 = -W + u0 * (2 * W);
        const x1 = -W + u1 * (2 * W);

        // 计算当前切片中心对应的插值颜色
        let sliceCol: Color;
        if (uMid < 0.20) {
          sliceCol = this.lerpColor(colLeft, colMid, uMid / 0.20);
        } else if (uMid < 0.65) {
          sliceCol = colMid;
        } else if (uMid < 0.84) {
          sliceCol = this.lerpColor(colMid, colHigh, (uMid - 0.65) / 0.19);
        } else {
          sliceCol = this.lerpColor(colHigh, colRight, (uMid - 0.84) / 0.16);
        }

        // 顶线 y 坐标
        const yTop0 = Math.max(yMin, Math.min(yMax, slope * x0 + cTop));
        const yTop1 = Math.max(yMin, Math.min(yMax, slope * x1 + cTop));

        // 底线 y 坐标 (如果是最底层 i === 0，叠加 U 型瓶底弧线)
        let yBot0: number;
        let yBot1: number;
        if (i === 0) {
          const norm0 = x0 / W;
          const norm1 = x1 / W;
          const uCurve0 = yMin + 7.5 * (norm0 * norm0);
          const uCurve1 = yMin + 7.5 * (norm1 * norm1);
          yBot0 = Math.min(yTop0, uCurve0);
          yBot1 = Math.min(yTop1, uCurve1);
        } else {
          yBot0 = Math.max(yMin, Math.min(yMax, slope * x0 + cBot));
          yBot1 = Math.max(yMin, Math.min(yMax, slope * x1 + cBot));
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

      // 2. 水体右侧高光通透折射竖条 (带半透明水晶光泽)
      const sheenX0 = W * 0.40;
      const sheenX1 = W * 0.72;
      const sheenTop0 = Math.max(yMin, Math.min(yMax, slope * sheenX0 + cTop));
      const sheenTop1 = Math.max(yMin, Math.min(yMax, slope * sheenX1 + cTop));
      let sheenBot0 = (i === 0) ? yMin + 7.5 * (0.4 * 0.4) : Math.max(yMin, Math.min(yMax, slope * sheenX0 + cBot));
      let sheenBot1 = (i === 0) ? yMin + 7.5 * (0.72 * 0.72) : Math.max(yMin, Math.min(yMax, slope * sheenX1 + cBot));

      if (sheenTop0 > sheenBot0 + 2) {
        g.fillColor = new Color(255, 255, 255, 38);
        g.moveTo(sheenX0, sheenTop0 - 1);
        g.lineTo(sheenX1, sheenTop1 - 1);
        g.lineTo(sheenX1, sheenBot1 + 1);
        g.lineTo(sheenX0, sheenBot0 + 1);
        g.close();
        g.fill();
      }

      // 3. 顶层 2.5D 平躺椭圆盘 (Meniscus Disc)
      const isTopMost = i === totalDrawLayers - 1;
      if (isTopMost) {
        if (absAngle < 8) {
          // 静止/微倾状态：绘制高精 2.5D 平躺椭圆盘
          const midY = cTop;
          const rx = W - 0.4;
          const ry = 4.8;

          // 椭圆底盘
          g.fillColor = colTopRim;
          g.ellipse(0, midY, rx, ry);
          g.fill();

          // 椭圆上层亮心
          g.fillColor = this.lerpColor(colTopLight, new Color(255, 255, 255, 255), 0.45);
          g.ellipse(0, midY + 0.6, rx * 0.82, ry * 0.58);
          g.fill();

          // 顶部纤细晶莹高光线
          g.strokeColor = new Color(255, 255, 255, 230);
          g.lineWidth = 1.3;
          g.arc(0, midY, rx, ry, 0, Math.PI, false);
          g.stroke();
        } else {
          // 倾斜倒水状态：沿波浪液面绘制高光流体线
          g.strokeColor = new Color(255, 255, 255, 220);
          g.lineWidth = 1.8;
          g.moveTo(-W, Math.max(yMin, Math.min(yMax, -slope * W + cTop)));
          g.lineTo(W, Math.max(yMin, Math.min(yMax, slope * W + cTop)));
          g.stroke();
        }
      } else {
        // 层间微弱暗调接缝
        g.strokeColor = new Color(0, 0, 0, 45);
        g.lineWidth = 1.0;
        g.moveTo(-W, Math.max(yMin, Math.min(yMax, -slope * W + cBot)));
        g.lineTo(W, Math.max(yMin, Math.min(yMax, slope * W + cBot)));
        g.stroke();
      }
    }
  }

  public setSelected(selected: boolean) {
    if (this._isSelected === selected) return;
    this._isSelected = selected;
    tween(this.node).stop();

    const targetY = selected ? this._initialPos.y + 35 : this._initialPos.y;
    tween(this.node)
      .to(0.18, { position: new Vec3(this._initialPos.x, targetY, this._initialPos.z) }, { easing: 'quadOut' })
      .start();
  }

  public calculatePourAngle(targetWorldPos: Vec3): number {
    const isTargetRight = targetWorldPos.x >= this.node.worldPosition.x;
    const remainingUnits = this._bottleData?.layers?.length || 2;
    const maxCap = this._bottleData?.maxCap || 4;
    const deg = getPhysicalSpillAngleDeg(remainingUnits, maxCap);
    return isTargetRight ? -deg : deg;
  }

  public playPourTo(targetWorldPos: Vec3): Promise<void> {
    return new Promise((resolve) => {
      const localTarget = this.node.parent!.getComponent(UITransform)!.convertToNodeSpaceAR(targetWorldPos);
      const isTargetRight = targetWorldPos.x >= this.node.worldPosition.x;
      const targetAngle = this.calculatePourAngle(targetWorldPos);

      const hoverX = isTargetRight ? localTarget.x - 36 : localTarget.x + 36;
      const hoverY = localTarget.y + 115;
      const hoverPos = new Vec3(hoverX, hoverY, 0);

      tween(this.node)
        .to(0.26, { position: hoverPos, angle: isTargetRight ? -20 : 20 }, { easing: 'quadOut' })
        .to(0.18, { angle: targetAngle }, { easing: 'cubicOut' })
        .call(() => resolve())
        .start();
    });
  }

  public animateDrainTopLayer(count = 1, duration = 0.45): Promise<void> {
    return new Promise((resolve) => {
      this._drainUnits = 0;
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

  public animateRiseLayer(colorId: ColorKey, count = 1, duration = 0.45): Promise<void> {
    return new Promise((resolve) => {
      this._risingUnits = 0;
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
        this.corkNode.setPosition(0, 75, 0);
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
      this.corkNode.active = true;
      this.corkNode.setPosition(0, 160, 0);
      this.corkNode.setScale(new Vec3(1, 1.3, 1));

      tween(this.corkNode)
        .to(0.22, { position: new Vec3(0, 75, 0), scale: new Vec3(1.15, 0.85, 1) }, { easing: 'cubicIn' })
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
    const isSpecialBadge = this._bottleData.special === 'ad_cam' || this._bottleData.special === 'ad_cam_blue';
    if (this.videoBadgeNode) {
      this.videoBadgeNode.active = isSpecialBadge;
      if (isSpecialBadge) {
        this.videoBadgeNode.setPosition(0, 0, 0);
        tween(this.videoBadgeNode).stop();
        // 柔和呼吸浮动动画
        tween(this.videoBadgeNode)
          .repeatForever(
            tween()
              .to(1.2, { scale: new Vec3(1.08, 1.08, 1) }, { easing: 'sineInOut' })
              .to(1.2, { scale: new Vec3(0.96, 0.96, 1) }, { easing: 'sineInOut' })
          )
          .start();
      }
    }
  }

  public updateSpecialVisuals() {
    if (!this._bottleData) return;
    const special = this._bottleData.special;

    // 1. 布幔/冰块覆盖层
    if (this._specialCoverNode) {
      const isCover = special === 'silk_drape' || special === 'full_ice' || special === 'paper_bag';
      this._specialCoverNode.active = isCover;
      if (isCover) {
        const sp = this._specialCoverNode.getComponent(Sprite);
        if (sp) {
          if (special === 'silk_drape') {
            sp.color = new Color(240, 248, 255, 235);
          } else if (special === 'full_ice') {
            sp.color = new Color(186, 230, 253, 220);
          } else {
            sp.color = new Color(212, 152, 94, 250); // kraft 牛皮纸袋暖棕色
          }
        }
        if (this._specialCoverLabel) {
          this._specialCoverLabel.string = this._bottleData.unlockOrder ? \`#\${this._bottleData.unlockOrder}\` : '封';
        }
      }
    }

    // 2. 底座机关
    if (this._obstacleBaseNode) {
      const isBase = special === 'ice_base' || special === 'stone_base';
      this._obstacleBaseNode.active = isBase;
      if (isBase) {
        const sp = this._obstacleBaseNode.getComponent(Sprite);
        if (sp) {
          sp.color = special === 'ice_base' ? new Color(125, 211, 252, 240) : new Color(166, 124, 82, 245);
        }
        if (this._obstacleBaseLabel) {
          this._obstacleBaseLabel.string = \`\${this._bottleData.poursRemaining || 0}次\`;
        }
      }
    }
  }
}
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('✓ Successfully updated TubeView.ts with high-definition cylindrical gradient liquid renderer!');
`;

fs.writeFileSync('e:/GithubProjects/water-game/scripts/update_tube_view.cjs', content, 'utf8');
console.log('Created update_tube_view.cjs');
