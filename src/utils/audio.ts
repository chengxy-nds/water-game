// Web Audio API Synthesizer for tactile, satisfying game feedback

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public musicEnabled: boolean = false;

  // Background music loop state
  private musicTimer: number | null = null;
  private musicGain: GainNode | null = null;
  private musicStep = 0;

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

      // Duration matched to extended pour animation phase (~1.0s - 1.1s)
      const duration = Math.min(1.1, 0.85 + clampedCount * 0.08);
      const now = this.ctx.currentTime;

      // 1. Hydrodynamic Fluid Stream Noise with Upward Sweeping Bandpass Filter
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastVal = 0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink-filtered noise for smooth, natural rushing water stream
        const white = Math.random() * 2 - 1;
        lastVal = lastVal * 0.45 + white * 0.55;
        data[i] = lastVal;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Sweeping bandpass filter: resonant air column acoustics rising with liquid level
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const bpStart = 420 + rStart * 580; // e.g. 420Hz -> 850Hz
      const bpEnd = 620 + rEnd * 980;    // e.g. 880Hz -> 1600Hz
      filter.frequency.setValueAtTime(bpStart, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(100, bpEnd), now + duration * 0.92);
      filter.Q.setValueAtTime(3.5 + rStart * 1.5, now);
      filter.Q.linearRampToValueAtTime(5.2 + rEnd * 1.8, now + duration * 0.92);

      // Volume envelope for rushing water
      const noiseGain = this.ctx.createGain();
      const volumeScale = Math.min(1.2, 0.85 + clampedCount * 0.15);
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.065 * volumeScale, now + 0.04);
      noiseGain.gain.setValueAtTime(0.065 * volumeScale, now + duration * 0.72);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // 2. Cascading Physical Air Bubble "Glug-Glug-Bloop" Pulses
      // As water enters, air bubbles repeatedly detach & pop underwater.
      // Crucially, the pitch of each bubble climbs higher as water level in the bottle rises!
      const numBubbles = Math.max(7, Math.min(14, Math.floor(clampedCount * 4 + 4)));
      for (let i = 0; i < numBubbles; i++) {
        const tProgress = i / Math.max(1, numBubbles - 1);
        const bubbleTime = now + 0.04 + tProgress * (duration * 0.86) + (Math.random() * 0.02 - 0.01);

        // Instantaneous water level fraction (0.0 to 1.0)
        const rCurrent = rStart + (rEnd - rStart) * tProgress;
        // Pitch climbs from ~250Hz (deep hollow glug) up to ~950Hz (high clear plink)
        const bubblePitch = 250 + rCurrent * 680 + (Math.random() * 26 - 13);

        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sine';

        // Physics of bubble detachment: rapid upward chirp in ~35ms
        bOsc.frequency.setValueAtTime(bubblePitch * 0.88, bubbleTime);
        bOsc.frequency.exponentialRampToValueAtTime(bubblePitch * 1.15, bubbleTime + 0.035);

        // Snappy organic bubble envelope
        const bubbleVol = (0.05 + Math.random() * 0.025) * volumeScale;
        bGain.gain.setValueAtTime(0.0001, bubbleTime);
        bGain.gain.linearRampToValueAtTime(bubbleVol, bubbleTime + 0.005);
        bGain.gain.exponentialRampToValueAtTime(0.0001, bubbleTime + 0.045);

        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(bubbleTime);
        bOsc.stop(bubbleTime + 0.05);
      }

      // 3. Smooth Underlying Cavity Acoustic Resonance
      const baseFreq = (r: number) => 260 * (1 + 1.5 * r + 0.8 * (r * r));
      const freqStart = baseFreq(rStart);
      const freqEnd = baseFreq(rEnd);

      const cavityOsc = this.ctx.createOscillator();
      const cavityGain = this.ctx.createGain();
      cavityOsc.type = 'sine';
      cavityOsc.frequency.setValueAtTime(freqStart, now);
      cavityOsc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration * 0.92);

      cavityGain.gain.setValueAtTime(0.001, now);
      cavityGain.gain.linearRampToValueAtTime(0.045 * volumeScale, now + 0.05);
      cavityGain.gain.linearRampToValueAtTime(0.05 * volumeScale, now + duration * 0.7);
      cavityGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      cavityOsc.connect(cavityGain);
      cavityGain.connect(this.ctx.destination);

      // 4. If filled completely to the brim (endVolume >= clampedCap), add brim glass ping
      if (endVolume >= clampedCap) {
        const brimTime = now + duration * 0.82;
        const brimOsc = this.ctx.createOscillator();
        const brimGain = this.ctx.createGain();
        brimOsc.type = 'sine';
        brimOsc.frequency.setValueAtTime(1280, brimTime);
        brimOsc.frequency.exponentialRampToValueAtTime(1580, brimTime + 0.08);

        brimGain.gain.setValueAtTime(0.001, brimTime);
        brimGain.gain.linearRampToValueAtTime(0.065, brimTime + 0.015);
        brimGain.gain.exponentialRampToValueAtTime(0.001, brimTime + 0.12);

        brimOsc.connect(brimGain);
        brimGain.connect(this.ctx.destination);

        brimOsc.start(brimTime);
        brimOsc.stop(brimTime + 0.12);
      }

      // Start stream and background resonance
      noiseSource.start(now);
      cavityOsc.start(now);

      // Stop stream and background resonance
      noiseSource.stop(now + duration);
      cavityOsc.stop(now + duration);
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

  // Wooden cork plug-in pop sound
  playCorkPop() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // ignore
    }
  }

  // Satisfying shopping bag catch chime & gulp
  playBagCatch() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.15); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
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

  // --- Background Music: gentle ambient arpeggio loop ---

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  private startMusic() {
    if (this.musicTimer !== null) return;
    this.initContext();
    if (!this.ctx) return;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.14, this.ctx.currentTime + 1.5);
    this.musicGain.connect(this.ctx.destination);

    this.musicStep = 0;
    const stepMs = 640;

    const tick = () => {
      if (!this.musicEnabled || !this.ctx || !this.musicGain) return;
      // Soft pentatonic melody (C major pentatonic)
      const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
      const pattern = [0, 3, 5, 7, 5, 3, 2, 4, 6, 7, 5, 4, 3, 1, 0, 2];
      const freq = scale[pattern[this.musicStep % pattern.length]];
      this.playMusicNote(freq, 1.0, 0.085);
      // Low warm drone every 4 steps
      if (this.musicStep % 4 === 0) {
        this.playMusicNote(scale[0] / 2, 2.2, 0.055);
      }
      this.musicStep++;
    };

    tick();
    this.musicTimer = window.setInterval(tick, stepMs);
  }

  private stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGain && this.ctx) {
      const gain = this.musicGain;
      const now = this.ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      window.setTimeout(() => {
        try {
          gain.disconnect();
        } catch {
          // ignore
        }
      }, 500);
    }
    this.musicGain = null;
  }

  private playMusicNote(freq: number, duration: number, volume: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + duration + 0.05);
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
