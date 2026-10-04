import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { beatFocusStep, beatIndexAt, createDemoStore, type BeatFocus } from '@/components/demos/kit/store';

const BEATS = [
  { id: 'a', at: 2000 },
  { id: 'b', at: 5000 },
  { id: 'c', at: 9000 },
] as const;

function make(reduced = false) {
  return createDemoStore({ n: 0 }, { beats: BEATS, tickMs: 500, reducedMotion: () => reduced });
}

/**
 * Follows a store like a view would, returning every beat it was taken to. `batched`: React
 * renders once after a handler, so only the snapshot after the action counts (call `check`).
 */
function follow(store: ReturnType<typeof make>, batched = false) {
  const visits: string[] = [];
  let last: BeatFocus = { loop: store.getSnapshot().loop, beat: store.getSnapshot().beat ?? -1 };
  const check = () => {
    const step = beatFocusStep(BEATS, store.getSnapshot(), last);
    last = step.last;
    if (step.go >= 0) visits.push(BEATS[step.go].id);
  };
  if (!batched) store.subscribe(check);
  return Object.assign(visits, { check });
}

describe('beatIndexAt', () => {
  it('finds the segment that holds a story time', () => {
    expect(beatIndexAt(BEATS, 0)).toBe(0);
    expect(beatIndexAt(BEATS, 1999)).toBe(0);
    expect(beatIndexAt(BEATS, 2000)).toBe(1);
    expect(beatIndexAt(BEATS, 8999)).toBe(2);
    expect(beatIndexAt(BEATS, 20_000)).toBe(2);
    expect(beatIndexAt([], 0)).toBe(-1);
  });
});

describe('a simulation takes the view where it happens (useBeatFocus)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('goes to the beat as soon as it starts playing, once', () => {
    const store = make();
    const visits = follow(store);
    store.acquire({});
    store.play!();
    expect([...visits]).toEqual(['a']);
    vi.advanceTimersByTime(3000);
    expect([...visits]).toEqual(['a']);
  });

  it('a jump over several beats visits each one as the story enters it', () => {
    const store = make();
    const visits = follow(store);
    store.acquire({});
    store.play!('c');
    expect([...visits]).toEqual(['a']);
    vi.advanceTimersByTime(2000);
    expect([...visits]).toEqual(['a', 'b']);
    vi.advanceTimersByTime(3000);
    expect([...visits]).toEqual(['a', 'b', 'c']);
    vi.advanceTimersByTime(10_000);
    expect([...visits]).toEqual(['a', 'b', 'c']);
  });

  it('with reduced motion (lands at once) it goes to the beat reached', () => {
    const store = make(true);
    const visits = follow(store, true);
    store.play!('b');
    visits.check();
    expect([...visits]).toEqual(['b']);
  });

  it('reset does not navigate; the next run navigates again', () => {
    const store = make();
    const visits = follow(store);
    store.acquire({});
    store.play!();
    store.finish!();
    store.reset!();
    expect([...visits]).toEqual(['a']);
    store.play!();
    expect([...visits]).toEqual(['a', 'a']);
  });

  it('a view that mounts later does not jump to a beat already reached', () => {
    const store = make();
    store.acquire({});
    store.play!();
    store.finish!();
    const visits = follow(store);
    store.update((s) => ({ n: s.n + 1 }));
    expect([...visits]).toEqual([]);
    store.play!();
    expect([...visits]).toEqual(['b']);
  });
});
