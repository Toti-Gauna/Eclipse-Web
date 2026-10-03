'use client';

import { useEffect, type RefObject } from 'react';
import { gsap } from '@/components/motion/gsap';

/** Taps on these never trigger the iOS motion-permission prompt (even over the eclipse). */
const INTERACTIVE = 'a, button, input, select, textarea, summary, label, [role="button"], [role="region"], [data-hero-reveal]';

/** Max travel in px for the nearest star layer (depth 1). */
const AMP = { x: 26, y: 18 };
/** The eclipse drifts a little the other way, so the sky gets depth. */
const ECLIPSE_DEPTH = -0.14;

type PermissionedOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/**
 * Star parallax: pointer on desktop, device orientation on touch devices.
 * - rAF-throttled, eased, depth-weighted transforms on [data-star-layer] (gsap
 *   quickSetter, so it composes with the scroll/entrance tweens on other props).
 * - Android & others: listens to `deviceorientation` directly when available.
 * - iOS 13+: asks for permission only after a tap on the eclipse itself
 *   (never on the copy, chips, CTAs or the demo).
 * - Idle while the hero is off-screen. The caller disables it with reduced motion.
 */
export function useStarParallax(stageRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const stage = stageRef.current;
    const section = stage?.closest<HTMLElement>('[data-hero]');
    if (!enabled || !stage || !section) return;

    const targets = [
      ...Array.from(stage.querySelectorAll<SVGElement>('[data-star-layer]')).map((el) => ({
        el,
        depth: Number(el.getAttribute('data-star-layer')) || 0.5,
      })),
      ...Array.from(stage.querySelectorAll<HTMLElement>('[data-hero-eclipse-motion]')).map((el) => ({ el, depth: ECLIPSE_DEPTH })),
    ].map(({ el, depth }) => ({
      depth,
      setX: gsap.quickSetter(el, 'x', 'px') as (v: number) => void,
      setY: gsap.quickSetter(el, 'y', 'px') as (v: number) => void,
    }));

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;
    let inView = true;
    let disposed = false;

    const tick = () => {
      current.x += (target.x - current.x) * 0.075;
      current.y += (target.y - current.y) * 0.075;
      for (const t of targets) {
        t.setX(current.x * AMP.x * t.depth);
        t.setY(current.y * AMP.y * t.depth);
      }
      const settled = Math.abs(target.x - current.x) < 0.0005 && Math.abs(target.y - current.y) < 0.0005;
      raf = settled || !inView ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && inView) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      inView = entry.isIntersecting;
      if (inView) kick();
    });
    io.observe(section);

    const cleanups: Array<() => void> = [() => io.disconnect(), () => cancelAnimationFrame(raf)];

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (finePointer) {
      const onMove = (e: PointerEvent) => {
        if (!inView || e.pointerType !== 'mouse') return;
        target.x = clamp((e.clientX / window.innerWidth) * 2 - 1);
        target.y = clamp((e.clientY / window.innerHeight) * 2 - 1);
        kick();
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => window.removeEventListener('pointermove', onMove));
    } else if (typeof window.DeviceOrientationEvent !== 'undefined') {
      let base: { beta: number; gamma: number } | null = null;
      const onOrient = (e: DeviceOrientationEvent) => {
        if (e.beta == null || e.gamma == null || !inView) return;
        const angle = window.screen.orientation?.angle ?? 0;
        // Map to screen axes in landscape.
        const tiltX = angle === 90 ? e.beta : angle === 270 || angle === -90 ? -e.beta : e.gamma;
        const tiltY = angle === 90 ? -e.gamma : angle === 270 || angle === -90 ? e.gamma : e.beta;
        if (!base) base = { beta: tiltY, gamma: tiltX };
        // Slowly re-center around how the visitor holds the phone.
        base.gamma += (tiltX - base.gamma) * 0.01;
        base.beta += (tiltY - base.beta) * 0.01;
        target.x = clamp((tiltX - base.gamma) / 18);
        target.y = clamp((tiltY - base.beta) / 18);
        kick();
      };
      const listen = () => {
        if (disposed) return;
        window.addEventListener('deviceorientation', onOrient);
        cleanups.push(() => window.removeEventListener('deviceorientation', onOrient));
      };

      const DOE = window.DeviceOrientationEvent as PermissionedOrientation;
      if (typeof DOE.requestPermission === 'function') {
        // Only a tap on the eclipse itself asks (never the copy, chips or CTAs).
        const visual = stage.querySelector<HTMLElement>('[data-hero-eclipse-anchor]');
        const onTap = (e: MouseEvent) => {
          const el = e.target as Element | null;
          if (!el || !visual || el.closest(INTERACTIVE)) return;
          const r = visual.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
          section.removeEventListener('click', onTap);
          DOE.requestPermission?.()
            .then((state) => {
              if (state === 'granted') listen();
            })
            .catch(() => {
              // Denied or unavailable: the stars simply stay still.
            });
        };
        section.addEventListener('click', onTap);
        cleanups.push(() => section.removeEventListener('click', onTap));
      } else {
        listen();
      }
    }

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      for (const t of targets) {
        t.setX(0);
        t.setY(0);
      }
    };
  }, [stageRef, enabled]);
}
