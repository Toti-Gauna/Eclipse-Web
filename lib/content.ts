/**
 * Typed access to the commercial content in /content/*.json.
 * Edit the JSON files, never the components, to change prices, plans or verticals.
 */
import type { Locale } from '@/i18n/routing';
import itemsJson from '@/content/items.json';
import plansJson from '@/content/plans.json';
import addonsJson from '@/content/addons.json';
import maintenanceJson from '@/content/maintenance.json';
import offersJson from '@/content/offers.json';
import verticalsJson from '@/content/verticals.json';
import foundersJson from '@/content/founders.json';
import unitsJson from '@/content/units.json';
import linesJson from '@/content/lines.json';
import ratesFallbackJson from '@/content/rates.fallback.json';
import legacyJson from '@/content/legacy.json';

export type Localized<T = string> = Record<Locale, T>;

/** Picks the value for a locale, falling back to Spanish. */
export function l<T>(value: Localized<T>, locale: Locale): T;
export function l<T>(value: Localized<T> | null | undefined, locale: Locale): T | undefined;
export function l<T>(value: Localized<T> | null | undefined, locale: Locale): T | undefined {
  if (!value) return undefined;
  return value[locale] ?? value.es;
}

export type ItemId =
  | 'landing'
  | 'web-multi'
  | 'seo'
  | 'trailer'
  | 'turnos'
  | 'pedidos'
  | 'whatsapp'
  | 'dashboard'
  | 'crm'
  | 'gamificacion'
  | 'migracion'
  | 'catalogo'
  | 'app-fase'
  | 'chatbot'
  | 'voz'
  | 'asesoria-growth'
  | 'asesoria-economica'
  | 'asesorias'
  | 'marketing'
  | 'auditoria';

export type PlanId = 'adaptacion' | 'pack';
export type MaintenanceId = 'esencial' | 'conectado' | 'ia';
export type VerticalId =
  | 'clinicas'
  | 'inmobiliarias'
  | 'gimnasios'
  | 'tiendas'
  | 'restaurantes'
  | 'academias'
  | 'otro';
export type LineId = 'saas' | 'agency' | 'studio' | 'academy' | 'equipment';
export type DemoId = 'clinic' | 'realEstate' | 'gym' | 'shop' | 'restaurant' | 'academy';
export type OfferId = 'founder' | 'combo-voz' | 'annual' | 'referral';

export interface ItemCategory {
  id: string;
  name: Localized;
}

export interface Item {
  id: ItemId;
  category: string;
  /** Independent project, "desde". */
  priceUsd: number;
  /**
   * Compatible add-on on top of a base (an offer or another project), "desde". null = not
   * sold as an add-on. Independent and add-on are alternatives for the same work: never both.
   */
  addonUsd: number | null;
  /** Quoted after reviewing a sample (migration): shown as a range, never added to the total. */
  reviewRangeUsd?: { from: number; to: number };
  /** A combo that replaces these pieces (both advisory sessions). */
  replaces?: ItemId[];
  /** Availability / feasibility subject to validation (provider, capacity). */
  validate?: boolean;
  /** Retired from sale (lote 2.2b) but kept for historical requests and a possible return: never shown, never sold. */
  hidden?: boolean;
  icon: string;
  name: Localized;
  description: Localized;
}

/** Presentational group of a plan in the pricing section: "Para empezar" / "Sistemas completos". */
export type PlanTier = 'starter' | 'complete';

export interface Plan {
  id: PlanId;
  tier: PlanTier;
  priceUsd: { from: number; to: number };
  items: ItemId[];
  maintenance: MaintenanceId | null;
  icon: string;
  name: Localized;
  audience: Localized;
  includes: Localized<string[]>;
  /**
   * A piece given at no extra cost on top of `items` (v3: the premium landing in Voz and
   * Automatiza). It does NOT count in `items` (so detection and "ahorrás" stay as they were)
   * and never carries a price, a strikethrough or a saving: only what can be promised today.
   */
  bonus?: { itemId: ItemId; title: Localized; text: Localized };
  /** false = no "por separado / ahorrás" comparison (16/10 offers). */
  compare?: boolean;
  /** Availability subject to validation (the pack's finance advice). */
  validate?: boolean;
  /** Monthly plan credit: `monthlyUsd` off per month during the first `months` months after launch. */
  careCredit?: { months: number; monthlyUsd: number };
  /** Retired from sale (lote 2.2b: no packs, only monthly plans) but kept for historical requests and a possible return. */
  hidden?: boolean;
}

/** "+ Sumar" on an offer: the price is the piece's add-on price (items.json addonUsd). */
export interface Addon {
  id: string;
  itemId: ItemId;
  offer?: OfferId;
  whenIncluded: 'show' | 'hide';
}

export interface MaintenancePlan {
  id: MaintenanceId;
  priceUsd: number;
  /** Third-party budget (hosting, data, tools, usage) already inside the monthly price. */
  thirdPartyUsd: number;
  /** Who it is for. */
  audience: Localized;
  /** What it brings from Eclipse Studio / Academy (null = nothing). */
  studio: Localized | null;
  academy: Localized | null;
  name: Localized;
  includes: Localized<string[]>;
}

interface OfferBase {
  id: OfferId;
  active: boolean;
  endsAt: string | null;
  label: Localized;
  description: Localized;
}
export interface FounderOffer extends OfferBase {
  kind: 'founder';
  percentOff: number;
}
export interface VoiceComboOffer extends OfferBase {
  kind: 'voiceCombo';
  itemId: ItemId;
  priceUsd: number;
  plans: PlanId[];
  minSubtotalUsd: number;
}
export interface AnnualOffer extends OfferBase {
  kind: 'annualMaintenance';
}
export interface ReferralOffer extends OfferBase {
  kind: 'referral';
}
export type Offer = FounderOffer | VoiceComboOffer | AnnualOffer | ReferralOffer;

export interface KeyNumber {
  value: number;
  prefix: string;
  suffix: string;
  headline: Localized;
  label: Localized;
}

export interface Vertical {
  id: VerticalId;
  icon: string;
  demo: DemoId | null;
  /**
   * Hidden demo kept in the repo (Ignacio, 26/10/2026): never shown in the hero or in the
   * demos section, nothing deleted. Use `showcaseVerticals` for anything the visitor sees.
   */
  standby?: boolean;
  name: Localized;
  longName: Localized;
  business: string | null;
  pain: Localized | null;
  keyNumber: KeyNumber | null;
  calculator: {
    lostPerWeek: number;
    ticketUsd: number;
    hoursPerWeek: number;
    lostLabel: Localized;
    ticketLabel: Localized;
  };
  /**
   * The complete project the demo shows (v3, "Oferta debajo de cada demo").
   * `items`: the pieces visible in the demo (each has a published price in items.json).
   * `plan`: only when a package's approved audience names this vertical (plans.json
   * `audience`); otherwise null — no package or price is inferred, the pieces are listed
   * one by one and the builder opens with them.
   */
  project?: { plan: PlanId | null; items: ItemId[] };
}

/** One of the five lines of Eclipse (content/lines.json). Names and copy live in messages (`offerings.lines.<id>`). */
export interface Line {
  id: LineId;
  /** 'catalog': pieces with a published price exist; 'quote': priced per business. */
  availability: 'catalog' | 'quote';
  demo: DemoId | null;
  examples: ItemId[];
}

/** A starting point for a small business (content/lines.json `needs`): orientation, not a priced plan. */
export interface LineNeed {
  id: 'start' | 'order' | 'grow';
  lines: LineId[];
}

export interface FounderSlot {
  id: string;
  filled: boolean;
  name?: string;
  vertical?: VerticalId;
  result?: Localized;
  logo?: string;
  caseUrl?: string;
}

export interface Unit {
  id: string;
  name: string;
  status: 'active' | 'comingSoon';
  href: string | null;
  tagline: Localized | null;
}

export interface Rates {
  ARS: number;
  BRL: number;
  updatedAt: string;
  source: 'live' | 'fallback';
}

export const itemCategories = itemsJson.categories as ItemCategory[];
export const items = itemsJson.items as Item[];
export const plans = plansJson.plans as Plan[];
/** What the visitor can see and buy (the full lists above also resolve retired ids for historical requests). */
export const sellableItems = items.filter((i) => !i.hidden);
export const sellablePlans = plans.filter((p) => !p.hidden);
export const featuredPlanId = plansJson.featured as PlanId;
export const addons = addonsJson.addons as Addon[];
export const maintenancePlans = maintenanceJson.plans as MaintenancePlan[];
/** Historical: months charged per year on the (now inactive) annual offer. */
export const annualMonthsCharged = maintenanceJson.annualMonthsCharged;
/** Human hours per month included in every monthly plan, in total (not per category). */
export const careHoursMonthly = maintenanceJson.hoursMonthly;
/** Share of the implementation paid upfront (the rest is the balance). */
export const depositPct = plansJson.depositPct;
export const offers = offersJson.offers as Offer[];
export const verticals = verticalsJson.verticals as Vertical[];
/** Rubros whose demo is on show: with a demo and not in standby. */
export const showcaseVerticals = verticals.filter((v) => v.demo && !v.standby);
export const founders = foundersJson as { total: number; slots: FounderSlot[] };
export const units = unitsJson.units as Unit[];
export const lines = linesJson.lines as Line[];
export const lineNeeds = linesJson.needs as LineNeed[];
export const fallbackRates: Rates = {
  ARS: ratesFallbackJson.ARS,
  BRL: ratesFallbackJson.BRL,
  updatedAt: ratesFallbackJson.updatedAt,
  source: 'fallback',
};

export const itemById = (id: string) => items.find((i) => i.id === id);

/**
 * Names of ids retired with the 16/10 offer, to show historical requests and agreements with
 * their original name (never renamed to a new scope, never selectable). null when unknown.
 */
export function legacyName(kind: 'item' | 'plan' | 'maintenance', id: string | null | undefined): Localized | null {
  if (!id) return null;
  const table = (kind === 'item' ? legacyJson.items : kind === 'plan' ? legacyJson.plans : legacyJson.maintenance) as Record<string, Localized>;
  return table[id] ?? null;
}
export const planById = (id: string) => plans.find((p) => p.id === id);
export const verticalById = (id: string | null | undefined) => verticals.find((v) => v.id === id);
export const maintenanceById = (id: string | null | undefined) => maintenancePlans.find((m) => m.id === id);
export const offerById = <K extends Offer['kind']>(id: OfferId) =>
  offers.find((o) => o.id === id) as Extract<Offer, { kind: K }> | undefined;

/** Slots left for the founder program. */
export function foundersRemaining(data = founders): number {
  return Math.max(0, data.total - data.slots.filter((s) => s.filled).length);
}
