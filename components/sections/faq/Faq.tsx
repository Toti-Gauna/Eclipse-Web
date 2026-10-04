'use client';

import type { ReactNode, SyntheticEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUp, Plus } from 'lucide-react';
import {
  annualMonthsCharged,
  founders,
  foundersRemaining,
  l,
  maintenancePlans,
  offers,
  voiceUsage,
  type AnnualOffer,
  type FounderOffer,
  type ReferralOffer,
} from '@/lib/content';
import { founderOfferOpen, foundersState } from '@/lib/founders';
import { formatRate } from '@/lib/pricing';
import { localeTags, type Locale } from '@/i18n/routing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { offerLive, useNow } from '@/components/pricing/useNow';
import { useSound } from '@/components/sound/SoundContext';
import { DEMO_HOURS } from '@/components/sections/process/steps';
import './faq.css';

const founderOffer = offers.find((o) => o.kind === 'founder') as FounderOffer | undefined;
const annualOffer = offers.find((o) => o.kind === 'annualMaintenance') as AnnualOffer | undefined;
const referralOffer = offers.find((o) => o.kind === 'referral') as ReferralOffer | undefined;

/** Question ids, in display order. The question is `faq.items.<id>`; the answer is existing copy. */
export const FAQ_IDS = ['demo', 'start', 'from', 'currency', 'pieces', 'maintenance', 'voice', 'annual', 'founder', 'referral'] as const;
export type FaqId = (typeof FAQ_IDS)[number];

/**
 * Preguntas frecuentes. Only the questions are new copy (`faq.items.<id>`): every
 * answer is composed of messages and /content that the site already shows
 * (process, pricing, currency, services, offers, maintenance), so nothing here can
 * promise more than the rest of the page. Offer answers only appear while that
 * offer is live. Native <details>: works before hydration and with the keyboard.
 *
 * Sources per answer (keep in sync if the copy moves):
 *   demo        process.sub · process.steps.demo.body
 *   start       process.steps.call.body · process.steps.build.body
 *   from        pricing.how.project.title/when · pricing.notes.from
 *   currency    currency.notice · pricing.rate.note · pricing.rate.value + currency.source(Fallback)
 *   pieces      services.key.pieceText · pricing.ways.bundles.text · pricing.how.extras.text
 *   maintenance pricing.care.label · pricing.care.text · content/maintenance.json plans
 *   voice       content/maintenance.json voiceUsage · pricing.care.voice
 *   annual      content/offers.json annual.description · pricing.care.annualNote
 *   founder     pricing.offers.founderWhat · offers.json founder.description · pricing.offers.founderDeal/founderHow/founderLeft
 *   referral    content/offers.json referral.description
 */
export function Faq({ className = '' }: { className?: string }) {
  const t = useTranslations('faq');
  const tp = useTranslations('pricing');
  const tpr = useTranslations('process');
  const ts = useTranslations('services');
  const tc = useTranslations('currency');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const { play } = useSound();
  const now = useNow();

  const founderOpen = founderOfferOpen(founderOffer, foundersState(), now === null ? null : new Date(now));
  const date = new Intl.DateTimeFormat(localeTags[locale], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${rates.updatedAt}T12:00:00Z`),
  );

  const answers: Record<FaqId, ReactNode | null> = {
    demo: (
      <>
        <p>{tpr('sub', { hours: DEMO_HOURS })}</p>
        <p>{tpr('steps.demo.body')}</p>
      </>
    ),
    start: (
      <>
        <p>{tpr('steps.call.body')}</p>
        <p>{tpr('steps.build.body')}</p>
      </>
    ),
    from: (
      <>
        <p className="faq-tag">
          {tp('how.project.title')} · {tp('how.project.when')}
        </p>
        <p>{tp('notes.from')}</p>
      </>
    ),
    currency: (
      <>
        <p>{tc('notice')}</p>
        <p>{tp('rate.note')}</p>
        {currency !== 'USD' ? (
          <p className="faq-tag">
            {tp('rate.value', { rate: formatRate(currency, rates, locale) })} · {tc(rates.source === 'live' ? 'source' : 'sourceFallback', { date })}
          </p>
        ) : null}
      </>
    ),
    pieces: (
      <>
        <p>{ts('key.pieceText')}</p>
        <p>{tp('ways.bundles.text')}</p>
        <p>{tp('how.extras.text')}</p>
      </>
    ),
    maintenance: (
      <>
        <p className="faq-tag">{tp('care.label')}</p>
        <p>{tp('care.text')}</p>
        <ul className="faq-list">
          {maintenancePlans.map((m) => (
            <li key={m.id}>
              <span className="faq-list-head">
                <strong>{l(m.name, locale)}</strong> · {format(m.priceUsd)} {tp('perMonth')}
              </span>
              <span className="faq-list-text">{l(m.includes, locale).join(' · ')}</span>
            </li>
          ))}
        </ul>
      </>
    ),
    voice: (
      <p>
        <strong>{l(voiceUsage.name, locale)}.</strong> {tp('care.voice', { price: format(voiceUsage.priceUsd), note: l(voiceUsage.note, locale) })}
      </p>
    ),
    annual:
      annualOffer && offerLive(annualOffer, now) ? (
        <>
          <p>{l(annualOffer.description, locale)}</p>
          <p className="faq-tag">{tp('care.annualNote', { charged: annualMonthsCharged })}</p>
        </>
      ) : null,
    founder:
      founderOpen && founderOffer ? (
        <>
          <p>
            <strong>{l(founderOffer.label, locale)}.</strong> {tp('offers.founderWhat')} {l(founderOffer.description, locale)}
          </p>
          <p>{tp('offers.founderDeal')}</p>
          <p>{tp('offers.founderHow')}</p>
          <p className="faq-tag">{tp('offers.founderLeft', { left: foundersRemaining(), total: founders.total })}</p>
          <p>
            <a href={`#${SECTION_IDS.founders}`} className="faq-link">
              {tp('offers.founderCta')}
              <ArrowUp aria-hidden strokeWidth={1.5} />
            </a>
          </p>
        </>
      ) : null,
    referral:
      referralOffer && offerLive(referralOffer, now) ? (
        <p>
          <strong>{l(referralOffer.label, locale)}.</strong> {l(referralOffer.description, locale)}
        </p>
      ) : null,
  };

  const onToggle = (e: SyntheticEvent<HTMLDetailsElement>) => play(e.currentTarget.open ? 'open' : 'close');

  return (
    <div className={`faq ${className}`}>
      {FAQ_IDS.filter((id) => answers[id] !== null).map((id) => (
        <details key={id} className="faq-item" onToggle={onToggle}>
          {/* tabIndex: native already, but explicit so <LazyHydrate> can restore focus to it after hydrating. */}
          <summary tabIndex={0} className="faq-q">
            <span className="faq-q-text">{t(`items.${id}`)}</span>
            <Plus aria-hidden strokeWidth={1.5} className="faq-icon" />
          </summary>
          <div className="faq-a">{answers[id]}</div>
        </details>
      ))}
    </div>
  );
}
