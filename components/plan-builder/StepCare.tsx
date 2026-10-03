'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Gift, Info } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { annualMonthsCharged, l, maintenancePlans, voiceUsage, type FounderOffer, type MaintenanceId, type Offer, type ReferralOffer } from '@/lib/content';
import { annualize, type Billing, type Quote } from '@/lib/pricing';
import type { PlanState } from '@/lib/plan-url';
import type { Locale } from '@/i18n/routing';
import { Mark, OfferCountdown } from './parts';

/**
 * Step 3 — maintenance + hosting: one billing switch (monthly / yearly) for every
 * option, the suggested level marked, the voice agent's monthly fee explained apart,
 * and the founder price as an opt-in.
 */
export function StepCare({
  state,
  quote: q,
  maintenanceId,
  suggested,
  empty,
  founder,
  annualOffer,
  referral,
  onMaintenance,
  onBilling,
  onFounder,
  headingId,
  Sub,
}: {
  state: PlanState;
  quote: Quote;
  maintenanceId: MaintenanceId | null;
  suggested: MaintenanceId | null;
  empty: boolean;
  founder: { offer: FounderOffer; left: number; total: number } | null;
  annualOffer: Offer | null;
  referral: ReferralOffer | null;
  onMaintenance: (id: MaintenanceId | null) => void;
  onBilling: (billing: Billing) => void;
  onFounder: (on: boolean) => void;
  headingId: string;
  Sub: 'h3' | 'h4';
}) {
  const t = useTranslations('builder');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const uid = useId();
  const annual = state.billing === 'annual' && !!annualOffer;
  const free = 12 - annualMonthsCharged;
  const savedPerYear = q.offers.applied.find((a) => a.kind === 'annualMaintenance')?.savingsPerYearUsd ?? 0;

  return (
    <>
      {annualOffer ? (
        <fieldset className="pb-billing">
          <legend className="sr-only">{t('billingLegend')}</legend>
          {(['monthly', 'annual'] as const).map((b) => (
            <label key={b} className="pb-billing-opt" data-checked={state.billing === b || undefined}>
              <input type="radio" name={`${uid}-billing`} className="sr-only" checked={state.billing === b} onChange={() => onBilling(b)} />
              <span>{b === 'monthly' ? tc('monthly') : tc('annual')}</span>
              {b === 'annual' && free > 0 ? <span className="pb-billing-free">{t('freeMonths', { count: free })}</span> : null}
            </label>
          ))}
        </fieldset>
      ) : null}

      <fieldset className="pb-care" aria-labelledby={headingId}>
        {[null, ...maintenancePlans].map((m) => {
          const id = m?.id ?? null;
          const checked = maintenanceId === id;
          const isSuggested = !empty && suggested === id;
          const price = m ? (annual ? annualize(m.priceUsd) : m.priceUsd) : 0;
          return (
            <label key={id ?? 'none'} className="pb-row pb-care-row" data-checked={checked || undefined}>
              <input type="radio" name={`${uid}-maintenance`} className="sr-only" checked={checked} onChange={() => onMaintenance(id)} />
              <Mark checked={checked} round />
              <span className="pb-row-body">
                <span className="pb-row-name">
                  {m ? l(m.name, locale) : t('maintenanceNone')}
                  {isSuggested ? <span className="pb-tag pb-tag--accent">{t('suggested')}</span> : null}
                </span>
                <span className="pb-row-desc">{m ? l(m.includes, locale).join(' · ') : t('noneDetail')}</span>
              </span>
              <span className="pb-row-price readout">
                {m ? (
                  <>
                    {format(price)}
                    <span className="pb-row-period">{annual ? tc('perYear') : tc('perMonth')}</span>
                  </>
                ) : (
                  <span aria-hidden>—</span>
                )}
              </span>
            </label>
          );
        })}
      </fieldset>

      {annual && savedPerYear > 0 ? <p className="pb-note pb-note--accent">{t('annualApplied', { amount: format(savedPerYear) })}</p> : null}

      {q.maintenance.voiceUsageMonthlyUsd > 0 ? (
        <p className="pb-note">
          <Info aria-hidden className="pb-note-icon" strokeWidth={1.5} />
          <span>{t('voiceNote', { price: format(q.maintenance.voiceUsageMonthlyUsd), note: l(voiceUsage.note, locale) })}</span>
        </p>
      ) : null}

      {founder ? (
        <section className="pb-offer" aria-labelledby={`${uid}-founder`}>
          <Sub id={`${uid}-founder`} className="pb-subhead label">
            <span>{t('founderTitle')}</span>
            <span aria-hidden className="pb-subhead-rule" />
          </Sub>
          <label className="pb-row pb-switch-row" data-checked={state.founder || undefined}>
            <input
              type="checkbox"
              role="switch"
              className="sr-only"
              checked={state.founder}
              onChange={(e) => onFounder(e.currentTarget.checked)}
              aria-describedby={`${uid}-founder-desc`}
            />
            <span aria-hidden className="pb-switch" data-checked={state.founder || undefined} />
            <span className="pb-row-body">
              <span className="pb-row-name">{t('founderToggle', { pct: founder.offer.percentOff })}</span>
              <span id={`${uid}-founder-desc`} className="pb-row-desc">
                {l(founder.offer.description, locale)} {t('founderDeal')} <span className="text-fg">{t('founderLeft', { left: founder.left, total: founder.total })}</span>
              </span>
              <OfferCountdown endsAt={founder.offer.endsAt} />
            </span>
          </label>
        </section>
      ) : null}

      {referral ? (
        <p className="pb-note">
          <Gift aria-hidden className="pb-note-icon" strokeWidth={1.5} />
          <span>
            <span className="text-fg">{t('referralTitle')}.</span> {l(referral.description, locale)} <OfferCountdown endsAt={referral.endsAt} />
          </span>
        </p>
      ) : null}
    </>
  );
}
