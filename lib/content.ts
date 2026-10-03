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
import ratesFallbackJson from '@/content/rates.fallback.json';

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
  | 'automatizacion'
  | 'dashboard'
  | 'crm'
  | 'gamificacion'
  | 'ecommerce'
  | 'app-ondemand'
  | 'voz'
  | 'chatbot'
  | 'marketing'
  | 'auditoria';

export type PlanId = 'diagnostico' | 'presencia' | 'voz' | 'automatiza' | 'sistema' | 'comercio' | 'plataforma';
export type MaintenanceId = 'esencial' | 'crecimiento' | 'escala';
export type VerticalId =
  | 'clinicas'
  | 'inmobiliarias'
  | 'gimnasios'
  | 'tiendas'
  | 'restaurantes'
  | 'academias'
  | 'otro';
export type DemoId = 'clinic' | 'realEstate' | 'gym' | 'shop' | 'restaurant' | 'academy';
export type OfferId = 'founder' | 'combo-voz' | 'annual' | 'referral';

export interface ItemCategory {
  id: string;
  name: Localized;
}

export interface Item {
  id: ItemId;
  category: string;
  priceUsd: number;
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
}

export interface Addon {
  id: string;
  itemId: ItemId;
  priceUsd: number;
  offer?: OfferId;
  whenIncluded: 'show' | 'hide';
  name: Localized;
}

export interface MaintenancePlan {
  id: MaintenanceId;
  priceUsd: number;
  name: Localized;
  includes: Localized<string[]>;
}

export interface VoiceUsage {
  id: 'voz-uso';
  priceUsd: number;
  whenItem: ItemId;
  name: Localized;
  note: Localized;
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
export const featuredPlanId = plansJson.featured as PlanId;
export const addons = addonsJson.addons as Addon[];
export const maintenancePlans = maintenanceJson.plans as MaintenancePlan[];
export const voiceUsage = maintenanceJson.voiceUsage as VoiceUsage;
export const annualMonthsCharged = maintenanceJson.annualMonthsCharged;
export const offers = offersJson.offers as Offer[];
export const verticals = verticalsJson.verticals as Vertical[];
export const founders = foundersJson as { total: number; slots: FounderSlot[] };
export const units = unitsJson.units as Unit[];
export const fallbackRates: Rates = {
  ARS: ratesFallbackJson.ARS,
  BRL: ratesFallbackJson.BRL,
  updatedAt: ratesFallbackJson.updatedAt,
  source: 'fallback',
};

export const itemById = (id: string) => items.find((i) => i.id === id);
export const planById = (id: string) => plans.find((p) => p.id === id);
export const verticalById = (id: string | null | undefined) => verticals.find((v) => v.id === id);
export const maintenanceById = (id: string | null | undefined) => maintenancePlans.find((m) => m.id === id);
export const offerById = <K extends Offer['kind']>(id: OfferId) =>
  offers.find((o) => o.id === id) as Extract<Offer, { kind: K }> | undefined;

/** Slots left for the founder program. */
export function foundersRemaining(data = founders): number {
  return Math.max(0, data.total - data.slots.filter((s) => s.filled).length);
}
