import type { Inst, Note } from './orquesta';

/**
 * The intro film's clock and its music (components/intro): one place for both, so every cut lands on the beat.
 * 120 BPM — a bar is 2 s, a beat 0.5 s. Pure (no DOM, no Web Audio): tests/intro.test.ts reads it.
 *
 * The music is playful on purpose (Ignacio: «música divertida»): C major, I–V–vi–IV, a bouncing octave bass, claps on
 * two and four, an off-beat plucked skank, a whistled hook on the lead doubled by the glockenspiel at the top. After the
 * last chord a two-bar vamp loops softly under «Activar Eclipse» until the visitor presses it.
 */
export const BPM = 120;
export const BEAT = 60 / BPM;
export const BAR = 4 * BEAT;

/** When each scene starts (s). The film holds at `end` + 2 s with the vamp looping. */
export const SCENE = {
  ignite: 0,
  golpes: 4,
  eco: 8,
  zoom: 12,
  soon: 24,
  units: 28,
  plans: 32,
  end: 38,
} as const;
/** The four product zooms: one every six beats. */
export const ZOOM_STEP = 3;
/** The word slams: one per two beats. */
export const GOLPES = [4, 5, 6, 7] as const;
/** Where the film stops and waits for «Activar Eclipse». */
export const FILM_END = 40;

export type Chord = 'C' | 'G' | 'Am' | 'F' | 'Dm' | 'Em';
const PCS: Record<Chord, number[]> = { C: [0, 4, 7], G: [7, 11, 2], Am: [9, 0, 4], F: [5, 9, 0], Dm: [2, 5, 9], Em: [4, 7, 11] };

export type Style = 'chispa' | 'golpes' | 'groove' | 'hook' | 'puente' | 'cima' | 'final' | 'vamp';
/** [bar, sixteenth, midi, length in sixteenths, velocity?] from the section's start. */
export type Line = [number, number, number, number, number?][];

export interface Section {
  from: number;
  to: number;
  style: Style;
  chords: Chord[];
  /** The lead (in `puente` and `chispa`, the glockenspiel). */
  melody?: Line;
}

const HOOK_A: Line = [
  [0, 0, 76, 2], [0, 2, 79, 2], [0, 4, 84, 3], [0, 8, 83, 2], [0, 10, 79, 2], [0, 12, 76, 4],
  [1, 0, 74, 2], [1, 2, 79, 2], [1, 4, 83, 3], [1, 8, 81, 2], [1, 10, 79, 2], [1, 12, 74, 4],
  [2, 0, 76, 2], [2, 2, 81, 2], [2, 4, 84, 3], [2, 8, 83, 2], [2, 10, 81, 2], [2, 12, 76, 4],
  [3, 0, 77, 2], [3, 2, 81, 2], [3, 4, 84, 3], [3, 8, 86, 2], [3, 10, 84, 2], [3, 12, 81, 4],
  [4, 0, 76, 2], [4, 2, 79, 2], [4, 4, 84, 3], [4, 8, 83, 2], [4, 10, 79, 2], [4, 12, 76, 4],
  [5, 0, 74, 2], [5, 2, 79, 2], [5, 4, 83, 2], [5, 6, 86, 2], [5, 8, 86, 8],
];
const HOOK_B: Line = [
  [0, 0, 81, 2], [0, 2, 84, 2], [0, 4, 88, 4], [0, 8, 86, 2], [0, 10, 84, 2], [0, 12, 81, 4],
  [1, 0, 81, 2], [1, 2, 84, 2], [1, 4, 89, 4], [1, 8, 88, 2], [1, 10, 86, 2], [1, 12, 84, 4],
];
const BRIDGE: Line = [
  [0, 0, 89, 2], [0, 4, 88, 2], [0, 8, 84, 2], [0, 12, 81, 2],
  [1, 0, 86, 2], [1, 4, 84, 2], [1, 8, 83, 4], [1, 12, 79, 4],
];
const TWINKLE: Line = [[1, 8, 88, 2], [1, 10, 91, 2], [1, 12, 96, 4]];
const SIGNATURE: Line = [[0, 0, 84, 2], [0, 2, 88, 2], [0, 4, 91, 2], [0, 6, 96, 10]];

/** The intro's score: 20 bars of film, then the 2-bar vamp (rendered on its own and looped). */
export const SCORE: Section[] = [
  { from: 0, to: 4, style: 'chispa', chords: ['Am', 'G'], melody: TWINKLE },
  { from: 4, to: 8, style: 'golpes', chords: ['F', 'G'] },
  { from: 8, to: 12, style: 'groove', chords: ['C', 'G'] },
  { from: 12, to: 24, style: 'hook', chords: ['C', 'G', 'Am', 'F', 'C', 'G'], melody: HOOK_A },
  { from: 24, to: 28, style: 'puente', chords: ['F', 'G'], melody: BRIDGE },
  { from: 28, to: 32, style: 'hook', chords: ['Am', 'F'], melody: HOOK_B },
  { from: 32, to: 38, style: 'cima', chords: ['C', 'G', 'F'], melody: HOOK_A.filter(([b]) => b < 3) },
  { from: 38, to: 40, style: 'final', chords: ['C'], melody: SIGNATURE },
];
export const VAMP: Section[] = [
  { from: 0, to: 4, style: 'vamp', chords: ['C', 'F'] },
  { from: 4, to: 8, style: 'vamp', chords: ['C', 'F'] },
];

const mod = (a: number, n: number) => ((a % n) + n) % n;
const inRange = (pcs: number[], lo: number) => pcs.map((pc) => lo + mod(pc - lo, 12)).sort((a, b) => a - b);
const bassRoot = (c: Chord) => 36 + mod(PCS[c][0] - 36, 12);
const pad = (c: Chord) => {
  const [r, third, fifth] = PCS[c];
  const root = 48 + mod(r - 48, 12);
  return [root, root + mod(third - r, 12) + 12, root + mod(fifth - r, 12) + 12, root + 12];
};
const triad = (c: Chord, lo: number) => inRange(PCS[c], lo);

/** From sections to the orchestra's notes. */
export function arrange(sections: Section[]): Note[] {
  const s16 = BEAT / 4;
  const out: Note[] = [];
  const add = (inst: Inst, t: number, dur: number, vel: number, midi?: number, pump?: boolean) => out.push({ t, inst, dur, vel, midi, pump });

  for (const sec of sections) {
    const bars = Math.round((sec.to - sec.from) / BAR);
    const melodyInst: Inst = sec.style === 'puente' || sec.style === 'chispa' || sec.style === 'final' ? 'glock' : 'lead';
    for (const [b, pos, midi, len, vel = 0.8] of sec.melody ?? []) {
      const t = sec.from + b * BAR + pos * s16;
      add(melodyInst, t, len * s16 * 0.92, vel, midi);
      // The hook's top notes sparkle on the glockenspiel in the chorus.
      if (sec.style === 'cima' || (sec.style === 'hook' && pos === 4)) add('glock', t, len * s16, 0.55, midi + 12);
    }
    for (let b = 0; b < bars; b++) {
      const c = sec.chords[Math.min(b, sec.chords.length - 1)];
      const t0 = sec.from + b * BAR;
      const at = (p: number) => t0 + p * s16;
      const root = bassRoot(c);
      const last = b === bars - 1;
      const groove = (claps = true, kick = true) => {
        for (let p = 0; p < 16; p++) {
          if (kick && p % 4 === 0) add('kick', at(p), 0.4, p === 0 ? 0.95 : 0.85, undefined, true);
          if (claps && (p === 4 || p === 12)) add('clap', at(p), 0.2, 0.75);
          if (p % 4 === 2) add('openhat', at(p), 0.2, 0.55);
          add('shaker', at(p), 0.06, p % 2 ? 0.35 : 0.55);
          // The bounce: root and octave in eighths, short.
          if (p % 2 === 0) add('bass', at(p), 0.2, p % 4 === 0 ? 0.85 : 0.65, p % 4 === 0 ? root : root + 12);
          // The skank: the chord on every off-beat, plucked high.
          if (p % 4 === 2) triad(c, 67).forEach((m) => add('pluck', at(p), 0.18, 0.7, m));
        }
      };

      switch (sec.style) {
        case 'chispa': {
          if (b === 0) add('impact', t0, 1.4, 0.55);
          pad(c).forEach((m) => add('strings', t0, BAR + 0.05, 0.45 + 0.25 * b, m));
          add('bass', t0, BAR, 0.5, root);
          if (last) add('riser', t0 + BAR / 2, BAR / 2, 0.8);
          break;
        }
        case 'golpes': {
          // One word every two beats: a kick, a clap, a stab and a sub on each.
          for (const p of [0, 8]) {
            add('kick', at(p), 0.4, 0.95);
            add('clap', at(p), 0.2, 0.8);
            add('impact', at(p), 0.9, 0.3);
            add('bass', at(p), 0.8, 0.8, root);
            triad(c, 60).forEach((m) => add('keys', at(p), 0.5, 0.8, m));
            triad(c, 72).forEach((m) => add('pluck', at(p), 0.2, 0.8, m));
          }
          for (let p = 0; p < 16; p += 2) add('hat', at(p), 0.05, 0.4 + p * 0.02);
          if (last) {
            for (let p = 8; p < 16; p++) add('snare', at(p), 0.1, 0.3 + (p - 8) * 0.07);
            add('riser', at(8), BAR / 2, 0.9);
          }
          break;
        }
        case 'groove': {
          groove();
          if (b === 0) add('crash', t0, 2, 0.6);
          triad(c, 60).forEach((m) => add('keys', t0, 0.5, 0.5, m));
          break;
        }
        case 'hook': {
          groove();
          if (b === 0) add('crash', t0, 2, 0.5);
          triad(c, 60).forEach((m) => {
            add('keys', at(0), 0.4, 0.45, m);
            add('keys', at(8), 0.4, 0.4, m);
          });
          break;
        }
        case 'puente': {
          // A breath: no kick, the arpeggio climbing, strings under it, soft claps.
          for (let p = 0; p < 16; p++) {
            const tones = triad(c, 72);
            add('pluck', at(p), 0.16, 0.45 + (p % 4 === 0 ? 0.2 : 0), tones[p % 3] + (p >= 8 ? 12 : 0));
          }
          add('clap', at(4), 0.2, 0.45);
          add('clap', at(12), 0.2, 0.45);
          pad(c).forEach((m) => add('strings', t0, BAR + 0.05, 0.55, m));
          add('bass', t0, BAR * 0.95, 0.55, root);
          if (last) add('reverse', at(8), BAR / 2, 0.8);
          break;
        }
        case 'cima': {
          groove();
          if (b === 0) add('crash', t0, 2.2, 0.75);
          pad(c).forEach((m) => add('strings', t0, BAR + 0.05, 0.65, m));
          if (last) {
            for (let p = 8; p < 16; p++) add('snare', at(p), 0.1, 0.35 + (p - 8) * 0.08);
            add('riser', at(8), BAR / 2, 1);
          }
          break;
        }
        case 'final': {
          add('impact', t0, 1.6, 0.8);
          add('crash', t0, 2.4, 0.8);
          add('kick', t0, 0.4, 1);
          pad(c).forEach((m) => add('strings', t0, BAR * 0.9, 0.8, m));
          triad(c, 60).forEach((m) => add('keys', t0, BAR * 0.8, 0.7, m));
          add('bass', t0, BAR * 0.9, 0.8, root);
          break;
        }
        case 'vamp': {
          // Under the button: light, steady, loopable.
          for (const p of [0, 6, 8, 14]) triad(c, 60).forEach((m) => add('keys', at(p), 0.22, p % 8 === 0 ? 0.42 : 0.3, m));
          for (let p = 0; p < 16; p += 2) add('shaker', at(p), 0.06, 0.3);
          add('bass', at(0), 0.45, 0.5, root);
          add('bass', at(8), 0.45, 0.45, root + 12);
          if (b % 2 === 1) add('glock', at(12), 0.6, 0.35, triad(c, 84)[2]);
          break;
        }
      }
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Every note of the film (20 bars) and of the vamp (two passes; the second is the loop: 4–8 s). */
export const filmNotes = () => arrange(SCORE);
export const vampNotes = () => arrange(VAMP);
export const VAMP_LOOP = { start: 4, end: 8 } as const;
