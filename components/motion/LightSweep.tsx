'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from './gsap';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Passes a diagonal amber light over its children once, when they enter the
 * viewport. Purely decorative overlay (aria-hidden), transform-only animation.
 */
export function LightSweep({ children, className = '' }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const beam = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!root.current || !beam.current || prefersReducedMotion()) return;
      gsap.fromTo(
        beam.current,
        { xPercent: -120, autoAlpha: 1 },
        {
          xPercent: 120,
          duration: 1.4,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: root.current, start: 'top 85%', once: true },
          onComplete: () => {
            gsap.set(beam.current, { autoAlpha: 0 });
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <span ref={root} className={`relative inline-block overflow-hidden align-top ${className}`}>
      {children}
      <span
        ref={beam}
        aria-hidden
        className="light-sweep-beam pointer-events-none absolute inset-y-0 -left-1/4 w-[150%] opacity-0"
      />
    </span>
  );
}
