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
  callbacks: Map<Element, Callback>;
}

const pools = new Map<string, Pool>();

function lineOf(start: string): number {
  const m = /^\s*top\s+(\d+(?:\.\d+)?)%\s*$/.exec(start);
  const pct = m ? Number(m[1]) : 85;
  return Math.min(100, Math.max(0, pct));
}

function poolFor(line: number): Pool {
  const key = String(line);
  let pool = pools.get(key);
  if (pool) return pool;
  const callbacks = new Map<Element, Callback>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // Inside the band [0, line] of the viewport, or already scrolled past it. A box
        // with no size is not laid out yet (e.g. a content-visibility section that is
        // still skipped): wait for a real intersection instead of firing early.
        const r = entry.boundingClientRect;
        const passed = r.height > 0 && r.bottom <= 0;
        if (!entry.isIntersecting && !passed) continue;
        const cb = callbacks.get(entry.target);
        if (!cb) continue;
        callbacks.delete(entry.target);
        io.unobserve(entry.target);
        cb();
      }
    },
    { rootMargin: `0px 0px -${100 - line}% 0px`, threshold: 0 },
  );
  pool = { io, callbacks };
  pools.set(key, pool);
  return pool;
}

/** Calls `cb` once when `el` reaches the `start` line. Returns a function that cancels it. */
export function observeEnter(el: Element, start: string, cb: Callback): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    cb();
    return () => {};
  }
  const pool = poolFor(lineOf(start));
  pool.callbacks.set(el, cb);
  pool.io.observe(el);
  return () => {
    if (pool.callbacks.delete(el)) pool.io.unobserve(el);
  };
}
