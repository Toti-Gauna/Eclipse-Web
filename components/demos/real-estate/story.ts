/**
 * Lumen Propiedades — the story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did; every
 * screen DERIVES the night from (story time t, that state) with `deriveEstate`, which is pure:
 * pausing, reduced motion (the store jumps to the end of a beat) and two screens in sync come free.
 *
 * Nothing plays on its own (v3). The visitor plays five beats from the SimBar:
 * 1 inquiry — Thursday 23:40, Carolina asks on the site about a 3-room apartment; Lumi answers
 *   in 4 s and asks how she'd pay · 2 qualify — she answers (credit, USD 150–200k): her card
 *   moves New → Qualified · 3 visit — Lumi offers two slots and books Friday 18:30: the visit
 *   lands in the calendar, the card moves to Visit · 4 followup — the night skips to after the
 *   visit; a WhatsApp follow-up asks how it went · 5 reply — she reserves (card → Reserve).
 * With the assistant off the same five beats show the night without an answer (lost lead).
 * At rest the visitor can answer for Carolina, chat with Lumi themselves on the site (a lead of
 * their own), book visits (site or calendar, any day) and move pipeline cards.
 */
import { createDemoStore, runChat, weekdayOf, type ChatPick, type ChatRun, type ChatScript, type DemoStore } from '../kit';
import {
  ALTERNATIVE,
  ASKED,
  BASE_LEADS,
  BASE_VISITS,
  BEATS,
  CAL_DAYS,
  CAL_START,
  CHAT_SLOTS,
  CLOCK_START,
  HUMAN_REPLY_MIN,
  LISTINGS,
  OFFICE_OPENS,
  SITE_TIMES,
  STORY,
  VISITORS,
  VISIT_MIN,
  WEEK,
  WEEK_BY_SOURCE,
  dayEndFor,
  isOpenDay,
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
  advisor: AdvisorId;
  /** Story time it was made. */
  at: number;
  via: 'site' | 'calendar' | 'chat';
}

export interface EstateState {
  /** The 24/7 assistant is switched off (the story replays the night without it). */
  botOff: boolean;
  /** Carolina's answers the visitor gave for her (chat time). */
  picks: Record<string, ChatPick>;
  /** Carolina's answer to the WhatsApp follow-up, given by the visitor (thread time). */
  followPicks: Record<string, ChatPick>;
  /** Visits the visitor booked themselves (site, calendar or their own chat). */
  mine: MineVisit[];
  /** The visitor's own conversation with Lumi on the site (runs instantly; null: not started). */
  own: { at: number; picks: Record<string, ChatPick> } | null;
  /** Pipeline cards the visitor moved (column + story time). */
  moved: Record<string, { column: Stage; at: number }>;
}

const fresh = (botOff = false): EstateState => ({ botOff, picks: {}, followPicks: {}, mine: [], own: null, moved: {} });

export type EstateStore = DemoStore<EstateState>;

/** Module-level (stable) factory for usePairedStore. Beats: no autoplay; "Reiniciar" keeps the assistant switch. */
export function createEstateStore(paired: boolean): EstateStore {
  return createDemoStore<EstateState>(fresh(), { beats: BEATS, paired, reset: (s) => fresh(s.botOff) });
}

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  /** The visitor answers for Carolina (chat time). */
  pick: (step: string, reply: string) => (s: EstateState, t: number): EstateState => ({
    ...s,
    picks: { ...s.picks, [step]: { reply, at: Math.max(0, t - STORY.chatStart) } },
  }),
  pickFollow: (start: number, step: string, reply: string) => (s: EstateState, t: number): EstateState => ({
    ...s,
    followPicks: { ...s.followPicks, [step]: { reply, at: Math.max(0, t - start) } },
  }),
  /** Flip the assistant (the caller resets the story so the night replays with the new setting). */
  toggleBot: () => (s: EstateState): EstateState => ({ ...s, botOff: !s.botOff }),
  book: (v: Omit<MineVisit, 'at'>) => (s: EstateState, t: number): EstateState =>
    s.mine.some((m) => m.day === v.day && m.start === v.start) ? s : { ...s, mine: [...s.mine, { ...v, at: t }] },
  /** The visitor answers Lumi in their own site chat (it answers at once). */
  ownPick: (step: string, reply: string) => (s: EstateState, t: number): EstateState => ({
    ...s,
    own: { at: s.own?.at ?? t, picks: { ...(s.own?.picks ?? {}), [step]: { reply, at: 0 } } },
  }),
  moveCard: (id: string, column: Stage) => (s: EstateState, t: number): EstateState => ({ ...s, moved: { ...s.moved, [id]: { column, at: t } } }),
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

/**
 * The 23:40 inquiry, answered by the assistant. Carolina's answers are scripted (`auto`) at fixed
 * story times inside beats 2 and 3 — each question is asked in one beat and answered in the next,
 * so at rest the visitor can answer for her instead.
 */
export const INQUIRY: Flow = {
  start: 'ask',
  steps: {
    ask: { from: 'user', typingMs: 0, pauseMs: 0, next: 'hi' },
    hi: { from: 'bot', typingMs: 1200, pauseMs: 300, next: 'pay' },
    pay: { from: 'bot', typingMs: 800, pauseMs: 300, replies: [{ id: 'cash' }, { id: 'credit' }, { id: 'sell' }], auto: 'credit', autoMs: 2800, next: 'budget' },
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
    slots: { from: 'bot', typingMs: 900, pauseMs: 300, replies: [{ id: 'fri' }, { id: 'sat' }], auto: 'fri', autoMs: 2400, next: 'booked' },
    booked: { from: 'bot', typingMs: 1000, pauseMs: 300, next: 'crm' },
    crm: { from: 'note', typingMs: 450 },
  },
};

/** The same inquiry with the assistant off: nobody answers until the office opens (one step per beat). */
export const UNANSWERED: Flow = {
  start: 'ask',
  steps: {
    ask: { from: 'user', typingMs: 0, pauseMs: 0, next: 'wait' },
    wait: { from: 'note', typingMs: 500, pauseMs: 300, next: 'opens' },
    opens: { from: 'note', typingMs: 7000, pauseMs: 3900, next: 'human' },
    human: { from: 'bot', typingMs: 100, pauseMs: 300, next: 'lost' },
    lost: { from: 'user', typingMs: 7200, pauseMs: 300, next: 'lostNote' },
    lostNote: { from: 'note', typingMs: 5200 },
  },
};

/** The WhatsApp follow-up after the visit: asked in beat 4, answered (scripted) in beat 5. */
export const FOLLOW: Flow = {
  start: 'how',
  steps: {
    how: {
      from: 'bot',
      typingMs: 600,
      pauseMs: 300,
      replies: [{ id: 'reserve', goto: 'reserved' }, { id: 'similar', goto: 'similarList' }, { id: 'think', goto: 'later' }],
      auto: 'reserve',
      autoMs: 4400,
    },
    reserved: { from: 'bot', typingMs: 1100, pauseMs: 300, next: 'reservedNote' },
    reservedNote: { from: 'note', typingMs: 450 },
    similarList: { from: 'bot', typingMs: 1100, pauseMs: 300, next: 'similarNote' },
    similarNote: { from: 'note', typingMs: 450 },
    later: { from: 'bot', typingMs: 1100, pauseMs: 300, next: 'laterNote' },
    laterNote: { from: 'note', typingMs: 450 },
  },
};

/** What the visitor looks for in their own chat with Lumi. */
export type OwnNeed = 'two' | 'three' | 'house';
/** The visitor's own conversation with Lumi on the site (no automatic replies; it answers at once). */
export const OWN: Flow = {
  start: 'hi',
  steps: {
    hi: { from: 'bot', replies: [{ id: 'two' }, { id: 'three' }, { id: 'house' }], next: 'pay' },
    pay: { from: 'bot', replies: [{ id: 'cash' }, { id: 'credit' }, { id: 'sell' }], next: 'budget' },
    budget: { from: 'bot', replies: [{ id: 'low' }, { id: 'mid' }, { id: 'high' }], next: 'match' },
    // Replies: two free visit slots (`s<day>-<start>`) + "later"; built per render (see ownScript).
    match: { from: 'bot', next: 'booked' },
    booked: { from: 'bot', next: 'note' },
    note: { from: 'note' },
    later: { from: 'bot', next: 'laterNote' },
    laterNote: { from: 'note' },
  },
};
export const slotReply = (s: { day: number; start: number }) => `s${s.day}-${s.start}`;
export const parseSlotReply = (id: string): { day: number; start: number } | null => {
  const m = /^s(-?\d+)-(\d+)$/.exec(id);
  return m ? { day: Number(m[1]), start: Number(m[2]) } : null;
};

/** The listing Lumi suggests for the visitor's answers. */
export function ownMatch(need: OwnNeed | undefined, budget: BudgetId | undefined): ListingId {
  if (need === 'two') return 'loft';
  if (need === 'house') return 'colinas';
  if (budget === 'low') return 'ceibo';
  if (budget === 'high') return 'ribera';
  return 'olmos';
}

/** A runnable script from a flow (texts empty: the views localize the run). */
export function toScript(flow: Flow, auto = true): ChatScript {
  const steps: ChatScript['steps'] = {};
  for (const [id, s] of Object.entries(flow.steps)) {
    steps[id] = { ...s, auto: auto ? s.auto : undefined, replies: s.replies?.map((r) => ({ id: r.id, label: '', goto: r.goto })) };
  }
  return { start: flow.start, steps };
}
const SCRIPTS = { inquiry: toScript(INQUIRY), unanswered: toScript(UNANSWERED), follow: toScript(FOLLOW) };

/** Carolina's scripted answers (chat time), as the beats play them. */
const NOMINAL = runChat(SCRIPTS.inquiry, 1e9, {});
const SCRIPTED: Record<string, ChatPick> = Object.fromEntries(
  Object.entries(NOMINAL.chosen).map(([step, reply]) => [step, { reply, at: NOMINAL.items.find((i) => i.id === `${step}:reply`)!.at }]),
);

/**
 * Carolina's conversation at chat time `elapsed`. Untouched, it plays the script (automatic
 * replies inside the beats). Once the visitor answers for her, her other answers keep their
 * scripted times and every answer is followed at once (the clock is stopped at rest).
 */
export function inquiryRun(botOff: boolean, elapsed: number, picks: Record<string, ChatPick>): ChatRun {
  if (botOff) return runChat(SCRIPTS.unanswered, elapsed, {});
  if (!Object.keys(picks).length) return runChat(SCRIPTS.inquiry, elapsed, {});
  // Scripted answers only count once their time has come (runChat applies a pick as soon as its step shows).
  const due = Object.fromEntries(Object.entries(SCRIPTED).filter(([, p]) => p.at <= elapsed));
  return runChat(SCRIPTS.inquiry, elapsed, { ...due, ...picks }, { instantAfterPick: true });
}

/** The visitor's own chat with Lumi (instant). `slots`: the two visit slots it offers. */
export function ownRun(own: EstateState['own'], slots: { day: number; start: number }[]): ChatRun {
  const script = toScript(OWN, false);
  script.steps.match = { ...script.steps.match, replies: [...slots.map((s) => ({ id: slotReply(s), label: '', goto: 'booked' })), { id: 'later', label: '', goto: 'later' }] };
  return runChat(script, 0, own?.picks ?? {}, { instant: true });
}

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
  note: 'base' | 'waiting' | 'lost' | 'answered' | 'qualified' | 'booked' | 'visited' | 'reserved' | 'similar' | 'think' | 'you' | 'youNew' | 'youQualified' | 'moved';
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
  | 'you'
  | 'youLead';

export interface EstateEvent {
  id: string;
  /** Story time (negative: before the story). */
  at: number;
  kind: EventKind;
  clock: Clock;
  listing?: ListingId;
  visit?: { day: number; start: number };
  /** The visitor did it (no story toast: their own reaction shows at once). */
  mine?: boolean;
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
  /** Visits of the hand-written days (CAL_DAYS) + Carolina's + the visitor's (any day). */
  visits: VisitView[];
  events: EstateEvent[];
  kpis: Kpis;
  /** The visitor's own lead (their site chat). */
  own: { need: OwnNeed | null; pay: PayId | null; budget: BudgetId | null; match: ListingId; at: number } | null;
}

const DAY = 1440;
const toClock = (m: number): Clock => ({ day: CLOCK_START.day + Math.floor(m / DAY), min: ((m % DAY) + DAY) % DAY });
/** Minutes since Thursday 0:00 of a clock. */
export const clockMinutes = (c: Clock) => (c.day - CLOCK_START.day) * DAY + c.min;

/**
 * The story clock. Before the jump: Thursday 23:40 (+1 min every 6 s). With the assistant
 * off, the night fast-forwards to 9:00 (beat 2) and the first human answer is at 9:12 (beat 3).
 * After the visit: 5 minutes after it ended.
 */
export function clockAt(t: number, botOff: boolean, timelapse: { at: number; day: number; end: number } | null): Clock {
  const start = CLOCK_START.min;
  const slow = (from: number, since: number) => from + Math.min(4, Math.floor(Math.max(0, since) / 6000));
  if (timelapse && t >= timelapse.at) return { day: timelapse.day, min: slow(timelapse.end + 5, t - timelapse.at) };
  const { from, to, human: humanAt } = STORY.off;
  if (!botOff || t < from) return toClock(slow(start, t));
  const opens = (OFFICE_OPENS.day - CLOCK_START.day) * DAY + OFFICE_OPENS.min;
  const human = (OFFICE_OPENS.day - CLOCK_START.day) * DAY + HUMAN_REPLY_MIN;
  if (t < to) return toClock(Math.round(start + 1 + ((t - from) / (to - from)) * (opens - start - 1)));
  if (t < humanAt) return toClock(Math.round(opens + ((t - to) / (humanAt - to)) * (human - opens)));
  return toClock(slow(human, t - humanAt));
}

/** Minutes the first answer took with the assistant off (Thu 23:40 → Fri 9:12). */
export const LATE_MINUTES = (OFFICE_OPENS.day - CLOCK_START.day) * DAY + HUMAN_REPLY_MIN - CLOCK_START.min;

const isDone = (v: { day: number; end: number }, c: Clock) => c.day > v.day || (c.day === v.day && c.min >= v.end);

/** The whole night at story time `t`. */
export function deriveEstate(state: EstateState, t: number): EstateView {
  const S = STORY;
  const botOff = state.botOff;
  const chat = inquiryRun(botOff, t - S.chatStart, state.picks);
  const at = (step: string) => (chat.at[step] !== undefined ? S.chatStart + chat.at[step] : null);
  const replyAt = (step: string) => {
    const item = chat.items.find((i) => i.id === `${step}:reply`);
    return item ? S.chatStart + item.at : null;
  };
  const byVisitor = (step: string) => !!state.picks[step];

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
  const followManual = Object.keys(state.followPicks).length > 0;
  const follow = followStart !== null && t >= followStart ? runChat(SCRIPTS.follow, t - followStart, state.followPicks, { instantAfterPick: followManual }) : null;
  const outcome = (follow?.chosen.how as Outcome | undefined) ?? null;
  const outcomeStep = outcome === 'reserve' ? 'reserved' : outcome === 'similar' ? 'similarList' : outcome === 'think' ? 'later' : null;
  const outcomeAt = follow && followStart !== null && outcomeStep && follow.at[outcomeStep] !== undefined ? followStart + follow.at[outcomeStep] : null;

  const opensAt = botOff ? at('opens') : null;
  const humanAt = botOff ? at('human') : null;
  const lostAt = botOff ? at('lostNote') : null;

  const tl = timelapseAt !== null && visitSlot ? { at: timelapseAt, day: visitSlot.day, end: visitSlot.start + VISIT_MIN } : null;
  const clock = clockAt(t, botOff, tl);
  const happened = (x: number | null) => x !== null && x <= t;

  /* Carolina's card */
  let stage: Stage | null = null;
  let note: LeadCard['note'] = 'base';
  let changedAt: number = inquiryAt;
  let score = 35;
  if (t >= inquiryAt) {
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
    if (tl && t >= tl.at) note = 'visited';
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
  const mine = state.mine.filter((m) => m.at <= t);
  for (const m of mine) {
    visits.push({ id: `v-you-${m.day}-${m.start}`, day: m.day, start: m.start, end: m.start + VISIT_MIN, what: 'visit', who: 'you', listing: m.listing, advisor: m.advisor, state: 'mine', changedAt: m.at });
  }

  /* The visitor's own lead (their chat with Lumi) */
  const ownPicks = state.own?.picks ?? {};
  const own = state.own
    ? {
        need: (ownPicks.hi?.reply as OwnNeed | undefined) ?? null,
        pay: (ownPicks.pay?.reply as PayId | undefined) ?? null,
        budget: (ownPicks.budget?.reply as BudgetId | undefined) ?? null,
        match: ownMatch(ownPicks.hi?.reply as OwnNeed | undefined, ownPicks.budget?.reply as BudgetId | undefined),
        at: state.own.at,
      }
    : null;

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
  if (own || mine.length) {
    const last = mine[mine.length - 1];
    cards.push({
      id: 'you',
      person: 'you',
      column: last ? 'visit' : own?.budget ? 'qualified' : 'new',
      listing: last?.listing ?? own?.match ?? ASKED,
      source: 'site',
      score: last ? 84 : own?.budget ? 72 : 40,
      note: last ? 'you' : own?.budget ? 'youQualified' : 'youNew',
      visit: last ? { day: last.day, start: last.start } : undefined,
      changedAt: last?.at ?? own?.at ?? t,
    });
  }

  /* Events (feed, toasts, announcements) */
  const events: EstateEvent[] = [
    { id: 'p1', at: -3, kind: 'pastFollow', clock: { day: 3, min: 21 * 60 + 2 } },
    { id: 'p2', at: -2, kind: 'pastPortal', clock: { day: 3, min: 21 * 60 + 5 }, listing: 'ribera' },
    { id: 'p3', at: -1, kind: 'pastWhatsApp', clock: { day: 3, min: 22 * 60 + 15 }, listing: 'loft' },
  ];
  const push = (id: string, when: number | null, kind: EventKind, extra: Partial<EstateEvent> = {}) => {
    if (when === null || when > t) return;
    events.push({ id, at: when, kind, clock: clockAt(when, botOff, tl), ...extra });
  };
  push('inquiry', inquiryAt, 'inquiry', { listing: ASKED });
  if (botOff) {
    push('waiting', at('wait'), 'waiting');
    push('opens', opensAt, 'opens');
    push('human', humanAt, 'human');
    push('lost', lostAt, 'lost');
  } else {
    push('answered', answeredAt, 'answered');
    push('qualified', qualifiedAt, 'qualified', { listing, mine: byVisitor('budget') });
    push('booked', bookedAt, 'booked', { listing, visit: visitSlot ?? undefined, mine: byVisitor('slots') });
    push('visited', tl?.at ?? null, 'visited', { listing, visit: visitSlot ?? undefined });
    push('followSent', follow && followStart !== null && follow.at.how !== undefined ? followStart + follow.at.how : null, 'followSent', { listing });
    if (outcome) push(outcome, outcomeAt, outcome === 'reserve' ? 'reserved' : outcome, { listing, mine: followManual });
  }
  if (own) push('youLead', own.at, 'youLead', { listing: own.match, mine: true });
  for (const m of mine) push(`you-${m.day}-${m.start}`, m.at, 'you', { listing: m.listing, visit: { day: m.day, start: m.start }, mine: true });
  events.sort((a, b) => a.at - b.at);

  /* Numbers */
  const asked = t >= inquiryAt;
  const answered = happened(answeredAt);
  const late = botOff && happened(at('wait'));
  const baseCount = Object.values(WEEK_BY_SOURCE).reduce((a, b) => a + b, 0);
  const ownCount = own ? 1 : 0;
  const inquiries = baseCount + (asked ? 1 : 0) + ownCount;
  const fast = baseCount + (answered ? 1 : 0) + ownCount;
  const counted = baseCount + (answered || late ? 1 : 0) + ownCount;
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
    bySource: { ...WEEK_BY_SOURCE, web: WEEK_BY_SOURCE.web + (asked ? 1 : 0) + ownCount },
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
    // The visitor's moves win until the story changes that card again.
    cards: cards.map((c) => {
      const m = state.moved[c.id];
      return m && m.at >= c.changedAt ? { ...c, column: m.column, note: c.note === 'base' ? 'moved' : c.note, changedAt: m.at } : c;
    }),
    visits,
    events,
    kpis,
    own,
  };
}

/* ------------------------------------------------------------------ */
/* Visits on any day (calendar navigation)                              */
/* ------------------------------------------------------------------ */
/** A stable pseudo-random number in [0, 1) for a seed. */
function hash(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** A plausible, deterministic schedule for a day without hand-written visits (no overlaps). */
export function generatedVisits(day: number): Omit<VisitView, 'state' | 'changedAt'>[] {
  const wd = weekdayOf(day);
  if (!isOpenDay(wd) || (CAL_DAYS as readonly number[]).includes(day)) return [];
  const end = dayEndFor(wd);
  const out: Omit<VisitView, 'state' | 'changedAt'>[] = [];
  for (let m = CAL_START, i = 0; m + VISIT_MIN <= end; i++) {
    const seed = day * 7919 + i * 131;
    if (hash(seed) < 0.36) {
      const start = m + (hash(seed + 5) < 0.3 ? 30 : 0);
      if (start + VISIT_MIN > end) break;
      const what: VisitWhat = hash(seed + 9) < 0.14 ? 'appraisal' : 'visit';
      out.push({
        id: `g-${day}-${start}`,
        day,
        start,
        end: start + VISIT_MIN,
        what,
        who: what === 'visit' ? VISITORS[Math.floor(hash(seed + 3) * VISITORS.length)] : undefined,
        listing: LISTINGS[Math.floor(hash(seed + 7) * LISTINGS.length)].id,
        advisor: hash(seed + 11) < 0.5 ? 'julia' : 'marcos',
      });
      m = start + VISIT_MIN + 30;
    } else m += 60;
  }
  return out;
}

/** Every visit of a day: hand-written or generated, plus Carolina's and the visitor's. */
export function dayVisits(day: number, view: EstateView): VisitView[] {
  const extra = view.visits.filter((v) => v.day === day);
  const gen: VisitView[] = generatedVisits(day).map((v) => ({ ...v, state: isDone(v, view.clock) ? 'done' : 'default', changedAt: -Infinity }));
  return [...gen, ...extra].sort((a, b) => a.start - b.start);
}

/** Is a 60-minute visit at (day, start) free (no visit, not one of the chat's held slots, still ahead)? */
export function isVisitFree(view: EstateView, day: number, start: number): boolean {
  const wd = weekdayOf(day);
  if (!isOpenDay(wd) || start < CAL_START || start + VISIT_MIN > dayEndFor(wd)) return false;
  if (day < view.clock.day || (day === view.clock.day && start <= view.clock.min)) return false;
  if (!view.botOff) for (const s of Object.values(CHAT_SLOTS)) if (s.day === day && start < s.start + VISIT_MIN && s.start < start + VISIT_MIN) return false;
  return !dayVisits(day, view).some((v) => start < v.end && v.start < start + VISIT_MIN);
}

/** The first free slots the site (and Lumi) offer: the site's times on Fri, Sat and Mon. */
export function freeSiteSlots(view: EstateView, limit = 2): { day: number; start: number }[] {
  const out: { day: number; start: number }[] = [];
  for (const day of CAL_DAYS) for (const start of SITE_TIMES[day]) if (out.length < limit && isVisitFree(view, day, start)) out.push({ day, start });
  return out;
}
