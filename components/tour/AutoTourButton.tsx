'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Play, X } from 'lucide-react';
import { getTourState, resumeTour, stop, subscribeTour } from './autoTour';
import './auto-tour.css';

/**
 * «Seguir con el tour automático»: floats at the bottom centre whenever the visitor has taken over a running tour.
 * Pressing it hands the scroll back to the tour; the small × ends it. It leaves the tab order while hidden.
 */
export function AutoTourButton() {
  const t = useTranslations('autoTour');
  const state = useSyncExternalStore(subscribeTour, getTourState, () => 'idle' as const);
  const shown = state === 'paused';
  return (
    <div className="atb" data-tour-ui data-shown={shown || undefined} inert={!shown}>
      <button type="button" className="atb-main" onClick={resumeTour}>
        <Play aria-hidden className="size-4" strokeWidth={1.6} />
        {t('resume')}
      </button>
      <button type="button" className="atb-close" onClick={stop} aria-label={t('stop')}>
        <X aria-hidden className="size-4" strokeWidth={1.6} />
      </button>
    </div>
  );
}
