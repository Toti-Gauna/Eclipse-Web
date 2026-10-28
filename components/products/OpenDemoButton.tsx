'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { openDemoExperience, openerKey, preloadDemoExperience } from '@/components/demo-experience/store';
import { useSound } from '@/components/sound/SoundContext';
import { verticalById, type VerticalId } from '@/lib/content';

/**
 * «Ver la demo» on a product's page: opens that rubro's demo in the "Ver demo" layer (the page
 * mounts <DemoExperienceHost>), straight away — on Roofy's page there is no rubro to choose.
 * The control is the layer's opener: focus comes back to it on close.
 */
export function OpenDemoButton({ vertical, className, label, children }: { vertical: VerticalId; className?: string; label?: string; children: ReactNode }) {
  const locale = useLocale();
  const { play } = useSound();
  const v = verticalById(vertical);
  const demo = v?.demo;
  if (!v || !demo) return null;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={label}
      data-demo-opener={openerKey('product', demo)}
      onPointerEnter={() => preloadDemoExperience(demo, locale)}
      onFocus={() => preloadDemoExperience(demo, locale)}
      onClick={(e) => {
        play('open');
        openDemoExperience({ vertical: v.id, demo, origin: 'product' }, e.currentTarget);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
