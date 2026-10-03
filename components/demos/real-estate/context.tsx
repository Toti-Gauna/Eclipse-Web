'use client';

import { createContext, useContext, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { localeTags, type Locale } from '@/i18n/routing';
import { dayDate, type Op, type VisitSlot } from './data';
import type { ChatView, EstateStore, Kpis, LeadView, SimState } from './sim';
import type { ListingId } from './data';

export interface EstateCtx {
  screen: 'phone' | 'laptop';
  store: EstateStore;
  state: SimState;
  chat: ChatView;
  live: LeadView | null;
  leads: LeadView[];
  kpis: Kpis;
  business: string;
  /** The vertical's key number (content/verticals.json), e.g. 100 (%). */
  keyNumber: number;
  keySuffix: string;
  reduced: boolean;
  /** This instance announces live changes (only one per laptop+phone pair). */
  announce: boolean;
  /** Laptop and phone share state (the phone is shown next to the laptop). */
  paired: boolean;
  /** Listing to reveal when the listings view opens (from the chat's "see listing"). */
  focus: ListingId | null;
  openListing: (id: ListingId) => void;
  openTab: (tab: 'inbox' | 'listings' | 'leads') => void;
}

const Ctx = createContext<EstateCtx | null>(null);
export const EstateProvider = Ctx.Provider;

export function useEstate(): EstateCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEstate outside <EstateProvider>');
  return ctx;
}

const upperFirst = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/** Locale-aware formatters for the demo's fixed, fictional weekend. */
export function useFmt() {
  const locale = useLocale() as Locale;
  const t = useTranslations('demoRealEstate');
  return useMemo(() => {
    const tag = localeTags[locale] ?? 'es-AR';
    const time = new Intl.DateTimeFormat(tag, {
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: locale === 'en' ? 'h12' : 'h23',
      timeZone: 'UTC',
    });
    const weekday = new Intl.DateTimeFormat(tag, { weekday: 'short', timeZone: 'UTC' });
    const weekdayLong = new Intl.DateTimeFormat(tag, { weekday: 'long', timeZone: 'UTC' });
    const long = new Intl.DateTimeFormat(tag, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const num = new Intl.NumberFormat(tag);
    const short = (d: number) => upperFirst(weekday.format(dayDate(d)).replace(/\.$/, '').replace(/-feira$/, ''));
    const fmt = {
      locale,
      num: (n: number) => num.format(n),
      time: (minutes: number) => time.format(dayDate(0, minutes)).replace(/^0(\d)/, '$1'),
      long: (d: number) => upperFirst(long.format(dayDate(d))),
      /** "Sáb 23:40" (or just the time today). */
      when: (d: number, minutes: number) => (d === 0 ? fmt.time(minutes) : `${short(d)} ${fmt.time(minutes)}`),
      /** "Lun 12 · 18:30" */
      slot: (s: VisitSlot) => `${short(s.day)} ${dayDate(s.day).getUTCDate()} · ${fmt.time(s.minutes)}`,
      /** "lunes 12, 18:30" (inside sentences) */
      slotLong: (s: VisitSlot) =>
        t('slotLong', { day: weekdayLong.format(dayDate(s.day)), date: dayDate(s.day).getUTCDate(), time: fmt.time(s.minutes) }),
      /** "USD 138.000" or "USD 650/mes" */
      price: (op: Op, amount: number) => t(op === 'rent' ? 'listing.rent' : 'listing.price', { amount: num.format(amount) }),
    };
    return fmt;
  }, [locale, t]);
}
export type Fmt = ReturnType<typeof useFmt>;
