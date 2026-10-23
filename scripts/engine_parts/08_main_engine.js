// ============================================================================
// 08_main_engine.js: 主渲染流水线驱动与触控事件分发器
// ============================================================================

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.audio = new AudioManager();
    this.particles = new ParticlePool();
    this.atlas = new TextureAtlas();
    this.hitboxes = new HitBoxManager();
    this.liquid = new LiquidRenderer(this.atlas);
    this.ui = new UIRenderer(this.atlas, this.hitboxes);
    this.state = new GameState(this.audio, this.particles);

    this.lastTime = Date.now();
    this.bottleCoords = []; // [{ x, y, w, h }]
    this.layout = {};

    this.init();
  }

  init() {
    this.atlas.initPrebake();
    this.state.loadLevel(1);
    this.bindEvents();
    this.resize();

    // 启动 60FPS 主渲染循环
    const loop = () => {
      this.updateAndRender();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  resize() {
    const sys = Platform.getScreenSize();
    const dpr = sys.dpr;
    const w = sys.width;
    const h = sys.height;

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    this.dpr = dpr;
    this.viewW = w;
    this.viewH = h;

    this.calculateLayout();
  }

  calculateLayout() {
    const w = this.viewW;
    const h = this.viewH;

    const topBarY = Math.max(16, h * 0.035);
    const bagsY = topBarY + 54;
    const bottomY = h - Math.max(88, h * 0.12);

    // 水瓶网格布局区域
    const gridTop = bagsY + 85;
    const gridBottom = bottomY - 20;
    const gridH = gridBottom - gridTop;

    // 默认排成 2 排（上排 4~6 只，下排 4~6 只）
    const count = this.state.bottles.length;
    const cols = Math.min(6, Math.ceil(count / 2));
    const rows = 2;

    const bottleW = Math.min(56, (w - 40) / cols - 8);
    const bottleH = Math.min(150, (gridH - 30) / rows - 10);
    const spacingX = Math.max(6, (w - cols * bottleW) / (cols + 1));
    const spacingY = Math.max(18, (gridH - rows * bottleH) / (rows + 1));

    this.bottleCoords = [];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const bx = spacingX + c * (bottleW + spacingX);
      const by = gridTop + spacingY + r * (bottleH + spacingY);
      this.bottleCoords.push({ x: bx, y: by, w: bottleW, h: bottleH });
    }

    this.layout = { topBarY, bagsY, bottomY, gridTop, gridBottom, viewW: w, viewH: h };
  }

  handleInput(clientX, clientY) {
    let tx = clientX;
    let ty = clientY;
    if (this.canvas.getBoundingClientRect) {
      const rect = this.canvas.getBoundingClientRect();
      tx = clientX - rect.left;
      ty = clientY - rect.top;
    }

    // 1. 先响应 HitBox 按钮与弹窗
    if (this.hitboxes.dispatch(tx, ty)) {
      return;
    }

    // 2. 响应水瓶点击
    if (!this.ui.activeModal) {
      for (let i = 0; i < this.bottleCoords.length; i++) {
        const b = this.bottleCoords[i];
        if (tx >= b.x - 6 && tx <= b.x + b.w + 6 && ty >= b.y - 12 && ty <= b.y + b.h + 20) {
          this.state.handleBottleClick(i, this.bottleCoords);
          break;
        }
      }
    }
  }

  bindEvents() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.resize());
    }

    if (this.canvas.addEventListener) {
      this.canvas.addEventListener('pointerdown', (e) => {
        this.handleInput(e.clientX, e.clientY);
      });
      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
          this.handleInput(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
    }

    // 小游戏原生事件监听
    if (typeof wx !== 'undefined' && wx.onTouchStart) {
      wx.onTouchStart((e) => {
        if (e.touches && e.touches[0]) {
          this.handleInput(e.touches[0].clientX, e.touches[0].clientY);
        }
      });
    } else if (typeof tt !== 'undefined' && tt.onTouchStart) {
      tt.onTouchStart((e) => {
        if (e.touches && e.touches[0]) {
          this.handleInput(e.touches[0].clientX, e.touches[0].clientY);
        }
      });
    }
  }

  updateAndRender() {
    const now = Date.now();
    const dt = Math.min(0.064, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // 清空上一帧 HitBox
    this.hitboxes.clear();

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // 1. 绘制晨曦流金主题背景
    this.ui.drawThemeBackground(ctx, this.viewW, this.viewH);

    // 2. 绘制顶部栏
    this.ui.drawTopBar(ctx, this.layout, this.state);

    // 3. 绘制盲袋区
    this.ui.drawBagsArea(ctx, this.layout, this.state.bags);

    // 4. 倒水补间更新
    let pouringSrcX = 0, pouringSrcY = 0, pouringTiltDeg = 0;
    if (this.state.pourAnim) {
      const anim = this.state.pourAnim;
      const elapsed = now - anim.startMs;
      const progress = Math.min(1, elapsed / anim.durMs);
      anim.pourProgress = progress;

      const srcB = this.bottleCoords[anim.srcIdx];
      const dstB = this.bottleCoords[anim.dstIdx];
      const pourDir = (srcB.x <= dstB.x) ? 1 : -1;

      if (progress < 0.28) {
        // 第一阶段：起飞对准目标瓶口
        const p1 = progress / 0.28;
        pouringSrcX = srcB.x + (dstB.x - pourDir * 24 - srcB.x) * p1;
        pouringSrcY = srcB.y + (dstB.y - 42 - srcB.y) * p1;
        pouringTiltDeg = pourDir * 78 * p1;
      } else if (progress < 0.82) {
        // 第二阶段：倾倒水流转移
        const p2 = (progress - 0.28) / 0.54;
        pouringSrcX = dstB.x - pourDir * 24;
        pouringSrcY = dstB.y - 42;
        pouringTiltDeg = pourDir * (78 + 12 * Math.sin(p2 * Math.PI));

        // 绘制实时水柱与飞溅水花
        const spoutX = pouringSrcX + (pourDir > 0 ? srcB.w * 0.8 : srcB.w * 0.2);
        const spoutY = pouringSrcY + srcB.h * 0.12;
        const mouthX = dstB.x + dstB.w * 0.5;
        const mouthY = dstB.y + dstB.h * 0.08;

        drawLiveStream(ctx, spoutX, spoutY, mouthX, mouthY, anim.color, p2);
        if (Math.random() < 0.65) {
          this.particles.spawnSplash(mouthX, mouthY, anim.color);
        }
      } else {
        // 第三阶段：归位回弹
        const p3 = (progress - 0.82) / 0.18;
        pouringSrcX = (dstB.x - pourDir * 24) + (srcB.x - (dstB.x - pourDir * 24)) * p3;
        pouringSrcY = (dstB.y - 42) + (srcB.y - (dstB.y - 42)) * p3;
        pouringTiltDeg = pourDir * 78 * (1 - p3);
      }

      if (progress >= 1) {
        this.state.finishPour(
          () => { this.ui.activeModal = 'win'; this.particles.spawnWinConfetti(this.viewW, this.viewH); },
          () => { this.ui.activeModal = 'fail'; }
        );
      }
    }

    // 5. 绘制所有粗麻布软垫 (Atlas drawImage)
    const coasterTex = this.atlas.get('coaster_normal');
    this.bottleCoords.forEach((coord, idx) => {
      const b = this.state.bottles[idx];
      if (!b || b.removed) return;
      if (coasterTex) {
        const cw = coord.w * 1.5;
        const ch = cw * (100 / 220);
        const cx = coord.x + (coord.w - cw) * 0.5;
        const cy = coord.y + coord.h * 0.85;
        ctx.drawImage(coasterTex, cx, cy, cw, ch);
      }
    });

    // 6. 绘制所有水瓶流体与瓶身
    this.bottleCoords.forEach((coord, idx) => {
      const b = this.state.bottles[idx];
      if (!b || b.removed) return;

      const isSelected = (this.state.selectedIndex === idx);
      const isPouringSrc = (this.state.pourAnim && this.state.pourAnim.srcIdx === idx);

      let bx = coord.x;
      let by = coord.y - (isSelected ? 18 : 0); // 选中瓶子平滑升空
      let tilt = 0;

      if (isPouringSrc) {
        bx = pouringSrcX;
        by = pouringSrcY;
        tilt = pouringTiltDeg;
      }

      // 液体流体层
      this.liquid.drawBottleLiquid(ctx, b, bx, by, coord.w, coord.h, tilt);

      // 瓶身外壳与机关徽章
      this.liquid.drawBottleShell(ctx, b, bx, by, coord.w, coord.h);

      // 软木塞
      this.liquid.drawCork(ctx, b, bx, by, coord.w, coord.h);
    });

    // 7. 绘制智能提示指引弧线
    if (this.state.activeHintPair && !this.state.pourAnim) {
      const s = this.bottleCoords[this.state.activeHintPair.srcIdx];
      const d = this.bottleCoords[this.state.activeHintPair.dstIdx];
      if (s && d) {
        ctx.save();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3.6;
        ctx.setLineDash([8, 5]);
        ctx.lineDashOffset = -(now * 0.03) % 26;
        ctx.beginPath();
        ctx.moveTo(s.x + s.w * 0.5, s.y);
        ctx.quadraticCurveTo((s.x + d.x) * 0.5, Math.min(s.y, d.y) - 45, d.x + d.w * 0.5, d.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 8. 绘制粒子
    this.particles.updateAndDraw(ctx, dt);

    // 9. 绘制底部 4 枚 3D 鹅卵石按钮
    this.ui.drawBottomControls(ctx, this.layout, this.state);

    // 10. 绘制 Toast
    if (this.state.toastAlpha > 0) {
      this.state.toastAlpha = Math.max(0, this.state.toastAlpha - dt * 0.85);
      this.ui.drawToast(ctx, this.viewW, this.viewH, this.state.toastMsg, this.state.toastAlpha);
    }

    // 11. 绘制顶层弹窗（设置、通关、失败）
    this.ui.drawModal(ctx, this.viewW, this.viewH, this.state);

    ctx.restore();
  }
}
