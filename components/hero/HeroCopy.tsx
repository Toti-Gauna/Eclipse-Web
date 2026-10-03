'use client';

import type { ReactNode } from 'react';
import { useHeroState } from './HeroState';

/**
 * The hero copy (server-rendered children). While the demo light covers it,
 * it is inert: out of the tab order and hidden from assistive tech.
 */
export function HeroCopy({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { phase } = useHeroState();
  // Interactive again as soon as the light starts to close (focus returns to the chip).
  const covered = phase === 'opening' || phase === 'open';
  return (
    <div data-hero-copy inert={covered} className={className}>
      {children}
    </div>
  );
}
