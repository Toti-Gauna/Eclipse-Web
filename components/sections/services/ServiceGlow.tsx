'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/components/motion/gsap';

/**
 * Touch screens have no hover, so there the card crossing the middle of the
 * viewport lights up instead (sets `data-lit`; the glow itself is CSS).
 * Skipped with reduced motion: cards stay calm until focused.
 */
export function ServiceGlow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add('(hover: none) and (prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('[data-service-card]', root);
        cards.forEach((card) => {
          ScrollTrigger.create({
            trigger: card,
            start: 'top 58%',
            end: 'bottom 42%',
            onToggle: (self) => card.toggleAttribute('data-lit', self.isActive),
          });
        });
        return () => cards.forEach((card) => card.removeAttribute('data-lit'));
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
