'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { verticalById, verticals, type VerticalId } from '@/lib/content';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { openDemoExperience, subscribeDemoExperience, getDemoRequest } from '@/components/demo-experience/store';
import type { DialController } from './useDial';

/**
 * Mutable values shared by the hero motion pieces without re-rendering
 * (scroll timeline → WebGL corona uniforms).
 */
export interface HeroMotionBus {
  /** Scroll progress through the pinned stretch, 0..1. */
  scroll: number;
  /** Moon offset from the scroll timeline, in disc radii (+x right, +y down). */
  scrollMoon: { x: number; y: number };
  /**
   * Extra moon offset (disc radii) added by the corona to the scroll one. v3b: the demo no
   * longer opens inside the hero, so nothing moves it (kept at 0 for the corona's contract).
   */
  revealMoon: { x: number; y: number };
  /**
   * Set by the WebGL corona while it is mounted: keeps it moving for `ms` (it rests on
   * its last frame otherwise). Called by the scroll scrub and the dial.
   */
  wake?: (ms: number) => void;
}

interface HeroStateValue {
  /**
   * A rubro key was pressed: records the vertical (calculator, WhatsApp messages) and opens
   * its demo in the "Ver demo" layer from the key (or "Armá tu plan" for "Otro").
   */
  choose: (id: VerticalId, opener: HTMLElement, event?: { clientX: number; clientY: number; detail: number }) => void;
  bus: React.RefObject<HeroMotionBus>;
  /**
   * Points the dial at a rubro while its chip is hovered or focused (null releases
   * that source). Hover wins over focus; with neither, the dial holds the rubro whose
   * demo is open, or rests where it is.
   */
  aim: (id: VerticalId | null, source: 'hover' | 'focus') => void;
  /** The stage registers its <Dial> controller here (null on unmount). */
  registerDial: (controller: DialController | null) => void;
}

const HeroStateContext = createContext<HeroStateValue | null>(null);

/** Hero-local state: the dial and the motion bus. The demo itself opens in the shared layer. */
export function HeroStateProvider({ children }: { children: ReactNode }) {
  const { selectVertical, openBuilder } = useExperience();
  const bus = useRef<HeroMotionBus>({ scroll: 0, scrollMoon: { x: 0, y: 0 }, revealMoon: { x: 0, y: 0 } });
  const dial = useRef<DialController | null>(null);
  const aimed = useRef<{ hover: VerticalId | null; focus: VerticalId | null; open: VerticalId | null }>({
    hover: null,
    focus: null,
    open: null,
  });

  const syncDial = useCallback(() => {
    const a = aimed.current;
    const id = a.hover ?? a.focus ?? a.open;
    const index = id ? verticals.findIndex((v) => v.id === id) : -1;
    dial.current?.aimAt(index >= 0 ? index : null);
  }, []);

  const aim = useCallback(
    (id: VerticalId | null, source: 'hover' | 'focus') => {
      aimed.current[source] = id;
      syncDial();
      // The instrument comes alive while the dial turns (the corona rests otherwise).
      if (id) bus.current.wake?.(1600);
    },
    [syncDial],
  );

  // While a demo opened from the hero is open, the dial holds its rubro.
  useEffect(
    () =>
      subscribeDemoExperience(() => {
        const r = getDemoRequest();
        const open = r && r.origin === 'hero' ? r.vertical : null;
        if (aimed.current.open === open) return;
        aimed.current.open = open;
        syncDial();
      }),
    [syncDial],
  );

  const registerDial = useCallback(
    (controller: DialController | null) => {
      dial.current = controller;
      syncDial();
    },
    [syncDial],
  );

  const choose = useCallback<HeroStateValue['choose']>(
    (id, opener, event) => {
      selectVertical(id, 'hero');
      const demo = verticalById(id)?.demo;
      if (id === 'otro' || !demo) {
        openBuilder('hero_other');
        return;
      }
      openDemoExperience({ vertical: id, demo, origin: 'hero' }, opener, event);
    },
    [selectVertical, openBuilder],
  );

  const value = useMemo(() => ({ choose, bus, aim, registerDial }), [choose, aim, registerDial]);
  return <HeroStateContext.Provider value={value}>{children}</HeroStateContext.Provider>;
}

export function useHeroState(): HeroStateValue {
  const ctx = useContext(HeroStateContext);
  if (!ctx) throw new Error('useHeroState must be used inside <HeroStateProvider>');
  return ctx;
}
