// ============================================================================
// 01_platform_audio.js: 跨平台适配层与纯代码物理合成音频引擎 (Zero External Assets)
// ============================================================================

const Platform = {
  isWechat: typeof wx !== 'undefined' && !!wx.getSystemInfoSync,
  isDouyin: typeof tt !== 'undefined',
  
  createMainCanvas() {
    if (typeof canvas !== 'undefined') return canvas;
    if (this.isWechat && wx.createCanvas) return wx.createCanvas();
    if (this.isDouyin && tt.createCanvas) return tt.createCanvas();
    if (typeof document !== 'undefined' && document.getElementById) {
      const c = document.getElementById('game-canvas');
      if (c) return c;
      const created = document.createElement('canvas');
      created.id = 'game-canvas';
      document.body.appendChild(created);
      return created;
    }
    return null;
  },

  createCanvas(width = 300, height = 300) {
    return this.createOffscreenCanvas(width, height);
  },

  createOffscreenCanvas(width = 300, height = 300) {
    if (this.isWechat && wx.createOffscreenCanvas) return wx.createOffscreenCanvas({ type: '2d', width, height });
    if (this.isDouyin && tt.createOffscreenCanvas) return tt.createOffscreenCanvas({ type: '2d', width, height });
    if (typeof document !== 'undefined' && document.createElement) {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      return c;
    }
    return null;
  },

  getScreenSize() {
    if (this.isWechat) {
      const info = wx.getSystemInfoSync();
      return { width: info.windowWidth, height: info.windowHeight, dpr: Math.min(info.pixelRatio || 1, 3) };
    }
    if (this.isDouyin) {
      const info = tt.getSystemInfoSync();
      return { width: info.windowWidth, height: info.windowHeight, dpr: Math.min(info.pixelRatio || 1, 3) };
    }
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth || 412,
        height: window.innerHeight || 860,
        dpr: Math.min(window.devicePixelRatio || 1, 3)
      };
    }
    return { width: 412, height: 860, dpr: 2 };
  },

  getStorage(key, defVal) {
    try {
      if (this.isWechat) return wx.getStorageSync(key) || defVal;
      if (this.isDouyin) return tt.getStorageSync(key) || defVal;
      if (typeof localStorage !== 'undefined') {
        const v = localStorage.getItem(key);
        return v !== null ? v : defVal;
      }
    } catch (e) {}
    return defVal;
  },

  setStorage(key, val) {
    try {
      if (this.isWechat) { wx.setStorageSync(key, val); return; }
      if (this.isDouyin) { tt.setStorageSync(key, val); return; }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, String(val));
      }
    } catch (e) {}
  },

  triggerHaptic(duration = 15) {
    try {
      if (this.isWechat && wx.vibrateShort) wx.vibrateShort({ type: 'light' });
      else if (this.isDouyin && tt.vibrateShort) tt.vibrateShort();
      else if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(duration);
    } catch (e) {}
  }
};

class AudioManager {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.hapticEnabled = true;
  }

  ensureContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }
    const AudioCtor = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
                      (typeof wx !== 'undefined' && wx.createWebAudioContext) || null;
    if (AudioCtor) {
      try {
        this.ctx = typeof wx !== 'undefined' && wx.createWebAudioContext ? wx.createWebAudioContext() : new AudioCtor();
      } catch (e) {}
    }
    return this.ctx;
  }

  playTone(fStart, fEnd, tStart, dur, gainVal = 0.08, type = 'sine', filterFreq = 1200) {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, tStart);

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, fStart), tStart);
      if (fEnd !== fStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), tStart + dur);
      }

      gain.gain.setValueAtTime(0.001, tStart);
      gain.gain.linearRampToValueAtTime(gainVal, tStart + dur * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, tStart + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(tStart);
      osc.stop(tStart + dur + 0.05);
    } catch (e) {}
  }

  playNoise(tStart, dur, fStart = 600, fEnd = 300, gainVal = 0.04) {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const bufferSize = Math.max(256, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-3.5 * (i / bufferSize));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(fStart, tStart);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), tStart + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal, tStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, tStart + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(tStart);
      noise.stop(tStart + dur);
    } catch (e) {}
  }

  playSound(type) {
    if (this.hapticEnabled) {
      Platform.triggerHaptic(type === 'cork_slam' ? 24 : 10);
    }
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (type) {
      case 'select':
        this.playNoise(now, 0.035, 650, 880, 0.03);
        this.playTone(395, 555, now, 0.065, 0.07, 'sine', 1100);
        break;
      case 'deselect':
      case 'bottle_land':
        this.playNoise(now, 0.045, 420, 220, 0.04);
        this.playTone(180, 80, now, 0.07, 0.09, 'sine', 450);
        break;
      case 'pour':
        this.playNoise(now, 0.28, 700, 1200, 0.05);
        this.playTone(320, 480, now, 0.26, 0.06, 'triangle', 900);
        break;
      case 'cork_slam':
        this.playNoise(now, 0.06, 420, 220, 0.06);
        this.playTone(165, 55, now + 0.02, 0.09, 0.14, 'sine', 380);
        this.playTone(523.25, 525, now + 0.09, 0.22, 0.05, 'sine', 1100);
        break;
      case 'ui_tap':
      case 'btn_tap':
        this.playNoise(now, 0.02, 950, 680, 0.025);
        this.playTone(480, 360, now, 0.045, 0.06, 'sine', 950);
        break;
      case 'ice_break':
        this.playNoise(now, 0.08, 1100, 680, 0.05);
        this.playTone(880, 620, now + 0.02, 0.10, 0.06, 'triangle', 1400);
        break;
      case 'stone_break':
        this.playNoise(now, 0.08, 380, 190, 0.06);
        this.playTone(196, 110, now + 0.02, 0.12, 0.08, 'sine', 500);
        break;
      case 'mystery_reveal':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.playTone(f, f * 1.01, now + i * 0.045, 0.20, 0.06, 'sine', 1300);
        });
        break;
      case 'btn_hint':
        this.playTone(587.33, 587.33, now, 0.22, 0.06, 'sine', 1200);
        this.playTone(880.0, 880.0, now + 0.035, 0.25, 0.05, 'sine', 1300);
        break;
      case 'btn_shuffle':
        this.playNoise(now, 0.16, 420, 780, 0.04);
        [440, 523.25, 659.25].forEach((f, i) => {
          this.playTone(f, f * 1.02, now + i * 0.045, 0.12, 0.06, 'sine', 1100);
        });
        break;
      case 'btn_undo':
        this.playTone(587.33, 560, now, 0.065, 0.06, 'sine', 1000);
        this.playTone(440, 415, now + 0.045, 0.085, 0.06, 'sine', 850);
        break;
      case 'win':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
          this.playTone(f, f * 1.01, now + i * 0.06, 0.35, 0.08, 'triangle', 1500);
        });
        break;
    }
  }
}
