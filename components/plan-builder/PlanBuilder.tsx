'use client';

import './builder.css';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link2, X } from 'lucide-react';
import { gsap, useGSAP } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { SectionHeading } from '@/components/motion/SectionHeading';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import {
  foundersRemaining,
  founders,
  itemById,
  items as catalogItems,
  l,
  offers,
  planById,
  verticalById,
  type FounderOffer,
  type ItemId,
  type Offer,
  type ReferralOffer,
  type VerticalId,
} from '@/lib/content';
import { isOfferActive } from '@/lib/pricing';
import { encodePlanState } from '@/lib/plan-url';
import { buildPlanMessage, type Translate } from '@/lib/plan-message';
import { absoluteUrl } from '@/lib/env';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { Catalog, VerticalPicker, type CatalogItemView } from './Catalog';
import { CopyButton } from './parts';
import { Summary, type SummaryActions } from './Summary';
import {
  builderQuote,
  effectiveMaintenance,
  groupByCategory,
  includedIds,
  isEmptyState,
  planSwitchSuggestion,
  priceIfSelected,
  removePlan,
  selectionIds,
  softHints,
  suggestedMaintenance,
  switchToPlan,
  toggleItem,
  voiceComboGap,
  type HintId,
  type Preset,
} from './rules';
import { usePlanState, type BuilderMode } from './usePlanState';

const groups = groupByCategory();
const offersById: Partial<Record<string, Offer>> = Object.fromEntries(offers.map((o) => [o.id, o]));

/**
 * "Armá tu plan" — one component, two frames:
 * - mode="sheet": inside the drawer / bottom sheet (BuilderHost → PlanBuilderSheet).
 * - mode="page": the shareable /[locale]/plan route; state mirrors the URL.
 */
export function PlanBuilder({
  mode,
  open = true,
  preset = null,
  onClose,
  titleId = mode === 'sheet' ? 'builder-title' : 'plan-title',
}: {
  mode: BuilderMode;
  open?: boolean;
  preset?: Preset | null;
  onClose?: () => void;
  titleId?: string;
}) {
  const t = useTranslations('builder');
  const tAll = useTranslations();
  const tMsg = useTranslations('planMessage');
  const locale = useLocale() as Locale;
  const { currency, rates, format } = useCurrency();
  const { selectVertical } = useExperience();
  const { state, update, focusTick } = usePlanState(mode, { open, preset });
  const rootRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const pageHeadRef = useRef<HTMLElement>(null);
  const sheetTitleRef = useRef<HTMLHeadingElement>(null);

  // ---- Derived (all pricing comes from lib/pricing through rules.ts)
  const foundersLeft = foundersRemaining();
  const ctx = { foundersLeft };
  const q = builderQuote(state, ctx);
  const selection = selectionIds(state);
  const included = new Set<string>(includedIds(state));
  const empty = isEmptyState(state);
  const suggestion = planSwitchSuggestion(state, ctx);
  const hints = new Map<string, HintId>(softHints(selection).map((h) => [h.itemId, h.id]));
  const maintenanceId = effectiveMaintenance(state);
  const comboOffer = offersById['combo-voz'];
  const founderOffer = offers.find((o): o is FounderOffer => o.kind === 'founder');
  const referral = offers.find((o): o is ReferralOffer => o.kind === 'referral');
  const annualOffer = offers.find((o) => o.kind === 'annualMaintenance') ?? null;
  const planName = q.plan ? l(q.plan.name, locale) : null;

  const views: Record<string, CatalogItemView> = {};
  for (const item of catalogItems) {
    const price = priceIfSelected(state, item.id, ctx);
    views[item.id] = {
      item,
      checked: included.has(item.id) || state.items.includes(item.id),
      includedIn: included.has(item.id) ? planName : null,
      priceUsd: price ?? item.priceUsd,
      offerTag: price !== null && price < item.priceUsd && comboOffer ? l(comboOffer.label, locale) : null,
      hint: hints.get(item.id) ?? null,
    };
  }

  // ---- WhatsApp message (same text for "Copiar resumen")
  const translate: Translate = (key, values) => tMsg(key, values);
  const names: Record<string, string> = {};
  for (const line of q.lines) {
    const entity = line.kind === 'plan' ? planById(line.id) : itemById(line.id);
    names[line.id] = entity ? l(entity.name, locale) : line.id;
  }
  const vertical = verticalById(state.vertical);
  const message = buildPlanMessage(
    {
      source: 'builder',
      locale,
      currency,
      rates,
      quote: q,
      names,
      maintenanceName: q.maintenance.plan ? l(q.maintenance.plan.name, locale) : null,
      offers: q.offers.applied.map((a) => offersById[a.id]).flatMap((o) => (o ? [l(o.label, locale)] : [])),
      verticalName: vertical && vertical.id !== 'otro' ? l(vertical.name, locale) : null,
      languageName: tAll(`languages.${locale}`),
    },
    translate,
  );
  const qs = encodePlanState(state);
  const shareUrl = () => absoluteUrl(`/${locale}/plan/${qs ? `?${qs}` : ''}`);

  // ---- Announcements: debounced total + action status
  const [announce, setAnnounce] = useState('');
  const [status, setStatus] = useState('');
  const lastTotal = useRef<number | null>(null);
  const totalText = format(q.totalUsd);
  useEffect(() => {
    if (lastTotal.current === null) {
      lastTotal.current = q.totalUsd;
      return;
    }
    if (lastTotal.current === q.totalUsd) return;
    const id = window.setTimeout(() => {
      lastTotal.current = q.totalUsd;
      setAnnounce(t('totalAnnounce', { amount: totalText }));
    }, 650);
    return () => window.clearTimeout(id);
  }, [q.totalUsd, totalText, t]);

  // ---- Actions
  const onToggle = (id: ItemId) => {
    if (included.has(id)) return;
    track('builder_item_toggled', { item: id, selected: !state.items.includes(id) });
    update((s) => toggleItem(s, id));
  };
  const actions: SummaryActions = {
    switchPlan: () => {
      if (!suggestion) return;
      const planId = suggestion.plan.id;
      update((s) => switchToPlan(s, planId));
      setStatus(t('switched', { plan: l(suggestion.plan.name, locale) }));
    },
    dropPlan: () => {
      update(removePlan);
      setStatus(t('planRemoved'));
    },
    removeItem: (id) => onToggle(id),
    setMaintenance: (id) => update((s) => ({ ...s, maintenance: id })),
    setBilling: (billing) => update((s) => ({ ...s, billing })),
    setFounder: (on) => update((s) => ({ ...s, founder: on })),
  };
  const setVertical = (v: VerticalId | null) => {
    update((s) => ({ ...s, vertical: v }));
    selectVertical(v, 'builder');
  };

  // ---- Motion: cards cascade in when the drawer opens.
  useGSAP(
    () => {
      if (mode !== 'sheet' || !open || prefersReducedMotion()) return;
      const cards = catalogRef.current?.querySelectorAll<HTMLElement>('[data-pb-card]');
      if (!cards?.length) return;
      gsap.fromTo(
        [...cards].slice(0, 8),
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.035, delay: 0.18, clearProps: 'transform,opacity,visibility' },
      );
    },
    { dependencies: [open, mode], scope: rootRef },
  );

  // Sheet: large dialog → start on its title (read first), not on the first button.
  useEffect(() => {
    if (mode !== 'sheet' || !open) return;
    const raf = requestAnimationFrame(() => sheetTitleRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(raf);
  }, [mode, open]);

  // Page: header button ("Armá tu plan") lands on the builder.
  useEffect(() => {
    if (!focusTick) return;
    const head = pageHeadRef.current;
    head?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    head?.focus({ preventScroll: true });
  }, [focusTick]);

  const founderOpen = !!founderOffer && isOfferActive(founderOffer) && foundersLeft > 0;
  const headingLevel = mode === 'page' ? 2 : 3;
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>;

  const copyLink = (
    <CopyButton
      getText={shareUrl}
      icon={<Link2 aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />}
      label={t('copyLink')}
      doneLabel={t('linkCopied')}
      className="btn btn-ghost btn-sm shrink-0 !px-3 sm:!px-4"
      labelClassName={mode === 'sheet' ? 'sr-only sm:not-sr-only' : ''}
    />
  );

  return (
    <div ref={rootRef} className="pb theme-dark" data-mode={mode}>
      {mode === 'sheet' ? (
        <header className="relative flex flex-none items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="eyebrow text-[0.65rem]">{t('eyebrow')}</p>
            <h2 ref={sheetTitleRef} id={titleId} tabIndex={-1} className="display mt-1 text-[2rem] outline-none sm:text-[2.25rem]">
              {t('title')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {copyLink}
            <button
              type="button"
              onClick={onClose}
              aria-label={tAll('common.close')}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg transition-colors hover:border-[color:var(--accent)]"
            >
              <X aria-hidden className="size-5" strokeWidth={1.6} />
            </button>
          </div>
        </header>
      ) : (
        <header
          ref={pageHeadRef}
          tabIndex={-1}
          className="container-x pb-10 pt-[calc(var(--header-h)+3rem)] outline-none md:pb-14 md:pt-[calc(var(--header-h)+5.5rem)]"
        >
          <SectionHeading as="h1" id={titleId} eyebrow={t('eyebrow')} sub={t('pageIntro')}>
            {t.rich('pageTitle', { em })}
          </SectionHeading>
          <div className="mt-7">{copyLink}</div>
        </header>
      )}

      <div className={`pb-main ${mode === 'page' ? 'container-x pb-0 xl:pb-24' : ''}`}>
        <div ref={catalogRef} role="region" aria-label={t('catalog')} className="pb-catalog">
          <div className={`space-y-9 ${mode === 'sheet' ? 'px-4 pb-10 pt-5 sm:px-6' : 'pb-12'}`}>
            {mode === 'sheet' ? <p className="max-w-md text-fg-muted">{t('intro')}</p> : null}
            <VerticalPicker value={state.vertical && state.vertical !== 'otro' ? state.vertical : null} onChange={setVertical} />
            <Catalog groups={groups} views={views} onToggle={onToggle} mode={mode} headingLevel={headingLevel} />
          </div>
        </div>

        <Summary
          headingLevel={headingLevel}
          state={state}
          quote={q}
          count={selection.length}
          empty={empty}
          suggestion={suggestion}
          maintenanceId={maintenanceId}
          suggestedMaintenance={suggestedMaintenance(state)}
          founder={founderOpen && founderOffer ? { offer: founderOffer, left: foundersLeft, total: founders.total } : null}
          annualOffer={annualOffer && isOfferActive(annualOffer) ? annualOffer : null}
          referral={referral && isOfferActive(referral) ? referral : null}
          comboGap={voiceComboGap(state, ctx)}
          offersById={offersById}
          message={message}
          analytics={{ items: selection.join(','), plan: state.planId ?? 'none', total: q.totalUsd, count: selection.length }}
          actions={actions}
        />
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </p>
      <p className="sr-only" role="status">
        {status}
      </p>
    </div>
  );
}
