/**
 * Lumen Propiedades — the live story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did; every
 * screen DERIVES the night from (story time t, that state) with `deriveEstate`, which is
 * pure: pausing, looping, reduced motion (the end state) and two screens in sync come free.
 *
 * The 28 s loop: Thursday 23:40, Carolina asks on the site about a 3-room apartment → the
 * assistant answers in 4 s, qualifies her (financing, budget), offers two visit slots → the
 * visit lands in the calendar and her card moves New → Qualified → Visit → the night skips
 * to after the visit → a WhatsApp follow-up asks how it went → she reserves (Reserve).
 * With the assistant off, the inquiry waits until the office opens at 9:00 and the lead is lost.
 */
import { createDemoStore, runChat, type ChatPick, type ChatRun, type ChatScript, type DemoStore } from '../kit';
import {
  ALTERNATIVE,
  ASKED,
  BASE_LEADS,
  BASE_VISITS,
  CHAT_SLOTS,
  CLOCK_START,
  HUMAN_REPLY_MIN,
  LOOP_MS,
  OFFICE_OPENS,
  STORY,
  VISIT_MIN,
  WEEK,
  WEEK_BY_SOURCE,
  type AdvisorId,
  type BudgetId,
  type ListingId,
  type PayId,
  type PersonId,
  type SlotId,
  type Source,
  type Stage,
  type VisitWhat,
} from './data';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export interface MineVisit {
  day: number;
  start: number;
  listing: ListingId;
  /** Story time it was made (−1: an earlier loop). */
  at: number;
  via: 'site' | 'calendar';
}

export interface EstateState {
  /** The 24/7 assistant is switched off. */
  botOff: boolean;
  /** The 23:40 conversation (chat time). */
  picks: Record<string, ChatPick>;
  /** The WhatsApp follow-up after the visit (thread time). */
  followPicks: Record<string, ChatPick>;
  /** Visits the visitor booked themselves (site or calendar). */
  mine: MineVisit[];
  /** The visitor took over the buyer's phone: no more autoplay of its screens this loop. */
  buyerManual: boolean;
}

const fresh = (botOff = false): EstateState => ({ botOff, picks: {}, followPicks: {}, mine: [], buyerManual: false });

export type EstateStore = DemoStore<EstateState>;

/** Module-level (stable) factory for usePairedStore. */
export function createEstateStore(paired: boolean): EstateStore {
  return createDemoStore<EstateState>(fresh(), {
    loopMs: LOOP_MS,
    paired,
    onLoop: (s) => ({ ...fresh(s.botOff), mine: s.mine.map((m) => ({ ...m, at: -1 })) }),
  });
}

/**
 * Keeps the replies already chosen automatically: the kit's runChat stops auto replies once
 * the visitor taps one, so earlier automatic answers are frozen into the picks first.
 */
function freeze(run: ChatRun | null, picks: Record<string, ChatPick>): Record<string, ChatPick> {
  if (!run) return picks;
  const out = { ...picks };
  for (const [step, reply] of Object.entries(run.chosen)) {
    if (out[step]) continue;
    const item = run.items.find((i) => i.id === `${step}:reply`);
    if (item) out[step] = { reply, at: item.at };
  }
  return out;
}

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  pick: (run: ChatRun, step: string, reply: string) => (s: EstateState, t: number): EstateState => ({
    ...s,
    picks: { ...freeze(run, s.picks), [step]: { reply, at: t - STORY.chatStart } },
  }),
  pickFollow: (run: ChatRun | null, start: number, step: string, reply: string) => (s: EstateState, t: number): EstateState => ({
    ...s,
    followPicks: { ...freeze(run, s.followPicks), [step]: { reply, at: t - start } },
  }),
  /** Flip the assistant (the caller restarts the story so the 23:40 inquiry plays again). */
  toggleBot: () => (s: EstateState): EstateState => ({ ...s, botOff: !s.botOff }),
  book: (v: Omit<MineVisit, 'at'>) => (s: EstateState, t: number): EstateState =>
    s.mine.some((m) => m.day === v.day && m.start === v.start) ? s : { ...s, mine: [...s.mine, { ...v, at: t }] },
  touchBuyer: () => (s: EstateState): EstateState => (s.buyerManual ? s : { ...s, buyerManual: true }),
};

/* ------------------------------------------------------------------ */
/* Conversation shapes (timing + branches; texts are added per locale)  */
/* ------------------------------------------------------------------ */
interface FlowStep {
  from: 'bot' | 'user' | 'note';
  typingMs?: number;
  pauseMs?: number;
  next?: string;
  replies?: { id: string; goto?: string }[];
  auto?: string;
  autoMs?: number;
}
type Flow = { start: string; steps: Record<string, FlowStep> };

/** The 23:40 inquiry, answered by the assistant. */
export const INQUIRY: Flow = {
  start: 'ask',
  steps: {
    ask: { from: 'user', typingMs: 0, pauseMs: 0, next: 'hi' },
    hi: { from: 'bot', typingMs: 1200, pauseMs: 300, next: 'pay' },
    pay: { from: 'bot', typingMs: 800, pauseMs: 300, replies: [{ id: 'cash' }, { id: 'credit' }, { id: 'sell' }], auto: 'credit', autoMs: 1900, next: 'budget' },
    budget: {
      from: 'bot',
      typingMs: 900,
      pauseMs: 300,
      replies: [{ id: 'low', goto: 'alt' }, { id: 'mid', goto: 'fits' }, { id: 'high', goto: 'fits' }],
      auto: 'mid',
      autoMs: 1900,
    },
    fits: { from: 'bot', typingMs: 1000, pauseMs: 300, next: 'slots' },
    alt: { from: 'bot', typingMs: 1200, pauseMs: 300, next: 'slots' },
    slots: { from: 'bot', typingMs: 900, pauseMs: 300, replies: [{ id: 'fri' }, { id: 'sat' }], auto: 'fri', autoMs: 2100, next: 'booked' },
    booked: { from: 'bot', typingMs: 1000, pauseMs: 300, next: 'crm' },
    crm: { from: 'note', typingMs: 450 },
  },
};

/** The same inquiry with the assistant off: nobody answers until the office opens. */
export const UNANSWERED: Flow = {
  start: 'ask',
  steps: {
    ask: { from: 'user', typingMs: 0, pauseMs: 0, next: 'wait' },
    wait: { from: 'note', typingMs: 1100, pauseMs: 300, next: 'opens' },
    opens: { from: 'note', typingMs: STORY.off.to - STORY.off.from - 300, pauseMs: 300, next: 'human' },
    human: { from: 'bot', typingMs: 2300, pauseMs: 300, next: 'lost' },
    lost: { from: 'user', typingMs: 1600, pauseMs: 300, next: 'lostNote' },
    lostNote: { from: 'note', typingMs: 600 },
  },
};

/** The WhatsApp follow-up after the visit. */
export const FOLLOW: Flow = {
  start: 'how',
  steps: {
    how: {
      from: 'bot',
      typingMs: 600,
      pauseMs: 300,
      replies: [{ id: 'reserve', goto: 'reserved' }, { id: 'similar', goto: 'similarList' }, { id: 'think', goto: 'later' }],
      auto: 'reserve',
      autoMs: 2600,
    },
    reserved: { from: 'bot', typingMs: 1100, pauseMs: 300, next: 'reservedNote' },
    reservedNote: { from: 'note', typingMs: 450 },
    similarList: { from: 'bot', typingMs: 1100, pauseMs: 300, next: 'similarNote' },
    similarNote: { from: 'note', typingMs: 450 },
    later: { from: 'bot', typingMs: 1100, pauseMs: 300, next: 'laterNote' },
    laterNote: { from: 'note', typingMs: 450 },
  },
};

/** A runnable script from a flow (texts empty: the views localize the run). */
export function toScript(flow: Flow): ChatScript {
  const steps: ChatScript['steps'] = {};
  for (const [id, s] of Object.entries(flow.steps)) {
    steps[id] = { ...s, replies: s.replies?.map((r) => ({ id: r.id, label: '', goto: r.goto })) };
  }
  return { start: flow.start, steps };
}
const SCRIPTS = { inquiry: toScript(INQUIRY), unanswered: toScript(UNANSWERED), follow: toScript(FOLLOW) };

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
export interface Clock {
  day: number;
  min: number;
}

export type Outcome = 'reserve' | 'similar' | 'think';

export interface VisitView {
  id: string;
  day: number;
  start: number;
  end: number;
  what: VisitWhat;
  who?: PersonId | 'you';
  listing: ListingId;
  advisor: AdvisorId;
  /** live: Carolina's visit · mine: the visitor's own · done: already happened. */
  state: 'default' | 'live' | 'mine' | 'done';
  changedAt: number;
}

export interface LeadCard {
  id: string;
  person: PersonId | 'you';
  column: Stage;
  listing: ListingId;
  source: Source | 'site';
  score: number;
  /** What the card says under the name. */
  note: 'base' | 'waiting' | 'lost' | 'answered' | 'qualified' | 'booked' | 'visited' | 'reserved' | 'similar' | 'think' | 'you';
  visit?: { day: number; start: number };
  changedAt: number;
}

export type EventKind =
  | 'pastPortal'
  | 'pastWhatsApp'
  | 'pastFollow'
  | 'inquiry'
  | 'answered'
  | 'qualified'
  | 'booked'
  | 'visited'
  | 'followSent'
  | 'reserved'
  | 'similar'
  | 'think'
  | 'waiting'
  | 'opens'
  | 'human'
  | 'lost'
  | 'you';

export interface EstateEvent {
  id: string;
  /** Story time (negative: before the story). */
  at: number;
  kind: EventKind;
  clock: Clock;
  listing?: ListingId;
  visit?: { day: number; start: number };
}

export interface Kpis {
  inquiries: number;
  /** Answered in under a minute / share of the answered or late ones. */
  fast: number;
  fastPct: number;
  afterHours: number;
  /** Average first answer in seconds. */
  avgSec: number;
  /** The live inquiry is waiting (assistant off). */
  waiting: boolean;
  visits: number;
  reserves: number;
  bySource: Record<Source, number>;
}

export interface EstateView {
  t: number;
  clock: Clock;
  botOff: boolean;
  /** The 23:40 conversation (structure only: localize it before showing). */
  chat: ChatRun;
  pay: PayId | null;
  budget: BudgetId | null;
  slot: SlotId | null;
  /** The listing the visit is for (the asked one, or the cheaper alternative). */
  listing: ListingId;
  inquiryAt: number;
  answeredAt: number | null;
  payAt: number | null;
  qualifiedAt: number | null;
  bookedAt: number | null;
  timelapseAt: number | null;
  /** WhatsApp follow-up (thread time 0 = followStart). */
  followStart: number | null;
  follow: ChatRun | null;
  outcome: Outcome | null;
  outcomeAt: number | null;
  /** Assistant off: when the office opened, the human answer and the lost lead. */
  opensAt: number | null;
  humanAt: number | null;
  lostAt: number | null;
  /** Carolina's card (null before she writes). */
  stage: Stage | null;
  score: number;
  cards: LeadCard[];
  visits: VisitView[];
  events: EstateEvent[];
  kpis: Kpis;
}

const DAY = 1440;
const toClock = (m: number): Clock => ({ day: CLOCK_START.day + Math.floor(m / DAY), min: ((m % DAY) + DAY) % DAY });
/** Minutes since Thursday 0:00 of a clock. */
export const clockMinutes = (c: Clock) => (c.day - CLOCK_START.day) * DAY + c.min;

/**
 * The story clock. Before the jump: Thursday 23:40 (+1 min every 6 s). With the assistant
 * off, the night fast-forwards to 9:00 and the first human answer is at 9:12. After the
 * visit: 5 minutes after it ended.
 */
export function clockAt(t: number, botOff: boolean, timelapse: { at: number; day: number; end: number } | null): Clock {
  const start = CLOCK_START.min;
  const slow = (from: number, since: number) => from + Math.min(4, Math.floor(Math.max(0, since) / 6000));
  if (timelapse && t >= timelapse.at) return { day: timelapse.day, min: slow(timelapse.end + 5, t - timelapse.at) };
  if (!botOff || t < STORY.off.from) return toClock(slow(start, t));
  const opens = (OFFICE_OPENS.day - CLOCK_START.day) * DAY + OFFICE_OPENS.min;
  const human = (OFFICE_OPENS.day - CLOCK_START.day) * DAY + HUMAN_REPLY_MIN;
  const { from, to } = STORY.off;
  if (t < to) return toClock(Math.round(start + 1 + ((t - from) / (to - from)) * (opens - start - 1)));
  const humanAt = STORY.chatStart + 9200;
  if (t < humanAt) return toClock(Math.round(opens + ((t - to) / (humanAt - to)) * (human - opens)));
  return toClock(slow(human, t - humanAt));
}

/** Minutes the first answer took with the assistant off (Thu 23:40 → Fri 9:12). */
export const LATE_MINUTES = (OFFICE_OPENS.day - CLOCK_START.day) * DAY + HUMAN_REPLY_MIN - CLOCK_START.min;

const isDone = (v: { day: number; end: number }, c: Clock) => c.day > v.day || (c.day === v.day && c.min >= v.end);

/** The whole night at story time `t` (`instant`: reduced motion, the end of every conversation). */
export function deriveEstate(state: EstateState, t: number, instant: boolean): EstateView {
  // Reduced motion: every step has happened (the store's clock never runs).
  const T = instant ? 1e9 : t;
  const S = STORY;
  const botOff = state.botOff;
  const chat = runChat(botOff ? SCRIPTS.unanswered : SCRIPTS.inquiry, T - S.chatStart, state.picks, { instant });
  const at = (step: string) => (chat.at[step] !== undefined ? S.chatStart + chat.at[step] : null);
  const replyAt = (step: string) => {
    const item = chat.items.find((i) => i.id === `${step}:reply`);
    return item ? S.chatStart + item.at : null;
  };

  const pay = (chat.chosen.pay as PayId | undefined) ?? null;
  const budget = (chat.chosen.budget as BudgetId | undefined) ?? null;
  const slot = (chat.chosen.slots as SlotId | undefined) ?? null;
  const listing: ListingId = budget === 'low' ? ALTERNATIVE : ASKED;
  const inquiryAt = S.chatStart;
  const answeredAt = botOff ? null : at('hi');
  const payAt = botOff ? null : replyAt('pay');
  const qualifiedAt = botOff ? null : replyAt('budget');
  const bookedAt = botOff ? null : at('booked');

  // After the booking, the night skips to just after the visit; then the WhatsApp follow-up.
  const visitSlot = slot ? CHAT_SLOTS[slot] : null;
  const timelapseAt = bookedAt !== null && visitSlot ? Math.max(S.timelapse, bookedAt + S.timelapseAfterBooking) : null;
  const followStart = timelapseAt !== null ? timelapseAt + S.follow : null;
  const follow = followStart !== null && T >= followStart ? runChat(SCRIPTS.follow, T - followStart, state.followPicks, { instant }) : null;
  const outcome = (follow?.chosen.how as Outcome | undefined) ?? null;
  const outcomeStep = outcome === 'reserve' ? 'reserved' : outcome === 'similar' ? 'similarList' : outcome === 'think' ? 'later' : null;
  const outcomeAt = follow && followStart !== null && outcomeStep && follow.at[outcomeStep] !== undefined ? followStart + follow.at[outcomeStep] : null;

  const opensAt = botOff ? at('opens') : null;
  const humanAt = botOff ? at('human') : null;
  const lostAt = botOff ? at('lostNote') : null;

  const tl = timelapseAt !== null && visitSlot ? { at: timelapseAt, day: visitSlot.day, end: visitSlot.start + VISIT_MIN } : null;
  const clock = instant ? clockAt(tl ? tl.at + 6000 : 20_000, botOff, tl) : clockAt(t, botOff, tl);
  const happened = (x: number | null) => x !== null && x <= T;

  /* Carolina's card */
  let stage: Stage | null = null;
  let note: LeadCard['note'] = 'base';
  let changedAt: number = inquiryAt;
  let score = 35;
  if (T >= inquiryAt) {
    stage = 'new';
    note = botOff ? 'waiting' : 'answered';
    if (happened(payAt)) score = 58;
    if (happened(qualifiedAt)) {
      stage = 'qualified';
      note = 'qualified';
      changedAt = qualifiedAt!;
      score = budget === 'low' ? 70 : budget === 'high' ? 86 : 82;
    }
    if (happened(bookedAt)) {
      stage = 'visit';
      note = 'booked';
      changedAt = bookedAt!;
      score += 9;
    }
    if (tl && T >= tl.at) note = 'visited';
    if (happened(outcomeAt) && outcome) {
      note = outcome === 'reserve' ? 'reserved' : outcome;
      if (outcome === 'reserve') {
        stage = 'reserve';
        changedAt = outcomeAt!;
        score = 97;
      }
    }
    if (happened(lostAt)) {
      note = 'lost';
      changedAt = lostAt!;
      score = 0;
    }
  }

  /* Visits */
  const visits: VisitView[] = BASE_VISITS.map((v) => ({ ...v, state: isDone(v, clock) ? 'done' : 'default', changedAt: -Infinity }));
  if (visitSlot && happened(bookedAt)) {
    const v = { day: visitSlot.day, start: visitSlot.start, end: visitSlot.start + VISIT_MIN };
    visits.push({ id: 'v-live', ...v, what: 'visit', who: 'carolina', listing, advisor: 'julia', state: isDone(v, clock) ? 'done' : 'live', changedAt: bookedAt! });
  }
  const mine = state.mine.filter((m) => m.at <= T);
  for (const m of mine) {
    visits.push({ id: `v-you-${m.day}-${m.start}`, day: m.day, start: m.start, end: m.start + VISIT_MIN, what: 'visit', who: 'you', listing: m.listing, advisor: 'marcos', state: 'mine', changedAt: m.at });
  }

  /* Pipeline */
  const cards: LeadCard[] = BASE_LEADS.map((l) => ({
    id: l.id,
    person: l.id,
    column: l.stage,
    listing: l.listing,
    source: l.source,
    score: l.score,
    note: 'base',
    visit: (() => {
      const v = BASE_VISITS.find((x) => x.who === l.id && x.what === 'visit');
      return v ? { day: v.day, start: v.start } : undefined;
    })(),
    changedAt: -Infinity,
  }));
  if (stage) {
    cards.push({ id: 'carolina', person: 'carolina', column: stage, listing, source: 'web', score, note, visit: visitSlot && happened(bookedAt) ? visitSlot : undefined, changedAt });
  }
  mine.forEach((m, i) => cards.push({ id: `you-${i}`, person: 'you', column: 'visit', listing: m.listing, source: 'site', score: 80, note: 'you', visit: { day: m.day, start: m.start }, changedAt: m.at }));

  /* Events (feed, toasts, announcements) */
  const events: EstateEvent[] = [
    { id: 'p1', at: -3, kind: 'pastFollow', clock: { day: 3, min: 21 * 60 + 2 } },
    { id: 'p2', at: -2, kind: 'pastPortal', clock: { day: 3, min: 21 * 60 + 5 }, listing: 'ribera' },
    { id: 'p3', at: -1, kind: 'pastWhatsApp', clock: { day: 3, min: 22 * 60 + 15 }, listing: 'loft' },
  ];
  // Reduced motion: the conversation happened "at once"; label events with the times of the default run.
  const nominal = instant ? runChat(botOff ? SCRIPTS.unanswered : SCRIPTS.inquiry, 1e9, {}) : chat;
  const push = (id: string, when: number | null, kind: EventKind, extra: Partial<EstateEvent> = {}, step?: string) => {
    if (when === null || when > T) return;
    const nominalAt = instant && step && nominal.at[step] !== undefined ? S.chatStart + nominal.at[step] : when;
    events.push({ id, at: when, kind, clock: clockAt(nominalAt, botOff, tl), ...extra });
  };
  push('inquiry', inquiryAt, 'inquiry', { listing: ASKED }, 'ask');
  if (botOff) {
    push('waiting', at('wait'), 'waiting', {}, 'wait');
    push('opens', opensAt, 'opens', {}, 'opens');
    push('human', humanAt, 'human', {}, 'human');
    push('lost', lostAt, 'lost', {}, 'lostNote');
  } else {
    push('answered', answeredAt, 'answered', {}, 'hi');
    push('qualified', qualifiedAt, 'qualified', { listing }, 'fits');
    push('booked', bookedAt, 'booked', { listing, visit: visitSlot ?? undefined }, 'booked');
    push('visited', tl?.at ?? null, 'visited', { listing, visit: visitSlot ?? undefined });
    push('followSent', follow && followStart !== null && follow.at.how !== undefined ? followStart + follow.at.how : null, 'followSent', { listing });
    if (outcome) push(outcome, outcomeAt, outcome === 'reserve' ? 'reserved' : outcome, { listing });
  }
  for (const m of mine) push(`you-${m.day}-${m.start}`, m.at, 'you', { listing: m.listing, visit: { day: m.day, start: m.start } });
  events.sort((a, b) => a.at - b.at);

  /* Numbers */
  const asked = T >= inquiryAt;
  const answered = happened(answeredAt);
  const late = botOff && happened(at('wait'));
  const baseCount = Object.values(WEEK_BY_SOURCE).reduce((a, b) => a + b, 0);
  const inquiries = baseCount + (asked ? 1 : 0);
  const fast = baseCount + (answered ? 1 : 0);
  const counted = baseCount + (answered || late ? 1 : 0);
  const avgSec = happened(humanAt) ? Math.round((baseCount * WEEK.avgSec + LATE_MINUTES * 60) / (baseCount + 1)) : WEEK.avgSec;
  const kpis: Kpis = {
    inquiries,
    fast,
    fastPct: fast / counted,
    afterHours: WEEK.afterHours + (asked ? 1 : 0),
    avgSec,
    waiting: botOff && asked && !happened(humanAt),
    visits: WEEK.visits + (happened(bookedAt) ? 1 : 0) + mine.length,
    reserves: WEEK.reserves + (outcome === 'reserve' && happened(outcomeAt) ? 1 : 0),
    bySource: { ...WEEK_BY_SOURCE, web: WEEK_BY_SOURCE.web + (asked ? 1 : 0) },
  };

  return {
    t,
    clock,
    botOff,
    chat,
    pay,
    budget,
    slot,
    listing,
    inquiryAt,
    answeredAt,
    payAt,
    qualifiedAt,
    bookedAt,
    timelapseAt,
    followStart,
    follow,
    outcome,
    outcomeAt,
    opensAt,
    humanAt,
    lostAt,
    stage,
    score,
    cards,
    visits,
    events,
    kpis,
  };
}

/** Is a 60-minute visit at (day, start) free (no visit, not one of the chat's held slots)? */
export function isVisitFree(visits: VisitView[], day: number, start: number): boolean {
  if (start + VISIT_MIN > 1200) return false;
  for (const s of Object.values(CHAT_SLOTS)) if (s.day === day && start < s.start + VISIT_MIN && s.start < start + VISIT_MIN) return false;
  return !visits.some((v) => v.day === day && start < v.end && v.start < start + VISIT_MIN);
}
