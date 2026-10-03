'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, AudioLines, Gift, Repeat, Users } from 'lucide-react';
import { founders, foundersRemaining, l, plans, type Offer } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { OfferCountdown } from './OfferCountdown';

/**
 * "Precio fundador −20%" banner. The caller decides visibility (offer live and
 * slots left); this only renders. Never touches prices: it's an invitation.
 */
export function FounderBanner({ offer }: { offer: Offer }) {
  const t = useTranslations('pricing.founder');
  const locale = useLocale() as Locale;
  const left = foundersRemaining();
  const total = founders.total;

  return (
    <div className="founder-banner relative isolate overflow-hidden rounded-card border border-[color:rgb(138_90_0/0.22)] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-2 text-base font-semibold">
              <Users aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
              {l(offer.label, locale)}
            </span>
            <OfferCountdown endsAt={offer.endsAt} />
          </p>
          <p className="mt-1.5 max-w-xl text-sm text-fg-muted">{l(offer.description, locale)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
          <p className="flex items-center gap-2.5 text-sm font-medium tabular">
            <span aria-hidden className="flex gap-1">
              {founders.slots.map((slot) => (
                <span
                  key={slot.id}
                  className={`size-2.5 rounded-full ${slot.filled ? 'bg-ink' : 'bg-corona shadow-[0_0_10px_rgb(245_185_66/0.8)]'}`}
                />
              ))}
            </span>
            {t('left', { left, total })}
          </p>
          <a
            href={`#${SECTION_IDS.founders}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            {t('cta')}
            <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </div>
  );
}

const OFFER_ICONS = {
  voiceCombo: AudioLines,
  annualMaintenance: Repeat,
  referral: Gift,
  founder: Users,
} as const;

/** A compact real offer: label + description (+ countdown when it has an end date). */
export function OfferNote({ offer, className = '' }: { offer: Offer; className?: string }) {
  const t = useTranslations('pricing.offers');
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const Icon = OFFER_ICONS[offer.kind];
  // The voice combo carries a price: format it in the active currency instead of
  // showing the literal "USD 300" from the content description.
  const entryPlan = offer.kind === 'voiceCombo' ? plans.find((p) => offer.plans.includes(p.id)) : undefined;
  const description =
    offer.kind === 'voiceCombo' && entryPlan
      ? t('voiceCombo', { price: format(offer.priceUsd), plan: l(entryPlan.name, locale) })
      : l(offer.description, locale);
  return (
    <div className={`flex gap-3 ${className}`}>
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-accent">
        <Icon className="size-4" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-semibold">{l(offer.label, locale)}</span>
          <OfferCountdown endsAt={offer.endsAt} />
        </p>
        <p className="mt-0.5 text-sm leading-snug text-fg-muted">{description}</p>
      </div>
    </div>
  );
}
