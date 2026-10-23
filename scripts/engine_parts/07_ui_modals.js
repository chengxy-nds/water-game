// ============================================================================
// 07_ui_modals.js: 虚拟坐标 HitBox 管理器、UI 界面布局与纯 Canvas 弹窗系统
// ============================================================================

class HitBoxManager {
  constructor() {
    this.boxes = [];
  }

  clear() {
    this.boxes.length = 0;
  }

  add(id, x, y, w, h, onClick) {
    this.boxes.push({ id, x, y, w, h, onClick });
  }

  dispatch(tx, ty) {
    // 倒序检测（顶层弹窗与按钮优先响应）
    for (let i = this.boxes.length - 1; i >= 0; i--) {
      const b = this.boxes[i];
      if (tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h) {
        if (b.onClick) b.onClick();
        return true;
      }
    }
    return false;
  }
}

class UIRenderer {
  constructor(textureAtlas, hitBoxManager) {
    this.atlas = textureAtlas;
    this.hitboxes = hitBoxManager;
    this.activeModal = null; // null | 'win' | 'fail' | 'pause'
  }

  drawThemeBackground(ctx, w, h) {
    // 晨曦流金高质感自然渐变背景
    const base = ctx.createLinearGradient(0, 0, w * 0.9, h);
    base.addColorStop(0, '#b59756');
    base.addColorStop(0.28, '#d3ab55');
    base.addColorStop(0.56, '#da9b43');
    base.addColorStop(0.88, '#88986b');
    base.addColorStop(1, '#6f8661');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    const warmMid = ctx.createRadialGradient(w * 0.3, h * 0.56, 10, w * 0.3, h * 0.56, Math.max(w, h) * 0.62);
    warmMid.addColorStop(0, 'rgba(231, 164, 68, 0.92)');
    warmMid.addColorStop(0.48, 'rgba(223, 157, 63, 0.65)');
    warmMid.addColorStop(1, 'rgba(216, 155, 68, 0)');
    ctx.fillStyle = warmMid;
    ctx.fillRect(0, 0, w, h);

    const sunGlow = ctx.createRadialGradient(w * 0.46, h * 0.19, 5, w * 0.46, h * 0.19, Math.max(w, h) * 0.40);
    sunGlow.addColorStop(0, 'rgba(255, 238, 145, 0.46)');
    sunGlow.addColorStop(1, 'rgba(255, 224, 110, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, w, h);
  }

  // 顶部栏（设置、关卡号胶囊、重置按钮）
  drawTopBar(ctx, layout, gameState) {
    const { topBarY, viewW } = layout;

    // 1. 左侧设置圆形磨砂按钮
    const btnSize = 42;
    const leftX = 20, rightX = viewW - 20 - btnSize;
    this.drawCircleBtn(ctx, leftX, topBarY, btnSize, '⚙️');
    this.hitboxes.add('btn_pause', leftX, topBarY, btnSize, btnSize, () => {
      this.activeModal = 'pause';
    });

    // 2. 右侧重置圆形按钮
    this.drawCircleBtn(ctx, rightX, topBarY, btnSize, '↻');
    this.hitboxes.add('btn_restart', rightX, topBarY, btnSize, btnSize, () => {
      gameState.loadLevel(gameState.levelId);
    });

    // 3. 中间流金关卡数字胶囊
    const pillW = 160, pillH = 40;
    const pillX = (viewW - pillW) * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pillX, topBarY + 1, pillW, pillH, 20);
    const pg = ctx.createLinearGradient(pillX, topBarY, pillX, topBarY + pillH);
    pg.addColorStop(0, '#ebb252');
    pg.addColorStop(0.55, '#d48e2c');
    pg.addColorStop(1, '#b87318');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 17px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleText = (gameState.remainingMoves !== null) ? `剩余 ${gameState.remainingMoves} 步` : `第 ${gameState.levelId} 关`;
    ctx.fillText(titleText, viewW * 0.5, topBarY + 21);
    ctx.restore();
  }

  drawCircleBtn(ctx, x, y, size, iconText) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.font = '700 18px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5c3d18';
    ctx.fillText(iconText, x + size * 0.5, y + size * 0.5 + 1);
    ctx.restore();
  }

  // 盲袋展示区
  drawBagsArea(ctx, layout, bags) {
    if (!bags || bags.length === 0) return;
    const { bagsY, viewW } = layout;
    const bagW = 56, bagH = 70;
    const spacing = 12;
    const totalW = bags.length * bagW + (bags.length - 1) * spacing;
    const startX = (viewW - totalW) * 0.5;

    bags.forEach((bag, idx) => {
      const bx = startX + idx * (bagW + spacing);
      const by = bagsY;

      const bagTex = bag.locked ? this.atlas.get('bag_locked') : this.atlas.get(`bag_${bag.color || 'green'}`);
      if (bagTex) {
        ctx.drawImage(bagTex, bx, by, bagW, bagH);
      }

      // 若已经打包该颜色瓶子，居中盖一个绿色勾选印章
      if (bag.packedBottle) {
        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx + bagW * 0.5, by + bagH * 0.6, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', bx + bagW * 0.5, by + bagH * 0.6 + 1);
        ctx.restore();
      }
    });
  }

  // 底部 4 枚 3D 鹅卵石按钮
  drawBottomControls(ctx, layout, gameState) {
    const { bottomY, viewW } = layout;
    const btnSize = 58;
    const count = 4;
    const spacing = Math.min(22, (viewW - count * btnSize - 40) / (count - 1));
    const totalW = count * btnSize + (count - 1) * spacing;
    const startX = (viewW - totalW) * 0.5;

    const btns = [
      { id: 'btn_shuffle', tex: 'btn_shuffle', uses: gameState.shuffleUses, onClick: () => gameState.executeShuffle() },
      { id: 'btn_undo',    tex: 'btn_undo',    uses: gameState.undoUses,    onClick: () => gameState.executeUndo() },
      { id: 'btn_hint',    tex: 'btn_hint',    uses: gameState.hintUses,    onClick: () => gameState.executeHint() },
      { id: 'btn_add',     tex: 'btn_add',     uses: gameState.addBottleUses, onClick: () => gameState.executeAddBottle() }
    ];

    btns.forEach((btn, idx) => {
      const bx = startX + idx * (btnSize + spacing);
      const by = bottomY;

      const tex = this.atlas.get(btn.tex);
      if (tex) {
        ctx.drawImage(tex, bx, by, btnSize, btnSize);
      }

      // 右上角数字角标
      ctx.save();
      ctx.fillStyle = '#ea580c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(bx + btnSize - 6, by + 6, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 11px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(btn.uses), bx + btnSize - 6, by + 6.5);
      ctx.restore();

      this.hitboxes.add(btn.id, bx, by, btnSize, btnSize, btn.onClick);
    });
  }

  // Toast 浮动提示
  drawToast(ctx, viewW, viewH, text, alpha) {
    if (alpha <= 0 || !text) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '800 14px "Fredoka", sans-serif';
    const tw = ctx.measureText(text).width;
    const pw = tw + 32, ph = 38;
    const cx = viewW * 0.5, cy = viewH * 0.22;

    ctx.fillStyle = 'rgba(28, 18, 10, 0.82)';
    ctx.beginPath();
    ctx.roundRect(cx - pw * 0.5, cy - ph * 0.5, pw, ph, 19);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  // 纯 Canvas 弹窗系统
  drawModal(ctx, viewW, viewH, gameState) {
    if (!this.activeModal) return;

    // 1. 背景暗化遮罩
    ctx.save();
    ctx.fillStyle = 'rgba(20, 12, 6, 0.65)';
    ctx.fillRect(0, 0, viewW, viewH);

    // 2. 暖象牙卡片
    const cardW = Math.min(viewW - 48, 340);
    const cardH = 260;
    const cardX = (viewW - cardW) * 0.5;
    const cardY = (viewH - cardH) * 0.5;

    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fffdf7';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#f3b14b';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // 顶部流金标题胶囊
    const pillW = 180, pillH = 38;
    const pillX = (viewW - pillW) * 0.5;
    const pillY = cardY - 18;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 19);
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    let titleText = '游戏设置';
    if (this.activeModal === 'win') titleText = '恭喜通关！';
    if (this.activeModal === 'fail') titleText = '步数耗尽';

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 18px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, viewW * 0.5, pillY + 19);

    // 右上角关闭按钮
    const closeSize = 28;
    const closeX = cardX + cardW - closeSize - 12;
    const closeY = cardY + 12;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(closeX + closeSize * 0.5, closeY + closeSize * 0.5, closeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px sans-serif';
    ctx.fillText('✕', closeX + closeSize * 0.5, closeY + closeSize * 0.5);
    this.hitboxes.add('modal_close', closeX - 4, closeY - 4, closeSize + 8, closeSize + 8, () => {
      this.activeModal = null;
    });

    // 弹窗内部交互按钮
    const btnW = cardW - 60;
    const btnH = 46;
    const btnX = (viewW - btnW) * 0.5;

    if (this.activeModal === 'win') {
      // 胜利三星金星
      for (let s = -1; s <= 1; s++) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(viewW * 0.5 + s * 46, cardY + 75, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 下一关大按钮
      const nextBtnY = cardY + 160;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.roundRect(btnX, nextBtnY, btnW, btnH, 23);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 18px "Fredoka", sans-serif';
      ctx.fillText('进入下一关 ➔', viewW * 0.5, nextBtnY + 24);
      this.hitboxes.add('btn_next_level', btnX, nextBtnY, btnW, btnH, () => {
        this.activeModal = null;
        gameState.loadLevel(gameState.levelId + 1);
      });
    } else if (this.activeModal === 'fail') {
      ctx.fillStyle = '#78350f';
      ctx.font = '800 16px "Fredoka", sans-serif';
      ctx.fillText('步数已用尽，别气馁！', viewW * 0.5, cardY + 90);

      // 重新挑战
      const retryY = cardY + 150;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(btnX, retryY, btnW, btnH, 23);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 18px "Fredoka", sans-serif';
      ctx.fillText('↻ 重新挑战本关', viewW * 0.5, retryY + 24);
      this.hitboxes.add('btn_retry_level', btnX, retryY, btnW, btnH, () => {
        this.activeModal = null;
        gameState.loadLevel(gameState.levelId);
      });
    } else if (this.activeModal === 'pause') {
      // 重新挑战
      const b1Y = cardY + 80;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(btnX, b1Y, btnW, 44, 22);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 16px "Fredoka", sans-serif';
      ctx.fillText('↻ 重新挑战本关', viewW * 0.5, b1Y + 22);
      this.hitboxes.add('btn_pause_retry', btnX, b1Y, btnW, 44, () => {
        this.activeModal = null;
        gameState.loadLevel(gameState.levelId);
      });

      // 声音开关切换
      const b2Y = cardY + 145;
      const sndText = gameState.audio.soundEnabled ? '🔊 音效：开启' : '🔈 音效：静音';
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(btnX, b2Y, btnW, 44, 22);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 16px "Fredoka", sans-serif';
      ctx.fillText(sndText, viewW * 0.5, b2Y + 22);
      this.hitboxes.add('btn_pause_sound', btnX, b2Y, btnW, 44, () => {
        gameState.audio.soundEnabled = !gameState.audio.soundEnabled;
      });
    }

    ctx.restore();
  }
}
