'use client';

import { createContext, useContext } from 'react';
import type { SoundName } from '@/lib/sound/types';
import type { SchoolTab } from './data';
import type { AcademyEvent, AcademyState, AcademyStore, AcademyView, StudentTab } from './story';

export type { SchoolTab };

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
  /** Valentina's phone: where the visitor is (nothing navigates on its own). */
  student: {
    tab: StudentTab;
    overlay: boolean;
    open: (tab: StudentTab) => void;
    openOverlay: () => void;
    closeOverlay: () => void;
  };
  /** A visitor action: update the store (stamped with the frozen story time) and play a sound. */
  run: (fn: Parameters<AcademyStore['update']>[0], sound?: SoundName) => void;
  /** Plays a beat (e.g. the student's "Empezar" button plays the speaking session). */
  playBeat: (id: string) => void;
  /** The beat the SimBar would play next (null: all played) and whether one is playing. */
  nextBeat: string | null;
  playing: boolean;
  /** The visitor's latest action, for a short local toast + announcement (cleared by a timer it started). */
  flash: AcademyEvent | null;
}

const Ctx = createContext<AcademyCtx | null>(null);
export const AcademyProvider = Ctx.Provider;

export function useAcademy(): AcademyCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAcademy outside <AcademyProvider>');
  return ctx;
}
