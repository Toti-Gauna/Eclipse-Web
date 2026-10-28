'use client';

import { gsap, ScrollTrigger } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { track } from '@/lib/analytics';

/**
 * The automatic tour of the home (decision of Ignacio, 28/10/2026): «Descubrí los productos» starts it and the page
 * scrolls itself through each product screen (Roofy → … → VetOS), then Eclipse Media and Equipamiento, holding on each
 * long enough to read. As soon as the visitor takes over — wheel, touch, a key, a click on the page or dragging the
 * scrollbar — it pauses and a floating «Seguir con el tour automático» (AutoTourButton) lets them hand control back.
 *
 * The scrolling is a GSAP tween of window.scrollTo (never a scroll-hijack: any input stops it at once). Stops are
 * functions, re-read every frame, so deferred sections that change height while hydrating never leave it off target.
 * On wide screens with a mouse the products are a pinned horizontal track: the scroll positions of its screens come from
 * the pin's ScrollTrigger, so the tour slides the track screen by screen. Reduced motion: no tour, a plain jump.
 */
export type TourState = 'idle' | 'running' | 'paused';

/** How long each stop is held (s), and the pace of a hop (px per second, clamped). */
const HOLD = 3.6;
const HOLD_LAST = 2.4;

let state: TourState = 'idle';
let tween: gsap.core.Tween | null = null;
let holdTimer = 0;
let lastSet = 0;
const listeners = new Set<() => void>();

export const getTourState = (): TourState => state;
export const subscribeTour = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const setState = (s: TourState) => {
  if (state === s) return;
  state = s;
  listeners.forEach((cb) => cb());
};

const headerH = () => {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
  return Number.isFinite(v) && v > 0 ? v : 72;
};
const topOf = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

/** Every stop of the tour, as a function that returns its scroll position now. */
function stops(): (() => number)[] {
  const out: (() => number)[] = [];
  const products = document.getElementById(SECTION_IDS.products);
  if (products) {
    const stage = products.querySelector<HTMLElement>('[data-pd-stage]');
    const screens = products.querySelectorAll('[data-pd-screen]');
    const pin = stage ? ScrollTrigger.getAll().find((t) => t.pin === stage) : undefined;
    if (pin && products.dataset.mode === 'track' && screens.length > 1) {
      // The pinned track: the section's own opening, then one stop per screen along the pin.
      out.push(() => Math.max(0, topOf(products) - headerH() * 0.5));
      screens.forEach((_, i) => out.push(() => pin.start + ((pin.end - pin.start) * i) / (screens.length - 1)));
    } else {
      out.push(() => Math.max(0, topOf(products) - headerH() * 0.5));
      screens.forEach((screen) => out.push(() => Math.max(0, topOf(screen) - headerH() - 8)));
    }
  }
  for (const id of [SECTION_IDS.media, SECTION_IDS.equipment]) {
    out.push(() => {
      const el = document.getElementById(id);
      return el ? Math.max(0, topOf(el) - headerH() * 0.5) : window.scrollY;
    });
  }
  return out;
}

const INPUT_EVENTS: (keyof WindowEventMap)[] = ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown'];
const NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar']);

function onInput(e: Event) {
  if (state !== 'running') return;
  const target = e.target as Element | null;
  if (target?.closest?.('[data-tour-ui]')) return;
  if (e.type === 'keydown' && !NAV_KEYS.has((e as KeyboardEvent).key)) return;
  pause();
}
function onScroll() {
  // A scroll the tour did not make (the scrollbar, momentum, a focus jump): hand control over.
  if (state === 'running' && Math.abs(window.scrollY - lastSet) > 48) pause();
}

function listen(on: boolean) {
  for (const type of INPUT_EVENTS) (on ? window.addEventListener : window.removeEventListener).call(window, type, onInput, { capture: true, passive: true });
  (on ? window.addEventListener : window.removeEventListener).call(window, 'scroll', onScroll, { passive: true });
}

function clear() {
  tween?.kill();
  tween = null;
  window.clearTimeout(holdTimer);
}

function go(i: number, list: (() => number)[]) {
  if (state !== 'running') return;
  if (i >= list.length) return stop();
  const from = window.scrollY;
  const dist = Math.abs(list[i]() - from);
  lastSet = from;
  const p = { v: 0 };
  tween = gsap.to(p, {
    v: 1,
    duration: dist < 4 ? 0.01 : Math.min(3.2, Math.max(1.3, dist / 900)),
    ease: 'power2.inOut',
    onUpdate: () => {
      const y = from + (list[i]() - from) * p.v;
      lastSet = y;
      window.scrollTo(0, y);
    },
    onComplete: () => {
      holdTimer = window.setTimeout(() => go(i + 1, list), (i === list.length - 1 ? HOLD_LAST : HOLD) * 1000);
    },
  });
}

/** Starts the tour from the first stop. With reduced motion (or nothing to tour) it only jumps to the products. */
export function startTour(): boolean {
  if (prefersReducedMotion()) return false;
  const list = stops();
  if (!list.length) return false;
  clear();
  listen(false);
  setState('running');
  listen(true);
  track('tour_started', {});
  go(0, list);
  return true;
}

export function pause() {
  if (state !== 'running') return;
  clear();
  listen(false);
  setState('paused');
}

/** Continues from the next stop below where the visitor is now. */
export function resumeTour() {
  if (state !== 'paused') return;
  const list = stops();
  const y = window.scrollY;
  let i = list.findIndex((f) => f() > y + 60);
  if (i < 0) i = list.length;
  clear();
  setState('running');
  listen(true);
  track('tour_resumed', {});
  go(i, list);
}

/** Ends the tour (the last stop, or «Terminar el tour»). */
export function stop() {
  clear();
  listen(false);
  setState('idle');
}
