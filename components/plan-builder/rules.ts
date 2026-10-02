/**
 * Pure rules for "Armá tu plan": state transitions, catalog grouping, plan
 * detection against the real quote, maintenance suggestion and soft hints.
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

/** What other parts of the page can pre-load into the builder (pricing cards, chips). */
export interface Preset {
  items?: readonly ItemId[];
  planId?: PlanId | null;
}

export interface BuilderContext {
  /** Founder slots still open (foundersRemaining()). */
  foundersLeft: number;
  now?: Date;
}

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

/** Item ids covered by the selected plan. */
export function includedIds(state: Pick<PlanState, 'planId'>): ItemId[] {
  return planById(state.planId)?.items ?? [];
}

/** Everything the visitor has: the plan's items plus the extras, in catalog order. */
export function selectionIds(state: Pick<PlanState, 'planId' | 'items'>): ItemId[] {
  return sortItemIds([...includedIds(state), ...state.items]);
}

export function isEmptyState(state: Pick<PlanState, 'planId' | 'items'>): boolean {
  return !state.planId && state.items.length === 0;
}

/** Extras never repeat an item the plan already includes. */
export function normalizeState(state: PlanState): PlanState {
  const included = new Set<string>(includedIds(state));
  return { ...state, items: sortItemIds(state.items.filter((id) => !included.has(id))) };
}

export function toggleItem(state: PlanState, id: ItemId): PlanState {
  if (includedIds(state).includes(id)) return state;
  const items = state.items.includes(id) ? state.items.filter((i) => i !== id) : [...state.items, id];
  return normalizeState({ ...state, items });
}

/** "Cambiar al plan": the plan replaces its items, the rest stays as extras. */
export function switchToPlan(state: PlanState, planId: PlanId): PlanState {
  return normalizeState({ ...state, planId, items: selectionIds(state) });
}

/** Back to individual items (the plan's items stay selected). */
export function removePlan(state: PlanState): PlanState {
  return { ...state, planId: null, items: selectionIds(state) };
}

/** A preset replaces the selection; maintenance goes back to the suggestion. */
export function applyPreset(state: PlanState, preset: Preset): PlanState {
  return normalizeState({
    ...state,
    planId: preset.planId ?? null,
    items: [...(preset.items ?? [])],
    maintenance: undefined,
  });
}

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
 * Price an item would be charged if selected now (voice combo aware).
 * `null` when the selected plan already includes it.
 */
export function priceIfSelected(state: PlanState, id: ItemId, ctx: BuilderContext): number | null {
  if (includedIds(state).includes(id)) return null;
  const next = state.items.includes(id) ? state : toggleItem(state, id);
  const line = builderQuote(next, ctx).lines.find((l) => l.kind === 'item' && l.id === id);
  return line ? line.priceUsd : null;
}

export interface PlanSwitch {
  plan: Plan;
  /** Items that stay as extras after switching. */
  extras: ItemId[];
  /** One-time USD saved versus what the visitor would pay now. */
  savingsUsd: number;
  /** Rounded % of the current one-time subtotal. */
  savingsPct: number;
}

/**
 * "Esto es el plan Sistema: ahorrás ≈ X%". Uses detectPlans() to find bundles fully
 * contained in the selection, then measures the saving against the current quote
 * (so the voice combo is already counted). Only real savings are announced.
 */
export function planSwitchSuggestion(state: PlanState, ctx: BuilderContext): PlanSwitch | null {
  const selection = selectionIds(state);
  if (!selection.length) return null;
  const current = builderQuote(state, ctx).subtotalUsd;
  if (current <= 0) return null;
  let best: PlanSwitch | null = null;
  for (const match of detectPlans(selection)) {
    if (match.plan.id === state.planId) continue;
    const candidate = builderQuote(switchToPlan(state, match.plan.id), ctx).subtotalUsd;
    const savingsUsd = current - candidate;
    const savingsPct = Math.round((savingsUsd / current) * 100);
    if (savingsUsd <= 0 || savingsPct < MIN_SAVINGS_PCT) continue;
    if (!best || savingsUsd > best.savingsUsd) {
      best = { plan: match.plan, extras: sortItemIds(match.extras), savingsUsd, savingsPct };
    }
  }
  return best;
}

/**
 * Voice combo not reached yet: how much more the rest of the selection needs.
 * Only when the voice agent is an extra and the plan alone doesn't unlock it.
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
