/**
 * Bruma Tostadores — the story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did; every
 * screen DERIVES the evening from (story time t, that state) with `deriveShop`, which is pure:
 * pausing, reduced motion (the store jumps to the end of a beat) and two screens in sync come free.
 *
 * Nothing plays on its own (v3). The visitor plays five beats from the SimBar (18:05 → ~18:55):
 * 1 bot — Inés asks the site bot what coffee suits her moka pot; it answers with a pick (and
 *   Tomás's club order lands) · 2 abandon — she adds it, reaches the checkout and leaves (Carla's
 *   order empties the Sidamo shelf) · 3 recovery — half an hour later the cart-recovery
 *   automation writes to her on WhatsApp with a coupon · 4 paid — she comes back and pays: a
 *   recovered cart (one in five) · 5 club — Tomás completes six months and levels up, the bot
 *   answers a shipping question, Diego orders, the board moves.
 * With the recovery off, beats 3–4 show the cart getting lost.
 * At rest the visitor can tap for Inés, switch the recovery, schedule a roast, advance orders,
 * and shop on their own (cart, bot, checkout, their own abandonment + "30 minutes later") — "mine".
 */
import { createDemoStore, runChat, type ChatPick, type ChatRun, type ChatScript, type DemoStore } from '../kit';
import {
  AFTER_ADD,
  AFTER_BACK,
  BASE_ORDERS,
  BEATS,
  BOARD,
  CHATS_BEFORE,
  CLUB,
  INES_BACK,
  INES_DECIDES,
  JUMP_MINUTES,
  LOW_STOCK,
  MINUTE_MS,
  NOW_START,
  PRODUCTS,
  RESTOCK_BAGS,
  STAGES,
  STORY,
  VISITS_BEFORE,
  VISIT_EVERY,
  WEEK_CARTS,
  levelFor,
  type CustomerId,
  type Line,
  type LevelId,
  type PayId,
  type ProductId,
  type Stage,
} from './data';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export interface Range {
  from: number;
  to: number | null;
}

export interface MineOrder {
  /** Story time it was placed. */
  at: number;
  lines: Line[];
  pay: PayId;
  coupon: boolean;
  /** Paid after their own recovery message. */
  recovered: boolean;
}

/** The visitor's own session in the store (everything answers at once; nothing runs on a timer). */
export interface Mine {
  lines: Line[];
  /** Their conversation with the site bot (null: not started). */
  chat: Record<string, ChatPick> | null;
  /** They left a full cart at the checkout (story time). */
  abandoned: { at: number } | null;
  /** They simulated "30 minutes later": the recovery message went out (or not, if the automation is off). */
  recovery: { at: number; sent: boolean } | null;
  waPicks: Record<string, ChatPick>;
  waOpened: boolean;
  /** The recovery coupon applies to their cart. */
  coupon: boolean;
  orders: MineOrder[];
}

export interface ShopState {
  /** Inés's site-bot answers the visitor gave for her (chat time). */
  bot: Record<string, ChatPick>;
  /** Inés's WhatsApp answers the visitor gave for her (thread time, from the push). */
  wa: Record<string, ChatPick>;
  /** She opened the push early (the visitor tapped it), story time. */
  waOpen: number | null;
  /** When the cart-recovery automation was off (story time). */
  off: Range[];
  /** Story time the visitor took over the customer's phone (it shows their session until a beat plays). */
  manual: number | null;
  /** Story time the visitor scheduled a roast for the low-stock coffee. */
  restock: number | null;
  /** Orders the visitor advanced on the board (stage + story time). */
  moved: Record<string, { stage: Stage; at: number }>;
  mine: Mine;
}

const emptyMine = (): Mine => ({ lines: [], chat: null, abandoned: null, recovery: null, waPicks: {}, waOpened: false, coupon: false, orders: [] });
const fresh = (): ShopState => ({ bot: {}, wa: {}, waOpen: null, off: [], manual: null, restock: null, moved: {}, mine: emptyMine() });

export type ShopStore = DemoStore<ShopState>;

/** Module-level (stable) factory for usePairedStore. Beats: no autoplay; "Reiniciar" = a fresh evening. */
export function createShopStore(paired: boolean): ShopStore {
  // The recovery switch survives "Reiniciar" (as a setting, it's on or off from the start).
  return createDemoStore<ShopState>(fresh(), { beats: BEATS, paired, reset: (s) => ({ ...fresh(), off: isOffNow(s.off) ? [{ from: -1, to: null }] : [] }) });
}

export const isOn = (ranges: Range[], at: number) => !ranges.some((r) => at >= r.from && (r.to === null || at < r.to));
export const isOffNow = (ranges: Range[]) => ranges.some((r) => r.to === null);

const addLine = (lines: Line[], line: Line): Line[] => {
  const i = lines.findIndex((l) => l.product === line.product && l.size === line.size && l.grind === line.grind);
  if (i < 0) return [...lines, line];
  return lines.map((l, j) => (j === i ? { ...l, qty: Math.min(9, l.qty + line.qty) } : l));
};
const withMine = (s: ShopState, fn: (m: Mine) => Mine): ShopState => ({ ...s, mine: fn(s.mine) });

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  pickBot: (step: string, reply: string) => (s: ShopState, t: number): ShopState => ({
    ...s,
    bot: { ...s.bot, [step]: { reply, at: Math.max(0, t - STORY.chatStart) } },
  }),
  pickWa: (step: string, reply: string, pushAt: number) => (s: ShopState, t: number): ShopState => ({
    ...s,
    wa: { ...s.wa, [step]: { reply, at: Math.max(0, t - pushAt) } },
  }),
  openWa: () => (s: ShopState, t: number): ShopState => (s.waOpen === null ? { ...s, waOpen: t } : s),
  toggleRecovery: () => (s: ShopState, t: number): ShopState => {
    const next = isOffNow(s.off) ? s.off.map((r) => (r.to === null ? { ...r, to: t } : r)) : [...s.off, { from: t, to: null }];
    return { ...s, off: next };
  },
  /** The visitor takes over the customer's phone; their cart starts as the one on screen (if theirs is empty). */
  takeOver: (seed: Line[]) => (s: ShopState, t: number): ShopState => ({
    ...s,
    manual: t,
    mine: s.mine.lines.length || s.mine.orders.length ? s.mine : { ...s.mine, lines: seed.map((l) => ({ ...l })) },
  }),
  restock: () => (s: ShopState, t: number): ShopState => (s.restock === null ? { ...s, restock: t } : s),
  advance: (key: string, stage: Stage) => (s: ShopState, t: number): ShopState => ({ ...s, moved: { ...s.moved, [key]: { stage, at: t } } }),

  mineAdd: (line: Line) => (s: ShopState) => withMine(s, (m) => ({ ...m, lines: addLine(m.lines, line) })),
  mineQty: (index: number, qty: number) => (s: ShopState) =>
    withMine(s, (m) => ({ ...m, lines: qty <= 0 ? m.lines.filter((_, i) => i !== index) : m.lines.map((l, i) => (i === index ? { ...l, qty: Math.min(9, qty) } : l)) })),
  mineChatPick: (step: string, reply: string) => (s: ShopState) => withMine(s, (m) => ({ ...m, chat: { ...(m.chat ?? {}), [step]: { reply, at: 0 } } })),
  /** They left the checkout with a full cart (no message yet: they simulate "30 minutes later" themselves). */
  mineLeave: () => (s: ShopState, t: number): ShopState =>
    s.mine.abandoned || !s.mine.lines.length ? s : withMine(s, (m) => ({ ...m, abandoned: { at: t }, recovery: null, waPicks: {}, waOpened: false })),
  /** "30 minutes later": the automation writes to them (if it's on). */
  mineRecover: () => (s: ShopState, t: number): ShopState =>
    !s.mine.abandoned || s.mine.recovery ? s : withMine(s, (m) => ({ ...m, recovery: { at: t, sent: isOn(s.off, t) } })),
  mineWaOpen: () => (s: ShopState) => withMine(s, (m) => (m.waOpened ? m : { ...m, waOpened: true })),
  mineWaPick: (step: string, reply: string) => (s: ShopState) =>
    withMine(s, (m) => ({ ...m, waOpened: true, waPicks: { ...m.waPicks, [step]: { reply, at: 0 } }, coupon: m.coupon || reply === 'back' })),
  minePay: (pay: PayId) => (s: ShopState, t: number): ShopState =>
    !s.mine.lines.length
      ? s
      : withMine(s, (m) => ({
          ...m,
          orders: [...m.orders, { at: t, lines: m.lines, pay, coupon: m.coupon, recovered: !!m.recovery?.sent }],
          lines: [],
          coupon: false,
          abandoned: null,
          recovery: null,
          waPicks: {},
          waOpened: false,
        })),
};

/* ------------------------------------------------------------------ */
/* Script shapes (timing is fixed here; texts are added per locale)     */
/* ------------------------------------------------------------------ */
export type Need = 'moka' | 'fruity' | 'gift';
type Shape = { from: 'bot' | 'user' | 'note'; typingMs?: number; next?: string; replies?: readonly string[]; auto?: string; autoMs?: number };

/** The site bot: what are you brewing with? → a pick with a product card → add to cart. */
export const BOT_FLOW: { start: string; steps: Record<string, Shape> } = {
  start: 'hi',
  steps: {
    hi: { from: 'bot', typingMs: 600, replies: ['moka', 'fruity', 'gift'], auto: 'moka', autoMs: INES_DECIDES.need - 600 },
    moka: { from: 'bot', typingMs: 1400, replies: ['add', 'other'], auto: 'add', autoMs: 2750 },
    fruity: { from: 'bot', typingMs: 1400, replies: ['add', 'other'], auto: 'add', autoMs: 2750 },
    gift: { from: 'bot', typingMs: 1400, replies: ['add', 'other'], auto: 'add', autoMs: 2750 },
    alt_moka: { from: 'bot', typingMs: 1200, replies: ['add'], auto: 'add', autoMs: 1500 },
    alt_fruity: { from: 'bot', typingMs: 1200, replies: ['add'], auto: 'add', autoMs: 1500 },
    alt_gift: { from: 'bot', typingMs: 1200, replies: ['add'], auto: 'add', autoMs: 1500 },
    added: { from: 'bot', typingMs: 600 },
  },
};
export const botGoto = (step: string, reply: string) => (reply === 'add' ? 'added' : reply === 'other' ? `alt_${step}` : reply);
/** Steps whose "add" reply puts the pick in the cart. */
export const PICK_STEPS = ['moka', 'fruity', 'gift', 'alt_moka', 'alt_fruity', 'alt_gift'] as const;

/** The recovery message on WhatsApp: back to the cart (or a question first). */
export const WA_FLOW: { start: string; steps: Record<string, Shape> } = {
  start: 'msg',
  steps: {
    msg: { from: 'bot', typingMs: 0, replies: ['back', 'doubt'], auto: 'back', autoMs: INES_BACK },
    doubt: { from: 'bot', typingMs: 1200, replies: ['back'], auto: 'back', autoMs: 2200 },
    opening: { from: 'note', typingMs: 300 },
  },
};
export const waGoto = (_step: string, reply: string) => (reply === 'back' ? 'opening' : 'doubt');

/** Chat script from a flow shape + per-locale content. `auto: false` removes the automatic replies (the visitor's own chats). */
export function buildScript(
  flow: { start: string; steps: Record<string, Shape> },
  goto: (step: string, reply: string) => string,
  content: (step: string) => Partial<ChatScript['steps'][string]>,
  replyLabel: (step: string, id: string) => string,
  auto = true,
): ChatScript {
  const steps: ChatScript['steps'] = {};
  for (const [id, s] of Object.entries(flow.steps)) {
    steps[id] = {
      from: s.from,
      typingMs: s.typingMs,
      next: s.next,
      auto: auto ? s.auto : undefined,
      autoMs: s.autoMs,
      replies: s.replies?.map((r) => ({ id: r, label: replyLabel(id, r), goto: goto(id, r) })),
      ...content(id),
    };
  }
  return { start: flow.start, steps };
}

const L = (product: ProductId, size: Line['size'], grind: Line['grind']): Line => ({ product, size, grind, qty: 1 });
/** What the bot recommends for each need (and the second option). */
export const RECO: Record<Need, { main: Line; alt: Line }> = {
  moka: { main: L('cerrado', 's500', 'moka'), alt: L('niebla', 's500', 'moka') },
  fruity: { main: L('sidamo', 's250', 'filter'), alt: L('huila', 's250', 'filter') },
  gift: { main: L('huila', 's500', 'beans'), alt: L('niebla', 's500', 'beans') },
};
/** The line a bot step shows as its card. */
export const stepLine = (step: string): Line | null => {
  if (step.startsWith('alt_')) return RECO[step.slice(4) as Need]?.alt ?? null;
  return RECO[step as Need]?.main ?? null;
};
/** Inés already had this in her cart when the story starts. */
export const INES_START: Line = { product: 'niebla', size: 's250', grind: 'beans', qty: 1 };

/** The bot's pick for a run: the need asked + whether the second option was requested. */
export function botPick(chosen: Record<string, string>): Line | null {
  const need = chosen.hi as Need | undefined;
  if (!need || !RECO[need]) return null;
  return chosen[need] === 'other' ? RECO[need].alt : RECO[need].main;
}

/**
 * Inés's conversation once the visitor answered for her: every step still waiting gets her
 * scripted answer at its scripted time (`decides(step)`, or right away if it shows up later),
 * and each answer is followed at once (the clock is stopped at rest).
 */
export function steeredRun(script: ChatScript, elapsed: number, picks: Record<string, ChatPick>, decides: (step: string) => number): ChatRun {
  if (!Object.keys(picks).length) return runChat(script, elapsed, {});
  const out = { ...picks };
  for (let guard = 0; guard < 8; guard++) {
    const full = runChat(script, 600_000, out, { instantAfterPick: true });
    const waiting = full.awaiting?.step;
    const step = waiting ? script.steps[waiting] : undefined;
    if (!waiting || !step?.auto) break;
    out[waiting] = { reply: step.auto, at: Math.max(full.at[waiting] ?? 0, decides(waiting)) };
  }
  // Her scripted answers only count once their time has come (runChat applies a pick as soon as its step shows).
  const due = Object.fromEntries(Object.entries(out).filter(([step, p]) => picks[step] || p.at <= elapsed));
  return runChat(script, elapsed, due, { instantAfterPick: true });
}
const botDecides = (step: string) => (step === 'hi' ? INES_DECIDES.need : INES_DECIDES.add);
const waDecides = () => INES_BACK;
/** Inés's WhatsApp thread (any locale) at thread time `elapsed`. */
export const inesWaRun = (script: ChatScript, elapsed: number, picks: Record<string, ChatPick>) => steeredRun(script, elapsed, picks, waDecides);

/** Chat time of the "add" tap (null: not yet). */
export function addTime(run: ChatRun): number | null {
  for (const step of PICK_STEPS) {
    if (run.chosen[step] !== 'add') continue;
    const item = run.items.find((i) => i.id === `${step}:reply`);
    if (item) return item.at;
  }
  return null;
}
/** Thread time of the "back to my cart" tap (null: not yet). */
export function backTime(run: ChatRun): number | null {
  for (const step of ['msg', 'doubt']) {
    if (run.chosen[step] !== 'back') continue;
    const item = run.items.find((i) => i.id === `${step}:reply`);
    if (item) return item.at;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
export type InesPhase = 'catalog' | 'chat' | 'cart' | 'checkout' | 'locked' | 'whatsapp' | 'checkout2' | 'paying' | 'paid';
export type CartStatus = 'browsing' | 'checkout' | 'abandoned' | 'sent' | 'unsent' | 'read' | 'back' | 'recovered' | 'lost';

export interface InesView {
  phase: InesPhase;
  chat: ChatRun;
  wa: ChatRun | null;
  lines: Line[];
  pick: Line | null;
  addAt: number | null;
  leaveAt: number | null;
  jumpAt: number | null;
  pushAt: number | null;
  openAt: number | null;
  backAt: number | null;
  paidAt: number | null;
  /** Did the recovery message go out (null: not decided yet). */
  sent: boolean | null;
  status: CartStatus;
  statusAt: number;
}

export type Via = 'club' | 'recovered' | 'you';
export interface OrderView {
  key: string;
  id: number;
  customer: CustomerId | 'you';
  lines: Line[];
  pay: PayId;
  stage: Stage;
  /** Story time it was placed (−Infinity: before the story). */
  at: number;
  clock: number;
  coupon: boolean;
  via?: Via;
  changedAt: number;
  /** The visitor moved it last. */
  byYou?: boolean;
}

export type EventKind =
  | 'order'
  | 'chat'
  | 'checkout'
  | 'abandon'
  | 'sent'
  | 'unsent'
  | 'read'
  | 'back'
  | 'recovered'
  | 'lost'
  | 'stock'
  | 'restock'
  | 'levelup'
  | 'faq'
  | 'mineAbandon'
  | 'mineSent'
  | 'mineUnsent'
  | 'mineOrder';
export interface ShopEvent {
  id: string;
  at: number;
  kind: EventKind;
  customer?: CustomerId | 'you';
  product?: ProductId;
  /** order events */
  orderKey?: string;
  clock: number;
  /** The visitor did it (no story toast; their own feedback shows at once). */
  mine?: boolean;
}

export interface BoardRow {
  id: CustomerId;
  granos: number;
  streak: number;
  level: LevelId;
  /** Story time of the last change (level-up). */
  changedAt: number;
}

export interface ShopView {
  t: number;
  /** Store clock (minutes from midnight). */
  clock: number;
  ines: InesView;
  orders: OrderView[];
  events: ShopEvent[];
  week: { abandoned: number; sent: number; read: number; back: number; paid: number };
  visits: number;
  /** New orders since 18:05 (story + visitor). */
  newOrders: OrderView[];
  stock: Record<ProductId, number>;
  sold: Record<ProductId, number>;
  lowStock: ProductId | null;
  restockAt: number | null;
  club: { members: number; byLevel: Record<LevelId, number>; board: BoardRow[]; levelUpAt: number | null };
  chats: { total: number; byBot: number; sales: number; human: number };
  faqAt: number;
  recoveryOn: boolean;
}

/** Story time → store clock (minutes), with the half-hour jump. */
export const clockAt = (at: number, jumpAt: number | null) => NOW_START + Math.floor(Math.max(0, at) / MINUTE_MS) + (jumpAt !== null && at >= jumpAt ? JUMP_MINUTES : 0);

const STORY_ORDERS: { at: number; customer: CustomerId; lines: Line[]; pay: PayId; via?: Via }[] = [
  { at: STORY.orderTomas, customer: 'tomas', lines: [L('huila', 's500', 'filter')], pay: 'card', via: 'club' },
  { at: STORY.orderCarla, customer: 'carla', lines: [{ ...L('sidamo', 's250', 'filter'), qty: 2 }], pay: 'transfer' },
  { at: STORY.orderDiego, customer: 'diego', lines: [L('medianoche', 's250', 'moka'), L('moka', 's250', 'beans')], pay: 'cash' },
];
const MOVES: { at: number; id: number; stage: Stage }[] = [
  { at: STORY.move1, id: 1044, stage: 'shipping' },
  { at: STORY.move2, id: 1041, stage: 'delivered' },
  { at: STORY.move3, id: 1045, stage: 'roasting' },
];

/** The stage after `stage` (null: delivered). */
export const nextStage = (stage: Stage): Stage | null => STAGES[STAGES.indexOf(stage) + 1] ?? null;

/**
 * The evening at story time `t`. `bot` / `wa` are the chat scripts (any locale: only
 * their structure matters here).
 */
export function deriveShop(state: ShopState, t: number, bot: ChatScript, wa: ChatScript): ShopView {
  /* Inés ---------------------------------------------------------------- */
  const chat = steeredRun(bot, t - STORY.chatStart, state.bot, botDecides);
  const pick = botPick(chat.chosen);
  const addRel = addTime(chat);
  const addAt = addRel === null ? null : STORY.chatStart + addRel;
  // When the visitor tapped "add" for her, her cart opens at once (nothing waits for the clock at rest).
  const addByYou = PICK_STEPS.some((s) => state.bot[s]?.reply === 'add');
  const cartAt = addAt === null ? null : addAt + (addByYou ? 0 : AFTER_ADD.cart);
  const leaveAt = addAt === null ? null : addAt + AFTER_ADD.leave;
  const jumpAt = leaveAt === null ? null : Math.max(STORY.jump, leaveAt + 1000);
  const pushAt = jumpAt === null ? null : jumpAt + AFTER_ADD.push;
  const sent = jumpAt !== null && t >= jumpAt ? isOn(state.off, jumpAt) : null;
  const openAt = pushAt === null || !sent ? null : Math.max(pushAt, Math.min(pushAt + AFTER_ADD.open, state.waOpen ?? Infinity));
  const waRun = sent && pushAt !== null && t >= pushAt ? inesWaRun(wa, t - pushAt, state.wa) : null;
  const backRel = waRun ? backTime(waRun) : null;
  const backAt = backRel === null || pushAt === null ? null : Math.max(pushAt + backRel, openAt ?? 0);
  const backByYou = state.wa.msg?.reply === 'back' || state.wa.doubt?.reply === 'back';
  const paidAt = backAt === null ? null : backAt + AFTER_BACK.paid;

  let phase: InesPhase = 'catalog';
  if (t >= STORY.chatOpen) phase = 'chat';
  if (cartAt !== null && t >= cartAt) phase = 'cart';
  if (addAt !== null && t >= addAt + AFTER_ADD.checkout) phase = 'checkout';
  if (leaveAt !== null && t >= leaveAt) phase = 'locked';
  if (openAt !== null && t >= openAt) phase = 'whatsapp';
  if (backAt !== null && t >= backAt + (backByYou ? 0 : AFTER_BACK.checkout)) phase = 'checkout2';
  if (backAt !== null && t >= backAt + AFTER_BACK.press) phase = 'paying';
  if (paidAt !== null && t >= paidAt) phase = 'paid';

  const lines = pick && addAt !== null && t >= addAt ? [INES_START, pick] : [INES_START];
  const lostAt = sent === false ? Math.max(STORY.lost, (jumpAt ?? 0) + 4000) : null;
  let status: CartStatus = 'browsing';
  let statusAt = -Infinity;
  const mark = (s: CartStatus, at: number | null) => {
    if (at !== null && t >= at) {
      status = s;
      statusAt = at;
    }
  };
  mark('checkout', addAt === null ? null : addAt + AFTER_ADD.checkout);
  mark('abandoned', leaveAt);
  if (sent === false) mark('unsent', jumpAt);
  if (sent) {
    mark('sent', jumpAt);
    mark('read', openAt);
    mark('back', backAt);
    mark('recovered', paidAt);
  } else if (sent === false) mark('lost', lostAt);

  const clock = (at: number) => clockAt(at, jumpAt);

  /* Events ------------------------------------------------------------- */
  const events: ShopEvent[] = [
    { id: 'pre-martin', at: -3, kind: 'sent', customer: 'martin', clock: 1040 },
    { id: 'pre-ana', at: -2, kind: 'order', customer: 'ana', orderKey: 'o1045', clock: 1078 },
  ];
  const push = (e: Omit<ShopEvent, 'clock'>) => {
    if (e.at <= t) events.push({ ...e, clock: clock(e.at) });
  };
  push({ id: 'chat-ines', at: STORY.chatStart, kind: 'chat', customer: 'ines' });
  if (addAt !== null) push({ id: 'checkout-ines', at: addAt + AFTER_ADD.checkout, kind: 'checkout', customer: 'ines' });
  if (leaveAt !== null) push({ id: 'abandon-ines', at: leaveAt, kind: 'abandon', customer: 'ines' });
  if (sent && jumpAt !== null) push({ id: 'sent-ines', at: jumpAt, kind: 'sent', customer: 'ines' });
  if (sent === false && jumpAt !== null) push({ id: 'unsent-ines', at: jumpAt, kind: 'unsent', customer: 'ines' });
  if (sent && openAt !== null) push({ id: 'read-ines', at: openAt, kind: 'read', customer: 'ines', mine: state.waOpen !== null && openAt === state.waOpen });
  if (backAt !== null) push({ id: 'back-ines', at: backAt, kind: 'back', customer: 'ines', mine: backByYou });
  if (lostAt !== null) push({ id: 'lost-ines', at: lostAt, kind: 'lost', customer: 'ines' });
  push({ id: 'levelup-tomas', at: STORY.levelUp, kind: 'levelup', customer: 'tomas' });
  push({ id: 'faq', at: STORY.faq, kind: 'faq' });

  /* Orders ------------------------------------------------------------- */
  const placed: Omit<OrderView, 'id'>[] = [];
  for (const o of STORY_ORDERS) {
    if (o.at <= t) placed.push({ key: `s-${o.customer}`, customer: o.customer, lines: o.lines, pay: o.pay, stage: 'new', at: o.at, clock: clock(o.at), coupon: false, via: o.via, changedAt: o.at });
  }
  if (paidAt !== null && paidAt <= t) {
    placed.push({ key: 's-ines', customer: 'ines', lines, pay: 'card', stage: 'new', at: paidAt, clock: clock(paidAt), coupon: true, via: 'recovered', changedAt: paidAt });
  }
  state.mine.orders.forEach((o, i) => {
    if (o.at > t) return;
    placed.push({ key: `mine-${i}`, customer: 'you', lines: o.lines, pay: o.pay, stage: 'new', at: o.at, clock: clock(o.at), coupon: o.coupon, via: 'you', changedAt: o.at });
  });
  placed.sort((a, b) => a.at - b.at);
  const newOrders: OrderView[] = placed.map((o, i) => ({ ...o, id: 1046 + i }));
  for (const o of newOrders) {
    events.push({
      id: `order-${o.key}`,
      at: o.at,
      kind: o.customer === 'you' ? 'mineOrder' : o.via === 'recovered' ? 'recovered' : 'order',
      customer: o.customer,
      orderKey: o.key,
      clock: o.clock,
      mine: o.customer === 'you',
    });
  }
  const base: OrderView[] = BASE_ORDERS.map((b) => {
    let stage = b.stage;
    let changedAt = -Infinity;
    for (const m of MOVES) {
      if (m.id === b.id && m.at <= t) {
        stage = m.stage;
        changedAt = m.at;
      }
    }
    return { key: `o${b.id}`, id: b.id, customer: b.customer, lines: b.lines, pay: b.pay, stage, at: -Infinity, clock: b.clock, coupon: false, changedAt };
  });
  // The visitor's moves on the board win until the story moves that order again.
  const withMoves = (o: OrderView): OrderView => {
    const m = state.moved[o.key];
    return m && m.at >= o.changedAt ? { ...o, stage: m.stage, changedAt: m.at, byYou: true } : o;
  };
  const orders = [...newOrders.slice().reverse(), ...base.slice().reverse()].map(withMoves);

  /* Stock + shelf ------------------------------------------------------ */
  const stock = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.stock])) as Record<ProductId, number>;
  const sold = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.sold])) as Record<ProductId, number>;
  for (const o of newOrders) {
    for (const l of o.lines) {
      stock[l.product] = Math.max(0, stock[l.product] - l.qty);
      sold[l.product] += l.qty;
    }
  }
  const low = PRODUCTS.find((p) => p.kind === 'coffee' && stock[p.id] <= LOW_STOCK);
  let lowStock: ProductId | null = low?.id ?? null;
  if (lowStock === 'sidamo' && t >= STORY.orderCarla) push({ id: 'stock-sidamo', at: STORY.orderCarla, kind: 'stock', product: 'sidamo' });
  const restockAt = state.restock !== null && state.restock <= t ? state.restock : null;
  if (restockAt !== null) {
    stock.sidamo += RESTOCK_BAGS;
    events.push({ id: 'restock', at: restockAt, kind: 'restock', product: 'sidamo', clock: clock(restockAt), mine: true });
    if (lowStock === 'sidamo') lowStock = null;
  }

  /* The visitor's own cart --------------------------------------------- */
  const mine = state.mine;
  const week = { ...WEEK_CARTS };
  if (leaveAt !== null && t >= leaveAt) week.abandoned += 1;
  if (sent && jumpAt !== null && t >= jumpAt) week.sent += 1;
  if (sent && openAt !== null && t >= openAt) week.read += 1;
  if (backAt !== null && t >= backAt) week.back += 1;
  if (paidAt !== null && t >= paidAt) week.paid += 1;
  if (mine.abandoned) {
    week.abandoned += 1;
    events.push({ id: 'mine-abandon', at: mine.abandoned.at, kind: 'mineAbandon', customer: 'you', clock: clock(mine.abandoned.at), mine: true });
    if (mine.recovery) {
      events.push({ id: 'mine-recovery', at: mine.recovery.at, kind: mine.recovery.sent ? 'mineSent' : 'mineUnsent', customer: 'you', clock: clock(mine.recovery.at) + JUMP_MINUTES, mine: true });
      if (mine.recovery.sent) week.sent += 1;
    }
    if (mine.waOpened) week.read += 1;
    if (mine.coupon) week.back += 1;
  }
  const mineRecovered = mine.orders.filter((o) => o.recovered).length;
  week.abandoned += mineRecovered;
  week.sent += mineRecovered;
  week.read += mineRecovered;
  week.back += mineRecovered;
  week.paid += mineRecovered;

  /* Club ---------------------------------------------------------------- */
  const levelUpAt = t >= STORY.levelUp ? STORY.levelUp : null;
  const board: BoardRow[] = BOARD.map((b) => {
    const up = b.id === 'tomas' && levelUpAt !== null;
    const granos = up ? b.granos + CLUB.streakBonus : b.granos;
    return { id: b.id, granos, streak: up ? b.streak + 1 : b.streak, level: levelFor(granos), changedAt: up ? STORY.levelUp : -Infinity };
  }).sort((a, b) => b.granos - a.granos);
  const byLevel = { ...CLUB.byLevel };
  if (levelUpAt !== null) {
    byLevel.medium -= 1;
    byLevel.dark += 1;
  }

  /* Site chat ---------------------------------------------------------- */
  const chats = { ...CHATS_BEFORE };
  if (t >= STORY.chatStart) {
    chats.total += 1;
    chats.byBot += 1;
  }
  if (t >= STORY.faq) {
    chats.total += 1;
    chats.byBot += 1;
  }
  if (mine.chat) {
    chats.total += 1;
    chats.byBot += 1;
  }
  if (paidAt !== null && t >= paidAt) chats.sales += 1;

  events.sort((a, b) => a.at - b.at);

  return {
    t,
    clock: clock(t),
    ines: { phase, chat, wa: waRun, lines, pick, addAt, leaveAt, jumpAt, pushAt, openAt, backAt, paidAt, sent, status, statusAt },
    orders,
    events,
    week,
    visits: VISITS_BEFORE + Math.floor(Math.max(0, t) / VISIT_EVERY),
    newOrders,
    stock,
    sold,
    lowStock,
    restockAt,
    club: { members: CLUB.members, byLevel, board, levelUpAt },
    chats,
    faqAt: STORY.faq,
    recoveryOn: !isOffNow(state.off),
  };
}

/** Where the visitor's own cart stands (panel list). */
export function mineCartStatus(m: Mine): CartStatus | null {
  if (!m.abandoned) return null;
  if (m.coupon) return 'back';
  if (m.waOpened) return 'read';
  if (!m.recovery) return 'abandoned';
  return m.recovery.sent ? 'sent' : 'unsent';
}
