/**
 * Pure pricing logic shared by the offer cards, the price lists and "Armá tu plan".
 * All amounts are USD; conversion/formatting happens at the edge (formatMoney).
 *
 * Rules (offer approved on 16/10/2026):
 * - An offer (Adaptación 500, Pack 700) is chosen explicitly: never inferred from a total.
 *   What it covers (`plan.items`) is never charged again.
 * - Every piece has an independent price and, most, a compatible add-on price. They are
 *   alternatives for the same work, never both: on top of an offer every extra is an
 *   add-on; without an offer the widest piece is the independent project and the rest
 *   are add-ons on it. A piece without an add-on price is always independent.
 * - Both advisory sessions (150 + 150) become the 250 combo, which replaces them.
 * - Migration is quoted after reviewing a sample: a pending range, never in the total.
 * - Implementation: depositPct (50) upfront, the rest as balance.
 * - One monthly plan (30/75/150). The pack credits `careCredit.monthlyUsd` per month for its
 *   first months after launch (0/45/120, then 30/75/150).
 * - Historical offers (founder, voice combo, annual, referral) are inactive: the code that
 *   reads them stays so it can still describe older agreements if they are ever re-enabled.
 */
import {
  addons as allAddons,
  annualMonthsCharged as defaultAnnualMonths,
  items as allItems,
  maintenancePlans as allMaintenance,
  offers as allOffers,
  plans as allPlans,
  type Addon,
  type AnnualOffer,
  type FounderOffer,
  type Item,
  type ItemId,
  type MaintenanceId,
  type MaintenancePlan,
  type Offer,
  type OfferId,
  type Plan,
  type PlanId,
  type PlanTier,
  type Rates,
  type VoiceComboOffer,
  depositPct as defaultDepositPct,
} from '@/lib/content';
import { convert, isApproximate, roundForCurrency, type Currency } from '@/lib/currency';
import { localeTags, type Locale } from '@/i18n/routing';

export type Billing = 'monthly' | 'annual';

/** Minimum saving (in %) worth announcing. */
export const MIN_SAVINGS_PCT = 5;

// ---------------------------------------------------------------------------
// Items & plans
// ---------------------------------------------------------------------------

/** Sum of catalog prices for the given item ids (unique, unknown ids ignored). */
export function sumItems(ids: readonly string[], catalog: readonly Item[] = allItems): number {
  const unique = new Set(ids);
  return catalog.filter((i) => unique.has(i.id)).reduce((acc, i) => acc + i.priceUsd, 0);
}

export interface PlanSavings {
  /** Catalog price of the plan's items bought one by one. */
  separateUsd: number;
  savingsUsd: number;
  /** Rounded percentage, 0–100. */
  savingsPct: number;
  /** True when the "Por separado → ahorrás" line should be shown. */
  show: boolean;
}

export function planSavings(plan: Plan, catalog: readonly Item[] = allItems): PlanSavings {
  if (plan.compare === false) return { separateUsd: 0, savingsUsd: 0, savingsPct: 0, show: false };
  const separateUsd = sumItems(plan.items, catalog);
  const savingsUsd = Math.max(0, separateUsd - plan.priceUsd.from);
  const savingsPct = separateUsd > 0 ? Math.round((savingsUsd / separateUsd) * 100) : 0;
  return {
    separateUsd,
    savingsUsd,
    savingsPct,
    show: plan.items.length >= 2 && savingsPct >= MIN_SAVINGS_PCT,
  };
}

export interface PlanMatch extends PlanSavings {
  plan: Plan;
  /** Selected items that are NOT part of the plan (they stay as extras if you switch). */
  extras: ItemId[];
}

/**
 * Plans fully contained in the selection that are cheaper than buying their items
 * separately. Best saving first.
 */
export function detectPlans(
  selection: readonly string[],
  planList: readonly Plan[] = allPlans,
  catalog: readonly Item[] = allItems,
): PlanMatch[] {
  const selected = new Set(selection);
  return planList
    .filter((plan) => plan.items.every((id) => selected.has(id)))
    .map((plan) => ({
      plan,
      ...planSavings(plan, catalog),
      extras: [...selected].filter((id) => !plan.items.includes(id as ItemId)) as ItemId[],
    }))
    .filter((m) => m.show)
    .sort((a, b) => b.savingsUsd - a.savingsUsd || b.plan.priceUsd.from - a.plan.priceUsd.from);
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export function isOfferActive(offer: Offer | undefined, now: Date = new Date()): boolean {
  if (!offer || !offer.active) return false;
  if (offer.endsAt && now.getTime() >= Date.parse(offer.endsAt)) return false;
  return true;
}

function findOffer<K extends Offer['kind']>(list: readonly Offer[], kind: K): Extract<Offer, { kind: K }> | undefined {
  return list.find((o) => o.kind === kind) as Extract<Offer, { kind: K }> | undefined;
}

export interface VoiceComboContext {
  planId?: PlanId | null;
  /** One-time amount of everything except the voice agent (USD). */
  restUsd: number;
}

export function voiceComboApplies(
  ctx: VoiceComboContext,
  offerList: readonly Offer[] = allOffers,
  now: Date = new Date(),
): VoiceComboOffer | null {
  const offer = findOffer(offerList, 'voiceCombo');
  if (!offer || !isOfferActive(offer, now)) return null;
  const byPlan = !!ctx.planId && offer.plans.includes(ctx.planId);
  const byAmount = ctx.restUsd >= offer.minSubtotalUsd;
  return byPlan || byAmount ? offer : null;
}

export interface AppliedOffer {
  id: OfferId;
  kind: Offer['kind'];
  /** USD saved by this offer on the one-time total (0 for informational offers). */
  savingsUsd: number;
  /** USD saved per year on maintenance (annual offer). */
  savingsPerYearUsd?: number;
}

export interface ApplyOffersInput {
  /** One-time subtotal after item-level prices (voice combo already applied). */
  subtotalUsd: number;
  /** Savings already produced by the voice combo on the subtotal. */
  voiceComboSavingsUsd?: number;
  founderOptIn?: boolean;
  foundersLeft?: number;
  billing?: Billing;
  maintenanceMonthlyUsd?: number;
  annualMonths?: number;
  offerList?: readonly Offer[];
  now?: Date;
}

export interface ApplyOffersResult {
  totalUsd: number;
  applied: AppliedOffer[];
  /** Real offers the visitor can still opt into (shown as chips/banners). */
  available: OfferId[];
}

/** Applies founder / annual offers and reports the voice combo + referral program. */
export function applyOffers({
  subtotalUsd,
  voiceComboSavingsUsd = 0,
  founderOptIn = false,
  foundersLeft = 0,
  billing = 'monthly',
  maintenanceMonthlyUsd = 0,
  annualMonths = defaultAnnualMonths,
  offerList = allOffers,
  now = new Date(),
}: ApplyOffersInput): ApplyOffersResult {
  const applied: AppliedOffer[] = [];
  const available: OfferId[] = [];
  let totalUsd = subtotalUsd;

  const combo = findOffer(offerList, 'voiceCombo');
  if (combo && voiceComboSavingsUsd > 0) {
    applied.push({ id: combo.id, kind: combo.kind, savingsUsd: voiceComboSavingsUsd });
  }

  const founder = findOffer(offerList, 'founder') as FounderOffer | undefined;
  const founderOpen = !!founder && isOfferActive(founder, now) && foundersLeft > 0;
  if (founder && founderOpen) {
    if (founderOptIn) {
      const savingsUsd = Math.round((subtotalUsd * founder.percentOff) / 100);
      totalUsd -= savingsUsd;
      applied.push({ id: founder.id, kind: founder.kind, savingsUsd });
    } else {
      available.push(founder.id);
    }
  }

  const annual = findOffer(offerList, 'annualMaintenance') as AnnualOffer | undefined;
  if (annual && isOfferActive(annual, now) && maintenanceMonthlyUsd > 0) {
    if (billing === 'annual') {
      applied.push({
        id: annual.id,
        kind: annual.kind,
        savingsUsd: 0,
        savingsPerYearUsd: maintenanceMonthlyUsd * (12 - annualMonths),
      });
    } else {
      available.push(annual.id);
    }
  }

  const referral = findOffer(offerList, 'referral');
  if (referral && isOfferActive(referral, now)) available.push(referral.id);

  return { totalUsd: Math.max(0, totalUsd), applied, available };
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

/** Pieces whose operation runs on an AI flow (Automatización e IA). */
const ITEMS_AI: ItemId[] = ['chatbot', 'voz'];
/** Pieces that run one standard integration (Conectado). */
const ITEMS_CONNECTED: ItemId[] = ['whatsapp'];
/** One-off services: they never create a monthly plan on their own. */
const ITEMS_ONE_OFF: ItemId[] = ['trailer', 'migracion', 'asesoria-growth', 'asesoria-economica', 'asesorias', 'marketing', 'auditoria'];

/**
 * Suggested monthly plan (one per project, never a sum): chatbot/voice → Automatización e
 * IA; standard WhatsApp → Conectado; any other product (an offer or a built piece) →
 * Esencial; only one-off services → none. A plan's own suggestion is the floor.
 */
export function maintenanceSuggestion(
  input: { planId?: PlanId | null; itemIds?: readonly string[] },
  planList: readonly Plan[] = allPlans,
): MaintenanceId | null {
  const plan = input.planId ? planList.find((p) => p.id === input.planId) : undefined;
  const ids = new Set<string>(input.itemIds ?? []);
  const has = (list: ItemId[]) => list.some((id) => ids.has(id));
  const builds = [...ids].some((id) => !ITEMS_ONE_OFF.includes(id as ItemId));
  const fromItems: MaintenanceId | null = has(ITEMS_AI) ? 'ia' : has(ITEMS_CONNECTED) ? 'conectado' : builds ? 'esencial' : null;
  if (!plan) return fromItems;
  const rank = (m: MaintenanceId | null) => (m ? ['esencial', 'conectado', 'ia'].indexOf(m) : -1);
  return rank(fromItems) > rank(plan.maintenance) ? fromItems : plan.maintenance;
}

/** Yearly price when paying annually (2 months free with the default 10). */
export function annualize(monthlyUsd: number, monthsCharged: number = defaultAnnualMonths): number {
  return monthlyUsd * monthsCharged;
}

/** Months not charged per year when paying maintenance annually (2 with the default 10). */
export function annualFreeMonths(monthsCharged: number = defaultAnnualMonths): number {
  return Math.min(12, Math.max(0, 12 - monthsCharged));
}

/** The cheapest maintenance plan: the "desde … por mes" of the pricing ledger. */
export function lowestMaintenance(list: readonly MaintenancePlan[] = allMaintenance): MaintenancePlan | null {
  return list.reduce<MaintenancePlan | null>((low, m) => (!low || m.priceUsd < low.priceUsd ? m : low), null);
}

// ---------------------------------------------------------------------------
// Catalog views (services index, plan groups, offer conditions)
// ---------------------------------------------------------------------------

/** Lowest catalog price among the given items ("pieza suelta desde"). null when none is known. */
export function lowestItemPrice(ids: readonly string[], catalog: readonly Item[] = allItems): number | null {
  const wanted = new Set(ids);
  const prices = catalog.filter((i) => wanted.has(i.id)).map((i) => i.priceUsd);
  return prices.length ? Math.min(...prices) : null;
}

/** Plans (packages) on sale that already include an item, in plans.json order. */
export function plansIncluding(itemId: string, planList: readonly Plan[] = allPlans.filter((p) => !p.hidden)): Plan[] {
  return planList.filter((p) => p.items.includes(itemId as ItemId));
}

export const PLAN_TIERS: readonly PlanTier[] = ['starter', 'complete'];

/** Plans grouped by their presentational tier, tiers in PLAN_TIERS order, plans in plans.json order. */
export function plansByTier(planList: readonly Plan[] = allPlans.filter((p) => !p.hidden)): { tier: PlanTier; plans: Plan[] }[] {
  return PLAN_TIERS.map((tier) => ({ tier, plans: planList.filter((p) => p.tier === tier) })).filter((g) => g.plans.length > 0);
}

/**
 * Where the voice combo price applies, split for the copy: plans of the offer that
 * don't include the voice agent yet (it can be added at the combo price) and the ones
 * that already include it. The other path (a selection that reaches minSubtotalUsd
 * without the voice agent) is in voiceComboApplies().
 */
export function voiceComboPlans(
  offer: Pick<VoiceComboOffer, 'itemId' | 'plans'>,
  planList: readonly Plan[] = allPlans,
): { addTo: Plan[]; included: Plan[] } {
  const inOffer = planList.filter((p) => offer.plans.includes(p.id));
  return {
    addTo: inOffer.filter((p) => !p.items.includes(offer.itemId)),
    included: inOffer.filter((p) => p.items.includes(offer.itemId)),
  };
}

// ---------------------------------------------------------------------------
// Quote (plan card + builder)
// ---------------------------------------------------------------------------

export interface QuoteInput {
  planId?: PlanId | null;
  /** Individual items (builder) or add-on items on top of a plan (card). */
  itemIds: readonly string[];
  maintenanceId?: MaintenanceId | null;
  billing?: Billing;
  founderOptIn?: boolean;
  foundersLeft?: number;
  now?: Date;
}

export interface QuoteLine {
  id: string;
  kind: 'plan' | 'item';
  /** Price charged. */
  priceUsd: number;
  /** The piece's independent price (for an add-on line, what it would cost alone). */
  listUsd: number;
  /** Charged as an add-on on top of a base (offer or project). */
  addon?: boolean;
  included?: boolean;
}

export interface PendingLine {
  id: ItemId;
  fromUsd: number;
  toUsd: number;
}

export interface Quote {
  plan: Plan | null;
  lines: QuoteLine[];
  /** Quoted after review (migration): shown apart, never in the total or the deposit. */
  pending: PendingLine[];
  /** One-time subtotal. */
  subtotalUsd: number;
  /** Implementation total (after founder discount, inactive since 16/10). */
  totalUsd: number;
  /** Upfront share of the implementation (depositPct) and the balance. */
  depositUsd: number;
  balanceUsd: number;
  /** "desde–hasta" when a plan sets a range. */
  rangeUsd: { from: number; to: number } | null;
  voiceCombo: boolean;
  hasVoice: boolean;
  maintenance: {
    plan: MaintenancePlan | null;
    billing: Billing;
    /** Regular monthly price (from month `intro.months + 1`, or from launch). */
    monthlyUsd: number;
    /** What is charged per period (month or year) for the maintenance plan. */
    periodUsd: number;
    /** The pack's first months: what is charged per month during them. */
    intro: { months: number; monthlyUsd: number } | null;
  };
  offers: ApplyOffersResult;
}

export interface Catalog {
  items: readonly Item[];
  plans: readonly Plan[];
  maintenance: readonly MaintenancePlan[];
  offers: readonly Offer[];
  annualMonths: number;
  depositPct: number;
}

export const defaultCatalog: Catalog = {
  items: allItems,
  plans: allPlans,
  maintenance: allMaintenance,
  offers: allOffers,
  annualMonths: defaultAnnualMonths,
  depositPct: defaultDepositPct,
};

/**
 * Ids of a selection with combos resolved: both advisory sessions become the combo that
 * replaces them, and a combo drops the single pieces it replaces. Unknown ids are kept
 * (the caller filters against its catalog).
 */
export function resolveCombos(ids: readonly string[], catalog: readonly Item[] = allItems): string[] {
  let out = [...new Set(ids)];
  for (const combo of catalog.filter((i) => i.replaces?.length)) {
    const parts = combo.replaces ?? [];
    if (parts.every((id) => out.includes(id)) && !out.includes(combo.id)) out.push(combo.id);
    if (out.includes(combo.id)) out = out.filter((id) => !parts.includes(id as ItemId));
  }
  return out;
}

/** What an offer covers, with the pieces of a covered combo (both advisory sessions) included. */
export function expandCovered(ids: readonly string[], catalog: readonly Item[] = allItems): string[] {
  const out = new Set<string>(ids);
  for (const i of catalog) if (out.has(i.id)) for (const part of i.replaces ?? []) out.add(part);
  return [...out];
}

/** Upfront share in whole cents (USD), the balance is the rest. */
export function splitPayment(totalUsd: number, pct: number = defaultDepositPct): { depositUsd: number; balanceUsd: number } {
  const depositUsd = Math.round(totalUsd * pct) / 100;
  return { depositUsd, balanceUsd: Math.round((totalUsd - depositUsd) * 100) / 100 };
}

export function quote(input: QuoteInput, catalog: Catalog = defaultCatalog): Quote {
  const now = input.now ?? new Date();
  const plan = input.planId ? (catalog.plans.find((p) => p.id === input.planId) ?? null) : null;
  const covered = new Set<string>(expandCovered(plan?.items ?? [], catalog.items));
  const wanted = resolveCombos(input.itemIds, catalog.items).filter((id) => !covered.has(id));
  const selected = catalog.items.filter((i) => wanted.includes(i.id));
  const pendingItems = selected.filter((i) => i.reviewRangeUsd);
  const extraItems = selected.filter((i) => !i.reviewRangeUsd);

  // Without an offer, the widest piece is the independent project the add-ons sit on.
  const anchor = plan
    ? null
    : extraItems.reduce<Item | null>((best, i) => (!best || i.priceUsd > best.priceUsd ? i : best), null);

  const lines: QuoteLine[] = [];
  if (plan) lines.push({ id: plan.id, kind: 'plan', priceUsd: plan.priceUsd.from, listUsd: plan.priceUsd.from });
  for (const item of extraItems) {
    // An add-on price equal to the independent one (advisory sessions) is just the price: no tag.
    const asAddon = item !== anchor && item.addonUsd != null && item.addonUsd < item.priceUsd;
    lines.push({
      id: item.id,
      kind: 'item',
      priceUsd: asAddon ? (item.addonUsd as number) : item.priceUsd,
      listUsd: item.priceUsd,
      ...(asAddon ? { addon: true } : {}),
    });
  }

  const subtotalUsd = lines.reduce((a, l) => a + l.priceUsd, 0);
  const extrasUsd = subtotalUsd - (plan?.priceUsd.from ?? 0);
  const hasVoice = covered.has('voz') || extraItems.some((i) => i.id === 'voz');

  const maintenancePlan = input.maintenanceId
    ? (catalog.maintenance.find((m) => m.id === input.maintenanceId) ?? null)
    : null;
  // Annual billing *is* the annual offer: without it (inactive/expired) everything is monthly.
  const annualOffer = findOffer(catalog.offers, 'annualMaintenance');
  const billing: Billing = input.billing === 'annual' && isOfferActive(annualOffer, now) ? 'annual' : 'monthly';
  const monthlyUsd = maintenancePlan?.priceUsd ?? 0;
  const periodUsd = billing === 'annual' ? annualize(monthlyUsd, catalog.annualMonths) : monthlyUsd;
  const credit = plan?.careCredit;
  const intro =
    credit && maintenancePlan ? { months: credit.months, monthlyUsd: Math.max(0, monthlyUsd - credit.monthlyUsd) } : null;

  const offers = applyOffers({
    subtotalUsd,
    founderOptIn: input.founderOptIn,
    foundersLeft: input.foundersLeft,
    billing,
    maintenanceMonthlyUsd: monthlyUsd,
    annualMonths: catalog.annualMonths,
    offerList: catalog.offers,
    now,
  });

  return {
    plan,
    lines,
    pending: pendingItems.map((i) => ({ id: i.id, fromUsd: i.reviewRangeUsd!.from, toUsd: i.reviewRangeUsd!.to })),
    subtotalUsd,
    totalUsd: offers.totalUsd,
    ...splitPayment(offers.totalUsd, catalog.depositPct),
    rangeUsd: plan && plan.priceUsd.to > plan.priceUsd.from ? { from: plan.priceUsd.from + extrasUsd, to: plan.priceUsd.to + extrasUsd } : null,
    voiceCombo: false,
    hasVoice,
    maintenance: { plan: maintenancePlan, billing, monthlyUsd, periodUsd, intro },
    offers,
  };
}

// ---------------------------------------------------------------------------
// Add-ons on offer cards
// ---------------------------------------------------------------------------

export interface PlanAddon {
  addon: Addon;
  item: Item;
  status: 'available' | 'included';
  /** Add-on price of the piece (items.json addonUsd). */
  priceUsd: number;
  discounted: boolean;
}

/** Add-ons for an offer card. Hidden ones and pieces without an add-on price are omitted. */
export function addonsForPlan(
  planId: PlanId,
  addonList: readonly Addon[] = allAddons,
  catalog: Catalog = defaultCatalog,
): PlanAddon[] {
  const plan = catalog.plans.find((p) => p.id === planId);
  if (!plan) return [];
  const result: PlanAddon[] = [];
  for (const addon of addonList) {
    const item = catalog.items.find((i) => i.id === addon.itemId);
    if (!item) continue;
    const isIncluded = expandCovered(plan.items, catalog.items).includes(addon.itemId);
    if (isIncluded && addon.whenIncluded === 'hide') continue;
    if (isIncluded) {
      result.push({ addon, item, status: 'included', priceUsd: 0, discounted: false });
      continue;
    }
    if (item.addonUsd == null) continue;
    result.push({ addon, item, status: 'available', priceUsd: item.addonUsd, discounted: false });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.NumberFormat>();

function numberFormat(tag: string, currency: Currency): Intl.NumberFormat {
  const key = `${tag}|${currency}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(tag, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    formatters.set(key, f);
  }
  return f;
}

/** Converted + rounded amount in the target currency. */
export function toCurrency(usd: number, currency: Currency, rates: Pick<Rates, 'ARS' | 'BRL'>): number {
  return roundForCurrency(convert(usd, currency, rates), currency);
}

/**
 * Formats a USD amount in the target currency.
 * ARS → nearest 1.000, BRL → nearest 10, USD → integer. ARS/BRL get a "≈ " prefix.
 */
export function formatMoney(
  usd: number,
  currency: Currency,
  rates: Pick<Rates, 'ARS' | 'BRL'>,
  locale: Locale | string = 'es',
  options: { approx?: boolean } = {},
): string {
  const tag = (localeTags as Record<string, string>)[locale] ?? locale;
  const value = toCurrency(usd, currency, rates);
  const formatted = numberFormat(tag, currency)
    .formatToParts(value)
    .map((part) => (part.type === 'currency' && currency === 'BRL' ? 'R$' : part.value))
    .join('');
  const approx = options.approx ?? isApproximate(currency);
  return approx && isApproximate(currency) ? `≈ ${formatted}` : formatted;
}

/**
 * A converted, rounded amount without currency symbol or "≈": the second half of a
 * range ("US$ 1.000 · hasta 1.500").
 */
export function formatAmount(
  usd: number,
  currency: Currency,
  rates: Pick<Rates, 'ARS' | 'BRL'>,
  locale: Locale | string = 'es',
): string {
  const tag = (localeTags as Record<string, string>)[locale] ?? locale;
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(toCurrency(usd, currency, rates));
}

/**
 * The exchange rate itself, unrounded ("1 USD ≈ $ 1.450", "1 USD ≈ R$ 5,40"), for the
 * conversion note next to local prices. USD → "US$ 1".
 */
export function formatRate(currency: Currency, rates: Pick<Rates, 'ARS' | 'BRL'>, locale: Locale | string = 'es'): string {
  const tag = (localeTags as Record<string, string>)[locale] ?? locale;
  const value = currency === 'USD' ? 1 : rates[currency];
  const decimals = Number.isInteger(value) || value >= 100 ? 0 : 2;
  return new Intl.NumberFormat(tag, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .formatToParts(value)
    .map((part) => (part.type === 'currency' && currency === 'BRL' ? 'R$' : part.value))
    .join('');
}
