'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { STEPS, stepIndex, stepPhase, type StepId } from './rules';

/**
 * The four steps as an eclipse in progress: the moon covers the sun as the plan comes
 * together (◔ Objetivo · ◑ Piezas · ◕ Mantenimiento · ● Resumen). Every step is reachable.
 * - "bar": a row with a sliding amber cursor (sheet, phones).
 * - "rail": an ephemeris column with a live reading per step (/plan on desktop).
 */
export function Stepper({
  step,
  onGo,
  variant,
  previews,
  className = '',
}: {
  step: StepId;
  onGo: (step: StepId) => void;
  variant: 'bar' | 'rail';
  previews?: Partial<Record<StepId, ReactNode>>;
  className?: string;
}) {
  const t = useTranslations('builder');
  const current = stepIndex(step);
  return (
    <nav aria-label={t('stepsLabel')} className={`pb-stepper pb-stepper--${variant} ${className}`}>
      <ol style={{ '--current': current } as CSSProperties}>
        {STEPS.map((id, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'next';
          return (
            <li key={id} data-state={state}>
              <button type="button" onClick={() => onGo(id)} aria-current={i === current ? 'step' : undefined} className="pb-stepper-btn">
                <span aria-hidden className="pb-stepper-mark">
                  <PhaseGlyph phase={stepPhase(id)} size={variant === 'rail' ? 22 : 18} className="pb-stepper-glyph" />
                  <span className="pb-stepper-index readout">{String(i + 1).padStart(2, '0')}</span>
                </span>
                <span className="pb-stepper-name">
                  <span className="sr-only">{t('stepOf', { n: i + 1, total: STEPS.length })}: </span>
                  {t(`steps.${id}.name`)}
                </span>
                {variant === 'rail' && previews?.[id] ? <span className="pb-stepper-preview readout">{previews[id]}</span> : null}
              </button>
            </li>
          );
        })}
      </ol>
      {variant === 'bar' ? <span aria-hidden className="pb-stepper-cursor" style={{ '--current': current } as CSSProperties} /> : null}
    </nav>
  );
}
