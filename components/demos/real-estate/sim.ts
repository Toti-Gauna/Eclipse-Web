/**
 * Simulation state for the real-estate demo.
 *
 * A tiny external store holds what both screens must agree on: the story tick
 * and the visitor's answers in the scripted after-hours conversation. When the
 * laptop and the phone of the same showcase are on screen they share one store,
 * so answering on the customer's phone updates the agency's inbox and lead card.
 * Everything visible is *derived* with pure functions, which is what lets
 * reduced motion jump straight to the final state.
 */
import {
  ASK,
  BUDGETS,
  NOW_MIN,
  PAST_LEADS,
  RESPONSE_SECONDS,
  VISIT_SLOTS,
  WEEKEND,
  recommend,
  type Channel,
  type LeadId,
  type ListingId,
  type NextStep,
  type Op,
  type PropType,
  type Stage,
  type ZoneId,
} from './data';

export interface ChatState {
  /** Story tick at which the conversation started (null: starts on its own at CHAT_FALLBACK_START). */
  base: number | null;
  /** The visitor answered (or replayed): no more automatic answers. */
  manual: boolean;
  op: Op | null;
  opTick: number;
  budget: number | null;
  budgetTick: number;
  slot: number | null;
  slotTick: number;
}

export interface SimState {
  tick: number;
  chat: ChatState;
}

export interface EstateStore {
  readonly paired: boolean;
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => SimState;
  report: (tick: number) => void;
  chooseOp: (op: Op) => void;
  chooseBudget: (index: number) => void;
  chooseSlot: (index: number) => void;
  replay: () => void;
  /** A chat view is on screen: start the conversation now (once). */
  startChat: () => void;
}

/** Story tick at which the conversation starts if nobody opened the chat before. */
export const CHAT_FALLBACK_START = 2;

const freshChat = (base: number | null, manual: boolean): ChatState => ({
  base,
  manual,
  op: null,
  opTick: 0,
  budget: null,
  budgetTick: 0,
  slot: null,
  slotTick: 0,
});

export function createEstateStore(paired = false): EstateStore {
  let state: SimState = { tick: 0, chat: freshChat(null, false) };
  const listeners = new Set<() => void>();
  const set = (next: SimState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  const answer = (patch: Partial<ChatState>) => set({ ...state, chat: { ...state.chat, ...patch, manual: true } });
  return {
    paired,
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot: () => state,
    report(tick) {
      // Both screens tick in lockstep: keep the furthest one, never add them up.
      if (tick > state.tick) set({ ...state, tick });
    },
    chooseOp(op) {
      if (state.chat.op) return;
      answer({ op, opTick: state.tick });
    },
    chooseBudget(index) {
      if (state.chat.budget !== null) return;
      answer({ budget: index, budgetTick: state.tick });
    },
    chooseSlot(index) {
      if (state.chat.slot !== null) return;
      answer({ slot: index, slotTick: state.tick });
    },
    replay() {
      set({ ...state, chat: freshChat(state.tick, true) });
    },
    startChat() {
      if (state.chat.base !== null || state.tick >= CHAT_FALLBACK_START) return;
      set({ ...state, chat: { ...state.chat, base: state.tick } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Pairing: laptop + phone of the same showcase share a store           */
/* ------------------------------------------------------------------ */
const sharedStores = new WeakMap<Element, EstateStore>();

/**
 * Finds the element that wraps exactly one laptop and one phone (the
 * <DemoShowcase> "both" layout) around `el`. Null when the phone is alone.
 */
function findPairHost(el: Element): Element | null {
  let node = el.closest('.device-phone, .device-laptop')?.parentElement ?? null;
  for (let depth = 0; node && depth < 4; depth++, node = node.parentElement) {
    const laptops = node.querySelectorAll('.device-laptop').length;
    const phones = node.querySelectorAll('.device-phone').length;
    if (laptops === 1 && phones === 1) return node;
    if (laptops > 1 || phones > 1) return null;
  }
  return null;
}

/** The phone that sits on top of this laptop in the same showcase, if any. */
export function pairedPhoneOf(el: Element): Element | null {
  return findPairHost(el)?.querySelector('.device-phone') ?? null;
}

export function pairedStoreFor(el: Element): EstateStore | null {
  const host = findPairHost(el);
  if (!host) return null;
  let store = sharedStores.get(host);
  if (!store) {
    store = createEstateStore(true);
    sharedStores.set(host, store);
  }
  return store;
}

/* ------------------------------------------------------------------ */
/* The conversation                                                     */
/* ------------------------------------------------------------------ */
/** Chat clock at which the first question gets answered automatically. */
const AUTO_OP = 6;
/** Ticks each later question waits before being answered automatically. */
const AUTO_WAIT = 4;

export type AgentKind = keyof typeof RESPONSE_SECONDS;
export type ChatItem =
  | { id: string; from: 'customer'; kind: 'inquiry' | 'op' | 'budget' | 'slot' }
  | { id: string; from: 'agent'; kind: AgentKind; options?: 'op' | 'budget' | 'slot' }
  | { id: string; from: 'system'; kind: 'crm' };

export interface ChatView {
  items: ChatItem[];
  /** Story tick at which each item appeared (same order as items). */
  times: number[];
  typing: boolean;
  awaiting: 'op' | 'budget' | 'slot' | null;
  started: boolean;
  done: boolean;
  op: Op | null;
  budget: number | null;
  slot: number | null;
  recommended: ListingId[] | null;
  /** Story ticks of the milestones (null until they happen). */
  startedAt: number | null;
  qualifiedAt: number | null;
  bookedAt: number | null;
  doneAt: number | null;
}

export function deriveChat(state: SimState, reduced: boolean): ChatView {
  const { chat, tick } = state;
  const base = chat.base ?? CHAT_FALLBACK_START;
  const clock = reduced ? Infinity : tick - base;
  const at = (n: number) => clock >= n;
  // chat clock → story tick (with reduced motion the clock is infinite: never past "now")
  const g = (n: number) => Math.min(base + n, tick);
  const view: ChatView = {
    items: [],
    times: [],
    typing: false,
    awaiting: null,
    started: false,
    done: false,
    op: null,
    budget: null,
    slot: null,
    recommended: null,
    startedAt: null,
    qualifiedAt: null,
    bookedAt: null,
    doneAt: null,
  };
  const push = (item: ChatItem, n: number) => {
    view.items.push(item);
    view.times.push(g(n));
  };
  const typing = () => {
    view.typing = true;
    return view;
  };

  if (!at(0)) return view;
  view.started = true;
  view.startedAt = g(0);
  push({ id: 'inquiry', from: 'customer', kind: 'inquiry' }, 0);
  if (!at(2)) return at(1) ? typing() : view;
  push({ id: 'greet', from: 'agent', kind: 'greet', options: 'op' }, 2);

  // 1 · buy or rent
  const op = chat.op ?? (!chat.manual && at(AUTO_OP) ? 'sale' : null);
  if (!op) {
    view.awaiting = 'op';
    return view;
  }
  const o0 = chat.op ? chat.opTick - base : AUTO_OP;
  view.op = op;
  push({ id: 'op', from: 'customer', kind: 'op' }, o0);
  if (!at(o0 + 2)) return at(o0 + 1) ? typing() : view;
  push({ id: 'budgetAsk', from: 'agent', kind: 'budgetAsk', options: 'budget' }, o0 + 2);

  // 2 · budget
  const budget = chat.budget ?? (!chat.manual && at(o0 + 2 + AUTO_WAIT) ? 0 : null);
  if (budget === null) {
    view.awaiting = 'budget';
    return view;
  }
  const b0 = chat.budget !== null ? chat.budgetTick - base : o0 + 2 + AUTO_WAIT;
  view.budget = budget;
  view.qualifiedAt = g(b0);
  push({ id: 'budget', from: 'customer', kind: 'budget' }, b0);
  if (!at(b0 + 2)) return at(b0 + 1) ? typing() : view;
  view.recommended = recommend(op, BUDGETS[op][budget]);
  push({ id: 'matches', from: 'agent', kind: 'matches' }, b0 + 2);
  if (!at(b0 + 4)) return at(b0 + 3) ? typing() : view;
  push({ id: 'visitAsk', from: 'agent', kind: 'visitAsk', options: 'slot' }, b0 + 4);

  // 3 · visit
  const slot = chat.slot ?? (!chat.manual && at(b0 + 4 + AUTO_WAIT) ? 0 : null);
  if (slot === null) {
    view.awaiting = 'slot';
    return view;
  }
  const s0 = chat.slot !== null ? chat.slotTick - base : b0 + 4 + AUTO_WAIT;
  view.slot = slot;
  push({ id: 'slot', from: 'customer', kind: 'slot' }, s0);
  if (!at(s0 + 2)) return at(s0 + 1) ? typing() : view;
  view.bookedAt = g(s0 + 2);
  push({ id: 'booked', from: 'agent', kind: 'booked' }, s0 + 2);
  if (!at(s0 + 3)) return view;
  push({ id: 'crm', from: 'system', kind: 'crm' }, s0 + 3);
  view.doneAt = g(s0 + 3);
  view.done = true;
  return view;
}

/** Average answer time of the agent in this conversation so far (seconds), or null. */
export function chatAverageSeconds(chat: ChatView): number | null {
  const secs = chat.items.filter((i) => i.from === 'agent').map((i) => RESPONSE_SECONDS[i.kind as AgentKind]);
  return secs.length ? Math.round(secs.reduce((a, b) => a + b, 0) / secs.length) : null;
}

/* ------------------------------------------------------------------ */
/* Leads + inbox                                                        */
/* ------------------------------------------------------------------ */
export interface LeadView {
  id: LeadId;
  live: boolean;
  channel: Channel;
  day: number;
  minutes: number;
  /** Agent's first answer time (seconds); null while it is still typing. */
  responseSec: number | null;
  op: Op | null;
  type: PropType;
  zone: ZoneId;
  beds: number;
  budget: number | null;
  score: number;
  stage: Stage;
  next: NextStep | null;
  listings: ListingId[];
  /** Live lead: the conversation finished and the lead reached the CRM. */
  complete: boolean;
}

/** The live conversation as a lead: it fills in field by field as the customer answers. */
export function deriveLiveLead(chat: ChatView): LeadView | null {
  if (!chat.started) return null;
  const op = chat.op;
  const budget = op && chat.budget !== null ? BUDGETS[op][chat.budget] : null;
  const booked = chat.bookedAt !== null && chat.slot !== null;
  const score = chat.done ? 92 : booked ? 88 : budget !== null ? 74 : op ? 55 : 35;
  return {
    id: 'live',
    live: true,
    channel: 'whatsapp',
    day: 0,
    minutes: NOW_MIN,
    responseSec: chat.items.some((i) => i.id === 'greet') ? RESPONSE_SECONDS.greet : null,
    op,
    type: ASK.type,
    zone: ASK.zone,
    beds: ASK.beds,
    budget,
    score,
    stage: booked ? 'visit' : budget !== null ? 'qualified' : 'new',
    next: booked ? { kind: 'visit', slot: VISIT_SLOTS[chat.slot!] } : null,
    listings: chat.recommended ?? [],
    complete: chat.done,
  };
}

export function pastLeadViews(): LeadView[] {
  return PAST_LEADS.map((p) => ({ ...p, live: false, complete: true }));
}

export interface Kpis {
  inquiries: number;
  visits: number;
  qualified: number;
  avgSeconds: number;
}

export function deriveKpis(chat: ChatView): Kpis {
  return {
    inquiries: WEEKEND.inquiries + (chat.started ? 1 : 0),
    visits: WEEKEND.visits + (chat.bookedAt !== null ? 1 : 0),
    qualified: WEEKEND.qualified + (chat.qualifiedAt !== null ? 1 : 0),
    avgSeconds: WEEKEND.avgSeconds,
  };
}
