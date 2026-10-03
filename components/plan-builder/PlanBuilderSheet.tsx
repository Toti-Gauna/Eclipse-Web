'use client';

import { Sheet } from '@/components/ui/Sheet';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { PlanBuilder } from './PlanBuilder';

/**
 * "Armá tu plan" as a drawer (right side from md) / full-screen bottom sheet (mobile).
 * Lazy-loaded by BuilderHost on first open and kept mounted afterwards.
 * `suppressed` keeps it closed on /plan, where the page itself is the builder.
 */
export function PlanBuilderSheet({ suppressed = false }: { suppressed?: boolean }) {
  const { builder, closeBuilder } = useExperience();
  const open = builder.open && !suppressed;
  return (
    <Sheet open={open} onClose={closeBuilder} variant="drawer" labelledBy="builder-title">
      <div className="relative h-full overflow-hidden bg-night">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-40 size-[26rem] rounded-full bg-[radial-gradient(closest-side,rgb(245_185_66/0.16),transparent)]"
        />
        <PlanBuilder mode="sheet" open={open} preset={builder.preset} onClose={closeBuilder} />
      </div>
    </Sheet>
  );
}
