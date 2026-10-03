'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AudioLines, Check, Gift } from 'lucide-react';
import { annualMonthsCharged, l, maintenancePlans, plans, voiceUsage, type ReferralOffer } from '@/lib/content';
import { annualFreeMonths, annualize, formatMoney, type Billing } from '@/lib/pricing';
import { isApproximate } from '@/lib/currency';
import { localeTags, type Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { DrawLine } from '@/components/motion/DrawLine';
import { BillingToggle } from './BillingToggle';
import { PriceReadout } from './PriceReadout';
import { PRICING_ANCHORS } from './anchors';

/**
 * ② Mantenimiento: optional, monthly. The three plans with what each includes, the
 * section's only Mensual/Anual switch (annual = pay `annualMonthsCharged` months, only
 * while the annual offer is live), the voice agent's usage fee (always monthly) and
 * the referral program.
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
          <AudioLines aria-hidden strokeWidth={1.5} />
          <span>
            <strong>{l(voiceUsage.name, locale)}.</strong>{' '}
            {t('care.voice', { price: format(voiceUsage.priceUsd), note: l(voiceUsage.note, locale) })}
          </span>
        </p>
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
