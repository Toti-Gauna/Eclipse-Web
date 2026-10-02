'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { BUILDER_FOCUS_EVENT } from './browser';

// The builder is only downloaded the first time someone opens it.
const PlanBuilderSheet = dynamic(() => import('./PlanBuilderSheet').then((m) => m.PlanBuilderSheet), { ssr: false });

const isPlanPage = (pathname: string | null) => !!pathname && pathname.replace(/\/$/, '') === '/plan';

export function BuilderHost() {
  const { builder, closeBuilder } = useExperience();
  const onPlanPage = isPlanPage(usePathname());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!builder.open) return;
    if (onPlanPage) {
      // /plan is already the builder: hand it the preset and land there instead of stacking a drawer.
      window.dispatchEvent(new CustomEvent(BUILDER_FOCUS_EVENT, { detail: builder.preset }));
      closeBuilder();
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount once, keep mounted for the exit animation
    setMounted(true);
  }, [builder.open, builder.preset, onPlanPage, closeBuilder]);

  return mounted ? <PlanBuilderSheet suppressed={onPlanPage} /> : null;
}
