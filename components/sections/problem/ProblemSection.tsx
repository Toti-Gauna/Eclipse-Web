import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { LightSweep } from '@/components/motion/LightSweep';
import { Reveal } from '@/components/motion/Reveal';
import { SectionMark } from '@/components/ui/SectionMark';
import { LossCalculator } from './LossCalculator';
import './problem.css';

/**
 * 05 · "¿Cuánto te cuesta no tener esto?" — the opportunity calculator, after Precios on
 * the dawn sky. The visitor completes a sentence with their own numbers and reads the
 * monthly loss in their currency; "Ver la cuenta" unfolds the arithmetic and the
 * assumptions. Follows the vertical chosen anywhere on the page. Warm light from the
 * right (the readout side).
 */
export function ProblemSection() {
  const t = useTranslations('problem');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.problem}
      aria-labelledby="problem-title"
      data-header-theme="light"
      className="problem theme-light relative isolate overflow-clip bg-dawn py-16 md:py-24"
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
