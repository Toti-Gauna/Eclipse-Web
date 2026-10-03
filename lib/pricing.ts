/**
 * Pure pricing logic shared by the plan cards and "Armá tu plan".
 * All amounts are USD; conversion/formatting happens at the edge (formatMoney).
 *
 * Rules (see README → Precios):
 * - Plan price = "desde" (priceUsd.from); the range is shown alongside.
 * - "Por separado / ahorrás" compares the plan's items at catalog price vs. the plan's
 *   "desde" price. Only bundles (2+ items) with a real saving show it.
 * - Voice combo: the voice agent costs offer.priceUsd (300) when the plan is one of
 *   offer.plans (Sistema or higher) OR when the rest of the selection — everything
 *   except the voice agent itself — reaches offer.minSubtotalUsd (1000). Measuring
 *   "the rest" avoids the circular case where the discount drops the total below 1000.
 * - Founder price: −percentOff on the one-time total, opt-in, only while slots remain.
 * - Annual maintenance: plan × annualMonthsCharged (10 = 2 months free). The voice
 *   agent usage fee stays monthly (it depends on minutes).
 */
import {
  addons as allAddons,
  annualMonthsCharged as defaultAnnualMonths,
  items as allItems,
  maintenancePlans as allMaintenance,
  offers as allOffers,
  plans as allPlans,
  voiceUsage as defaultVoiceUsage,
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
  type VoiceUsage,
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

const ITEMS_SCALE: ItemId[] = ['ecommerce', 'app-ondemand'];
const ITEMS_GROWTH: ItemId[] = ['turnos', 'pedidos', 'dashboard', 'crm', 'gamificacion'];
const ITEMS_ESSENTIAL: ItemId[] = ['voz', 'chatbot', 'automatizacion'];

/**
 * Suggested maintenance plan.
 * With a plan: the plan's own suggestion (Presencia/Diagnóstico → none, Voz/Automatiza
 * → Esencial, Sistema → Crecimiento, Comercio/Plataforma → Escala).
 * Free selection: the same rules expressed over items.
 */
export function maintenanceSuggestion(
  input: { planId?: PlanId | null; itemIds?: readonly string[] },
  planList: readonly Plan[] = allPlans,
): MaintenanceId | null {
  const plan = input.planId ? planList.find((p) => p.id === input.planId) : undefined;
  const ids = new Set<string>([...(input.itemIds ?? []), ...(plan?.items ?? [])]);
  const has = (list: ItemId[]) => list.some((id) => ids.has(id));
  const fromItems: MaintenanceId | null = has(ITEMS_SCALE)
    ? 'escala'
    : has(ITEMS_GROWTH)
      ? 'crecimiento'
      : has(ITEMS_ESSENTIAL)
        ? 'esencial'
        : null;
  if (!plan) return fromItems;
  // A plan's suggestion is the floor; extras can raise it (e.g. Presencia + e-commerce).
  const rank = (m: MaintenanceId | null) => (m ? ['esencial', 'crecimiento', 'escala'].indexOf(m) : -1);
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

/** Plans (packages) that already include an item, in plans.json order. */
export function plansIncluding(itemId: string, planList: readonly Plan[] = allPlans): Plan[] {
  return planList.filter((p) => p.items.includes(itemId as ItemId));
}

export const PLAN_TIERS: readonly PlanTier[] = ['starter', 'complete'];

/** Plans grouped by their presentational tier, tiers in PLAN_TIERS order, plans in plans.json order. */
export function plansByTier(planList: readonly Plan[] = allPlans): { tier: PlanTier; plans: Plan[] }[] {
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
  /** Price charged (after the voice combo, if any). */
  priceUsd: number;
  /** Catalog price. */
  listUsd: number;
  included?: boolean;
}

export interface Quote {
  plan: Plan | null;
  lines: QuoteLine[];
  /** One-time subtotal with item-level prices (voice combo applied). */
  subtotalUsd: number;
  /** One-time total after founder discount. */
  totalUsd: number;
  /** "desde–hasta" when a plan sets a range. */
  rangeUsd: { from: number; to: number } | null;
  voiceCombo: boolean;
  hasVoice: boolean;
  maintenance: {
    plan: MaintenancePlan | null;
    billing: Billing;
    monthlyUsd: number;
    /** What is charged per period (month or year) for the maintenance plan. */
    periodUsd: number;
    /** Voice agent fixed fee, always monthly (+ minutes). */
    voiceUsageMonthlyUsd: number;
  };
  offers: ApplyOffersResult;
}

export interface Catalog {
  items: readonly Item[];
  plans: readonly Plan[];
  maintenance: readonly MaintenancePlan[];
  voiceUsage: VoiceUsage;
  offers: readonly Offer[];
  annualMonths: number;
}

export const defaultCatalog: Catalog = {
  items: allItems,
  plans: allPlans,
  maintenance: allMaintenance,
  voiceUsage: defaultVoiceUsage,
  offers: allOffers,
  annualMonths: defaultAnnualMonths,
};

export function quote(input: QuoteInput, catalog: Catalog = defaultCatalog): Quote {
  const now = input.now ?? new Date();
  const plan = input.planId ? (catalog.plans.find((p) => p.id === input.planId) ?? null) : null;
  const included = new Set<string>(plan?.items ?? []);
  const extras = [...new Set(input.itemIds)].filter((id) => !included.has(id));
  const extraItems = catalog.items.filter((i) => extras.includes(i.id));

  const voiceId = catalog.voiceUsage.whenItem;
  const voiceExtra = extraItems.find((i) => i.id === voiceId);
  const restUsd = (plan?.priceUsd.from ?? 0) + extraItems.filter((i) => i.id !== voiceId).reduce((a, i) => a + i.priceUsd, 0);
  const combo = voiceExtra ? voiceComboApplies({ planId: plan?.id, restUsd }, catalog.offers, now) : null;

  const lines: QuoteLine[] = [];
  if (plan) lines.push({ id: plan.id, kind: 'plan', priceUsd: plan.priceUsd.from, listUsd: plan.priceUsd.from });
  for (const item of extraItems) {
    const price = combo && item.id === combo.itemId ? Math.min(combo.priceUsd, item.priceUsd) : item.priceUsd;
    lines.push({ id: item.id, kind: 'item', priceUsd: price, listUsd: item.priceUsd });
  }

  const subtotalUsd = lines.reduce((a, l) => a + l.priceUsd, 0);
  const voiceComboSavingsUsd = lines.reduce((a, l) => a + (l.listUsd - l.priceUsd), 0);
  const extrasUsd = subtotalUsd - (plan?.priceUsd.from ?? 0);

  const hasVoice = included.has(voiceId) || !!voiceExtra;
  const maintenancePlan = input.maintenanceId
    ? (catalog.maintenance.find((m) => m.id === input.maintenanceId) ?? null)
    : null;
  // Annual billing *is* the annual offer: without it (inactive/expired) everything is monthly.
  const annualOffer = findOffer(catalog.offers, 'annualMaintenance');
  const billing: Billing = input.billing === 'annual' && isOfferActive(annualOffer, now) ? 'annual' : 'monthly';
  const monthlyUsd = maintenancePlan?.priceUsd ?? 0;
  const periodUsd = billing === 'annual' ? annualize(monthlyUsd, catalog.annualMonths) : monthlyUsd;

  const offers = applyOffers({
    subtotalUsd,
    voiceComboSavingsUsd,
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
    subtotalUsd,
    totalUsd: offers.totalUsd,
    rangeUsd: plan ? { from: plan.priceUsd.from + extrasUsd, to: plan.priceUsd.to + extrasUsd } : null,
    voiceCombo: !!combo,
    hasVoice,
    maintenance: {
      plan: maintenancePlan,
      billing,
      monthlyUsd,
      periodUsd,
      voiceUsageMonthlyUsd: hasVoice ? catalog.voiceUsage.priceUsd : 0,
    },
    offers,
  };
}

// ---------------------------------------------------------------------------
// Add-ons on plan cards
// ---------------------------------------------------------------------------

export interface PlanAddon {
  addon: Addon;
  status: 'available' | 'included';
  /** Effective price given the current card selection (voice combo aware). */
  priceUsd: number;
  /** True when the voice combo lowers this add-on's price. */
  discounted: boolean;
}

/** Add-ons for a plan card. Hidden ones are omitted; included ones are flagged. */
export function addonsForPlan(
  planId: PlanId,
  selectedAddonIds: readonly string[] = [],
  addonList: readonly Addon[] = allAddons,
  catalog: Catalog = defaultCatalog,
  now: Date = new Date(),
): PlanAddon[] {
  const plan = catalog.plans.find((p) => p.id === planId);
  if (!plan) return [];
  const selected = addonList.filter((a) => selectedAddonIds.includes(a.id));
  const result: PlanAddon[] = [];
  for (const addon of addonList) {
    const isIncluded = plan.items.includes(addon.itemId);
    if (isIncluded && addon.whenIncluded === 'hide') continue;
    if (isIncluded) {
      result.push({ addon, status: 'included', priceUsd: 0, discounted: false });
      continue;
    }
    let priceUsd = addon.priceUsd;
    if (addon.offer) {
      const restUsd =
        plan.priceUsd.from + selected.filter((a) => a.id !== addon.id && a.itemId !== addon.itemId).reduce((s, a) => s + a.priceUsd, 0);
      const combo = voiceComboApplies({ planId, restUsd }, catalog.offers, now);
      if (combo && combo.id === addon.offer) priceUsd = Math.min(priceUsd, combo.priceUsd);
    }
    result.push({ addon, status: 'available', priceUsd, discounted: priceUsd < addon.priceUsd });
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
