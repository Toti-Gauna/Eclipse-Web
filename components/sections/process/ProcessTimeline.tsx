'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/components/motion/gsap';

/** Viewport line (from the top) where the light front sits on the vertical layout. */
const LIGHT_LINE = '58%';

/**
 * Drives the "light" of the process timeline (markup is server-rendered inside).
 * - ≥1024px: one scrubbed timeline fills the horizontal segments left → right.
 * - <1024px: each vertical segment fills while the LIGHT_LINE of the viewport
 *   passes over it, so the light front follows the reader's eye.
 * A spark rides the light front, and a step ignites (`data-lit`) when the light
 * reaches its node. Everything is transform/opacity.
 * Without JS or with reduced motion nothing is armed: the whole line is lit.
 */
export function ProcessTimeline({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const spark = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      const head = spark.current;
      if (!root || !head) return;
      const steps = gsap.utils.toArray<HTMLElement>('[data-step]', root);
      const fills = gsap.utils.toArray<HTMLElement>('[data-fill]', root);
      const nodes = steps.map((step) => step.querySelector<HTMLElement>('[data-node]') ?? step);
      const list = root.querySelector('ol') ?? root;
      if (steps.length < 2) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      // Node centers relative to the wrapper, from offsets (immune to the Reveal transforms).
      const center = (el: HTMLElement) => {
        let x = el.offsetWidth / 2;
        let y = el.offsetHeight / 2;
        let n: HTMLElement | null = el;
        while (n && n !== root) {
          x += n.offsetLeft;
          y += n.offsetTop;
          n = n.offsetParent as HTMLElement | null;
        }
        return { x, y };
      };

      const light = (step: HTMLElement, on: boolean) => {
        if (step.hasAttribute('data-lit') !== on) step.toggleAttribute('data-lit', on);
      };

      const mm = gsap.matchMedia();
      // `narrow` is listed so the callback also runs below 1024px (it only fires when a condition matches).
      const conditions = {
        wide: '(min-width: 1024px)',
        narrow: '(max-width: 1023.98px)',
        reduce: '(prefers-reduced-motion: reduce)',
      };
      mm.add(conditions, (ctx) => {
        const { wide, reduce } = ctx.conditions as Record<keyof typeof conditions, boolean>;
        if (reduce) return;
        root.setAttribute('data-armed', '');
        gsap.set(head, { autoAlpha: 0 });

        if (wide) {
          const span = steps.length - 1;
          gsap.set(fills, { scaleX: 0, scaleY: 1 });
          const tl = gsap.timeline({
            defaults: { ease: 'none', duration: 1 },
            scrollTrigger: { trigger: list, start: 'top 72%', end: 'top 22%', scrub: 0.6, invalidateOnRefresh: true },
            onUpdate: () => {
              const time = tl.time();
              steps.forEach((step, i) => light(step, i === 0 ? time > 0.001 : time >= i - 0.04));
            },
          });
          fills.forEach((fill) => tl.to(fill, { scaleX: 1 }));
          tl.fromTo(
            head,
            { x: () => center(first).x, y: () => center(first).y },
            { x: () => center(last).x, y: () => center(last).y, duration: span },
            0,
          )
            .to(head, { autoAlpha: 1, duration: 0.12 }, 0)
            .to(head, { autoAlpha: 0, duration: 0.12 }, span - 0.12);
        } else {
          gsap.set(fills, { scaleY: 0, scaleX: 1 });
          fills.forEach((fill) => {
            gsap.to(fill, {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: fill.parentElement ?? fill,
                start: `top ${LIGHT_LINE}`,
                end: `bottom ${LIGHT_LINE}`,
                scrub: true,
              },
            });
          });
          steps.forEach((step, i) => {
            ScrollTrigger.create({
              trigger: nodes[i],
              start: `center ${LIGHT_LINE}`,
              onEnter: () => light(step, true),
              onLeaveBack: () => light(step, false),
            });
          });
          gsap.fromTo(
            head,
            { x: () => center(first).x, y: () => center(first).y },
            {
              x: () => center(last).x,
              y: () => center(last).y,
              ease: 'none',
              scrollTrigger: {
                trigger: first,
                endTrigger: last,
                start: `center ${LIGHT_LINE}`,
                end: `center ${LIGHT_LINE}`,
                scrub: true,
                invalidateOnRefresh: true,
                onToggle: (self) => gsap.to(head, { autoAlpha: self.isActive ? 1 : 0, duration: 0.3, overwrite: 'auto' }),
              },
            },
          );
        }

        return () => {
          root.removeAttribute('data-armed');
          steps.forEach((step) => step.removeAttribute('data-lit'));
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}
      <span ref={spark} aria-hidden className="proc-spark" />
    </div>
  );
}
