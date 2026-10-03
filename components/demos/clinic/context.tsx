'use client';

import { createContext, useContext, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { localeTags, type Locale } from '@/i18n/routing';
import { dayDate, parseSlotKey, TIMES } from './data';
import type { Agenda, ChatView, ClinicStore, Kpis, SimState } from './sim';

export interface ClinicCtx {
  screen: 'phone' | 'laptop';
  store: ClinicStore;
  state: SimState;
  chat: ChatView;
  agenda: Agenda;
  kpis: Kpis;
  business: string;
  keyNumber: number;
  ticketUsd: number;
  reduced: boolean;
  /** This instance announces live changes (only one per laptop+phone pair). */
  announce: boolean;
  /** Laptop and phone share state (the phone is shown next to the laptop). */
  paired: boolean;
}

const Ctx = createContext<ClinicCtx | null>(null);
export const ClinicProvider = Ctx.Provider;

export function useClinic(): ClinicCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useClinic outside <ClinicProvider>');
  return ctx;
}

const upperFirst = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/** Locale-aware formatters for the demo's fixed, fictional week. */
export function useFmt() {
  const locale = useLocale() as Locale;
  return useMemo(() => {
    const tag = localeTags[locale] ?? 'es-AR';
    const time = new Intl.DateTimeFormat(tag, {
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: locale === 'en' ? 'h12' : 'h23',
      timeZone: 'UTC',
    });
    const weekday = new Intl.DateTimeFormat(tag, { weekday: 'short', timeZone: 'UTC' });
    const long = new Intl.DateTimeFormat(tag, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const num = new Intl.NumberFormat(tag);
    const pct = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' });
    const fmt = {
      locale,
      time: (minutes: number) =>
        time.format(new Date(Date.UTC(2026, 9, 8, Math.floor(minutes / 60), minutes % 60))).replace(/^0(\d)/, '$1'),
      weekday: (day: number) => weekday.format(dayDate(day)).replace(/\.$/, ''),
      dayNum: (day: number) => num.format(dayDate(day).getUTCDate()),
      long: (day: number) => upperFirst(long.format(dayDate(day))),
      shortDay: (day: number) => `${upperFirst(weekday.format(dayDate(day)).replace(/\.$/, ''))} ${dayDate(day).getUTCDate()}`,
      slot: (key: string) => {
        const { day, idx } = parseSlotKey(key);
        return `${fmt.shortDay(day)} · ${fmt.time(TIMES[idx])}`;
      },
      num: (n: number) => num.format(n),
      pct: (ratio: number) => pct.format(ratio).replace('-', '−'),
    };
    return fmt;
  }, [locale]);
}
export type Fmt = ReturnType<typeof useFmt>;
