'use client';

import { createContext, useContext } from 'react';
import type { SoundName } from '@/lib/sound/types';
import type { AcademyState, AcademyStore, AcademyView, StudentTab } from './story';

export type SchoolTab = 'today' | 'students' | 'courses' | 'live' | 'tutor' | 'site';

export interface AcademyCtx {
  screen: 'phone' | 'laptop';
  paired: boolean;
  store: AcademyStore;
  state: AcademyState;
  view: AcademyView;
  t: number;
  loop: number;
  reduced: boolean;
  active: boolean;
  /** This instance announces live changes and plays sounds (one per laptop + phone pair). */
  announce: boolean;
  business: string;
  ticketUsd: number;
  /** Key number of the rubro (completion %, /content). */
  keyNumber: number;
  /** School panel navigation. */
  go: (tab: SchoolTab) => void;
  /** Valentina's phone: where it is (story-driven until the visitor takes over). */
  student: {
    tab: StudentTab;
    overlay: boolean;
    open: (tab: StudentTab) => void;
    closeOverlay: () => void;
  };
  /** A visitor action: update the store, hold the loop, play a sound. */
  run: (fn: Parameters<AcademyStore['update']>[0], sound?: SoundName) => void;
}

const Ctx = createContext<AcademyCtx | null>(null);
export const AcademyProvider = Ctx.Provider;

export function useAcademy(): AcademyCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAcademy outside <AcademyProvider>');
  return ctx;
}
