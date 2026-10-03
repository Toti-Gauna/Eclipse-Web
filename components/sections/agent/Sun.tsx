'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * The resolved eclipse: the moon is gone and the sun shines in full over --dawn.
 * While the section scrolls in, the sun blooms: disc, halo and rays open up
 * (scrubbed, transform + opacity only). Without JS or with reduced motion it is
 * simply the full sun.
 */
export function Sun({ className = '' }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || prefersReducedMotion()) return;
      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'center 42%', scrub: 0.8 },
      });
      tl.fromTo(q('[data-sun-disc]'), { scale: 0.88 }, { scale: 1, duration: 1 }, 0)
        .fromTo(q('[data-sun-halo]'), { scale: 0.62, autoAlpha: 0.3 }, { scale: 1, autoAlpha: 1, duration: 1 }, 0)
        .fromTo(q('[data-sun-rays]'), { scale: 0.8, rotate: -12, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.8 }, 0.2);
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className={`agent-sun ${className}`}>
      <div className="agent-sun-halo" data-sun-halo />
      <div className="agent-sun-rays" data-sun-rays />
      <div className="agent-sun-disc" data-sun-disc />
    </div>
  );
}
