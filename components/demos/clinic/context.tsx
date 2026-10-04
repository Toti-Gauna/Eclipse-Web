'use client';

import { createContext, useContext } from 'react';
import type { ClinicState, ClinicStore, ClinicView } from './story';

export type ClinicTab = 'today' | 'agenda' | 'calls' | 'whatsapp' | 'site' | 'recovered';

export interface ClinicCtx {
  screen: 'phone' | 'laptop';
  paired: boolean;
  store: ClinicStore;
  state: ClinicState;
  view: ClinicView;
  t: number;
  loop: number;
  reduced: boolean;
  active: boolean;
  /** This instance announces live changes (one per laptop + phone pair). */
  announce: boolean;
  business: string;
  keyNumber: number;
  ticketUsd: number;
  go: (tab: ClinicTab) => void;
  /** Phone: open / close the patient's view of the public site. */
  openSite: () => void;
  /** Opens the agenda on a day (e.g. after booking on the site). */
  openAgenda: (day: number) => void;
  /** The day the agenda opens on (TODAY unless `openAgenda` chose another). */
  agendaDay: number;
}

const Ctx = createContext<ClinicCtx | null>(null);
export const ClinicProvider = Ctx.Provider;

export function useClinic(): ClinicCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useClinic outside <ClinicProvider>');
  return ctx;
}
