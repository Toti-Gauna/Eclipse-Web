'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown } from 'lucide-react';
import { founders, foundersRemaining, l, type FounderOffer, type VoiceComboOffer } from '@/lib/content';
import { formatMoney, voiceComboPlans } from '@/lib/pricing';
import { localeTags, type Locale } from '@/i18n/routing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { OfferCountdown } from './OfferCountdown';
import { PriceReadout } from './PriceReadout';
import { PRICING_ANCHORS } from './anchors';

/**
 * The two offers on the one-time payment, each explained once with its conditions:
 * the founder price (−20%, opt-in, while slots remain) and the voice combo (the voice
 * agent at a fixed price when the package or the selection qualifies). Real offers
 * only (content/offers.json), never a struck-through price. The caller decides which
 * ones are live.
 */
export function OffersLedger({ founder, combo }: { founder: FounderOffer | null; combo: VoiceComboOffer | null }) {
  const t = useTranslations('pricing.offers');
  const locale = useLocale() as Locale;
  const { rates } = useCurrency();
  if (!founder && !combo) return null;

  const list = new Intl.ListFormat(localeTags[locale], { style: 'long', type: 'disjunction' });
  const listAnd = new Intl.ListFormat(localeTags[locale], { style: 'long', type: 'conjunction' });
  const left = foundersRemaining();
  const comboPlans = combo ? voiceComboPlans(combo) : null;

  return (
    <div id={PRICING_ANCHORS.offers} className="pr-offers" role="group" aria-labelledby="pr-offers-title">
      <h3 id="pr-offers-title" className="pr-label">
        {t('label')}
      </h3>
      <ul className="pr-offer-list">
        {founder ? (
          <li className="pr-offer" data-kind="founder">
            <p aria-hidden className="pr-offer-figure readout">
              −{founder.percentOff}%
            </p>
            <div className="pr-offer-body">
              <h4 className="pr-offer-title">{l(founder.label, locale)}</h4>
              <OfferCountdown endsAt={founder.endsAt} />
              <p className="pr-offer-text">
                {t('founderWhat')} {l(founder.description, locale)}
              </p>
              <p className="pr-offer-text">{t('founderDeal')}</p>
              <p className="pr-offer-how">{t('founderHow')}</p>
              <div className="pr-offer-foot">
                <p className="pr-offer-slots">
                  <span aria-hidden className="pr-slots">
                    {founders.slots.map((slot) => (
                      <i key={slot.id} data-filled={slot.filled || undefined} />
                    ))}
                  </span>
                  {t('founderLeft', { left, total: founders.total })}
                </p>
                <a href={`#${SECTION_IDS.founders}`} className="pr-link">
                  {t('founderCta')}
                  <ArrowDown aria-hidden strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </li>
        ) : null}
        {combo && comboPlans ? (
          <li className="pr-offer" data-kind="combo">
            <p className="pr-offer-figure">
              <PriceReadout usd={combo.priceUsd} />
            </p>
            <div className="pr-offer-body">
              <h4 className="pr-offer-title">{l(combo.label, locale)}</h4>
              <OfferCountdown endsAt={combo.endsAt} />
              <p className="pr-offer-text pr-offer-lead">{t('comboTitle', { price: formatMoney(combo.priceUsd, 'USD', rates, locale) })}</p>
              <p className="pr-offer-text">
                {t('comboText', {
                  plans: list.format(comboPlans.addTo.map((p) => l(p.name, locale))),
                  min: formatMoney(combo.minSubtotalUsd, 'USD', rates, locale),
                })}
              </p>
              {comboPlans.included.length ? (
                <p className="pr-offer-how">
                  {t('comboIncluded', {
                    count: comboPlans.included.length,
                    plans: listAnd.format(comboPlans.included.map((p) => l(p.name, locale))),
                  })}
                </p>
              ) : null}
            </div>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
