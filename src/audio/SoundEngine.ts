import { asset } from '../utils/assets';

/**
 * Single audio graph for the whole site.
 *
 *   music source ─┐
 *                 ├─> musicGain ─> master ─> analyser ─> destination
 *   generative ───┘                    ^
 *   ui (pings) ────────────────────────┘
 *
 * Music source is either a licensed file (VITE_SOUNDTRACK, default
 * /assets/audio/soundtrack.mp3) or, when that file is absent, an original
 * generative ambient score synthesised in real time. Only one instance ever
 * exists, so navigation can never start a second soundtrack.
 */

const SOUNDTRACK_PATH = (import.meta.env.VITE_SOUNDTRACK as string | undefined) ?? 'assets/audio/soundtrack.mp3';
const MUSIC_LEVEL = 0.55;

type Listener = () => void;

// D minor / Bb / Gm / A-sus voicings (Hz) — slow, cinematic, unresolved.
const CHORDS: number[][] = [
  [73.42, 146.83, 220.0, 261.63, 349.23, 440.0],
  [58.27, 116.54, 174.61, 233.08, 293.66, 440.0],
  [49.0, 98.0, 146.83, 233.08, 293.66, 349.23],
  [55.0, 110.0, 164.81, 220.0, 293.66, 329.63],
];
const BELLS = [587.33, 659.25, 880.0, 987.77, 1174.66, 1318.51];

class GenerativeScore {
  private ctx: AudioContext;
  private out: GainNode;
  private filter: BiquadFilterNode;
  private voices: { oscs: OscillatorNode[]; gain: GainNode }[] = [];
  private timers: number[] = [];
  private nodes: AudioNode[] = [];
  private chordIndex = 0;
  private running = false;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 1;

    // Gentle low-pass that slowly breathes.
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 900;
    this.filter.Q.value = 0.4;
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.035;
    lfoDepth.gain.value = 420;
    lfo.connect(lfoDepth).connect(this.filter.frequency);
    lfo.start();

    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(5.5, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.75;
    const dry = ctx.createGain();
    dry.gain.value = 0.45;

    this.filter.connect(dry).connect(this.out);
    this.filter.connect(reverb).connect(wet).connect(this.out);
    this.out.connect(destination);

    // Low air: filtered noise, like a quiet room tone.
    const air = ctx.createBufferSource();
    air.buffer = this.noise(4);
    air.loop = true;
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.value = 520;
    airFilter.Q.value = 0.6;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.018;
    air.connect(airFilter).connect(airGain).connect(this.out);
    air.start();

    this.nodes.push(lfo, lfoDepth, reverb, wet, dry, air, airFilter, airGain);
  }

  private impulse(seconds: number, decay: number) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = this.ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return buffer;
  }

  private noise(seconds: number) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      // Brown-ish noise for a softer, warmer texture.
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  private playChord() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const chord = CHORDS[this.chordIndex % CHORDS.length];
    this.chordIndex++;

    // Fade out the previous voices.
    this.voices.forEach(({ oscs, gain }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 6);
      oscs.forEach((o) => o.stop(now + 6.2));
    });
    this.voices = [];

    chord.forEach((freq, i) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const level = i === 0 ? 0.11 : 0.045 / (1 + i * 0.12);
      gain.gain.linearRampToValueAtTime(level, now + 5);
      const oscs = [-6, 5].map((detune, j) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : j === 0 ? 'triangle' : 'sawtooth';
        o.frequency.value = freq;
        o.detune.value = detune + (Math.random() - 0.5) * 4;
        const g = ctx.createGain();
        g.gain.value = o.type === 'sawtooth' ? 0.22 : 1;
        o.connect(g).connect(gain);
        o.start(now);
        return o;
      });
      gain.connect(this.filter);
      this.voices.push({ oscs, gain });
    });
  }

  private playBell() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = BELLS[Math.floor(Math.random() * BELLS.length)];
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.03, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
    o.connect(g).connect(this.filter);
    o.start(now);
    o.stop(now + 4.6);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.playChord();
    this.timers.push(window.setInterval(() => this.playChord(), 9000));
    const bell = () => {
      if (!this.running) return;
      this.playBell();
      this.timers.push(window.setTimeout(bell, 2600 + Math.random() * 5200));
    };
    this.timers.push(window.setTimeout(bell, 3000));
  }

  stop() {
    this.running = false;
    this.timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
    this.timers = [];
    const now = this.ctx.currentTime;
    this.voices.forEach(({ oscs, gain }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      oscs.forEach((o) => o.stop(now + 0.35));
    });
    this.voices = [];
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicGain!: GainNode;
  private analyserNode!: AnalyserNode;
  private fileAudio: HTMLAudioElement | null = null;
  private score: GenerativeScore | null = null;
  private sourceChecked: Promise<boolean> | null = null;
  private listeners = new Set<Listener>();
  private stopTimer = 0;

  /** True while music is (or is fading) on. */
  playing = false;
  mode: 'file' | 'generative' | 'none' = 'none';
  error: string | null = null;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  get analyser() {
    return this.ctx ? this.analyserNode : null;
  }

  private ensureContext() {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio is not supported in this browser');
    const ctx = new Ctor();
    this.master = ctx.createGain();
    this.master.gain.value = 1;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.82;
    this.musicGain.connect(this.master);
    this.master.connect(this.analyserNode).connect(ctx.destination);
    this.ctx = ctx;
    return ctx;
  }

  /** Looks for a licensed soundtrack file; falls back to the generative score. */
  private hasSoundtrackFile() {
    this.sourceChecked ??= fetch(asset(SOUNDTRACK_PATH), { method: 'HEAD' })
      .then((res) => res.ok && (res.headers.get('content-type') ?? '').startsWith('audio'))
      .catch(() => false);
    return this.sourceChecked;
  }

  private async ensureSource() {
    if (this.mode !== 'none') return;
    const ctx = this.ensureContext();
    if (await this.hasSoundtrackFile()) {
      const audio = new Audio(asset(SOUNDTRACK_PATH));
      audio.loop = true;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      ctx.createMediaElementSource(audio).connect(this.musicGain);
      this.fileAudio = audio;
      this.mode = 'file';
    } else {
      this.score = new GenerativeScore(ctx, this.musicGain);
      this.mode = 'generative';
    }
  }

  /**
   * Must be called from a user gesture the first time (autoplay policy).
   * Resolves false if the browser refused playback.
   */
  async play(fadeSeconds = 2.4): Promise<boolean> {
    try {
      const ctx = this.ensureContext();
      // Resume synchronously within the gesture, before any await.
      const resumed = ctx.resume();
      window.clearTimeout(this.stopTimer);
      this.playing = true;
      this.emit();
      await resumed;
      await this.ensureSource();
      if (!this.playing) return false;
      if (this.fileAudio) await this.fileAudio.play();
      this.score?.start();
      const now = ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(MUSIC_LEVEL, now + fadeSeconds);
      this.error = null;
      return true;
    } catch (err) {
      this.playing = false;
      this.error = err instanceof Error ? err.message : 'Audio playback failed';
      console.warn('[sound]', this.error);
      this.emit();
      return false;
    }
  }

  pause(fadeSeconds = 1.2) {
    this.playing = false;
    this.emit();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
    window.clearTimeout(this.stopTimer);
    this.stopTimer = window.setTimeout(() => {
      if (this.playing) return;
      this.fileAudio?.pause();
      this.score?.stop();
      this.ctx?.suspend().catch(() => {});
    }, fadeSeconds * 1000 + 80);
  }

  /** Swell used by the brand reveal — briefly lifts the music level. */
  swell() {
    if (!this.ctx || !this.playing) return;
    const now = this.ctx.currentTime;
    const g = this.musicGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(MUSIC_LEVEL * 1.45, now + 1.6);
    g.linearRampToValueAtTime(MUSIC_LEVEL, now + 5);
  }

  /** Short notification chime for the incoming messages. */
  ping() {
    if (!this.ctx || !this.playing || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [1318.5, 1975.5].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, now + i * 0.085);
      g.gain.linearRampToValueAtTime(0.11, now + i * 0.085 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.085 + 0.55);
      o.connect(g).connect(this.master);
      o.start(now + i * 0.085);
      o.stop(now + i * 0.085 + 0.6);
      o.onended = () => { o.disconnect(); g.disconnect(); };
    });
  }

  /** Pause audio while the tab is hidden; resume when it returns. */
  setHidden(hidden: boolean) {
    if (!this.ctx) return;
    if (hidden) this.ctx.suspend().catch(() => {});
    else if (this.playing) this.ctx.resume().catch(() => {});
  }
}

export const sound = new SoundEngine();
