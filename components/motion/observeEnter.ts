'use client';

/**
 * "Run this once when the element reaches the reading line" without ScrollTrigger:
 * one pooled IntersectionObserver per line, no scroll listener, no layout reads.
 *
 * `start` uses the ScrollTrigger notation the motion components always took,
 * "top NN%": fires when the element's top crosses NN% of the viewport height
 * (anything else falls back to "top 85%"). An element already above that line when
 * it starts being observed (a reload mid-page, a deep link) fires right away, as a
 * passed ScrollTrigger start did.
 *
 * Why: every ScrollTrigger is updated on every scroll event until it fires, and GSAP
 * reads computed styles when a tween is created; the once-only entrances of
 * Reveal / DrawLine / LightSweep / Occult / CountUp did both, dozens of times per page.
 */

type Callback = () => void;

interface Pool {
  io: IntersectionObserver;
  callbacks: Map<Element, Set<Callback>>;
}

const pools = new Map<number, Pool>();

function lineOf(start: string): number {
  const m = /^\s*top\s+(\d+(?:\.\d+)?)%\s*$/.exec(start);
  const pct = m ? Number(m[1]) : 85;
  return Math.min(100, Math.max(0, pct));
}

function poolFor(line: number): Pool {
  let pool = pools.get(line);
  if (pool) return pool;
  const callbacks = new Map<Element, Set<Callback>>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // Inside the band [0, line] of the viewport, or already scrolled past it. A box
        // with no size is not laid out yet (e.g. a content-visibility section that is
        // still skipped, or a closed panel): wait for a real intersection instead.
        const r = entry.boundingClientRect;
        const passed = r.height > 0 && r.bottom <= 0;
        if (!entry.isIntersecting && !passed) continue;
        const set = callbacks.get(entry.target);
        if (!set) continue;
        callbacks.delete(entry.target);
        io.unobserve(entry.target);
        set.forEach((cb) => cb());
      }
    },
    { rootMargin: `0px 0px -${100 - line}% 0px`, threshold: 0 },
  );
  pool = { io, callbacks };
  pools.set(line, pool);
  return pool;
}

/** Calls `cb` once when `el` reaches the `start` line. Returns a function that cancels it. */
export function observeEnter(el: Element, start: string, cb: Callback): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    cb();
    return () => {};
  }
  const pool = poolFor(lineOf(start));
  let set = pool.callbacks.get(el);
  if (!set) {
    set = new Set();
    pool.callbacks.set(el, set);
    pool.io.observe(el);
  }
  set.add(cb);
  return () => {
    const current = pool.callbacks.get(el);
    if (!current?.delete(cb) || current.size) return;
    pool.callbacks.delete(el);
    pool.io.unobserve(el);
  };
}
