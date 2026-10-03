import './process.css';
import { useLocale, useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { CountUp } from '@/components/motion/CountUp';
import { DrawLine } from '@/components/motion/DrawLine';
import { LightSweep } from '@/components/motion/LightSweep';
import { Reveal } from '@/components/motion/Reveal';
import { DemoCta } from '@/components/ui/DemoCta';
import { Money } from '@/components/ui/Money';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { SectionMark } from '@/components/ui/SectionMark';
import { maintenancePlans } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { ProcessTimeline } from './ProcessTimeline';
import { DEMO_HOURS, PROCESS_STEPS, stepPhase, type ProcessStep } from './steps';

const MAINTENANCE_FROM_USD = Math.min(...maintenancePlans.map((p) => p.priceUsd));
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 05 · "Cómo trabajamos": five steps as phases of the eclipse — from the first
 * crescent of light (your demo) to the full sun (it keeps running) — on a
 * hairline that the scroll draws. Horizontal from 1024px, vertical below (no pin
 * anywhere; see <ProcessTimeline>). Times come from steps.ts and /content.
 */
export function ProcessSection() {
  const t = useTranslations('process');
  const last = PROCESS_STEPS.length - 1;

  return (
    <section
      id={SECTION_IDS.process}
      aria-labelledby="process-title"
      className="process theme-dark relative isolate overflow-hidden bg-night py-24 md:py-32"
    >
      <div aria-hidden className="process-ambient" />
      <div className="container-x">
        <Reveal className="proc-head">
          <div data-reveal>
            <SectionMark section="process" />
          </div>
          <h2 id="process-title" data-reveal className="proc-h2 display">
            <LightSweep>{t('title')}</LightSweep>
          </h2>
          <p data-reveal className="proc-sub">
            {t('sub', { hours: DEMO_HOURS })}
          </p>
        </Reveal>

        <ProcessTimeline className="proc-timeline">
          <Reveal stagger={0.08} start="top 85%">
            <ol className="proc-list">
              {PROCESS_STEPS.map((step, i) => (
                <li key={step.id} data-step data-reveal className="proc-step">
                  <div className="proc-reading">
                    <StepMeta step={step} />
                  </div>
                  {i < last ? (
                    <span aria-hidden className="proc-track">
                      <span data-fill className="proc-track-fill" />
                    </span>
                  ) : null}
                  <span aria-hidden data-node className="proc-node">
                    <span className="proc-node-glow" />
                    <PhaseGlyph phase={stepPhase(i)} size="100%" strokeWidth={1.2} className="proc-glyph" />
                    <PhaseGlyph phase={stepPhase(i)} size="100%" strokeWidth={1.2} className="proc-glyph proc-glyph--lit" />
                  </span>
                  <div className="proc-body">
                    <h3 className="proc-title">
                      <span aria-hidden className="proc-index">
                        {pad(i + 1)}
                      </span>
                      {t(`steps.${step.id}.title`)}
                    </h3>
                    <p className="proc-text">{t(`steps.${step.id}.body`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </ProcessTimeline>

        <Reveal className="proc-cta">
          <DrawLine className="proc-cta-rule" />
          <p data-reveal className="proc-cta-lead display">
            {t('ctaLead')}
          </p>
          <div data-reveal className="proc-cta-action">
            <DemoCta origin="process" className="btn btn-primary w-full sm:w-auto" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StepMeta({ step }: { step: ProcessStep }) {
  const t = useTranslations('process');
  const locale = useLocale() as Locale;

  if (step.meta === 'hours') {
    return (
      <p className="proc-meta proc-meta--time">
        <span className="sr-only">{t('durationLabel')}: </span>
        <CountUp value={step.hours} locale={locale} duration={1.2} className="proc-meta-value" />
        <span className="proc-meta-unit">{t('hoursUnit')}</span>
      </p>
    );
  }
  if (step.meta === 'maintenance') {
    return (
      <p className="proc-meta">
        <span>
          {t('from')}&nbsp;
          <Money usd={MAINTENANCE_FROM_USD} className="text-fg" />
          {t('perMonth')}
        </span>
      </p>
    );
  }
  return <p className="proc-meta">{t(`steps.${step.id}.meta`)}</p>;
}
