// ============================================================================
// 04_particle_stream.js: 零 GC 对象池粒子系统与物理重力倾倒水柱
// ============================================================================

class ParticlePool {
  constructor(size = 90) {
    this.pool = Array.from({ length: size }, () => ({
      active: false,
      type: 'splash',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 2,
      color: '#ffffff',
      alpha: 1,
      rot: 0,
      rotSpd: 0,
      t: 0,
      startX: 0,
      startY: 0,
      ctrlX: 0,
      ctrlY: 0,
      endX: 0,
      endY: 0
    }));
  }

  spawnSplash(x, y, color) {
    for (let i = 0; i < 3; i++) {
      const p = this.pool.find(item => !item.active);
      if (!p) break;
      p.active = true;
      p.type = 'splash';
      p.x = x + (Math.random() - 0.5) * 8;
      p.y = y;
      const ang = (Math.random() * 0.7 - 0.35) * Math.PI - Math.PI * 0.5;
      const spd = 60 + Math.random() * 80;
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd;
      p.r = 1.2 + Math.random() * 1.8;
      p.color = (Math.random() < 0.35) ? '#ffffff' : (color.topLight || '#ffffff');
      p.alpha = 0.95;
    }
  }

  spawnCorkStars(x, y) {
    for (let i = 0; i < 8; i++) {
      const p = this.pool.find(item => !item.active);
      if (!p) break;
      p.active = true;
      p.type = 'cork_star';
      p.x = x;
      p.y = y;
      const ang = (i / 8) * Math.PI * 2 + Math.random() * 0.2;
      const spd = 40 + Math.random() * 50;
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd;
      p.r = 2 + Math.random() * 1.5;
      p.color = (i % 2 === 0) ? '#fef08a' : '#ffffff';
      p.alpha = 1;
    }
  }

  spawnFlyingStar(sx, sy, ex, ey, onFinish = null) {
    const p = this.pool.find(item => !item.active);
    if (!p) return;
    p.active = true;
    p.type = 'flying_star';
    p.t = 0;
    p.startX = sx;
    p.startY = sy;
    p.endX = ex;
    p.endY = ey;
    p.ctrlX = (sx + ex) * 0.5;
    p.ctrlY = Math.min(sy, ey) - 80;
    p.r = 5;
    p.color = '#fef08a';
    p.alpha = 1;
    p.onFinish = onFinish;
  }

  spawnWinConfetti(w, h) {
    const colors = ['#f59e0b', '#38bdf8', '#4ade80', '#ec4899', '#a855f7', '#fbbf24', '#ffffff'];
    for (let i = 0; i < 45; i++) {
      const p = this.pool.find(item => !item.active);
      if (!p) break;
      p.active = true;
      p.type = 'confetti';
      p.x = w * 0.5 + (Math.random() - 0.5) * 80;
      p.y = h * 0.45;
      const ang = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 220;
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd - 90;
      p.r = 3 + Math.random() * 4;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 1;
      p.rot = Math.random() * Math.PI;
      p.rotSpd = (Math.random() - 0.5) * 8;
    }
  }

  updateAndDraw(ctx, dt) {
    for (const p of this.pool) {
      if (!p.active) continue;

      if (p.type === 'splash') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 420 * dt; // 重力加速度
        p.alpha -= 2.2 * dt;

        if (p.alpha <= 0) { p.active = false; continue; }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'cork_star') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha -= 1.8 * dt;

        if (p.alpha <= 0) { p.active = false; continue; }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'flying_star') {
        p.t += 1.6 * dt;
        if (p.t >= 1) {
          p.active = false;
          if (p.onFinish) p.onFinish();
          continue;
        }
        const t = p.t;
        const invT = 1 - t;
        p.x = invT * invT * p.startX + 2 * invT * t * p.ctrlX + t * t * p.endX;
        p.y = invT * invT * p.startY + 2 * invT * t * p.ctrlY + t * t * p.endY;

        ctx.save();
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + 0.3 * Math.sin(t * 12)), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'confetti') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 320 * dt;
        p.vx *= 0.98;
        p.rot += p.rotSpd * dt;
        p.alpha -= 0.65 * dt;

        if (p.alpha <= 0) { p.active = false; continue; }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
        ctx.restore();
      }
    }
  }
}

// 倾倒重力动态水柱绘制函数
function drawLiveStream(ctx, spoutX, spoutY, mouthX, mouthY, color, flowProgress) {
  if (flowProgress <= 0.01 || flowProgress >= 0.99) return;

  ctx.save();
  // 重力下垂自然弧线
  const midX = (spoutX + mouthX) * 0.5;
  const midY = (spoutY + mouthY) * 0.5 - 14;

  const grad = ctx.createLinearGradient(spoutX, spoutY, mouthX, mouthY);
  grad.addColorStop(0, color.highlight || '#38bdf8');
  grad.addColorStop(0.5, color.mid || '#0284c7');
  grad.addColorStop(1, color.right || '#0369a1');

  // 水柱流线随进度从细到粗再收束
  const streamWidth = Math.max(2.5, 7.5 * Math.sin(flowProgress * Math.PI));

  ctx.strokeStyle = grad;
  ctx.lineWidth = streamWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(spoutX, spoutY);
  ctx.quadraticCurveTo(midX, midY, mouthX, mouthY);
  ctx.stroke();

  // 中心高光流线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = Math.max(1.2, streamWidth * 0.28);
  ctx.beginPath();
  ctx.moveTo(spoutX, spoutY);
  ctx.quadraticCurveTo(midX, midY, mouthX, mouthY);
  ctx.stroke();

  ctx.restore();
}
