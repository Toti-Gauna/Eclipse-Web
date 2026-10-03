import './process.css';
import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { CountUp } from '@/components/motion/CountUp';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/motion/SectionHeading';
import { DemoCta } from '@/components/ui/DemoCta';
import { Money } from '@/components/ui/Money';
import { maintenancePlans } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { ProcessTimeline } from './ProcessTimeline';
import { DEMO_HOURS, PROCESS_STEPS, type ProcessStep } from './steps';

const MAINTENANCE_FROM_USD = Math.min(...maintenancePlans.map((p) => p.priceUsd));

/**
 * "Cómo trabajamos": five steps, demo first. Horizontal timeline from 1024px,
 * vertical below. The track "lights up" with scroll (see <ProcessTimeline>).
 */
export function ProcessSection() {
  const t = useTranslations('process');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;
  const last = PROCESS_STEPS.length - 1;

  return (
    <section
      id={SECTION_IDS.process}
      aria-labelledby="process-title"
      className="process theme-dark relative isolate overflow-hidden bg-night py-24 md:py-36"
    >
      <div aria-hidden className="process-ambient" />
      <div className="container-x">
        <Reveal>
          <SectionHeading id="process-title" eyebrow={t('eyebrow')} sub={t('sub', { hours: DEMO_HOURS })}>
            {t.rich('title', { em })}
          </SectionHeading>
        </Reveal>

        <ProcessTimeline className="mt-14 md:mt-20 lg:mt-24">
          <Reveal stagger={0.08} start="top 85%">
            <ol className="proc-list">
              {PROCESS_STEPS.map((step, i) => (
                <li key={step.id} data-step data-reveal className="proc-step">
                  {i < last ? (
                    <span aria-hidden className="proc-seg">
                      <span data-fill className="proc-seg-fill" />
                    </span>
                  ) : null}
                  <span aria-hidden data-node className="proc-node">
                    <span className="proc-node-glow" />
                    <span className="proc-node-ring" />
                    <span className="proc-node-disc">
                      <span className="proc-node-num tabular">{String(i + 1).padStart(2, '0')}</span>
                    </span>
                  </span>

                  <div className="proc-body">
                    <h3 className="proc-title display">{t(`steps.${step.id}.title`)}</h3>
                    <StepMeta step={step} />
                    <p className="proc-text">{t(`steps.${step.id}.body`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </ProcessTimeline>

        <Reveal className="mt-16 flex flex-col items-start gap-6 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between md:mt-24">
          <p data-reveal className="display max-w-xl text-[1.75rem] leading-[1.08] sm:text-[2rem]">
            {t('ctaLead')}
          </p>
          <div data-reveal className="w-full sm:w-auto">
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
      <p className="proc-meta proc-meta-time">
        <Clock aria-hidden strokeWidth={1.5} className="size-3.5" />
        <span className="sr-only">{t('durationLabel')}: </span>
        <CountUp value={step.hours} suffix={` ${t('hoursUnit')}`} locale={locale} duration={1.2} />
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
