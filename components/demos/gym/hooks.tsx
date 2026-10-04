'use client';

import { createContext, useContext, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { upperFirst, useDemoFormat } from '../kit';
import { dayDate, sessionById, type ClassKind, type CoachId, type MemberId, type OwnerTab } from './model';
import type { GymEvent, GymState, GymStore, GymView, MemberTab, PhoneOverlay } from './story';

export type { OwnerTab };

export interface GymCtx {
  screen: 'phone' | 'laptop';
  paired: boolean;
  store: GymStore;
  state: GymState;
  view: GymView;
  t: number;
  loop: number;
  reduced: boolean;
  active: boolean;
  /** This instance announces changes (one per laptop + phone pair). */
  announce: boolean;
  business: string;
  /** The rubro's key number (content/verticals.json): −25 % churn. */
  keyNumber: { value: number; prefix: string; suffix: string };
  /** The site's chat widget: open, or minimized to its launcher (the visitor's choice; a beat reopens it). */
  siteChat: { open: boolean; setOpen: (open: boolean) => void };
  /** Owner side: open a section. */
  go: (tab: OwnerTab) => void;
  /** Member app (phone): where the visitor is. Nothing navigates on its own. */
  member: {
    tab: MemberTab;
    overlay: PhoneOverlay | null;
    open: (tab: MemberTab) => void;
    openOverlay: (o: PhoneOverlay) => void;
    closeOverlay: () => void;
  };
  /** Phone alone: switch between the member app and the owner's panel. */
  setMode?: (mode: 'member' | 'owner') => void;
  /** A visitor action: update the store (stamped with the frozen story time) and play a sound. */
  run: (fn: Parameters<GymStore['update']>[0], sound?: 'select' | 'toggle' | 'success' | 'open' | 'close') => void;
  /** The visitor's latest action, for a short local toast + announcement (cleared by a timer it started). */
  flash: GymEvent | null;
}

const Ctx = createContext<GymCtx | null>(null);
export const GymProvider = Ctx.Provider;

export function useGym(): GymCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGym outside <GymProvider>');
  return ctx;
}

/** Names, classes and dates in the current locale (stable per locale). */
export function useGymText() {
  const t = useTranslations('demoGym');
  const fmt = useDemoFormat();
  return useMemo(() => {
    const name = (id: MemberId) => t(`people.${id}.name`);
    const short = (id: MemberId) => t(`people.${id}.short`);
    const kind = (k: ClassKind) => t(`classes.${k}`);
    const coach = (c: CoachId) => t(`coaches.${c}`);
    const dayShort = (d: number) => upperFirst(fmt.date(dayDate(d), { weekday: 'short' }).replace('.', ''));
    const dayNum = (d: number) => fmt.date(dayDate(d), { day: 'numeric' });
    const dayLong = (d: number) => upperFirst(fmt.date(dayDate(d), { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', ''));
    /** "Tue 7:00 · Functional" */
    const session = (id: string | undefined, withKind = true) => {
      const s = id ? sessionById(id) : undefined;
      if (!s) return '';
      const when = `${dayShort(s.day)} ${fmt.time(s.start)}`;
      return withKind ? `${when} · ${kind(s.kind)}` : when;
    };
    return { t, fmt, name, short, kind, coach, dayShort, dayNum, dayLong, session };
  }, [t, fmt]);
}
