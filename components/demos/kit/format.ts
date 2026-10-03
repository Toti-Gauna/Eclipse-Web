'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { localeTags, type Locale } from '@/i18n/routing';

/**
 * Locale-aware formatters for demo screens (es-AR / en / pt-BR). Times are
 * "minutes from midnight" on a fixed fictional day, so nothing depends on the
 * visitor's clock or time zone.
 */
export function useDemoFormat() {
  const locale = useLocale() as Locale;
  return useMemo(() => {
    const tag = localeTags[locale] ?? 'es-AR';
    const hm = new Intl.DateTimeFormat(tag, {
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: locale === 'en' ? 'h12' : 'h23',
      timeZone: 'UTC',
    });
    const num = new Intl.NumberFormat(tag);
    const pct = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0 });
    const signedPct = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' });
    const signed = new Intl.NumberFormat(tag, { signDisplay: 'exceptZero' });
    const dates = new Map<string, Intl.DateTimeFormat>();
    return {
      locale,
      tag,
      /** Minutes from midnight → "9:30" (es/pt) or "9:30 AM" (en). */
      time: (minutes: number) =>
        hm.format(new Date(Date.UTC(2026, 0, 5, Math.floor(minutes / 60), Math.round(minutes % 60)))).replace(/^0(\d)/, '$1'),
      /** Compact time for narrow gutters: "9:30" (es/pt) · "9 AM" / "9:30" (en). */
      gutter: (minutes: number) => {
        if (locale !== 'en') return hm.format(new Date(Date.UTC(2026, 0, 5, Math.floor(minutes / 60), minutes % 60))).replace(/^0(\d)/, '$1');
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const h12 = ((h + 11) % 12) + 1;
        return m ? `${h12}:${String(m).padStart(2, '0')}` : `${h12} ${h < 12 ? 'AM' : 'PM'}`;
      },
      /** Milliseconds → "0:23", "12:05" (call timers). */
      duration: (ms: number) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      },
      num: (n: number) => num.format(n),
      /** 0.42 → "42 %" (locale spacing). */
      pct: (ratio: number) => pct.format(ratio),
      /** −0.8 → "−80 %", typographic minus. */
      signedPct: (ratio: number) => signedPct.format(ratio).replace('-', '−'),
      /** 3 → "+3", −2 → "−2". */
      signed: (n: number) => signed.format(n).replace('-', '−'),
      /** A UTC date with the given Intl options (cached per option set). */
      date: (d: Date, options: Intl.DateTimeFormatOptions) => {
        const key = JSON.stringify(options);
        let f = dates.get(key);
        if (!f) {
          f = new Intl.DateTimeFormat(tag, { timeZone: 'UTC', ...options });
          dates.set(key, f);
        }
        return f.format(d);
      },
    };
  }, [locale]);
}

export type DemoFormat = ReturnType<typeof useDemoFormat>;

/** "lunes" → "Lunes" (es/pt weekdays and months are lowercase). */
export const upperFirst = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
