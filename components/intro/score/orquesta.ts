/**
 * Eclipse's orchestra: synthesized instruments with some body (an electric piano, strings, a sung lead, a sub bass,
 * a plucked arpeggio, a glockenspiel and a drum kit), rendered offline from a list of notes. Nothing is recorded or
 * downloaded: Web Audio only, so it costs nothing and every note lands on the film's beat. Seeded: the same score
 * gives the same mix.
 *
 * Copied from the trailers' orchestra of the `roofy` repo (components/video/score/orquesta.ts, 27/10/2026), unchanged
 * below this comment, for the intro film (components/intro). A change to the sound of one should go to both.
 */

export type Inst = 'keys' | 'strings' | 'lead' | 'bass' | 'pluck' | 'glock' | 'kick' | 'snare' | 'clap' | 'hat' | 'openhat' | 'shaker' | 'crash' | 'riser' | 'impact' | 'reverse';

/** One note or hit: `t` and `dur` in seconds, `vel` 0–1, `midi` for the pitched instruments. */
export interface Note {
  t: number;
  inst: Inst;
  midi?: number;
  dur: number;
  vel: number;
  /** Ducks the strings and the bass for a moment (the pump of a dance chorus). */
  pump?: boolean;
}

type Group = 'keys' | 'strings' | 'lead' | 'bass' | 'pluck' | 'glock' | 'drums' | 'fx';
const GROUP: Record<Inst, Group> = {
  keys: 'keys', strings: 'strings', lead: 'lead', bass: 'bass', pluck: 'pluck', glock: 'glock',
  kick: 'drums', snare: 'drums', clap: 'drums', hat: 'drums', openhat: 'drums', shaker: 'drums',
  crash: 'fx', riser: 'fx', impact: 'fx', reverse: 'fx',
};
/** The mix: each group's level and how much of it goes to the hall. */
const MIX: Record<Group, { gain: number; verb: number; pan?: number }> = {
  keys: { gain: 0.62, verb: 0.3 },
  strings: { gain: 0.36, verb: 0.55 },
  lead: { gain: 0.5, verb: 0.35 },
  bass: { gain: 0.42, verb: 0.04 },
  pluck: { gain: 0.18, verb: 0.3, pan: 0.25 },
  glock: { gain: 0.14, verb: 0.5, pan: -0.2 },
  drums: { gain: 0.6, verb: 0.08 },
  fx: { gain: 0.4, verb: 0.4 },
};

export const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Renders `notes` to a stereo buffer of `dur` seconds. */
export async function renderScore(notes: readonly Note[], dur: number, { sampleRate = 48_000, seed = 7 } = {}): Promise<AudioBuffer> {
  const rnd = rng(seed);
  const ac = new OfflineAudioContext(2, Math.ceil(dur * sampleRate), sampleRate);

  // Master: a gentle glue compressor, then a safety limiter.
  const glue = ac.createDynamicsCompressor();
  glue.threshold.value = -18;
  glue.ratio.value = 2.5;
  glue.attack.value = 0.01;
  glue.release.value = 0.2;
  const limit = ac.createDynamicsCompressor();
  limit.threshold.value = -3;
  limit.ratio.value = 20;
  limit.attack.value = 0.002;
  limit.release.value = 0.1;
  const master = ac.createGain();
  master.gain.value = 0.9;
  // A touch of air and a cleaner low end: the mix is heard on phone speakers as much as on headphones.
  const air = ac.createBiquadFilter();
  air.type = 'highshelf';
  air.frequency.value = 5000;
  air.gain.value = 3;
  const floor = ac.createBiquadFilter();
  floor.type = 'lowshelf';
  floor.frequency.value = 80;
  floor.gain.value = -2;
  master.connect(floor).connect(air).connect(glue).connect(limit).connect(ac.destination);

  // The hall: a stereo impulse of seeded noise, 2.6 s, darker as it decays.
  const len = Math.floor(sampleRate * 2.6);
  const ir = ac.createBuffer(2, len, sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      lp += (rnd() * 2 - 1 - lp) * (0.9 - 0.75 * x); // a one-pole low-pass that closes with time
      d[i] = lp * Math.pow(1 - x, 2.6);
    }
  }
  const hall = ac.createConvolver();
  hall.buffer = ir;
  const hallOut = ac.createGain();
  hallOut.gain.value = 0.5;
  hall.connect(hallOut).connect(master);

  // The lead's echo: a dotted eighth, filtered, into the hall.
  const echo = ac.createDelay(1);
  echo.delayTime.value = 0.375;
  const echoFb = ac.createGain();
  echoFb.gain.value = 0.28;
  const echoTone = ac.createBiquadFilter();
  echoTone.type = 'lowpass';
  echoTone.frequency.value = 2400;
  echo.connect(echoTone).connect(echoFb).connect(echo);
  const echoOut = ac.createGain();
  echoOut.gain.value = 0.22;
  echoTone.connect(echoOut).connect(master);
  echoOut.connect(hall);

  const buses = {} as Record<Group, GainNode>;
  for (const g of Object.keys(MIX) as Group[]) {
    const bus = ac.createGain();
    bus.gain.value = MIX[g].gain;
    let node: AudioNode = bus;
    if (MIX[g].pan) {
      const p = ac.createStereoPanner();
      p.pan.value = MIX[g].pan!;
      bus.connect(p);
      node = p;
    }
    node.connect(master);
    const send = ac.createGain();
    send.gain.value = MIX[g].verb;
    node.connect(send).connect(hall);
    if (g === 'lead') {
      const s = ac.createGain();
      s.gain.value = 0.5;
      node.connect(s).connect(echo);
    }
    buses[g] = bus;
  }

  const noise = ac.createBuffer(1, sampleRate * 2, sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;

  /* ---------------------------------------------------------------- */
  /* building blocks                                                   */
  /* ---------------------------------------------------------------- */
  const gainAt = (dest: AudioNode, pan = 0) => {
    const g = ac.createGain();
    g.gain.value = 0;
    if (pan) {
      const p = ac.createStereoPanner();
      p.pan.value = pan;
      g.connect(p).connect(dest);
    } else g.connect(dest);
    return g;
  };
  const oscAt = (type: OscillatorType, f: number, t: number, end: number, dest: AudioNode, detune = 0) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.detune.value = detune;
    o.connect(dest);
    o.start(t);
    o.stop(end);
    return o;
  };
  const noiseAt = (t: number, end: number, dest: AudioNode) => {
    const n = ac.createBufferSource();
    n.buffer = noise;
    n.loop = true;
    n.connect(dest);
    n.start(t, rnd() * 1.5);
    n.stop(end);
    return n;
  };
  const filt = (type: BiquadFilterType, f: number, q = 0.7) => {
    const b = ac.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  };
  /** attack → hold at `sus` × peak until `off` → release. */
  const adsr = (p: AudioParam, t: number, peak: number, a: number, d: number, sus: number, off: number, r: number) => {
    p.setValueAtTime(0.0001, t);
    p.exponentialRampToValueAtTime(peak, t + a);
    p.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), Math.max(t + a + 0.001, Math.min(off, t + a + d)));
    p.setValueAtTime(Math.max(0.0001, peak * sus), Math.max(off, t + a + 0.002));
    p.exponentialRampToValueAtTime(0.0001, Math.max(off, t + a + 0.002) + r);
  };

  /* ---------------------------------------------------------------- */
  /* instruments                                                       */
  /* ---------------------------------------------------------------- */
  const play: Record<Inst, (n: Note, bus: GainNode) => void> = {
    // Electric piano: FM (1:1) whose brightness falls as the note rings, a short tine on top, a slow tremolo.
    keys: ({ t, midi = 60, dur, vel }, bus) => {
      const f = hz(midi);
      const ring = Math.min(3.2, Math.max(0.6, dur + 0.5));
      const g = gainAt(bus, (rnd() - 0.5) * 0.4);
      adsr(g.gain, t, 0.22 * vel, 0.003, ring, 0.0001 / (0.22 * vel), t + dur, 0.35);
      const car = oscAt('sine', f, t, t + dur + 0.5, g);
      const idx = ac.createGain();
      idx.gain.setValueAtTime(f * (1.4 + 2.2 * vel), t);
      idx.gain.exponentialRampToValueAtTime(f * 0.15, t + Math.min(1.2, ring));
      idx.connect(car.frequency);
      oscAt('sine', f, t, t + dur + 0.5, idx);
      const tine = gainAt(g);
      tine.gain.setValueAtTime(0.0001, t);
      tine.gain.exponentialRampToValueAtTime(0.25 * vel, t + 0.002);
      tine.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      oscAt('sine', f * 7.02, t, t + 0.15, tine);
      const body = gainAt(g);
      body.gain.value = 0.35;
      oscAt('triangle', f / 2, t, t + dur + 0.5, body);
    },
    // Strings: three detuned saws per note through a soft low-pass, slow bow, delayed vibrato.
    strings: ({ t, midi = 60, dur, vel }, bus) => {
      const f = hz(midi);
      const att = Math.min(0.6, Math.max(0.12, dur * 0.25));
      const g = gainAt(bus, (rnd() - 0.5) * 0.7);
      adsr(g.gain, t, 0.07 * vel, att, 0.3, 0.85, t + dur, 0.7);
      const lp = filt('lowpass', 1500 + 1500 * vel, 0.5);
      lp.connect(g);
      const vib = ac.createOscillator();
      vib.frequency.value = 5 + rnd() * 0.6;
      const vd = ac.createGain();
      vd.gain.setValueAtTime(0, t);
      vd.gain.linearRampToValueAtTime(f * 0.004, t + 0.6);
      vib.connect(vd);
      vib.start(t);
      vib.stop(t + dur + 0.8);
      for (const cents of [-11, 0, 9]) {
        const o = oscAt('sawtooth', f, t, t + dur + 0.8, lp, cents + (rnd() - 0.5) * 3);
        vd.connect(o.frequency);
      }
    },
    // The sung lead: triangle + a little saw, a breath of attack, vibrato that blooms, into the echo.
    lead: ({ t, midi = 72, dur, vel }, bus) => {
      const f = hz(midi);
      const g = gainAt(bus);
      adsr(g.gain, t, 0.16 * vel, 0.025, 0.25, 0.75, t + dur, 0.28);
      const lp = filt('lowpass', 2600 + 1600 * vel, 0.9);
      lp.connect(g);
      const vib = ac.createOscillator();
      vib.frequency.value = 5.4;
      const vd = ac.createGain();
      vd.gain.setValueAtTime(0, t);
      vd.gain.setValueAtTime(0, t + Math.min(0.22, dur * 0.4));
      vd.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.6, dur * 0.8) + 0.01);
      vib.connect(vd);
      vib.start(t);
      vib.stop(t + dur + 0.4);
      const a = oscAt('triangle', f, t, t + dur + 0.4, lp);
      const sawG = gainAt(lp);
      sawG.gain.value = 0.22;
      const b = oscAt('sawtooth', f, t, t + dur + 0.4, sawG, 6);
      vd.connect(a.frequency);
      vd.connect(b.frequency);
    },
    // Sub bass: a sine and a filtered saw an octave up, held for the note.
    bass: ({ t, midi = 38, dur, vel }, bus) => {
      const f = hz(midi);
      const g = gainAt(bus);
      adsr(g.gain, t, 0.5 * vel, 0.006, 0.18, 0.7, t + dur, 0.08);
      oscAt('sine', f, t, t + dur + 0.12, g);
      const lp = filt('lowpass', 900, 2);
      lp.frequency.setValueAtTime(1400 * vel + 300, t);
      lp.frequency.exponentialRampToValueAtTime(380, t + 0.25);
      const sg = gainAt(g);
      sg.gain.value = 0.45;
      lp.connect(sg);
      oscAt('sawtooth', f, t, t + dur + 0.12, lp);
    },
    // Plucked arpeggio: a saw whose filter snaps shut.
    pluck: ({ t, midi = 72, dur, vel }, bus) => {
      const g = gainAt(bus, (rnd() - 0.5) * 0.6);
      adsr(g.gain, t, 0.2 * vel, 0.002, 0.22, 0.0001 / (0.2 * vel), t + dur, 0.05);
      const lp = filt('lowpass', 5000, 3);
      lp.frequency.setValueAtTime(5200, t);
      lp.frequency.exponentialRampToValueAtTime(500, t + 0.2);
      lp.connect(g);
      oscAt('sawtooth', hz(midi), t, t + 0.4, lp);
    },
    // Glockenspiel: a bright FM bell, for sparkle on the hook.
    glock: ({ t, midi = 84, dur, vel }, bus) => {
      const f = hz(midi);
      const g = gainAt(bus, (rnd() - 0.5) * 0.5);
      adsr(g.gain, t, 0.18 * vel, 0.002, Math.max(0.6, dur), 0.0001 / (0.18 * vel), t + Math.max(0.6, dur), 0.1);
      const car = oscAt('sine', f, t, t + dur + 1, g);
      const m = ac.createGain();
      m.gain.setValueAtTime(f * 1.8, t);
      m.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.8);
      m.connect(car.frequency);
      oscAt('sine', f * 3.5, t, t + dur + 1, m);
    },
    kick: ({ t, vel }, bus) => {
      const g = gainAt(bus);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.95 * vel, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      const o = oscAt('sine', 150, t, t + 0.45, g);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
      const click = gainAt(bus);
      click.gain.setValueAtTime(0.0001, t);
      click.gain.exponentialRampToValueAtTime(0.25 * vel, t + 0.001);
      click.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
      const hp = filt('highpass', 2500);
      hp.connect(click);
      noiseAt(t, t + 0.02, hp);
    },
    snare: ({ t, vel }, bus) => {
      const g = gainAt(bus, 0.05);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      const bp = filt('bandpass', 1900, 0.7);
      bp.connect(g);
      noiseAt(t, t + 0.22, bp);
      const body = gainAt(bus);
      body.gain.setValueAtTime(0.0001, t);
      body.gain.exponentialRampToValueAtTime(0.35 * vel, t + 0.002);
      body.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      const o = oscAt('triangle', 210, t, t + 0.12, body);
      o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    },
    clap: ({ t, vel }, bus) => {
      const g = gainAt(bus, -0.05);
      const bp = filt('bandpass', 1300, 1.1);
      bp.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      for (const [k, d] of [[0, 0.01], [0.011, 0.01], [0.022, 0.16]] as const) {
        g.gain.setValueAtTime(0.42 * vel, t + k);
        g.gain.exponentialRampToValueAtTime(0.0001, t + k + d);
      }
      noiseAt(t, t + 0.2, bp);
    },
    hat: ({ t, vel }, bus) => {
      const g = gainAt(bus, 0.3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16 * vel, t + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      const hp = filt('highpass', 7500);
      hp.connect(g);
      noiseAt(t, t + 0.06, hp);
    },
    openhat: ({ t, vel }, bus) => {
      const g = gainAt(bus, 0.3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12 * vel, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      const hp = filt('highpass', 6500);
      hp.connect(g);
      noiseAt(t, t + 0.26, hp);
    },
    shaker: ({ t, vel }, bus) => {
      const g = gainAt(bus, -0.3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07 * vel, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      const bp = filt('bandpass', 6200, 1.4);
      bp.connect(g);
      noiseAt(t, t + 0.08, bp);
    },
    crash: ({ t, vel }, bus) => {
      const g = gainAt(bus);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3 * vel, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      const hp = filt('highpass', 4200);
      hp.connect(g);
      noiseAt(t, t + 2.3, hp);
    },
    // A rising wash of noise over `dur` (into a hit).
    riser: ({ t, dur, vel }, bus) => {
      const g = gainAt(bus);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22 * vel, t + dur);
      g.gain.setValueAtTime(0.0001, t + dur + 0.01);
      const bp = filt('bandpass', 300, 1.6);
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(7000, t + dur);
      bp.connect(g);
      noiseAt(t, t + dur + 0.02, bp);
    },
    // A cymbal played backwards: it swells into the next downbeat.
    reverse: ({ t, dur, vel }, bus) => {
      const g = gainAt(bus);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.28 * vel, t + dur);
      g.gain.setValueAtTime(0.0001, t + dur + 0.005);
      const hp = filt('highpass', 3500);
      hp.connect(g);
      noiseAt(t, t + dur + 0.01, hp);
    },
    // The cinematic hit: a sub drop and a thump.
    impact: ({ t, vel }, bus) => {
      const g = gainAt(bus);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      const o = oscAt('sine', 90, t, t + 1.7, g);
      o.frequency.exponentialRampToValueAtTime(32, t + 0.9);
      const th = gainAt(bus);
      th.gain.setValueAtTime(0.0001, t);
      th.gain.exponentialRampToValueAtTime(0.4 * vel, t + 0.003);
      th.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      const lp = filt('lowpass', 900);
      lp.connect(th);
      noiseAt(t, t + 0.4, lp);
    },
  };

  /** The pump: strings and bass dip on the kick and come back within an eighth. */
  const pump = (t: number) => {
    for (const g of ['strings', 'bass', 'keys'] as const) {
      const p = buses[g].gain;
      const base = MIX[g].gain;
      p.setValueAtTime(base, t);
      p.linearRampToValueAtTime(base * 0.5, t + 0.012);
      p.linearRampToValueAtTime(base, t + 0.2);
    }
  };

  // Notes are created just in time (in batches, as Kinetic's engine does): thousands of idle nodes up front
  // would make every render quantum crawl.
  const sorted = [...notes].sort((a, b) => a.t - b.t);
  const batch = 0.5;
  const groups = new Map<number, Note[]>();
  for (const n of sorted) {
    const k = Math.max(0, Math.floor(n.t / batch));
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(n);
  }
  const fire = (list: Note[]) => {
    for (const n of list) {
      if (n.pump) pump(n.t);
      play[n.inst](n, buses[GROUP[n.inst]]);
    }
  };
  const q = 128 / sampleRate;
  groups.forEach((list, k) => {
    const at = Math.floor((k * batch - 0.05) / q) * q;
    if (at <= 0) fire(list);
    else if (at < dur) void ac.suspend(at).then(() => {
      fire(list);
      void ac.resume();
    });
  });
  return ac.startRendering();
}
