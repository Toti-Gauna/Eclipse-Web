'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ItemId, PlanId, VerticalId } from '@/lib/content';
import { track } from '@/lib/analytics';

export type BuilderSource = 'header' | 'hero' | 'hero_other' | 'pricing' | 'plan_card' | 'calculator' | 'menu' | 'founders' | 'final_cta' | 'examples' | 'footer' | 'services';

export interface BuilderPreset {
  items?: ItemId[];
  planId?: PlanId | null;
}

interface ExperienceContextValue {
  /** Vertical chosen in the hero (or anywhere else). Shared by calculator, demos and WhatsApp messages. */
  vertical: VerticalId | null;
  selectVertical: (vertical: VerticalId | null, source?: string) => void;
  builder: { open: boolean; source: BuilderSource | null; preset: BuilderPreset | null };
  openBuilder: (source: BuilderSource, preset?: BuilderPreset) => void;
  closeBuilder: () => void;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [vertical, setVertical] = useState<VerticalId | null>(null);
  const [builder, setBuilder] = useState<ExperienceContextValue['builder']>({ open: false, source: null, preset: null });

  const selectVertical = useCallback((next: VerticalId | null, source = 'hero') => {
    setVertical(next);
    if (next) track('vertical_selected', { vertical: next, source });
  }, []);

  const openBuilder = useCallback((source: BuilderSource, preset?: BuilderPreset) => {
    setBuilder({ open: true, source, preset: preset ?? null });
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
