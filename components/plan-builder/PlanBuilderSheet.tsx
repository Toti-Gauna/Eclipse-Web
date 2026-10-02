'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { useExperience } from '@/components/providers/ExperienceProvider';

// Phase 3 shell. The full generator ("Armá tu plan") replaces the body in phase 10.
export function PlanBuilderSheet() {
  const t = useTranslations();
  const { builder, closeBuilder } = useExperience();
  return (
    <Sheet open={builder.open} onClose={closeBuilder} variant="drawer" labelledBy="builder-title">
      <div className="theme-dark flex h-full flex-col bg-night p-6">
        <div className="flex items-center justify-between">
          <h2 id="builder-title" className="display text-3xl">
            {t('header.buildPlan')}
          </h2>
          <button type="button" onClick={closeBuilder} aria-label={t('common.close')} className="grid size-11 place-items-center rounded-full border border-line">
            <X aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </Sheet>
  );
}
