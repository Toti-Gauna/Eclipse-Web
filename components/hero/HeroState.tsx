'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { VerticalId } from '@/lib/content';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { track } from '@/lib/analytics';

interface HeroStateValue {
  /** Vertical whose demo is revealed inside the hero light (null = eclipse). */
  revealed: Exclude<VerticalId, 'otro'> | null;
  choose: (id: VerticalId) => void;
  reset: () => void;
}

const HeroStateContext = createContext<HeroStateValue | null>(null);

/**
 * Hero-local state. Choosing a vertical also updates the global experience
 * (calculator preselection, WhatsApp messages); "Ver otro rubro" only closes the
 * reveal, it keeps the global choice.
 */
export function HeroStateProvider({ children }: { children: ReactNode }) {
  const { selectVertical, openBuilder } = useExperience();
  const [revealed, setRevealed] = useState<HeroStateValue['revealed']>(null);

  const choose = useCallback(
    (id: VerticalId) => {
      selectVertical(id, 'hero');
      if (id === 'otro') {
        setRevealed(null);
        openBuilder('hero_other');
        return;
      }
      setRevealed(id);
      track('demo_opened', { vertical: id, source: 'hero' });
    },
    [selectVertical, openBuilder],
  );

  const reset = useCallback(() => setRevealed(null), []);

  const value = useMemo(() => ({ revealed, choose, reset }), [revealed, choose, reset]);
  return <HeroStateContext.Provider value={value}>{children}</HeroStateContext.Provider>;
}

export function useHeroState(): HeroStateValue {
  const ctx = useContext(HeroStateContext);
  if (!ctx) throw new Error('useHeroState must be used inside <HeroStateProvider>');
  return ctx;
}
