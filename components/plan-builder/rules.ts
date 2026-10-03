/**
 * Pure rules for "Armá tu plan": state transitions, catalog grouping, package
 * detection against the real quote, maintenance suggestion, steps and soft hints.
 * Every price comes from lib/pricing.ts; nothing here re-implements pricing.
 */
import {
  itemCategories as allCategories,
  items as allItems,
  offers as allOffers,
  plans as allPlans,
  type Item,
  type ItemCategory,
  type ItemId,
  type MaintenanceId,
  type Plan,
  type PlanId,
  type VoiceComboOffer,
} from '@/lib/content';
import { detectPlans, isOfferActive, maintenanceSuggestion, MIN_SAVINGS_PCT, quote, type Quote } from '@/lib/pricing';
import type { PlanState } from '@/lib/plan-url';

/** What other parts of the page can pre-load into the builder (pricing cards, service cards). */
export interface Preset {
  items?: readonly ItemId[];
  planId?: PlanId | null;
}

export interface BuilderContext {
  /** Founder slots still open (foundersRemaining()). */
  foundersLeft: number;
  now?: Date;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

/** The guided flow: Objetivo → Piezas → Mantenimiento → Resumen. Every step can be skipped. */
export const STEPS = ['objetivo', 'piezas', 'mantenimiento', 'resumen'] as const;
export type StepId = (typeof STEPS)[number];

export function isStep(value: unknown): value is StepId {
  return typeof value === 'string' && (STEPS as readonly string[]).includes(value);
}

export function stepIndex(step: StepId): number {
  return STEPS.indexOf(step);
}

/** The neighbour step (clamped to the ends). */
export function siblingStep(step: StepId, direction: 1 | -1): StepId {
  return STEPS[Math.min(STEPS.length - 1, Math.max(0, stepIndex(step) + direction))];
}

/** Phase of the step's eclipse glyph: the moon covers the sun as the plan comes together. */
export function stepPhase(step: StepId): number {
  return (stepIndex(step) + 1) / STEPS.length;
}

/**
 * Where to land. A preset (a package to personalize, a piece to add) opens on the
 * pieces; a shared link with a plan opens on the summary; otherwise the remembered
 * step, or the first one.
 */
export function landingStep({
  preset,
  fromLink,
  remembered,
  empty,
}: {
  preset?: Preset | null;
  fromLink?: boolean;
  remembered?: StepId | null;
  empty: boolean;
}): StepId {
  if (preset && (preset.planId || preset.items?.length)) return 'piezas';
  if (fromLink && !empty) return 'resumen';
  if (remembered && !(empty && remembered === 'resumen')) return remembered;
  return 'objetivo';
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

const catalogOrder = new Map<string, number>(allItems.map((item, index) => [item.id, index]));

/** Unique, known ids in catalog order (stable URLs and messages). */
export function sortItemIds(ids: readonly string[]): ItemId[] {
  return [...new Set(ids)]
    .filter((id) => catalogOrder.has(id))
    .sort((a, b) => (catalogOrder.get(a) ?? 0) - (catalogOrder.get(b) ?? 0)) as ItemId[];
}

export function planById(planId: PlanId | null | undefined, list: readonly Plan[] = allPlans): Plan | null {
  return planId ? (list.find((p) => p.id === planId) ?? null) : null;
}

/** Item ids covered by the selected package. */
export function includedIds(state: Pick<PlanState, 'planId'>): ItemId[] {
  return planById(state.planId)?.items ?? [];
}

/** Everything the visitor has: the package's items plus the extras, in catalog order. */
export function selectionIds(state: Pick<PlanState, 'planId' | 'items'>): ItemId[] {
  return sortItemIds([...includedIds(state), ...state.items]);
}

export function isEmptyState(state: Pick<PlanState, 'planId' | 'items'>): boolean {
  return !state.planId && state.items.length === 0;
}

/** Extras never repeat an item the package already includes. */
export function normalizeState(state: PlanState): PlanState {
  const included = new Set<string>(includedIds(state));
  return { ...state, items: sortItemIds(state.items.filter((id) => !included.has(id))) };
}

export function toggleItem(state: PlanState, id: ItemId): PlanState {
  if (includedIds(state).includes(id)) return state;
  const items = state.items.includes(id) ? state.items.filter((i) => i !== id) : [...state.items, id];
  return normalizeState({ ...state, items });
}

/** "Cambiar al paquete": the package replaces its items, the rest stays as extras. */
export function switchToPlan(state: PlanState, planId: PlanId): PlanState {
  return normalizeState({ ...state, planId, items: selectionIds(state) });
}

/** "Editar pieza por pieza": no package, its pieces stay selected one by one. */
export function removePlan(state: PlanState): PlanState {
  return { ...state, planId: null, items: selectionIds(state) };
}

/** "Quitar paquete": the package and its pieces go; the extras stay. */
export function dropPlan(state: PlanState): PlanState {
  return { ...state, planId: null };
}

/** Step 1 "Empezá desde un paquete": tap to start from it, tap again to drop it. */
export function togglePlan(state: PlanState, planId: PlanId): PlanState {
  return state.planId === planId ? dropPlan(state) : switchToPlan(state, planId);
}

/**
 * Presets from the rest of the page:
 * - a package ("Personalizar" on a pricing card) starts over from it: its extras
 *   (if any) replace the selection, the goals are cleared and maintenance follows
 *   the package's suggestion;
 * - pieces alone ("Sumala a tu plan" on a service) are added to what is there.
 */
export function applyPreset(state: PlanState, preset: Preset): PlanState {
  if (preset.planId) {
    return normalizeState({
      ...state,
      goals: [],
      planId: preset.planId,
      items: [...(preset.items ?? [])],
      maintenance: undefined,
    });
  }
  return normalizeState({ ...state, items: [...state.items, ...(preset.items ?? [])] });
}

/** Items a preset adds that weren't selected yet (to point them out in step 2). */
export function addedByPreset(state: PlanState, preset: Preset): ItemId[] {
  const before = new Set<string>(selectionIds(state));
  return selectionIds(applyPreset(state, preset)).filter((id) => !before.has(id));
}

// ---------------------------------------------------------------------------
// Maintenance & quote
// ---------------------------------------------------------------------------

export function suggestedMaintenance(state: Pick<PlanState, 'planId' | 'items'>): MaintenanceId | null {
  return maintenanceSuggestion({ planId: state.planId, itemIds: state.items });
}

/** `undefined` follows the suggestion, `null` is an explicit "none". */
export function effectiveMaintenance(state: PlanState): MaintenanceId | null {
  return state.maintenance === undefined ? suggestedMaintenance(state) : state.maintenance;
}

export function builderQuote(state: PlanState, ctx: BuilderContext): Quote {
  return quote({
    planId: state.planId,
    itemIds: state.items,
    maintenanceId: effectiveMaintenance(state),
    billing: state.billing,
    founderOptIn: state.founder,
    foundersLeft: ctx.foundersLeft,
    now: ctx.now,
  });
}

/**
 * What is paid again and again, split by period: monthly maintenance + the voice
 * agent's fixed fee per month; annual maintenance per year (it is billed yearly).
 */
export function recurringSplit(q: Pick<Quote, 'maintenance'>): { monthlyUsd: number; yearlyUsd: number } {
  const m = q.maintenance;
  const maintenance = m.plan ? m.periodUsd : 0;
  return {
    monthlyUsd: (m.billing === 'monthly' ? maintenance : 0) + m.voiceUsageMonthlyUsd,
    yearlyUsd: m.billing === 'annual' ? maintenance : 0,
  };
}

/**
 * Price an item would be charged if selected now (voice combo aware).
 * `null` when the selected package already includes it.
 */
export function priceIfSelected(state: PlanState, id: ItemId, ctx: BuilderContext): number | null {
  if (includedIds(state).includes(id)) return null;
  const next = state.items.includes(id) ? state : toggleItem(state, id);
  const line = builderQuote(next, ctx).lines.find((l) => l.kind === 'item' && l.id === id);
  return line ? line.priceUsd : null;
}

// ---------------------------------------------------------------------------
// Package detection
// ---------------------------------------------------------------------------

export interface PlanSwitch {
  plan: Plan;
  /** Items that stay as extras after switching. */
  extras: ItemId[];
  /** Pieces the package brings that the visitor hadn't picked (empty when it is already inside the selection). */
  adds: ItemId[];
  /** One-time USD saved versus what the visitor would pay now. */
  savingsUsd: number;
  /** Rounded % of the current one-time subtotal. */
  savingsPct: number;
}

/**
 * "Con esto te conviene el paquete Sistema: ahorrás ≈ X%". Candidates are the bundles
 * fully inside the selection (detectPlans) and the bigger bundles the selection already
 * covers at least half of (≥ 2 pieces): those add pieces and still cost less. Each one is
 * measured against the current quote (voice combo and extras included); only real
 * savings ≥ MIN_SAVINGS_PCT are announced. Single-piece packages are never suggested.
 */
export function planSwitchSuggestion(state: PlanState, ctx: BuilderContext, planList: readonly Plan[] = allPlans): PlanSwitch | null {
  const selection = selectionIds(state);
  if (!selection.length) return null;
  const current = builderQuote(state, ctx).subtotalUsd;
  if (current <= 0) return null;
  const selected = new Set<string>(selection);
  const contained = new Set<string>(detectPlans(selection, planList).map((m) => m.plan.id));
  let best: PlanSwitch | null = null;
  for (const plan of planList) {
    if (plan.id === state.planId || plan.items.length < 2) continue;
    const adds = plan.items.filter((id) => !selected.has(id));
    const covered = plan.items.length - adds.length;
    const qualifies = contained.has(plan.id) || (adds.length > 0 && covered >= 2 && covered * 2 >= plan.items.length);
    if (!qualifies) continue;
    const savingsUsd = current - builderQuote(switchToPlan(state, plan.id), ctx).subtotalUsd;
    const savingsPct = Math.round((savingsUsd / current) * 100);
    if (savingsUsd <= 0 || savingsPct < MIN_SAVINGS_PCT) continue;
    if (!best || savingsUsd > best.savingsUsd || (savingsUsd === best.savingsUsd && adds.length < best.adds.length)) {
      best = {
        plan,
        extras: sortItemIds(selection.filter((id) => !plan.items.includes(id))),
        adds: sortItemIds(adds),
        savingsUsd,
        savingsPct,
      };
    }
  }
  return best;
}

/**
 * Voice combo not reached yet: how much more the rest of the selection needs.
 * Only when the voice agent is an extra and the package alone doesn't unlock it.
 */
export function voiceComboGap(
  state: PlanState,
  ctx: BuilderContext,
  offerList = allOffers,
): { offer: VoiceComboOffer; missingUsd: number } | null {
  const offer = offerList.find((o) => o.kind === 'voiceCombo') as VoiceComboOffer | undefined;
  if (!offer || !isOfferActive(offer, ctx.now)) return null;
  const q = builderQuote(state, ctx);
  const line = q.lines.find((l) => l.kind === 'item' && l.id === offer.itemId);
  if (!line || q.voiceCombo) return null;
  const restUsd = q.subtotalUsd - line.priceUsd;
  const missingUsd = offer.minSubtotalUsd - restUsd;
  return missingUsd > 0 ? { offer, missingUsd } : null;
}

// ---------------------------------------------------------------------------
// Soft dependencies
// ---------------------------------------------------------------------------

export type HintId = 'dashboard' | 'chatbot';

const HINT_RULES: { id: HintId; itemId: ItemId; worksBestWith: ItemId[] }[] = [
  // A dashboard needs data: bookings, orders, a store, an app or a CRM behind it.
  { id: 'dashboard', itemId: 'dashboard', worksBestWith: ['turnos', 'pedidos', 'ecommerce', 'app-ondemand', 'crm'] },
  // A chatbot answers; automations follow up.
  { id: 'chatbot', itemId: 'chatbot', worksBestWith: ['automatizacion'] },
];

export interface SoftHint {
  id: HintId;
  itemId: ItemId;
  /** Items that would complete it (the visitor can add any of them). */
  suggest: ItemId[];
}

export function softHints(selection: readonly string[]): SoftHint[] {
  const has = new Set(selection);
  return HINT_RULES.filter((rule) => has.has(rule.itemId) && !rule.worksBestWith.some((id) => has.has(id))).map(
    (rule) => ({ id: rule.id, itemId: rule.itemId, suggest: rule.worksBestWith }),
  );
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface CategoryGroup {
  category: ItemCategory;
  items: Item[];
}

/** Items grouped by category, in the order of items.json → categories. Empty groups are dropped. */
export function groupByCategory(
  list: readonly Item[] = allItems,
  categories: readonly ItemCategory[] = allCategories,
): CategoryGroup[] {
  return categories
    .map((category) => ({ category, items: list.filter((item) => item.category === category.id) }))
    .filter((group) => group.items.length > 0);
}

/** Remaining time of an offer with `endsAt`, split for the countdown copy. */
export function timeLeft(endsAt: string | null, now: number): { days: number; hours: number } | null {
  if (!endsAt) return null;
  const ms = Date.parse(endsAt) - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  return { days: Math.floor(hours / 24), hours: Math.max(1, hours) };
}
