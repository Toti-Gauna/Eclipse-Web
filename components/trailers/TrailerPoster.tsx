'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Play, VolumeX } from 'lucide-react';
import { l, type DemoId, type Vertical } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { TRAILER_DURATION } from './constants';
import { SceneProblem, TrailerHudContent } from './scenes';

/**
 * Static first frame of a vertical trailer (the problem, typeset), with the same
 * footprint as <TrailerPlayer>. Server-rendered and shown until the trailer chunk
 * loads, so the card never jumps and never looks empty.
 */
export function TrailerPoster({ vertical, copyKey, className = '' }: { vertical: Vertical; copyKey: DemoId; className?: string }) {
  const t = useTranslations('trailers');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  return (
    <div className={`trl ${className}`}>
      <div aria-hidden className="trl-stage grain">
        <SceneProblem kicker={l(vertical.name, locale)} line1={t(`${copyKey}.problem1`)} line2={t(`${copyKey}.problem2`)} isStatic />
        <div className="trl-vignette" />
      </div>
      <div aria-hidden className="trl-hud">
        <div className="trl-hud-start">
          <TrailerHudContent demoLabel={tc('demo')} business={vertical.business ?? ''} />
        </div>
        <span className="trl-hud-meta">
          <VolumeX className="size-3.5" strokeWidth={1.5} />
          <span>{t('player.muted')}</span>
          <span className="trl-hud-dot" />
          <span className="tabular">{t('player.length', { seconds: TRAILER_DURATION })}</span>
        </span>
      </div>
      <div aria-hidden className="trl-controls">
        <span className="trl-btn trl-btn--ghost">
          <Play className="size-4 translate-x-px" fill="currentColor" strokeWidth={1.2} />
        </span>
        <span className="trl-progress" />
      </div>
    </div>
  );
}
