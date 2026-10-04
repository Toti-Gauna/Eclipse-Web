/**
 * Bodegón Lucero — the story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did;
 * every screen DERIVES the night from (story time t, that state) with `deriveRestaurant`,
 * which is pure: pausing, reduced motion and two screens in sync come for free.
 *
 * Nothing plays on its own (v3). Friday 21:30, the visitor plays four beats from the SimBar:
 * 1 order — Marta calls line 1 and the AI voice agent takes her delivery order.
 * 2 rush — three lines ring at once: a take-away order, Ramiro books a table for 4,
 *   Lucía asks for gluten-free dishes and orders.
 * 3 qr — a couple walks in and orders by QR, table 3 asks for the bill, desserts by QR.
 * 4 web — Sofía orders delivery on the site; Julieta books tomorrow's table on the site.
 * Between beats the clock is stopped. What the visitor does (order from the carta, book a
 * table on any day, move a kitchen ticket, mark a dish out of stock, switch the AI phone
 * off) is stamped with `t` and shows at once.
 */
import { createDemoStore, runVoice, weekdayOf, type DemoStore, type VoiceLine, type VoiceScript, type VoiceState } from '../kit';
import {
  AI_BOOKING,
  AI_TABLES,
  BASE_BOOKINGS,
  BASE_SEATED,
  BASE_TICKETS,
  BEATS,
  BOOK_TIMES,
  FIRST_TICKET,
  GUESTS,
  MENU,
  OUT_SHOWN,
  QR_TABLE,
  STORY,
  TABLES,
  TODAY,
  TONIGHT_BASE,
  WEB_BOOKING,
  dishById,
  isOpenDay,
  itemList,
  stageIndex,
  storyClock,
  type BookingVia,
  type Channel,
  type DishId,
  type Items,
  type PersonId,
  type Source,
  type Stage,
  type Table,
  type TicketPlan,
} from './data';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export interface Range {
  from: number;
  to: number | null;
}
export type OrderMode = 'table' | 'delivery' | 'pickup';
export interface MyOrder {
  id: string;
  items: Items;
  mode: OrderMode;
  /** A note for the kitchen ("sin sal"). Local demo data only. */
  note: string;
  /** Story time it was placed. */
  at: number;
}
export interface MyBooking {
  /** Day index (TODAY = tonight). */
  day: number;
  table: number;
  time: number;
  people: number;
  /** Story time it was made. */
  at: number;
  /** you: from the staff floor plan · web: from the customer's phone. */
  via: 'you' | 'web';
}

export interface RestaurantState {
  orders: MyOrder[];
  bookings: MyBooking[];
  /** Dish → story time it ran out. */
  soldOut: Partial<Record<DishId, number>>;
  /** When the AI phone was off. */
  aiOff: Range[];
  /** Kitchen display: tickets the visitor moved (stage + story time). */
  moved: Record<string, { stage: Stage; at: number }>;
}

const fresh = (): RestaurantState => ({ orders: [], bookings: [], soldOut: {}, aiOff: [], moved: {} });

export type RestaurantStore = DemoStore<RestaurantState>;

/** Module-level (stable) factory for usePairedStore. Beats: no autoplay; "Reiniciar" = a fresh night. */
export function createRestaurantStore(paired: boolean): RestaurantStore {
  return createDemoStore<RestaurantState>(fresh(), { beats: BEATS, paired, reset: fresh });
}

export const isOn = (ranges: Range[], at: number) => !ranges.some((r) => at >= r.from && (r.to === null || at < r.to));
export const isOffNow = (ranges: Range[]) => ranges.some((r) => r.to === null);
export const isSoldOut = (soldOut: RestaurantState['soldOut'], dish: DishId, at = Infinity) => {
  const s = soldOut[dish];
  return s !== undefined && s <= at;
};

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  order: (items: Items, mode: OrderMode, note: string) => (s: RestaurantState, t: number): RestaurantState => ({
    ...s,
    orders: [...s.orders, { id: `you-${s.orders.length + 1}`, items, mode, note: note.trim().slice(0, 60), at: t }],
  }),
  book: (b: Omit<MyBooking, 'at'>) => (s: RestaurantState, t: number): RestaurantState =>
    s.bookings.some((x) => x.day === b.day && x.table === b.table) ? s : { ...s, bookings: [...s.bookings, { ...b, at: t }] },
  toggleStock: (dish: DishId) => (s: RestaurantState, t: number): RestaurantState => {
    if (s.soldOut[dish] !== undefined) {
      const next = { ...s.soldOut };
      delete next[dish];
      return { ...s, soldOut: next };
    }
    return { ...s, soldOut: { ...s.soldOut, [dish]: t } };
  },
  toggleAi: () => (s: RestaurantState, t: number): RestaurantState => {
    const off = isOffNow(s.aiOff);
    return { ...s, aiOff: off ? s.aiOff.map((r) => (r.to === null ? { ...r, to: t } : r)) : [...s.aiOff, { from: t, to: null }] };
  },
  move: (ticket: string, stage: Stage) => (s: RestaurantState, t: number): RestaurantState => ({
    ...s,
    moved: { ...s.moved, [ticket]: { stage, at: t } },
  }),
};

/* ------------------------------------------------------------------ */
/* Calls: timing per kind (texts are added per locale, see scripts.ts)  */
/* ------------------------------------------------------------------ */
export type CallKind = 'order' | 'booking' | 'gf' | 'alt';
type Who = VoiceLine['who'];
interface Flow {
  ringMs: number;
  lines: { who: Who; ms: number; gapMs?: number }[];
  /** Line index where the agent checks the menu / the floor. */
  check: number;
  /** Line index where the order / booking lands. */
  act: number;
}
const L = (who: Who, ms: number, gapMs = 250) => ({ who, ms, gapMs });
export const FLOWS: Record<CallKind, Flow> = {
  order: { ringMs: 1400, lines: [L('agent', 1500), L('caller', 2100), L('tool', 900), L('agent', 2800), L('caller', 900), L('tool', 800), L('agent', 1700)], check: 2, act: 5 },
  booking: { ringMs: 1400, lines: [L('agent', 1400), L('caller', 1800), L('tool', 900), L('agent', 2000), L('caller', 1000), L('tool', 800), L('agent', 1600)], check: 2, act: 5 },
  gf: { ringMs: 1400, lines: [L('agent', 1400), L('caller', 1900), L('tool', 900), L('agent', 2600), L('caller', 1500), L('tool', 800), L('agent', 1500)], check: 2, act: 5 },
  alt: { ringMs: 1300, lines: [L('agent', 1400), L('caller', 1700), L('tool', 900), L('agent', 2600), L('caller', 900), L('tool', 800), L('agent', 1500)], check: 2, act: 5 },
};
/** Rings before an unanswered call counts as missed. */
export const MISSED_RING_MS = 5200;

/** The call's script with per-locale texts (one per line) and tool icons. */
export function callScript(kind: CallKind, missed: boolean, texts: string[] = [], icons: VoiceLine['icon'][] = []): VoiceScript {
  const flow = FLOWS[kind];
  return {
    ringMs: missed ? MISSED_RING_MS : flow.ringMs,
    missed,
    lines: flow.lines.map((l, i) => ({ ...l, text: texts[i] ?? '', icon: icons[i] })),
  };
}
const TIMING = Object.fromEntries((Object.keys(FLOWS) as CallKind[]).map((k) => [k, runVoice(callScript(k, false), 0)])) as Record<CallKind, VoiceState>;
/** ms after the ring starts: the agent checks / the order or booking lands. */
const at = (kind: CallKind, which: 'check' | 'act') => TIMING[kind].starts[FLOWS[kind][which]];
const callEnd = (kind: CallKind, missed: boolean) => (missed ? MISSED_RING_MS : TIMING[kind].endsAt);

/* ------------------------------------------------------------------ */
/* Derived types                                                        */
/* ------------------------------------------------------------------ */
export type LineId = 1 | 2 | 3;

export interface CallPlan {
  id: string;
  kind: CallKind;
  line: LineId;
  /** Story time it starts ringing. */
  start: number;
  missed: boolean;
  /** Story time it ends (hung up / missed). */
  end: number;
  /** Order calls: what was asked, what was taken, substitutions (asked → offered). */
  asked?: Items;
  items?: Items;
  subs?: [DishId, DishId | null][];
  /** Gluten-free call: dishes suggested. */
  gfList?: DishId[];
  /** Booking call: the table (null if nothing fits). */
  table?: number | null;
  /** The ticket number it created. */
  ticket?: number;
  /** Clock minute the order is promised (delivery arrives / take-away ready). */
  eta?: number;
  /** Alt call: the dish asked for. */
  dish?: DishId;
  /** Timing-only voice state (phase, timer). Display it with texts via `callScript`. */
  voice: VoiceState;
}

export interface Ticket {
  id: string;
  num: number;
  channel: Channel;
  source: Source;
  table?: number;
  items: Items;
  /** Story time it was placed (−1 before the story). */
  placed: number;
  /** Clock minute it was placed. */
  clock: number;
  stage: Stage;
  /** Story time the current stage began (−Infinity: before the story). */
  stageAt: number;
  /** The visitor set the current stage (kitchen display). */
  movedByYou: boolean;
  who?: PersonId | 'you';
  gf?: boolean;
  note?: string;
  /** USD total. */
  usd: number;
  /** Clock minute it is promised (delivery arrives / take-away ready). */
  eta?: number;
  /** The visitor's order id. */
  mine?: string;
  /** Drinks only: straight from the bar, never on the kitchen display. */
  bar: boolean;
}

export type TableStatus = 'free' | 'seated' | 'bill' | 'reserved' | 'done';
export interface Booking {
  key: string;
  day: number;
  table: number;
  time: number;
  people: number;
  name: PersonId | 'you';
  via: BookingVia;
  /** Story time it was made (−Infinity: before the story). */
  at: number;
  /** The visitor made it (never "fresh": it shows at once, the clock is stopped). */
  mine?: boolean;
  /** The AI is holding it (between checking the floor and confirming). */
  pending?: boolean;
}
export interface TableView {
  id: number;
  status: TableStatus;
  people?: number;
  since?: number;
  booking?: Booking;
  /** Story time of the last change made by the story (−Infinity: none / by the visitor). */
  changedAt: number;
}

export type EventKind = 'ring' | 'aiOrder' | 'aiBooking' | 'aiGf' | 'web' | 'qr' | 'walkIn' | 'out' | 'bill' | 'missed' | 'alt' | 'youOrder' | 'youBooking' | 'webBooking';
export interface RestaurantEvent {
  id: string;
  at: number;
  kind: EventKind;
  line?: LineId;
  ticket?: number;
  table?: number;
  people?: number;
  time?: number;
  day?: number;
  dish?: DishId;
  alt?: DishId | null;
  who?: PersonId;
}
/** Events the visitor caused: they show at once and never as a timed toast (the clock is stopped). */
export const isMine = (e: RestaurantEvent) => e.kind === 'youOrder' || e.kind === 'youBooking';

export interface RestaurantView {
  t: number;
  clock: number;
  calls: CallPlan[];
  /** Per line: the latest call that started (null: idle). */
  lines: Record<LineId, CallPlan | null>;
  /** Calls live (ringing or talking) right now. */
  liveCount: number;
  tickets: Ticket[];
  /** On the kitchen display now (no drinks-only tickets; only the latest few that left). */
  board: Ticket[];
  tables: TableView[];
  /** Tonight's reservations. */
  bookings: Booking[];
  events: RestaurantEvent[];
  stats: {
    orders: number;
    direct: number;
    usd: number;
    covers: number;
    calls: number;
    missed: number;
    peak: number;
    bookings: number;
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const inStock = (s: RestaurantState, dish: DishId, when: number) => !isSoldOut(s.soldOut, dish, when);
/** The dish itself if available, else its alternative, else anything of the same category. */
export function substitute(s: RestaurantState, dish: DishId, when: number): DishId | null {
  if (inStock(s, dish, when)) return dish;
  const d = dishById(dish);
  const candidates = [d.alt, ...MENU.filter((m) => m.cat === d.cat && m.id !== dish).map((m) => m.id)];
  return candidates.find((c) => c !== dish && inStock(s, c, when)) ?? null;
}
function fill(s: RestaurantState, asked: Items, when: number) {
  const items: Items = {};
  const subs: [DishId, DishId | null][] = [];
  for (const [dish, qty] of itemList(asked)) {
    const got = substitute(s, dish, when);
    if (got !== dish) subs.push([dish, got]);
    if (got) items[got] = (items[got] ?? 0) + qty;
  }
  return { items, subs };
}
export const totalUsd = (items: Items) => itemList(items).reduce((sum, [d, n]) => sum + dishById(d).usd * n, 0);
export const kitchenItems = (items: Items) => itemList(items).some(([d]) => !dishById(d).bar);
export const channelOf = (mode: OrderMode): Channel => (mode === 'table' ? 'salon' : mode);

/** Story stage of a ticket at `t` (placement stage + scripted bumps). */
function storyStage(plan: TicketPlan, t: number): { stage: Stage; at: number } {
  let stage: Stage = plan.stage ?? 'new';
  let since = plan.placed < 0 ? -Infinity : plan.placed;
  for (const [s, when] of plan.bumps ?? []) {
    if (t >= when) {
      stage = s;
      since = when;
    }
  }
  return { stage, at: since };
}

/**
 * The visitor's move wins unless the story moved the ticket FURTHER along after it
 * (the kitchen kept working in a later beat).
 */
function withMove(story: { stage: Stage; at: number }, move: { stage: Stage; at: number } | undefined) {
  if (!move) return { ...story, byYou: false };
  if (story.at > move.at && stageIndex(story.stage) > stageIndex(move.stage)) return { ...story, byYou: false };
  return { stage: move.stage, at: move.at, byYou: true };
}

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
/** The whole night at story time `t` (`instant`: reduced motion, calls show their outcome). */
export function deriveRestaurant(state: RestaurantState, t: number, instant: boolean): RestaurantView {
  const events: RestaurantEvent[] = [];

  /* Calls ---------------------------------------------------------- */
  const plan = (id: string, kind: CallKind, line: LineId, start: number): CallPlan => {
    const missed = !isOn(state.aiOff, start);
    return { id, kind, line, start, missed, end: start + callEnd(kind, missed), voice: runVoice(callScript(kind, missed), t - start, { instant: instant && t >= start }) };
  };
  const R = STORY.rush;
  const c1 = plan('order', 'order', STORY.order.line, STORY.order.ring);
  const cAlt = plan('alt', 'alt', 1, R.alt);
  const cBook = plan('booking', 'booking', 2, R.booking);
  const cGf = plan('gf', 'gf', 3, R.gf);
  const calls: CallPlan[] = [c1, cAlt, cBook, cGf];

  // Marta: delivery order (the agent checks the menu, offers alternatives).
  c1.asked = { napolitana: 2, flan: 1 };
  if (!c1.missed) Object.assign(c1, fill(state, c1.asked, c1.start + at('order', 'check')));
  // Take-away of one dish (the agent offers an alternative if it ran out).
  cAlt.dish = R.altDish;
  cAlt.asked = { [R.altDish]: 1 };
  if (!cAlt.missed) Object.assign(cAlt, fill(state, cAlt.asked, cAlt.start + at('alt', 'check')));
  // Lucía: gluten-free question → take-away.
  if (!cGf.missed) {
    const when = cGf.start + at('gf', 'check');
    cGf.gfList = (['bife', 'provoleta', 'flan'] as DishId[]).filter((d) => inStock(state, d, when));
    const pick = (['bife', 'provoleta'] as DishId[]).find((d) => inStock(state, d, when));
    cGf.items = pick ? { [pick]: 1 } : {};
    cGf.asked = cGf.items;
  }

  /* Floor: seats, bookings (tonight) --------------------------------- */
  const bookings: Booking[] = BASE_BOOKINGS.map((b) => ({ key: `base-${b.table}`, day: TODAY, ...b, at: -Infinity }));
  const seated = new Map<number, { people: number; since: number; at: number; bill?: number; left?: number }>();
  for (const [id, s] of Object.entries(BASE_SEATED)) seated.set(Number(id), { ...s, at: -Infinity });
  for (const b of state.bookings) {
    if (b.day !== TODAY) continue;
    bookings.push({ key: `mine-${b.day}-${b.table}`, day: TODAY, table: b.table, time: b.time, people: b.people, name: 'you', via: b.via === 'web' ? 'web' : 'you', at: b.at, mine: true });
    events.push({ id: `you-b-${b.day}-${b.table}`, at: b.at, kind: 'youBooking', table: b.table, people: b.people, time: b.time, day: b.day });
  }
  const bookedAt = (table: number, when: number) => bookings.some((b) => b.table === table && b.at <= when);
  const isFreeAt = (table: number, when: number) => {
    const s = seated.get(table);
    const occupied = s && s.at <= when && (s.left === undefined || when < s.left);
    return !occupied && !bookedAt(table, when);
  };
  // Ramiro: a table for 4 at 22:30 (held when the agent checks, confirmed after).
  if (!cBook.missed) {
    const check = cBook.start + at('booking', 'check');
    const done = cBook.start + at('booking', 'act');
    const table = AI_TABLES.find((id) => !bookedAt(id, check)) ?? null;
    cBook.table = table;
    if (table !== null && t >= check) {
      bookings.push({ key: 'ai-ramiro', day: TODAY, table, time: AI_BOOKING.time, people: AI_BOOKING.people, name: 'ramiro', via: 'ai', at: check, pending: t < done });
      events.push({ id: 'ai-booking', at: done, kind: 'aiBooking', line: 2, table, people: AI_BOOKING.people, time: AI_BOOKING.time, who: 'ramiro' });
    }
  }
  // A couple walks in (first free 2-top) and orders by QR.
  const Q = STORY.qr;
  const walkTable = [2, 14, 12].find((id) => isFreeAt(id, Q.walkIn)) ?? null;
  if (walkTable !== null) {
    seated.set(walkTable, { people: 2, since: storyClock(Q.walkIn), at: Q.walkIn });
    events.push({ id: 'walk-in', at: Q.walkIn, kind: 'walkIn', table: walkTable, people: 2 });
  }
  // Table 3 asks for the bill and leaves.
  const billed = seated.get(STORY.billTable);
  if (billed) {
    billed.bill = Q.bill;
    billed.left = Q.left;
    events.push({ id: 'bill', at: Q.bill, kind: 'bill', table: STORY.billTable });
  }

  /* Kitchen ---------------------------------------------------------- */
  interface Placed {
    id: string;
    plan: TicketPlan;
    who?: PersonId | 'you';
    gf?: boolean;
    note?: string;
    mine?: string;
    event?: Omit<RestaurantEvent, 'at' | 'ticket'>;
    call?: CallPlan;
  }
  const placed: Placed[] = [];
  const add = (p: Omit<Placed, 'plan'> & { channel: Channel; source: Source; table?: number; items: Items; at: number; bumps?: TicketPlan['bumps'] }) => {
    if (!itemList(p.items).length) return;
    const { channel, source, table, items, at: when, bumps, ...rest } = p;
    placed.push({ ...rest, plan: { channel, source, table, items, placed: when, bumps } });
  };
  if (!c1.missed && c1.items) {
    add({ id: 'ai-marta', channel: 'delivery', source: 'ai', items: c1.items, at: c1.start + at('order', 'act'), bumps: [['cooking', STORY.martaCooks]], who: 'marta', call: c1, event: { id: 'ai-order', kind: 'aiOrder', line: 1, who: 'marta' } });
  }
  if (!cAlt.missed && cAlt.items) {
    add({ id: 'ai-alt', channel: 'pickup', source: 'ai', items: cAlt.items, at: cAlt.start + at('alt', 'act'), call: cAlt, event: { id: 'ai-alt', kind: 'alt', line: 1, dish: cAlt.dish, alt: cAlt.subs?.[0]?.[1] ?? null } });
  }
  if (!cGf.missed && cGf.items) {
    add({ id: 'ai-lucia', channel: 'pickup', source: 'ai', items: cGf.items, at: cGf.start + at('gf', 'act'), who: 'lucia', gf: true, call: cGf, event: { id: 'ai-gf', kind: 'aiGf', line: 3, who: 'lucia' } });
  }
  if (walkTable !== null) {
    add({ id: 'qr-walkin', channel: 'salon', source: 'qr', table: walkTable, items: fill(state, { napolitana: 1, empanadas: 1, vermu: 2 }, Q.order).items, at: Q.order, event: { id: 'qr-walkin', kind: 'qr', table: walkTable } });
  }
  add({ id: 'qr-dessert', channel: 'salon', source: 'qr', table: Q.dessertTable, items: fill(state, Q.dessertItems, Q.dessert).items, at: Q.dessert, event: { id: 'qr-dessert', kind: 'qr', table: Q.dessertTable } });
  add({ id: 'web-sofia', channel: 'delivery', source: 'web', items: fill(state, { ravioles: 1, flan: 1 }, STORY.web.order).items, at: STORY.web.order, who: 'sofia', event: { id: 'web', kind: 'web' } });
  state.orders.forEach((o) => {
    const channel = channelOf(o.mode);
    add({ id: o.id, channel, source: o.mode === 'table' ? 'qr' : 'web', table: o.mode === 'table' ? QR_TABLE : undefined, items: o.items, at: o.at, who: 'you', note: o.note || undefined, mine: o.id, event: { id: `you-${o.id}`, kind: 'youOrder' } });
  });
  // Placement order numbers the tickets (same time: story before the visitor, then in order).
  placed.sort((a, b) => a.plan.placed - b.plan.placed || Number(!!a.mine) - Number(!!b.mine));

  const tickets: Ticket[] = [];
  const pushTicket = (id: string, num: number, p: TicketPlan, extra: Partial<Ticket> = {}) => {
    const bar = !kitchenItems(p.items);
    // Drinks only: served by the bar at once.
    const story = bar ? { stage: 'out' as Stage, at: p.placed < 0 ? -Infinity : p.placed } : storyStage(p, t);
    const { stage, at: stageAt, byYou } = withMove(story, state.moved[id]);
    const clock = p.clock ?? storyClock(p.placed);
    tickets.push({
      id,
      num,
      channel: p.channel,
      source: p.source,
      table: p.table,
      items: p.items,
      placed: p.placed,
      clock,
      stage,
      stageAt,
      movedByYou: byYou,
      usd: totalUsd(p.items),
      eta: p.channel === 'delivery' ? clock + 40 : p.channel === 'pickup' ? clock + 25 : undefined,
      bar,
      ...extra,
    });
  };
  BASE_TICKETS.forEach((p, i) => pushTicket(`base-${i}`, FIRST_TICKET + i, p));
  placed.forEach((p, i) => {
    const num = FIRST_TICKET + BASE_TICKETS.length + i;
    if (p.call) {
      p.call.ticket = num;
      p.call.eta = storyClock(p.plan.placed) + (p.plan.channel === 'delivery' ? 40 : 25);
    }
    if (p.plan.placed > t) return;
    pushTicket(p.id, num, p.plan, { who: p.who, gf: p.gf, mine: p.mine, note: p.note });
    if (p.event) events.push({ ...p.event, at: p.plan.placed, ticket: num });
  });
  for (const tk of tickets) {
    if (tk.channel === 'delivery' && tk.stage === 'out' && tk.stageAt >= 0 && !tk.movedByYou) {
      events.push({ id: `out-${tk.id}`, at: tk.stageAt, kind: 'out', ticket: tk.num });
    }
  }

  /* Calls: events + per-line view ---------------------------------- */
  for (const c of calls) {
    if (c.start <= t) events.push({ id: `ring-${c.id}`, at: c.start, kind: 'ring', line: c.line });
    if (c.missed && c.end <= t) events.push({ id: `missed-${c.id}`, at: c.end, kind: 'missed', line: c.line });
  }
  const lines = { 1: null, 2: null, 3: null } as Record<LineId, CallPlan | null>;
  for (const c of calls) {
    const cur = lines[c.line];
    if (c.start <= t && (!cur || c.start > cur.start)) lines[c.line] = c;
  }
  const live = calls.filter((c) => c.voice.phase === 'ringing' || c.voice.phase === 'live');

  /* Floor view (tonight) --------------------------------------------- */
  const visibleBookings = bookings.filter((b) => b.at <= t).sort((a, b) => a.time - b.time || a.table - b.table);
  const tables: TableView[] = TABLES.map((tb) => {
    const s = seated.get(tb.id);
    const booking = visibleBookings.find((b) => b.table === tb.id);
    const here = s && s.at <= t && (s.left === undefined || t < s.left);
    if (here) {
      const bill = s.bill !== undefined && t >= s.bill;
      return { id: tb.id, status: bill ? 'bill' : 'seated', people: s.people, since: s.since, booking, changedAt: bill ? s.bill! : s.at };
    }
    if (booking) return { id: tb.id, status: 'reserved', booking, people: booking.people, changedAt: booking.mine ? -Infinity : booking.at };
    return { id: tb.id, status: 'free', changedAt: s?.left !== undefined && t >= s.left ? s.left : -Infinity };
  });

  // Tomorrow's web booking (Julieta) — shown in the reservations book, announced here.
  const web = webBookingOf(state);
  if (web) events.push({ id: 'web-booking', at: STORY.web.booking, kind: 'webBooking', table: web.table, people: web.people, time: web.time, day: web.day, who: web.name as PersonId });

  /* Numbers -------------------------------------------------------- */
  const storyTickets = tickets.filter((tk) => tk.placed >= 0);
  const covers = TONIGHT_BASE.served + [...seated.values()].filter((s) => s.at <= t).reduce((sum, s) => sum + s.people, 0);
  // Peak: most calls live at the same time tonight (so far).
  const marks = calls
    .filter((c) => !c.missed && c.start + FLOWS[c.kind].ringMs <= t)
    .flatMap((c) => [[c.start + FLOWS[c.kind].ringMs, 1] as const, [Math.min(c.end, t), -1] as const]);
  let peak = 0;
  let cur = 0;
  for (const [, d] of [...marks].sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    cur += d;
    peak = Math.max(peak, cur);
  }

  events.sort((a, b) => a.at - b.at);
  const out = tickets
    .filter((tk) => tk.stage === 'out' && !tk.bar)
    .sort((a, b) => b.stageAt - a.stageAt || b.num - a.num)
    .slice(0, OUT_SHOWN)
    .map((tk) => tk.id);

  return {
    t,
    clock: storyClock(t),
    calls,
    lines,
    liveCount: live.length,
    tickets,
    board: tickets.filter((tk) => !tk.bar && (tk.stage !== 'out' || out.includes(tk.id))),
    tables,
    bookings: visibleBookings,
    events: events.filter((e) => e.at <= t),
    stats: {
      orders: TONIGHT_BASE.orders + storyTickets.length,
      direct: TONIGHT_BASE.direct + storyTickets.filter((tk) => tk.channel !== 'salon').length,
      usd: storyTickets.reduce((s, tk) => s + tk.usd, 0),
      covers,
      calls: TONIGHT_BASE.calls + calls.filter((c) => !c.missed && c.start + FLOWS[c.kind].ringMs <= t).length,
      missed: calls.filter((c) => c.missed && c.end <= t).length,
      peak,
      bookings: visibleBookings.filter((b) => !b.pending).length,
    },
  };

  /** Julieta's web booking for tomorrow, once the "web" beat reached it. */
  function webBookingOf(s: RestaurantState): Booking | null {
    if (t < STORY.web.booking) return null;
    const day = WEB_BOOKING.day;
    const taken = new Set([...seededBookings(day).map((b) => b.table), ...s.bookings.filter((b) => b.day === day && b.at <= STORY.web.booking).map((b) => b.table)]);
    const table = [WEB_BOOKING.table, 14, 2, 11, 1, 9, 10].find((id) => !taken.has(id));
    if (table === undefined) return null;
    return { key: 'web-julieta', day, table, time: WEB_BOOKING.time, people: WEB_BOOKING.people, name: WEB_BOOKING.name, via: 'web', at: STORY.web.booking };
  }
}

/* ------------------------------------------------------------------ */
/* Other days (reservations book): a plausible, deterministic schedule  */
/* ------------------------------------------------------------------ */
/** A stable pseudo-random number in [0, 1) for a seed. */
function hash(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
const VIAS: BookingVia[] = ['ai', 'web', 'phone', 'ai'];

/** Reservations of a day other than tonight, before anything the visitor or the story did. */
export function seededBookings(day: number): Booking[] {
  if (day === TODAY || !isOpenDay(weekdayOf(day))) return [];
  const wd = weekdayOf(day);
  const weekend = wd === 4 || wd === 5;
  // Past nights were full; the further ahead, the more room is left.
  const busy = day < TODAY ? 0.7 : Math.max(0.22, 0.58 - 0.08 * (day - TODAY)) + (weekend ? 0.1 : 0);
  const out: Booking[] = [];
  for (const tb of TABLES) {
    const seed = day * 977 + tb.id * 131;
    if (hash(seed) >= busy) continue;
    const people = Math.max(Math.min(2, tb.seats), tb.seats - Math.floor(hash(seed + 3) * 2));
    out.push({
      key: `seed-${day}-${tb.id}`,
      day,
      table: tb.id,
      time: BOOK_TIMES[Math.floor(hash(seed + 5) * BOOK_TIMES.length)],
      people,
      name: GUESTS[Math.floor(hash(seed + 7) * GUESTS.length)],
      via: VIAS[Math.floor(hash(seed + 11) * VIAS.length)],
      at: -Infinity,
    });
  }
  return out;
}

/** Any day's reservations: tonight from the story; other days seeded + the story's web booking + the visitor's. */
export function dayBookings(day: number, state: RestaurantState, view: RestaurantView): Booking[] {
  if (day === TODAY) return view.bookings;
  const list = seededBookings(day);
  const web = view.events.find((e) => e.kind === 'webBooking');
  if (web && web.day === day && web.table !== undefined) {
    list.push({ key: 'web-julieta', day, table: web.table, time: web.time ?? 0, people: web.people ?? 2, name: web.who ?? 'rios', via: 'web', at: web.at });
  }
  for (const b of state.bookings) {
    if (b.day !== day || list.some((x) => x.table === b.table)) continue;
    list.push({ key: `mine-${b.day}-${b.table}`, day, table: b.table, time: b.time, people: b.people, name: 'you', via: b.via === 'web' ? 'web' : 'you', at: b.at, mine: true });
  }
  return list.sort((a, b) => a.time - b.time || a.table - b.table);
}

/** The floor plan of a day: tonight live; other days by reservation (past: attended). */
export function dayTables(day: number, state: RestaurantState, view: RestaurantView): TableView[] {
  if (day === TODAY) return view.tables;
  const list = dayBookings(day, state, view);
  return TABLES.map((tb) => {
    const booking = list.find((b) => b.table === tb.id);
    if (!booking) return { id: tb.id, status: 'free', changedAt: -Infinity };
    return { id: tb.id, status: day < TODAY ? 'done' : 'reserved', booking, people: booking.people, changedAt: booking.mine ? -Infinity : booking.at };
  });
}

/** Times still bookable on a day (tonight: from 15 min after the story clock). */
export const bookTimes = (day: number, view: RestaurantView) => (day < TODAY ? [] : day === TODAY ? BOOK_TIMES.filter((m) => m >= view.clock + 15) : BOOK_TIMES);

/** Tables a visitor can book on a day: free, no reservation, the day still ahead. */
export const bookableTables = (day: number, tables: TableView[], view: RestaurantView): Table[] =>
  bookTimes(day, view).length ? tables.filter((tb) => tb.status === 'free').map((tb) => TABLES.find((x) => x.id === tb.id)!) : [];

/** Best free table for `people` (the customer's phone books without a map). */
export const bestTable = (tables: Table[], people: number) => tables.filter((tb) => tb.seats >= people).sort((a, b) => a.seats - b.seats || a.id - b.id)[0] ?? null;

/** Is this "just happened" by the story (the visitor's own changes never are: the clock is stopped)? */
export const isStoryFresh = (t: number, at: number, ms = 2400) => at >= 0 && t >= at && t - at < ms;
