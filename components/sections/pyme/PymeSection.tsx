import './pyme.css';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown } from 'lucide-react';
import { lineNeeds } from '@/lib/content';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { SectionMark } from '@/components/ui/SectionMark';

/**
 * 03 · Para tu PyME (#pyme, v3e): where to start, by need — not by product. Three points of
 * departure (empezar → ordenar → crecer; a real sequence, so each carries a growing phase glyph)
 * and which of the five lines each one combines (content/lines.json `needs`). They are
 * orientation, NOT plans: no price, no new offer. The calculator (05) and the prices stay
 * one link away. Copy: `pyme.*`; line names: `offerings.lines.<id>.name`.
 */
export function PymeSection() {
  const t = useTranslations('pyme');
  const to = useTranslations('offerings');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.pyme}
      aria-labelledby="pyme-title"
      className="pyme theme-dark relative isolate overflow-hidden bg-night py-20 md:py-28"
    >
      <div className="container-x">
        <Reveal>
          <SectionMark section="pyme" className="mb-8 md:mb-10" />
          <h2 id="pyme-title" data-reveal className="display pyme-title">
            {t.rich('title', { em })}
          </h2>
          <p data-reveal className="pyme-sub">
            {t('sub')}
          </p>
        </Reveal>

        <Reveal start="top 85%">
          <ol data-reveal className="pyme-needs">
            {lineNeeds.map((need, i) => (
              <li key={need.id} className="pyme-need">
                <p className="pyme-need-name">
                  <PhaseGlyph phase={(i + 1) / lineNeeds.length} size={18} className="pyme-glyph" />
                  <span>{t(`needs.${need.id}.name`)}</span>
                </p>
                <p className="pyme-headline display">{t(`needs.${need.id}.headline`)}</p>
                <p className="pyme-text">{t(`needs.${need.id}.text`)}</p>
                <p className="pyme-combines">
                  <span>{t('combines')}</span> {need.lines.map((id) => to(`lines.${id}.name`)).join(' · ')}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <p className="pyme-links">
          <a href={`#${SECTION_IDS.problem}`} className="pyme-link">
            {t('calcLink')}
            <ArrowDown aria-hidden strokeWidth={1.5} />
          </a>
          <a href={`#${SECTION_IDS.pricing}`} className="pyme-link">
            {t('pricesLink')}
            <ArrowDown aria-hidden strokeWidth={1.5} />
          </a>
        </p>
      </div>
    </section>
  );
}
