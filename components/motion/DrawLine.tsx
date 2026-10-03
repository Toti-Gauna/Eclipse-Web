'use client';

import { useRef } from 'react';
import { gsap, useGSAP, type ScrollTrigger } from './gsap';
import { prefersReducedMotion } from './useReducedMotion';

export type DrawAxis = 'x' | 'y';
export type DrawOrigin = 'start' | 'center' | 'end';

const ORIGIN: Record<DrawAxis, Record<DrawOrigin, string>> = {
  x: { start: '0% 50%', center: '50% 50%', end: '100% 50%' },
  y: { start: '50% 0%', center: '50% 50%', end: '50% 100%' },
};

/**
 * Motion signature #4 — "Drawing": a 1px hairline that draws itself in
 * (scaleX / scaleY from 0) the first time it enters the viewport.
 *
 *   <DrawLine />                                   horizontal, full width, left → right
 *   <DrawLine axis="y" className="h-24" />          vertical, top → bottom
 *   <DrawLine origin="center" className="w-40 bg-accent" delay={0.2} />
 *
 * The line is a decorative <span aria-hidden> styled by `.draw-line` (globals,
 * "v2 · motion signature"): 1px of `--line-strong`; size / color / position come
 * from `className`. Visible without JS; reduced motion → drawn immediately.
 */
export function DrawLine({
  axis = 'x',
  origin = 'start',
  className = '',
  start = 'top 92%',
  duration = 0.9,
  delay = 0,
  trigger,
}: {
  axis?: DrawAxis;
  origin?: DrawOrigin;
  className?: string;
  /** ScrollTrigger start (of `trigger`, or of the line itself). */
  start?: string;
  duration?: number;
  delay?: number;
  /** Element (or selector) whose entrance draws the line. Default: the line. */
  trigger?: string | Element | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      drawIn(el, { axis, origin, duration, delay, scrollTrigger: { trigger: trigger ?? el, start, once: true } });
    },
    { scope: ref, dependencies: [axis, origin, start, duration, delay, trigger] },
  );

  return <span ref={ref} aria-hidden data-draw={axis} className={`draw-line ${className}`} />;
}

/**
 * Draws any element in (scaleX / scaleY 0 → 1). For timelines and lists:
 *   tl.add(drawIn(rule, { axis: 'x' }), 0.2)
 * Returns the tween (paused if you pass `paused: true`). Reduced motion is the
 * caller's call.
 */
export function drawIn(
  el: gsap.TweenTarget,
  {
    axis = 'x',
    origin = 'start',
    duration = 0.9,
    delay = 0,
    ease = 'expo.out',
    scrollTrigger,
    paused,
  }: {
    axis?: DrawAxis;
    origin?: DrawOrigin;
    duration?: number;
    delay?: number;
    ease?: string;
    scrollTrigger?: ScrollTrigger.Vars;
    paused?: boolean;
  } = {},
): gsap.core.Tween {
  const prop = axis === 'x' ? 'scaleX' : 'scaleY';
  return gsap.fromTo(
    el,
    { [prop]: 0, transformOrigin: ORIGIN[axis][origin] },
    { [prop]: 1, duration, delay, ease, paused, scrollTrigger, clearProps: 'transform,transformOrigin' },
  );
}
