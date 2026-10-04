'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Globe } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useSound } from '@/components/sound/SoundContext';
import { SoundBadge } from '@/components/sound/SoundToggle';
import { PrefsPanel } from './PrefsPanel';
import './prefs.css';

/**
 * Language, currency and sound folded into one row (phone menu, footer): the summary
 * shows what is set now ("ES · ARS", an equalizer while sound is on); opening it shows
 * the full <PrefsPanel> — every option, the rate used, its source and date, the "≈"
 * rule and the effects / music switches. Native <details>, uncontrolled.
 */
export function PrefsDisclosure({ layout = 'stack', className = '' }: { layout?: 'stack' | 'band'; className?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const { currency } = useCurrency();
  const { enabled, music, play } = useSound();

  return (
    <details className={`prefs-disclosure ${className}`} onToggle={(e) => play(e.currentTarget.open ? 'open' : 'close')}>
      <summary className="prefs-summary">
        <Globe aria-hidden className="size-4 shrink-0 text-fg-muted" strokeWidth={1.5} />
        <span className="prefs-summary-title">{t('prefs.title')}</span>
        <span className="prefs-summary-readout">
          <span className="sr-only">: </span>
          {locale.toUpperCase()}
          <span aria-hidden className="mx-1.5">
            ·
          </span>
          {currency}
        </span>
        <SoundBadge inline />
        {enabled || music ? <span className="sr-only"> · {t('header.soundOn')}</span> : null}
        <ChevronDown aria-hidden className="prefs-summary-chevron size-4" strokeWidth={1.5} />
      </summary>
      <div className="prefs-disclosure-body">
        <PrefsPanel layout={layout} />
      </div>
    </details>
  );
}
