import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SectionMark } from '@/components/ui/SectionMark';
import { AGENCY_TOC, SECTION_IDS } from '@/components/layout/navLinks';
import { UnitEmblem } from './UnitEmblem';
import '@/components/sections/products/products.css';
import './units.css';

/**
 * 01 · Eclipse Agency (#agency): the top of /agency/, where the v3 landing lives now (decision of
 * Ignacio, 28/10/2026). The approved line of the Agency line (offerings.lines.agency), the way to
 * the contact block (the page's solid amber, [data-page-cta]) and a short index of the sections
 * below — the header lists the units, not these sections, any more.
 */
export function AgencyIntro() {
  const t = useTranslations('units.agency');
  const tn = useTranslations('nav');
  const tl = useTranslations('sections.labels');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;
  return (
    <section
      id={SECTION_IDS.agency}
      aria-labelledby="unit-title"
      data-unit="agency"
      className="u-hero theme-dark grain relative isolate overflow-clip bg-void"
    >
      <div aria-hidden className="u-hero-light" />
      <div className="container-x u-hero-grid">
        <div className="u-hero-copy">
          <SectionMark section="agency" />
          <h1 id="unit-title" className="u-h1">
            <span className="u-h1-pre">Eclipse</span> <span className="display u-h1-name">{tn('agency')}</span>
          </h1>
          <p className="display u-statement">{t.rich('title', { em })}</p>
          <p className="u-lead">{t('lead')}</p>
          <div data-page-cta className="u-cta">
            <a href={`#${SECTION_IDS.agent}`} className="btn btn-primary">
              {t('contact')}
            </a>
          </div>
          <nav aria-labelledby="agency-toc" className="u-toc">
            <p id="agency-toc" className="label">
              {t('tocLabel')}
            </p>
            <ul className="u-toc-list">
              {AGENCY_TOC.map((key) => (
                <li key={key}>
                  <a href={`#${SECTION_IDS[key]}`} className="u-toc-link">
                    {tl(key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <UnitEmblem id="agency" />
      </div>
    </section>
  );
}
