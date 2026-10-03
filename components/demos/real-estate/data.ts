/**
 * Fictional data for the "Lumen Propiedades" demo. Names, zones and copy are
 * message keys (namespace `demoRealEstate`), so every locale can use its own.
 * Time is measured in demo "ticks" (useDemoClock). "Now" is Sunday 9:41: the
 * office is closed and the AI agent answers every inquiry within seconds.
 * Listing prices are in USD (common in the region; all fictional).
 */

export const ACCENT = '#2f4590';
export const TICK_MS = 1600;
/** Effectively endless (the chat can be replayed); reduced motion jumps here. */
export const MAX_TICK = 100_000;

/** Sunday 11 October 2026 (UTC) — the demo's "today". Saturday is the 10th. */
export const TODAY_UTC = Date.UTC(2026, 9, 11);
export const dayDate = (offset: number, minutes = 0) => new Date(TODAY_UTC + offset * 86_400_000 + minutes * 60_000);
/** 9:41 — the demo's "now" (matches the phone status bar). */
export const NOW_MIN = 581;

export type Op = 'sale' | 'rent';
export type PropType = 'apartment' | 'house' | 'duplex';
export type ZoneId = 'centro' | 'arboleda' | 'ribera' | 'colinas';
export type Feature = 'balcony' | 'garage' | 'garden' | 'pool' | 'river' | 'pets' | 'amenities' | 'terrace';
export type Scene = 'morning' | 'day' | 'dusk' | 'night';
export type ListingId = 'a1' | 'a2' | 'a3' | 'a4' | 'h1' | 'h2' | 'd1' | 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6';

export interface Listing {
  id: ListingId;
  op: Op;
  type: PropType;
  zone: ZoneId;
  beds: number;
  baths: number;
  area: number;
  /** USD (sale) or USD per month (rent). */
  price: number;
  features: Feature[];
  /** Inquiries this week (before the live conversation). */
  inquiries: number;
  scene: Scene;
  /** Facade tone (index into the thumbnail palette). */
  tone: number;
  isNew?: boolean;
}

const L = (
  id: ListingId,
  op: Op,
  type: PropType,
  zone: ZoneId,
  [beds, baths, area]: [number, number, number],
  price: number,
  features: Feature[],
  inquiries: number,
  scene: Scene,
  tone: number,
  isNew = false,
): Listing => ({ id, op, type, zone, beds, baths, area, price, features, inquiries, scene, tone, isNew });

export const LISTINGS: Listing[] = [
  L('a1', 'sale', 'apartment', 'arboleda', [2, 1, 68], 138_000, ['balcony'], 6, 'day', 0),
  L('d1', 'sale', 'duplex', 'ribera', [3, 2, 132], 248_000, ['river', 'terrace'], 7, 'dusk', 2, true),
  L('a2', 'sale', 'apartment', 'centro', [2, 1, 61], 124_000, ['amenities'], 4, 'dusk', 1),
  L('h2', 'sale', 'house', 'arboleda', [3, 2, 150], 189_000, ['garden', 'garage'], 5, 'morning', 3),
  L('a3', 'sale', 'apartment', 'arboleda', [3, 2, 96], 205_000, ['garage', 'balcony'], 5, 'morning', 4),
  L('h1', 'sale', 'house', 'colinas', [4, 3, 210], 320_000, ['garden', 'pool'], 3, 'day', 0),
  L('a4', 'sale', 'apartment', 'ribera', [1, 1, 45], 98_000, ['river'], 2, 'night', 2, true),
  L('r1', 'rent', 'apartment', 'arboleda', [2, 1, 58], 650, ['balcony', 'pets'], 8, 'morning', 0, true),
  L('r3', 'rent', 'apartment', 'ribera', [2, 2, 74], 950, ['river', 'amenities'], 6, 'dusk', 4),
  L('r2', 'rent', 'apartment', 'centro', [2, 1, 55], 620, ['amenities'], 3, 'day', 1),
  L('r6', 'rent', 'duplex', 'arboleda', [3, 2, 118], 1_150, ['terrace', 'garage'], 3, 'morning', 3),
  L('r4', 'rent', 'house', 'colinas', [3, 2, 140], 1_400, ['garden', 'pets'], 2, 'day', 2),
  L('r5', 'rent', 'apartment', 'centro', [1, 1, 38], 480, ['balcony'], 4, 'night', 4),
];
export const listingById = (id: ListingId) => LISTINGS.find((l) => l.id === id)!;

/* ------------------------------------------------------------------ */
/* Filters                                                              */
/* ------------------------------------------------------------------ */
export type TypeFilter = 'all' | PropType;
export const TYPE_FILTERS: TypeFilter[] = ['all', 'apartment', 'house', 'duplex'];
export const BED_FILTERS = [0, 1, 2, 3];
/** Max-price stops of the slider; the last one (null) means "no limit". */
export const PRICE_STOPS: Record<Op, (number | null)[]> = {
  sale: [100_000, 150_000, 200_000, 250_000, null],
  rent: [500, 700, 1_000, 1_200, null],
};
export interface Filters {
  op: Op;
  type: TypeFilter;
  beds: number;
  /** Index into PRICE_STOPS[op]. */
  price: number;
}
export const DEFAULT_FILTERS: Filters = { op: 'sale', type: 'all', beds: 0, price: PRICE_STOPS.sale.length - 1 };

export function filterListings(f: Filters): Listing[] {
  const max = PRICE_STOPS[f.op][f.price];
  return LISTINGS.filter(
    (l) => l.op === f.op && (f.type === 'all' || l.type === f.type) && l.beds >= f.beds && (max === null || l.price <= max),
  );
}

/* ------------------------------------------------------------------ */
/* The scripted after-hours conversation                                */
/* ------------------------------------------------------------------ */
/** What the customer asks for in the first message (an apartment, 2 bedrooms, in La Arboleda). */
export const ASK = { type: 'apartment' as PropType, beds: 2, zone: 'arboleda' as ZoneId };
/** Budget options the agent offers, per operation (USD / USD per month). */
export const BUDGETS: Record<Op, number[]> = { sale: [150_000, 220_000], rent: [700, 1_000] };

/** The two listings the agent recommends: in budget, the asked zone first, then closest to the budget. */
export function recommend(op: Op, budget: number): ListingId[] {
  return LISTINGS.filter((l) => l.op === op && l.type === ASK.type && l.beds >= ASK.beds && l.price <= budget)
    .sort((a, b) => Number(b.zone === ASK.zone) - Number(a.zone === ASK.zone) || b.price - a.price)
    .slice(0, 2)
    .map((l) => l.id);
}

/** Visit slots the agent offers (day offset from today, minutes from midnight). */
export interface VisitSlot {
  day: number;
  minutes: number;
}
export const VISIT_SLOTS: VisitSlot[] = [
  { day: 1, minutes: 18 * 60 + 30 },
  { day: 2, minutes: 10 * 60 },
  { day: 6, minutes: 11 * 60 },
];

/** Seconds the AI agent took to answer each of its messages (shown under the bubble). */
export const RESPONSE_SECONDS = { greet: 8, budgetAsk: 6, matches: 11, visitAsk: 4, booked: 7 } as const;

/* ------------------------------------------------------------------ */
/* Weekend inbox + leads                                                */
/* ------------------------------------------------------------------ */
export type Channel = 'whatsapp' | 'web' | 'instagram';
export type Stage = 'new' | 'qualified' | 'visit';
export type LeadId = 'live' | 'tomas' | 'lucia' | 'martin' | 'valeria' | 'diego';
export type NextStep = { kind: 'visit'; slot: VisitSlot } | { kind: 'call' } | { kind: 'followup' };

export interface PastLead {
  id: Exclude<LeadId, 'live'>;
  channel: Channel;
  /** Day offset (0 = today, −1 = Saturday) and minutes from midnight. */
  day: number;
  minutes: number;
  responseSec: number;
  op: Op;
  type: PropType;
  zone: ZoneId;
  beds: number;
  budget: number | null;
  score: number;
  stage: Stage;
  next: NextStep;
  listings: ListingId[];
  /** Avatar color (marks only, never text). */
  color: string;
}

/** Conversations the agent handled since the office closed (all answered in < 1 min). */
export const PAST_LEADS: PastLead[] = [
  {
    id: 'tomas',
    channel: 'web',
    day: 0,
    minutes: 8 * 60 + 12,
    responseSec: 11,
    op: 'sale',
    type: 'house',
    zone: 'colinas',
    beds: 4,
    budget: 330_000,
    score: 88,
    stage: 'visit',
    next: { kind: 'visit', slot: { day: 6, minutes: 10 * 60 } },
    listings: ['h1'],
    color: '#8a5a2b',
  },
  {
    id: 'lucia',
    channel: 'whatsapp',
    day: 0,
    minutes: 1 * 60 + 36,
    responseSec: 9,
    op: 'rent',
    type: 'apartment',
    zone: 'centro',
    beds: 1,
    budget: 500,
    score: 74,
    stage: 'qualified',
    next: { kind: 'call' },
    listings: ['r5'],
    color: '#b0457a',
  },
  {
    id: 'martin',
    channel: 'instagram',
    day: -1,
    minutes: 23 * 60 + 40,
    responseSec: 14,
    op: 'sale',
    type: 'duplex',
    zone: 'ribera',
    beds: 3,
    budget: 250_000,
    score: 90,
    stage: 'visit',
    next: { kind: 'visit', slot: { day: 1, minutes: 11 * 60 } },
    listings: ['d1'],
    color: '#2f7d6d',
  },
  {
    id: 'valeria',
    channel: 'web',
    day: -1,
    minutes: 21 * 60 + 5,
    responseSec: 18,
    op: 'rent',
    type: 'apartment',
    zone: 'ribera',
    beds: 2,
    budget: 1_000,
    score: 69,
    stage: 'qualified',
    next: { kind: 'call' },
    listings: ['r3'],
    color: '#5a4fc4',
  },
  {
    id: 'diego',
    channel: 'whatsapp',
    day: -1,
    minutes: 19 * 60 + 52,
    responseSec: 7,
    op: 'sale',
    type: 'apartment',
    zone: 'arboleda',
    beds: 2,
    budget: null,
    score: 41,
    stage: 'new',
    next: { kind: 'followup' },
    listings: [],
    color: '#6b6878',
  },
];
export const LIVE_COLOR = ACCENT;

/**
 * Weekend totals before the live conversation (it adds one inquiry, and one
 * visit when it books). Every inquiry was answered in under a minute: the
 * vertical's key number (content/verticals.json) is 100%.
 */
export const WEEKEND = { inquiries: 22, visits: 5, qualified: 9, avgSeconds: 12 };
