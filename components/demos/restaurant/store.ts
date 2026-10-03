'use client';

import type { DemoStore, DemoStoreOptions, StorySnapshot } from '../kit';

/**
 * The kit's story store (kit/store.ts `createDemoStore`) plus one thing this demo needs:
 * while the visitor is engaged, the clock keeps running up to `overrunMs` PAST the end of
 * the loop instead of freezing on its last frame — so what they just did (a dish marked
 * out of stock → a caller hears the alternative; the AI switched off → a missed call)
 * plays out even when they act in the last seconds of the story. Then it holds, and
 * loops once they leave it alone. Same interface: `useStory` / `usePairedStore` work as is.
 * Proposed as a kit option (`overrunMs`) in the report.
 */
export function createStoryStore<S>(initial: S, options: DemoStoreOptions<S> & { overrunMs?: number }): DemoStore<S> {
  const { loopMs, tickMs = 500, holdMs = 12_000, onLoop, paired = false, overrunMs = 0 } = options;
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
      const cap = loopMs + overrunMs;
      if (snap.t < cap) emit({ ...snap, t: Math.min(next, cap) });
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
