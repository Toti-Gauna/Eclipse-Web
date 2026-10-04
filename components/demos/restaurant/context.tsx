'use client';

import { createContext, useContext } from 'react';
import type { BeatId, RestaurantTab } from './data';
import type { LineId, RestaurantState, RestaurantStore, RestaurantView } from './story';

export type { RestaurantTab };

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
  /** This instance announces live changes (one per laptop + phone pair). */
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
  openCustomer: () => void;
  /** Index of the last beat reached (−1: none) and whether one is playing. */
  beat: number;
  playing: boolean;
  /** Plays the story up to that beat (same as the SimBar), when it is still ahead. */
  playBeat: (id: BeatId) => void;
  /** "Salón y reservas" opens on this day (a beat can ask for another one). */
  floorDay: number;
}

const Ctx = createContext<RestaurantCtx | null>(null);
export const RestaurantProvider = Ctx.Provider;

export function useRestaurant(): RestaurantCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRestaurant outside <RestaurantProvider>');
  return ctx;
}
