import './examples.css';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { LightSweep } from '@/components/motion/LightSweep';
import { DrawLine } from '@/components/motion/DrawLine';
import { SectionMark } from '@/components/ui/SectionMark';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { TRAILER_DURATION } from '@/components/trailers/constants';
import { DEMO_HOURS } from '@/components/sections/process/steps';
import { verticals } from '@/lib/content';
import { DemoTheater } from './DemoTheater';

/**
 * 04 · "Sala de demos": every demo business of /content (one per rubro with a
 * demo) in a theater — selector, stage with its trailer, facts and "Abrir demo"
 * (fullscreen modal) — plus "¿No ves tu rubro?" → WhatsApp.
 * Every business here is fictional and labeled "Demo".
 */
export function ExamplesSection() {
  const t = useTranslations('examples');
  // "Lo armamos en 48 h." wraps as one unit instead of leaving "Lo" alone at a line end.
  const emUnit = (chunks: ReactNode) => <em className="inline-block">{chunks}</em>;
  const ids = verticals.filter((v) => v.id !== 'otro' && v.demo && v.business && v.keyNumber).map((v) => v.id);

  const more = (
    <div className="ex-more-card">
      <span aria-hidden className="ex-more-index">
        {String(ids.length + 1).padStart(2, '0')}
      </span>
      <p className="ex-more-title display">{t.rich('notListed.title', { hours: DEMO_HOURS, em: emUnit })}</p>
      <p className="ex-more-body">{t('notListed.body')}</p>
      <WhatsAppLink origin="examples_not_listed" message={t('notListed.message')} className="ex-more-link">
        <span>{t('notListed.cta')}</span>
        <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.6} />
      </WhatsAppLink>
    </div>
  );

  return (
    <section
      id={SECTION_IDS.examples}
      aria-labelledby="examples-title"
      className="examples theme-dark relative isolate overflow-hidden bg-night py-24 md:py-32"
    >
      <div aria-hidden className="examples-ambient" />
      <div className="container-x">
        <Reveal className="ex-head">
          <div data-reveal>
            <SectionMark section="examples" />
          </div>
          <h2 id="examples-title" data-reveal className="ex-title display">
            <LightSweep>{t('title')}</LightSweep>
          </h2>
          <div data-reveal className="ex-sub">
            <DrawLine className="ex-sub-rule" />
            <p>{t('sub', { count: ids.length, seconds: TRAILER_DURATION })}</p>
          </div>
        </Reveal>

        <Reveal start="top 85%" className="mt-12 md:mt-16">
          <div data-reveal>
            <DemoTheater ids={ids} more={more} />
          </div>
        </Reveal>

        <p className="ex-note">{t('note')}</p>
      </div>
    </section>
  );
}
