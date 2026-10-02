'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AudioLines, Check } from 'lucide-react';
import { l, maintenancePlans, plans, voiceUsage, type Offer } from '@/lib/content';
import { annualize, type Billing } from '@/lib/pricing';
import { localeTags, type Locale } from '@/i18n/routing';
import { Money } from '@/components/ui/Money';
import { LightSweep } from '@/components/motion/LightSweep';
import { Reveal } from '@/components/motion/Reveal';
import { BillingToggle } from './BillingToggle';
import { OfferNote } from './Offers';

/**
 * "Tu sitio no se apaga cuando terminamos. Lo mantenemos vivo."
 * The three maintenance plans (+ the voice agent usage fee), priced per the
 * shared Mensual/Anual toggle, with the maintenance-related offers.
 */
export function MaintenanceOverview({
  billing,
  onBillingChange,
  freeMonths,
  offers,
}: {
  billing: Billing;
  onBillingChange: (billing: Billing) => void;
  /** Months free when paying yearly (null when the annual offer is off). */
  freeMonths: number | null;
  /** Live maintenance-related offers (annual, referrals). */
  offers: Offer[];
}) {
  const t = useTranslations('pricing');
  const locale = useLocale() as Locale;
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>;
  const list = new Intl.ListFormat(localeTags[locale], { style: 'long', type: 'conjunction' });
  const annual = billing === 'annual';

  return (
    <Reveal className="mt-24 md:mt-32">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <p data-reveal className="eyebrow mb-4">
            {t('care.eyebrow')}
          </p>
          <h3 id="pricing-care-title" data-reveal className="display text-[2.1rem] sm:text-5xl lg:text-[3.4rem]">
            <LightSweep>{t.rich('care.title', { em })}</LightSweep>
          </h3>
        </div>
        <div data-reveal className="lg:pb-2">
          <p className="max-w-md text-base text-fg-muted">{t('care.subtitle')}</p>
          {freeMonths !== null ? (
            <BillingToggle value={billing} onChange={onBillingChange} freeMonths={freeMonths} stacked className="mt-6" />
          ) : null}
        </div>
      </div>

      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {maintenancePlans.map((m) => {
          const suggestedFor = plans.filter((p) => p.maintenance === m.id).map((p) => l(p.name, locale));
          return (
            <li key={m.id} data-reveal className="care-card flex flex-col rounded-card border border-line p-6">
              <div className="flex items-start justify-between gap-3">
                <h4 className="display text-3xl leading-none">{l(m.name, locale)}</h4>
                {annual && freeMonths ? (
                  <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-corona px-2.5 text-[0.7rem] font-semibold text-ink">
                    {t('billing.free', { months: freeMonths })}
                  </span>
                ) : null}
              </div>
              <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                <Money usd={annual ? annualize(m.priceUsd) : m.priceUsd} className="text-[1.65rem] font-medium leading-none" />
                <span className="text-sm text-fg-muted">{t(annual ? 'perYear' : 'perMonth')}</span>
              </p>
              {suggestedFor.length ? (
                <p className="mt-2 text-xs text-fg-muted">{t('care.suggestedFor', { plans: list.format(suggestedFor) })}</p>
              ) : null}
              <ul className="mt-5 space-y-2 border-t border-line pt-5">
                {l(m.includes, locale).map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm leading-snug">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div data-reveal className="care-card flex gap-4 rounded-card border border-line p-6 md:col-span-1">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-corona text-ink">
            <AudioLines className="size-4" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{l(voiceUsage.name, locale)}</p>
            <p className="mt-1 text-sm">
              <Money usd={voiceUsage.priceUsd} className="font-medium" />
              <span className="text-fg-muted">{t('care.perMonthShort')}</span>
              <span className="block text-fg-muted">{l(voiceUsage.note, locale)}</span>
            </p>
            <p className="mt-2 text-sm leading-snug text-fg-muted">{t('care.voiceText')}</p>
          </div>
        </div>
        {offers.length ? (
          <div data-reveal className="grid gap-5 rounded-card border border-dashed border-line-strong p-6 sm:grid-cols-2 md:col-span-2">
            {offers.map((offer) => (
              <OfferNote key={offer.id} offer={offer} />
            ))}
          </div>
        ) : null}
      </div>
    </Reveal>
  );
}
