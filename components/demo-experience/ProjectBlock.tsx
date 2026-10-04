'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, SlidersHorizontal } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { Money } from '@/components/ui/Money';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { PROCESS_STEPS, stepPhase, type ProcessStep } from '@/components/sections/process/steps';
import { isApproximate } from '@/lib/currency';
import { l, type Vertical } from '@/lib/content';
import { formatAmount, formatMoney, lowestMaintenance, voiceComboPlans } from '@/lib/pricing';
import { localeTags, type Locale } from '@/i18n/routing';
import { projectSummary } from './project';

const pad = (n: number) => String(n).padStart(2, '0');
/** The first step of the project itself: everything from there on starts with the seña. */
const PROJECT_FROM = PROCESS_STEPS.findIndex((s) => s.id === 'build');

/**
 * "The complete project" under the demo: what the demo is a sample of and what it costs,
 * straight from /content through project.ts (never re-priced here). Package → its range
 * ("Desde … · Pago único", "Hasta … según alcance"), who it's for, what it includes, the demo
 * pieces it doesn't include (each at its published price), its bonus as "Incluido" only, and
 * the suggested maintenance. No package → the pieces at their published prices and no project
 * price. Then "Cómo trabajamos" (the five steps, their times, the project starts with the
 * seña) and the two actions. All copy is the pricing / process sections' approved copy except
 * the block's own heading and leads.
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
  const tm = useTranslations('planMessage');
  const tc = useTranslations('common');
  const ts = useTranslations('sections');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const { openBuilder } = useExperience();
  const { play } = useSound();
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
  const { plan, pieces, covered, bonus, maintenance, voiceUsage, voiceCombo, annualFreeMonths } = summary;
  const list = new Intl.ListFormat(localeTags[locale], { type: 'conjunction' });
  const local = isApproximate(currency);

  const lead = plan
    ? pieces.length
      ? t('leadPlanExtras', { plan: l(plan.name, locale), count: pieces.length })
      : t('leadPlan', { plan: l(plan.name, locale) })
    : t('leadPieces', { count: pieces.length });

  const range = plan
    ? local
      ? tp('plan.rangeLocal', {
          from: formatMoney(plan.priceUsd.from, 'USD', rates, locale),
          to: formatAmount(plan.priceUsd.to, 'USD', rates, locale),
        })
      : tp('plan.rangeUsd', { to: formatMoney(plan.priceUsd.to, 'USD', rates, locale) })
    : null;

  const pieceRows = (
    <ul className="dx-pieces">
      {pieces.map((item) => (
        <li key={item.id} className="dx-piece" data-item={item.id}>
          <span className="dx-piece-name">{l(item.name, locale)}</span>
          <span aria-hidden className="dx-piece-leader leader" />
          <Money usd={item.priceUsd} className="readout dx-piece-price" />
        </li>
      ))}
    </ul>
  );

  const combo = voiceCombo ? (
    <p className="dx-note" data-dx-combo>
      <strong>{tp('offers.comboTitle', { price: formatMoney(voiceCombo.priceUsd, 'USD', rates, locale) })}.</strong>{' '}
      {tp('offers.comboText', {
        plans: list.format(voiceComboPlans(voiceCombo).addTo.map((p) => l(p.name, locale))),
        min: formatMoney(voiceCombo.minSubtotalUsd, 'USD', rates, locale),
      })}
    </p>
  ) : null;

  return (
    <section className="dx-project" aria-labelledby="dx-project-title" data-dx-project={plan?.id ?? 'pieces'}>
      <div className="dx-project-head">
        <p className="label">{t('label')}</p>
        <h3 id="dx-project-title" className="display dx-project-title">
          {t('title')}
        </h3>
        <p className="dx-project-lead">{lead}</p>
      </div>

      <div className="dx-project-grid">
        {plan ? (
          <article className="dx-pack ticks" aria-labelledby="dx-pack-name">
            <p className="label">{t('package')}</p>
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
              <p className="dx-pack-range">{range}</p>
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
            {bonus ? (
              <p className="dx-bonus" data-dx-bonus>
                <span className="dx-bonus-tag">{tc('included')}</span>
                <span>
                  <strong>{l(bonus.title, locale)}.</strong> {l(bonus.text, locale)}
                </span>
              </p>
            ) : null}
            {pieces.length ? (
              <div className="dx-extras" data-dx-extras>
                <p className="label dx-sub">{t('extras')}</p>
                {pieceRows}
                <p className="dx-note">
                  {tp('plan.once')} · {tp('how.extras.text')}
                </p>
                {combo}
              </div>
            ) : null}
            {covered.length ? (
              <p className="dx-covered">{t('covered', { pieces: list.format(covered.map((i) => l(i.name, locale))) })}</p>
            ) : null}
          </article>
        ) : (
          <article className="dx-pack ticks" aria-labelledby="dx-pack-name">
            <p className="label">{t('pieces')}</p>
            <h4 id="dx-pack-name" className="sr-only">
              {t('pieces')}
            </h4>
            {pieceRows}
            <p className="dx-note">
              {tp('plan.once')} · {t('piecesNote')}
            </p>
            {combo}
          </article>
        )}

        {maintenance ? (
          <aside className="dx-care" aria-labelledby="dx-care-title" data-dx-care={maintenance.id}>
            <p className="label">{tp('plan.maintenanceLabel')}</p>
            <h4 id="dx-care-title" className="display dx-care-name">
              {l(maintenance.name, locale)}
            </h4>
            <p className="dx-care-price">
              <Money usd={maintenance.priceUsd} className="readout dx-care-readout" />
              <span className="dx-care-period">{tp('perMonth')}</span>
            </p>
            <p className="label">{tp('how.care.when')}</p>
            <ul className="dx-includes">
              {l(maintenance.includes, locale).map((line) => (
                <li key={line}>
                  <Check aria-hidden strokeWidth={1.75} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {annualFreeMonths ? <p className="dx-note">{tp('how.care.annual', { months: annualFreeMonths })}</p> : null}
            {voiceUsage ? <p className="dx-note">{tm('voiceUsage', { price: format(voiceUsage.priceUsd) })}</p> : null}
          </aside>
        ) : null}
      </div>

      <div ref={actions} className="dx-actions" data-dx-actions>
        {wantThis('btn btn-primary dx-actions-main', { 'data-dx-cta': 'block' })}
        <button
          type="button"
          className="btn btn-ghost"
          data-dx-build
          onClick={() => {
            play('select');
            openBuilder('demo', summary.preset);
          }}
        >
          <SlidersHorizontal aria-hidden className="size-4" strokeWidth={1.6} />
          {t('build')}
        </button>
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
