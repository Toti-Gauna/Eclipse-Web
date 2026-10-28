'use client';

import type { ReactNode } from 'react';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { useSound } from '@/components/sound/SoundContext';
import { track } from '@/lib/analytics';

/**
 * «Quiero potenciar mi negocio»: a real link to the products banner right below (#productos,
 * 28/10/2026: the four products replace the rubro selector as the way in). <SmoothAnchors>
 * smooths the hop and moves focus there; without JS it is a plain anchor.
 */
export function HeroCta({ className, children }: { className?: string; children: ReactNode }) {
  const { play } = useSound();
  return (
    <a
      href={`#${SECTION_IDS.products}`}
      className={className}
      onClick={() => {
        play('glint');
        track('hero_cta_clicked', { target: 'products' });
      }}
    >
      {children}
    </a>
  );
}
