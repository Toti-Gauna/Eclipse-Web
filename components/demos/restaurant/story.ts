/**
 * Bodegón Lucero — the live story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did;
 * every screen DERIVES the night from (story time t, that state) with `deriveRestaurant`,
 * which is pure: pausing, looping, reduced motion (t = end) and two screens in sync
 * come for free.
 *
 * The 28 s loop — Friday 21:30, rush hour: three lines ring almost at once and the AI
 * voice agent answers all three. Line 1: Marta orders delivery (ticket → kitchen,
 * WhatsApp). Line 2: Ramiro books a table for 4 at 22:30 (floor map, WhatsApp).
 * Line 3: Lucía asks for gluten-free dishes and orders take-away. Meanwhile Sofía orders
 * on the site (the customer's phone), a couple walks in, tickets move
 * Nuevo → En cocina → Listo → En camino, table 3 asks for the bill.
 * Visitor: order from the menu, book a table, mark a dish out of stock (a caller hears
 * the alternative), switch the AI phone off (calls go unanswered).
 */
import { runVoice, type DemoStore, type VoiceLine, type VoiceScript, type VoiceState } from '../kit';
import { createStoryStore } from './store';
import {
  AI_BOOKING,
  AI_TABLES,
  BASE_BOOKINGS,
  BASE_SEATED,
  BASE_TICKETS,
  FIRST_TICKET,
  LOOP_MS,
  MENU,
  OVERRUN_MS,
  STORY,
  TABLES,
  TICKET_FLOW,
  TONIGHT_BASE,
  dishById,
  itemList,
  storyClock,
  tableById,
  type BookingVia,
  type Channel,
  type DishId,
  type Items,
  type PersonId,
  type Source,
  type Stage,
  type TicketPlan,
} from './data';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export interface Range {
  from: number;
  to: number | null;
}
export interface MyOrder {
  id: string;
  items: Items;
  mode: 'delivery' | 'pickup';
  /** Story time it was placed. */
  at: number;
}
export interface MyBooking {
  table: number;
  time: number;
  people: number;
  /** Story time it was made (−1: an earlier loop). */
  at: number;
  /** you: from the staff floor map · web: from the customer's phone. */
  via: 'you' | 'web';
}
/** A call the visitor caused: a dish out of stock (a caller asks for it) or the AI switched off. */
export type ExtraCall = { kind: 'alt'; dish: DishId; at: number } | { kind: 'probe'; at: number };

export interface RestaurantState {
  orders: MyOrder[];
  bookings: MyBooking[];
  /** Dish → story time it ran out (−1: an earlier loop). */
  soldOut: Partial<Record<DishId, number>>;
  /** When the AI phone was off. */
  aiOff: Range[];
  extra: ExtraCall | null;
  /** The visitor took over the customer phone (no autoplay this loop). */
  manual: boolean;
}

const fresh = (): RestaurantState => ({ orders: [], bookings: [], soldOut: {}, aiOff: [], extra: null, manual: false });
/** A switch left off stays off in the next loop. */
const carry = (ranges: Range[]): Range[] => (ranges.some((r) => r.to === null) ? [{ from: -1, to: null }] : []);

export type RestaurantStore = DemoStore<RestaurantState>;

/** Module-level (stable) factory for usePairedStore. */
export function createRestaurantStore(paired: boolean): RestaurantStore {
  return createStoryStore<RestaurantState>(fresh(), {
    loopMs: LOOP_MS,
    overrunMs: OVERRUN_MS,
    paired,
    onLoop: (s) => ({
      ...fresh(),
      bookings: s.bookings.map((b) => ({ ...b, at: -1 })),
      soldOut: Object.fromEntries(Object.keys(s.soldOut).map((k) => [k, -1])),
      aiOff: carry(s.aiOff),
    }),
  });
}

export const isOn = (ranges: Range[], at: number) => !ranges.some((r) => at >= r.from && (r.to === null || at < r.to));
export const isOffNow = (ranges: Range[]) => ranges.some((r) => r.to === null);
export const isSoldOut = (soldOut: RestaurantState['soldOut'], dish: DishId, at = Infinity) => {
  const s = soldOut[dish];
  return s !== undefined && s <= at;
};

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  order: (items: Items, mode: MyOrder['mode']) => (s: RestaurantState, t: number): RestaurantState => ({
    ...s,
    manual: true,
    orders: [...s.orders, { id: `o${t}-${s.orders.length}`, items, mode, at: t }],
  }),
  book: (b: Omit<MyBooking, 'at'>) => (s: RestaurantState, t: number): RestaurantState =>
    s.bookings.some((x) => x.table === b.table) ? s : { ...s, manual: b.via === 'web' ? true : s.manual, bookings: [...s.bookings, { ...b, at: t }] },
  toggleStock: (dish: DishId) => (s: RestaurantState, t: number): RestaurantState => {
    if (s.soldOut[dish] !== undefined) {
      const next = { ...s.soldOut };
      delete next[dish];
      return { ...s, soldOut: next, extra: s.extra?.kind === 'alt' && s.extra.dish === dish && s.extra.at > t - 1200 ? null : s.extra };
    }
    return { ...s, soldOut: { ...s.soldOut, [dish]: t }, extra: { kind: 'alt', dish, at: t } };
  },
  toggleAi: () => (s: RestaurantState, t: number): RestaurantState => {
    const off = isOffNow(s.aiOff);
    const aiOff = off ? s.aiOff.map((r) => (r.to === null ? { ...r, to: t } : r)) : [...s.aiOff, { from: t, to: null }];
    return { ...s, aiOff, extra: off ? s.extra : { kind: 'probe', at: t } };
  },
  touch: () => (s: RestaurantState): RestaurantState => (s.manual ? s : { ...s, manual: true }),
};

/* ------------------------------------------------------------------ */
/* Calls: timing per kind (texts are added per locale, see scripts.ts)  */
/* ------------------------------------------------------------------ */
export type CallKind = 'order' | 'booking' | 'gf' | 'alt' | 'info';
type Who = VoiceLine['who'];
interface Flow {
  ringMs: number;
  lines: { who: Who; ms: number; gapMs?: number }[];
  /** Line index where the agent checks the menu / the floor. */
  check?: number;
  /** Line index where the order / booking lands. */
  act?: number;
}
const L = (who: Who, ms: number, gapMs = 250) => ({ who, ms, gapMs });
export const FLOWS: Record<CallKind, Flow> = {
  order: { ringMs: 1400, lines: [L('agent', 1500), L('caller', 2100), L('tool', 900), L('agent', 2800), L('caller', 900), L('tool', 800), L('agent', 1700)], check: 2, act: 5 },
  booking: { ringMs: 1400, lines: [L('agent', 1400), L('caller', 1800), L('tool', 900), L('agent', 2000), L('caller', 1000), L('tool', 800), L('agent', 1600)], check: 2, act: 5 },
  gf: { ringMs: 1400, lines: [L('agent', 1400), L('caller', 1900), L('tool', 900), L('agent', 2600), L('caller', 1500), L('tool', 800), L('agent', 1500)], check: 2, act: 5 },
  alt: { ringMs: 1300, lines: [L('agent', 1400), L('caller', 1700), L('tool', 900), L('agent', 2600), L('caller', 900), L('tool', 800), L('agent', 1500)], check: 2, act: 5 },
  info: { ringMs: 1300, lines: [L('agent', 1400), L('caller', 1700), L('agent', 2000), L('caller', 1000), L('agent', 1300)] },
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
/** ms after the ring starts: check / act / end. */
const at = (kind: CallKind, which: 'check' | 'act') => {
  const i = FLOWS[kind][which];
  return i === undefined ? Infinity : TIMING[kind].starts[i];
};
const callEnd = (kind: CallKind, missed: boolean) => (missed ? MISSED_RING_MS : TIMING[kind].endsAt);
/** Story time the order of the line-1 call lands (the trailer and toasts sync to it). */
export const ORDER_AT = STORY.ring.order + at('order', 'act');

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
  plan: TicketPlan;
  who?: PersonId | 'you';
  gf?: boolean;
  /** USD total. */
  usd: number;
  /** Clock minute it is promised (delivery arrives / take-away ready). */
  eta?: number;
  /** The visitor's order id. */
  mine?: string;
}

export type TableStatus = 'free' | 'seated' | 'bill' | 'reserved';
export interface Booking {
  key: string;
  table: number;
  time: number;
  people: number;
  name: PersonId | 'you';
  via: BookingVia;
  /** Story time it was made (−Infinity: before the story). */
  at: number;
  /** The AI is holding it (between checking the floor and confirming). */
  pending?: boolean;
}
export interface TableView {
  id: number;
  status: TableStatus;
  people?: number;
  since?: number;
  booking?: Booking;
  /** Story time of the last change. */
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
  dish?: DishId;
  alt?: DishId | null;
  who?: PersonId;
}

export interface RestaurantView {
  t: number;
  clock: number;
  calls: CallPlan[];
  /** Per line: the call it shows now (the latest that started, else the next one). */
  lines: Record<LineId, CallPlan | null>;
  /** Calls live (ringing or talking) right now. */
  liveCount: number;
  tickets: Ticket[];
  /** On the kitchen board now. */
  board: Ticket[];
  tables: TableView[];
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
const kitchenItems = (items: Items) => itemList(items).some(([d]) => !dishById(d).bar);

function stageOf(plan: TicketPlan, t: number): { stage: Stage; at: number } {
  const steps: [Stage, number | undefined][] = [
    ['cooking', plan.cook],
    ['ready', plan.ready],
    ['out', plan.out],
    ['done', plan.done],
  ];
  let stage: Stage = 'new';
  let since = plan.placed < 0 ? -Infinity : plan.placed;
  for (const [s, when] of steps) {
    if (when === undefined) continue;
    if (t >= when) {
      stage = s;
      since = when < 0 ? -Infinity : when;
    }
  }
  return { stage, at: since };
}

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
/** Story time of the visitor's latest action (−Infinity if none). */
const lastAction = (s: RestaurantState) =>
  Math.max(
    -Infinity,
    ...s.orders.map((o) => o.at),
    ...s.bookings.map((b) => b.at),
    ...Object.values(s.soldOut).map((v) => v ?? -Infinity),
    ...s.aiOff.flatMap((r) => [r.from, r.to ?? -Infinity]),
    s.extra?.at ?? -Infinity,
  );

/**
 * The whole night at story time `t0`. With `instant` (reduced motion: the clock never
 * runs) whatever the visitor did is shown already played out.
 */
export function deriveRestaurant(state: RestaurantState, t0: number, instant: boolean): RestaurantView {
  const t = instant ? Math.max(t0, lastAction(state) + OVERRUN_MS) : t0;
  const events: RestaurantEvent[] = [];

  /* Calls ---------------------------------------------------------- */
  const plan = (id: string, kind: CallKind, line: LineId, start: number): CallPlan => {
    const missed = !isOn(state.aiOff, start);
    return { id, kind, line, start, missed, end: start + callEnd(kind, missed), voice: runVoice(callScript(kind, missed), t - start, { instant: instant && t >= start }) };
  };
  const c1 = plan('order', 'order', 1, STORY.ring.order);
  const c2 = plan('booking', 'booking', 2, STORY.ring.booking);
  const c3 = plan('gf', 'gf', 3, STORY.ring.gf);
  const calls: CallPlan[] = [c1, c2, c3];

  // Line 1 — Marta: delivery order (the agent checks the menu, offers alternatives).
  c1.asked = { napolitana: 2, flan: 1 };
  Object.assign(c1, c1.missed ? {} : fill(state, c1.asked, c1.start + at('order', 'check')));
  // Line 3 — Lucía: gluten-free question → take-away.
  if (!c3.missed) {
    const when = c3.start + at('gf', 'check');
    c3.gfList = (['bife', 'provoleta', 'flan'] as DishId[]).filter((d) => inStock(state, d, when));
    const pick = (['bife', 'provoleta'] as DishId[]).find((d) => inStock(state, d, when));
    c3.items = pick ? { [pick]: 1 } : {};
    c3.asked = c3.items;
  }

  // The visitor's extra call: on the line that frees first.
  const extra = state.extra;
  if (extra) {
    const skip =
      extra.kind === 'alt' &&
      !c1.missed &&
      extra.at < c1.start + at('order', 'check') &&
      (c1.asked?.[extra.dish] ?? 0) > 0;
    if (!skip) {
      const ends: [LineId, number][] = [
        [1, c1.end],
        [2, c2.end],
        [3, c3.end],
      ];
      const ready = extra.at + 1200;
      const [line, end] = ends.reduce((best, cur) => (Math.max(ready, cur[1] + 700) < Math.max(ready, best[1] + 700) ? cur : best));
      const start = Math.max(ready, end + 700);
      const kind: CallKind = extra.kind === 'alt' ? 'alt' : 'info';
      const x = plan(`extra-${extra.at}`, kind, line, start);
      if (extra.kind === 'alt' && !x.missed) {
        x.dish = extra.dish;
        x.asked = { [extra.dish]: 1 };
        Object.assign(x, fill(state, x.asked, start + at('alt', 'check')));
      }
      calls.push(x);
    }
  }

  /* Floor: seats, bookings ------------------------------------------ */
  const bookings: Booking[] = BASE_BOOKINGS.map((b) => ({ key: `base-${b.table}`, ...b, at: -Infinity }));
  const seated = new Map<number, { people: number; since: number; at: number; bill?: number; left?: number }>();
  for (const [id, s] of Object.entries(BASE_SEATED)) seated.set(Number(id), { ...s, at: -Infinity });
  const bookedAt = (table: number, when: number) => bookings.some((b) => b.table === table && b.at <= when);
  const isFreeAt = (table: number, when: number) => {
    const s = seated.get(table);
    const occupied = s && s.at <= when && (s.left === undefined || when < s.left);
    return !occupied && !bookedAt(table, when);
  };
  for (const b of state.bookings) {
    bookings.push({ key: `mine-${b.table}-${b.at}`, table: b.table, time: b.time, people: b.people, name: 'you', via: b.via === 'web' ? 'web' : 'you', at: b.at < 0 ? -Infinity : b.at });
    if (b.at >= 0) events.push({ id: `you-b-${b.table}-${b.at}`, at: b.at, kind: b.via === 'web' ? 'webBooking' : 'youBooking', table: b.table, people: b.people, time: b.time });
  }
  // Line 2 — Ramiro: a table for 4 at 22:30 (held when the agent checks, confirmed after).
  if (!c2.missed) {
    const check = c2.start + at('booking', 'check');
    const done = c2.start + at('booking', 'act');
    const table = AI_TABLES.find((id) => !bookedAt(id, check)) ?? null;
    c2.table = table;
    if (table !== null && t >= check) {
      bookings.push({ key: 'ai-ramiro', table, time: AI_BOOKING.time, people: AI_BOOKING.people, name: 'ramiro', via: 'ai', at: check, pending: t < done });
      if (done <= t) events.push({ id: 'ai-booking', at: done, kind: 'aiBooking', line: 2, table, people: AI_BOOKING.people, time: AI_BOOKING.time, who: 'ramiro' });
    }
  }
  // A couple walks in (first free 2-top) and orders by QR.
  const walkTable = [2, 14].find((id) => isFreeAt(id, STORY.walkIn.at)) ?? null;
  if (walkTable !== null) {
    seated.set(walkTable, { people: 2, since: storyClock(STORY.walkIn.at), at: STORY.walkIn.at });
    events.push({ id: 'walk-in', at: STORY.walkIn.at, kind: 'walkIn', table: walkTable, people: 2 });
  }
  // Table 3 asks for the bill and leaves.
  const t3 = seated.get(STORY.bill.table);
  if (t3) {
    t3.bill = STORY.bill.at;
    t3.left = STORY.bill.free;
    events.push({ id: 'bill', at: STORY.bill.at, kind: 'bill', table: STORY.bill.table });
  }

  /* Kitchen ---------------------------------------------------------- */
  interface Placed {
    id: string;
    plan: TicketPlan;
    who?: PersonId | 'you';
    gf?: boolean;
    mine?: string;
    event?: Omit<RestaurantEvent, 'id' | 'at' | 'ticket'> & { id: string };
    call?: CallPlan;
  }
  const story: Placed[] = [];
  const flowFrom = (placed: number, channel: Channel): Pick<TicketPlan, 'cook' | 'ready' | 'out' | 'done'> => ({
    cook: placed + TICKET_FLOW.cook,
    ready: placed + TICKET_FLOW.ready,
    out: channel === 'delivery' ? placed + TICKET_FLOW.out : undefined,
    done: channel === 'pickup' ? placed + TICKET_FLOW.pickupDone : channel === 'salon' ? placed + TICKET_FLOW.salonDone : undefined,
  });
  const add = (p: Omit<Placed, 'plan'> & { channel: Channel; source: Source; table?: number; items: Items; placed: number }) => {
    if (!itemList(p.items).length) return;
    const { channel, source, table, items, placed, ...rest } = p;
    story.push({ ...rest, plan: { channel, source, table, items, placed, ...flowFrom(placed, channel) } });
  };
  // Sofía orders on the site (what the customer's phone plays).
  add({ id: 'web-sofia', channel: 'delivery', source: 'web', items: fill(state, { ravioles: 1, flan: 1 }, STORY.web.place).items, placed: STORY.web.place, who: 'sofia', event: { id: 'web', kind: 'web' } });
  if (!c1.missed && c1.items) {
    add({ id: 'ai-marta', channel: 'delivery', source: 'ai', items: c1.items, placed: c1.start + at('order', 'act'), who: 'marta', call: c1, event: { id: 'ai-order', kind: 'aiOrder', line: 1, who: 'marta' } });
  }
  if (walkTable !== null) {
    add({ id: 'qr-walkin', channel: 'salon', source: 'qr', table: walkTable, items: fill(state, { napolitana: 1, empanadas: 1, vermu: 2 }, STORY.walkIn.order).items, placed: STORY.walkIn.order, event: { id: 'qr-walkin', kind: 'qr', table: walkTable } });
  }
  if (!c3.missed && c3.items) {
    add({ id: 'ai-lucia', channel: 'pickup', source: 'ai', items: c3.items, placed: c3.start + at('gf', 'act'), who: 'lucia', gf: true, call: c3, event: { id: 'ai-gf', kind: 'aiGf', line: 3, who: 'lucia' } });
  }
  STORY.desserts.forEach((d, i) =>
    add({ id: `qr-dessert-${i}`, channel: 'salon', source: 'qr', table: d.table, items: fill(state, d.items, d.at).items, placed: d.at, event: { id: `qr-dessert-${i}`, kind: 'qr', table: d.table } }),
  );
  for (const o of state.orders) {
    add({ id: o.id, channel: o.mode, source: 'web', items: o.items, placed: o.at, who: 'you', mine: o.id, event: { id: `you-${o.id}`, kind: 'youOrder' } });
  }
  for (const x of calls.slice(3)) {
    if (x.kind === 'alt' && !x.missed && x.items) {
      add({ id: x.id, channel: 'pickup', source: 'ai', items: x.items, placed: x.start + at('alt', 'act'), call: x, event: { id: `${x.id}-order`, kind: 'alt', line: x.line, dish: x.dish, alt: x.subs?.[0]?.[1] ?? null } });
    }
  }
  story.sort((a, b) => a.plan.placed - b.plan.placed);

  const tickets: Ticket[] = [];
  const pushTicket = (id: string, num: number, p: TicketPlan, extraFields: Partial<Ticket> = {}) => {
    if (p.placed > t) return;
    const { stage, at: stageAt } = stageOf(p, t);
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
      plan: p,
      usd: totalUsd(p.items),
      eta: p.channel === 'delivery' ? clock + 40 : p.channel === 'pickup' ? clock + 25 : undefined,
      ...extraFields,
    });
  };
  BASE_TICKETS.forEach((p, i) => pushTicket(`base-${i}`, FIRST_TICKET + i, p));
  story.forEach((p, i) => {
    const num = FIRST_TICKET + BASE_TICKETS.length + i;
    if (p.call) {
      p.call.ticket = num;
      p.call.eta = storyClock(p.plan.placed) + (p.plan.channel === 'delivery' ? 40 : 25);
    }
    if (p.plan.placed > t) return;
    if (!kitchenItems(p.plan.items)) {
      // Drinks only: straight to the bar (counts as an order, never on the kitchen board).
      p.plan = { ...p.plan, cook: p.plan.placed, ready: p.plan.placed, done: p.plan.placed };
    }
    pushTicket(p.id, num, p.plan, { who: p.who, gf: p.gf, mine: p.mine });
    if (p.event) {
      const { id, ...rest } = p.event;
      events.push({ ...rest, id, at: p.plan.placed, ticket: num });
    }
  });
  for (const tk of tickets) {
    if (tk.channel === 'delivery' && tk.plan.out !== undefined && tk.plan.out >= 0 && tk.plan.out <= t) {
      events.push({ id: `out-${tk.id}`, at: tk.plan.out, kind: 'out', ticket: tk.num });
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
    if (!cur) lines[c.line] = c;
    else if (c.start <= t && c.start > cur.start) lines[c.line] = c;
  }
  const live = calls.filter((c) => c.voice.phase === 'ringing' || c.voice.phase === 'live');

  /* Floor view ------------------------------------------------------- */
  const visibleBookings = bookings.filter((b) => b.at <= t).sort((a, b) => a.time - b.time || a.table - b.table);
  const tables: TableView[] = TABLES.map((tb) => {
    const s = seated.get(tb.id);
    const booking = visibleBookings.find((b) => b.table === tb.id);
    const here = s && s.at <= t && (s.left === undefined || t < s.left);
    if (here) {
      const bill = s.bill !== undefined && t >= s.bill;
      return { id: tb.id, status: bill ? 'bill' : 'seated', people: s.people, since: s.since, booking, changedAt: bill ? s.bill! : s.at };
    }
    if (booking) return { id: tb.id, status: 'reserved', booking, people: booking.people, changedAt: booking.at };
    return { id: tb.id, status: 'free', changedAt: s?.left ?? -Infinity };
  });

  /* Numbers -------------------------------------------------------- */
  const storyTickets = tickets.filter((tk) => tk.placed >= 0);
  const covers =
    TONIGHT_BASE.served +
    [...seated.values()].filter((s) => s.at <= t).reduce((sum, s) => sum + s.people, 0);
  // Peak: most calls live at the same time tonight (so far).
  const marks = calls.filter((c) => !c.missed && c.start + FLOWS[c.kind].ringMs <= t).flatMap((c) => [
    [c.start + FLOWS[c.kind].ringMs, 1] as const,
    [Math.min(c.end, t), -1] as const,
  ]);
  let peak = 0;
  let cur = 0;
  for (const [, d] of [...marks].sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    cur += d;
    peak = Math.max(peak, cur);
  }

  events.sort((a, b) => a.at - b.at);
  const visibleEvents = events.filter((e) => e.at <= t);

  return {
    t,
    clock: storyClock(t),
    calls,
    lines,
    liveCount: live.length,
    tickets,
    board: tickets.filter((tk) => tk.stage !== 'done' && kitchenItems(tk.items)),
    tables,
    bookings: visibleBookings,
    events: visibleEvents,
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
}

/** Tables a visitor can book right now: free, no reservation. */
export const bookableTables = (view: RestaurantView) => view.tables.filter((tb) => tb.status === 'free').map((tb) => tableById(tb.id));
/** Best free table for `people` (the customer's phone books without a map). */
export const bestTable = (view: RestaurantView, people: number) =>
  bookableTables(view)
    .filter((tb) => tb.seats >= people)
    .sort((a, b) => a.seats - b.seats || a.id - b.id)[0] ?? null;
