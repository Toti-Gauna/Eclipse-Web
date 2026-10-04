'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { lowestMaintenance } from '@/lib/pricing';
import { useSound } from '@/components/sound/SoundContext';
import { Money } from '@/components/ui/Money';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { PROCESS_STEPS, stepPhase, type ProcessStep } from './steps';

const MAINTENANCE_FROM_USD = lowestMaintenance()?.priceUsd ?? null;
const pad = (n: number) => String(n).padStart(2, '0');
/** The first step of the project itself: everything from here on starts with the seña. */
const PROJECT_FROM = PROCESS_STEPS.findIndex((s) => s.id === 'build');

/**
 * The five steps, compact: number · phase glyph · name · how long it takes, and the
 * detail one tap away (phones; desktop shows every detail in its column).
 * The steps are split in two phases — demo y propuesta / el proyecto, which starts
 * with the seña — so it is clear that nothing is built (or charged) before it.
 */
export function ProcessSteps() {
  const t = useTranslations('process');
  const { play } = useSound();
  const uid = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    play('select');
  };

  return (
    <ol className="proc-steps">
      {PROCESS_STEPS.map((step, i) => {
        const isOpen = open.has(step.id);
        const detailId = `${uid}-${step.id}`;
        const phase = i === 0 ? 'pre' : i === PROJECT_FROM ? 'project' : null;
        return (
          <li key={step.id} className="proc-step" data-open={isOpen || undefined} data-project={i >= PROJECT_FROM || undefined}>
            {phase ? (
              <p className="proc-phase" data-phase={phase} data-span={phase === 'pre' ? PROJECT_FROM : PROCESS_STEPS.length - PROJECT_FROM}>
                <span>{t(`phases.${phase}`)}</span>
              </p>
            ) : null}
            {/* Phones: the row is a disclosure button. Desktop (CSS): the same row as plain text, detail always shown. */}
            <h3 className="proc-head-row">
              <button type="button" aria-expanded={isOpen} aria-controls={detailId} onClick={() => toggle(step.id)} className="proc-toggle">
                <StepHead step={step} index={i} />
                <ChevronDown aria-hidden strokeWidth={1.5} className="proc-chevron" />
              </button>
              <span className="proc-static">
                <StepHead step={step} index={i} />
              </span>
            </h3>
            <div id={detailId} className="proc-detail">
              <p>{t(`steps.${step.id}.body`)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepHead({ step, index }: { step: ProcessStep; index: number }) {
  const t = useTranslations('process');
  return (
    <>
      <span aria-hidden className="proc-index">
        {pad(index + 1)}
      </span>
      <PhaseGlyph phase={stepPhase(index)} size={18} className="proc-glyph" />
      <span className="proc-title">{t(`steps.${step.id}.title`)}</span>
      <StepMeta step={step} />
    </>
  );
}

/** How long the step takes: "48 h", "Según alcance", "Desde US$ 25/mes" (times from steps.ts, prices from content). */
function StepMeta({ step }: { step: ProcessStep }) {
  const t = useTranslations('process');
  if (step.meta === 'hours') {
    return (
      <span className="proc-meta proc-meta--time">
        <span className="sr-only">{t('durationLabel')}: </span>
        <span className="proc-meta-value">{step.hours}</span>
        <span className="proc-meta-unit">{t('hoursUnit')}</span>
      </span>
    );
  }
  if (step.meta === 'maintenance') {
    if (MAINTENANCE_FROM_USD === null) return null;
    return (
      <span className="proc-meta">
        {t('from')}&nbsp;
        <Money usd={MAINTENANCE_FROM_USD} className="proc-meta-money" />
        {t('perMonth')}
      </span>
    );
  }
  return <span className="proc-meta">{t(`steps.${step.id}.meta`)}</span>;
}
