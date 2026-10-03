import './services.css';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown } from 'lucide-react';
import { items } from '@/lib/content';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { Occult } from '@/components/motion/Occult';
import { SectionMark } from '@/components/ui/SectionMark';
import { ServicesIndex } from './ServicesIndex';
import { FAMILIES } from './services';

/**
 * 03 · "Qué construimos": the catalog of pieces. Six families (the item categories
 * of content/items.json) as an index list with a live preview; every piece shows
 * its single price ("pieza suelta", pago único), the packages that already include
 * it, and opens "Armá tu plan" with it.
 */
export function ServicesSection() {
  const t = useTranslations('services');
  const em = (chunks: ReactNode) => <em>{chunks}</em>;

  return (
    <section
      id={SECTION_IDS.services}
      aria-labelledby="services-title"
      className="services theme-dark relative isolate overflow-hidden bg-night py-24 md:py-36"
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
              {t('sub', { families: FAMILIES.length, count: items.length })}
            </p>
            <dl data-reveal className="svc-key">
              <div>
                <dt>{t('key.pieceTerm')}</dt>
                <dd>{t('key.pieceText')}</dd>
              </div>
              <div>
                <dt>{t('key.includedTerm')}</dt>
                <dd>
                  {t('key.includedText')}{' '}
                  <a href={`#${SECTION_IDS.pricing}`} className="svc-key-link">
                    {t('key.includedLink')}
                    <ArrowDown aria-hidden strokeWidth={1.5} />
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </Reveal>

        <Reveal start="top 85%" className="mt-12 md:mt-16">
          <div data-reveal>
            <ServicesIndex />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
