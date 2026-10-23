// ============================================================================
// 05_liquid_renderer.js: 纯 Canvas 2D 贝塞尔硬件裁剪流体、机关外壳与软木塞渲染器
// ============================================================================

class LiquidRenderer {
  constructor(textureAtlas) {
    this.atlas = textureAtlas;
  }

  // 1. 纯 Canvas 2D 硬件裁剪流体与弯月面
  drawBottleLiquid(ctx, bottle, x, y, w, h, tiltDeg = 0, sloshPhase = 0, sloshAmp = 0) {
    const layers = bottle.layers;
    if (!layers || layers.length === 0) return;

    const maxCap = bottle.maxCap || 4;
    const isGiantCat = !!bottle.isGiantCat;
    const mysteryCount = bottle.mysteryCount || 0;

    ctx.save();
    ctx.translate(x, y);

    if (tiltDeg !== 0) {
      // 倒水倾斜旋转中心：瓶口偏上方
      const pivotX = tiltDeg > 0 ? w * 0.75 : w * 0.25;
      const pivotY = h * 0.08;
      ctx.translate(pivotX, pivotY);
      ctx.rotate((tiltDeg * Math.PI) / 180);
      ctx.translate(-pivotX, -pivotY);
    }

    // 硬件级内壁几何路径裁剪 (Hardware Accelerated ctx.clip)
    ctx.beginPath();
    const neckL = w * 0.36, neckR = w * 0.64;
    const shoulderTopY = h * 0.12;
    const shoulderBotY = h * 0.22;
    const wallL = w * 0.18, wallR = w * 0.82;
    const botY = h * 0.88;
    const rx = (wallR - wallL) * 0.5;
    const ry = rx * 0.25;

    ctx.moveTo(neckL, h * 0.04);
    ctx.lineTo(neckR, h * 0.04);
    ctx.lineTo(neckR, shoulderTopY);
    ctx.bezierCurveTo(wallR - 4, shoulderTopY + 8, wallR, shoulderBotY - 4, wallR, shoulderBotY);
    ctx.lineTo(wallR, botY);
    ctx.ellipse(w * 0.5, botY, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(wallL, shoulderBotY);
    ctx.bezierCurveTo(wallL, shoulderBotY - 4, wallL + 4, shoulderTopY + 8, neckL, shoulderTopY);
    ctx.closePath();
    ctx.clip(); // 100% 硬件加速剪切，零卡顿

    // 逐层绘制液体
    const totalLiquidH = botY - shoulderBotY + (h * 0.08);
    const layerH = totalLiquidH / maxCap;
    let curY = botY + ry;

    for (let i = 0; i < layers.length; i++) {
      const colKey = layers[i];
      const isMystery = (i < mysteryCount);
      const col = isMystery ? {
        highlight: '#1e293b', mid: '#0f172a', right: '#020617', left: '#020617',
        topLight: '#334155', topRim: '#1e293b', topMid: '#0f172a'
      } : (COLORS[colKey] || COLORS.blue);

      const topY = curY - layerH;
      const wave = (i === layers.length - 1) ? Math.sin(sloshPhase) * sloshAmp * 7 : 0;

      // 液体色块渐变填充
      const grad = ctx.createLinearGradient(wallL, 0, wallR, 0);
      grad.addColorStop(0, col.highlight);
      grad.addColorStop(0.2, col.topMid || col.mid);
      grad.addColorStop(0.65, col.mid);
      grad.addColorStop(1, col.right);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(wallL - 2, curY + 2);
      ctx.lineTo(wallR + 2, curY + 2);
      ctx.lineTo(wallR + 2, topY + wave);
      ctx.lineTo(wallL - 2, topY - wave);
      ctx.closePath();
      ctx.fill();

      // 顶层液面立体透视椭圆弯月面
      if (i === layers.length - 1) {
        const topGrad = ctx.createRadialGradient(w * 0.5, topY, 2, w * 0.5, topY, rx);
        topGrad.addColorStop(0, col.topLight || col.highlight);
        topGrad.addColorStop(0.65, col.topRim || col.mid);
        topGrad.addColorStop(1, col.mid);

        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.ellipse(w * 0.5, topY, rx, ry + Math.abs(wave) * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // 弯月面高光反光边
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // 如果是问号层，居中绘制问号
      if (isMystery) {
        ctx.save();
        ctx.font = '900 20px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 4;
        ctx.fillText('?', w * 0.5, (curY + topY) * 0.5);
        ctx.restore();
      }

      curY = topY;
    }

    ctx.restore();
  }

  // 2. 绘制纯净水瓶外壳琉璃光影与各特殊机关徽章
  drawBottleShell(ctx, bottle, x, y, w, h) {
    const maxCap = bottle.maxCap || 4;
    const special = bottle.special || 'none';

    ctx.save();
    ctx.translate(x, y);

    const neckL = w * 0.36, neckR = w * 0.64;
    const shoulderTopY = h * 0.12;
    const shoulderBotY = h * 0.22;
    const wallL = w * 0.18, wallR = w * 0.82;
    const botY = h * 0.88;
    const rx = (wallR - wallL) * 0.5;
    const ry = rx * 0.25;

    // 1. 瓶身外轮廓描边与清亮玻璃壁
    ctx.beginPath();
    ctx.moveTo(neckL, h * 0.04);
    ctx.lineTo(neckR, h * 0.04);
    ctx.lineTo(neckR, shoulderTopY);
    ctx.bezierCurveTo(wallR - 4, shoulderTopY + 8, wallR, shoulderBotY - 4, wallR, shoulderBotY);
    ctx.lineTo(wallR, botY);
    ctx.ellipse(w * 0.5, botY, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(wallL, shoulderBotY);
    ctx.bezierCurveTo(wallL, shoulderBotY - 4, wallL + 4, shoulderTopY + 8, neckL, shoulderTopY);
    ctx.closePath();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 2. 瓶颈外翻圆唇
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.04, (neckR - neckL) * 0.55, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 248, 230, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3. 玻璃沉底与柱状高光
    const gloss = this.atlas.get('bottle_shell_gloss');
    if (gloss) {
      ctx.drawImage(gloss, 0, 0, w, h);
    }

    // 4. 特殊机关徽章绘制
    if (special === 'ice_base') {
      // 瓶底极地霜晶座
      ctx.fillStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, botY, rx + 4, ry + 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 剩余破碎步数角标
      this.drawBadge(ctx, w * 0.5, botY + 14, `❄️×${bottle.poursToBreak || 1}`, '#0284c7');
    } else if (special === 'stone_base') {
      // 瓶底曜石锁箍
      ctx.fillStyle = 'rgba(71, 85, 105, 0.75)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, botY, rx + 4, ry + 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      this.drawBadge(ctx, w * 0.5, botY + 14, `🔒×${bottle.poursToBreak || 1}`, '#475569');
    } else if (special === 'color_lock' && bottle.requiredColor) {
      // 契约瓶专属护盾标志
      const reqCol = COLORS[bottle.requiredColor] || COLORS.blue;
      ctx.save();
      ctx.translate(w * 0.5, shoulderTopY + 12);
      ctx.fillStyle = reqCol.mid;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(10, -5);
      ctx.lineTo(10, 5);
      ctx.lineTo(0, 12);
      ctx.lineTo(-10, 5);
      ctx.lineTo(-10, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (special === 'one_way_in') {
      // 漏斗标志
      this.drawBadge(ctx, w * 0.5, shoulderTopY + 8, '⏬ 仅注入', '#10b981');
    } else if (special === 'one_way_out') {
      // 古瓶流出标志
      this.drawBadge(ctx, w * 0.5, shoulderTopY + 8, '⏫ 仅倒出', '#f59e0b');
    }

    // 瓶口冰封状态
    if (bottle.frozenTurns && bottle.frozenTurns > 0) {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.04, (neckR - neckL) * 0.65, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      this.drawBadge(ctx, w * 0.5, h * 0.04 - 14, `🧊 ${bottle.frozenTurns}`, '#0369a1');
    }

    ctx.restore();
  }

  // 辅助函数：绘制高质感圆角状态标签胶囊
  drawBadge(ctx, cx, cy, text, bgCol) {
    ctx.save();
    ctx.font = '800 11px "Fredoka", sans-serif';
    const tw = ctx.measureText(text).width;
    const pw = tw + 14, ph = 18;

    ctx.fillStyle = bgCol;
    ctx.beginPath();
    ctx.roundRect(cx - pw * 0.5, cy - ph * 0.5, pw, ph, 9);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  // 3. 绘制 3D 软木塞封存与下沉动效
  drawCork(ctx, bottle, x, y, w, h) {
    if (!bottle.corked) return;

    ctx.save();
    ctx.translate(x, y);

    const cp = typeof bottle.corkAnimProgress === 'number' ? bottle.corkAnimProgress : 1.0;
    const neckTopY = h * 0.04;
    const corkY = neckTopY - (1 - cp) * 28;

    // 软木塞下段（塞入瓶颈）
    const plugGrad = ctx.createLinearGradient(w * 0.4, 0, w * 0.6, 0);
    plugGrad.addColorStop(0, '#78350f');
    plugGrad.addColorStop(0.5, '#d97706');
    plugGrad.addColorStop(1, '#451a03');

    ctx.fillStyle = plugGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, corkY);
    ctx.lineTo(w * 0.58, corkY);
    ctx.lineTo(w * 0.55, corkY + 16);
    ctx.lineTo(w * 0.45, corkY + 16);
    ctx.closePath();
    ctx.fill();

    // 软木塞饱满圆顶帽
    const capGrad = ctx.createRadialGradient(w * 0.48, corkY - 4, 2, w * 0.5, corkY - 4, 12);
    capGrad.addColorStop(0, '#fef08a');
    capGrad.addColorStop(0.6, '#d97706');
    capGrad.addColorStop(1, '#92400e');

    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, corkY, w * 0.16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 气密冲击波微光圈 (cp 在 0.3 ~ 0.7 之间展现)
    if (cp > 0.25 && cp < 0.75) {
      const p = (cp - 0.25) / 0.5;
      ctx.strokeStyle = `rgba(255, 250, 200, ${(1 - p).toFixed(2)})`;
      ctx.lineWidth = 2 * (1 - p);
      ctx.beginPath();
      ctx.ellipse(w * 0.5, neckTopY, (w * 0.2) + p * 20, 5 + p * 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
