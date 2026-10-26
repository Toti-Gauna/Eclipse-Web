import './services.css';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ChevronDown } from 'lucide-react';
import { sellableItems as items, sellablePlans } from '@/lib/content';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { Occult } from '@/components/motion/Occult';
import { SectionMark } from '@/components/ui/SectionMark';
import { LinesIndex } from './LinesIndex';
import { ServicesIndex } from './ServicesIndex';
import { FAMILIES } from './services';

/**
 * 02 · Qué ofrecemos (#servicios, v3e): the five lines of Eclipse (SaaS, Agency, Studio, Academy,
 * Equipamiento; Intelligence runs through all of them) as an index with one line open at a
 * time. The six families and 20 pieces that this section used to be ("Lo que construimos,
 * pieza por pieza") are folded below in a native <details>: nothing was removed, it is one
 * click away and keyboard-reachable. No prices here: pieces are priced and added only in
 * 05 · Precios (tab «Pieza por pieza») and in the builder.
 * `overflow-clip` (not hidden) clips the light without breaking the sticky stage.
 */
export function ServicesSection() {
  const t = useTranslations('offerings');
  const ts = useTranslations('services');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.services}
      aria-labelledby="services-title"
      className="services theme-dark relative isolate overflow-clip bg-night py-24 md:py-36 lg:pt-24"
    >
      <div aria-hidden className="services-light" />
      <div className="container-x">
        <Reveal>
          <SectionMark section="services" className="mb-8 md:mb-10" />
          <Occult as="h2" id="services-title" from="left" className="display svc-title">
            {t.rich('title', { em })}
          </Occult>
          <div className="svc-intro">
            <p data-reveal className="svc-sub">
              {t('sub')}
            </p>
          </div>
        </Reveal>

        <Reveal start="top 85%">
          <div data-reveal>
            <LinesIndex />
            <p className="off-intelligence">
              <span className="off-intelligence-name">{t('intelligence.name')}</span>
              <span className="off-intelligence-text">{t('intelligence.text')}</span>
            </p>
          </div>
        </Reveal>

        <details className="off-pieces">
          <summary className="off-pieces-toggle">
            <span>{t('piecesToggle', { count: items.length })}</span>
            <ChevronDown aria-hidden strokeWidth={1.5} />
          </summary>
          <div className="off-pieces-body">
            <div className="svc-intro">
              <p className="svc-sub">{ts('sub', { families: FAMILIES.length, count: items.length })}</p>
              <dl className="svc-key">
                <div>
                  <dt>{ts('key.pieceTerm')}</dt>
                  <dd>{ts('key.pieceText')}</dd>
                </div>
                {sellablePlans.length ? (
                  <div>
                    <dt>{ts('key.includedTerm')}</dt>
                    <dd>
                      {ts('key.includedText')}{' '}
                      <a href={`#${SECTION_IDS.pricing}`} className="svc-key-link">
                        {ts('key.includedLink')}
                        <ArrowDown aria-hidden strokeWidth={1.5} />
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <div className="mt-12 md:mt-16">
              <ServicesIndex />
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
