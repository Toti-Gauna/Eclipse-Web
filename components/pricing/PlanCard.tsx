'use client';

import { useId, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Check, Plus, Sparkles } from 'lucide-react';
import {
  addons as allAddons,
  l,
  maintenancePlans,
  offerById,
  verticalById,
  voiceUsage,
  type MaintenanceId,
  type Plan,
} from '@/lib/content';
import { addonsForPlan, annualize, maintenanceSuggestion, planSavings, quote, type Billing } from '@/lib/pricing';
import { buildPlanMessage, type Translate } from '@/lib/plan-message';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { AnimatedMoney } from '@/components/ui/Money';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { ContentIcon } from '@/components/ui/Icon';
import { CountUp } from '@/components/motion/CountUp';

/** undefined = follow the automatic suggestion; null = explicitly none. */
type MaintenanceChoice = MaintenanceId | null | undefined;

/** Everything a card shows, derived from lib/pricing (never re-implemented here). */
function cardState(plan: Plan, selected: readonly string[], choice: MaintenanceChoice, billing: Billing, now?: Date) {
  const list = addonsForPlan(plan.id, selected, undefined, undefined, now);
  const available = new Set(list.filter((a) => a.status === 'available').map((a) => a.addon.id));
  const chosen = allAddons.filter((a) => selected.includes(a.id) && available.has(a.id));
  const itemIds = chosen.map((a) => a.itemId);
  const suggestion = maintenanceSuggestion({ planId: plan.id, itemIds });
  const maintenanceId = choice === undefined ? suggestion : choice;
  const q = quote({ planId: plan.id, itemIds, maintenanceId, billing, now });
  return { list, chosen, suggestion, maintenanceId, q };
}

export function PlanCard({
  plan,
  featured,
  billing,
  now,
  onAnnounce,
  className = '',
}: {
  plan: Plan;
  featured: boolean;
  billing: Billing;
  /** Client minute clock (null during SSR). */
  now: number | null;
  onAnnounce: (message: string) => void;
  className?: string;
}) {
  const t = useTranslations('pricing');
  const tm = useTranslations('planMessage');
  const tl = useTranslations('languages');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const { vertical } = useExperience();
  const uid = useId();

  const [selected, setSelected] = useState<string[]>([]);
  const [choice, setChoice] = useState<MaintenanceChoice>(undefined);

  const nowDate = useMemo(() => (now ? new Date(now) : undefined), [now]);
  const state = useMemo(() => cardState(plan, selected, choice, billing, nowDate), [plan, selected, choice, billing, nowDate]);
  const { list, chosen, suggestion, maintenanceId, q } = state;
  const savings = useMemo(() => planSavings(plan), [plan]);

  const name = l(plan.name, locale);
  const period = (b: Billing) => t(b === 'annual' ? 'perYear' : 'perMonth');
  const periodPrice = (monthlyUsd: number) => (billing === 'annual' ? annualize(monthlyUsd) : monthlyUsd);
  // Lightest maintenance plan, suggested as optional when the plan suggests none.
  const lightest = maintenancePlans.reduce((a, b) => (b.priceUsd < a.priceUsd ? b : a));

  // ---- live announcements (one polite region for the whole section) ----
  const announce = (next: ReturnType<typeof cardState>, maintenanceChanged: boolean) => {
    const parts = [t('live', { plan: name, total: format(next.q.subtotalUsd) })];
    if (maintenanceChanged) {
      const m = next.q.maintenance;
      parts.push(
        m.plan
          ? t('liveMaintenance', { plan: name, name: l(m.plan.name, locale), price: format(m.periodUsd), period: period(m.billing) })
          : t('liveNoMaintenance', { plan: name }),
      );
    }
    onAnnounce(parts.join(' '));
  };

  const toggleAddon = (id: string) => {
    const nextSelected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(nextSelected);
    const next = cardState(plan, nextSelected, choice, billing, nowDate);
    announce(next, next.maintenanceId !== maintenanceId);
  };

  const pickMaintenance = (id: MaintenanceId | null) => {
    setChoice(id);
    announce(cardState(plan, selected, id, billing, nowDate), true);
  };

  // ---- WhatsApp message ("Lo quiero") ----
  const translate: Translate = (key, values) => tm(key as never, values as never);
  const names: Record<string, string> = { [plan.id]: name };
  for (const addon of chosen) names[addon.itemId] = l(addon.name, locale);
  const offerLabels = q.offers.applied.flatMap((a) => {
    const offer = a.kind === 'voiceCombo' || a.kind === 'annualMaintenance' ? offerById(a.id) : undefined;
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
      names,
      maintenanceName: q.maintenance.plan ? l(q.maintenance.plan.name, locale) : null,
      offers: offerLabels,
      verticalName: v && v.id !== 'otro' ? l(v.name, locale) : null,
      languageName: tl(locale),
    },
    translate,
  );

  const addonsLabel = `${uid}-addons`;
  const maintenanceLabel = `${uid}-maintenance`;
  const titleId = `${uid}-title`;

  return (
    <li data-reveal data-featured={featured || undefined} className={`plan-card ${className}`}>
      {featured ? (
        <>
          <span aria-hidden className="plan-corona">
            <span className="plan-corona-beam" />
          </span>
          <span aria-hidden className="plan-badge">
            <Sparkles className="size-3.5" strokeWidth={1.75} />
            {t('featured')}
          </span>
        </>
      ) : null}

      {/* 1 · name */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`grid size-10 shrink-0 place-items-center rounded-full border ${
            featured ? 'border-transparent bg-corona text-ink' : 'border-line-strong text-accent'
          }`}
        >
          <ContentIcon name={plan.icon} className="size-[1.15rem]" />
        </span>
        <h3 id={titleId} className="display text-[2rem] leading-none">
          {name}
          {featured ? <span className="sr-only"> ({t('featured')})</span> : null}
        </h3>
      </div>

      {/* 2 · audience */}
      <p className="mt-3 text-sm leading-snug text-fg-muted">{l(plan.audience, locale)}</p>

      {/* 3 · price */}
      <div className="mt-6">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-fg-muted">{t('from')}</p>
        <p className="plan-price display mt-1.5 whitespace-nowrap leading-none">
          <AnimatedMoney usd={q.subtotalUsd} />
        </p>
        {q.rangeUsd ? (
          <p className="mt-2 text-xs text-fg-muted tabular">
            {t.rich('range', {
              from: format(q.rangeUsd.from),
              to: format(q.rangeUsd.to, { approx: false }),
              nums: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
            })}
          </p>
        ) : null}
      </div>

      {/* 4 · savings vs. buying the items separately (only real savings) */}
      {savings.show ? (
        <p className="mt-3 text-xs leading-relaxed text-fg-muted tabular">
          {t.rich('separate', {
            separate: format(savings.separateUsd),
            pct: savings.savingsPct,
            save: (chunks) => <strong className="whitespace-nowrap font-semibold text-accent">{chunks}</strong>,
            count: () => <CountUp value={savings.savingsPct} prefix="≈ " suffix="%" locale={locale} />,
          })}
        </p>
      ) : (
        <div aria-hidden />
      )}

      {/* 5 · includes */}
      <ul aria-label={t('includes')} className="mt-6 space-y-2.5 border-t border-line pt-5">
        {l(plan.includes, locale).map((line) => (
          <li key={line} className="flex gap-2.5 text-sm leading-snug">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {/* 6 · add-ons */}
      <div role="group" aria-labelledby={`${addonsLabel} ${titleId}`} className="mt-6">
        <p id={addonsLabel} className="mb-2.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-fg-muted">
          {t('addons')}
        </p>
        <ul className="space-y-2">
          {list.map(({ addon, status, priceUsd, discounted }) => {
            const addonName = l(addon.name, locale);
            if (status === 'included') {
              return (
                <li key={addon.id} className="min-h-12 rounded-2xl border border-dashed border-line-strong px-3 pb-2 pt-2.5">
                  <span className="block text-sm leading-snug">{addonName}</span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-fg-muted">{t('includedNote')}</span>
                    <span className="inline-flex h-7 shrink-0 items-center gap-1 px-1 text-xs font-medium text-accent">
                      <Check aria-hidden className="size-3.5" strokeWidth={2} />
                      {t('included')}
                    </span>
                  </span>
                </li>
              );
            }
            const pressed = selected.includes(addon.id);
            return (
              <li key={addon.id}>
                <button
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleAddon(addon.id)}
                  className="addon-toggle block min-h-12 w-full rounded-2xl border px-3 pb-2 pt-2.5 text-left"
                >
                  <span className="block text-sm leading-snug">{addonName}</span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-fg-muted">
                      <span className="tabular whitespace-nowrap">+ {format(priceUsd)}</span>
                      {discounted ? (
                        <span className="inline-flex h-[1.15rem] items-center rounded-full bg-corona px-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-ink">
                          {t('comboBadge')}
                        </span>
                      ) : null}
                    </span>
                    <span aria-hidden className="addon-pill">
                      {pressed ? <Check className="size-3.5" strokeWidth={2.25} /> : <Plus className="size-3.5" strokeWidth={2} />}
                      {pressed ? t('added') : t('add')}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 7 · maintenance */}
      <div className="mt-6">
        <p
          id={maintenanceLabel}
          className="mb-2.5 flex items-baseline justify-between gap-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-fg-muted"
        >
          <span>{t('maintenance')}</span>
          <span className="whitespace-nowrap normal-case tracking-normal">{period(billing)}</span>
        </p>
        <div role="radiogroup" aria-labelledby={`${maintenanceLabel} ${titleId}`} className="grid grid-cols-2 gap-2">
          {[null, ...maintenancePlans].map((m) => {
            const id = m?.id ?? null;
            const isSuggested = id !== null && id === suggestion;
            return (
              <label key={id ?? 'none'} className="maint-tile">
                <input
                  type="radio"
                  name={`${uid}-m`}
                  value={id ?? 'none'}
                  checked={maintenanceId === id}
                  onChange={() => pickMaintenance(id)}
                  className="sr-only"
                />
                <span className="block text-sm font-medium leading-tight">{m ? l(m.name, locale) : t('none')}</span>
                <span className="maint-price mt-0.5 block text-xs text-fg-muted tabular">
                  {m ? format(periodPrice(m.priceUsd)) : <span aria-hidden>—</span>}
                </span>
                {isSuggested ? <span className="maint-tag">{t('suggested')}</span> : null}
              </label>
            );
          })}
        </div>
        {suggestion === null ? (
          <p className="mt-2.5 text-xs leading-snug text-fg-muted">{t('optional', { name: l(lightest.name, locale) })}</p>
        ) : null}
        {q.maintenance.voiceUsageMonthlyUsd > 0 ? (
          <p className="mt-2.5 flex gap-2 text-xs leading-snug text-fg">
            <span aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full bg-corona" />
            <span>
              {t('voiceUsage', {
                name: l(voiceUsage.name, locale),
                price: format(q.maintenance.voiceUsageMonthlyUsd),
                note: l(voiceUsage.note, locale),
              })}
            </span>
          </p>
        ) : null}
      </div>

      {/* 8 · total + CTA */}
      <div className="plan-foot">
        <div className="border-t border-line pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-fg-muted">{t('total')}</span>
            <AnimatedMoney usd={q.subtotalUsd} className="text-lg font-medium" />
          </div>
          <p className="mt-1 min-h-[1.25rem] text-right text-xs text-fg-muted tabular">
            {q.maintenance.plan ? t('recurring', { price: format(q.maintenance.periodUsd), period: period(billing) }) : null}
          </p>
          <WhatsAppLink
            origin="plan_card"
            message={message}
            extra={{ plan: plan.id }}
            aria-label={t('ctaLabel', { name })}
            onClick={() =>
              track('plan_cta_clicked', {
                plan: plan.id,
                addons: chosen.map((a) => a.id).join(',') || 'none',
                maintenance: maintenanceId ?? 'none',
                billing,
              })
            }
            className={`btn mt-4 w-full ${featured ? 'btn-primary' : 'plan-cta-ink'}`}
          >
            {t('cta')}
            <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
          </WhatsAppLink>
        </div>
      </div>
    </li>
  );
}
