'use client';

import type { gsap } from './gsap';

/**
 * Continuous motion that only runs while it is seen (decision of Ignacio, 28/10/2026: every area
 * keeps moving). One pooled IntersectionObserver for every looping plate: a loop plays while its
 * element is on screen (with a 10 % margin) and the tab is visible, and pauses otherwise, so
 * nothing ticks off-screen. Callers never build loops under reduced motion.
 */

interface Entry {
  inView: boolean;
  anims: Set<gsap.core.Animation>;
}

const entries = new Map<Element, Entry>();
let io: IntersectionObserver | null = null;
let listening = false;

const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

function sync(entry: Entry) {
  const run = entry.inView && !hidden();
  entry.anims.forEach((a) => (run ? a.play() : a.pause()));
}

function onVisibility() {
  entries.forEach(sync);
}

function observer(): IntersectionObserver {
  if (io) return io;
  io = new IntersectionObserver(
    (list) => {
      for (const e of list) {
        const entry = entries.get(e.target);
        if (!entry) continue;
        entry.inView = e.isIntersecting;
        sync(entry);
      }
    },
    { rootMargin: '10% 0px 10% 0px', threshold: 0 },
  );
  if (!listening) {
    document.addEventListener('visibilitychange', onVisibility);
    listening = true;
  }
  return io;
}

/**
 * Plays `anim` (built paused) whenever `el` is on screen. Returns a cleanup that stops watching
 * and kills the animation.
 */
export function whileVisible(el: Element, anim: gsap.core.Animation): () => void {
  anim.pause();
  let entry = entries.get(el);
  if (!entry) {
    entry = { inView: false, anims: new Set() };
    entries.set(el, entry);
    observer().observe(el);
  }
  entry.anims.add(anim);
  sync(entry);
  return () => {
    const current = entries.get(el);
    current?.anims.delete(anim);
    if (current && current.anims.size === 0) {
      entries.delete(el);
      io?.unobserve(el);
    }
    anim.kill();
  };
}
