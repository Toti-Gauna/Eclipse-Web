'use client';

import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { useNow } from './useNow';

/**
 * Subtle "Termina en 2 d 5 h" for offers with an `endsAt`. Updates once per
 * minute (not a live region: it would be noisy), renders nothing on the server
 * and nothing once the deadline has passed.
 */
export function OfferCountdown({ endsAt, className = '' }: { endsAt: string | null | undefined; className?: string }) {
  const t = useTranslations('pricing.offers');
  const now = useNow();
  if (!endsAt || now === null) return null;
  const ms = Date.parse(endsAt) - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;

  const totalMinutes = Math.ceil(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const time = days > 0 ? t('days', { days, hours }) : hours > 0 ? t('hours', { hours, minutes }) : t('minutes', { minutes });

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-fg-muted tabular ${className}`}>
      <Clock aria-hidden className="size-3.5 shrink-0" strokeWidth={1.5} />
      <time dateTime={endsAt}>{t('endsIn', { time })}</time>
    </span>
  );
}
