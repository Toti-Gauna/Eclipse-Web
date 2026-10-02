import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/motion/SectionHeading';
import { LossCalculator } from './LossCalculator';
import './problem.css';

/**
 * "El problema + calculadora": what not automating costs, estimated per month in
 * the visitor's currency. Follows the vertical chosen in the hero.
 */
export function ProblemSection() {
  const t = useTranslations('problem');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.problem}
      aria-labelledby="problem-title"
      className="problem theme-dark relative isolate overflow-hidden bg-night py-24 md:py-36"
    >
      <div aria-hidden className="problem-aura pointer-events-none absolute inset-0 -z-10" />
      <div className="container-x">
        <Reveal>
          <SectionHeading id="problem-title" eyebrow={t('eyebrow')} sub={t('sub')}>
            {t.rich('title', { em })}
          </SectionHeading>
        </Reveal>
        <Reveal className="mt-12 md:mt-16" start="top 85%">
          <LossCalculator />
        </Reveal>
      </div>
    </section>
  );
}
