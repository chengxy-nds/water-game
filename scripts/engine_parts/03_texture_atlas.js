// ============================================================================
// 03_texture_atlas.js: 静态资产离屏预烘焙系统 (Zero Runtime Reflow & Zero GC)
// ============================================================================

class TextureAtlas {
  constructor() {
    this.cache = new Map();
  }

  initPrebake() {
    this.bakeCoaster('coaster_normal', false);
    this.bakeCoaster('coaster_dark', true);
    this.bakeCoaster('coaster_beaded', false, true);

    this.bakeButton('btn_shuffle', 'shuffle');
    this.bakeButton('btn_undo', 'undo');
    this.bakeButton('btn_hint', 'hint');
    this.bakeButton('btn_add', 'add');

    this.bakeBags();
    this.bakeBottleShell();
  }

  get(key) {
    return this.cache.get(key) || null;
  }

  // 烘焙 3D 粗麻布软垫到离屏缓冲 (一次性渲染，零运行时开销)
  bakeCoaster(key, isDark = false, isBeaded = false) {
    const off = Platform.createCanvas(220, 100);
    if (!off) return;
    const ctx = off.getContext('2d');
    
    // 1. 地面暖色渐变投影
    const shadowGrad = ctx.createRadialGradient(110, 72, 6, 110, 72, 98);
    shadowGrad.addColorStop(0, 'rgba(148, 62, 14, 0.58)');
    shadowGrad.addColorStop(1, 'rgba(185, 92, 28, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(110, 72, 96, 24, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // 2. 软垫立体侧壁
    const sideGrad = ctx.createLinearGradient(0, 25, 0, 84);
    sideGrad.addColorStop(0, isDark ? '#59442e' : '#c4945a');
    sideGrad.addColorStop(1, isDark ? '#1a110a' : '#331f0c');
    ctx.fillStyle = sideGrad;
    ctx.beginPath();
    ctx.moveTo(30, 42);
    ctx.bezierCurveTo(30, 28, 60, 22, 110, 22);
    ctx.bezierCurveTo(160, 22, 190, 28, 190, 42);
    ctx.lineTo(187, 60);
    ctx.bezierCurveTo(184, 76, 154, 84, 110, 84);
    ctx.bezierCurveTo(66, 84, 36, 76, 33, 60);
    ctx.closePath();
    ctx.fill();

    // 3. 软垫饱满顶面
    const topGrad = ctx.createLinearGradient(30, 18, 190, 66);
    topGrad.addColorStop(0, '#fffbf0');
    topGrad.addColorStop(0.48, isDark ? '#523e2a' : '#d9b077');
    topGrad.addColorStop(1, '#38220c');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.ellipse(110, 41, 80, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255,232,185,0.35)' : 'rgba(255,248,225,0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. 若有珍珠缝线徽章
    if (isBeaded) {
      for (let b = 0; b < 10; b++) {
        const ang = (b / 10) * Math.PI * 2;
        const bx = 110 + Math.cos(ang) * 72;
        const by = 41 + Math.sin(ang) * 20;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.cache.set(key, off);
  }

  // 烘焙 3D 拟真鹅卵石按钮
  bakeButton(key, type) {
    const off = Platform.createCanvas(120, 120);
    if (!off) return;
    const ctx = off.getContext('2d');
    const cx = 60, cy = 60, r = 44;

    // 1. 按钮底部投影
    ctx.save();
    ctx.shadowColor = 'rgba(54, 32, 10, 0.45)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    
    // 2. 超椭圆外圈高光
    const rimGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    rimGrad.addColorStop(0, '#ffffff');
    rimGrad.addColorStop(0.5, '#e2cbac');
    rimGrad.addColorStop(1, '#9b7d58');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. 按钮饱满内球体
    const innerGrad = ctx.createRadialGradient(cx - 12, cy - 14, 4, cx, cy, r - 4);
    innerGrad.addColorStop(0, '#fffbf5');
    innerGrad.addColorStop(0.35, '#f7eade');
    innerGrad.addColorStop(0.85, '#d9bf9f');
    innerGrad.addColorStop(1, '#af906b');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
    ctx.fill();

    // 4. 图标绘制
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#5c3d18';
    ctx.fillStyle = '#5c3d18';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'shuffle') {
      // 双向旋转箭头
      ctx.beginPath();
      ctx.arc(0, 0, 16, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-16, 5); ctx.lineTo(-12, 16); ctx.lineTo(-1, 12);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, 16, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(16, -5); ctx.lineTo(12, -16); ctx.lineTo(1, -12);
      ctx.fill();
    } else if (type === 'undo') {
      // 逆时针撤回箭头
      ctx.beginPath();
      ctx.arc(2, 2, 16, Math.PI * 0.2, Math.PI * 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, -6); ctx.lineTo(-7, -18); ctx.lineTo(-3, -7);
      ctx.fill();
    } else if (type === 'hint') {
      // 电灯泡
      ctx.beginPath();
      ctx.arc(0, -5, 12, Math.PI * 0.75, Math.PI * 0.25);
      ctx.lineTo(4, 9);
      ctx.lineTo(-4, 9);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = '#eab308';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-4, 13); ctx.lineTo(4, 13);
      ctx.moveTo(-2, 17); ctx.lineTo(2, 17);
      ctx.strokeStyle = '#5c3d18';
      ctx.stroke();
    } else if (type === 'add') {
      // 试管与加号
      ctx.beginPath();
      ctx.roundRect(-8, -14, 16, 28, [3, 3, 8, 8]);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-11, -14); ctx.lineTo(11, -14);
      ctx.stroke();

      // 小加号
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(7, 2); ctx.lineTo(19, 2);
      ctx.moveTo(13, -4); ctx.lineTo(13, 8);
      ctx.stroke();
    }
    ctx.restore();

    this.cache.set(key, off);
  }

  // 烘焙 3D 盲袋贴图
  bakeBags() {
    // 1. 烘焙锁定态盲袋
    const offLock = Platform.createCanvas(120, 150);
    if (offLock) {
      const ctx = offLock.getContext('2d');
      // 阴影
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(60, 142, 45, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 提绳
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(60, 36, 22, Math.PI, 0);
      ctx.stroke();

      // 袋身
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(20, 36, 80, 102);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(80, 36, 20, 102);

      // 锁链小图标
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(46, 75, 28, 24, 6);
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(60, 75, 8, Math.PI, 0);
      ctx.stroke();

      this.cache.set('bag_locked', offLock);
    }

    // 2. 烘焙各颜色普通盲袋
    COLOR_KEYS.forEach(ck => {
      const col = COLORS[ck] || COLORS.green;
      const offBag = Platform.createCanvas(120, 150);
      if (!offBag) return;
      const ctx = offBag.getContext('2d');

      // 阴影
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(60, 142, 48, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // 提绳
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.arc(60, 35, 24, Math.PI, 0);
      ctx.stroke();

      // 正立面与侧翼
      ctx.fillStyle = col.bagMain;
      ctx.fillRect(18, 35, 70, 104);
      ctx.fillStyle = col.bagDark;
      ctx.fillRect(88, 35, 14, 104);

      // 浅色窗口区域
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(30, 52, 46, 68, 6);
      ctx.fill();

      // 窗口反光斜切条纹
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(30, 52);
      ctx.lineTo(55, 52);
      ctx.lineTo(30, 100);
      ctx.closePath();
      ctx.fill();

      this.cache.set(`bag_${ck}`, offBag);
    });
  }

  // 烘焙水瓶纯净外壳琉璃光泽
  bakeBottleShell() {
    const off = Platform.createCanvas(140, 300);
    if (!off) return;
    const ctx = off.getContext('2d');
    const w = 140, h = 300;

    // 瓶身两侧柱状高光与瓶肩折射
    const leftGloss = ctx.createLinearGradient(20, 0, 48, 0);
    leftGloss.addColorStop(0, 'rgba(255, 255, 255, 0.48)');
    leftGloss.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    leftGloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = leftGloss;
    ctx.fillRect(22, 50, 26, 200);

    const rightGloss = ctx.createLinearGradient(92, 0, 118, 0);
    rightGloss.addColorStop(0, 'rgba(255, 255, 255, 0)');
    rightGloss.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
    rightGloss.addColorStop(1, 'rgba(255, 255, 255, 0.65)');
    ctx.fillStyle = rightGloss;
    ctx.fillRect(92, 50, 26, 200);

    // 瓶底加厚玻璃焦散亮环
    const baseGrad = ctx.createLinearGradient(20, 240, 120, 270);
    baseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    baseGrad.addColorStop(0.3, 'rgba(165, 215, 255, 0.35)');
    baseGrad.addColorStop(0.7, 'rgba(30, 42, 68, 0.25)');
    baseGrad.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(70, 265, 48, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set('bottle_shell_gloss', off);
  }
}
