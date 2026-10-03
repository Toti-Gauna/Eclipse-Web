'use client';

import { gsap } from '@/components/motion/gsap';
import { MOCK_AT, TRAILER_DURATION } from './constants';

export { MOCK_AT, TRAILER_DURATION, TRAILER_POSTER_AT } from './constants';

/**
 * The 15-second vertical trailer, shared by the three rubros. Script:
 *   1 · the problem in big serif text            0.0 – 2.9 s
 *   2 · the pain number (demo scenario)          2.9 – 5.8 s
 *   3 · the demo screen sliding in + its beat    5.8 – 9.9 s
 *   4 · the result (key number counting)         9.9 – 12.8 s
 *   5 · Eclipse logo with the eclipse           12.8 – 15.0 s
 *
 * Markup contract (see VerticalTrailer.tsx): scenes are
 * `[data-trailer-scene="problem|pain|demo|result|logo"]`; animated parts carry
 * `data-trl="…"`. Every element's CSS state is its *final* state (that's what
 * reduced motion shows); the timeline sets the start states with fromTo.
 * Only transform and opacity are animated.
 */
export interface TrailerNumber {
  value: number;
  prefix: string;
  suffix: string;
}

export type Query = (selector: string) => HTMLElement[];

/** Vertical-specific animation of the mock screen, from `at` (≈ 2.8 s window). */
export type MockAnimator = (tl: gsap.core.Timeline, q: Query, at: number) => void;

export interface VerticalTimelineOptions {
  /** BCP 47 tag for number formatting. */
  localeTag: string;
  pain: TrailerNumber;
  result: TrailerNumber;
  mock?: MockAnimator;
}

/** Crossfades a [data-trl-before] / [data-trl-after] pair inside `scope`. */
export function swap(tl: gsap.core.Timeline, scope: HTMLElement | undefined, at: number) {
  if (!scope) return;
  const before = scope.querySelector<HTMLElement>('[data-trl-before]');
  const after = scope.querySelector<HTMLElement>('[data-trl-after]');
  if (before) tl.fromTo(before, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.85, duration: 0.25, ease: 'power2.in' }, at);
  if (after) tl.fromTo(after, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2.2)' }, at + 0.18);
}

/** Pops an element in (chips, toasts, bubbles). */
export function pop(tl: gsap.core.Timeline, el: HTMLElement | HTMLElement[] | undefined, at: number, from: gsap.TweenVars = {}) {
  if (!el || (Array.isArray(el) && !el.length)) return;
  tl.fromTo(
    el,
    { autoAlpha: 0, y: 10, scale: 0.94, ...from },
    { autoAlpha: 1, y: 0, x: 0, yPercent: 0, scale: 1, duration: 0.6, ease: 'expo.out' },
    at,
  );
}

export function buildVerticalTimeline(root: HTMLElement, o: VerticalTimelineOptions): gsap.core.Timeline {
  const q: Query = (sel) => Array.from(root.querySelectorAll<HTMLElement>(sel));
  const one = (sel: string) => root.querySelector<HTMLElement>(sel) ?? undefined;
  const scene = (name: string) => one(`[data-trailer-scene="${name}"]`);
  const fmt = new Intl.NumberFormat(o.localeTag, { maximumFractionDigits: 0 });

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });

  const fadeIn = (el: HTMLElement | undefined, at: number, d = 0.35) => {
    if (el) tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: 'power1.out' }, at);
  };
  const fadeOut = (el: HTMLElement | undefined, at: number, vars: gsap.TweenVars = {}) => {
    if (el) {
      tl.fromTo(
        el,
        { autoAlpha: 1, yPercent: 0, scale: 1 },
        { autoAlpha: 0, duration: 0.45, ease: 'power2.in', immediateRender: false, ...vars },
        at,
      );
    }
  };
  const rise = (els: HTMLElement[] | HTMLElement | undefined, at: number, stagger = 0.08, y = 14) => {
    if (!els || (Array.isArray(els) && !els.length)) return;
    tl.fromTo(els, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration: 0.8, stagger }, at);
  };
  const count = (el: HTMLElement | undefined, n: TrailerNumber, at: number, duration: number) => {
    if (!el) return;
    const state = { v: 0 };
    const write = () => {
      el.textContent = `${n.prefix}${fmt.format(state.v)}${n.suffix}`;
    };
    tl.fromTo(state, { v: 0 }, { v: n.value, duration, ease: 'power3.out', onUpdate: write, immediateRender: false }, at);
  };

  gsap.set(q('[data-trailer-scene]'), { autoAlpha: 0 });

  // 1 · Problem ---------------------------------------------------------
  const s1 = scene('problem');
  if (s1) {
    tl.fromTo(s1, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none' }, 0);
    const kicker = s1.querySelector<HTMLElement>('[data-trl="kicker"]') ?? undefined;
    if (kicker) tl.fromTo(kicker, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.9 }, 0.1);
    tl.fromTo(
      s1.querySelectorAll('[data-trl="line"]'),
      { yPercent: 115 },
      { yPercent: 0, duration: 1.15, stagger: 0.38, ease: 'expo.out' },
      0.15,
    );
    fadeOut(s1, 2.55, { yPercent: -5 });
  }

  // 2 · Pain number -------------------------------------------------------
  const s2 = scene('pain');
  if (s2) {
    fadeIn(s2, 2.9);
    rise(s2.querySelector<HTMLElement>('[data-trl="tag"]') ?? undefined, 2.95);
    const num = s2.querySelector<HTMLElement>('[data-trl="num"]') ?? undefined;
    if (num) tl.fromTo(num, { autoAlpha: 0, scale: 0.9, transformOrigin: '0% 80%' }, { autoAlpha: 1, scale: 1, duration: 1.3 }, 2.95);
    count(num, o.pain, 2.95, 1.5);
    const rule = s2.querySelector<HTMLElement>('[data-trl="rule"]') ?? undefined;
    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 3.35);
    rise(s2.querySelector<HTMLElement>('[data-trl="label"]') ?? undefined, 3.45);
    fadeOut(s2, 5.4, { scale: 1.03 });
  }

  // 3 · Demo screen -------------------------------------------------------
  const s3 = scene('demo');
  if (s3) {
    fadeIn(s3, 5.8, 0.3);
    rise(Array.from(s3.querySelectorAll<HTMLElement>('[data-trl="copy"]')), 5.9, 0.1, 18);
    const panel = s3.querySelector<HTMLElement>('[data-trl="panel"]') ?? undefined;
    if (panel) {
      tl.fromTo(
        panel,
        { autoAlpha: 0, yPercent: 32, rotateX: 16, scale: 0.92, transformPerspective: 1100, transformOrigin: '50% 100%' },
        { autoAlpha: 1, yPercent: 0, rotateX: 0, scale: 1, duration: 1.35, ease: 'expo.out' },
        5.85,
      );
    }
    o.mock?.(tl, (sel) => Array.from(s3.querySelectorAll<HTMLElement>(sel)), MOCK_AT);
    // Zoom through the screen into the result.
    if (panel) tl.fromTo(panel, { scale: 1 }, { scale: 1.12, duration: 0.55, ease: 'power2.in', immediateRender: false }, 9.45);
    fadeOut(s3, 9.5, { duration: 0.5 });
  }

  // 4 · Result ------------------------------------------------------------
  const s4 = scene('result');
  if (s4) {
    fadeIn(s4, 9.95);
    const glow = s4.querySelector<HTMLElement>('[data-trl="glow"]') ?? undefined;
    if (glow) tl.fromTo(glow, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 1.8 }, 9.95);
    rise(s4.querySelector<HTMLElement>('[data-trl="tag"]') ?? undefined, 10.0);
    const num = s4.querySelector<HTMLElement>('[data-trl="num"]') ?? undefined;
    if (num) tl.fromTo(num, { autoAlpha: 0, scale: 0.86 }, { autoAlpha: 1, scale: 1, duration: 1.4 }, 10.0);
    count(num, o.result, 10.0, 1.6);
    const rule = s4.querySelector<HTMLElement>('[data-trl="rule"]') ?? undefined;
    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 10.5);
    rise(s4.querySelector<HTMLElement>('[data-trl="label"]') ?? undefined, 10.55);
    fadeOut(s4, 12.4, { scale: 0.97 });
  }

  // 5 · Logo --------------------------------------------------------------
  const s5 = scene('logo');
  if (s5) {
    fadeIn(s5, 12.85, 0.3);
    const moon = s5.querySelector<HTMLElement>('[data-trl="moon"]') ?? undefined;
    const corona = s5.querySelector<HTMLElement>('[data-trl="corona"]') ?? undefined;
    const glow = s5.querySelector<HTMLElement>('[data-trl="eclipse-glow"]') ?? undefined;
    const sun = s5.querySelector<HTMLElement>('[data-trl="sun"]') ?? undefined;
    if (sun) tl.fromTo(sun, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.6 }, 12.85);
    if (moon) tl.fromTo(moon, { xPercent: -78, yPercent: 26 }, { xPercent: 0, yPercent: 0, duration: 1.05, ease: 'power2.inOut' }, 12.95);
    if (corona) tl.fromTo(corona, { autoAlpha: 0, scale: 0.72, rotate: -20 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.3 }, 13.75);
    if (glow) tl.fromTo(glow, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 1.2 }, 13.7);
    const letters = Array.from(s5.querySelectorAll<HTMLElement>('[data-trl="letter"]'));
    if (letters.length) tl.fromTo(letters, { autoAlpha: 0, yPercent: 90 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, stagger: 0.045 }, 13.8);
    rise(s5.querySelector<HTMLElement>('[data-trl="endline"]') ?? undefined, 14.05, 0, 10);
    fadeOut(s5, 14.6, { duration: 0.4, ease: 'power1.in' });
  }

  // Pad to the nominal length (the logo fade ends at 15 s).
  if (tl.duration() < TRAILER_DURATION) tl.set({}, {}, TRAILER_DURATION);
  return tl;
}
