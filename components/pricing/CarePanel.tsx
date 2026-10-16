'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Check, Gift, Info } from 'lucide-react';
import { annualMonthsCharged, careHoursMonthly, l, maintenancePlans, plans, type ReferralOffer } from '@/lib/content';
import { annualFreeMonths, annualize, formatMoney, type Billing } from '@/lib/pricing';
import { isApproximate } from '@/lib/currency';
import { localeTags, type Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { DrawLine } from '@/components/motion/DrawLine';
import { BillingToggle } from './BillingToggle';
import { PriceReadout } from './PriceReadout';
import { PRICING_ANCHORS } from './anchors';

/**
 * ② Plan mensual: one per project (30/75/150). Each with what it includes and the
 * third-party budget already inside its price; the shared terms (2 h in total, notice at
 * 80 %, no automatic surcharges) and the pack's first months. The annual switch and the
 * referral program only show while those (historical) offers are active.
 */
export function CarePanel({
  billing,
  onBillingChange,
  annualOn,
  referral,
}: {
  billing: Billing;
  onBillingChange: (billing: Billing) => void;
  /** The annual offer is live: show the switch. */
  annualOn: boolean;
  referral: ReferralOffer | null;
}) {
  const t = useTranslations('pricing');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const list = new Intl.ListFormat(localeTags[locale], { style: 'long', type: 'conjunction' });
  const annual = billing === 'annual';
  const period = t(annual ? 'perYear' : 'perMonth');
  const local = isApproximate(currency);
  const packPlan = plans.find((p) => p.careCredit);
  const packCredit = packPlan?.careCredit ? { plan: packPlan, credit: packPlan.careCredit } : null;

  return (
    <div id={PRICING_ANCHORS.care} className="pr-care" role="group" aria-labelledby="pr-care-title">
      <div className="pr-care-head">
        <div>
          <p className="pr-label">{t('care.label')}</p>
          <h3 id="pr-care-title" className="display pr-care-title">
            {t('care.title')}
          </h3>
          <p className="pr-care-text">{t('care.text')}</p>
        </div>
        {annualOn ? <BillingToggle value={billing} onChange={onBillingChange} freeMonths={annualFreeMonths()} className="pr-care-toggle" /> : null}
      </div>

      <ul className="pr-care-plans">
        {maintenancePlans.map((m) => {
          const usd = annual ? annualize(m.priceUsd) : m.priceUsd;
          const suggestedFor = plans.filter((p) => p.maintenance === m.id).map((p) => l(p.name, locale));
          return (
            <li key={m.id} className="pr-care-plan">
              <DrawLine className="pr-care-rule" />
              <h4 className="pr-care-name">{l(m.name, locale)}</h4>
              <p className="pr-care-price">
                <PriceReadout usd={usd} animated className="pr-care-readout" />
                <span className="pr-care-period">{period}</span>
              </p>
              {local || annual ? (
                <p className="pr-care-ref">
                  {local ? `${formatMoney(usd, 'USD', rates, locale)} ${period}` : null}
                  {local && annual ? ' · ' : null}
                  {annual ? t('care.annualNote', { charged: annualMonthsCharged }) : null}
                </p>
              ) : null}
              <p className="pr-care-for">{t('care.budget', { budget: format(m.thirdPartyUsd) })}</p>
              {suggestedFor.length ? <p className="pr-care-for">{t('care.suggestedFor', { plans: list.format(suggestedFor) })}</p> : null}
              <ul className="pr-care-includes">
                {l(m.includes, locale).map((line) => (
                  <li key={line}>
                    <Check aria-hidden strokeWidth={1.75} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="pr-care-notes">
        <p className="pr-care-note">
          <Info aria-hidden strokeWidth={1.5} />
          <span>{t('care.terms', { hours: careHoursMonthly })}</span>
        </p>
        {packCredit ? (
          <p className="pr-care-note">
            <Gift aria-hidden strokeWidth={1.5} />
            <span>
              <strong>{l(packCredit.plan.name, locale)}.</strong>{' '}
              {t('care.packCredit', {
                months: packCredit.credit.months,
                next: packCredit.credit.months + 1,
                list: list.format(
                  maintenancePlans.map(
                    (m) => `${l(m.name, locale)} ${format(Math.max(0, m.priceUsd - packCredit.credit.monthlyUsd))} → ${format(m.priceUsd)}`,
                  ),
                ),
              })}
            </span>
          </p>
        ) : null}
        {referral ? (
          <p className="pr-care-note">
            <Gift aria-hidden strokeWidth={1.5} />
            <span>
              <strong>{l(referral.label, locale)}.</strong> {l(referral.description, locale)}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
