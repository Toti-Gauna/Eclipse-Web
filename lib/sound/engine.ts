/**
 * Web Audio engine — loaded with a dynamic import() the first time the visitor
 * turns sound on, never part of the initial bundle (see SoundProvider).
 *
 * No audio files: every sound is synthesized. The palette is "precision instrument
 * + glass": filtered-noise detents, sine bells with fast envelopes, a soft swell, a
 * shimmer for the diamond-ring glint. Notes sit in D major so effects blend with the
 * generative music (./music).
 *
 *   effects ─┐
 *   music ───┼─→ master gain → compressor → destination
 *   reverb ──┘   (one convolver with a generated impulse response, fed by sends)
 *
 * The AudioContext is created by the caller inside a user gesture and passed in, so
 * the gesture is not lost while this chunk downloads. Works with an
 * OfflineAudioContext too (`autoSchedule: false` + `pump()`), which is how levels
 * are checked.
 */
import type { PlayOptions, SoundName } from './types';
import { createMusic } from './music';

export interface SoundEngine {
  readonly context: BaseAudioContext;
  /** Plays a UI sound now. Repeats of the same sound closer than 40 ms are dropped. */
  play(name: SoundName, options?: PlayOptions): void;
  setMusic(on: boolean): void;
  readonly musicOn: boolean;
  /** Schedules music up to `until` (context seconds) — for offline renders. */
  pump(until: number): void;
  dispose(): void;
}

const THROTTLE_S = 0.04;
const FX_LEVEL = 0.9;

// D major, the key of the music.
const N = {
  A3: 220,
  B3: 246.94,
  A4: 440,
  D5: 587.33,
  E5: 659.26,
  A5: 880,
  D6: 1174.66,
  Fs6: 1479.98,
  A6: 1760,
  D7: 2349.32,
  E7: 2637.02,
  A7: 3520,
  D8: 4698.64,
} as const;

/** Stereo impulse response: 18 ms pre-delay, exponential decay, brighter onset → darker tail. */
function impulseResponse(ctx: BaseAudioContext, seconds = 2.8, curve = 2.3): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const pre = Math.floor(rate * 0.018);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = pre; i < length; i++) {
      const t = (i - pre) / (length - pre);
      // One-pole lowpass whose cutoff falls over time: air first, warmth last.
      lp += (0.62 - 0.54 * t) * (Math.random() * 2 - 1 - lp);
      data[i] = lp * (1 - t) ** curve;
    }
  }
  return buffer;
}

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function createSoundEngine(
  ctx: BaseAudioContext,
  { autoSchedule = true }: { autoSchedule?: boolean } = {},
): SoundEngine {
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 10;
  compressor.ratio.value = 3.5;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  master.connect(compressor).connect(ctx.destination);

  const fx = ctx.createGain();
  fx.gain.value = FX_LEVEL;
  fx.connect(master);

  const reverb = ctx.createConvolver();
  reverb.buffer = impulseResponse(ctx);
  const reverbOut = ctx.createGain();
  reverbOut.gain.value = 0.55;
  reverb.connect(reverbOut).connect(master);

  const musicBus = ctx.createGain();
  musicBus.connect(master);
  const music = createMusic(ctx, musicBus, reverb, { autoSchedule });

  const noise = noiseBuffer(ctx);
  const last = new Map<SoundName, number>();

  // ---- Building blocks ----------------------------------------------------

  /** A voice: its own output level and reverb send, freed when its last source ends. */
  function voice(level: number, send: number) {
    const out = ctx.createGain();
    out.gain.value = level;
    out.connect(fx);
    let wet: GainNode | null = null;
    if (send > 0) {
      wet = ctx.createGain();
      wet.gain.value = send;
      out.connect(wet).connect(reverb);
    }
    let pending = 0;
    const done = () => {
      pending -= 1;
      if (pending > 0) return;
      out.disconnect();
      wet?.disconnect();
    };
    const track = (source: AudioScheduledSourceNode) => {
      pending += 1;
      source.addEventListener('ended', done, { once: true });
    };
    return { out, track };
  }

  type Voice = ReturnType<typeof voice>;

  /** Percussive tone: exponential attack/decay. */
  function tone(
    v: Voice,
    {
      type = 'sine',
      freq,
      at,
      attack = 0.004,
      decay,
      peak,
      detune = 0,
      glideTo,
      glideTime = 0.05,
    }: {
      type?: OscillatorType;
      freq: number;
      at: number;
      attack?: number;
      decay: number;
      peak: number;
      detune?: number;
      glideTo?: number;
      glideTime?: number;
    },
    through?: AudioNode,
  ) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + glideTime);
    osc.detune.value = detune;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    osc.connect(env).connect(through ?? v.out);
    osc.start(at);
    osc.stop(at + attack + decay + 0.03);
    v.track(osc);
    osc.addEventListener('ended', () => env.disconnect(), { once: true });
    return osc;
  }

  /** Filtered noise burst (clicks, air, whooshes). */
  function burst(
    v: Voice,
    {
      at,
      attack = 0.0015,
      decay,
      peak,
      filter = 'bandpass',
      freq,
      q = 1,
    }: { at: number; attack?: number; decay: number; peak: number; filter?: BiquadFilterType; freq: number; q?: number },
  ) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    src.connect(f).connect(env).connect(v.out);
    const length = attack + decay + 0.03;
    src.start(at, Math.random() * Math.max(0, noise.duration - length - 0.01));
    src.stop(at + length);
    v.track(src);
    src.addEventListener(
      'ended',
      () => {
        f.disconnect();
        env.disconnect();
      },
      { once: true },
    );
    return { src, f, env };
  }

  /** Two detuned triangles through a sweeping lowpass, with a slow attack (open / close). */
  function swell(v: Voice, at: number, freqs: number[], from: number, to: number, sweep: number, attack: number, decay: number, peak: number) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(from, at);
    lp.frequency.exponentialRampToValueAtTime(to, at + sweep);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(peak, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    lp.connect(env).connect(v.out);
    const oscs = freqs.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = i % 2 ? 5 : -5;
      osc.connect(lp);
      osc.start(at);
      osc.stop(at + attack + decay + 0.03);
      v.track(osc);
      return osc;
    });
    oscs[oscs.length - 1]?.addEventListener(
      'ended',
      () => {
        lp.disconnect();
        env.disconnect();
      },
      { once: true },
    );
  }

  // ---- The ten sounds (see lib/sound/types.ts for when to use each) -------

  /**
   * The mix: [level, reverb send] per sound, tuned with offline renders so the peaks
   * land around −22 to −27 dBFS (soft ones lower) over music at about −31 dBFS RMS.
   */
  const MIX: Record<SoundName, readonly [number, number]> = {
    tick: [2.2, 0.05],
    select: [1.6, 0.2],
    toggle: [1.8, 0.1],
    open: [0.4, 0.35],
    close: [1, 0.22],
    success: [0.5, 0.35],
    whoosh: [1, 0.3],
    glint: [0.9, 0.6],
    type: [1.6, 0.05],
    error: [0.55, 0.1],
  };

  const sounds: Record<SoundName, (v: Voice, at: number, r: number) => void> = {
    // A precision dial detent: a tight noise click plus a faint metallic ping.
    tick(v, at, r) {
      burst(v, { at, decay: 0.012, peak: 0.24, freq: 4200 * r, q: 4 });
      tone(v, { freq: N.D7 * r, at, attack: 0.002, decay: 0.035, peak: 0.03 });
    },
    // Glass tap: a short bell with an inharmonic partial and a soft transient.
    select(v, at, r) {
      burst(v, { at, decay: 0.006, peak: 0.07, freq: 6500 * r, q: 3 });
      tone(v, { freq: N.Fs6 * r, at, decay: 0.3, peak: 0.1 });
      tone(v, { freq: N.Fs6 * 2.76 * r, at, decay: 0.09, peak: 0.025 });
    },
    // A switch: two clicks and a small blip on the second.
    toggle(v, at, r) {
      burst(v, { at, decay: 0.007, peak: 0.16, freq: 3000 * r, q: 3 });
      burst(v, { at: at + 0.038, decay: 0.006, peak: 0.13, freq: 4600 * r, q: 3 });
      tone(v, { freq: N.A5 * r, at: at + 0.038, decay: 0.07, peak: 0.045 });
    },
    // A lens opening: a filtered swell rising, with a little air.
    open(v, at, r) {
      swell(v, at, [N.A4 * r, N.E5 * r], 380, 2600, 0.26, 0.16, 0.46, 0.075);
      burst(v, { at, attack: 0.18, decay: 0.27, peak: 0.018, filter: 'highpass', freq: 2500, q: 0.7 });
    },
    // The lens closing: the same colour, falling and shorter.
    close(v, at, r) {
      swell(v, at, [N.D5 * r, N.A4 * r], 2400, 420, 0.24, 0.02, 0.34, 0.065);
    },
    // Something lands: a rising D major arpeggio of glass bells and a sparkle.
    success(v, at, r) {
      [N.D6, N.Fs6, N.A6].forEach((f, i) => {
        tone(v, { freq: f * r, at: at + i * 0.07, decay: 0.9, peak: 0.085 - i * 0.008 });
        tone(v, { freq: f * 2.01 * r, at: at + i * 0.07, decay: 0.4, peak: 0.014 });
      });
      tone(v, { freq: N.D7 * r, at: at + 0.21, decay: 0.6, peak: 0.025 });
    },
    // The moon passing: band-passed noise sweeping up and across the stereo field.
    whoosh(v, at, r) {
      const { f, env } = burst(v, { at, attack: 0.28, decay: 0.42, peak: 0.11, freq: 300 * r, q: 0.9 });
      f.frequency.setValueAtTime(300 * r, at);
      f.frequency.exponentialRampToValueAtTime(1800 * r, at + 0.32);
      f.frequency.exponentialRampToValueAtTime(500 * r, at + 0.66);
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(-0.5, at);
      pan.pan.linearRampToValueAtTime(0.5, at + 0.66);
      env.disconnect();
      env.connect(pan).connect(v.out);
      tone(v, { freq: 110 * r, at, attack: 0.2, decay: 0.4, peak: 0.035, glideTo: 70 * r, glideTime: 0.6 });
    },
    // The diamond ring: a shimmering cluster of high partials over a soft ping, lots of reverb.
    glint(v, at, r) {
      tone(v, { freq: N.D6 * r, at, decay: 1.3, peak: 0.06 });
      const cluster: [number, number, number, number][] = [
        [N.A6, 0, 1.1, 0.05],
        [N.E7, 0.03, 0.9, 0.035],
        [N.A7, 0.06, 0.75, 0.024],
        [N.D8, 0.09, 0.6, 0.014],
      ];
      for (const [f, delay, decay, peak] of cluster) {
        tone(v, { freq: f * r, at: at + delay, decay, peak, detune: Math.random() * 8 - 4 });
      }
      burst(v, { at, decay: 0.03, peak: 0.03, filter: 'highpass', freq: 7000, q: 0.7 });
    },
    // A chat bubble: a tiny sine drop, very soft.
    type(v, at, r) {
      tone(v, { freq: 820 * r, at, attack: 0.003, decay: 0.075, peak: 0.045, glideTo: 560 * r, glideTime: 0.045 });
    },
    // Can't do that: two muted low thuds, falling.
    error(v, at, r) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1000;
      lp.connect(v.out);
      tone(v, { type: 'triangle', freq: N.B3 * r, at, attack: 0.005, decay: 0.13, peak: 0.11 }, lp);
      const lastOsc = tone(v, { type: 'triangle', freq: N.A3 * r, at: at + 0.11, attack: 0.005, decay: 0.16, peak: 0.1 }, lp);
      lastOsc.addEventListener('ended', () => lp.disconnect(), { once: true });
      burst(v, { at, decay: 0.01, peak: 0.04, filter: 'lowpass', freq: 1200, q: 0.7 });
    },
  };

  return {
    context: ctx,
    get musicOn() {
      return music.playing;
    },
    play(name, options = {}) {
      const at = ctx.currentTime + 0.005;
      const previous = last.get(name);
      if (previous !== undefined && at - previous < THROTTLE_S) return;
      last.set(name, at);
      const r = 2 ** ((options.pitch ?? 0) / 12);
      const vol = Math.min(1, Math.max(0, options.volume ?? 1));
      const recipe = sounds[name];
      if (vol === 0 || !recipe) return;
      const [level, send] = MIX[name];
      recipe(voice(level * vol, send), at, r);
    },
    setMusic(on) {
      if (on) music.start();
      else music.stop();
    },
    pump(until) {
      music.pump(until);
    },
    dispose() {
      music.dispose();
      master.disconnect();
      compressor.disconnect();
      fx.disconnect();
      reverb.disconnect();
      reverbOut.disconnect();
      musicBus.disconnect();
    },
  };
}
