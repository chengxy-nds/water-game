const fs = require('fs');
const path = require('path');

const cocosRoot = 'E:/GithubProjects/water-game-cocos';

// ========================================================
// 1. 彻底升级 WaterStream.ts：100% 对齐原版星光重力水流与水花涟漪特效
// ========================================================
const waterStreamContent = `import { _decorator, Component, Graphics, Color, Vec3, UITransform } from 'cc';
import { getColor } from '../core/colors';

const { ccclass, property } = _decorator;

@ccclass('WaterStream')
export class WaterStream extends Component {
    private _graphics: Graphics = null!;
    private _isPouring: boolean = false;
    private _spoutPos: Vec3 = new Vec3();
    private _mouthPos: Vec3 = new Vec3();
    private _surfacePos: Vec3 = new Vec3();
    private _color: Color = Color.WHITE;
    private _lightColor: Color = Color.WHITE;
    private _topRimColor: Color = Color.WHITE;
    private _animPhase: number = 0;
    private _moveCount: number = 1;

    onLoad() {
        this._graphics = (this.getComponent(Graphics) || this.addComponent(Graphics))!;
    }

    /**
     * 开启高保真重力流体喷射与入水激荡特效
     * @param fromWorldPos 源瓶出水嘴位置
     * @param mouthOrTargetPos 目标瓶口中心
     * @param surfaceWorldPos 目标瓶内实际液面位置 (可选，为空时自适应)
     * @param colorId 液体色彩 ID
     * @param moveCount 倾倒格数
     */
    public startPour(
        fromWorldPos: Vec3,
        mouthOrTargetPos: Vec3,
        surfaceWorldPos?: Vec3 | string,
        colorId?: string,
        moveCount: number = 1
    ) {
        this._isPouring = true;
        this._animPhase = 0;
        this._moveCount = moveCount;

        if (!this._graphics) {
            this._graphics = (this.getComponent(Graphics) || this.addComponent(Graphics))!;
        }

        const uiTrans = this.getComponent(UITransform);
        if (uiTrans) {
            this._spoutPos = uiTrans.convertToNodeSpaceAR(fromWorldPos);
            this._mouthPos = uiTrans.convertToNodeSpaceAR(mouthOrTargetPos);
            if (surfaceWorldPos && typeof surfaceWorldPos !== 'string') {
                this._surfacePos = uiTrans.convertToNodeSpaceAR(surfaceWorldPos);
            } else {
                // 默认注入到瓶底上方
                this._surfacePos = new Vec3(this._mouthPos.x, this._mouthPos.y - 110, 0);
            }
        } else {
            this._spoutPos.set(fromWorldPos);
            this._mouthPos.set(mouthOrTargetPos);
            if (surfaceWorldPos && typeof surfaceWorldPos !== 'string') {
                this._surfacePos.set(surfaceWorldPos);
            } else {
                this._surfacePos = new Vec3(this._mouthPos.x, this._mouthPos.y - 110, 0);
            }
        }

        const actualColorId = typeof surfaceWorldPos === 'string' ? surfaceWorldPos : (colorId || 'blue');
        const cDef = getColor(actualColorId);
        if (cDef) {
            this._color = Color.fromHEX(new Color(), cDef.mid);
            this._lightColor = Color.fromHEX(new Color(), cDef.highlight || '#ffffff');
            this._topRimColor = Color.fromHEX(new Color(), cDef.topLight || '#ffffff');
        } else {
            this._color = new Color(56, 189, 248, 255);
            this._lightColor = new Color(186, 230, 253, 255);
            this._topRimColor = new Color(255, 255, 255, 255);
        }

        this.renderStream();
    }

    /**
     * 随目标瓶水位上涨，实时抬升入水冲击点
     */
    public updateSurfacePos(surfaceWorldPos: Vec3) {
        const uiTrans = this.getComponent(UITransform);
        if (uiTrans) {
            this._surfacePos = uiTrans.convertToNodeSpaceAR(surfaceWorldPos);
        } else {
            this._surfacePos.set(surfaceWorldPos);
        }
    }

    public stopPour() {
        this._isPouring = false;
        if (this._graphics) {
            this._graphics.clear();
        }
    }

    update(dt: number) {
        if (!this._isPouring) return;
        this._animPhase += dt * 5.2;
        this.renderStream();
    }

    public renderStream() {
        if (!this._graphics || !this._isPouring) return;
        const g = this._graphics;
        g.clear();

        const x1 = this._spoutPos.x;
        const y1 = this._spoutPos.y;
        const xm = this._mouthPos.x;
        const ym = this._mouthPos.y;
        const x2 = this._surfacePos.x;
        const y2 = Math.min(ym - 15, this._surfacePos.y); // 保证水流必深入瓶内

        // ========================================================
        // 1. 瓶口自然重力抛物线拱弧 (出水嘴 -> 目标瓶口)
        // ========================================================
        const dx = xm - x1;
        const dyMouth = Math.max(18, y1 - ym);
        const cp1x = x1 + dx * 0.25;
        const cp1y = y1 + 10; // 稍许向上喷射微拱
        const cp2x = xm;
        const cp2y = ym + dyMouth * 0.45;

        // 水柱微流体力学波动
        const wave = Math.sin(this._animPhase * 8) * 0.85;

        // A. 柔和外发光辉光带 (宽 18)
        g.strokeColor = new Color(this._color.r, this._color.g, this._color.b, 68);
        g.lineWidth = 18;
        g.moveTo(x1, y1);
        g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xm + wave * 0.5, ym);
        g.lineTo(x2 + wave * 0.3, y2);
        g.stroke();

        // B. 饱满浓郁水柱主体 (宽 10)
        g.strokeColor = this._color;
        g.lineWidth = 10;
        g.moveTo(x1, y1);
        g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xm + wave * 0.5, ym);
        g.lineTo(x2 + wave * 0.3, y2);
        g.stroke();

        // C. 内层明亮流光芯 (宽 5.2)
        g.strokeColor = this._lightColor;
        g.lineWidth = 5.2;
        g.moveTo(x1, y1);
        g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xm + wave * 0.5, ym);
        g.lineTo(x2 + wave * 0.3, y2);
        g.stroke();

        // D. 纯白晶莹高光反光丝 (宽 1.8)
        g.strokeColor = new Color(255, 255, 255, 230);
        g.lineWidth = 1.8;
        g.moveTo(x1 + 1.2, y1);
        g.bezierCurveTo(cp1x + 1.2, cp1y, cp2x - 0.8, cp2y, xm - 1.2, ym);
        g.lineTo(x2 - 1.2, y2);
        g.stroke();

        // ========================================================
        // 2. 液面撞击拱丘与光斑 (Impact Mound)
        // ========================================================
        const pulse = Math.sin(this._animPhase * 6.5) * 1.5;
        const impactRx = 14 + Math.abs(pulse) * 1.2;
        const impactRy = 6.5 + Math.abs(pulse) * 0.5;

        // 底层扩散热区
        g.fillColor = this._color;
        g.ellipse(x2, y2, impactRx, impactRy);
        g.fill();

        // 顶层凸起撞击明亮光斑
        g.fillColor = this._lightColor;
        g.ellipse(x2, y2 + 2.5 + pulse * 0.5, impactRx * 0.65, impactRy * 0.65);
        g.fill();

        // 纯白高光火花
        g.fillColor = new Color(255, 255, 255, 240);
        g.circle(x2 - 1.5, y2 + 3.2 + pulse * 0.5, 2.0);
        g.fill();

        // ========================================================
        // 3. 动态同心透视波纹扩散 (Concentric Ripples)
        // ========================================================
        for (let i = 0; i < 3; i++) {
            const tRing = ((this._animPhase * 0.38 + i * 0.33) % 1);
            const rX = 6 + tRing * 18;
            const rY = rX * 0.38;
            const alpha = Math.max(0, Math.floor((1 - tRing) * 210));
            g.strokeColor = new Color(this._topRimColor.r, this._topRimColor.g, this._topRimColor.b, alpha);
            g.lineWidth = 1.4 * (1 - tRing * 0.5);
            g.ellipse(x2, y2, rX, rY);
            g.stroke();
        }

        // ========================================================
        // 4. 动态飞溅晶莹水花水滴粒子 (Airborne Splash Drops)
        // ========================================================
        const dropCount = 5 + Math.min(2, this._moveCount - 1) * 3;
        for (let d = 0; d < dropCount; d++) {
            const tDrop = (this._animPhase * (0.85 + d * 0.12) + d * 0.19) % 1.0;
            const side = d % 2 === 0 ? 1 : -1;
            const reachX = side * (10 + (d % 3) * 5.5);
            const peakH = 14 + (d % 3) * 6.5;

            const dxDrop = reachX * tDrop;
            // 抛物线垂直轨迹：4 * t * (1 - t)
            const dyDrop = 4 * tDrop * (1 - tDrop) * peakH;
            const dropX = x2 + dxDrop;
            const dropY = y2 + dyDrop;
            const dropR = (2.0 + (d % 2) * 0.7) * (1 - tDrop * 0.4);
            const dropAlpha = Math.max(0, Math.floor((1 - tDrop) * 230));

            // 水花外层辉光
            g.fillColor = new Color(this._lightColor.r, this._lightColor.g, this._lightColor.b, dropAlpha);
            g.circle(dropX, dropY, dropR);
            g.fill();

            // 水花纯白闪亮核心
            g.fillColor = new Color(255, 255, 255, Math.floor(dropAlpha * 0.9));
            g.circle(dropX - 0.4, dropY + 0.4, dropR * 0.55);
            g.fill();
        }
    }
}
`;

fs.writeFileSync(path.join(cocosRoot, 'assets/scripts/ui/WaterStream.ts'), waterStreamContent, 'utf8');
console.log('✓ Successfully updated WaterStream.ts');

// ========================================================
// 2. 升级 GameManager.ts 中的倒水水流参数计算
// ========================================================
const gmPath = path.join(cocosRoot, 'assets/scripts/ui/GameManager.ts');
let gmContent = fs.readFileSync(gmPath, 'utf8');

// 替换 performPour 中计算 spoutPos, mouthPos, surfacePos 并启动 startPour 的部分
const targetOldBlock = `    // 2. 发射流体水流
    const isTargetRight = targetWorldPos.x >= sourceTube.node.worldPosition.x;
    const srcTrans = sourceTube.node.getComponent(UITransform)!;
    const spoutPos = srcTrans.convertToWorldSpaceAR(new Vec3(isTargetRight ? 24 : -24, 60, 0));
    const mouthPos = targetTube.node.getComponent(UITransform)!.convertToWorldSpaceAR(new Vec3(0, 50, 0));

    if (this.waterStream) {
      this.waterStream.startPour(spoutPos, mouthPos, pourColor);
    }`;

const replacementBlock = `    // 2. 发射高奢流体水流与入水激荡特效
    const isTargetRight = targetWorldPos.x >= sourceTube.node.worldPosition.x;
    const srcTrans = sourceTube.node.getComponent(UITransform)!;
    const dstTrans = targetTube.node.getComponent(UITransform)!;

    // 出水嘴精确对准倾斜瓶口边缘
    const spoutPos = srcTrans.convertToWorldSpaceAR(new Vec3(isTargetRight ? 26 : -26, 58, 0));
    // 目标瓶口中心
    const mouthPos = dstTrans.convertToWorldSpaceAR(new Vec3(0, 52, 0));

    // 计算目标瓶内实际液面位置 (深入试管内部，彻底告别悬空)
    const dstCap = targetBottle.maxCap || (targetBottle.isGiantCat ? 8 : 4);
    const dstLayers = targetBottle.layers.length;
    const surfaceLocalY = -72 + (dstLayers + 0.25) * (114 / dstCap);
    const surfacePos = dstTrans.convertToWorldSpaceAR(new Vec3(0, surfaceLocalY, 0));

    if (this.waterStream) {
      (this.waterStream as any).startPour(spoutPos, mouthPos, surfacePos, pourColor, moveCount);
    }`;

if (gmContent.includes(targetOldBlock)) {
    gmContent = gmContent.replace(targetOldBlock, replacementBlock);
    fs.writeFileSync(gmPath, gmContent, 'utf8');
    console.log('✓ Successfully updated GameManager.ts pour stream invocation');
} else {
    console.log('GameManager.ts target block not found, searching with regex...');
    const regex = /\/\/ 2\. 发射流体水流[\s\S]*?this\.waterStream\.startPour\(spoutPos, mouthPos, pourColor\);\s*\}/;
    if (regex.test(gmContent)) {
        gmContent = gmContent.replace(regex, replacementBlock);
        fs.writeFileSync(gmPath, gmContent, 'utf8');
        console.log('✓ Successfully regex-replaced GameManager.ts');
    }
}
`;

fs.writeFileSync(path.join('E:/GithubProjects/water-game/scripts', 'update_water_stream.cjs'), waterStreamContent, 'utf8');
console.log('Written update_water_stream.cjs');
