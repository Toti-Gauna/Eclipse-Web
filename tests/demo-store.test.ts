import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoStore, nextBeat } from '@/components/demos/kit/store';

const BEATS = [
  { id: 'a', at: 2000 },
  { id: 'b', at: 5000 },
  { id: 'c', at: 9000 },
] as const;

function make(reduced = false) {
  return createDemoStore({ n: 0 }, { beats: BEATS, tickMs: 500, reducedMotion: () => reduced, reset: () => ({ n: 0 }) });
}

describe('demo store with beats (no autoplay)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('never runs at rest, even while held (active)', () => {
    const store = make();
    store.acquire({});
    vi.advanceTimersByTime(60_000);
    expect(store.getSnapshot()).toMatchObject({ t: 0, beat: -1, playing: false, segment: null });
  });

  it('play() runs the next segment and stops at its beat', () => {
    const store = make();
    store.acquire({});
    store.play!();
    expect(store.getSnapshot()).toMatchObject({ playing: true, segment: { from: 0, to: 2000, beat: 0 } });
    vi.advanceTimersByTime(1000);
    expect(store.getSnapshot().t).toBe(1000);
    vi.advanceTimersByTime(5000);
    expect(store.getSnapshot()).toMatchObject({ t: 2000, beat: 0, playing: false, segment: null });
    vi.advanceTimersByTime(30_000);
    expect(store.getSnapshot().t).toBe(2000);
    expect(nextBeat(store, store.getSnapshot())?.id).toBe('b');
  });

  it('only advances while a screen holds the clock (inactive = paused)', () => {
    const store = make();
    store.play!();
    vi.advanceTimersByTime(3000);
    expect(store.getSnapshot()).toMatchObject({ t: 0, playing: true });
    const token = {};
    store.acquire(token);
    vi.advanceTimersByTime(1000);
    store.release(token);
    vi.advanceTimersByTime(3000);
    expect(store.getSnapshot()).toMatchObject({ t: 1000, playing: true });
  });

  it('play(id) plays through to a later beat; earlier or current beats are ignored', () => {
    const store = make();
    store.acquire({});
    store.play!('c');
    vi.advanceTimersByTime(20_000);
    expect(store.getSnapshot()).toMatchObject({ t: 9000, beat: 2, playing: false });
    store.play!('a');
    store.play!('c');
    store.next!();
    expect(store.getSnapshot()).toMatchObject({ t: 9000, beat: 2, playing: false });
    expect(nextBeat(store, store.getSnapshot())).toBeNull();
  });

  it('finish() jumps to the end of the segment; reset() goes back to the start', () => {
    const store = make();
    store.acquire({});
    store.next!();
    vi.advanceTimersByTime(500);
    store.update((s) => ({ n: s.n + 1 }));
    store.finish!();
    expect(store.getSnapshot()).toMatchObject({ t: 2000, beat: 0, playing: false, state: { n: 1 } });
    const loop = store.getSnapshot().loop;
    store.reset!();
    expect(store.getSnapshot()).toMatchObject({ t: 0, beat: -1, playing: false, state: { n: 0 }, loop: loop + 1 });
  });

  it('a new target while playing extends the segment', () => {
    const store = make();
    store.acquire({});
    store.next!();
    vi.advanceTimersByTime(1000);
    store.next!();
    expect(store.getSnapshot().segment).toEqual({ from: 0, to: 5000, beat: 1 });
    vi.advanceTimersByTime(10_000);
    expect(store.getSnapshot()).toMatchObject({ t: 5000, beat: 1, playing: false });
  });

  it('reduced motion jumps straight to the end of the segment', () => {
    const store = make(true);
    store.play!('b');
    expect(store.getSnapshot()).toMatchObject({ t: 5000, beat: 1, playing: false, segment: null });
  });

  it('update() stamps actions with the current story time', () => {
    const store = make(true);
    store.next!();
    let stamped = -1;
    store.update((s, t) => {
      stamped = t;
      return s;
    });
    expect(stamped).toBe(2000);
  });
});

describe('legacy loop store (not migrated demos)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('still runs on its own and loops', () => {
    const store = createDemoStore({ n: 0 }, { loopMs: 2000, tickMs: 500, reducedMotion: () => false });
    store.acquire({});
    vi.advanceTimersByTime(1500);
    expect(store.getSnapshot().t).toBe(1500);
    vi.advanceTimersByTime(500);
    expect(store.getSnapshot()).toMatchObject({ t: 0, loop: 1 });
    expect(store.beats).toEqual([]);
  });
});
