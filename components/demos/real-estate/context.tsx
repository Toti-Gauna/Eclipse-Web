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
  /** This instance announces live changes and plays sounds (one per laptop + phone pair). */
  announce: boolean;
  business: string;
  /** The vertical's key number (content/verticals.json): 100 % answered in under a minute. */
  keyNumber: number;
  keySuffix: string;
  go: (tab: EstateTab) => void;
  /** Phone: open the buyer's phone view (site + chat + WhatsApp). */
  openBuyer: () => void;
  /** Switch the 24/7 assistant on/off (restarts the story at 23:40). */
  toggleBot: () => void;
}

const Ctx = createContext<EstateCtx | null>(null);
export const EstateProvider = Ctx.Provider;

export function useEstate(): EstateCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEstate outside <EstateProvider>');
  return ctx;
}
