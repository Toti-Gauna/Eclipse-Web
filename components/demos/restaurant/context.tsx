'use client';

import { createContext, useContext } from 'react';
import type { LineId, RestaurantState, RestaurantStore, RestaurantView } from './story';

export type RestaurantTab = 'service' | 'phone' | 'kitchen' | 'floor' | 'menu' | 'numbers';

export interface RestaurantCtx {
  screen: 'phone' | 'laptop';
  paired: boolean;
  store: RestaurantStore;
  state: RestaurantState;
  view: RestaurantView;
  t: number;
  loop: number;
  reduced: boolean;
  active: boolean;
  /** This instance announces live changes and plays sounds (one per laptop + phone pair). */
  announce: boolean;
  business: string;
  /** Average order value of the rubro (USD, /content). */
  ticketUsd: number;
  /** Orders / bookings lost per week before (USD, /content). */
  lostPerWeek: number;
  go: (tab: RestaurantTab, line?: LineId) => void;
  /** The line the AI phone view shows in full (phone). */
  focusLine: LineId;
  /** Phone: open the customer's side (menu, order, book a table). */
  openCustomer: (screen?: 'menu' | 'book') => void;
}

const Ctx = createContext<RestaurantCtx | null>(null);
export const RestaurantProvider = Ctx.Provider;

export function useRestaurant(): RestaurantCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRestaurant outside <RestaurantProvider>');
  return ctx;
}
