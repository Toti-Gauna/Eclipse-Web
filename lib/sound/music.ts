/**
 * Generative ambient music (lazy chunk, imported only by ./engine).
 *
 * An observatory at night: a slow pad in D major (Lydian/Ionian colours) whose
 * lowpass breathes with a very slow LFO, a soft drone on D, and sparse glass bells
 * from the D major pentatonic that wander and echo through a feedback delay. Chords
 * change every 8–12 s along a weighted graph with random voicings, so it never
 * loops. Everything is quiet and sits behind the page.
 *
 * Each start() builds a fresh "session" graph; stop() fades it out (1 s) and tears
 * it down, so a quick off → on simply crossfades two sessions.
 */

const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** Overall level of the music bus (before the master chain). */
const LEVEL = 0.46;
const FADE_IN = 3;
const FADE_OUT = 1;
/** How far ahead the timer schedules notes (s) and how often it runs (ms). */
const LOOKAHEAD = 1.6;
const TICK_MS = 400;

type ChordId = 'I' | 'vi' | 'IV' | 'ii' | 'V' | 'iii';

/** MIDI voicings (low → high). The pad drops / lifts notes at random on each pass. */
const CHORDS: Record<ChordId, readonly number[]> = {
  I: [50, 57, 61, 64, 66], // Dmaj9   D3 A3 C#4 E4 F#4
  vi: [47, 54, 57, 62, 64], // Bm11   B2 F#3 A3 D4 E4
  IV: [43, 50, 54, 57, 59, 64], // G6/9 G2 D3 F#3 A3 B3 E4
  ii: [52, 59, 62, 66, 67], // Em9    E3 B3 D4 F#4 G4
  V: [45, 52, 59, 61, 64], // A add9  A2 E3 B3 C#4 E4
  iii: [42, 49, 52, 57, 61], // F#m7  F#2 C#3 E3 A3 C#4
};

/** Weighted transitions (never to itself). */
const NEXT: Record<ChordId, readonly [ChordId, number][]> = {
  I: [['vi', 3], ['IV', 3], ['ii', 2], ['V', 1]],
  vi: [['IV', 3], ['ii', 2], ['I', 2], ['iii', 1]],
  IV: [['I', 3], ['V', 2], ['vi', 2], ['ii', 1]],
  ii: [['V', 3], ['IV', 2], ['vi', 1], ['I', 1]],
  V: [['I', 3], ['vi', 2], ['IV', 2]],
  iii: [['IV', 3], ['vi', 2], ['ii', 1]],
};

/** D major pentatonic, D5 → F#6, for the bells. */
const BELLS = [74, 76, 78, 81, 83, 86, 88, 90] as const;

function nextChord(from: ChordId): ChordId {
  const options = NEXT[from];
  let r = Math.random() * options.reduce((s, [, w]) => s + w, 0);
  for (const [id, w] of options) {
    r -= w;
    if (r <= 0) return id;
  }
  return options[0][0];
}

/** Soft, string-like waveform: harmonics falling as 1/n^1.7 (mellower than a saw). */
function padWave(ctx: BaseAudioContext): PeriodicWave {
  const n = 14;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) imag[i] = 1 / i ** 1.7;
  return ctx.createPeriodicWave(real, imag);
}

export interface Music {
  /** Starts (or restarts) the music with a 3 s fade-in. */
  start(): void;
  /** Fades out over 1 s, then frees every node. */
  stop(): void;
  /** Schedules notes up to `until` (context time). The timer calls it; offline renders call it by hand. */
  pump(until: number): void;
  readonly playing: boolean;
  dispose(): void;
}

interface Session {
  pump(until: number): void;
  fadeOut(): void;
  dispose(): void;
}

function createSession(ctx: BaseAudioContext, destination: AudioNode, reverb: AudioNode, wave: PeriodicWave): Session {
  const t0 = ctx.currentTime + 0.05;
  const nodes: AudioNode[] = [];
  const keep = <T extends AudioNode>(node: T): T => {
    nodes.push(node);
    return node;
  };
  const sources: AudioScheduledSourceNode[] = [];

  // Fades: the dry mix and the reverb sends fade together.
  const out = keep(ctx.createGain());
  const wet = keep(ctx.createGain());
  for (const g of [out, wet]) {
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(LEVEL, t0 + FADE_IN);
  }
  out.connect(destination);
  wet.connect(reverb);

  // Pad: voices → breathing lowpass → dry + wet.
  const padFilter = keep(ctx.createBiquadFilter());
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 980;
  padFilter.Q.value = 0.45;
  const padLfo = keep(ctx.createOscillator());
  padLfo.frequency.value = rand(0.035, 0.05);
  const padLfoDepth = keep(ctx.createGain());
  padLfoDepth.gain.value = 420;
  padLfo.connect(padLfoDepth).connect(padFilter.frequency);
  // Thin the bottom: phone speakers can't play it and on laptops it turns to mud.
  const padHighpass = keep(ctx.createBiquadFilter());
  padHighpass.type = 'highpass';
  padHighpass.frequency.value = 160;
  padHighpass.Q.value = 0.6;
  padFilter.connect(padHighpass);
  // A few fixed stereo positions shared by every note (cheaper than one panner per note).
  const padPans = [-0.5, -0.18, 0.18, 0.5].map((position) => {
    const pan = keep(ctx.createStereoPanner());
    pan.pan.value = position;
    pan.connect(padFilter);
    return pan;
  });
  const padDry = keep(ctx.createGain());
  padDry.gain.value = 0.5;
  const padSend = keep(ctx.createGain());
  padSend.gain.value = 0.75;
  padHighpass.connect(padDry).connect(out);
  padHighpass.connect(padSend).connect(wet);

  // Drone on D: a sine at D2 for weight, a triangle at D3 so phones hear it too.
  const drone = keep(ctx.createGain());
  drone.gain.value = 0.03;
  const droneLfo = keep(ctx.createOscillator());
  droneLfo.frequency.value = 0.031;
  const droneLfoDepth = keep(ctx.createGain());
  droneLfoDepth.gain.value = 0.012;
  droneLfo.connect(droneLfoDepth).connect(drone.gain);
  const droneLow = keep(ctx.createOscillator());
  droneLow.frequency.value = mtof(38);
  const droneMid = keep(ctx.createOscillator());
  droneMid.type = 'triangle';
  droneMid.frequency.value = mtof(50);
  droneMid.detune.value = 3;
  const droneMidLevel = keep(ctx.createGain());
  droneMidLevel.gain.value = 0.6;
  const droneLowLevel = keep(ctx.createGain());
  droneLowLevel.gain.value = 0.45;
  droneLow.connect(droneLowLevel).connect(drone);
  droneMid.connect(droneMidLevel).connect(drone);
  const droneFilter = keep(ctx.createBiquadFilter());
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 420;
  drone.connect(droneFilter).connect(out);
  const droneSend = keep(ctx.createGain());
  droneSend.gain.value = 0.15;
  droneFilter.connect(droneSend).connect(wet);

  // Bells: dry + a darkening feedback delay + reverb.
  const bells = keep(ctx.createGain());
  bells.gain.value = 1;
  const bellDry = keep(ctx.createGain());
  bellDry.gain.value = 0.7;
  bells.connect(bellDry).connect(out);
  const delay = keep(ctx.createDelay(2));
  delay.delayTime.value = rand(0.42, 0.5);
  const feedback = keep(ctx.createGain());
  feedback.gain.value = 0.36;
  const loopFilter = keep(ctx.createBiquadFilter());
  loopFilter.type = 'lowpass';
  loopFilter.frequency.value = 2300;
  bells.connect(delay);
  delay.connect(loopFilter).connect(feedback).connect(delay);
  const delayOut = keep(ctx.createGain());
  delayOut.gain.value = 0.3;
  loopFilter.connect(delayOut).connect(out);
  const bellSend = keep(ctx.createGain());
  bellSend.gain.value = 0.5;
  bells.connect(bellSend).connect(wet);
  const bellPans = [-0.6, -0.25, 0.25, 0.6].map((position) => {
    const pan = keep(ctx.createStereoPanner());
    pan.pan.value = position;
    pan.connect(bells);
    return pan;
  });

  for (const osc of [padLfo, droneLfo, droneLow, droneMid]) {
    osc.start(t0);
    sources.push(osc);
  }

  // ---- Scheduling --------------------------------------------------------
  let chord: ChordId = pick(['I', 'IV', 'vi'] as const);
  let chordAt = t0;
  let bellAt = t0 + rand(2.2, 3.6);
  let bellIndex = Math.floor(rand(2, 5));
  let stopAt = Infinity;

  const voicing = (notes: readonly number[]) => {
    const v = [...notes];
    // Drop one inner note now and then, and sometimes lift the top voice an octave.
    if (v.length > 4 && Math.random() < 0.55) v.splice(1 + Math.floor(Math.random() * (v.length - 2)), 1);
    if (Math.random() < 0.3) v[v.length - 1] += 12;
    return v;
  };

  const playChord = (t: number, length: number) => {
    const attack = rand(3, 4.2);
    const release = rand(4.5, 5.5);
    for (const midi of voicing(CHORDS[chord])) {
      const level = (midi < 48 ? 0.026 : 0.042) * rand(0.85, 1.1);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(level, t + attack);
      env.gain.setValueAtTime(level, t + length);
      env.gain.linearRampToValueAtTime(0, t + length + release);
      env.connect(pick(padPans));
      const spread = rand(4, 9);
      let last: OscillatorNode | null = null;
      for (const cents of [-spread, spread]) {
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(wave);
        osc.frequency.value = mtof(midi);
        osc.detune.value = cents;
        osc.connect(env);
        osc.start(t);
        osc.stop(t + length + release + 0.1);
        last = osc;
      }
      if (last) last.onended = () => env.disconnect();
    }
    // A soft low pluck on the root marks some of the changes.
    if (Math.random() < 0.5) pluck(CHORDS[chord][0] + 12, t + rand(0.2, 0.8));
  };

  const pluck = (midi: number, t: number) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = mtof(midi);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(260, t + 0.9);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.05, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    osc.connect(filter).connect(env).connect(bells);
    osc.start(t);
    osc.stop(t + 2.3);
    osc.onended = () => env.disconnect();
  };

  /** FM glass bell: a sine whose brightness (modulation index) decays fast. */
  const bell = (midi: number, t: number, velocity: number) => {
    const f = mtof(midi);
    const carrier = ctx.createOscillator();
    carrier.frequency.value = f;
    carrier.detune.value = rand(-4, 4);
    const mod = ctx.createOscillator();
    mod.frequency.value = f * (Math.random() < 0.7 ? 3.5 : 2);
    const index = ctx.createGain();
    index.gain.setValueAtTime(f * 1.3 * velocity, t);
    index.gain.exponentialRampToValueAtTime(f * 0.04, t + 1.1);
    mod.connect(index).connect(carrier.frequency);
    const env = ctx.createGain();
    const decay = rand(2.6, 3.6);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.065 * velocity, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    carrier.connect(env).connect(pick(bellPans));
    carrier.start(t);
    mod.start(t);
    carrier.stop(t + decay + 0.05);
    mod.stop(t + decay + 0.05);
    carrier.onended = () => {
      index.disconnect();
      env.disconnect();
    };
  };

  const scheduleBells = (t: number): number => {
    // A wandering line: small steps, the odd leap, phrases of 1–3 notes, real rests.
    const notes = Math.random() < 0.3 ? (Math.random() < 0.4 ? 3 : 2) : 1;
    let at = t;
    for (let i = 0; i < notes; i++) {
      const step = pick([-2, -1, -1, 1, 1, 2, 3, -3, 0]);
      bellIndex = Math.min(BELLS.length - 1, Math.max(0, bellIndex + step));
      bell(BELLS[bellIndex], at, rand(0.45, 0.9) * (i ? 0.8 : 1));
      at += rand(0.28, 0.48);
    }
    const rest = Math.random() < 0.18 ? rand(6, 9.5) : rand(1.6, 4.8);
    return at + rest;
  };

  return {
    pump(until) {
      const limit = Math.min(until, stopAt);
      while (chordAt < limit) {
        const length = rand(8, 12);
        playChord(chordAt, length);
        chordAt += length;
        chord = nextChord(chord);
      }
      while (bellAt < limit) bellAt = scheduleBells(bellAt);
    },
    fadeOut() {
      const now = ctx.currentTime;
      stopAt = now;
      for (const g of [out, wet]) {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + FADE_OUT);
      }
    },
    dispose() {
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          // already stopped
        }
      }
      for (const n of nodes) n.disconnect();
    },
  };
}

export function createMusic(
  ctx: BaseAudioContext,
  destination: AudioNode,
  reverb: AudioNode,
  { autoSchedule = true }: { autoSchedule?: boolean } = {},
): Music {
  const wave = padWave(ctx);
  let session: Session | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;

  const stopTimer = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };

  return {
    get playing() {
      return session !== null;
    },
    start() {
      if (session) return;
      session = createSession(ctx, destination, reverb, wave);
      session.pump(ctx.currentTime + LOOKAHEAD);
      if (autoSchedule && timer === undefined) {
        timer = setInterval(() => session?.pump(ctx.currentTime + LOOKAHEAD), TICK_MS);
      }
    },
    stop() {
      const ending = session;
      if (!ending) return;
      session = null;
      stopTimer();
      ending.fadeOut();
      // Freed after the fade (+ the tail of the last notes through the delay).
      setTimeout(() => ending.dispose(), (FADE_OUT + 0.3) * 1000);
    },
    pump(until) {
      session?.pump(until);
    },
    dispose() {
      stopTimer();
      session?.dispose();
      session = null;
    },
  };
}
