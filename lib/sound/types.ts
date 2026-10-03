/**
 * Sound design contract (v2). Every UI sound is synthesized with Web Audio (no audio
 * files; lib/sound/engine.ts, a lazy chunk) and only plays after the visitor turns
 * sound on: it is off by default. Implemented by components/sound/SoundProvider.tsx.
 *
 * When to use which (keep it sparse — meaningful moments only, never on hover):
 * - tick     → a value changes by one step (stepper +/−, slider detent, carousel snap)
 * - select   → picking an option (vertical chip, tab, radio card)
 * - toggle   → a binary switch (monthly/annual, sidebar collapse, sound on)
 * - open     → a sheet / modal / demo opens
 * - close    → it closes
 * - success  → something lands: item added to the plan, message ready, booking confirmed
 * - whoosh   → a big transition (demo reveal, section-scale motion)
 * - glint    → the diamond-ring moment (primary CTA press, eclipse totality)
 * - type     → a chat bubble arrives (demos, agent chat), very soft
 * - error    → an action that can't happen (limit reached)
 */
export type SoundName =
  | 'tick'
  | 'select'
  | 'toggle'
  | 'open'
  | 'close'
  | 'success'
  | 'whoosh'
  | 'glint'
  | 'type'
  | 'error';

export interface PlayOptions {
  /** Semitones relative to the sound's base pitch (e.g. a stepper going up: +1, +2…). */
  pitch?: number;
  /** 0–1 multiplier on the sound's own level. */
  volume?: number;
}

export interface SoundApi {
  /** The visitor turned UI sound effects on (persisted across visits). Gates `play()`. */
  enabled: boolean;
  /**
   * Generative ambient music is on (persisted). Independent of `enabled`: the header
   * toggle turns both on/off together, the preferences panel has a switch for each.
   */
  music: boolean;
  /** Call from a click / key handler: the first time, audio is unlocked inside that gesture. */
  setEnabled(on: boolean): void;
  setMusic(on: boolean): void;
  /** Plays a UI sound when enabled; a silent no-op otherwise. Safe to call anywhere. */
  play(name: SoundName, options?: PlayOptions): void;
}
