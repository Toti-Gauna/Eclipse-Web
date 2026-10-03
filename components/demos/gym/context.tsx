'use client';

import { createContext, useContext, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { localeTags, type Locale } from '@/i18n/routing';
import { dayDate } from './data';
import type { GymStore, SimState, World } from './sim';

export type GymTab = 'home' | 'missions' | 'ranking' | 'panel' | 'retention' | 'members';

export interface GymCtx {
  screen: 'phone' | 'laptop';
  store: GymStore;
  state: SimState;
  world: World;
  business: string;
  keyNumber: number;
  ticketUsd: number;
  reduced: boolean;
  /** This instance announces live changes (only one per laptop+phone pair). */
  announce: boolean;
  /** Laptop and phone share state (the phone is shown next to the laptop). */
  paired: boolean;
  openTab: (tab: GymTab) => void;
}

const Ctx = createContext<GymCtx | null>(null);
export const GymProvider = Ctx.Provider;

export function useGym(): GymCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGym outside <GymProvider>');
  return ctx;
}

const upperFirst = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/** Locale-aware formatters for the demo's fixed, fictional week. */
export function useFmt() {
  const locale = useLocale() as Locale;
  return useMemo(() => {
    const tag = localeTags[locale] ?? 'es-AR';
    const time = new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit', hourCycle: locale === 'en' ? 'h12' : 'h23', timeZone: 'UTC' });
    const narrow = new Intl.DateTimeFormat(tag, { weekday: 'narrow', timeZone: 'UTC' });
    const weekday = new Intl.DateTimeFormat(tag, { weekday: 'long', timeZone: 'UTC' });
    const long = new Intl.DateTimeFormat(tag, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const monthShort = new Intl.DateTimeFormat(tag, { month: 'short', timeZone: 'UTC' });
    const monthLong = new Intl.DateTimeFormat(tag, { month: 'long', timeZone: 'UTC' });
    const num = new Intl.NumberFormat(tag);
    const pct = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0 });
    const delta = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' });
    const month = (m: number) => new Date(Date.UTC(2026, m, 1));
    return {
      locale,
      time: (minutes: number) => time.format(new Date(Date.UTC(2026, 9, 8, Math.floor(minutes / 60), minutes % 60))).replace(/^0(\d)/, '$1'),
      narrow: (day: number) => narrow.format(dayDate(day)).toLocaleUpperCase(),
      weekday: (day: number) => upperFirst(weekday.format(dayDate(day))),
      long: (day: number) => upperFirst(long.format(dayDate(day))),
      monthShort: (m: number) => upperFirst(monthShort.format(month(m)).replace(/\.$/, '')),
      monthLong: (m: number) => monthLong.format(month(m)),
      num: (n: number) => num.format(n),
      pct: (ratio: number) => pct.format(ratio),
      delta: (ratio: number) => delta.format(ratio).replace('-', '−'),
    };
  }, [locale]);
}
export type Fmt = ReturnType<typeof useFmt>;
