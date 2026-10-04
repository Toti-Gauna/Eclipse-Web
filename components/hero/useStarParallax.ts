'use client';

import { useEffect, type RefObject } from 'react';
import { gsap } from '@/components/motion/gsap';

/** Max travel in px for the nearest star layer (depth 1). */
const AMP = { x: 26, y: 18 };
/** The eclipse drifts a little the other way, so the sky gets depth. */
const ECLIPSE_DEPTH = -0.14;
/** Only where there is a mouse to follow. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/**
 * Star parallax, mouse only: the stars and the eclipse follow the pointer a little.
 * - rAF-throttled, eased, depth-weighted transforms on [data-star-layer] (gsap
 *   quickSetter, so it composes with the scroll/entrance tweens on other props).
 * - While the loop runs, the moving layers get `will-change: transform` (a move is then
 *   a compositor update, never a repaint of the stars); it is dropped once the loop
 *   settles, so scrolling and rest don't carry three extra full-screen layers.
 * - The loop stops as soon as it settles, and while the hero is off-screen.
 * - Touch devices get no parallax (v3: no permanent decorative animation): the v2
 *   device-orientation version kept the loop running for as long as the phone was
 *   held, since the sensor never settles.
 * The caller disables it with reduced motion.
 */
export function useStarParallax(stageRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const stage = stageRef.current;
    const section = stage?.closest<HTMLElement>('[data-hero]');
    if (!enabled || !stage || !section || !window.matchMedia(FINE_POINTER).matches) return;

    const targets = [
      ...Array.from(stage.querySelectorAll<SVGElement>('[data-star-layer]')).map((el) => ({
        el,
        depth: Number(el.getAttribute('data-star-layer')) || 0.5,
      })),
      ...Array.from(stage.querySelectorAll<HTMLElement>('[data-hero-eclipse-motion]')).map((el) => ({ el, depth: ECLIPSE_DEPTH })),
    ].map(({ el, depth }) => ({
      el,
      depth,
      setX: gsap.quickSetter(el, 'x', 'px') as (v: number) => void,
      setY: gsap.quickSetter(el, 'y', 'px') as (v: number) => void,
    }));
    let layered = false;
    const layer = (on: boolean) => {
      if (on === layered) return;
      layered = on;
      for (const t of targets) t.el.style.willChange = on ? 'transform' : '';
    };

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;
    let inView = true;

    const tick = () => {
      current.x += (target.x - current.x) * 0.075;
      current.y += (target.y - current.y) * 0.075;
      for (const t of targets) {
        t.setX(current.x * AMP.x * t.depth);
        t.setY(current.y * AMP.y * t.depth);
      }
      const settled = Math.abs(target.x - current.x) < 0.0005 && Math.abs(target.y - current.y) < 0.0005;
      raf = settled || !inView ? 0 : requestAnimationFrame(tick);
      if (!raf) layer(false);
    };
    const kick = () => {
      if (raf || !inView) return;
      layer(true);
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      inView = entry.isIntersecting;
      // Back on screen with a move still pending: finish it.
      if (inView && (Math.abs(target.x - current.x) > 0.0005 || Math.abs(target.y - current.y) > 0.0005)) kick();
    });
    io.observe(section);

    const onMove = (e: PointerEvent) => {
      if (!inView || e.pointerType !== 'mouse') return;
      target.x = clamp((e.clientX / window.innerWidth) * 2 - 1);
      target.y = clamp((e.clientY / window.innerHeight) * 2 - 1);
      kick();
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      layer(false);
      for (const t of targets) {
        t.setX(0);
        t.setY(0);
      }
    };
  }, [stageRef, enabled]);
}
