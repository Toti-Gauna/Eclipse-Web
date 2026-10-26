'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { PROCESS_STEPS, stepPhase, type ProcessStep } from '@/components/sections/process/steps';
import { l, lowestLevelUsd, type Vertical } from '@/lib/content';
import { lowestMaintenance } from '@/lib/pricing';
import type { Locale } from '@/i18n/routing';
import { projectSummary } from './project';

const pad = (n: number) => String(n).padStart(2, '0');
/** The first step of the project itself: everything from there on starts with the seña. */
const PROJECT_FROM = PROCESS_STEPS.findIndex((s) => s.id === 'build');

/**
 * "The complete project" under the demo, straight from /content through project.ts (never
 * re-priced here): what you can try (the demo, a front-end simulation), what would be
 * contracted (the product adaptation, "desde", what it includes) and what needs a validated
 * integration (the simulated channels, each at its add-on price, never preselected). Then the
 * suggested monthly plan, "Cómo trabajamos" and the two actions.
 */
export function ProjectBlock({
  vertical,
  wantThis,
  onBlockCta,
  scroller,
}: {
  vertical: Vertical;
  wantThis: (className: string, extra?: Record<string, string>) => ReactNode;
  onBlockCta: (inView: boolean) => void;
  scroller: () => HTMLElement | null;
}) {
  const t = useTranslations('demoExperience.project');
  const tp = useTranslations('pricing');
  const ts = useTranslations('sections');
  const locale = useLocale() as Locale;
  const summary = useMemo(() => projectSummary(vertical), [vertical]);
  const actions = useRef<HTMLDivElement>(null);

  // One amber per viewport: tell the layer when this block's solid CTA is on screen.
  useEffect(() => {
    const el = actions.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => onBlockCta(entries[entries.length - 1].isIntersecting), {
      root: scroller(),
    });
    io.observe(el);
    return () => {
      io.disconnect();
      onBlockCta(false);
    };
  }, [onBlockCta, scroller]);

  if (!summary) return null;
  const { plan, pieces } = summary;

  const pieceRows = (
    <ul className="dx-pieces">
      {pieces.map((item) => (
        <li key={item.id} className="dx-piece" data-item={item.id}>
          <span className="dx-piece-name">{l(item.name, locale)}</span>
          <span aria-hidden className="dx-piece-leader leader" />
          <span className="readout dx-piece-price">
            {tp('plan.from')} <Money usd={plan ? (item.addonUsd ?? item.priceUsd) : item.priceUsd} />
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="dx-project" aria-labelledby="dx-project-title" data-dx-project={plan?.id ?? 'pieces'}>
      <div className="dx-project-head">
        <p className="label">{t('label')}</p>
        <h3 id="dx-project-title" className="display dx-project-title">
          {t('title')}
        </h3>
        <p className="dx-project-lead">{t('lead')}</p>
      </div>

      <div className="dx-project-grid">
        <article className="dx-pack ticks" aria-labelledby="dx-pack-name">
          {plan ? (
            <>
              <p className="label">{t('contracted')}</p>
              <h4 id="dx-pack-name" className="display dx-pack-name">
                {l(plan.name, locale)}
              </h4>
              <p className="dx-pack-audience">
                <span className="sr-only">{tp('plan.audienceLabel')}: </span>
                {l(plan.audience, locale)}
              </p>
              <div className="dx-pack-price" data-dx-price>
                <p className="label">
                  {tp('plan.from')} · {tp('plan.once')}
                </p>
                <Money usd={plan.priceUsd.from} className="readout dx-pack-from" />
              </div>
              <p className="label dx-sub">{tp('plan.includes')}</p>
              <ul className="dx-includes" aria-label={tp('plan.includes')}>
                {l(plan.includes, locale).map((line) => (
                  <li key={line}>
                    <Check aria-hidden strokeWidth={1.75} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <h4 id="dx-pack-name" className="sr-only">
              {t('pieces')}
            </h4>
          )}
          {pieces.length ? (
            <div className="dx-extras" data-dx-extras>
              <p className="label dx-sub">{t('extras')}</p>
              {pieceRows}
              <p className="dx-note">{t('extrasNote')}</p>
            </div>
          ) : null}
          <p className="dx-note">{t('simulation')}</p>
        </article>

        <aside className="dx-care" aria-labelledby="dx-care-title" data-dx-care="levels">
          <p className="label">{tp('levels.asideLabel')}</p>
          <h4 id="dx-care-title" className="display dx-care-name">
            {tp('levels.asideTitle')}
          </h4>
          <p className="dx-care-price">
            <span className="dx-care-period">{tp('plan.from')}</span>
            <Money usd={lowestLevelUsd} className="readout dx-care-readout" />
            <span className="dx-care-period">{tp('perMonth')}</span>
          </p>
          <p className="dx-note">{tp('levels.asideText')}</p>
        </aside>
      </div>

      <div ref={actions} className="dx-actions" data-dx-actions>
        {wantThis('btn btn-primary dx-actions-main', { 'data-dx-cta': 'block' })}
      </div>

      <ProcessLedger label={ts('labels.process')} />
    </section>
  );
}

/** "Cómo trabajamos": the five steps of the process section, their times and the seña condition. */
function ProcessLedger({ label }: { label: string }) {
  const t = useTranslations('process');
  const groups = [
    { id: 'pre' as const, steps: PROCESS_STEPS.slice(0, PROJECT_FROM), from: 0 },
    { id: 'project' as const, steps: PROCESS_STEPS.slice(PROJECT_FROM), from: PROJECT_FROM },
  ];
  return (
    <div className="dx-process" role="group" aria-labelledby="dx-process-title">
      <p id="dx-process-title" className="label">
        {label}
      </p>
      <div className="dx-process-groups">
        {groups.map((g) => (
          <div key={g.id} className="dx-process-group" data-phase={g.id} style={{ ['--dx-span' as string]: g.steps.length }}>
            <p className="dx-process-phase">{t(`phases.${g.id}`)}</p>
            <ol className="dx-process-steps" start={g.from + 1}>
              {g.steps.map((step, i) => (
                <li key={step.id} className="dx-process-step">
                  <span aria-hidden className="dx-process-index">
                    {pad(g.from + i + 1)}
                  </span>
                  <PhaseGlyph phase={stepPhase(g.from + i)} size={16} className="dx-process-glyph" />
                  <span className="dx-process-title">{t(`steps.${step.id}.title`)}</span>
                  <StepMeta step={step} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

const MAINTENANCE_FROM_USD = lowestMaintenance()?.priceUsd ?? null;

function StepMeta({ step }: { step: ProcessStep }) {
  const t = useTranslations('process');
  if (step.meta === 'hours')
    return (
      <span className="dx-process-meta">
        <span className="sr-only">{t('durationLabel')}: </span>
        {step.hours} {t('hoursUnit')}
      </span>
    );
  if (step.meta === 'maintenance')
    return MAINTENANCE_FROM_USD === null ? null : (
      <span className="dx-process-meta">
        {t('from')} <Money usd={MAINTENANCE_FROM_USD} />
        {t('perMonth')}
      </span>
    );
  return <span className="dx-process-meta">{t(`steps.${step.id}.meta`)}</span>;
}
