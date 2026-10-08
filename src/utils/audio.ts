// Web Audio API Synthesizer for tactile, satisfying game feedback

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Soft glass tap when selecting a tube
  playSelect() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // ignore audio context failures
    }
  }

  // Liquid stream pouring sound with organic harmonics
  playPour(amount: number = 1) {
    this.playDynamicPour(0, amount, 4);
  }

  /**
   * Dynamic physical liquid stream pouring sound with rising acoustic pitch.
   * As the liquid fills the tube, the air column resonance and splash impact frequency
   * continuously rise, producing realistic physical acoustic feedback based on current volume.
   * 
   * @param startVolume Current liquid segments in the target tube (0..capacity-1)
   * @param pourCount Number of segments being added (1..capacity)
   * @param capacity Total tube capacity (default 4)
   */
  playDynamicPour(startVolume: number = 0, pourCount: number = 1, capacity: number = 4) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const clampedCap = Math.max(1, capacity);
      const clampedStart = Math.max(0, Math.min(startVolume, clampedCap - 1));
      const clampedCount = Math.max(1, Math.min(pourCount, clampedCap - clampedStart));
      const endVolume = Math.min(clampedCap, clampedStart + clampedCount);

      const rStart = clampedStart / clampedCap;
      const rEnd = endVolume / clampedCap;

      // Duration matched to game pour animation phase (~400ms - 480ms)
      const duration = Math.min(0.52, 0.38 + clampedCount * 0.045);
      const now = this.ctx.currentTime;

      // 1. Hydrodynamic Fluid Stream Noise with Upward Sweeping Bandpass Filter
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastVal = 0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink-filtered noise for smooth, natural rushing water stream
        const white = Math.random() * 2 - 1;
        lastVal = lastVal * 0.4 + white * 0.6;
        data[i] = lastVal;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Sweeping bandpass filter: frequency increases as the liquid surface gets closer to the mouth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const bpStart = 500 + rStart * 600; // e.g. 500Hz -> 950Hz
      const bpEnd = 680 + rEnd * 1050;   // e.g. 940Hz -> 1730Hz
      filter.frequency.setValueAtTime(bpStart, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(100, bpEnd), now + duration * 0.9);
      filter.Q.setValueAtTime(3.2 + rStart * 1.2, now);
      filter.Q.linearRampToValueAtTime(4.8 + rEnd * 1.5, now + duration * 0.9);

      // Volume envelope for water rush
      const noiseGain = this.ctx.createGain();
      const volumeScale = Math.min(1.2, 0.85 + clampedCount * 0.15);
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.075 * volumeScale, now + 0.04);
      noiseGain.gain.setValueAtTime(0.075 * volumeScale, now + duration * 0.68);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // 2. Cavity Helmholtz Resonant Tone (Fundamental rising pitch)
      // Pitch increases smoothly with rising water level (shortening air column)
      const baseFreq = (r: number) => 280 * (1 + 1.7 * r + 0.9 * (r * r));
      const freqStart = baseFreq(rStart);
      const freqEnd = baseFreq(rEnd);

      const cavityOsc = this.ctx.createOscillator();
      const cavityGain = this.ctx.createGain();
      cavityOsc.type = 'sine';
      cavityOsc.frequency.setValueAtTime(freqStart, now);
      cavityOsc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration * 0.92);

      // Micro bubbling flutter (LFO vibrato simulating bubble entrapment)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(18 + clampedCount * 2.5, now); // ~18-23 Hz bubbling flutter
      lfoGain.gain.setValueAtTime(14 + rEnd * 12, now);           // vibrato depth
      lfo.connect(cavityOsc.frequency);

      cavityGain.gain.setValueAtTime(0.001, now);
      cavityGain.gain.linearRampToValueAtTime(0.08 * volumeScale, now + 0.05);
      cavityGain.gain.linearRampToValueAtTime(0.085 * volumeScale, now + duration * 0.7);
      cavityGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      cavityOsc.connect(cavityGain);
      cavityGain.connect(this.ctx.destination);

      // 3. Bubble harmonics / liquid droplet sparkle (Higher harmonic sparkle)
      const bubbleOsc = this.ctx.createOscillator();
      const bubbleGain = this.ctx.createGain();
      bubbleOsc.type = 'triangle';
      bubbleOsc.frequency.setValueAtTime(freqStart * 1.5, now);
      bubbleOsc.frequency.exponentialRampToValueAtTime(freqEnd * 1.6, now + duration * 0.88);

      bubbleGain.gain.setValueAtTime(0.001, now);
      bubbleGain.gain.linearRampToValueAtTime(0.035 * volumeScale, now + 0.06);
      bubbleGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.85);

      bubbleOsc.connect(bubbleGain);
      bubbleGain.connect(this.ctx.destination);

      // 4. If filled completely to the brim (endVolume >= clampedCap), add brim droplet ping
      if (endVolume >= clampedCap) {
        const brimTime = now + duration * 0.82;
        const brimOsc = this.ctx.createOscillator();
        const brimGain = this.ctx.createGain();
        brimOsc.type = 'sine';
        brimOsc.frequency.setValueAtTime(1280, brimTime);
        brimOsc.frequency.exponentialRampToValueAtTime(1580, brimTime + 0.08);

        brimGain.gain.setValueAtTime(0.001, brimTime);
        brimGain.gain.linearRampToValueAtTime(0.055, brimTime + 0.015);
        brimGain.gain.exponentialRampToValueAtTime(0.001, brimTime + 0.12);

        brimOsc.connect(brimGain);
        brimGain.connect(this.ctx.destination);

        brimOsc.start(brimTime);
        brimOsc.stop(brimTime + 0.12);
      }

      // Start all nodes
      noiseSource.start(now);
      cavityOsc.start(now);
      lfo.start(now);
      bubbleOsc.start(now);

      // Stop all nodes
      noiseSource.stop(now + duration);
      cavityOsc.stop(now + duration);
      lfo.stop(now + duration);
      bubbleOsc.stop(now + duration);
    } catch {
      // Audio context failure safeguard
    }
  }

  // Sparkling chime when a single tube is 100% completed
  playTubeComplete() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {
      // ignore
    }
  }

  // Grand victory fanfare
  playVictory() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High-spirited major arpeggio
      const notes = [
        { f: 440.0, d: 0.12 }, // A4
        { f: 554.37, d: 0.12 }, // C#5
        { f: 659.25, d: 0.12 }, // E5
        { f: 880.0, d: 0.35 },  // A5
        { f: 1108.73, d: 0.45 }, // C#6
      ];

      let timeOffset = 0;
      notes.forEach((note) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + timeOffset;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + note.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(start);
        osc.stop(start + note.d);
        timeOffset += 0.1;
      });
    } catch {
      // ignore
    }
  }

  // Soft rewinding whoosh for undo
  playUndo() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  // Soft gentle physical feedback chime for invalid pour attempt (Rule 10)
  playInvalidSoft() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Soft gentle two-tone glass wooden knock / droplet refusal chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.16);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore
    }
  }

  // Subtle error buzz
  playError() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  // Haptic feedback if available on device
  vibrate(ms: number = 20) {
    if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  }
}

export const soundManager = new SoundManager();
