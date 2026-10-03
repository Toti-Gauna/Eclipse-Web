'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { annualMonthsCharged, featuredPlanId, foundersRemaining, offers, plans, type Offer } from '@/lib/content';
import type { Billing } from '@/lib/pricing';
import { localeTags, type Locale } from '@/i18n/routing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { SectionHeading } from '@/components/motion/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { BuildPlanButton } from '@/components/ui/BuildPlanButton';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { BillingToggle } from './BillingToggle';
import { FounderBanner, OfferNote } from './Offers';
import { MaintenanceOverview } from './MaintenanceOverview';
import { PlanCard } from './PlanCard';
import { PlansCarousel } from './PlansCarousel';
import { offerLive, useNow } from './useNow';
import './pricing.css';

const offerOf = <K extends Offer['kind']>(kind: K) => offers.find((o) => o.kind === kind) as Extract<Offer, { kind: K }> | undefined;

/**
 * "Precios" (#precios): plan cards with live add-ons and maintenance, the real
 * offers, and the maintenance overview. Every number comes from /content via
 * lib/pricing; amounts are formatted in the active currency.
 */
export function PricingSection() {
  const t = useTranslations('pricing');
  const tc = useTranslations('currency');
  const locale = useLocale() as Locale;
  const { currency, rates } = useCurrency();
  const now = useNow();
  const [billing, setBilling] = useState<Billing>('monthly');
  const [announcement, setAnnouncement] = useState('');
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>;

  const founder = offerOf('founder');
  const combo = offerOf('voiceCombo');
  const annual = offerOf('annualMaintenance');
  const referral = offerOf('referral');

  const founderOffer = founder && offerLive(founder, now) && foundersRemaining() > 0 ? founder : null;
  const comboOffer = combo && offerLive(combo, now) ? combo : null;
  const annualOn = offerLive(annual, now);
  // Without the annual offer there is no yearly billing at all.
  const effectiveBilling: Billing = annualOn ? billing : 'monthly';
  const freeMonths = annualOn ? 12 - annualMonthsCharged : null;
  const careOffers: Offer[] = [];
  if (annual && annualOn) careOffers.push(annual);
  if (referral && offerLive(referral, now)) careOffers.push(referral);

  const rateDate = new Intl.DateTimeFormat(localeTags[locale], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${rates.updatedAt}T12:00:00Z`),
  );

  return (
    <section
      id={SECTION_IDS.pricing}
      aria-labelledby="pricing-title"
      data-header-theme="light"
      className="theme-light relative isolate overflow-hidden bg-dawn py-24 md:py-36"
    >
      <div aria-hidden className="pricing-glow" />

      <div className="container-x">
        <Reveal>
          <SectionHeading id="pricing-title" eyebrow={t('eyebrow')} sub={t('subtitle')}>
            {t.rich('title', { em })}
          </SectionHeading>
        </Reveal>

        {founderOffer || comboOffer ? (
          <Reveal className="mt-10 md:mt-14">
            <p data-reveal className="eyebrow mb-4">
              {t('offers.label')}
            </p>
            <div className={`grid gap-3 ${founderOffer && comboOffer ? 'lg:grid-cols-[1.7fr_1fr]' : ''}`}>
              {founderOffer ? (
                <div data-reveal>
                  <FounderBanner offer={founderOffer} />
                </div>
              ) : null}
              {comboOffer ? (
                <div data-reveal className="flex items-center rounded-card border border-dashed border-line-strong p-5 sm:p-6">
                  <OfferNote offer={comboOffer} />
                </div>
              ) : null}
            </div>
          </Reveal>
        ) : null}

        <Reveal className="mt-10 flex flex-col gap-4 border-t border-line pt-8 lg:flex-row lg:items-center lg:justify-between">
          {freeMonths !== null ? (
            <div data-reveal>
              <BillingToggle value={effectiveBilling} onChange={setBilling} freeMonths={freeMonths} />
            </div>
          ) : null}
          <p data-reveal className="max-w-md text-xs leading-relaxed text-pretty text-fg-muted lg:text-right">
            {tc('notice')}
            {currency !== 'USD' ? (
              <span className="block tabular">{tc(rates.source === 'live' ? 'source' : 'sourceFallback', { date: rateDate })}</span>
            ) : null}
          </p>
        </Reveal>
      </div>

      <div className="mt-6">
        <PlansCarousel plans={plans} featuredId={featuredPlanId}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              featured={plan.id === featuredPlanId}
              billing={effectiveBilling}
              now={now}
              onAnnounce={setAnnouncement}
            />
          ))}
        </PlansCarousel>
      </div>

      <div className="container-x">
        <Reveal className="mt-10 md:mt-14">
          <div
            data-reveal
            className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between md:p-8"
          >
            <div>
              <p className="display text-3xl md:text-4xl">{t('build.title')}</p>
              <p className="mt-2 text-fg-muted">{t('build.text')}</p>
            </div>
            <BuildPlanButton source="pricing" className="btn plan-cta-ink shrink-0">
              {t('build.cta')}
            </BuildPlanButton>
          </div>
          <p data-reveal className="mt-4 text-xs leading-relaxed text-fg-muted">
            {t('build.note')}
          </p>
        </Reveal>

        <MaintenanceOverview billing={effectiveBilling} onBillingChange={setBilling} freeMonths={freeMonths} offers={careOffers} />
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
