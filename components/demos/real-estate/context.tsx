'use client';

import { createContext, useContext } from 'react';
import type { EstateState, EstateStore, EstateView } from './story';

export type EstateTab = 'today' | 'inbox' | 'pipeline' | 'visits' | 'followups' | 'listings' | 'site';

export interface EstateCtx {
  screen: 'phone' | 'laptop';
  paired: boolean;
  store: EstateStore;
  state: EstateState;
  view: EstateView;
  t: number;
  loop: number;
  reduced: boolean;
  active: boolean;
  /** A beat is playing. */
  playing: boolean;
  /**
   * True while a story change at `at` is "just now" (toasts, halos): only while a beat plays
   * and only for what happened inside it — never at rest, never for the visitor's own actions.
   */
  recent: (at: number | null | undefined, ms?: number) => boolean;
  /** This instance announces live changes (one per laptop + phone pair). */
  announce: boolean;
  business: string;
  /** The vertical's key number (content/verticals.json): 100 % answered in under a minute. */
  keyNumber: number;
  keySuffix: string;
  go: (tab: EstateTab) => void;
  /** Opens the visits calendar on a day (e.g. after booking on the site). */
  seeVisits: (day: number) => void;
  /** The day the visits calendar opens on. */
  visitsDay: number;
  /** Phone: open the buyer's phone view (site + chat). */
  openBuyer: () => void;
  /** Switch the 24/7 assistant on/off (the story restarts at 23:40 with the new setting). */
  toggleBot: () => void;
}

const Ctx = createContext<EstateCtx | null>(null);
export const EstateProvider = Ctx.Provider;

export function useEstate(): EstateCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEstate outside <EstateProvider>');
  return ctx;
}
