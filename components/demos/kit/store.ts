'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { prefersReducedMotion, useReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * Story clock + shared state for a demo.
 *
 * Everything visible is DERIVED from the story time `t` (ms) and from what the visitor did
 * (`state`). Laptop + phone subscribe to ONE store (see `usePairedStore`) and agree.
 *
 * v3 — beats (manual, no autoplay). Pass `beats` and the story becomes a list of explicit
 * simulations the visitor triggers (kit `<SimBar>`):
 * - at rest the clock NEVER runs: nothing changes on screen without a click;
 * - `play(beatId?)` plays the story from the current `t` up to that beat's `at` (default: the
 *   next beat) and stops there; `next()` is `play()`; `finish()` jumps to the end of the
 *   segment being played; `reset()` goes back to the start (state from `reset`/`initial`);
 * - while playing, the clock only ticks while a screen showing it is `active` and the tab is
 *   visible; with reduced motion `play()` jumps straight to the end of the segment;
 * - the snapshot tells which beat was reached (`beat`, −1 = none) and whether a segment plays.
 *
 * v2 — loop (legacy, deprecated): without `beats`, the clock runs on its own while active and
 * the story loops every `loopMs` (`onLoop`, `engage()` hold the final frame). Kept so demos not
 * yet migrated keep working; new code uses beats.
 */
export interface DemoBeat {
  /** Stable id; its label is `demo<Name>.sim.<id>` in the demo's namespace. */
  id: string;
  /** Story time (ms) at which this beat's segment ENDS. Increasing; the first segment starts at 0. */
  at: number;
}

export interface StorySnapshot<S> {
  state: S;
  /** Story time in ms (0 … the last beat's `at` / `loopMs`). */
  t: number;
  /** How many times the story restarted (`reset`, `restart`, a loop). Use it in React keys. */
  loop: number;
  /* Set by createDemoStore (optional only so hand-written legacy stores still type-check). */
  /** Beats: index of the last beat reached (−1: none yet). Always −1 without beats. */
  beat?: number;
  /** Beats: a segment is playing (the clock runs while active). */
  playing?: boolean;
  /** Beats: the segment being played (story times), or null at rest. */
  segment?: { from: number; to: number; beat: number } | null;
}

export interface DemoStore<S> {
  readonly paired: boolean;
  /** Length of the story: the last beat's `at` (beats) or the loop length (legacy). */
  readonly loopMs: number;
  /** The beats (empty for a legacy loop store). */
  readonly beats?: readonly DemoBeat[];
  subscribe(listener: () => void): () => void;
  getSnapshot(): StorySnapshot<S>;
  /** Updates the visitor/story state. `t` is the current story time (stamp your actions with it). */
  update(fn: (state: S, t: number) => S): void;
  /** Legacy loop: the visitor did something, hold the loop restart. No-op with beats. */
  engage(holdMs?: number): void;
  /** Start the story again now (with beats: same as `reset`). */
  restart(): void;
  /** Beats: play from the current `t` up to `beatId` (default: the next beat). Ignored when it is not ahead. */
  play?(beatId?: string): void;
  /** Beats: play the next beat. */
  next?(): void;
  /** Beats: jump to the end of the segment being played. */
  finish?(): void;
  /** Beats: back to the start (`reset(state)` or the initial state, t = 0, no beat). */
  reset?(): void;
  /** Used by `useStory`: the clock runs while at least one token holds it. */
  acquire(token: object): void;
  release(token: object): void;
}

export interface DemoStoreOptions<S> {
  /** v3: the story's explicit simulations (see DemoBeat). Turns autoplay off. */
  beats?: readonly DemoBeat[];
  /** Beats: the state after "Reiniciar" (default: the initial state). */
  reset?: (state: S) => S;
  /** Legacy loop: length of the story before it loops. With beats it defaults to the last beat's `at`. */
  loopMs: number;
  /** Clock resolution. Keep it coarse (default 500 ms): CSS does the fine motion. */
  tickMs?: number;
  /** Legacy loop: after the visitor's last interaction, how long the final frame holds (default 12 s). */
  holdMs?: number;
  /** Legacy loop: resets the story part of the state when the loop restarts. */
  onLoop?: (state: S) => S;
  paired?: boolean;
  /** Testing hook: reduced-motion check (default: the visitor's preference). */
  reducedMotion?: () => boolean;
}

/** v3 options: `beats` required, `loopMs` optional (the last beat's `at`). */
export type BeatStoreOptions<S> = Omit<DemoStoreOptions<S>, 'beats' | 'loopMs' | 'holdMs' | 'onLoop'> & {
  beats: readonly DemoBeat[];
  loopMs?: number;
};

const now = () => Date.now();
const hidden = () => typeof document !== 'undefined' && document.hidden;

export function createDemoStore<S>(initial: S, options: DemoStoreOptions<S> | BeatStoreOptions<S>): DemoStore<S> {
  const beats = options.beats ?? [];
  const manual = beats.length > 0;
  const loopMs = options.loopMs ?? (manual ? beats[beats.length - 1].at : 30_000);
  const { tickMs = 500, paired = false, reducedMotion = prefersReducedMotion } = options;
  const { holdMs = 12_000, onLoop } = options as DemoStoreOptions<S>;

  let snap: StorySnapshot<S> = { state: initial, t: 0, loop: 0, beat: -1, playing: false, segment: null };
  let engagedUntil = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const holders = new Set<object>();
  const listeners = new Set<() => void>();

  const emit = (next: StorySnapshot<S>) => {
    snap = next;
    listeners.forEach((l) => l());
    sync();
  };

  /* ---- beats ---- */
  const reset = () =>
    emit({ state: options.reset ? options.reset(snap.state) : initial, t: 0, loop: snap.loop + 1, beat: -1, playing: false, segment: null });
  const land = () => {
    const seg = snap.segment;
    if (!seg) return;
    emit({ ...snap, t: seg.to, beat: seg.beat, playing: false, segment: null });
  };
  const play = (beatId?: string) => {
    if (!manual) return;
    const from = snap.segment ? snap.segment.beat : (snap.beat ?? -1);
    const target = beatId === undefined ? from + 1 : beats.findIndex((b) => b.id === beatId);
    if (target < 0 || target >= beats.length || target <= from) return;
    // A new target while playing extends the current segment.
    emit({ ...snap, playing: true, segment: { from: snap.segment?.from ?? snap.t, to: beats[target].at, beat: target } });
    if (reducedMotion()) land();
  };

  /* ---- clock ---- */
  const tick = () => {
    if (hidden()) return;
    if (manual) {
      const seg = snap.segment;
      if (!seg) return;
      const next = snap.t + tickMs;
      if (next >= seg.to) return land();
      return emit({ ...snap, t: next });
    }
    const next = snap.t + tickMs;
    if (next < loopMs) return emit({ ...snap, t: next });
    if (now() < engagedUntil) {
      if (snap.t !== loopMs) emit({ ...snap, t: loopMs });
      return;
    }
    restartLoop();
  };
  const restartLoop = () => emit({ ...snap, state: onLoop ? onLoop(snap.state) : snap.state, t: 0, loop: snap.loop + 1 });
  function sync() {
    const run = holders.size > 0 && (!manual || snap.playing);
    if (run && timer === undefined) timer = setInterval(tick, tickMs);
    if (!run && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  return {
    paired,
    loopMs,
    beats,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snap,
    update(fn) {
      emit({ ...snap, state: fn(snap.state, snap.t) });
    },
    engage(ms = holdMs) {
      if (!manual) engagedUntil = Math.max(engagedUntil, now() + ms);
    },
    restart: manual ? reset : restartLoop,
    play,
    next: () => play(),
    finish: land,
    reset: manual ? reset : restartLoop,
    acquire(token) {
      holders.add(token);
      sync();
    },
    release(token) {
      holders.delete(token);
      sync();
    },
  };
}

/** The beat the next `play()` would reach (null when every beat was played). */
export function nextBeat<S>(store: DemoStore<S>, snap: StorySnapshot<S>): DemoBeat | null {
  const beats = store.beats ?? [];
  const from = snap.segment ? snap.segment.beat : (snap.beat ?? -1);
  return beats[from + 1] ?? null;
}

/**
 * Subscribes to a demo store and lets its clock run while `active`.
 * Beats: the clock only runs while a segment plays (reduced motion jumps, see `play`).
 * Legacy loop: with reduced motion the clock never runs and `t` is the end of the story.
 */
export function useStory<S>(store: DemoStore<S>, active: boolean): StorySnapshot<S> & { reduced: boolean } {
  const reduced = useReducedMotion();
  const manual = (store.beats?.length ?? 0) > 0;
  useEffect(() => {
    if (!active || (reduced && !manual)) return;
    const token = {};
    store.acquire(token);
    return () => store.release(token);
  }, [store, active, reduced, manual]);
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return useMemo(
    () => (reduced && !manual ? { ...snap, t: store.loopMs, reduced } : { ...snap, reduced }),
    [snap, reduced, manual, store.loopMs],
  );
}

/** Subscribes to a store without driving its clock (e.g. the SimBar). */
export function useStoreSnapshot<S>(store: DemoStore<S>): StorySnapshot<S> {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/* ------------------------------------------------------------------ */
/* Pairing: the laptop and the phone of one showcase share a store      */
/* ------------------------------------------------------------------ */
const shared = new WeakMap<Element, Map<string, unknown>>();

/**
 * The element that wraps exactly one laptop and one phone (the <DemoShowcase>
 * "split" layout) around `el`. Null when the device is alone.
 */
export function findPairHost(el: Element): Element | null {
  let node = el.closest('.device-phone, .device-laptop')?.parentElement ?? null;
  for (let depth = 0; node && depth < 4; depth++, node = node.parentElement) {
    const laptops = node.querySelectorAll('.device-laptop').length;
    const phones = node.querySelectorAll('.device-phone').length;
    if (laptops === 1 && phones === 1) return node;
    if (laptops > 1 || phones > 1) return null;
  }
  return null;
}

/**
 * The showcase around a lone device (the "tabs" layout mounts one view at a time): the
 * store lives there so switching "Celular" ↔ "Escritorio" keeps what the visitor did.
 */
export function findShowcaseHost(el: Element): Element | null {
  return el.closest('[data-demo-host], .sc');
}

/** The phone shown on top of this laptop in the same showcase, if any. */
export function pairedPhoneOf(el: Element): Element | null {
  return findPairHost(el)?.querySelector('.device-phone') ?? null;
}

/**
 * A store of your own until the screen finds its showcase; then:
 * - split (laptop + phone side by side): both screens use the same store (`paired: true`);
 * - tabs (one view at a time): the views share a store across tab switches (`paired: false`).
 * Created once per showcase and `key`. Attach `ref` to any element inside the device
 * (AppShell's `rootRef`). `create` must be stable (a module-level function).
 */
export function usePairedStore<T>(key: string, create: (paired: boolean) => T) {
  const [own] = useState(() => create(false));
  const [found, setFound] = useState<{ store: T; paired: boolean } | null>(null);
  const [ref] = useState(() => (el: Element | null) => {
    if (!el) return;
    const pair = findPairHost(el);
    const host = pair ?? findShowcaseHost(el);
    if (!host) return;
    let stores = shared.get(host);
    if (!stores) {
      stores = new Map();
      shared.set(host, stores);
    }
    const id = pair ? key : `${key}:solo`;
    let store = stores.get(id) as T | undefined;
    if (!store) {
      store = create(!!pair);
      stores.set(id, store);
    }
    setFound({ store, paired: !!pair });
  });
  return { store: found?.store ?? own, paired: found?.paired ?? false, ref };
}

/* ------------------------------------------------------------------ */
/* Legacy tick clock (v1 demos)                                         */
/* ------------------------------------------------------------------ */
/**
 * Ticks every `everyMs` while `active` (and the tab is visible). With reduced
 * motion it jumps straight to `max`. Deprecated (autoplay): use beats.
 */
export function useDemoClock(active: boolean, everyMs = 1600, max = Infinity): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion: show the end state at once
      if (Number.isFinite(max)) setTick(max);
      return;
    }
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setTick((n) => (n >= max ? n : n + 1));
    }, everyMs);
    return () => window.clearInterval(id);
  }, [active, everyMs, max]);
  return tick;
}

/** True for `ms` after story time `at` (a "just happened" highlight). */
export const isFresh = (t: number, at: number | null | undefined, ms = 2000) => at != null && t >= at && t - at < ms;
