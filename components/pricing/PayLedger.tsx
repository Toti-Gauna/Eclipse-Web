'use client';

import { useTranslations } from 'next-intl';
import { ArrowUp } from 'lucide-react';
import { lowestMaintenance } from '@/lib/pricing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { DrawLine } from '@/components/motion/DrawLine';
import { Occult } from '@/components/motion/Occult';
import { PRICING_ANCHORS } from './anchors';

type Rhythm = 'once' | 'monthly' | 'extras';

// Every target sits above: the ledger closes the section as its conditions.
const ENTRIES: { key: 'project' | 'care' | 'extras'; rhythm: Rhythm; href: string }[] = [
  { key: 'project', rhythm: 'once', href: `#${PRICING_ANCHORS.packages}` },
  { key: 'care', rhythm: 'monthly', href: `#${PRICING_ANCHORS.care}` },
  { key: 'extras', rhythm: 'extras', href: `#${SECTION_IDS.services}` },
];

/**
 * "Cómo se paga" (the section's conditions, v3: after packages, maintenance and
 * offers): the pricing model as one time axis. ① the project is paid once (one
 * mark), ② maintenance is a monthly, optional rhythm (ticks), ③ extras land
 * whenever you want (loose marks). On desktop the three rails join into one line.
 */
export function PayLedger({ freeMonths }: { freeMonths: number | null }) {
  const t = useTranslations('pricing.how');
  const { format } = useCurrency();
  const low = lowestMaintenance();

  return (
    <div className="pr-how" role="group" aria-labelledby="pr-how-title">
      <h3 id="pr-how-title" className="pr-label">
        {t('label')}
      </h3>
      <ol className="pr-how-list">
        {ENTRIES.map((entry, i) => {
          let text = t(`${entry.key}.text`, { price: low ? format(low.priceUsd) : '' });
          if (entry.key === 'care' && freeMonths) text = `${text} ${t('care.annual', { months: freeMonths })}`;
          return (
            <li key={entry.key} className="pr-how-item" data-rhythm={entry.rhythm}>
              {/* Desktop: one horizontal time axis across the three columns. */}
              <span aria-hidden className="pr-rail">
                <DrawLine className="pr-rail-line" delay={i * 0.18} duration={1.1} />
                {entry.rhythm === 'once' ? <i className="pr-rail-dot" /> : null}
                {entry.rhythm === 'monthly' ? (
                  <Occult as="i" from="left" delay={0.3 + i * 0.18} duration={1.2} className="pr-rail-ticks">
                    {null}
                  </Occult>
                ) : null}
                {entry.rhythm === 'extras' ? (
                  <>
                    <i className="pr-rail-diamond" style={{ left: '28%' }} />
                    <i className="pr-rail-diamond" style={{ left: '66%' }} />
                    <i className="pr-rail-arrow" />
                  </>
                ) : null}
              </span>
              {/* Phones: the same axis runs down the left edge, through the numbered stations. */}
              <span aria-hidden className="pr-rail-y">
                <DrawLine axis="y" className="pr-rail-y-line" delay={i * 0.18} duration={1.1} />
                {entry.rhythm === 'monthly' ? (
                  <Occult as="i" from="top" delay={0.3} duration={1.2} className="pr-rail-y-ticks">
                    {null}
                  </Occult>
                ) : null}
                {entry.rhythm === 'extras' ? (
                  <>
                    <i className="pr-rail-diamond pr-rail-y-d1" />
                    <i className="pr-rail-diamond pr-rail-y-d2" />
                    <i className="pr-rail-y-arrow" />
                  </>
                ) : null}
              </span>
              <span aria-hidden className="pr-how-index">
                {i + 1}
              </span>
              <h4 className="pr-how-title">{t(`${entry.key}.title`)}</h4>
              <p className="pr-how-when">{t(`${entry.key}.when`)}</p>
              <p className="pr-how-text">{text}</p>
              <a href={entry.href} className="pr-link">
                {t(`${entry.key}.link`)}
                <ArrowUp aria-hidden strokeWidth={1.5} />
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
