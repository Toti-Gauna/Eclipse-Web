'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useExperience, type BuilderPreset, type BuilderSource } from '@/components/providers/ExperienceProvider';

/** Opens "Armá tu plan" (drawer / bottom sheet) from anywhere, including server components. */
export function BuildPlanButton({
  source,
  preset,
  children,
  className = 'btn btn-ghost',
  ...rest
}: {
  source: BuilderSource;
  preset?: BuilderPreset;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'>) {
  const { openBuilder } = useExperience();
  return (
    <button type="button" aria-haspopup="dialog" className={className} onClick={() => openBuilder(source, preset)} {...rest}>
      {children}
    </button>
  );
}
