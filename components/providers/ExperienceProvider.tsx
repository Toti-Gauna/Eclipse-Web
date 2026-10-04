'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ItemId, PlanId, VerticalId } from '@/lib/content';
import { track } from '@/lib/analytics';
import { surfaceThemeOf, type SurfaceTheme } from '@/components/plan-builder/surface';

export type { SurfaceTheme };

export type BuilderSource = 'header' | 'hero' | 'hero_shortcut' | 'hero_other' | 'pricing' | 'plan_card' | 'calculator' | 'menu' | 'founders' | 'final_cta' | 'examples' | 'footer' | 'services' | 'demo';

export interface BuilderPreset {
  items?: ItemId[];
  planId?: PlanId | null;
}

/** How the builder looks when it opens. Both optional: by default it reads the trigger's section. */
export interface BuilderOpenOptions {
  /** Force the panel's surface (e.g. a layer that knows its own theme). */
  theme?: SurfaceTheme;
  /** The element that opened it, when it isn't the pressed / focused one. */
  from?: Element | null;
}

/** A pointer press counts as "the trigger" for this long (Safari doesn't focus pressed buttons). */
const POINTER_TRIGGER_MS = 1500;

interface ExperienceContextValue {
  /** Vertical chosen in the hero (or anywhere else). Shared by calculator, demos and WhatsApp messages. */
  vertical: VerticalId | null;
  selectVertical: (vertical: VerticalId | null, source?: string) => void;
  /** `theme`: the surface captured when it opened (the section it was opened from). */
  builder: { open: boolean; source: BuilderSource | null; preset: BuilderPreset | null; theme: SurfaceTheme };
  openBuilder: (source: BuilderSource, preset?: BuilderPreset, options?: BuilderOpenOptions) => void;
  closeBuilder: () => void;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [vertical, setVertical] = useState<VerticalId | null>(null);
  const [builder, setBuilder] = useState<ExperienceContextValue['builder']>({ open: false, source: null, preset: null, theme: 'dark' });

  // The last pressed element: the builder's trigger even when focus didn't follow the press
  // (Safari). A key press after it hands the decision back to the focused element.
  const lastPointer = useRef<{ el: Element; at: number } | null>(null);
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (e.target instanceof Element) lastPointer.current = { el: e.target, at: Date.now() };
    };
    const onKey = () => {
      lastPointer.current = null;
    };
    document.addEventListener('pointerdown', onPointer, { capture: true, passive: true });
    document.addEventListener('keydown', onKey, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointer, { capture: true });
      document.removeEventListener('keydown', onKey, { capture: true });
    };
  }, []);

  const selectVertical = useCallback((next: VerticalId | null, source = 'hero') => {
    setVertical(next);
    if (next) track('vertical_selected', { vertical: next, source });
  }, []);

  const openBuilder = useCallback((source: BuilderSource, preset?: BuilderPreset, options?: BuilderOpenOptions) => {
    const pointer = lastPointer.current && Date.now() - lastPointer.current.at < POINTER_TRIGGER_MS ? lastPointer.current.el : null;
    const theme = options?.theme ?? surfaceThemeOf(options?.from ?? pointer ?? document.activeElement);
    setBuilder({ open: true, source, preset: preset ?? null, theme });
    track('builder_opened', { source });
  }, []);

  const closeBuilder = useCallback(() => setBuilder((b) => ({ ...b, open: false })), []);

  const value = useMemo(
    () => ({ vertical, selectVertical, builder, openBuilder, closeBuilder }),
    [vertical, selectVertical, builder, openBuilder, closeBuilder],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceContextValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>');
  return ctx;
}
