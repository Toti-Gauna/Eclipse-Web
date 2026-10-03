'use client';

import { createContext, useContext } from 'react';
import type { ShopState, ShopStore, ShopView } from './story';

export type ShopTab = 'today' | 'orders' | 'carts' | 'club' | 'chat' | 'site';

export interface ShopCtx {
  screen: 'phone' | 'laptop';
  paired: boolean;
  store: ShopStore;
  state: ShopState;
  view: ShopView;
  t: number;
  loop: number;
  reduced: boolean;
  active: boolean;
  /** This instance announces live changes and plays sounds (one per laptop + phone pair). */
  announce: boolean;
  business: string;
  ticketUsd: number;
  go: (tab: ShopTab) => void;
  /** Phone alone: show the customer's store / the owner's panel. */
  openStore?: () => void;
  closeStore?: () => void;
}

const Ctx = createContext<ShopCtx | null>(null);
export const ShopProvider = Ctx.Provider;

export function useShop(): ShopCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useShop outside <ShopProvider>');
  return ctx;
}
