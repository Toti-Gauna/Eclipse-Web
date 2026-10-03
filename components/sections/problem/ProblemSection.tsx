import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { LightSweep } from '@/components/motion/LightSweep';
import { Reveal } from '@/components/motion/Reveal';
import { SectionMark } from '@/components/ui/SectionMark';
import { LossCalculator } from './LossCalculator';
import './problem.css';

/**
 * 02 · "¿Cuánto te cuesta no tener esto?" — the visitor completes a sentence with their
 * own numbers and reads the monthly loss on an instrument, in their currency.
 * Follows the vertical chosen in the hero. Lit from the right (the readout side).
 */
export function ProblemSection() {
  const t = useTranslations('problem');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.problem}
      aria-labelledby="problem-title"
      className="problem theme-dark relative isolate overflow-clip bg-night py-20 md:py-32"
    >
      <div aria-hidden className="problem-light pointer-events-none absolute inset-0 -z-10" />
      <div className="container-x">
        <Reveal start="top 80%">
          <LossCalculator
            header={
              <header className="calc-head">
                <SectionMark section="problem" className="calc-mark" />
                <h2 id="problem-title" data-reveal className="display calc-title">
                  <LightSweep className="calc-sweep">{t.rich('title', { em })}</LightSweep>
                </h2>
                <p data-reveal className="calc-sub">
                  {t('sub')}
                </p>
              </header>
            }
          />
        </Reveal>
      </div>
    </section>
  );
}
