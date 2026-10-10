/**
 * "Enviar solicitud" — maps the builder's selection to the backend's plan-request format
 * (docs/plan-requests.md in Eclipse-be) and checks that the web's commercial content and the
 * backend's catalog still agree.
 *
 * The ids are the same on both sides (items, packages, maintenance, verticals, goals), so the
 * mapping is 1:1; the only difference is the unit (this site keeps USD, the API USD cents).
 * The backend recomputes the provisional estimate from its own versioned catalog and stores
 * that: the browser sends the selection and never a price. `catalogMismatches` is the
 * safety net: if the two ever drift, the UI says the saved estimate is the team's.
 */
import type { ApiCatalog, ApiPlanSelection } from '@/lib/api/types';
import { annualMonthsCharged, items, maintenancePlans, offers, plans, verticals, voiceUsage, founders } from '@/lib/content';
import type { VoiceComboOffer, FounderOffer } from '@/lib/content';
import { normalizeState, sortItemIds } from '@/components/plan-builder/rules';
import { GOAL_IDS, sortGoals, type PlanState } from '@/lib/plan-url';
import { isE164, normalizePhone } from '@/lib/portal/live';

export const CONTACT_NAME_MAX = 100;
export const MESSAGE_MAX = 2000;

/** The selection exactly as the API wants it (no prices, no ownership, no state). */
export function toApiSelection(state: PlanState): ApiPlanSelection {
  const clean = normalizeState(state);
  const selection: ApiPlanSelection = {
    goals: sortGoals(clean.goals),
    planId: clean.planId,
    items: sortItemIds(clean.items),
    billing: clean.billing,
    vertical: clean.vertical,
    founder: clean.founder,
  };
  // undefined = "suggest it for me" (key omitted) · null = explicitly none · id = chosen.
  if (clean.maintenance !== undefined) selection.maintenance = clean.maintenance;
  return selection;
}

export interface ContactInput {
  name: string;
  phone: string;
  message?: string;
}

export type ContactProblem = { name?: 'required' | 'long'; phone?: 'required' | 'format'; message?: 'long' };

export function checkContact(input: ContactInput): ContactProblem {
  const problems: ContactProblem = {};
  const name = input.name.trim();
  if (!name) problems.name = 'required';
  else if (Array.from(name).length > CONTACT_NAME_MAX) problems.name = 'long';
  const phone = normalizePhone(input.phone);
  if (!phone) problems.phone = 'required';
  else if (!isE164(phone)) problems.phone = 'format';
  if (input.message && Array.from(input.message.trim()).length > MESSAGE_MAX) problems.message = 'long';
  return problems;
}

export const hasProblems = (p: ContactProblem): boolean => Object.keys(p).length > 0;

/** The POST body. Throws if the selection is empty (the API needs a package or at least one piece). */
export function buildPlanRequestBody(state: PlanState, contact: ContactInput, catalogVersion: string) {
  const selection = toApiSelection(state);
  if (!selection.planId && selection.items.length === 0) throw new Error('Empty selection');
  const message = contact.message?.trim();
  return {
    catalogVersion,
    selection,
    contact: { name: contact.name.trim(), phone: normalizePhone(contact.phone) },
    ...(message ? { message } : {}),
  };
}

// ---------------------------------------------------------------------------
// Drift between the web content and the backend catalog
// ---------------------------------------------------------------------------

export interface CatalogMismatch {
  area: 'items' | 'plans' | 'maintenance' | 'voice' | 'offers' | 'founders' | 'goals' | 'verticals';
  id: string;
  /** What differs, for logs/tests. */
  detail: string;
}

const cents = (usd: number) => Math.round(usd * 100);
const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * Compares the backend's catalog with /content. Prices are compared in cents; ids as sets.
 * An empty result means a 1:1 match. The UI uses it to decide whether to warn that the
 * estimate saved by the team may differ from the one shown here.
 */
export function catalogMismatches(catalog: ApiCatalog): CatalogMismatch[] {
  const out: CatalogMismatch[] = [];
  const push = (area: CatalogMismatch['area'], id: string, detail: string) => out.push({ area, id, detail });

  // items
  for (const item of items) {
    const api = catalog.items.find((i) => i.id === item.id);
    if (!api) push('items', item.id, 'missing in API');
    else if (api.priceCents !== cents(item.priceUsd)) push('items', item.id, `price ${cents(item.priceUsd)} vs ${api.priceCents}`);
  }
  for (const api of catalog.items) if (!items.some((i) => i.id === api.id)) push('items', api.id, 'missing in web');

  // plans
  for (const plan of plans) {
    const api = catalog.plans.find((p) => p.id === plan.id);
    if (!api) {
      push('plans', plan.id, 'missing in API');
      continue;
    }
    if (api.rangeCents.from !== cents(plan.priceUsd.from) || api.rangeCents.to !== cents(plan.priceUsd.to)) push('plans', plan.id, 'range');
    if (!sameSet(api.items, plan.items)) push('plans', plan.id, 'items');
    if ((api.maintenance ?? null) !== (plan.maintenance ?? null)) push('plans', plan.id, 'maintenance');
    if ((api.bonusItemId ?? null) !== (plan.bonus?.itemId ?? null)) push('plans', plan.id, 'bonus');
  }
  for (const api of catalog.plans) if (!plans.some((p) => p.id === api.id)) push('plans', api.id, 'missing in web');

  // maintenance
  for (const m of maintenancePlans) {
    const api = catalog.maintenance.find((x) => x.id === m.id);
    if (!api) push('maintenance', m.id, 'missing in API');
    else if (api.monthlyCents !== cents(m.priceUsd)) push('maintenance', m.id, 'price');
  }
  for (const api of catalog.maintenance) if (!maintenancePlans.some((m) => m.id === api.id)) push('maintenance', api.id, 'missing in web');
  if (catalog.annualMonthsCharged !== annualMonthsCharged) push('maintenance', 'annualMonthsCharged', 'months');

  // voice usage
  if (catalog.voiceUsage.monthlyCents !== cents(voiceUsage.priceUsd) || catalog.voiceUsage.itemId !== voiceUsage.whenItem) {
    push('voice', voiceUsage.id, 'usage fee');
  }

  // offers that move money
  const combo = offers.find((o): o is VoiceComboOffer => o.kind === 'voiceCombo');
  const apiCombo = catalog.offers.find((o) => o.kind === 'voiceCombo');
  if (combo && apiCombo) {
    if (apiCombo.priceCents !== cents(combo.priceUsd) || apiCombo.minSubtotalCents !== cents(combo.minSubtotalUsd) || !sameSet(apiCombo.plans ?? [], combo.plans)) {
      push('offers', combo.id, 'voice combo');
    }
    if (apiCombo.active !== combo.active) push('offers', combo.id, 'active');
  } else if (combo || apiCombo) push('offers', 'combo-voz', 'missing');
  const founder = offers.find((o): o is FounderOffer => o.kind === 'founder');
  const apiFounder = catalog.offers.find((o) => o.kind === 'founder');
  if (founder && apiFounder) {
    if (apiFounder.percentOff !== founder.percentOff) push('offers', founder.id, 'percent');
    if (apiFounder.active !== founder.active) push('offers', founder.id, 'active');
  } else if (founder || apiFounder) push('offers', 'founder', 'missing');
  const annual = offers.find((o) => o.kind === 'annualMaintenance');
  const apiAnnual = catalog.offers.find((o) => o.kind === 'annualMaintenance');
  if (!!annual !== !!apiAnnual || (annual && apiAnnual && annual.active !== apiAnnual.active)) push('offers', 'annual', 'active');

  // founders program size
  if (catalog.founders.total !== founders.total) push('founders', 'total', `${founders.total} vs ${catalog.founders.total}`);

  // enums
  if (!sameSet(catalog.goals, GOAL_IDS)) push('goals', 'goals', 'ids');
  if (!sameSet(catalog.verticals.map((v) => v.id), verticals.map((v) => v.id))) push('verticals', 'verticals', 'ids');

  return out;
}
