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
export type PersonId = 'marta' | 'ramiro' | 'lucia' | 'sofia' | 'gomez' | 'ledesma' | 'paz' | 'rios';

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
/** Times offered to book tonight. */
export const BOOK_TIMES = [22 * 60, 22 * 60 + 30, 23 * 60, 23 * 60 + 30];
/** The AI's 22:30 booking for 4: first table in this order without a reservation. */
export const AI_TABLES = [12, 3, 5, 7, 4, 13];
/** What Ramiro asks for on line 2. */
export const AI_BOOKING = { time: 22 * 60 + 30, people: 4 } as const;

/* ------------------------------------------------------------------ */
/* Kitchen                                                              */
/* ------------------------------------------------------------------ */
export type Channel = 'salon' | 'delivery' | 'pickup';
/** Where the order came in: table QR, the bodegón's own site, the AI phone, the waiter. */
export type Source = 'qr' | 'web' | 'ai' | 'waiter';
export type Stage = 'new' | 'cooking' | 'ready' | 'out' | 'done';
export const BOARD_STAGES: Exclude<Stage, 'done'>[] = ['new', 'cooking', 'ready', 'out'];

export interface TicketPlan {
  channel: Channel;
  source: Source;
  table?: number;
  items: Items;
  /** Story ms (negative: before the story starts). */
  placed: number;
  cook: number;
  ready: number;
  /** Delivery leaves the kitchen ("en camino"). */
  out?: number;
  /** Served / picked up / delivered: leaves the board. */
  done?: number;
  /** Clock minute it was placed (tickets from before the story). */
  clock?: number;
}

/** On the board at 21:30, numbered from 141. */
export const BASE_TICKETS: TicketPlan[] = [
  { channel: 'salon', source: 'qr', table: 5, items: { napolitana: 2, provoleta: 1 }, placed: -1, clock: 21 * 60 + 12, cook: -1, ready: -1, done: 3000 },
  { channel: 'delivery', source: 'web', items: { empanadas: 2, bife: 1 }, placed: -1, clock: 21 * 60 + 8, cook: -1, ready: -1, out: -1, done: 9500 },
  { channel: 'salon', source: 'qr', table: 8, items: { bife: 3, ravioles: 2, provoleta: 2 }, placed: -1, clock: 21 * 60 + 18, cook: -1, ready: 6500, done: 13_000 },
  { channel: 'pickup', source: 'ai', items: { ravioles: 2 }, placed: -1, clock: 21 * 60 + 21, cook: -1, ready: 10_000, done: 17_500 },
  { channel: 'salon', source: 'waiter', table: 13, items: { suprema: 2, napolitana: 1, flan: 2 }, placed: -1, clock: 21 * 60 + 27, cook: 2000, ready: 15_500, done: 23_000 },
  { channel: 'salon', source: 'qr', table: 10, items: { empanadas: 1, ravioles: 1 }, placed: -1, clock: 21 * 60 + 29, cook: 4500, ready: 12_500, done: 20_500 },
];
export const FIRST_TICKET = 141;

/** Stage durations after a story ticket is placed. */
export const TICKET_FLOW = { cook: 2400, ready: 9000, out: 12_000, pickupDone: 18_000, salonDone: 15_000 } as const;

/* ------------------------------------------------------------------ */
/* The story (ms on a 28 s loop)                                        */
/* ------------------------------------------------------------------ */
export const LOOP_MS = 28_000;
/** While the visitor is engaged the clock may run this far past the loop (their actions play out). */
export const OVERRUN_MS = 14_000;
/** Friday 21:30; the story clock advances one minute every 2 s. */
export const CLOCK_START = 21 * 60 + 30;
export const storyClock = (t: number) => CLOCK_START + Math.floor(Math.max(0, t) / 2000);
/** Friday, October 9 2026 (UTC). */
export const TONIGHT = Date.UTC(2026, 9, 9);

export const STORY = {
  /** Rush hour: three lines ring almost at once. */
  ring: { order: 800, booking: 1600, gf: 2400 },
  /** Sofía orders from the site (the paired customer phone plays it). */
  web: { add1: 2200, add2: 3300, cart: 4300, mode: 4900, place: 5500 },
  /** A couple walks in and sits at a free 2-top; they order by QR. */
  walkIn: { at: 7000, order: 12_600 },
  /** Table 3 asks for the bill, then leaves. */
  bill: { table: 3, at: 18_000, free: 23_500 },
  /** Dessert rounds by QR. */
  desserts: [
    { at: 19_400, table: 4, items: { flan: 2, panqueque: 1 } as Items },
    { at: 24_600, table: 7, items: { panqueque: 2 } as Items },
  ],
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

/** Orders per half hour tonight (20:00, 20:30, 21:00); the 21:30 bar is the story's (it grows live). */
export const ORDERS_BY_SLOT = [6, 11, 15] as const;
/** Weekly orders/bookings lost by phone: 4 weeks before the AI agent (≈ the rubro default), then with it. */
export const LOST_WEEKS_BEFORE = 4;
/** Week-to-week wobble around the rubro's default before the AI agent. */
export const LOST_BEFORE_WOBBLE = [1, -2, 2, -1] as const;
export const LOST_AFTER = [3, 1, 0, 1] as const;
