'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';

// The builder is only downloaded the first time someone opens it.
const PlanBuilderSheet = dynamic(() => import('./PlanBuilderSheet').then((m) => m.PlanBuilderSheet), { ssr: false });

export function BuilderHost() {
  const { builder } = useExperience();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount once, keep mounted for the exit animation
    if (builder.open) setMounted(true);
  }, [builder.open]);
  return mounted ? <PlanBuilderSheet /> : null;
}
