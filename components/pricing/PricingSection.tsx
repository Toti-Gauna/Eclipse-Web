'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { foundersRemaining, offers, type FounderOffer, type Offer, type ReferralOffer, type VoiceComboOffer } from '@/lib/content';
import { annualFreeMonths, type Billing } from '@/lib/pricing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { Reveal } from '@/components/motion/Reveal';
import { Occult } from '@/components/motion/Occult';
import { SectionMark } from '@/components/ui/SectionMark';
import { PayLedger } from './PayLedger';
import { BuyTabs } from './BuyTabs';
import { OffersLedger } from './OffersLedger';
import { CarePanel } from './CarePanel';
import { RateNote } from './RateNote';
import { offerLive, useNow } from './useNow';
import './pricing.css';

const offerOf = <K extends Offer['kind']>(kind: K) => offers.find((o) => o.kind === kind) as Extract<Offer, { kind: K }> | undefined;

/**
 * 04 · Precios (v3). Everything a buyer needs stays on the surface, in this order:
 *   the currency, the rate of the day and what "≈" means (RateNote, beside the title)
 *   → two ways to buy as tabs: A · Paquetes (7) compared field by field /
 *     B · Pieza por pieza (16) with the builder
 *   → maintenance (optional, the page's only Mensual/Anual switch, voice usage, referrals)
 *   → the live offers with their real conditions
 *   → how you pay (① project once · ② maintenance monthly · ③ extras) and the footnotes.
 * Every number comes from /content through lib/pricing; prices are shown in the active
 * currency with "≈" when converted and the USD reference beside them.
 */
export function PricingSection() {
  const t = useTranslations('pricing');
  const tc = useTranslations('currency');
  const now = useNow();
  const [billing, setBilling] = useState<Billing>('monthly');
  const [announcement, setAnnouncement] = useState('');

  const founder = offerOf('founder');
  const combo = offerOf('voiceCombo');
  const annual = offerOf('annualMaintenance');
  const referral = offerOf('referral');

  const founderOffer: FounderOffer | null = founder && offerLive(founder, now) && foundersRemaining() > 0 ? founder : null;
  const comboOffer: VoiceComboOffer | null = combo && offerLive(combo, now) ? combo : null;
  const referralOffer: ReferralOffer | null = referral && offerLive(referral, now) ? referral : null;
  const annualOn = offerLive(annual, now);
  // Without the annual offer there is no yearly billing at all.
  const effectiveBilling: Billing = annualOn ? billing : 'monthly';

  const changeBilling = (next: Billing) => {
    setBilling(next);
    setAnnouncement(
      t('care.live', {
        billing: t(`billing.${next}`).toLowerCase(),
        period: t(next === 'annual' ? 'perYear' : 'perMonth'),
      }),
    );
  };

  return (
    <section
      id={SECTION_IDS.pricing}
      aria-labelledby="pricing-title"
      data-header-theme="light"
      className="pricing theme-light relative isolate overflow-hidden bg-dawn py-24 md:py-36"
    >
      <div aria-hidden className="pricing-light" />

      <div className="container-x">
        <Reveal>
          <SectionMark section="pricing" className="mb-8 md:mb-10" />
          <div className="pr-head">
            <div className="pr-head-main">
              <Occult as="h2" id="pricing-title" from="left" className="display pr-title">
                {t.rich('title', { br: () => <br /> })}
              </Occult>
              <p data-reveal className="pr-sub">
                {t('sub')}
              </p>
            </div>
            {/* Currency, rate of the day and the "≈" rule: next to the title, before any price. */}
            <div data-reveal className="pr-head-side">
              <RateNote />
            </div>
          </div>
        </Reveal>

        <Reveal className="pr-block pr-block--tabs" start="top 85%">
          <div data-reveal>
            <BuyTabs billing={effectiveBilling} now={now} />
          </div>
        </Reveal>

        <Reveal className="pr-block">
          <div data-reveal>
            <CarePanel billing={effectiveBilling} onBillingChange={changeBilling} annualOn={annualOn} referral={referralOffer} />
          </div>
        </Reveal>

        {founderOffer || comboOffer ? (
          <Reveal className="pr-block">
            <div data-reveal>
              <OffersLedger founder={founderOffer} combo={comboOffer} />
            </div>
          </Reveal>
        ) : null}

        <Reveal className="pr-block">
          <div data-reveal>
            <PayLedger freeMonths={annualOn ? annualFreeMonths() : null} />
          </div>
        </Reveal>

        <div className="pr-notes">
          <p>{t('notes.from')}</p>
          <p>{tc('notice')}</p>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
