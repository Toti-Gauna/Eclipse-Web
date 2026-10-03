'use client';

import { useEffect, useRef } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { PlanBuilder } from './PlanBuilder';

/**
 * "Armá tu plan" as a drawer (right side from md) / full-screen bottom sheet (mobile).
 * Lazy-loaded by BuilderHost on first open and kept mounted afterwards.
 * `suppressed` keeps it closed on /plan, where the page itself is the builder.
 */
export function PlanBuilderSheet({ suppressed = false }: { suppressed?: boolean }) {
  const { builder, closeBuilder } = useExperience();
  const { play } = useSound();
  const open = builder.open && !suppressed;

  // open / close sounds (not on mount while closed)
  const was = useRef(false);
  useEffect(() => {
    if (open === was.current) return;
    was.current = open;
    play(open ? 'open' : 'close');
  }, [open, play]);

  return (
    <Sheet open={open} onClose={closeBuilder} variant="drawer" labelledBy="builder-title" panelClassName="pb-panel">
      <div className="pb-panel-inner">
        <div aria-hidden className="pb-panel-light" />
        <PlanBuilder mode="sheet" open={open} preset={builder.preset} onClose={closeBuilder} />
      </div>
    </Sheet>
  );
}
