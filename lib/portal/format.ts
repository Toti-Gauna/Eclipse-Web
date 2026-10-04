import { localeTags, type Locale } from '@/i18n/routing';
import type { IsoDate } from './types';

const formatters = new Map<Locale, Intl.DateTimeFormat>();

function formatter(locale: Locale): Intl.DateTimeFormat {
  let fmt = formatters.get(locale);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(localeTags[locale], { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    formatters.set(locale, fmt);
  }
  return fmt;
}

/**
 * A calendar date as a mono readout, the same shape in every locale: "02 oct 2026",
 * "02 Oct 2026", "02 out 2026" (month names from Intl, trailing dot dropped). Read as UTC,
 * so server and browser always agree.
 */
export function formatDate(iso: IsoDate, locale: Locale): string {
  const parts = formatter(locale).formatToParts(new Date(`${iso}T00:00:00Z`));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('day')} ${part('month').replace(/\.$/, '')} ${part('year')}`;
}
