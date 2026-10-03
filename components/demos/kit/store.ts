'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { prefersReducedMotion, useReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * Story clock + shared state for a demo.
 *
 * A demo tells its story on a loop (`loopMs`, ~20–30 s): everything visible is
 * DERIVED from the story time `t` (ms since the loop started) and from what the
 * visitor did (`state`). That is what makes the three hard parts trivial:
 * - pause: the clock only runs while a screen showing it is `active` (and the tab is visible);
 * - reduced motion: render the derivation at `t = loopMs` (the final state) and never tick;
 * - laptop + phone: both screens subscribe to ONE store (see `usePairedStore`) and agree.
 *
 * When the loop ends, `onLoop(state)` resets what belongs to the story (keep what the
 * visitor made, e.g. their own booking). While the visitor is interacting (`engage()`),
 * the story holds its final frame instead of restarting under their fingers.
 */
export interface StorySnapshot<S> {
  state: S;
  /** Story time in ms, 0 … loopMs. */
  t: number;
  /** How many times the story restarted (use it in React keys to replay entrances). */
  loop: number;
}

export interface DemoStore<S> {
  readonly paired: boolean;
  readonly loopMs: number;
  subscribe(listener: () => void): () => void;
  getSnapshot(): StorySnapshot<S>;
  /** Updates the visitor/story state. `t` is the current story time (stamp your actions with it). */
  update(fn: (state: S, t: number) => S): void;
  /** The visitor did something: hold the loop restart for `holdMs` (default: the store's `holdMs`). */
  engage(holdMs?: number): void;
  /** Start the story again now (a "replay" button). */
  restart(): void;
  /** Used by `useStory`: the clock runs while at least one token holds it. */
  acquire(token: object): void;
  release(token: object): void;
}

export interface DemoStoreOptions<S> {
  /** Length of the story before it loops. */
  loopMs: number;
  /** Clock resolution. Keep it coarse (default 500 ms): CSS does the fine motion. */
  tickMs?: number;
  /** After the visitor's last interaction, how long the final frame holds before looping (default 12 s). */
  holdMs?: number;
  /** Resets the story part of the state when the loop restarts. Default: keep the state. */
  onLoop?: (state: S) => S;
  paired?: boolean;
}

export function createDemoStore<S>(initial: S, options: DemoStoreOptions<S>): DemoStore<S> {
  const { loopMs, tickMs = 500, holdMs = 12_000, onLoop, paired = false } = options;
  let snap: StorySnapshot<S> = { state: initial, t: 0, loop: 0 };
  let engagedUntil = 0;
  let timer: number | undefined;
  const holders = new Set<object>();
  const listeners = new Set<() => void>();

  const emit = (next: StorySnapshot<S>) => {
    snap = next;
    listeners.forEach((l) => l());
  };
  const restart = () => emit({ state: onLoop ? onLoop(snap.state) : snap.state, t: 0, loop: snap.loop + 1 });

  const tick = () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const next = snap.t + tickMs;
    if (next < loopMs) return emit({ ...snap, t: next });
    if (Date.now() < engagedUntil) {
      if (snap.t !== loopMs) emit({ ...snap, t: loopMs });
      return;
    }
    restart();
  };
  const sync = () => {
    if (holders.size && timer === undefined) timer = window.setInterval(tick, tickMs);
    if (!holders.size && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };

  return {
    paired,
    loopMs,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snap,
    update(fn) {
      emit({ ...snap, state: fn(snap.state, snap.t) });
    },
    engage(ms = holdMs) {
      engagedUntil = Math.max(engagedUntil, Date.now() + ms);
    },
    restart,
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

/**
 * Subscribes to a demo store and runs its clock while `active`.
 * With reduced motion the clock never runs and `t` is the end of the story.
 */
export function useStory<S>(store: DemoStore<S>, active: boolean): StorySnapshot<S> & { reduced: boolean } {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!active || reduced) return;
    const token = {};
    store.acquire(token);
    return () => store.release(token);
  }, [store, active, reduced]);
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return useMemo(() => (reduced ? { ...snap, t: store.loopMs, reduced } : { ...snap, reduced }), [snap, reduced, store.loopMs]);
}

/* ------------------------------------------------------------------ */
/* Pairing: the laptop and the phone of one showcase share a store      */
/* ------------------------------------------------------------------ */
const shared = new WeakMap<Element, Map<string, unknown>>();

/**
 * The element that wraps exactly one laptop and one phone (the <DemoShowcase>
 * "both" layout) around `el`. Null when the device is alone.
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

/** The phone shown on top of this laptop in the same showcase, if any. */
export function pairedPhoneOf(el: Element): Element | null {
  return findPairHost(el)?.querySelector('.device-phone') ?? null;
}

/**
 * A store of your own until the screen finds its sibling device; then both screens
 * use the same one (created once per showcase and `key`).
 * Attach `ref` to any element inside the device (AppShell's `rootRef`).
 *
 * `create` must be stable (a module-level function).
 */
export function usePairedStore<T>(key: string, create: (paired: boolean) => T) {
  const [own] = useState(() => create(false));
  const [pair, setPair] = useState<T | null>(null);
  const [ref] = useState(() => (el: Element | null) => {
    if (!el) return;
    const host = findPairHost(el);
    if (!host) return;
    let stores = shared.get(host);
    if (!stores) {
      stores = new Map();
      shared.set(host, stores);
    }
    let store = stores.get(key) as T | undefined;
    if (!store) {
      store = create(true);
      stores.set(key, store);
    }
    setPair(store);
  });
  return { store: pair ?? own, paired: pair !== null, ref };
}

/* ------------------------------------------------------------------ */
/* Legacy tick clock (v1 demos)                                         */
/* ------------------------------------------------------------------ */
/**
 * Ticks every `everyMs` while `active` (and the tab is visible). With reduced
 * motion it jumps straight to `max`. New demos: prefer `createDemoStore` + `useStory`.
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
