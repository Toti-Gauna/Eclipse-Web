'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Check, Info } from 'lucide-react';
import { careHoursMonthly, l, maintenancePlans } from '@/lib/content';
import { formatMoney } from '@/lib/pricing';
import { isApproximate } from '@/lib/currency';
import type { Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { DrawLine } from '@/components/motion/DrawLine';
import { PotenciarCta } from '@/components/ui/PotenciarCta';
import { PriceReadout } from './PriceReadout';
import { PRICING_ANCHORS } from './anchors';
import './monthly.css';

/**
 * Tab A · Planes mensuales (lote 2.2b): the three monthly plans as a ledger. Every plan shows the same
 * fields in the same place — price, para quién, third-party budget, human hours, Studio, Academy,
 * what it includes — so they compare at a glance, and the hours and the budget are read BEFORE the
 * action. Desktop aligns the rows across columns (subgrid); phones stack one block per plan.
 * Everything comes from content/maintenance.json; a field a plan does not bring says so.
 */
export function MonthlyPlans() {
  const t = useTranslations('pricing');
  const tsel = useTranslations('selector');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const local = isApproximate(currency);
  const none = t('monthly.none');

  return (
    <div id={PRICING_ANCHORS.care} className="pr-mp" role="group" aria-labelledby="pr-mp-title">
      <div className="pr-mp-head">
        <p className="pr-label">{t('care.label')}</p>
        <h3 id="pr-mp-title" className="display pr-mp-title">
          {t('care.title')}
        </h3>
        <p className="pr-mp-text">{t('care.text')}</p>
      </div>

      <ul className="pr-mp-plans">
        {maintenancePlans.map((m) => {
          const studio = l(m.studio, locale);
          const academy = l(m.academy, locale);
          return (
            <li key={m.id} id={`plan-${m.id}`} className="pr-mp-plan" data-plan={m.id}>
              <div className="pr-mp-top">
                <DrawLine className="pr-mp-rule" />
                <h4 className="pr-mp-name">{l(m.name, locale)}</h4>
                <p className="pr-mp-price">
                  <PriceReadout usd={m.priceUsd} animated className="pr-mp-readout" />
                  <span className="pr-mp-period">{t('perMonth')}</span>
                </p>
                {local ? <p className="pr-mp-ref">{`${formatMoney(m.priceUsd, 'USD', rates, locale)} ${t('perMonth')}`}</p> : null}
              </div>

              <p className="pr-mp-row">
                <span className="pr-mp-label">{t('plan.audienceLabel')}</span>
                <span className="pr-mp-value">{l(m.audience, locale)}</span>
              </p>
              <p className="pr-mp-row">
                <span className="pr-mp-label">{t('monthly.labels.third')}</span>
                <span className="pr-mp-value readout">{t('monthly.thirdValue', { budget: format(m.thirdPartyUsd) })}</span>
              </p>
              <p className="pr-mp-row">
                <span className="pr-mp-label">{t('monthly.labels.hours')}</span>
                <span className="pr-mp-value readout">{t('monthly.hoursValue', { hours: careHoursMonthly })}</span>
              </p>
              <p className="pr-mp-row" data-empty={studio ? undefined : ''}>
                <span className="pr-mp-label">{t('monthly.labels.studio')}</span>
                <span className="pr-mp-value">{studio ?? none}</span>
              </p>
              <p className="pr-mp-row" data-empty={academy ? undefined : ''}>
                <span className="pr-mp-label">{t('monthly.labels.academy')}</span>
                <span className="pr-mp-value">{academy ?? none}</span>
              </p>
              <div className="pr-mp-row">
                <span className="pr-mp-label">{t('plan.includes')}</span>
                <ul className="pr-mp-includes">
                  {l(m.includes, locale).map((line) => (
                    <li key={line}>
                      <Check aria-hidden strokeWidth={1.75} />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pr-mp-foot">
        <p className="pr-mp-note">
          <Info aria-hidden strokeWidth={1.5} />
          <span>{t('care.terms', { hours: careHoursMonthly })}</span>
        </p>
        <PotenciarCta origin="pricing" className="btn btn-sm pr-btn-ghost pr-mp-cta">
          {tsel('cta')}
          <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
        </PotenciarCta>
      </div>
    </div>
  );
}
