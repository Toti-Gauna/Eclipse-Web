/**
 * Fictional data for "Bodegón Lucero — Demo" (a classic Buenos Aires bodegón with salón,
 * delivery, take-away and reservations). Dishes and people are message keys (namespace
 * `demoRestaurant`) so each locale names them. Prices are fictional demo prices in USD,
 * shown in the visitor's currency (see text.ts). Time: minutes from midnight on a fixed
 * Friday; "now" is 21:30 when the story starts.
 */
import type { DemoTheme } from '../kit';

/** Palette: dark warm · cream · wine · olive. Menu type, tickets, old-school but sharp. */
export const RESTAURANT_THEME: DemoTheme = {
  mode: 'dark',
  bg: '#1A1113',
  surface: '#251A1C',
  sunken: '#140D0F',
  ink: '#F3E6D0',
  muted: '#A8977E',
  line: 'rgb(243 230 208 / 0.12)',
  accent: '#B23A52',
  accentInk: '#F3E6D0',
  accentText: '#E58A9C',
  accent2: '#8C9A4B',
  accent2Ink: '#1A1113',
  accent2Text: '#A7B65F',
  ok: '#9CCB8B',
  warn: '#E2AE5E',
  bad: '#FF8E80',
  info: '#9EC1D6',
  radius: '0.5em',
  display: { family: 'serif', weight: 400, tracking: '-0.01em' },
};

/** The fictional site of the bodegón (`.demo` TLD). */
export const SITE_URL = 'lucero.demo';

/* ------------------------------------------------------------------ */
/* Menu                                                                 */
/* ------------------------------------------------------------------ */
export type Category = 'starters' | 'mains' | 'desserts' | 'drinks';
export const CATEGORIES: Category[] = ['starters', 'mains', 'desserts', 'drinks'];

export type DishId =
  | 'provoleta'
  | 'empanadas'
  | 'napolitana'
  | 'suprema'
  | 'bife'
  | 'ravioles'
  | 'flan'
  | 'panqueque'
  | 'pinguino'
  | 'vermu';

export interface Dish {
  id: DishId;
  cat: Category;
  /** Demo price (USD, converted to the visitor's currency). */
  usd: number;
  /** Gluten-free ("sin TACC"), cooked apart. */
  gf?: boolean;
  /** What the AI offers instead when it's out of stock (same category). */
  alt: DishId;
  /** The house classic (printed with a star on the carta). */
  house?: boolean;
  /** Drinks don't go to the kitchen display. */
  bar?: boolean;
}

export const MENU: Dish[] = [
  { id: 'provoleta', cat: 'starters', usd: 7, gf: true, alt: 'empanadas' },
  { id: 'empanadas', cat: 'starters', usd: 5, alt: 'provoleta' },
  { id: 'napolitana', cat: 'mains', usd: 12, alt: 'suprema', house: true },
  { id: 'suprema', cat: 'mains', usd: 11, alt: 'napolitana' },
  { id: 'bife', cat: 'mains', usd: 15, gf: true, alt: 'napolitana' },
  { id: 'ravioles', cat: 'mains', usd: 10, alt: 'napolitana' },
  { id: 'flan', cat: 'desserts', usd: 4, gf: true, alt: 'panqueque', house: true },
  { id: 'panqueque', cat: 'desserts', usd: 4, alt: 'flan' },
  { id: 'pinguino', cat: 'drinks', usd: 9, gf: true, alt: 'vermu', bar: true },
  { id: 'vermu', cat: 'drinks', usd: 5, gf: true, alt: 'pinguino', bar: true },
];
export const dishById = (id: DishId) => MENU.find((d) => d.id === id)!;

export type Items = Partial<Record<DishId, number>>;
export const itemCount = (items: Items) => Object.values(items).reduce((s, n) => s + (n ?? 0), 0);
export const itemList = (items: Items) => (Object.entries(items) as [DishId, number][]).filter(([, n]) => n > 0);

/* ------------------------------------------------------------------ */
/* People (names, numbers and addresses are message keys)               */
/* ------------------------------------------------------------------ */
export type PersonId =
  | 'marta'
  | 'ramiro'
  | 'lucia'
  | 'sofia'
  | 'gomez'
  | 'ledesma'
  | 'paz'
  | 'rios'
  | 'acosta'
  | 'vidal'
  | 'herrera'
  | 'molina'
  | 'castro'
  | 'navarro';
/** Names used for the reservations of other days (seeded). Not 'rios': Julieta books tomorrow from the site (beat "web"). */
export const GUESTS: PersonId[] = ['acosta', 'vidal', 'herrera', 'molina', 'castro', 'navarro', 'gomez', 'ledesma', 'paz', 'sofia', 'marta'];

/* ------------------------------------------------------------------ */
/* The salón: a floor plan in a 100 × 62 box (landscape; the phone      */
/* rotates it). x / y are table centers.                                */
/* ------------------------------------------------------------------ */
export type TableShape = 'round' | 'square' | 'long';
export interface Table {
  id: number;
  seats: number;
  shape: TableShape;
  x: number;
  y: number;
  /** By the front window. */
  window?: boolean;
}
export const FLOOR = { w: 100, h: 62 } as const;
export const TABLES: Table[] = [
  { id: 1, seats: 2, shape: 'round', x: 10, y: 19 },
  { id: 2, seats: 2, shape: 'round', x: 10, y: 35 },
  { id: 3, seats: 4, shape: 'square', x: 26, y: 19 },
  { id: 4, seats: 4, shape: 'square', x: 26, y: 35 },
  { id: 5, seats: 4, shape: 'square', x: 42, y: 19 },
  { id: 6, seats: 4, shape: 'square', x: 42, y: 35 },
  { id: 7, seats: 4, shape: 'square', x: 58, y: 27 },
  { id: 8, seats: 6, shape: 'long', x: 81, y: 21 },
  { id: 9, seats: 2, shape: 'round', x: 75, y: 37 },
  { id: 10, seats: 2, shape: 'round', x: 89, y: 37 },
  { id: 11, seats: 2, shape: 'round', x: 10, y: 52, window: true },
  { id: 12, seats: 4, shape: 'square', x: 27, y: 52, window: true },
  { id: 13, seats: 4, shape: 'square', x: 45, y: 52, window: true },
  { id: 14, seats: 2, shape: 'round', x: 61, y: 52, window: true },
];
export const tableById = (id: number) => TABLES.find((t) => t.id === id)!;

/** Seated at 21:30 (table → people, since). */
export const BASE_SEATED: Record<number, { people: number; since: number }> = {
  1: { people: 2, since: 21 * 60 + 5 },
  3: { people: 4, since: 20 * 60 + 50 },
  4: { people: 3, since: 21 * 60 + 10 },
  5: { people: 4, since: 21 * 60 },
  7: { people: 4, since: 21 * 60 + 15 },
  8: { people: 6, since: 20 * 60 + 45 },
  10: { people: 2, since: 21 * 60 + 20 },
  13: { people: 4, since: 21 * 60 + 25 },
};

export type BookingVia = 'ai' | 'web' | 'phone' | 'you';
export interface BaseBooking {
  table: number;
  time: number;
  people: number;
  name: PersonId;
  via: BookingVia;
}
/** Tonight's reservations before the story. */
export const BASE_BOOKINGS: BaseBooking[] = [
  { table: 6, time: 22 * 60, people: 4, name: 'gomez', via: 'web' },
  { table: 9, time: 22 * 60, people: 2, name: 'ledesma', via: 'ai' },
  { table: 11, time: 22 * 60 + 15, people: 2, name: 'paz', via: 'phone' },
];
/** Times a table can be booked for (tonight only the ones still ahead). */
export const BOOK_TIMES = [20 * 60 + 30, 21 * 60, 21 * 60 + 30, 22 * 60, 22 * 60 + 30, 23 * 60];
/** The AI's 22:30 booking for 4: first table in this order without a reservation. */
export const AI_TABLES = [12, 3, 5, 7, 4, 13];
/** What Ramiro asks for on line 2. */
export const AI_BOOKING = { time: 22 * 60 + 30, people: 4 } as const;

/* ------------------------------------------------------------------ */
/* Days (reservations book): integers, 0 = Monday 5 Oct 2026            */
/* ------------------------------------------------------------------ */
/** Tonight: Friday 9 October 2026. */
export const TODAY = 4;
/** Friday, October 9 2026 (UTC). */
export const TONIGHT = Date.UTC(2026, 9, 9);
export const dayDate = (day: number) => new Date(TONIGHT + (day - TODAY) * 86_400_000);
/** The bodegón opens Tuesday to Sunday (closed on Mondays). */
export const isOpenDay = (weekday: number) => weekday !== 0;
/** Julieta books from the site for tomorrow (beat "web"). */
export const WEB_BOOKING = { day: TODAY + 1, table: 12, time: 21 * 60 + 30, people: 2, name: 'rios' as PersonId };

/* ------------------------------------------------------------------ */
/* Kitchen                                                              */
/* ------------------------------------------------------------------ */
export type Channel = 'salon' | 'delivery' | 'pickup';
/** Where the order came in: table QR, the bodegón's own site, the AI phone, the waiter. */
export type Source = 'qr' | 'web' | 'ai' | 'waiter';
/** Kitchen display stages. `out` = it left the pass (served · on the way · picked up). */
export type Stage = 'new' | 'cooking' | 'ready' | 'out';
export const STAGES: Stage[] = ['new', 'cooking', 'ready', 'out'];
export const stageIndex = (s: Stage) => STAGES.indexOf(s);
/** The "out" column keeps only the latest few tickets (the rest are archived). */
export const OUT_SHOWN = 4;

export interface TicketPlan {
  channel: Channel;
  source: Source;
  table?: number;
  items: Items;
  /** Story ms (negative: before the story starts). */
  placed: number;
  /** Stage at placement (default new). */
  stage?: Stage;
  /** Scripted bumps by the kitchen inside the beats (story ms, increasing). */
  bumps?: [Stage, number][];
  /** Clock minute it was placed (tickets from before the story). */
  clock?: number;
}

/** On the board at 21:30, numbered from 141. Their bumps happen inside the beats. */
export const BASE_TICKETS: TicketPlan[] = [
  { channel: 'salon', source: 'qr', table: 5, items: { napolitana: 2, provoleta: 1 }, placed: -1, clock: 21 * 60 + 12, stage: 'ready', bumps: [['out', 3000]] },
  { channel: 'delivery', source: 'web', items: { empanadas: 2, bife: 1 }, placed: -1, clock: 21 * 60 + 8, stage: 'out' },
  { channel: 'salon', source: 'qr', table: 8, items: { bife: 3, ravioles: 2, provoleta: 2 }, placed: -1, clock: 21 * 60 + 18, stage: 'cooking', bumps: [['ready', 6000], ['out', 42_500]] },
  { channel: 'pickup', source: 'ai', items: { ravioles: 2 }, placed: -1, clock: 21 * 60 + 21, stage: 'cooking', bumps: [['ready', 24_000]] },
  { channel: 'salon', source: 'waiter', table: 13, items: { suprema: 2, napolitana: 1, flan: 2 }, placed: -1, clock: 21 * 60 + 27, stage: 'new', bumps: [['cooking', 9000]] },
  { channel: 'salon', source: 'qr', table: 10, items: { empanadas: 1, ravioles: 1 }, placed: -1, clock: 21 * 60 + 29, stage: 'new', bumps: [['cooking', 40_000]] },
];
export const FIRST_TICKET = 141;

/* ------------------------------------------------------------------ */
/* The story: four beats the visitor plays (no autoplay)                */
/* ------------------------------------------------------------------ */
/**
 * Each beat's `at` is where its segment ENDS (story ms). Every segment ends on a calm frame:
 * calls hung up, no toast or "just printed" ticket left (≥ 3.5 s after the last event).
 * Labels: demoRestaurant.sim.<id>.
 */
export const BEATS = [
  { id: 'order', at: 18_000 },
  { id: 'rush', at: 37_000 },
  { id: 'qr', at: 50_500 },
  { id: 'web', at: 59_500 },
] as const;
export type BeatId = (typeof BEATS)[number]['id'];
export const STORY_END = BEATS[BEATS.length - 1].at;

/* ------------------------------------------------------------------ */
/* Beat → screen: a simulation takes each view to where it happens      */
/* ------------------------------------------------------------------ */
export type RestaurantTab = 'service' | 'phone' | 'kitchen' | 'floor' | 'menu' | 'qr' | 'numbers';
/** The staff app's sections per screen, in nav order (the phone reaches the QR carta via "Cliente"). */
export const SCREEN_TABS = {
  laptop: ['service', 'phone', 'kitchen', 'floor', 'qr', 'menu', 'numbers'],
  phone: ['service', 'phone', 'kitchen', 'floor', 'menu', 'numbers'],
} as const satisfies Record<'laptop' | 'phone', readonly RestaurantTab[]>;
/**
 * Spots a beat can scroll a section to (`data-focus` in that section's views; `top` = the start).
 * Each section lists the spots its laptop and phone views both mark.
 */
export const FOCUS_SPOTS = {
  service: ['top', 'pass'],
  phone: ['top', 'switchboard'],
  kitchen: ['top'],
  floor: ['top', 'bookings'],
  menu: ['top'],
  qr: ['top'],
  numbers: ['top'],
} as const satisfies Record<RestaurantTab, readonly string[]>;
export type FocusSpot = (typeof FOCUS_SPOTS)[RestaurantTab][number];

/** Where a beat takes a staff view (laptop, or the phone app alone). */
export interface StaffFocus {
  tab: RestaurantTab;
  /** Scrolls the content so this spot is in view (only when it isn't already). */
  spot: FocusSpot;
  /** "Teléfono IA": the line shown in full (phone). */
  line?: 1 | 2 | 3;
  /** "Salón y reservas": the day the reservations book opens on. */
  day?: number;
}
/** The customer's phone (next to the laptop): one of its two tabs, or stay (nothing happens on it). */
export type CustomerFocus = 'order' | 'book' | 'stay';

/**
 * Beat → screen. Calls: the AI phone with its lines; the QR beat: tonight's service (the pass and
 * the salón side by side: the couple sits, orders, table 3 pays and leaves); the web beat: the
 * reservations book on tomorrow (Julieta's booking + its WhatsApp; Sofía's delivery is a toast).
 * The customer's phone shows the carta / the booking form the story's customers use.
 */
export const BEAT_FOCUS: Record<BeatId, { laptop: StaffFocus; phone: StaffFocus; customer: CustomerFocus }> = {
  order: { laptop: { tab: 'phone', spot: 'switchboard' }, phone: { tab: 'phone', spot: 'top', line: 1 }, customer: 'stay' },
  rush: { laptop: { tab: 'phone', spot: 'switchboard' }, phone: { tab: 'phone', spot: 'top', line: 2 }, customer: 'stay' },
  qr: { laptop: { tab: 'service', spot: 'pass' }, phone: { tab: 'service', spot: 'pass' }, customer: 'order' },
  web: { laptop: { tab: 'floor', spot: 'top', day: TODAY + 1 }, phone: { tab: 'floor', spot: 'bookings', day: TODAY + 1 }, customer: 'book' },
};

/** Friday 21:30; the story clock advances one minute every 2 s of a beat. */
export const CLOCK_START = 21 * 60 + 30;
export const storyClock = (t: number) => CLOCK_START + Math.floor(Math.max(0, t) / 2000);

export const STORY = {
  /** Beat 1: Marta calls line 1 to order delivery. */
  order: { ring: 600, line: 1 as const },
  /** Beat 2: three lines ring almost at once (pickup · booking · gluten-free). */
  rush: { alt: 18_600, booking: 19_000, gf: 19_400, altDish: 'suprema' as DishId },
  /** Beat 3: a couple walks in and orders by QR; table 3 asks for the bill and leaves; desserts by QR. */
  qr: { walkIn: 37_600, bill: 39_000, order: 41_500, dessert: 44_000, left: 46_500, dessertTable: 4, dessertItems: { flan: 2, panqueque: 1 } as Items },
  billTable: 3,
  /** Beat 4: Sofía orders delivery on the site; Julieta books tomorrow's table on the site. */
  web: { order: 52_500, booking: 55_500 },
  /** Marta's ticket goes to the stove during the rush. */
  martaCooks: 26_000,
} as const;

/** Before the story (tonight since 20:00): orders, sales, calls, covers. */
export const TONIGHT_BASE = {
  orders: 41,
  direct: 18,
  calls: 17,
  served: 41,
} as const;

/** Tonight's orders by channel before the story (sums to TONIGHT_BASE.orders). */
export const TONIGHT_CHANNELS = { salon: 23, delivery: 11, pickup: 7 } as const;

/** Orders per half hour tonight (20:00, 20:30, 21:00); the 21:30 bar is the story's. */
export const ORDERS_BY_SLOT = [6, 11, 15] as const;
/** Weekly orders/bookings lost by phone: 4 weeks before the AI agent (≈ the rubro default), then with it. */
export const LOST_WEEKS_BEFORE = 4;
/** Week-to-week wobble around the rubro's default before the AI agent. */
export const LOST_BEFORE_WOBBLE = [1, -2, 2, -1] as const;
export const LOST_AFTER = [3, 1, 0, 1] as const;

/** The table a QR customer sits at (the customer's phone scanned it). */
export const QR_TABLE = 7;
