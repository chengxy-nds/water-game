export interface PourSoundOptions {
  maxCap?: number;
  isGiantCat?: boolean;
  initialLayers?: number;
  moveCount?: number;
  durationMs?: number;
}

export type SoundEffect =
  | 'select'
  | 'cork_slam'
  | 'pack'
  | 'pour'
  | 'mystery_reveal'
  | 'ice_crack'
  | 'ice_shatter'
  | 'ice_break'
  | 'stone_break'
  | 'new_mechanic';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;
  public enabled: boolean = true;

  private ensureAudio(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.pinkNoiseBuffer) return this.pinkNoiseBuffer;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * 2.5);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }
    this.pinkNoiseBuffer = buffer;
    return buffer;
  }

  public playPour(options: PourSoundOptions = {}): void {
    const ctx = this.ensureAudio();
    if (!ctx) return;

    const {
      maxCap = 4,
      isGiantCat = false,
      initialLayers = 0,
      moveCount = 1,
      durationMs = 500,
    } = options;

    const now = ctx.currentTime;
    const durSec = Math.max(0.32, durationMs / 1000);
    const noiseBuf = this.getPinkNoiseBuffer(ctx);

    let baseStartFreq: number;
    let baseMaxFreq: number;
    let cavityQ: number;
    let glugRateHz: number;
    let streamGainLevel: number;

    if (isGiantCat) {
      baseStartFreq = 165;
      baseMaxFreq = 460;
      cavityQ = 6.5;
      glugRateHz = 6.2;
      streamGainLevel = 0.42;
    } else if (maxCap <= 2) {
      baseStartFreq = 680;
      baseMaxFreq = 1480;
      cavityQ = 3.8;
      glugRateHz = 14.5;
      streamGainLevel = 0.26;
    } else if (maxCap === 4) {
      baseStartFreq = 360;
      baseMaxFreq = 860;
      cavityQ = 4.6;
      glugRateHz = 9.8;
      streamGainLevel = 0.32;
    } else if (maxCap === 6) {
      baseStartFreq = 250;
      baseMaxFreq = 640;
      cavityQ = 5.4;
      glugRateHz = 7.8;
      streamGainLevel = 0.36;
    } else {
      baseStartFreq = 185;
      baseMaxFreq = 510;
      cavityQ = 6.8;
      glugRateHz = 6.5;
      streamGainLevel = 0.38;
    }

    const fillStartFrac = Math.min(0.92, initialLayers / maxCap);
    const fillEndFrac = Math.min(0.98, (initialLayers + moveCount) / maxCap);
    const freqStart = baseStartFreq + (baseMaxFreq - baseStartFreq) * Math.pow(fillStartFrac, 1.15);
    const freqEnd = baseStartFreq + (baseMaxFreq - baseStartFreq) * Math.pow(fillEndFrac, 1.15);

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;

    const cavityFilter = ctx.createBiquadFilter();
    cavityFilter.type = 'bandpass';
    cavityFilter.Q.setValueAtTime(cavityQ, now);
    cavityFilter.frequency.setValueAtTime(freqStart, now);
    cavityFilter.frequency.exponentialRampToValueAtTime(Math.max(freqStart + 20, freqEnd), now + durSec);

    const splashFilter = ctx.createBiquadFilter();
    splashFilter.type = 'bandpass';
    splashFilter.Q.setValueAtTime(1.8, now);
    const splashFreq = maxCap <= 2 ? 2400 : maxCap >= 6 ? 1350 : 1800;
    splashFilter.frequency.setValueAtTime(splashFreq, now);
    splashFilter.frequency.linearRampToValueAtTime(splashFreq * 1.25, now + durSec);

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(streamGainLevel, now + 0.045);
    mainGain.gain.setValueAtTime(streamGainLevel, now + durSec - 0.06);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + durSec);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(glugRateHz, now);
    lfoGain.gain.setValueAtTime(streamGainLevel * 0.22, now);
    lfo.connect(lfoGain).connect(mainGain.gain);

    const splashGain = ctx.createGain();
    const initSplashBoost = initialLayers === 0 ? 0.18 : 0.10;
    splashGain.gain.setValueAtTime(0.001, now);
    splashGain.gain.linearRampToValueAtTime(initSplashBoost, now + 0.03);
    splashGain.gain.exponentialRampToValueAtTime(0.04, now + durSec);

    noiseSrc.connect(cavityFilter).connect(mainGain).connect(ctx.destination);
    noiseSrc.connect(splashFilter).connect(splashGain).connect(ctx.destination);

    noiseSrc.start(now);
    lfo.start(now);
    noiseSrc.stop(now + durSec + 0.02);
    lfo.stop(now + durSec + 0.02);

    const dropletCount = Math.floor(5 + moveCount * 2.5 + (maxCap >= 6 ? 3 : 0));
    for (let i = 0; i < dropletCount; i++) {
      const progress = (i + 0.2 + Math.random() * 0.65) / dropletCount;
      const tDrop = now + 0.03 + progress * (durSec - 0.06);
      const dropDur = maxCap <= 2 ? 0.026 : maxCap >= 6 ? 0.045 : 0.034;

      const curCavityF = freqStart + (freqEnd - freqStart) * progress;
      const bubbleStartF = curCavityF * (0.95 + Math.random() * 0.35);
      const bubbleEndF = bubbleStartF * (1.22 + Math.random() * 0.12);

      const dropOsc = ctx.createOscillator();
      const dropFilter = ctx.createBiquadFilter();
      const dropGain = ctx.createGain();

      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(bubbleStartF, tDrop);
      dropOsc.frequency.exponentialRampToValueAtTime(bubbleEndF, tDrop + dropDur);

      dropFilter.type = 'bandpass';
      dropFilter.Q.setValueAtTime(8.0, tDrop);
      dropFilter.frequency.setValueAtTime(bubbleStartF * 1.1, tDrop);

      const peakG = (isGiantCat ? 0.065 : 0.048) * (0.7 + Math.random() * 0.5);
      dropGain.gain.setValueAtTime(0.0005, tDrop);
      dropGain.gain.linearRampToValueAtTime(peakG, tDrop + 0.006);
      dropGain.gain.exponentialRampToValueAtTime(0.0005, tDrop + dropDur);

      dropOsc.connect(dropFilter).connect(dropGain).connect(ctx.destination);
      dropOsc.start(tDrop);
      dropOsc.stop(tDrop + dropDur + 0.005);
    }
  }

  public playSound(type: SoundEffect, options?: PourSoundOptions): void {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'pour') {
      this.playPour(options);
    } else if (type === 'select') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(790, now + 0.055);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    } else if (type === 'cork_slam') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.095);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.115);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);

      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(380, now + 0.02);
      popOsc.frequency.exponentialRampToValueAtTime(720, now + 0.08);
      popGain.gain.setValueAtTime(0.16, now + 0.02);
      popGain.gain.exponentialRampToValueAtTime(0.008, now + 0.09);
      popOsc.connect(popGain).connect(ctx.destination);
      popOsc.start(now + 0.02);
      popOsc.stop(now + 0.10);
    } else if (type === 'mystery_reveal') {
      [587.33, 783.99, 1046.5, 1318.5, 1567.98].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.045);
        gain.gain.setValueAtTime(0.13, now + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.045 + 0.24);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.25);
      });
    } else if (type === 'ice_crack') {
      [1480, 2120, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + i * 0.03 + 0.09);
        gain.gain.setValueAtTime(0.15, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.03 + 0.1);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + i * 0.03 + 0.11);
      });
    } else if (type === 'ice_shatter' || type === 'ice_break') {
      [1760, 2349.3, 2637, 3136, 2093].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.032);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + i * 0.032 + 0.18);
        gain.gain.setValueAtTime(0.16, now + i * 0.032);
        gain.gain.exponentialRampToValueAtTime(0.004, now + i * 0.032 + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.032);
        osc.stop(now + i * 0.032 + 0.21);
      });
    } else if (type === 'stone_break') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.22);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'new_mechanic') {
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.15, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.006, now + i * 0.07 + 0.32);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.34);
      });
    } else if (type === 'pack') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);
        gain.gain.setValueAtTime(0.14, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.008, now + 0.25 + idx * 0.055);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + 0.27 + idx * 0.055);
      });
    }
  }
}

export const audioEngine = new AudioEngine();
