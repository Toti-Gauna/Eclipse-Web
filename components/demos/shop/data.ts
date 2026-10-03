/**
 * Fictional data for "Bruma Tostadores — Demo" (a specialty coffee roaster that sells
 * online). People, products and copy are message keys (namespace `demoShop`) so each
 * locale names them. Prices are demo data in USD per size, shown in the visitor's
 * currency. Time: minutes from midnight on a fixed Tuesday; the story starts at 18:05.
 */
import type { DemoTheme } from '../kit';

/**
 * Palette: cream · espresso · tomato · oat. Playful retail: pills, round cards,
 * chunky sans display, mono for specs and prices.
 * The solid accent is a slightly deeper tomato so white text on it passes AA (4.66:1);
 * the brand tomato (#E4472B) is used for illustrations only (`TOMATO`).
 */
export const SHOP_THEME: DemoTheme = {
  mode: 'light',
  bg: '#FBF6EE',
  surface: '#FFFDF9',
  sunken: '#F3EADB',
  ink: '#2B1B14',
  muted: '#6B5548',
  line: 'rgb(43 27 20 / 0.12)',
  accent: '#D63B1F',
  accentInk: '#FFFFFF',
  accentText: '#B5361C',
  accent2: '#EADFCB',
  accent2Ink: '#2B1B14',
  accent2Text: '#7A5B3A',
  ok: '#2E6B3F',
  warn: '#8A5A12',
  bad: '#A3271B',
  info: '#2F5E85',
  radius: '1.3em',
  display: { family: 'sans', weight: 760, tracking: '-0.045em' },
};

/** Brand tomato (illustrations, the mark). */
export const TOMATO = '#E4472B';
export const ESPRESSO = '#2B1B14';
export const OAT = '#EADFCB';
export const CREAM = '#FBF6EE';

/* ------------------------------------------------------------------ */
/* Catalog                                                              */
/* ------------------------------------------------------------------ */
export type ProductId = 'niebla' | 'huila' | 'sidamo' | 'cerrado' | 'medianoche' | 'moka';
export type SizeId = 's250' | 's500' | 's1000';
export type GrindId = 'beans' | 'espresso' | 'moka' | 'filter' | 'press';
export type BrewId = 'espresso' | 'moka' | 'filter' | 'press';
export type PayId = 'card' | 'transfer' | 'cash';

export interface Product {
  id: ProductId;
  kind: 'coffee' | 'gear';
  /** Bag label color + the ink printed on it (AA on the label). */
  label: string;
  labelInk: string;
  /** Soft backdrop behind the product (tiles, product page). */
  tint: string;
  pattern: 'waves' | 'rays' | 'dots' | 'hills' | 'stars' | 'none';
  shape: 'rect' | 'arch' | 'circle';
  /** 1 light · 2 medium · 3 dark. */
  roast?: 1 | 2 | 3;
  /** USD per size (gear: one price under s250). */
  usd: Partial<Record<SizeId, number>>;
  /** Bags in stock at 18:05. */
  stock: number;
  /** Units sold today before the story. */
  sold: number;
  brew: BrewId[];
}

export const PRODUCTS: Product[] = [
  { id: 'niebla', kind: 'coffee', label: TOMATO, labelInk: '#FFF7EE', tint: '#F8DDD2', pattern: 'waves', shape: 'rect', roast: 2, usd: { s250: 13, s500: 24, s1000: 44 }, stock: 38, sold: 6, brew: ['espresso', 'moka', 'press'] },
  { id: 'huila', kind: 'coffee', label: '#EBA937', labelInk: ESPRESSO, tint: '#F7E6C2', pattern: 'rays', shape: 'arch', roast: 2, usd: { s250: 15, s500: 28, s1000: 52 }, stock: 21, sold: 4, brew: ['filter', 'press'] },
  { id: 'sidamo', kind: 'coffee', label: '#7E9BD1', labelInk: ESPRESSO, tint: '#DFE6F3', pattern: 'dots', shape: 'circle', roast: 1, usd: { s250: 17, s500: 32, s1000: 60 }, stock: 5, sold: 3, brew: ['filter', 'press'] },
  { id: 'cerrado', kind: 'coffee', label: '#2F6B4F', labelInk: '#FBF6EE', tint: '#D8E6DA', pattern: 'hills', shape: 'rect', roast: 3, usd: { s250: 14, s500: 26, s1000: 48 }, stock: 30, sold: 5, brew: ['moka', 'espresso'] },
  { id: 'medianoche', kind: 'coffee', label: ESPRESSO, labelInk: OAT, tint: '#E8DED3', pattern: 'stars', shape: 'arch', roast: 2, usd: { s250: 15, s500: 28, s1000: 52 }, stock: 17, sold: 2, brew: ['moka', 'filter', 'press'] },
  { id: 'moka', kind: 'gear', label: '#B9B2A7', labelInk: ESPRESSO, tint: '#ECE6DC', pattern: 'none', shape: 'rect', usd: { s250: 32 }, stock: 9, sold: 1, brew: ['moka'] },
];
export const productById = (id: ProductId) => PRODUCTS.find((p) => p.id === id)!;
export const SIZES: SizeId[] = ['s250', 's500', 's1000'];
export const GRINDS: GrindId[] = ['beans', 'espresso', 'moka', 'filter', 'press'];
export const PAYS: PayId[] = ['card', 'transfer', 'cash'];
/** Bags left that count as "low stock". */
export const LOW_STOCK = 4;
/** A roast the owner schedules from the panel adds this many bags. */
export const RESTOCK_BAGS = 24;

export interface Line {
  product: ProductId;
  size: SizeId;
  grind: GrindId;
  qty: number;
}
export const sameLine = (a: Line, b: Line) => a.product === b.product && a.size === b.size && a.grind === b.grind;
export const unitUsd = (l: Pick<Line, 'product' | 'size'>) => productById(l.product).usd[l.size] ?? productById(l.product).usd.s250 ?? 0;

/** Free shipping from this cart value (USD, shown converted). */
export const FREE_SHIPPING_USD = 30;
export const SHIPPING_USD = 4;
/** Coupon of the cart-recovery message. */
export const COUPON = { code: 'BRUMA10', pct: 0.1 } as const;

/* ------------------------------------------------------------------ */
/* People                                                               */
/* ------------------------------------------------------------------ */
export type CustomerId =
  | 'ines'
  | 'tomas'
  | 'carla'
  | 'diego'
  | 'ana'
  | 'bruno'
  | 'sol'
  | 'pedro'
  | 'lara'
  | 'nico'
  | 'valeria'
  | 'joaquin'
  | 'martin'
  | 'sofia'
  | 'lautaro';

/** Avatar colors (fill + ink). */
export const PEOPLE: Record<CustomerId, { bg: string; ink: string }> = {
  ines: { bg: '#F8DDD2', ink: '#8E2A16' },
  tomas: { bg: '#D8E6DA', ink: '#245039' },
  carla: { bg: '#DFE6F3', ink: '#2F4A7A' },
  diego: { bg: '#F7E6C2', ink: '#6E4B0E' },
  ana: { bg: '#EADFCB', ink: '#5B4330' },
  bruno: { bg: '#E8DED3', ink: '#3E2A20' },
  sol: { bg: '#F7E6C2', ink: '#6E4B0E' },
  pedro: { bg: '#D8E6DA', ink: '#245039' },
  lara: { bg: '#F8DDD2', ink: '#8E2A16' },
  nico: { bg: '#DFE6F3', ink: '#2F4A7A' },
  valeria: { bg: '#2B1B14', ink: '#EADFCB' },
  joaquin: { bg: '#DFE6F3', ink: '#2F4A7A' },
  martin: { bg: '#EADFCB', ink: '#5B4330' },
  sofia: { bg: '#F8DDD2', ink: '#8E2A16' },
  lautaro: { bg: '#E8DED3', ink: '#3E2A20' },
};

/* ------------------------------------------------------------------ */
/* Orders                                                               */
/* ------------------------------------------------------------------ */
export type Stage = 'new' | 'roasting' | 'shipping' | 'delivered';
export const STAGES: Stage[] = ['new', 'roasting', 'shipping', 'delivered'];

export interface BaseOrder {
  id: number;
  customer: CustomerId;
  lines: Line[];
  pay: PayId;
  stage: Stage;
  /** Clock time it was placed (minutes). */
  clock: number;
}
const L = (product: ProductId, size: SizeId, grind: GrindId, qty = 1): Line => ({ product, size, grind, qty });

/** The latest orders at 18:05 (the board shows them). */
export const BASE_ORDERS: BaseOrder[] = [
  { id: 1040, customer: 'nico', lines: [L('niebla', 's250', 'beans', 2)], pay: 'transfer', stage: 'delivered', clock: 850 },
  { id: 1041, customer: 'lara', lines: [L('cerrado', 's500', 'moka')], pay: 'card', stage: 'shipping', clock: 902 },
  { id: 1042, customer: 'pedro', lines: [L('moka', 's250', 'beans'), L('cerrado', 's250', 'moka')], pay: 'cash', stage: 'shipping', clock: 940 },
  { id: 1043, customer: 'sol', lines: [L('sidamo', 's250', 'filter'), L('medianoche', 's250', 'beans')], pay: 'card', stage: 'roasting', clock: 985 },
  { id: 1044, customer: 'bruno', lines: [L('niebla', 's1000', 'beans')], pay: 'card', stage: 'roasting', clock: 1032 },
  { id: 1045, customer: 'ana', lines: [L('huila', 's250', 'filter')], pay: 'transfer', stage: 'new', clock: 1078 },
];
/** Orders today before 18:05 (the visible ones included); revenue = this × the rubro's average ticket. */
export const ORDERS_BEFORE = 11;
/** Store visits today at 18:05, and one more every VISIT_EVERY ms of story. */
export const VISITS_BEFORE = 470;
export const VISIT_EVERY = 1500;
/** Last Tuesday at this hour, in average tickets (the "vs. last week" reference). */
export const LAST_WEEK_TICKETS = 9;

/* ------------------------------------------------------------------ */
/* Abandoned carts (this week, before the story)                        */
/* ------------------------------------------------------------------ */
export const WEEK_CARTS = { abandoned: 14, sent: 14, read: 10, back: 3, paid: 2 } as const;
/** Carts in the list besides Inés (the visitor's own joins it). */
export const OTHER_CARTS: { id: string; customer: CustomerId; lines: Line[]; status: 'recovered' | 'read' | 'sent'; when: 'today' | 'yesterday'; clock: number }[] = [
  { id: 'martin', customer: 'martin', lines: [L('huila', 's500', 'press')], status: 'sent', when: 'today', clock: 1010 },
  { id: 'sofia', customer: 'sofia', lines: [L('sidamo', 's250', 'filter'), L('moka', 's250', 'beans')], status: 'recovered', when: 'yesterday', clock: 1295 },
  { id: 'lautaro', customer: 'lautaro', lines: [L('niebla', 's500', 'espresso')], status: 'read', when: 'yesterday', clock: 1300 },
];

/* ------------------------------------------------------------------ */
/* Club Bruma (subscriptions + gamification)                            */
/* ------------------------------------------------------------------ */
export type LevelId = 'light' | 'medium' | 'dark';
/** "Granos" needed for each level (roast degrees). */
export const LEVELS: { id: LevelId; from: number; color: string; ink: string }[] = [
  { id: 'light', from: 0, color: '#D9B98C', ink: ESPRESSO },
  { id: 'medium', from: 300, color: '#8B5A3C', ink: '#FFF7EE' },
  { id: 'dark', from: 600, color: '#3A241A', ink: OAT },
];
export const levelFor = (granos: number): LevelId => (granos >= 600 ? 'dark' : granos >= 300 ? 'medium' : 'light');
export const CLUB = {
  members: 128,
  byLevel: { light: 54, medium: 49, dark: 25 } as Record<LevelId, number>,
  /** Average subscription per month (USD). */
  subUsd: 22,
  avgStreak: 5.2,
  churnMonth: 3,
  /** Granos for a streak month and for the visitor's purchases (per USD). */
  streakBonus: 100,
};
export const BOARD: { id: CustomerId; granos: number; streak: number }[] = [
  { id: 'valeria', granos: 940, streak: 11 },
  { id: 'joaquin', granos: 640, streak: 7 },
  { id: 'tomas', granos: 585, streak: 5 },
  { id: 'ana', granos: 520, streak: 4 },
  { id: 'bruno', granos: 410, streak: 3 },
];
/** The customer's own membership (storefront "Club" page). */
export const MY_CLUB = { granos: 340, streak: 3 };

/* ------------------------------------------------------------------ */
/* Site chat                                                            */
/* ------------------------------------------------------------------ */
export const CHATS_BEFORE = { total: 40, byBot: 37, sales: 8, human: 3 } as const;
export const TOP_QUESTIONS = [
  { id: 'moka', count: 12 },
  { id: 'roastDay', count: 8 },
  { id: 'shipping', count: 7 },
] as const;

/* ------------------------------------------------------------------ */
/* The story (ms on a 30 s loop)                                        */
/* ------------------------------------------------------------------ */
export const LOOP_MS = 30_000;
/** 18:05 when the story starts; one minute every 2 s; +30 min when "half an hour later" happens. */
export const NOW_START = 18 * 60 + 5;
export const MINUTE_MS = 2000;
export const JUMP_MINUTES = 30;

export const STORY = {
  /** The site bot greets Inés (peek) — chat time 0. */
  chatStart: 1000,
  /** She opens the chat. */
  chatOpen: 3000,
  orderTomas: 2000,
  orderCarla: 6400,
  move1: 9200,
  move2: 15_500,
  levelUp: 23_000,
  move3: 23_800,
  faq: 25_200,
  orderDiego: 26_800,
} as const;
/** Inés's journey after she adds the bot's pick (ms after the tap). */
export const AFTER_ADD = { cart: 450, checkout: 1650, leave: 3450, jump: 5450, push: 6050, open: 7850 } as const;
/** After "Back to my cart" (ms after the tap). */
export const AFTER_BACK = { checkout: 650, press: 2050, paid: 2650 } as const;
/** Without the automation, when the panel gives the cart up. */
export const LOST_AFTER_LEAVE = 8000;

/** The visitor's own abandoned cart: the recovery message arrives this long after they leave it (real time). */
export const MINE_RECOVERY_MS = 5000;

export const SITE_URL = 'brumatostadores.demo';
export const CUSTOMER_PHONE = '+54 9 11 6•••-4410';
