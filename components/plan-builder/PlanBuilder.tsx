'use client';

import './builder.css';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link2, X } from 'lucide-react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { LightSweep } from '@/components/motion/LightSweep';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { useSound } from '@/components/sound/SoundContext';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import {
  foundersRemaining,
  founders,
  itemById,
  items as catalogItems,
  l,
  offers,
  planById,
  plans,
  verticalById,
  type FounderOffer,
  type ItemId,
  type MaintenanceId,
  type Offer,
  type PlanId,
  type ReferralOffer,
  type VerticalId,
  type VoiceComboOffer,
} from '@/lib/content';
import { isOfferActive, type Billing } from '@/lib/pricing';
import { encodePlanState } from '@/lib/plan-url';
import { buildPlanMessage, type Translate } from '@/lib/plan-message';
import { absoluteUrl } from '@/lib/env';
import { track } from '@/lib/analytics';
import type { Locale } from '@/i18n/routing';
import { Dock } from './Dock';
import { setVertical as setVerticalRule, suggestedIds, toggleGoal as toggleGoalRule, type GoalId } from './goals';
import { withGoals } from './message';
import { CopyButton } from './parts';
import {
  STEPS,
  builderQuote,
  dropPlan,
  effectiveMaintenance,
  groupByCategory,
  includedIds,
  isEmptyState,
  planSwitchSuggestion,
  priceIfSelected,
  recurringSplit,
  removePlan,
  selectionIds,
  siblingStep,
  softHints,
  stepIndex,
  stepPhase,
  suggestedMaintenance,
  switchToPlan,
  togglePlan,
  toggleItem,
  voiceComboGap,
  type HintId,
  type Preset,
  type StepId,
} from './rules';
import { StepCare } from './StepCare';
import { StepGoals } from './StepGoals';
import { StepPieces, type PieceView } from './StepPieces';
import { StepSummary } from './StepSummary';
import { Stepper } from './Stepper';
import { usePlanState, type BuilderMode } from './usePlanState';

const groups = groupByCategory();
const offersById: Partial<Record<string, Offer>> = Object.fromEntries(offers.map((o) => [o.id, o]));
const ANNOUNCE_DELAY_MS = 650;

/**
 * "Armá tu plan" — a guided flow in four skippable steps (Objetivo → Piezas →
 * Mantenimiento → Resumen) over the same plan state, with a sticky dock that always
 * shows "pago único" vs. what repeats. One component, two frames:
 * - mode="sheet": inside the drawer / bottom sheet (BuilderHost → PlanBuilderSheet).
 * - mode="page": the shareable /[locale]/plan route; state mirrors the URL.
 * All prices come from lib/pricing through rules.ts.
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
  const { play } = useSound();
  const { state, update, step, goTo, focusTick, highlight } = usePlanState(mode, { open, preset });
  const uid = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

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
  const fromGoals = suggestedIds(state);
  const comboOffer = (offers.find((o): o is VoiceComboOffer => o.kind === 'voiceCombo' && isOfferActive(o)) ?? null) as VoiceComboOffer | null;
  const founderOffer = offers.find((o): o is FounderOffer => o.kind === 'founder');
  const referral = offers.find((o): o is ReferralOffer => o.kind === 'referral');
  const annualOffer = offers.find((o) => o.kind === 'annualMaintenance') ?? null;
  const founderOpen = !!founderOffer && isOfferActive(founderOffer) && foundersLeft > 0;
  const planName = q.plan ? l(q.plan.name, locale) : null;
  const rec = recurringSplit(q);

  const views: Record<string, PieceView> = {};
  for (const item of catalogItems) {
    const price = priceIfSelected(state, item.id, ctx);
    views[item.id] = {
      item,
      checked: included.has(item.id) || state.items.includes(item.id),
      includedIn: included.has(item.id) ? planName : null,
      priceUsd: price ?? item.priceUsd,
      combo: price !== null && price < item.priceUsd,
      suggested: fromGoals.has(item.id),
      hint: hints.get(item.id) ?? null,
    };
  }

  // ---- WhatsApp message (also previewed and copied in the summary)
  const translate: Translate = (key, values) => tMsg(key, values);
  const names: Record<string, string> = {};
  for (const line of q.lines) {
    const entity = line.kind === 'plan' ? planById(line.id) : itemById(line.id);
    names[line.id] = entity ? l(entity.name, locale) : line.id;
  }
  const vertical = verticalById(state.vertical);
  const goalNames = state.goals.map((g) => {
    const name = t(`goals.${g}.name`);
    return name.charAt(0).toLocaleLowerCase(locale) + name.slice(1);
  });
  const message = withGoals(
    buildPlanMessage(
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
    ),
    goalNames.length ? t('goalsLine', { list: new Intl.ListFormat(locale, { type: 'conjunction' }).format(goalNames) }) : '',
  );
  const shareUrl = () => {
    const qs = encodePlanState(state);
    return absoluteUrl(`/${locale}/plan/${qs ? `?${qs}` : ''}`);
  };

  // ---- Announcements: debounced totals + action status
  const [announce, setAnnounce] = useState('');
  const [status, setStatus] = useState('');
  const totalsText = [
    t('totalAnnounce', { amount: format(q.totalUsd) }),
    rec.monthlyUsd > 0 ? t('recurringAnnounce', { amount: format(rec.monthlyUsd), period: t('perMonthLong') }) : '',
    rec.yearlyUsd > 0 ? t('recurringAnnounce', { amount: format(rec.yearlyUsd), period: t('perYearLong') }) : '',
  ]
    .filter(Boolean)
    .join(' ');
  const lastTotals = useRef<string | null>(null);
  useEffect(() => {
    if (lastTotals.current === null) {
      lastTotals.current = totalsText;
      return;
    }
    if (lastTotals.current === totalsText) return;
    const id = window.setTimeout(() => {
      lastTotals.current = totalsText;
      setAnnounce(totalsText);
    }, ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [totalsText]);

  // ---- Success moments: the glint on the dock total.
  const [glint, setGlint] = useState(0);

  // ---- Actions
  const onToggleGoal = (goal: GoalId) => {
    play('select');
    track('builder_item_toggled', { goal, selected: !state.goals.includes(goal) });
    update((s) => toggleGoalRule(s, goal));
  };
  const onToggleItem = (id: ItemId) => {
    if (included.has(id)) return;
    const selected = !state.items.includes(id);
    play(selected ? 'success' : 'select');
    track('builder_item_toggled', { item: id, selected });
    update((s) => toggleItem(s, id));
  };
  const onSwitch = () => {
    if (!suggestion) return;
    const planId = suggestion.plan.id;
    play('success');
    setGlint((n) => n + 1);
    update((s) => switchToPlan(s, planId));
    setStatus(t('switched', { plan: l(suggestion.plan.name, locale) }));
  };
  const onTogglePlan = (planId: PlanId) => {
    const choosing = state.planId !== planId;
    play(choosing ? 'success' : 'select');
    if (choosing) setGlint((n) => n + 1);
    update((s) => togglePlan(s, planId));
    const plan = plans.find((p) => p.id === planId);
    setStatus(choosing && plan ? t('switched', { plan: l(plan.name, locale) }) : t('packageDropped'));
  };
  const onVertical = (v: VerticalId | null) => {
    play('select');
    update((s) => setVerticalRule(s, v));
    selectVertical(v, 'builder');
  };
  const onMaintenance = (id: MaintenanceId | null) => {
    play('select');
    update((s) => ({ ...s, maintenance: id }));
  };
  const onBilling = (billing: Billing) => {
    play('toggle');
    update((s) => ({ ...s, billing }));
  };
  const onFounder = (on: boolean) => {
    play('toggle');
    update((s) => ({ ...s, founder: on }));
  };

  // ---- Navigation: focus moves to the step's heading; the new step is uncovered.
  const prevIndex = useRef(stepIndex(step));
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const go = (next: StepId) => {
    if (next === step) {
      goTo(next);
      return;
    }
    setDir(stepIndex(next) > prevIndex.current ? 'fwd' : 'back');
    prevIndex.current = stepIndex(next);
    goTo(next);
  };
  useEffect(() => {
    prevIndex.current = stepIndex(step);
  }, [step]);

  useEffect(() => {
    if (!focusTick) return;
    // After the dialog's own initial focus (the sheet opens in the same frame).
    const raf = requestAnimationFrame(() => {
      const heading = document.getElementById(`${uid}-${step}-title`);
      const keepScroll = step === 'piezas' && highlight.length > 0;
      if (mode === 'sheet') {
        if (!keepScroll) scrollRef.current?.scrollTo({ top: 0 });
      } else if (!keepScroll && stepsRef.current) {
        const top = stepsRef.current.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.5) {
          stepsRef.current.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }
      }
      heading?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
    // Only on explicit navigation (focusTick), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  // ---- Pieces
  const H = mode === 'page' ? 'h2' : 'h3';
  const Sub = mode === 'page' ? 'h3' : 'h4';
  const em = (chunks: ReactNode) => <em>{chunks}</em>;
  const analytics = { items: selection.join(','), plan: state.planId ?? 'none', total: q.totalUsd, count: selection.length };
  const comboPlan = comboOffer ? plans.find((p) => p.id === comboOffer.plans[0]) : null;

  const copyLink = (compact: boolean) => (
    <CopyButton
      getText={shareUrl}
      icon={<Link2 aria-hidden className="size-4 shrink-0" strokeWidth={1.6} />}
      label={t('copyLink')}
      doneLabel={t('linkCopied')}
      className={`btn btn-ghost btn-sm min-w-11 shrink-0 ${compact ? '!px-3 sm:!px-4' : ''}`}
      labelClassName={compact ? 'sr-only sm:not-sr-only' : ''}
    />
  );

  const previews: Partial<Record<StepId, ReactNode>> = {
    objetivo: t('goalsChosen', { count: state.goals.length }),
    piezas: t('pieceCount', { count: selection.length }),
    mantenimiento: q.maintenance.plan ? l(q.maintenance.plan.name, locale) : t('maintenanceNone'),
    resumen: empty ? '—' : format(q.totalUsd),
  };

  const stepContent: Record<StepId, ReactNode> = {
    objetivo: (
      <StepGoals
        state={state}
        onToggleGoal={onToggleGoal}
        onVertical={onVertical}
        onTogglePlan={onTogglePlan}
        headingId={`${uid}-objetivo-title`}
        Sub={Sub}
      />
    ),
    piezas: (
      <StepPieces
        groups={groups}
        views={views}
        plan={q.plan}
        onToggle={onToggleItem}
        onEditPieces={() => {
          play('select');
          update(removePlan);
          setStatus(t('planRemoved'));
        }}
        onDropPlan={() => {
          play('select');
          update(dropPlan);
          setStatus(t('packageDropped'));
        }}
        comboOffer={comboOffer}
        comboGap={voiceComboGap(state, ctx)}
        comboPlanName={comboPlan ? l(comboPlan.name, locale) : ''}
        highlight={highlight}
        active={step === 'piezas'}
        Sub={Sub}
      />
    ),
    mantenimiento: (
      <StepCare
        state={state}
        quote={q}
        maintenanceId={maintenanceId}
        suggested={suggestedMaintenance(state)}
        empty={empty}
        founder={founderOpen && founderOffer ? { offer: founderOffer, left: foundersLeft, total: founders.total } : null}
        annualOffer={annualOffer && isOfferActive(annualOffer) ? annualOffer : null}
        referral={referral && isOfferActive(referral) ? referral : null}
        onMaintenance={onMaintenance}
        onBilling={onBilling}
        onFounder={onFounder}
        headingId={`${uid}-mantenimiento-title`}
        Sub={Sub}
      />
    ),
    resumen: (
      <StepSummary
        quote={q}
        empty={empty}
        suggestion={suggestion}
        onSwitch={onSwitch}
        onGo={go}
        founder={founderOffer ? { offer: founderOffer } : null}
        offersById={offersById}
        message={message}
        shareUrl={shareUrl}
        Sub={Sub}
      />
    ),
  };

  return (
    <div className="pb theme-dark" data-mode={mode} data-step={step}>
      {mode === 'sheet' ? (
        <header className="pb-sheet-head">
          <div className="pb-sheet-bar">
            <h2 id={titleId} className="pb-sheet-title display">
              {t('title')}
            </h2>
            <div className="pb-sheet-actions">
              {copyLink(true)}
              <button type="button" onClick={onClose} aria-label={tAll('common.close')} className="pb-close">
                <X aria-hidden className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <Stepper step={step} onGo={go} variant="bar" />
        </header>
      ) : (
        <header className="pb-page-head container-x">
          <p className="pb-page-kicker label">
            <PhaseGlyph phase={stepPhase(step)} size={15} className="text-accent" />
            <span>{t('eyebrow')}</span>
          </p>
          <h1 id={titleId} className="display pb-page-title">
            <LightSweep className="pb-sweep">{t.rich('pageTitle', { em })}</LightSweep>
          </h1>
          <p className="pb-page-intro">{t('pageIntro')}</p>
          <div className="pb-page-actions">{copyLink(false)}</div>
        </header>
      )}

      <div className={`pb-body ${mode === 'page' ? 'container-x' : ''}`}>
        {mode === 'page' ? (
          <>
            <div className="pb-rail">
              <Stepper step={step} onGo={go} variant="rail" previews={previews} />
            </div>
            <div className="pb-bar-wrap">
              <Stepper step={step} onGo={go} variant="bar" />
            </div>
          </>
        ) : null}

        <div ref={scrollRef} className="pb-scroll">
          <div ref={stepsRef} className="pb-steps">
            {STEPS.map((id, i) => (
              <section key={id} className="pb-step" hidden={id !== step} data-dir={dir} aria-labelledby={`${uid}-${id}-title`}>
                <header className="pb-step-head">
                  <p className="pb-step-kicker label">
                    <PhaseGlyph phase={stepPhase(id)} size={15} className="text-accent" />
                    <span>{t('stepOf', { n: String(i + 1).padStart(2, '0'), total: String(STEPS.length).padStart(2, '0') })}</span>
                    <span aria-hidden className="pb-step-kicker-rule" />
                    <span>{t(`steps.${id}.name`)}</span>
                  </p>
                  <H id={`${uid}-${id}-title`} tabIndex={-1} className="pb-step-title display">
                    {t(`steps.${id}.title`)}
                  </H>
                  <p className="pb-step-help">{t(`steps.${id}.help`)}</p>
                </header>
                {stepContent[id]}
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className={`pb-dock-wrap ${mode === 'page' ? 'pb-dock-wrap--page' : ''}`}>
        <div className={mode === 'page' ? 'container-x' : ''}>
          <Dock
            step={step}
            quote={q}
            empty={empty}
            suggestion={suggestion}
            onSwitch={onSwitch}
            onBack={() => go(siblingStep(step, -1))}
            onNext={() => go(siblingStep(step, 1))}
            message={message}
            analytics={analytics}
            glint={glint}
          />
        </div>
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
