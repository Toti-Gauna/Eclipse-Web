'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * The page's last phase: the eclipse is over and the sun rises behind the
 * giant title. Scrubbed while the block scrolls in (transform + opacity only):
 * the sun climbs from behind the horizon, its halo opens, the rays turn into
 * place and the horizon (a ruled hairline) draws. Everything under the horizon
 * is clipped, so the sun really comes up from behind it. Without JS or with
 * reduced motion it is simply the risen sun.
 */
export function Dawn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top 92%', end: 'bottom 55%', scrub: 0.8 },
      });
      tl.fromTo(q('[data-dawn-sun]'), { yPercent: 70 }, { yPercent: 0, duration: 1, ease: 'power1.out' }, 0)
        .fromTo(q('[data-dawn-halo]'), { autoAlpha: 0.2, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 1 }, 0)
        .fromTo(q('[data-dawn-rays]'), { rotate: -16, autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, duration: 0.75 }, 0.25)
        .fromTo(q('[data-dawn-horizon]'), { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: 'power2.out' }, 0);
    },
    { scope: root },
  );

  return (
    <div ref={root} className={`agent-dawn ${className}`}>
      <div aria-hidden className="agent-dawn-sky">
        <div data-dawn-sun className="agent-dawn-sun">
          <div data-dawn-halo className="agent-sun-halo" />
          <div data-dawn-rays className="agent-sun-rays" />
          <div className="agent-sun-disc" />
        </div>
      </div>
      <div className="agent-dawn-type">{children}</div>
      <span aria-hidden data-dawn-horizon className="agent-horizon" />
    </div>
  );
}
