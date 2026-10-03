'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { verticals, type VerticalId } from '@/lib/content';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { track } from '@/lib/analytics';
import type { DialController } from './useDial';

export type DemoVertical = Exclude<VerticalId, 'otro'>;

/**
 * Lifecycle of the light reveal:
 * closed → opening (moon slides, diamond ring, light expands) → open → closing → closed.
 */
export type RevealPhase = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Mutable values shared by the hero motion pieces without re-rendering
 * (scroll timeline → WebGL corona uniforms, reveal timeline → moon offset).
 */
export interface HeroMotionBus {
  /** Scroll progress through the pinned stretch, 0..1. */
  scroll: number;
  /** Moon offset from the scroll timeline, in disc radii (+x right, +y down). */
  scrollMoon: { x: number; y: number };
  /** Moon offset from the reveal timeline, in disc radii (+x right, +y down). */
  revealMoon: { x: number; y: number };
}

interface HeroStateValue {
  /** Vertical whose demo is (or is about to be) revealed inside the hero light. */
  revealed: DemoVertical | null;
  /** Last revealed vertical: still rendered while the light closes. */
  shown: DemoVertical | null;
  choose: (id: VerticalId) => void;
  reset: () => void;
  phase: RevealPhase;
  setPhase: (phase: RevealPhase) => void;
  /** Vertical whose chip opened the reveal (focus returns there on close). */
  openedFrom: React.RefObject<DemoVertical | null>;
  bus: React.RefObject<HeroMotionBus>;
  /**
   * Points the dial at a rubro while its chip is hovered or focused (null releases
   * that source). Hover wins over focus; with neither, the dial holds the revealed
   * rubro, or drifts.
   */
  aim: (id: VerticalId | null, source: 'hover' | 'focus') => void;
  /** The stage registers its <Dial> controller here (null on unmount). */
  registerDial: (controller: DialController | null) => void;
}

const HeroStateContext = createContext<HeroStateValue | null>(null);

/**
 * Hero-local state. Choosing a vertical also updates the global experience
 * (calculator preselection, WhatsApp messages); "Ver otro rubro" only closes the
 * reveal, it keeps the global choice.
 */
export function HeroStateProvider({ children }: { children: ReactNode }) {
  const { selectVertical, openBuilder } = useExperience();
  const [revealed, setRevealed] = useState<DemoVertical | null>(null);
  const [shown, setShown] = useState<DemoVertical | null>(null);
  const [phase, setPhase] = useState<RevealPhase>('closed');
  const openedFrom = useRef<DemoVertical | null>(null);
  const bus = useRef<HeroMotionBus>({ scroll: 0, scrollMoon: { x: 0, y: 0 }, revealMoon: { x: 0, y: 0 } });
  const dial = useRef<DialController | null>(null);
  const aimed = useRef<{ hover: VerticalId | null; focus: VerticalId | null; revealed: VerticalId | null }>({
    hover: null,
    focus: null,
    revealed: null,
  });

  const syncDial = useCallback(() => {
    const a = aimed.current;
    const id = a.hover ?? a.focus ?? a.revealed;
    const index = id ? verticals.findIndex((v) => v.id === id) : -1;
    dial.current?.aimAt(index >= 0 ? index : null);
  }, []);

  const aim = useCallback(
    (id: VerticalId | null, source: 'hover' | 'focus') => {
      aimed.current[source] = id;
      syncDial();
    },
    [syncDial],
  );

  useEffect(() => {
    aimed.current.revealed = revealed;
    syncDial();
  }, [revealed, syncDial]);

  const registerDial = useCallback(
    (controller: DialController | null) => {
      dial.current = controller;
      syncDial();
    },
    [syncDial],
  );

  const choose = useCallback(
    (id: VerticalId) => {
      selectVertical(id, 'hero');
      if (id === 'otro') {
        setRevealed(null);
        setPhase((p) => (p === 'open' || p === 'opening' ? 'closing' : p));
        openBuilder('hero_other');
        return;
      }
      openedFrom.current = id;
      setRevealed(id);
      setShown(id);
      setPhase((p) => (p === 'closed' || p === 'closing' ? 'opening' : p));
      track('demo_opened', { vertical: id, source: 'hero' });
    },
    [selectVertical, openBuilder],
  );

  const reset = useCallback(() => {
    setRevealed(null);
    setPhase((p) => (p === 'open' || p === 'opening' ? 'closing' : p));
  }, []);

  const value = useMemo(
    () => ({ revealed, shown, choose, reset, phase, setPhase, openedFrom, bus, aim, registerDial }),
    [revealed, shown, choose, reset, phase, aim, registerDial],
  );
  return <HeroStateContext.Provider value={value}>{children}</HeroStateContext.Provider>;
}

export function useHeroState(): HeroStateValue {
  const ctx = useContext(HeroStateContext);
  if (!ctx) throw new Error('useHeroState must be used inside <HeroStateProvider>');
  return ctx;
}
