/**
 * Fictional data for "Lumen Propiedades — Demo" (vertical "inmobiliarias"): an agency that
 * sells and rents homes. People, zones and copy are message keys (namespace `demoRealEstate`)
 * so each locale names them; street addresses are invented. Prices are in USD, as homes are
 * listed in the region (all fictional).
 * Time: minutes from midnight on days of the week of Monday 5 October 2026 (day 0).
 * The story starts on Thursday 8 (day 3) at 23:40, with the office closed.
 */
import type { DemoTheme, Tone } from '../kit';

/** Palette: stone · ink · cobalt · sand. Editorial and architectural: serif, hairlines, square corners. */
export const LUMEN_THEME: DemoTheme = {
  mode: 'light',
  bg: '#ECE8E1',
  surface: '#F6F4EF',
  sunken: '#E4DFD6',
  ink: '#141414',
  muted: '#57534B',
  line: 'rgb(20 20 20 / 0.13)',
  accent: '#2448C8',
  accentInk: '#FFFFFF',
  accentText: '#2448C8',
  accent2: '#D9CBB3',
  accent2Ink: '#141414',
  accent2Text: '#6B5733',
  ok: '#2E6B3E',
  warn: '#8A5A12',
  bad: '#A3352C',
  info: '#2C5A7A',
  radius: '0',
  display: { family: 'serif', weight: 400, tracking: '-0.015em' },
};

/* ------------------------------------------------------------------ */
/* Calendar                                                             */
/* ------------------------------------------------------------------ */
/** Monday 5 October 2026 (UTC). */
export const WEEK_START = Date.UTC(2026, 9, 5);
export const TODAY = 3;
export const dayDate = (day: number) => new Date(WEEK_START + day * 86_400_000);

/* ------------------------------------------------------------------ */
/* Listings                                                             */
/* ------------------------------------------------------------------ */
export type ListingId = 'olmos' | 'ceibo' | 'ribera' | 'colinas' | 'loft' | 'parque';
export type Kind = 'apartment' | 'duplex' | 'house' | 'loft' | 'ph';
export type ZoneId = 'arboleda' | 'ribera' | 'colinas' | 'centro' | 'parque';
export type Feature = 'balcony' | 'credit' | 'garage' | 'terrace' | 'garden' | 'pool' | 'river' | 'light' | 'patio';
/** Architectural composition used as the listing's "photo" (see facade.tsx). */
export type FacadeKind = 'tower' | 'midrise' | 'duplex' | 'house' | 'loft' | 'ph';
export type Scene = 'day' | 'dusk' | 'night';

export interface Listing {
  id: ListingId;
  kind: Kind;
  zone: ZoneId;
  /** Invented street address (not translated). */
  street: string;
  /** Rooms counted the Río de la Plata way (living included) and bedrooms. */
  rooms: number;
  beds: number;
  baths: number;
  area: number;
  /** Sale price, USD. */
  price: number;
  /** Monthly building fees, USD. */
  fees: number;
  features: Feature[];
  /** Inquiries and visits this week (before the story). */
  inquiries: number;
  visits: number;
  facade: FacadeKind;
  scene: Scene;
  /** Days on the market. */
  days: number;
}

const L = (l: Listing) => l;
export const LISTINGS: Listing[] = [
  L({ id: 'olmos', kind: 'apartment', zone: 'arboleda', street: 'Olmos 1420', rooms: 3, beds: 2, baths: 1, area: 78, price: 168_000, fees: 95, features: ['balcony', 'credit', 'light'], inquiries: 11, visits: 4, facade: 'tower', scene: 'day', days: 12 }),
  L({ id: 'ceibo', kind: 'apartment', zone: 'arboleda', street: 'Ceibo 655', rooms: 3, beds: 2, baths: 1, area: 71, price: 146_000, fees: 70, features: ['credit', 'balcony'], inquiries: 7, visits: 3, facade: 'midrise', scene: 'dusk', days: 26 }),
  L({ id: 'ribera', kind: 'duplex', zone: 'ribera', street: 'Paseo del Río 210', rooms: 4, beds: 3, baths: 2, area: 132, price: 248_000, fees: 140, features: ['terrace', 'river', 'garage'], inquiries: 9, visits: 3, facade: 'duplex', scene: 'dusk', days: 18 }),
  L({ id: 'colinas', kind: 'house', zone: 'colinas', street: 'Los Aromos 88', rooms: 5, beds: 3, baths: 3, area: 210, price: 320_000, fees: 0, features: ['garden', 'pool', 'garage'], inquiries: 6, visits: 2, facade: 'house', scene: 'day', days: 41 }),
  L({ id: 'parque', kind: 'ph', zone: 'parque', street: 'Laprida 1735', rooms: 3, beds: 2, baths: 1, area: 84, price: 158_000, fees: 0, features: ['patio', 'credit'], inquiries: 8, visits: 2, facade: 'ph', scene: 'day', days: 9 }),
  L({ id: 'loft', kind: 'loft', zone: 'centro', street: 'Mitre 402', rooms: 2, beds: 1, baths: 1, area: 58, price: 112_000, fees: 60, features: ['light', 'credit'], inquiries: 5, visits: 1, facade: 'loft', scene: 'night', days: 33 }),
];
export const listingById = (id: ListingId) => LISTINGS.find((l) => l.id === id)!;

/** The listing the buyer asks about, and the cheaper one the agent offers when the budget is lower. */
export const ASKED: ListingId = 'olmos';
export const ALTERNATIVE: ListingId = 'ceibo';
/** Listings sent when the buyer asks for similar options after the visit. */
export const SIMILAR: ListingId[] = ['parque', 'ceibo'];

/** The public site. Fictional `.demo` domain. */
export const SITE_URL = 'lumenpropiedades.demo';
export const listingPath = (id: ListingId) => `${SITE_URL}/propiedad/${listingById(id).street.toLowerCase().replace(/\s+/g, '-')}`;

/* ------------------------------------------------------------------ */
/* People and leads                                                     */
/* ------------------------------------------------------------------ */
export type AdvisorId = 'julia' | 'marcos';
export const ADVISORS: { id: AdvisorId; initials: string; color: string; ink: string }[] = [
  { id: 'julia', initials: 'JR', color: '#2448C8', ink: '#FFFFFF' },
  { id: 'marcos', initials: 'MV', color: '#141414', ink: '#ECE8E1' },
];

export type Source = 'web' | 'whatsapp' | 'portal' | 'sign';
export const SOURCES: Source[] = ['web', 'whatsapp', 'portal', 'sign'];
export type Stage = 'new' | 'qualified' | 'visit' | 'reserve';
export const STAGES: Stage[] = ['new', 'qualified', 'visit', 'reserve'];
export const STAGE_TONE: Record<Stage, Tone> = { new: 'neutral', qualified: 'accent2', visit: 'accent', reserve: 'ink' };

export type PersonId = 'carolina' | 'valeria' | 'andres' | 'lucia' | 'diego' | 'tomas' | 'pablo' | 'sofia' | 'martin';
export type PayId = 'cash' | 'credit' | 'sell';
export type BudgetId = 'low' | 'mid' | 'high';

export interface BaseLead {
  id: Exclude<PersonId, 'carolina'>;
  source: Source;
  stage: Stage;
  listing: ListingId;
  budget: BudgetId;
  pay: PayId;
  score: number;
  /** When they first wrote: day + minutes. */
  day: number;
  min: number;
  /** Seconds to the first answer. */
  responseSec: number;
}

const lead = (l: BaseLead) => l;
/** The pipeline at 23:40 (before the story). */
export const BASE_LEADS: BaseLead[] = [
  lead({ id: 'valeria', source: 'portal', stage: 'new', listing: 'ribera', budget: 'high', pay: 'sell', score: 41, day: 3, min: 21 * 60 + 5, responseSec: 7 }),
  lead({ id: 'andres', source: 'whatsapp', stage: 'new', listing: 'loft', budget: 'low', pay: 'credit', score: 38, day: 3, min: 22 * 60 + 15, responseSec: 5 }),
  lead({ id: 'lucia', source: 'web', stage: 'qualified', listing: 'parque', budget: 'mid', pay: 'credit', score: 72, day: 3, min: 13 * 60 + 40, responseSec: 4 }),
  lead({ id: 'diego', source: 'sign', stage: 'qualified', listing: 'colinas', budget: 'high', pay: 'cash', score: 77, day: 2, min: 18 * 60 + 2, responseSec: 9 }),
  lead({ id: 'tomas', source: 'web', stage: 'visit', listing: 'colinas', budget: 'high', pay: 'sell', score: 88, day: 2, min: 8 * 60 + 12, responseSec: 6 }),
  lead({ id: 'pablo', source: 'portal', stage: 'visit', listing: 'ceibo', budget: 'low', pay: 'credit', score: 81, day: 1, min: 23 * 60 + 18, responseSec: 5 }),
  lead({ id: 'sofia', source: 'whatsapp', stage: 'visit', listing: 'parque', budget: 'mid', pay: 'cash', score: 84, day: 1, min: 10 * 60 + 30, responseSec: 3 }),
  lead({ id: 'martin', source: 'web', stage: 'reserve', listing: 'ribera', budget: 'high', pay: 'cash', score: 95, day: 0, min: 19 * 60 + 40, responseSec: 6 }),
];

/* ------------------------------------------------------------------ */
/* Visits (calendar: Fri 9, Sat 10, Mon 12; 10:00 → 20:00)              */
/* ------------------------------------------------------------------ */
/** Days with hand-written visits (the site offers them too); other days are generated (see story.ts). */
export const CAL_DAYS = [4, 5, 7] as const;
/** The agency shows homes Monday to Saturday (Saturdays until 14:00). */
export const isOpenDay = (weekday: number) => weekday < 6;
export const dayEndFor = (weekday: number) => (weekday === 5 ? 840 : 1200);
export const CAL_START = 600;
export const CAL_END = 1200;
export const CAL_STEP = 30;
export const VISIT_MIN = 60;

export type VisitWhat = 'visit' | 'appraisal' | 'openHouse' | 'signing';
export interface BaseVisit {
  id: string;
  day: number;
  start: number;
  end: number;
  what: VisitWhat;
  who?: PersonId;
  listing: ListingId;
  advisor: AdvisorId;
}
/** People who visit on generated days. */
export const VISITORS: PersonId[] = ['valeria', 'andres', 'lucia', 'diego', 'tomas', 'pablo', 'sofia', 'martin'];
export const BASE_VISITS: BaseVisit[] = [
  { id: 'v-tomas', day: 4, start: 630, end: 690, what: 'visit', who: 'tomas', listing: 'colinas', advisor: 'julia' },
  { id: 'v-appraisal', day: 4, start: 780, end: 840, what: 'appraisal', listing: 'loft', advisor: 'marcos' },
  { id: 'v-pablo', day: 4, start: 960, end: 1020, what: 'visit', who: 'pablo', listing: 'ceibo', advisor: 'marcos' },
  { id: 'v-open', day: 5, start: 600, end: 660, what: 'openHouse', listing: 'loft', advisor: 'julia' },
  { id: 'v-sofia', day: 5, start: 720, end: 780, what: 'visit', who: 'sofia', listing: 'parque', advisor: 'marcos' },
  { id: 'v-martin', day: 7, start: 600, end: 660, what: 'signing', who: 'martin', listing: 'ribera', advisor: 'julia' },
  { id: 'v-lucia', day: 7, start: 1050, end: 1110, what: 'visit', who: 'lucia', listing: 'parque', advisor: 'marcos' },
];

/** The two slots the assistant offers in the chat (held for the live conversation). */
export type SlotId = 'fri' | 'sat';
export const CHAT_SLOTS: Record<SlotId, { day: number; start: number }> = {
  fri: { day: 4, start: 1110 },
  sat: { day: 5, start: 660 },
};
/** Times the site's "Book a visit" offers per day (only the free ones show). */
export const SITE_TIMES: Record<number, number[]> = {
  4: [720, 870, 1020],
  5: [810, 900, 960],
  7: [690, 900, 1140],
};

/* ------------------------------------------------------------------ */
/* The week in numbers (before the story)                               */
/* ------------------------------------------------------------------ */
/** Inquiries this week by source; all of them answered in under a minute (the vertical's key number). */
export const WEEK_BY_SOURCE: Record<Source, number> = { web: 18, whatsapp: 15, portal: 10, sign: 4 };
export const WEEK = {
  /** Of the inquiries above, how many arrived with the office closed. */
  afterHours: 19,
  /** Average first answer, seconds. */
  avgSec: 6,
  visits: 14,
  reserves: 2,
  followups: 31,
  followReplyPct: 0.68,
};
/** Inquiries per day this week (Mon → Thu) before the live one. */
export const WEEK_BY_DAY = [11, 13, 9, 14] as const;

/* ------------------------------------------------------------------ */
/* The story: five beats the visitor plays (no autoplay)                */
/* ------------------------------------------------------------------ */
/**
 * Story times (ms). Nothing runs on its own: each beat is a segment the visitor plays from the
 * SimBar; the clock stops at the beat's `at`, always on a calm frame (no toast, typing or
 * "just now" halo left). Carolina's answers are scripted at fixed times *inside* the beats
 * (see INQUIRY in story.ts); the visitor can answer for her at rest instead.
 */
export const STORY = {
  /** The buyer opens the site's chat. */
  chatOpen: 600,
  /** Chat time 0: the inquiry is sent (23:40). */
  chatStart: 1200,
  /** Bot on: after the visit is booked, the night skips to just after the visit (beat "followup"). */
  timelapse: 20_000,
  timelapseAfterBooking: 1800,
  /** The WhatsApp follow-up starts this long after the jump. */
  follow: 500,
  /** Buyer's phone: the push becomes the WhatsApp thread. */
  openThread: 1700,
  /** Bot off: the night fast-forwards to 9:00 (beat 2) and the first human answer is at 9:12 (beat 3). */
  off: { from: 6000, to: 9000, human: 13_000 },
} as const;

/** The SimBar's beats (labels: demoRealEstate.sim.<id>, or sim.off.<id> with the assistant off). */
export const BEATS = [
  { id: 'inquiry', at: 5_800 },
  { id: 'qualify', at: 12_800 },
  { id: 'visit', at: 19_500 },
  { id: 'followup', at: 24_500 },
  { id: 'reply', at: 30_500 },
] as const;
export const STORY_END = BEATS[BEATS.length - 1].at;

/** Story clock start: Thursday 23:40. */
export const CLOCK_START = { day: TODAY, min: 23 * 60 + 40 };
/** Office opening (bot off: first human answer is at 9:12). */
export const OFFICE_OPENS = { day: 4, min: 9 * 60 };
export const HUMAN_REPLY_MIN = 9 * 60 + 12;
/** Seconds the assistant took to answer each of its messages (shown under the bubble). */
export const BOT_SECONDS: Record<string, number> = { hi: 4, pay: 2, budget: 3, fits: 5, alt: 6, slots: 3, booked: 4 };
