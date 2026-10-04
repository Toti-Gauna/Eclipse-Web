import './process.css';
import { useTranslations } from 'next-intl';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { DrawLine } from '@/components/motion/DrawLine';
import { Reveal } from '@/components/motion/Reveal';
import { DemoCta } from '@/components/ui/DemoCta';
import { SectionMark } from '@/components/ui/SectionMark';
import { ProcessSteps } from './ProcessSteps';
import { DEMO_HOURS } from './steps';

/**
 * 06 · Cómo trabajamos (v3, light): the five steps as a compact ledger — number,
 * phase glyph, name and how long it takes — with the detail one tap away on phones
 * and in its column on desktop. Two phases make the order explicit: the demo and the
 * proposal come first; the project starts with the seña. Static (no scroll scrub).
 * Times come from steps.ts and the maintenance price from /content.
 */
export function ProcessSection() {
  const t = useTranslations('process');

  return (
    <section
      id={SECTION_IDS.process}
      aria-labelledby="process-title"
      data-header-theme="light"
      className="process theme-light relative isolate overflow-hidden bg-dawn py-20 md:py-28"
    >
      <div className="container-x">
        <Reveal className="proc-head">
          <div data-reveal>
            <SectionMark section="process" />
          </div>
          <h2 id="process-title" data-reveal className="proc-h2 display">
            {t('title')}
          </h2>
          <p data-reveal className="proc-sub">
            {t('sub', { hours: DEMO_HOURS })}
          </p>
        </Reveal>

        <Reveal className="proc-body" start="top 88%">
          <div data-reveal>
            <ProcessSteps />
          </div>
        </Reveal>

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
