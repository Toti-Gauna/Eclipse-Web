'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronUp, Copy, Gift, Info, X } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { AnimatedMoney, Money } from '@/components/ui/Money';
import { CurrencySwitcher } from '@/components/layout/CurrencySwitcher';
import {
  annualMonthsCharged,
  itemById,
  l,
  maintenancePlans,
  planById,
  voiceUsage,
  type FounderOffer,
  type ItemId,
  type MaintenanceId,
  type Offer,
  type ReferralOffer,
  type VoiceComboOffer,
} from '@/lib/content';
import { annualize, type Billing, type Quote } from '@/lib/pricing';
import type { PlanState } from '@/lib/plan-url';
import type { Locale } from '@/i18n/routing';
import type { PlanSwitch } from './rules';
import { CopyButton, DetectBanner, OfferCountdown, SendAction } from './parts';

export interface SummaryActions {
  switchPlan: () => void;
  dropPlan: () => void;
  removeItem: (id: ItemId) => void;
  setMaintenance: (id: MaintenanceId | null) => void;
  setBilling: (billing: Billing) => void;
  setFounder: (on: boolean) => void;
}

export interface SummaryProps {
  headingLevel: 2 | 3;
  state: PlanState;
  quote: Quote;
  count: number;
  empty: boolean;
  suggestion: PlanSwitch | null;
  maintenanceId: MaintenanceId | null;
  suggestedMaintenance: MaintenanceId | null;
  founder: { offer: FounderOffer; left: number; total: number } | null;
  annualOffer: Offer | null;
  referral: ReferralOffer | null;
  comboGap: { offer: VoiceComboOffer; missingUsd: number } | null;
  offersById: Partial<Record<string, Offer>>;
  message: string;
  analytics: { items: string; plan: string; total: number; count: number };
  actions: SummaryActions;
}

const removeBtn =
  'relative grid size-9 shrink-0 place-items-center rounded-full text-fg-muted transition-colors before:absolute before:-inset-1 hover:bg-surface-strong hover:text-fg';

export function Summary(props: SummaryProps) {
  const { headingLevel, state, quote: q, count, empty, suggestion, actions } = props;
  const t = useTranslations('builder');
  const tAll = useTranslations();
  const locale = useLocale() as Locale;
  const { format } = useCurrency();
  const ids = useId();
  const bodyId = `${ids}-body`;
  const headingId = `${ids}-heading`;
  const sendHintId = `${ids}-send-hint`;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const Sub = headingLevel === 2 ? 'h3' : 'h4';

  // Compact layout: the summary expands upward from the bottom bar.
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const collapse = (refocus = true) => {
    setExpanded(false);
    if (refocus) toggleRef.current?.focus({ preventScroll: true });
  };
  const expand = () => {
    setExpanded(true);
    requestAnimationFrame(() => bodyRef.current?.focus({ preventScroll: true }));
  };

  // Bar height → CSS var, so the expanded panel never hides under it.
  useEffect(() => {
    const bar = barRef.current;
    const aside = asideRef.current;
    if (!bar || !aside || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => aside.style.setProperty('--pb-bar-h', `${bar.offsetHeight}px`));
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Escape' || !expanded) return;
    // Closes the summary first; a second Esc closes the drawer.
    e.preventDefault();
    e.stopPropagation();
    collapse();
  };

  const name = (lineId: string, kind: 'plan' | 'item') => {
    const entity = kind === 'plan' ? planById(lineId) : itemById(lineId);
    return entity ? l(entity.name, locale) : lineId;
  };
  const founderApplied = q.offers.applied.find((a) => a.kind === 'founder');
  const range = q.rangeUsd && q.rangeUsd.to > q.rangeUsd.from ? q.rangeUsd : null;
  const suggestedName = suggestion ? l(suggestion.plan.name, locale) : '';
  const rangeText = range
    ? t(founderApplied ? 'rangeNoDiscounts' : 'range', { from: format(range.from), to: format(range.to) })
    : '';

  const lines = (
    <ul className="divide-y divide-line">
      {q.lines.map((line) =>
        line.kind === 'plan' ? (
          <li key={`plan-${line.id}`} className="pb-line flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{t('planLine', { plan: name(line.id, 'plan') })}</p>
              <p className="text-xs text-fg-muted">{t('planIncludes', { count: q.plan?.items.length ?? 0 })}</p>
            </div>
            <p className="shrink-0 text-right text-sm">
              <span className="block text-[0.7rem] text-fg-muted">{tAll('common.from')}</span>
              <Money usd={line.priceUsd} className="font-medium" />
            </p>
            <button
              type="button"
              onClick={actions.dropPlan}
              aria-label={t('removePlanLabel', { plan: name(line.id, 'plan') })}
              title={t('removePlan')}
              className={removeBtn}
            >
              <X aria-hidden className="size-4" strokeWidth={1.8} />
            </button>
          </li>
        ) : (
          <li key={`item-${line.id}`} className="pb-line flex items-center gap-3 py-2.5">
            <p className="min-w-0 flex-1 text-sm leading-snug">
              {name(line.id, 'item')}
              {line.priceUsd < line.listUsd && props.offersById['combo-voz'] ? (
                <span className="ml-2 inline-block rounded-full border border-corona/50 px-1.5 text-[0.65rem] font-medium text-corona">
                  {l(props.offersById['combo-voz'].label, locale)}
                </span>
              ) : null}
            </p>
            <Money usd={line.priceUsd} className="shrink-0 text-sm" />
            <button
              type="button"
              onClick={() => actions.removeItem(line.id as ItemId)}
              aria-label={t('removeItem', { item: name(line.id, 'item') })}
              className={removeBtn}
            >
              <X aria-hidden className="size-4" strokeWidth={1.8} />
            </button>
          </li>
        ),
      )}
      {founderApplied && props.founder ? (
        <li className="pb-line flex items-center gap-3 py-2.5 text-sm">
          <p className="min-w-0 flex-1 text-corona">{l(props.founder.offer.label, locale)}</p>
          <span className="tabular shrink-0 text-corona">{format(-founderApplied.savingsUsd).replace('-', '−') /* typographic minus */}</span>
          <span aria-hidden className="size-9 shrink-0" />
        </li>
      ) : null}
    </ul>
  );

  const maintenanceName = useId();
  const billingName = useId();
  const free = 12 - annualMonthsCharged;
  const selectedMaintenance = maintenancePlans.find((m) => m.id === props.maintenanceId) ?? null;
  const showSuggested = !empty;
  const maintenance = (
    <section aria-labelledby={`${ids}-maint`}>
      <fieldset>
        <legend id={`${ids}-maint`} className="eyebrow mb-3">
          {t('maintenanceLegend')}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {[null, ...maintenancePlans].map((m) => {
            const id = m?.id ?? null;
            const checked = props.maintenanceId === id;
            const suggested = showSuggested && props.suggestedMaintenance === id;
            const price = m ? (state.billing === 'annual' ? annualize(m.priceUsd) : m.priceUsd) : 0;
            return (
              <label
                key={id ?? 'none'}
                className={`relative flex min-h-16 cursor-pointer flex-col justify-center gap-0.5 rounded-2xl border px-3 py-2.5 transition-[border-color,background-color] duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus)] ${
                  checked ? 'border-corona/70 bg-[rgb(245_185_66/0.08)]' : 'border-line hover:border-line-strong'
                }`}
              >
                <input
                  type="radio"
                  name={maintenanceName}
                  className="sr-only"
                  checked={checked}
                  onChange={() => actions.setMaintenance(id)}
                />
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                  {m ? l(m.name, locale) : tAll('common.none')}
                  {suggested ? (
                    <span className="rounded-full bg-corona px-1.5 py-px text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-void">
                      {t('suggested')}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-fg-muted">
                  {m ? (
                    <>
                      <span className="tabular">{format(price)}</span>
                      {state.billing === 'annual' ? tAll('common.perYear') : tAll('common.perMonth')}
                    </>
                  ) : (
                    t('noneDetail')
                  )}
                </span>
                {checked ? (
                  <Check aria-hidden className="absolute right-2.5 top-2.5 size-3.5 text-corona" strokeWidth={2.2} />
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>
      {selectedMaintenance ? (
        <p className="mt-2.5 text-xs leading-relaxed text-fg-muted">
          {t('maintenanceIncludes', { list: l(selectedMaintenance.includes, locale).join(', ') })}
        </p>
      ) : null}
      {selectedMaintenance && props.annualOffer ? (
        <fieldset className="mt-3">
          <legend className="sr-only">{t('billingLegend')}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-full border border-line p-1">
            {(['monthly', 'annual'] as const).map((b) => {
              const on = state.billing === b;
              return (
                <label
                  key={b}
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus)] ${
                    on ? 'bg-fg text-fg-inverse' : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  <input type="radio" name={billingName} className="sr-only" checked={on} onChange={() => actions.setBilling(b)} />
                  {b === 'monthly' ? tAll('common.monthly') : tAll('common.annual')}
                  {b === 'annual' && free > 0 ? (
                    <span
                      className={`whitespace-nowrap rounded-full px-1.5 text-[0.65rem] font-semibold ${
                        on ? 'bg-corona text-void' : 'bg-[rgb(245_185_66/0.14)] text-corona'
                      }`}
                    >
                      {t('freeMonths', { count: free })}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {q.maintenance.voiceUsageMonthlyUsd > 0 ? (
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-fg-muted">
          <Info aria-hidden className="mt-px size-3.5 shrink-0 text-corona" strokeWidth={1.6} />
          {t('voiceUsage', {
            name: l(voiceUsage.name, locale),
            price: format(q.maintenance.voiceUsageMonthlyUsd),
            note: l(voiceUsage.note, locale),
          })}
        </p>
      ) : null}
    </section>
  );

  const applied = q.offers.applied
    .map((a) => {
      const offer = props.offersById[a.id];
      if (!offer) return null;
      let detail = '';
      if (offer.kind === 'voiceCombo') detail = t('comboApplied', { price: format(offer.priceUsd) });
      else if (offer.kind === 'annualMaintenance') detail = t('annualApplied', { amount: format(a.savingsPerYearUsd ?? 0) });
      else if (offer.kind === 'founder') detail = t('founderApplied', { amount: format(a.savingsUsd) });
      return { offer, detail };
    })
    .filter((x): x is { offer: Offer; detail: string } => x !== null);

  const founderDescId = `${ids}-founder`;
  const offers = (
    <section aria-labelledby={`${ids}-offers`} className="space-y-3">
      <Sub id={`${ids}-offers`} className="eyebrow">
        {t('offersTitle')}
      </Sub>
      {applied.length ? (
        <ul className="space-y-2">
          {applied.map(({ offer, detail }) => (
            <li key={offer.id} className="pb-line flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-corona px-2.5 py-1 text-xs font-semibold text-void">
                <Check aria-hidden className="size-3.5" strokeWidth={2.4} />
                <span className="sr-only">{t('applied')}: </span>
                {l(offer.label, locale)}
              </span>
              <span className="text-xs text-fg-muted">{detail}</span>
              <OfferCountdown endsAt={offer.endsAt} />
            </li>
          ))}
        </ul>
      ) : null}
      {props.comboGap ? (
        <p className="text-xs leading-relaxed text-fg-muted">
          <span className="font-medium text-fg">{l(props.comboGap.offer.label, locale)}:</span>{' '}
          {t('comboGap', {
            min: format(props.comboGap.offer.minSubtotalUsd),
            price: format(props.comboGap.offer.priceUsd),
            missing: format(props.comboGap.missingUsd),
          })}
        </p>
      ) : null}
      {props.founder ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-card-sm border border-line bg-surface p-3.5 transition-colors has-[:checked]:border-corona/60 has-[:checked]:bg-[rgb(245_185_66/0.07)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus)]">
          <input
            type="checkbox"
            role="switch"
            className="peer sr-only"
            checked={state.founder}
            onChange={(e) => actions.setFounder(e.target.checked)}
            aria-describedby={founderDescId}
          />
          <span
            aria-hidden
            className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full border border-line-strong bg-[rgb(5_5_10/0.5)] transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-[1.125rem] after:rounded-full after:bg-fg after:transition-transform after:duration-300 peer-checked:border-corona peer-checked:bg-corona peer-checked:after:translate-x-4 peer-checked:after:bg-void"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{t('founderToggle', { pct: props.founder.offer.percentOff })}</span>
            <span id={founderDescId} className="mt-1 block text-xs leading-relaxed text-fg-muted">
              {l(props.founder.offer.description, locale)} {t('founderDeal')}{' '}
              <span className="text-fg">{t('founderLeft', { left: props.founder.left, total: props.founder.total })}</span>
            </span>
            <OfferCountdown endsAt={props.founder.offer.endsAt} />
          </span>
        </label>
      ) : null}
      {props.referral ? (
        <div className="flex items-start gap-3 rounded-card-sm border border-dashed border-line-strong p-3.5">
          <Gift aria-hidden className="mt-0.5 size-4 shrink-0 text-corona" strokeWidth={1.6} />
          <p className="text-xs leading-relaxed text-fg-muted">
            <span className="font-medium text-fg">{l(props.referral.label, locale)}.</span> {l(props.referral.description, locale)}{' '}
            <OfferCountdown endsAt={props.referral.endsAt} />
          </p>
        </div>
      ) : null}
    </section>
  );

  const notices = (
    <div className="space-y-1.5 text-xs leading-relaxed text-fg-muted">
      <p className="flex items-start gap-2">
        <Info aria-hidden className="mt-px size-3.5 shrink-0 text-corona" strokeWidth={1.6} />
        <span>{t('notice')}</span>
      </p>
      <p className="pl-[1.375rem]">{tAll('currency.notice')}</p>
    </div>
  );

  const copySummary = (full: boolean) => (
    <CopyButton
      getText={() => props.message}
      icon={<Copy aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />}
      label={t('copySummary')}
      doneLabel={t('summaryCopied')}
      disabled={empty}
      className={`btn btn-ghost btn-sm ${full ? 'w-full' : ''}`}
    />
  );

  return (
    <aside
      ref={asideRef}
      aria-labelledby={headingId}
      className="pb-summary"
      data-expanded={expanded || undefined}
      onKeyDown={onKeyDown}
    >
      <div aria-hidden className="pb-scrim pb-compact" data-open={expanded || undefined} onClick={() => collapse(false)} />

      <div
        ref={bodyRef}
        id={bodyId}
        tabIndex={-1}
        aria-labelledby={headingId}
        className="pb-summary-body outline-none"
        data-open={expanded || undefined}
      >
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <Heading id={headingId} className="font-serif text-[1.9rem] leading-none tracking-[-0.01em]">
              {t('summaryTitle')}
            </Heading>
            <span className="text-xs tabular text-fg-muted">{t('count', { count })}</span>
          </div>

          {suggestion ? (
            <div className="pb-wide">
              <DetectBanner suggestion={suggestion} planName={suggestedName} onSwitch={actions.switchPlan} />
            </div>
          ) : null}

          {empty ? <p className="text-sm leading-relaxed text-fg-muted">{t('empty')}</p> : lines}

          {range ? <p className="pb-compact -mt-3 text-xs leading-relaxed text-fg-muted">{rangeText}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span aria-hidden className="text-sm text-fg-muted">
              {tAll('header.currency')}
            </span>
            <CurrencySwitcher />
          </div>

          {maintenance}
          {offers}
          {notices}

          <div className="pb-compact">{copySummary(true)}</div>
        </div>
      </div>

      <div className="pb-actions pb-wide border-t border-line p-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{t('total')}</p>
          <p className="text-xs text-fg-muted">{t('oneTime')}</p>
        </div>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          {q.plan ? <span className="text-sm text-fg-muted">{tAll('common.from')}</span> : null}
          <AnimatedMoney usd={q.totalUsd} className="text-[2.5rem] font-light leading-[1.05] tracking-[-0.03em] text-fg" />
        </p>
        {range ? <p className="mt-1 text-xs leading-relaxed text-fg-muted">{rangeText}</p> : null}
        <div className="mt-4 space-y-2">
          <SendAction message={props.message} disabled={empty} describedBy={sendHintId} analytics={props.analytics} />
          {copySummary(true)}
          {empty ? (
            <p id={sendHintId} className="text-center text-xs text-fg-muted">
              {t('sendDisabled')}
            </p>
          ) : null}
        </div>
      </div>

      <div ref={barRef} className="pb-bar pb-compact">
        {suggestion ? (
          <DetectBanner suggestion={suggestion} planName={suggestedName} onSwitch={actions.switchPlan} compact />
        ) : null}
        <div className="flex items-center gap-3 px-4 pt-2.5 sm:px-6">
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => (expanded ? collapse() : expand())}
            className="-ml-2 flex min-h-14 min-w-0 flex-1 flex-col items-start justify-center rounded-2xl px-2 py-1 text-left"
          >
            <span className="eyebrow flex items-center gap-1.5 text-[0.65rem]">
              {t('total')}
              <ChevronUp
                aria-hidden
                className={`size-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </span>
            <span className="flex max-w-full items-baseline gap-1.5">
              {q.plan ? <span className="text-xs text-fg-muted">{tAll('common.from')}</span> : null}
              <AnimatedMoney usd={q.totalUsd} className="truncate text-[1.35rem] font-medium leading-tight tracking-[-0.02em]" />
            </span>
            <span className="text-xs text-fg-muted">
              {t('count', { count })} · <span className="underline underline-offset-2">{expanded ? t('hideSummary') : t('showSummary')}</span>
            </span>
          </button>
          <SendAction
            message={props.message}
            disabled={empty}
            compact
            describedBy={sendHintId + '-c'}
            analytics={props.analytics}
          />
        </div>
        {empty ? (
          <p id={sendHintId + '-c'} className="px-4 pt-1 text-xs text-fg-muted sm:px-6">
            {t('sendDisabled')}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
