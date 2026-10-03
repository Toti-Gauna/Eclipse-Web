'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { formatAmount, formatMoney, maintenanceSuggestion, planSavings, quote, type Billing } from '@/lib/pricing';
import { isApproximate } from '@/lib/currency';
import { l, offerById, verticalById, type Plan } from '@/lib/content';
import { buildPlanMessage, type Translate } from '@/lib/plan-message';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { CountUp } from '@/components/motion/CountUp';
import { PriceReadout } from './PriceReadout';
import { planAnchor } from './anchors';

/**
 * One package in the ledger. Desktop: name · includes · price · actions on one row.
 * Phones: a compact row (name, who it's for, the "desde") that opens to the details.
 * Arriving from an "Incluida en" chip (the row gets focus) opens and flashes it.
 */
export function PlanRow({
  plan,
  featured,
  billing,
  now,
}: {
  plan: Plan;
  featured: boolean;
  /** The section's maintenance billing: only used for the WhatsApp message. */
  billing: Billing;
  /** Client minute clock (null during SSR). */
  now: number | null;
}) {
  const t = useTranslations('pricing');
  const tm = useTranslations('planMessage');
  const tl = useTranslations('languages');
  const locale = useLocale() as Locale;
  const { currency, rates } = useCurrency();
  const { vertical, openBuilder } = useExperience();
  const { play } = useSound();
  const uid = useId();
  const [open, setOpen] = useState(featured);
  const [flash, setFlash] = useState(0);
  // A click inside the row also focuses it (tabIndex -1): only arrivals from an anchor count.
  const pointerFocus = useRef(false);

  const name = l(plan.name, locale);
  const savings = useMemo(() => planSavings(plan), [plan]);
  const local = isApproximate(currency);
  const bodyId = `${uid}-body`;

  // ---- WhatsApp message ("Lo quiero"): the package + its suggested maintenance.
  const nowDate = now ? new Date(now) : undefined;
  const maintenanceId = maintenanceSuggestion({ planId: plan.id });
  const q = quote({ planId: plan.id, itemIds: [], maintenanceId, billing, now: nowDate });
  const translate: Translate = (key, values) => tm(key as never, values as never);
  const offerLabels = q.offers.applied.flatMap((a) => {
    const offer = a.kind === 'annualMaintenance' ? offerById(a.id) : undefined;
    return offer ? [l(offer.label, locale)] : [];
  });
  const v = verticalById(vertical);
  const message = buildPlanMessage(
    {
      source: 'card',
      locale,
      currency,
      rates,
      quote: q,
      names: { [plan.id]: name },
      maintenanceName: q.maintenance.plan ? l(q.maintenance.plan.name, locale) : null,
      offers: offerLabels,
      verticalName: v && v.id !== 'otro' ? l(v.name, locale) : null,
      languageName: tl(locale),
    },
    translate,
  );

  // ---- range: "US$ 1.000 · hasta 1.500 según alcance" (local) / "Hasta US$ 1.500 según alcance" (USD)
  const range = local
    ? t('plan.rangeLocal', {
        from: formatMoney(plan.priceUsd.from, 'USD', rates, locale),
        to: formatAmount(plan.priceUsd.to, 'USD', rates, locale),
      })
    : t('plan.rangeUsd', { to: formatMoney(plan.priceUsd.to, 'USD', rates, locale) });

  const toggle = () => {
    setOpen((o) => !o);
    play('select');
  };

  return (
    <article
      id={planAnchor(plan.id)}
      tabIndex={-1}
      aria-labelledby={`${uid}-name`}
      data-featured={featured || undefined}
      data-open={open || undefined}
      // Two names so a second arrival restarts the CSS flash.
      data-flash={flash ? (flash % 2 ? 'a' : 'b') : undefined}
      onPointerDown={() => {
        pointerFocus.current = true;
        setTimeout(() => {
          pointerFocus.current = false;
        }, 0);
      }}
      onFocus={(e) => {
        // Landed here from an anchor ("Incluida en: Sistema"): open it and light it up.
        if (e.target !== e.currentTarget || pointerFocus.current) return;
        setOpen(true);
        setFlash((n) => n + 1);
        play('select');
      }}
      className={`pr-plan ${featured ? 'ticks' : ''}`}
    >
      <div className="pr-plan-top">
        {featured ? (
          <p className="pr-plan-badge">
            <span aria-hidden className="pr-plan-badge-dot" />
            {t('featured')}
          </p>
        ) : null}
        <h4 id={`${uid}-name`} className="pr-plan-name">
          <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={toggle} className="pr-plan-toggle">
            {name}
          </button>
          <span className="pr-plan-name-text">{name}</span>
        </h4>
        <p className="pr-plan-audience">{l(plan.audience, locale)}</p>
        <div className="pr-plan-price">
          <p className="pr-plan-from">
            <span>{t('plan.from')}</span>
            <span className="pr-plan-once"> · {t('plan.once')}</span>
          </p>
          <PriceReadout usd={plan.priceUsd.from} className="pr-plan-readout" />
        </div>
        <ChevronDown aria-hidden strokeWidth={1.5} className="pr-plan-chevron" />
      </div>

      <div id={bodyId} className="pr-plan-body">
        <div className="pr-plan-terms">
          <p className="pr-plan-range">
            <span className="pr-plan-once-inline">{t('plan.once')} · </span>
            {range}
          </p>
          {savings.show ? (
            <p className="pr-plan-savings">
              {t.rich('plan.savings', {
                pct: () => <CountUp value={savings.savingsPct} prefix="≈ " suffix="%" locale={locale} />,
              })}
            </p>
          ) : null}
        </div>

        <ul aria-label={t('plan.includes')} className="pr-plan-includes">
          {l(plan.includes, locale).map((line) => (
            <li key={line}>
              <Check aria-hidden strokeWidth={1.75} />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="pr-plan-actions">
          <WhatsAppLink
            origin="plan_card"
            message={message}
            extra={{ plan: plan.id }}
            aria-label={t('ctaLabel', { name })}
            onClick={() => {
              play('glint');
              track('plan_cta_clicked', { plan: plan.id, addons: 'none', maintenance: maintenanceId ?? 'none', billing });
            }}
            className={`btn btn-sm pr-plan-cta ${featured ? 'btn-primary' : 'pr-btn-ghost'}`}
          >
            {t('cta')}
            <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
          </WhatsAppLink>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={t('plan.customizeLabel', { name })}
            onClick={() => {
              play('open');
              openBuilder('plan_card', { planId: plan.id });
            }}
            className="pr-plan-customize"
          >
            <SlidersHorizontal aria-hidden strokeWidth={1.5} />
            {t('plan.customize')}
          </button>
        </div>
      </div>
    </article>
  );
}
