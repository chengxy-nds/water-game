/**
 * AudioManager - 纯代码物理合成与小游戏原生音频管理器 (Zero External Assets)
 * 支持 Web Audio API 物理合成（气泡水声、清脆音、通关和弦）与小游戏 InnerAudioContext
 */

class AudioManager {
  constructor(platformModule) {
    this.platform = platformModule;
    this.muted = !!this.platform.getStorage('water_game_muted', false);
    this.ctx = null;

    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch (e) {}
      }
    }
  }

  resumeCtx() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.platform.setStorage('water_game_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playSelect() {
    if (this.muted) return;
    this.resumeCtx();
    if (this.ctx) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(840, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
        return;
      } catch (e) {}
    }
    this.platform.triggerHaptic(10);
  }

  playPour() {
    if (this.muted) return;
    this.resumeCtx();
    if (this.ctx) {
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.14);
        return;
      } catch (e) {}
    }
    this.platform.triggerHaptic(18);
  }

  playWin() {
    if (this.muted) return;
    this.resumeCtx();
    if (this.ctx) {
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = this.ctx.currentTime + idx * 0.1;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.25, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + 0.35);
        });
        return;
      } catch (e) {}
    }
    this.platform.triggerHaptic(40);
  }
}

if (typeof module !== 'undefined') {
  module.exports = AudioManager;
}

