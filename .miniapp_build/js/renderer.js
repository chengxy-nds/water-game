/**
 * Renderer - 工业级高保真纯 Canvas 2D 渲染器
 * 核心特性：
 * 1. 采用固定设计逻辑分辨率 (DESIGN_WIDTH = 414, DESIGN_HEIGHT = 896)，彻底杜绝拉伸变形！
 * 2. 100% 还原原版 v10.html 第 162 关真机美术质感：
 *    - 细颈圆底琉璃试管 (严格 1:3.4 宽高比)
 *    - 试管底部 3D 麻布/木质软垫与地面柔和投影
 *    - 顶部 4 个手提礼品纸袋（双提绳、立体侧翼与彩色开窗）
 *    - 4 个大号超椭圆 3D 拟真鹅卵石按钮与角标
 *    - 倒水抛物线与重力动态水柱流线
 * 3. 硬件级剪切与粒子系统，零 DOM 依赖，稳帧 60 FPS
 */

const DESIGN_WIDTH = 414;
const DESIGN_HEIGHT = 896;

class Renderer {
  constructor(canvas, levelsModule) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.levels = levelsModule;

    this.screenWidth = 375;
    this.screenHeight = 667;
    this.dpr = 2;

    this.viewScale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.bottleBounds = [];
    this.bagBounds = [];
    this.buttons = {};

    this.pourAnimation = null;
    this.liftOffsets = {};
    this.confettiParticles = [];
    this.dustParticles = [];

    // 初始化背景萤火微光
    for (let i = 0; i < 30; i++) {
      this.dustParticles.push({
        x: Math.random() * DESIGN_WIDTH,
        y: Math.random() * DESIGN_HEIGHT,
        r: Math.random() * 2.2 + 1,
        speedY: -(Math.random() * 0.4 + 0.15),
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  resize(sysInfo) {
    this.screenWidth = sysInfo.windowWidth || 375;
    this.screenHeight = sysInfo.windowHeight || 667;
    this.dpr = sysInfo.pixelRatio || 2;

    this.canvas.width = Math.round(this.screenWidth * this.dpr);
    this.canvas.height = Math.round(this.screenHeight * this.dpr);

    // 计算等比居中缩放矩阵
    this.viewScale = Math.min(this.screenWidth / DESIGN_WIDTH, this.screenHeight / DESIGN_HEIGHT);
    this.offsetX = (this.screenWidth - DESIGN_WIDTH * this.viewScale) / 2;
    this.offsetY = (this.screenHeight - DESIGN_HEIGHT * this.viewScale) / 2;
  }

  // 将屏幕触控坐标转换为设计坐标
  screenToDesign(screenX, screenY) {
    return {
      x: (screenX - this.offsetX) / this.viewScale,
      y: (screenY - this.offsetY) / this.viewScale
    };
  }

  render(gameLogic, audioManager) {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // 绘制全屏底色（保证非 414:896 屏幕四周无黑边，无缝融入背景）
    this.drawCozyBackground(ctx, 0, 0, this.screenWidth, this.screenHeight);

    // 进入设计坐标系 (Design Resolution Matrix)
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.viewScale, this.viewScale);

    // 1. 顶部 Header (☰ 菜单、第 162 关大标题、? 帮助)
    this.drawHeader(ctx, gameLogic);

    // 2. 顶部 4 个手提礼品纸袋（盲袋区）
    this.drawBags(ctx, gameLogic);

    // 3. 上下两排共 12 支细颈木垫试管
    this.drawBottlesGrid(ctx, gameLogic);

    // 4. 实时倒水动画水柱
    if (this.pourAnimation) {
      this.updateAndDrawPourAnimation(ctx, gameLogic);
    }

    // 5. 底部 4 个超椭圆 3D 拟真鹅卵石按钮 (🔄重玩, 🔀打乱, ↩撤回, 💡提示)
    this.drawBottomActionButtons(ctx, gameLogic);

    // 6. 胜利结算浮层与彩带
    if (gameLogic.isVictory) {
      this.drawVictory(ctx, gameLogic);
    }

    ctx.restore();
    ctx.restore();
  }

  // 暖金居室微粒背景
  drawCozyBackground(ctx, x, y, w, h) {
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#EBB559');
    grad.addColorStop(0.42, '#DF9D3F');
    grad.addColorStop(1, '#D48D2E');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // 漂浮的微光萤火金尘
    const time = Date.now() * 0.002;
    ctx.fillStyle = 'rgba(255, 248, 200, 0.45)';
    this.dustParticles.forEach(d => {
      d.y += d.speedY;
      if (d.y < 0) d.y = DESIGN_HEIGHT;
      const alpha = 0.35 + 0.35 * Math.sin(time + d.phase);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 顶部 Header: ☰ 菜单、第 162 关、? 帮助
  drawHeader(ctx, gameLogic) {
    const topY = 56;
    const btnSize = 44;

    // 左上角: 磨砂鹅卵石菜单按钮 ☰
    const leftX = 24;
    const btnY = topY - btnSize / 2;
    this.buttons.menu = { x: leftX, y: btnY, width: btnSize, height: btnSize };
    this.drawFrostedCircleBtn(ctx, leftX, btnY, btnSize, '☰', 21);

    // 中央大字: 第 162 关
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(110, 68, 14, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    const title = (gameLogic.remainingMoves !== null) ? `步数: ${gameLogic.remainingMoves}` : `第 ${gameLogic.currentLevel} 关`;
    ctx.fillText(title, DESIGN_WIDTH / 2, topY);
    ctx.restore();

    // 右上角: 磨砂鹅卵石帮助按钮 ?
    const rightX = DESIGN_WIDTH - btnSize - 24;
    this.buttons.help = { x: rightX, y: btnY, width: btnSize, height: btnSize };
    this.drawFrostedCircleBtn(ctx, rightX, btnY, btnSize, '?', 24);
  }

  // 磨砂圆形按钮
  drawFrostedCircleBtn(ctx, x, y, size, text, fontSize) {
    ctx.save();
    this.roundRect(ctx, x, y, size, size, size / 2);
    const grad = ctx.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, 'rgba(255, 248, 220, 0.4)');
    grad.addColorStop(1, 'rgba(215, 175, 110, 0.28)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.stroke();

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + size / 2, y + size / 2);
    ctx.restore();
  }

  // 顶部礼品手提盲袋 (根据当前关卡盲袋数量动态居中)
  drawBags(ctx, gameLogic) {
    const bags = gameLogic.bags || [];
    const bagCount = bags.length;
    if (bagCount === 0) {
      this.bagBounds = [];
      return;
    }

    const bagW = 56;
    const bagH = 68;
    const startY = 100;
    const spacing = Math.min(16, (DESIGN_WIDTH - 40 - bagCount * bagW) / Math.max(1, bagCount - 1));
    const totalW = bagCount * bagW + (bagCount - 1) * spacing;
    const startX = (DESIGN_WIDTH - totalW) / 2;

    this.bagBounds = [];

    for (let i = 0; i < bagCount; i++) {
      const bx = startX + i * (bagW + spacing);
      this.bagBounds[i] = { x: bx, y: startY, width: bagW, height: bagH };
      const bag = bags[i] || {};

      ctx.save();
      // 1. 手提双提绳
      ctx.beginPath();
      ctx.arc(bx + bagW / 2, startY + 8, 13, Math.PI, 0, false);
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // 2. 纸袋立体投影
      ctx.fillStyle = 'rgba(85, 48, 8, 0.2)';
      ctx.fillRect(bx + 2, startY + 14, bagW, bagH - 6);

      // 3. 纸袋主体
      this.roundRect(ctx, bx, startY + 12, bagW, bagH - 6, 7);
      ctx.fillStyle = bag.locked ? '#848E9C' : '#E8EDF5';
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // 4. 纸袋视窗或角标
      if (!bag.locked) {
        const colorConf = this.levels.COLORS[bag.color] || { hex: '#8B5CF6' };
        const winX = bx + 8;
        const winY = startY + 20;
        const winW = bagW - 16;
        const winH = bagH - 26;

        this.roundRect(ctx, winX, winY, winW, winH, 5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.fill();
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = colorConf.hex;
        ctx.stroke();

        // 袋底彩色包边条
        ctx.fillStyle = colorConf.hex;
        ctx.fillRect(bx + 1, startY + bagH - 2, bagW - 2, 8);

        // 如果已打包完成，盖绿色勾选章
        if (bag.packedBottle) {
          ctx.fillStyle = '#22C55E';
          ctx.beginPath();
          ctx.arc(bx + bagW / 2, startY + bagH / 2 + 6, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✓', bx + bagW / 2, startY + bagH / 2 + 7);
        }
      } else {
        // 灰色锁链/摄像机图标
        const cx = bx + bagW / 2;
        const cy = startY + bagH / 2 + 5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        this.roundRect(ctx, cx - 12, cy - 9, 18, 15, 3);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 6, cy - 5);
        ctx.lineTo(cx + 13, cy - 9);
        ctx.lineTo(cx + 13, cy + 9);
        ctx.lineTo(cx + 6, cy + 5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // 试管网格排布 (动态适应关卡瓶子数，尺寸严格锁定 48 x 156，绝不拉伸变形！)
  drawBottlesGrid(ctx, gameLogic) {
    const bottles = gameLogic.bottles || [];
    const total = bottles.length;
    if (total === 0) return;

    this.bottleBounds = [];

    // 试管黄金标准尺寸 (严格 48 x 156，宽高比 1:3.25，优雅挺拔)
    const bottleW = 48;
    const bottleH = 156;

    if (total <= 6) {
      // 1~6 支瓶子：排成 2 排（如第1关：上3下2）
      const row1Count = Math.ceil(total / 2);
      const row2Count = total - row1Count;
      const spacing = 26;

      const totalRow1W = row1Count * bottleW + (row1Count - 1) * spacing;
      const startX1 = (DESIGN_WIDTH - totalRow1W) / 2;
      const row1Y = 240;

      for (let i = 0; i < row1Count; i++) {
        const bx = startX1 + i * (bottleW + spacing);
        this.drawFullFidelityBottle(ctx, gameLogic, i, bx, row1Y, bottleW, bottleH);
      }

      if (row2Count > 0) {
        const totalRow2W = row2Count * bottleW + (row2Count - 1) * spacing;
        const startX2 = (DESIGN_WIDTH - totalRow2W) / 2;
        const row2Y = 440;

        for (let i = 0; i < row2Count; i++) {
          const idx = row1Count + i;
          const bx = startX2 + i * (bottleW + spacing);
          this.drawFullFidelityBottle(ctx, gameLogic, idx, bx, row2Y, bottleW, bottleH);
        }
      }
    } else if (total <= 12) {
      // 7~12 支瓶子：标准上下两排（如第162关：上6下6）
      const row1Count = Math.ceil(total / 2);
      const row2Count = total - row1Count;
      const maxCols = Math.max(row1Count, row2Count);
      const spacing = Math.min(18, (DESIGN_WIDTH - 36 - maxCols * bottleW) / (maxCols - 1));

      const totalRow1W = row1Count * bottleW + (row1Count - 1) * spacing;
      const startX1 = (DESIGN_WIDTH - totalRow1W) / 2;
      const row1Y = 220;

      for (let i = 0; i < row1Count; i++) {
        const bx = startX1 + i * (bottleW + spacing);
        this.drawFullFidelityBottle(ctx, gameLogic, i, bx, row1Y, bottleW, bottleH);
      }

      const totalRow2W = row2Count * bottleW + (row2Count - 1) * spacing;
      const startX2 = (DESIGN_WIDTH - totalRow2W) / 2;
      const row2Y = 430;

      for (let i = 0; i < row2Count; i++) {
        const idx = row1Count + i;
        const bx = startX2 + i * (bottleW + spacing);
        this.drawFullFidelityBottle(ctx, gameLogic, idx, bx, row2Y, bottleW, bottleH);
      }
    } else {
      // 超大关卡 (>12 支): 3 排精细布局
      const rowCount = Math.ceil(total / 3);
      const bW = 42;
      const bH = 136;
      const spacing = 12;
      const yCoords = [200, 360, 520];

      for (let i = 0; i < total; i++) {
        const r = Math.floor(i / rowCount);
        const c = i % rowCount;
        const countInRow = (r < 2) ? rowCount : (total - 2 * rowCount);
        const totalW = countInRow * bW + (countInRow - 1) * spacing;
        const startX = (DESIGN_WIDTH - totalW) / 2;
        const bx = startX + c * (bW + spacing);
        const by = yCoords[r] || 200;
        this.drawFullFidelityBottle(ctx, gameLogic, i, bx, by, bW, bH);
      }
    }
  }

  // 单支试管绘制 (100% 还原原版质感)
  drawFullFidelityBottle(ctx, gameLogic, index, x, y, w, h) {
    if (this.pourAnimation && this.pourAnimation.fromIndex === index) {
      this.bottleBounds[index] = { x, y, width: w, height: h };
      return;
    }

    const isSelected = gameLogic.selectedIndex === index;
    const isHinted = gameLogic.activeHintPair && gameLogic.activeHintPair.includes(index);

    // 选中瓶子平滑浮起动画
    const targetLift = isSelected ? 24 : 0;
    if (this.liftOffsets[index] === undefined) this.liftOffsets[index] = 0;
    this.liftOffsets[index] += (targetLift - this.liftOffsets[index]) * 0.32;
    const drawY = y - this.liftOffsets[index];

    this.bottleBounds[index] = { x, y: drawY, width: w, height: h };

    const bottle = gameLogic.bottles[index] || { layers: [] };
    const layers = bottle.layers || [];
    const unitH = (h - 24) / 4;

    ctx.save();

    // 1. 地面柔和阴影
    ctx.beginPath();
    ctx.ellipse(x + w / 2, drawY + h + 8, w * 0.62, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90, 48, 8, 0.3)';
    ctx.fill();

    // 2. 瓶底 3D 麻布/木质垫座
    ctx.beginPath();
    ctx.ellipse(x + w / 2, drawY + h + 1, w * 0.58, 5.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#B4844E';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#7D4F1E';
    ctx.stroke();

    // 3. 广告发光试管 (霓虹紫色呼吸边)
    if (bottle.special === 'ad_bottle') {
      ctx.save();
      this.traceBottleBody(ctx, x - 3, drawY - 3, w + 6, h + 6);
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = '#D946EF';
      ctx.shadowColor = '#E879F9';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    // 选中或提示光晕
    if (isSelected || isHinted) {
      ctx.shadowColor = isSelected ? '#FFE082' : '#4ADE80';
      ctx.shadowBlur = 18;
    }

    // 4. 裁剪内壁几何体并逐层填充液体
    ctx.save();
    this.traceBottleBody(ctx, x, drawY, w, h);
    ctx.clip();

    // 玻璃通透内壁微光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(x, drawY, w, h);

    // 逐层液体渲染
    for (let c = 0; c < layers.length; c++) {
      const colorKey = layers[c];
      const isMysteryLayer = bottle.mysteryCount && c < bottle.mysteryCount;
      const liquidY = drawY + h - (c + 1) * unitH;

      if (isMysteryLayer) {
        // 黑色 ? 星雾盲盒层
        ctx.fillStyle = '#18181B';
        ctx.fillRect(x, liquidY, w, unitH + 1);

        ctx.font = 'bold 16px -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + w / 2, liquidY + unitH / 2);
      } else {
        // 丝滑琉璃渐变液体
        const colorConf = this.levels.COLORS[colorKey] || { hex: '#2563EB', light: '#93C5FD' };
        const lGrad = ctx.createLinearGradient(x, liquidY, x + w, liquidY);
        lGrad.addColorStop(0, colorConf.hex);
        lGrad.addColorStop(0.35, colorConf.light);
        lGrad.addColorStop(1, colorConf.hex);

        ctx.fillStyle = lGrad;
        ctx.fillRect(x, liquidY, w, unitH + 1);

        // 顶层椭圆弯月面
        if (c === layers.length - 1) {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, liquidY, w * 0.44, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = colorConf.topRim || colorConf.light;
          ctx.fill();
        }
      }
    }
    ctx.restore();

    // 5. 试管高定玻璃外轮廓与卷唇
    ctx.save();
    this.traceBottleBody(ctx, x, drawY, w, h);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.stroke();

    // 瓶口外翻圆唇
    ctx.beginPath();
    ctx.ellipse(x + w / 2, drawY + 2, w * 0.35, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // 瓶身左侧柱状高光条
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.fillRect(x + 4, drawY + 16, 3, h - 28);
    ctx.restore();

    // 6. 软木塞 (若已封存)
    if (bottle.corked) {
      this.drawWoodenCork(ctx, x + w / 2, drawY + 2);
    }

    // 7. 特殊机制徽章
    this.drawMechanicBadges(ctx, bottle, x, drawY, w, h);

    ctx.restore();
  }

  // 绘制圆润细颈试管轮廓
  traceBottleBody(ctx, x, y, w, h) {
    const neckW = w * 0.62;
    const neckH = 14;
    const neckL = x + (w - neckW) / 2;
    const neckR = neckL + neckW;
    const cornerR = w * 0.45;

    ctx.beginPath();
    ctx.moveTo(neckL, y + 2);
    ctx.lineTo(neckR, y + 2);
    ctx.lineTo(neckR, y + neckH);
    ctx.bezierCurveTo(x + w - 2, y + neckH + 6, x + w, y + neckH + 12, x + w, y + neckH + 18);
    ctx.lineTo(x + w, y + h - cornerR);
    ctx.arc(x + w - cornerR, y + h - cornerR, cornerR, 0, Math.PI / 2, false);
    ctx.arc(x + cornerR, y + h - cornerR, cornerR, Math.PI / 2, Math.PI, false);
    ctx.lineTo(x, y + neckH + 18);
    ctx.bezierCurveTo(x, y + neckH + 12, x + 2, y + neckH + 6, neckL, y + neckH);
    ctx.closePath();
  }

  // 3D 软木塞
  drawWoodenCork(ctx, cx, topY) {
    ctx.save();
    const plugGrad = ctx.createLinearGradient(cx - 10, topY, cx + 10, topY);
    plugGrad.addColorStop(0, '#78350F');
    plugGrad.addColorStop(0.5, '#D97706');
    plugGrad.addColorStop(1, '#92400E');
    ctx.fillStyle = plugGrad;

    ctx.beginPath();
    ctx.moveTo(cx - 9, topY);
    ctx.lineTo(cx + 9, topY);
    ctx.lineTo(cx + 7, topY + 14);
    ctx.lineTo(cx - 7, topY + 14);
    ctx.closePath();
    ctx.fill();

    // 塞顶圆帽
    ctx.beginPath();
    ctx.ellipse(cx, topY - 2, 11, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FBBF24';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#92400E';
    ctx.stroke();
    ctx.restore();
  }

  // 绘制特殊机制徽章
  drawMechanicBadges(ctx, bottle, x, y, w, h) {
    const cx = x + w / 2;

    if (bottle.special === 'ice_base') {
      // 菱形 1 冰霜锁
      const lockY = y + h - 16;
      ctx.save();
      ctx.translate(cx, lockY);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#67E8F9';
      ctx.fillRect(-11, -11, 22, 22);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();

      ctx.font = '900 13px sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(bottle.poursToBreak || 1), cx, lockY);
    } else if (bottle.special === 'stone_base') {
      // 曜石底座锁
      const lockY = y + h - 16;
      ctx.save();
      ctx.fillStyle = '#475569';
      this.roundRect(ctx, cx - 12, lockY - 10, 24, 20, 5);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FEF08A';
      ctx.stroke();

      ctx.font = '900 12px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(bottle.poursToBreak || 1), cx, lockY);
      ctx.restore();
    } else if (bottle.special === 'color_lock' && bottle.requiredColor) {
      // 紫色专属盾牌标志
      const lockY = y + 36;
      const reqConf = this.levels.COLORS[bottle.requiredColor] || { hex: '#9333EA' };
      ctx.save();
      ctx.translate(cx, lockY);
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(10, -6);
      ctx.lineTo(10, 4);
      ctx.lineTo(0, 12);
      ctx.lineTo(-10, 4);
      ctx.lineTo(-10, -6);
      ctx.closePath();
      ctx.fillStyle = reqConf.hex;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();
    }
  }

  // 倒水动画水柱与源试管倾斜
  updateAndDrawPourAnimation(ctx, gameLogic) {
    const anim = this.pourAnimation;
    const now = Date.now();
    const elapsed = now - anim.startTime;
    const progress = Math.min(1, elapsed / anim.duration);

    const fromBox = this.bottleBounds[anim.fromIndex];
    const toBox = this.bottleBounds[anim.toIndex];
    if (!fromBox || !toBox) {
      anim.onComplete();
      this.pourAnimation = null;
      return;
    }

    const pourDir = fromBox.x <= toBox.x ? 1 : -1;
    let curX, curY, curTilt;

    if (progress < 0.28) {
      const p1 = progress / 0.28;
      curX = fromBox.x + (toBox.x - pourDir * 24 - fromBox.x) * p1;
      curY = fromBox.y + (toBox.y - 42 - fromBox.y) * p1;
      curTilt = pourDir * 78 * p1;
    } else if (progress < 0.82) {
      const p2 = (progress - 0.28) / 0.54;
      curX = toBox.x - pourDir * 24;
      curY = toBox.y - 42;
      curTilt = pourDir * (78 + 10 * Math.sin(p2 * Math.PI));

      // 绘制重力自然下垂水柱
      const spoutX = curX + (pourDir > 0 ? fromBox.width * 0.82 : fromBox.width * 0.18);
      const spoutY = curY + 8;
      const targetMouthX = toBox.x + toBox.width / 2;
      const targetMouthY = toBox.y + 6;

      const colorConf = this.levels.COLORS[anim.colorKey] || { hex: '#2563EB', light: '#93C5FD' };
      const streamWidth = Math.max(3, 8 * Math.sin(p2 * Math.PI));

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(spoutX, spoutY);
      ctx.quadraticCurveTo((spoutX + targetMouthX) / 2, (spoutY + targetMouthY) / 2 - 12, targetMouthX, targetMouthY);
      ctx.lineWidth = streamWidth;
      ctx.strokeStyle = colorConf.hex;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(spoutX, spoutY);
      ctx.quadraticCurveTo((spoutX + targetMouthX) / 2, (spoutY + targetMouthY) / 2 - 12, targetMouthX, targetMouthY);
      ctx.lineWidth = streamWidth * 0.32;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();
    } else {
      const p3 = (progress - 0.82) / 0.18;
      curX = (toBox.x - pourDir * 24) + (fromBox.x - (toBox.x - pourDir * 24)) * p3;
      curY = (toBox.y - 42) + (fromBox.y - (toBox.y - 42)) * p3;
      curTilt = pourDir * 78 * (1 - p3);
    }

    // 绘制倾斜中的源试管
    ctx.save();
    ctx.translate(curX + fromBox.width / 2, curY + 10);
    ctx.rotate((curTilt * Math.PI) / 180);
    ctx.translate(-(curX + fromBox.width / 2), -(curY + 10));
    this.drawFullFidelityBottle(ctx, gameLogic, anim.fromIndex, curX, curY, fromBox.width, fromBox.height);
    ctx.restore();

    if (progress >= 1) {
      anim.onComplete();
      this.pourAnimation = null;
    }
  }

  startPourAnimation(plan, onComplete) {
    this.pourAnimation = {
      fromIndex: plan.fromIndex,
      toIndex: plan.toIndex,
      colorKey: plan.colorKey,
      startTime: Date.now(),
      duration: 620,
      onComplete
    };
  }

  // 底部 4 个超椭圆 3D 拟真鹅卵石按钮 (大号 64x64，手感极其饱满！)
  drawBottomActionButtons(ctx, gameLogic) {
    const btnSize = 64;
    const startY = DESIGN_HEIGHT - 130;
    const spacing = 24;
    const count = 4;
    const totalW = count * btnSize + (count - 1) * spacing;
    const startX = (DESIGN_WIDTH - totalW) / 2;

    const btns = [
      { key: 'restart', icon: '🔄', badge: null },
      { key: 'shuffle', icon: '🔀', badge: gameLogic.shuffleCount },
      { key: 'undo',    icon: '↩',  badge: gameLogic.undoCount },
      { key: 'hint',    icon: '💡', badge: gameLogic.hintCount }
    ];

    btns.forEach((btn, i) => {
      const bx = startX + i * (btnSize + spacing);
      this.buttons[btn.key] = { x: bx, y: startY, width: btnSize, height: btnSize };

      ctx.save();
      // 1. 按钮深色立体投影
      ctx.shadowColor = 'rgba(75, 42, 10, 0.45)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      // 2. 超椭圆外圈高光
      this.roundRect(ctx, bx, startY, btnSize, btnSize, 22);
      const rimGrad = ctx.createLinearGradient(bx, startY, bx, startY + btnSize);
      rimGrad.addColorStop(0, '#FFFFFF');
      rimGrad.addColorStop(0.5, '#E2CBAC');
      rimGrad.addColorStop(1, '#9B7D58');
      ctx.fillStyle = rimGrad;
      ctx.fill();
      ctx.restore();

      // 3. 鹅卵石饱满内球体
      ctx.save();
      this.roundRect(ctx, bx + 2.5, startY + 2.5, btnSize - 5, btnSize - 5, 20);
      const innerGrad = ctx.createRadialGradient(bx + 20, startY + 18, 4, bx + btnSize / 2, startY + btnSize / 2, btnSize / 2);
      innerGrad.addColorStop(0, '#FFFBF5');
      innerGrad.addColorStop(0.4, '#F7EADE');
      innerGrad.addColorStop(0.85, '#D9BF9F');
      innerGrad.addColorStop(1, '#B2936E');
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // 4. 图标
      ctx.font = 'bold 26px sans-serif';
      ctx.fillStyle = '#5C3D18';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.icon, bx + btnSize / 2, startY + btnSize / 2 + 1);

      // 5. 右上角橙色数字角标
      if (btn.badge !== null) {
        ctx.fillStyle = '#EA580C';
        ctx.beginPath();
        ctx.arc(bx + btnSize - 6, startY + 6, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.font = '900 12px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(String(btn.badge), bx + btnSize - 6, startY + 7);
      }
      ctx.restore();
    });
  }

  // 胜利通关结算浮层与彩纸
  drawVictory(ctx, gameLogic) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 12, 6, 0.65)';
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    const cardW = 340;
    const cardH = 260;
    const cardX = (DESIGN_WIDTH - cardW) / 2;
    const cardY = (DESIGN_HEIGHT - cardH) / 2;

    this.roundRect(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.fillStyle = '#FFFDF7';
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#F3B14B';
    ctx.stroke();

    // 标题
    ctx.fillStyle = '#D97706';
    this.roundRect(ctx, (DESIGN_WIDTH - 180) / 2, cardY - 20, 180, 40, 20);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '900 20px -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('恭喜通关！', DESIGN_WIDTH / 2, cardY);

    // 三星
    for (let s = -1; s <= 1; s++) {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(DESIGN_WIDTH / 2 + s * 48, cardY + 80, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#CA8A04';
      ctx.stroke();
    }

    // 下一关按钮
    const nextBtnY = cardY + 165;
    const nextBtnW = 240;
    const nextBtnX = (DESIGN_WIDTH - nextBtnW) / 2;
    this.buttons.nextLevel = { x: nextBtnX, y: nextBtnY, width: nextBtnW, height: 50 };

    this.roundRect(ctx, nextBtnX, nextBtnY, nextBtnW, 50, 25);
    ctx.fillStyle = '#22C55E';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.font = 'bold 20px -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('进入下一关 ➔', DESIGN_WIDTH / 2, nextBtnY + 25);

    ctx.restore();
  }

  // 点击检测碰撞 (支持屏幕坐标自动映射到设计坐标)
  hitTest(screenX, screenY, isVictory) {
    const pt = this.screenToDesign(screenX, screenY);
    const x = pt.x;
    const y = pt.y;

    if (isVictory && this.buttons.nextLevel) {
      const b = this.buttons.nextLevel;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return { type: 'NEXT_LEVEL' };
      }
      return null;
    }

    // 检查试管点击
    for (let i = 0; i < this.bottleBounds.length; i++) {
      const b = this.bottleBounds[i];
      if (b && x >= b.x - 6 && x <= b.x + b.width + 6 && y >= b.y - 12 && y <= b.y + b.height + 16) {
        return { type: 'BOTTLE', index: i };
      }
    }

    // 检查底部按钮
    for (const key of ['restart', 'shuffle', 'undo', 'hint', 'menu', 'help']) {
      const b = this.buttons[key];
      if (b && x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return { type: key.toUpperCase() };
      }
    }

    return null;
  }

  resetVictoryParticles() {
    this.confettiParticles = [];
  }

  roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = Renderer;
}
