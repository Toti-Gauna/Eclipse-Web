/**
 * Órbita Fitness — the live story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did;
 * every screen derives the week from (story time t, that state) with `deriveGym`, which
 * is pure: pausing, looping, reduced motion (t = end) and two screens in sync for free.
 *
 * The ~28 s loop is a time-lapse of one week:
 *  Mon 9:00 · Lucía hasn't come in 9 days → flagged at risk → the win-back automation
 *  sends her a WhatsApp with a personal mission (2 classes = +300 XP) → she books Tue 7:00.
 *  Meanwhile Tomás asks the site's chatbot for a free trial and books Thu 19:00.
 *  Tue 7:00 · she checks in (back after 10 days) → the app books her Thu 19:00 class.
 *  Thu 19:00 · second check-in → mission complete → LEVEL UP → she climbs to #3 of her league.
 * Visitor: answer her WhatsApp, book classes, check in, send a guest pass (mission), answer the
 * site chat, send queued win-backs, or switch the automation off and watch her cancel.
 */
import { createDemoStore, runChat, type ChatPick, type ChatRun, type ChatScript, type DemoStore } from '../kit';
import {
  ACTIVE,
  AT,
  AT_RISK,
  CHAIN,
  CHECKINS,
  CHURN_OCT,
  CLOCK,
  HERO_LEVEL,
  HERO_XP,
  LEADS_WEEK,
  LEAGUE,
  LEAGUE_XP,
  LOOP_MS,
  MISSIONS,
  SECOND_CLASS,
  SESSIONS,
  STREAK_GRACE,
  TRIAL_OPTIONS,
  WA_OPTIONS,
  WINBACK_BACK,
  WINBACK_SENT,
  XP,
  levelNeed,
  memberById,
  sessionById,
  type MemberId,
  type MissionId,
  type StoryDay,
} from './model';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export interface Range {
  from: number;
  to: number | null;
}

export interface GymState {
  /** Lucía's WhatsApp (chat time since it was sent). */
  wa: Record<string, ChatPick>;
  /** The site's chatbot (chat time since the lead opened it). */
  lead: Record<string, ChatPick>;
  /** When the win-back automation was off (story time). */
  off: Range[];
  /** Classes the visitor booked in Lucía's app. */
  mine: { session: string; at: number }[];
  /** Check-in taps (story time). */
  checkins: number[];
  /** The visitor sent Lucía's guest pass (mission "bring a friend"). */
  friendAt: number | null;
  /** Queued win-backs the owner sent by hand. */
  sentNow: Partial<Record<MemberId, number>>;
}

const fresh = (): GymState => ({ wa: {}, lead: {}, off: [], mine: [], checkins: [], friendAt: null, sentNow: {} });
/** A switch left off stays off in the next loop. */
const carry = (ranges: Range[]): Range[] => (ranges.some((r) => r.to === null) ? [{ from: -1, to: null }] : []);

export type GymStore = DemoStore<GymState>;

/** Module-level (stable) factory for usePairedStore. */
export function createGymStore(paired: boolean): GymStore {
  return createDemoStore<GymState>(fresh(), {
    loopMs: LOOP_MS,
    paired,
    onLoop: (s) => ({ ...fresh(), off: carry(s.off) }),
  });
}

export const isOn = (ranges: Range[], at: number) => !ranges.some((r) => at >= r.from && (r.to === null || at < r.to));
export const isOffNow = (ranges: Range[]) => ranges.some((r) => r.to === null);

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  pickWa: (step: string, reply: string, sentAt: number) => (s: GymState, t: number): GymState => ({
    ...s,
    wa: { ...s.wa, [step]: { reply, at: t - sentAt } },
  }),
  pickLead: (step: string, reply: string) => (s: GymState, t: number): GymState => ({
    ...s,
    lead: { ...s.lead, [step]: { reply, at: t - AT.lead } },
  }),
  toggleWin: () => (s: GymState, t: number): GymState => {
    const next = isOffNow(s.off) ? s.off.map((r) => (r.to === null ? { ...r, to: t } : r)) : [...s.off, { from: t, to: null }];
    return { ...s, off: next };
  },
  book: (session: string) => (s: GymState, t: number): GymState =>
    s.mine.some((m) => m.session === session) ? s : { ...s, mine: [...s.mine, { session, at: t }] },
  checkin: () => (s: GymState, t: number): GymState => ({ ...s, checkins: [...s.checkins, t] }),
  friend: () => (s: GymState, t: number): GymState => (s.friendAt === null ? { ...s, friendAt: t } : s),
  sendNow: (id: MemberId) => (s: GymState, t: number): GymState => (s.sentNow[id] !== undefined ? s : { ...s, sentNow: { ...s.sentNow, [id]: t } }),
};

/* ------------------------------------------------------------------ */
/* Script shapes (timing here; texts per locale in scripts.tsx)         */
/* ------------------------------------------------------------------ */
type FlowStep = { from: 'bot' | 'user' | 'note'; typingMs?: number; pauseMs?: number; next?: string; replies?: readonly string[]; auto?: string; autoMs?: number };
type Flow = { start: string; steps: Record<string, FlowStep>; goto: Record<string, string> };

/** Lucía's win-back WhatsApp. */
export const WA_FLOW: Flow = {
  start: 'hello',
  steps: {
    hello: { from: 'bot', typingMs: 500, pauseMs: 300, next: 'mission' },
    mission: { from: 'bot', typingMs: 800, pauseMs: 300, replies: ['book', 'later'], auto: 'book', autoMs: 1500 },
    slots: { from: 'bot', typingMs: 700, pauseMs: 300, replies: ['opt0', 'opt1'], auto: 'opt0', autoMs: 1400 },
    booked: { from: 'bot', typingMs: 600, pauseMs: 300, next: 'noteBooked' },
    noteBooked: { from: 'note', typingMs: 400 },
    later: { from: 'bot', typingMs: 800, pauseMs: 300, next: 'notePaused' },
    notePaused: { from: 'note', typingMs: 400 },
  },
  goto: { book: 'slots', later: 'later', opt0: 'booked', opt1: 'booked' },
};

/** The site's chatbot (a lead asks for a free trial). */
export const LEAD_FLOW: Flow = {
  start: 'hi',
  steps: {
    hi: { from: 'bot', typingMs: 700, pauseMs: 300, replies: ['try', 'classes'], auto: 'try', autoMs: 1500 },
    classes: { from: 'bot', typingMs: 900, pauseMs: 300, next: 'goal' },
    goal: { from: 'bot', typingMs: 800, pauseMs: 300, replies: ['strength', 'cardio', 'unsure'], auto: 'unsure', autoMs: 1500 },
    pick: { from: 'bot', typingMs: 1000, pauseMs: 300, replies: ['opt0', 'opt1'], auto: 'opt0', autoMs: 1400 },
    name: { from: 'bot', typingMs: 700, pauseMs: 300, next: 'nameReply' },
    nameReply: { from: 'user', typingMs: 900, pauseMs: 300, next: 'done' },
    done: { from: 'bot', typingMs: 800, pauseMs: 300, next: 'noteLead' },
    noteLead: { from: 'note', typingMs: 450 },
  },
  goto: { try: 'goal', classes: 'classes', strength: 'pick', cardio: 'pick', unsure: 'pick', opt0: 'name', opt1: 'name' },
};

/** A chat script from a flow + per-locale content. */
export function buildScript(
  flow: Flow,
  content: (step: string) => Partial<ChatScript['steps'][string]>,
  replyLabel: (step: string, id: string) => string,
): ChatScript {
  const steps: ChatScript['steps'] = {};
  for (const [id, s] of Object.entries(flow.steps)) {
    steps[id] = {
      from: s.from,
      typingMs: s.typingMs,
      pauseMs: s.pauseMs,
      next: s.next,
      auto: s.auto,
      autoMs: s.autoMs,
      replies: s.replies?.map((r) => ({ id: r, label: replyLabel(id, r), goto: flow.goto[r] })),
      ...content(id),
    };
  }
  return { start: flow.start, steps };
}
/** Same flow without texts: enough to know when things happen. */
const WA_TIMING = buildScript(WA_FLOW, () => ({}), () => '');
const LEAD_TIMING = buildScript(LEAD_FLOW, () => ({}), () => '');

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
export type Via = 'wa' | 'app' | 'auto' | 'chat';
export interface Booking {
  session: string;
  at: number;
  via: Via;
}
export type GainId = 'check1' | 'check2' | MissionId;
export interface Gain {
  id: GainId;
  xp: number;
  at: number;
}

export type HeroStatus = 'away' | 'risk' | 'contacted' | 'booked' | 'back' | 'done' | 'paused' | 'churned';

export type EventKind =
  | 'flag'
  | 'sent'
  | 'off'
  | 'on'
  | 'booked'
  | 'declined'
  | 'trial'
  | 'back'
  | 'book2'
  | 'checkin2'
  | 'mission'
  | 'levelup'
  | 'league'
  | 'trialIn'
  | 'churn'
  | 'manual'
  | 'friend'
  | 'aCheckin'
  | 'aMission'
  | 'aBadge';

export interface GymEvent {
  id: string;
  at: number;
  kind: EventKind;
  member?: MemberId;
  session?: string;
  /** back: days away · levelup: level · league: rank. */
  n?: number;
  via?: Via;
}

export type MemberTab = 'home' | 'classes' | 'league';
export type PhoneOverlay = 'wa' | 'levelup';
export interface Scene {
  tab: MemberTab;
  overlay: PhoneOverlay | null;
  /** Day the classes tab should show. */
  day: number;
  /** A push banner on top (WhatsApp arriving / membership cancelled). */
  push: 'wa' | 'churn' | null;
}

export interface LeagueRow {
  id: MemberId;
  points: number;
}

export interface MissionView {
  id: MissionId;
  goal: number;
  xp: number;
  progress: number;
  doneAt: number | null;
  /** The comeback mission only exists once Lucía accepted it. */
  shown: boolean;
}

export interface GymView {
  t: number;
  day: StoryDay;
  /** Minutes from midnight on `day`. */
  clock: number;
  /** A day just started (time-lapse cut). */
  dayCut: StoryDay | null;
  sentAt: number | null;
  /** Off when the send time came (it's sent when switched back on). */
  winOffAtSend: boolean;
  tueAt: number;
  thuAt: number;
  wa: ChatRun;
  waChoice: 'book' | 'later' | null;
  waCloseAt: number | null;
  lead: ChatRun;
  leadGoal: 'strength' | 'cardio' | 'unsure' | null;
  trial: Booking | null;
  trialInAt: number | null;
  book1: Booking | null;
  book2: Booking | null;
  check1At: number | null;
  check2At: number | null;
  missionAt: number | null;
  declinedAt: number | null;
  churnAt: number | null;
  status: HeroStatus;
  /** Days since Lucía last trained (at story time). */
  away: number;
  gains: Gain[];
  level: number;
  inLevel: number;
  need: number;
  levelUpAt: number | null;
  streak: number;
  /** Mon … Sun: trained that day. */
  week: boolean[];
  missions: MissionView[];
  league: LeagueRow[];
  heroRank: number;
  /** Lucía's rank before her last climb (for "+5"). */
  heroRankFrom: number;
  leagueAt: number | null;
  /** Bookings per session (base + story + visitor). */
  booked: Record<string, number>;
  /** Sessions Lucía is booked into (any channel). */
  heroSessions: string[];
  events: GymEvent[];
  kpi: { active: number; atRisk: number; sent: number; back: number; checkins: number; leads: number; churnOct: number };
  /** The phone's check-in button: which class it checks into right now. */
  checkinFor: 'check1' | 'check2' | null;
  scene: Scene;
}

const first = (...xs: (number | null | undefined)[]) => {
  const v = xs.filter((x): x is number => typeof x === 'number');
  return v.length ? Math.min(...v) : null;
};

/** When the automation sends Lucía's WhatsApp: on time, or right after it's switched back on. */
function sendTime(off: Range[]): { at: number | null; offAtSend: boolean } {
  if (isOn(off, AT.win)) return { at: AT.win, offAtSend: false };
  let x = AT.win;
  for (let guard = 0; guard < 20; guard++) {
    const r = off.find((rr) => x >= rr.from && (rr.to === null || x < rr.to));
    if (!r) break;
    if (r.to === null) return { at: null, offAtSend: true };
    x = r.to;
  }
  const at = x + 600;
  return { at: at < AT.churn ? at : null, offAtSend: true };
}

/** Days in the current streak at `day` (rest days of up to STREAK_GRACE don't break it). */
function streakAt(days: number[], day: number): number {
  const d = [...new Set(days)].filter((x) => x <= day).sort((a, b) => a - b);
  if (!d.length || day - d[d.length - 1] > STREAK_GRACE) return 0;
  let startDay = d[d.length - 1];
  for (let i = d.length - 1; i > 0; i--) {
    if (d[i] - d[i - 1] - 1 > STREAK_GRACE) break;
    startDay = d[i - 1];
  }
  return day - startDay + 1;
}

/** Mission XP shows in the league once the celebration is over (the climb is its own moment). */
const LEAGUE_LAG = CHAIN.league - CHAIN.mission;

export function deriveGym(state: GymState, t: number, instant: boolean): GymView {
  /* ---- the win-back and the time-lapse ---- */
  const send = sendTime(state.off);
  const sentAt = send.at;
  const chain = sentAt ?? AT.win;
  const tueAt = chain + CHAIN.tue;
  const thuAt = chain + CHAIN.thu;
  const day: StoryDay = t < tueAt ? 0 : t < thuAt ? 1 : 3;

  const wa = sentAt !== null ? runChat(WA_TIMING, t - sentAt, state.wa, { instant }) : runChat(WA_TIMING, -1);
  const waChoice = (wa.chosen.mission as 'book' | 'later' | undefined) ?? null;
  const optIndex = wa.chosen.slots === 'opt1' ? 1 : 0;
  const waBookedAt = sentAt !== null && wa.at.booked !== undefined ? sentAt + wa.at.booked : null;
  const declinedAt = sentAt !== null && wa.at.later !== undefined ? sentAt + wa.at.later : null;
  const waEnd = wa.at.noteBooked ?? wa.at.notePaused;
  const waCloseAt = sentAt !== null && waEnd !== undefined ? sentAt + waEnd + 1000 : null;

  /* ---- the lead (site chatbot) ---- */
  const lead = runChat(LEAD_TIMING, t - AT.lead, state.lead, { instant });
  const leadGoal = (lead.chosen.goal as GymView['leadGoal']) ?? null;
  const trialAt = lead.at.done !== undefined ? AT.lead + lead.at.done : null;
  const trial: Booking | null = trialAt !== null ? { session: TRIAL_OPTIONS[lead.chosen.pick === 'opt1' ? 1 : 0], at: trialAt, via: 'chat' } : null;
  const trialInAt = trial && sessionById(trial.session)?.day === 3 && thuAt + 2_300 <= LOOP_MS ? thuAt + 2_300 : null;

  /* ---- Lucía's bookings and check-ins ---- */
  const mine = state.mine.filter((m) => m.at <= t);
  const waBooking: Booking | null = waBookedAt !== null ? { session: WA_OPTIONS[optIndex], at: waBookedAt, via: 'wa' } : null;
  const tueApp = mine.filter((m) => sessionById(m.session)?.day === 1).sort((a, b) => a.at - b.at)[0];
  const book1: Booking | null =
    waBooking && (!tueApp || waBooking.at <= tueApp.at) ? waBooking : tueApp ? { session: tueApp.session, at: tueApp.at, via: 'app' } : null;
  const s1 = book1 ? sessionById(book1.session) : undefined;

  const taps = state.checkins;
  const tapIn = (from: number, to: number, after: number) => taps.find((x) => x >= from && x < to && x >= after) ?? null;
  let check1At: number | null = null;
  if (book1 && s1) {
    const auto = Math.max(chain + CHAIN.check1, book1.at + 1200);
    check1At = first(auto < thuAt - 300 ? auto : null, tapIn(tueAt, thuAt, book1.at));
  }

  const thuApp = mine.filter((m) => sessionById(m.session)?.day === 3).sort((a, b) => a.at - b.at)[0];
  const autoBook2At = check1At !== null ? Math.max(chain + CHAIN.book2, check1At + 900) : null;
  const book2: Booking | null =
    thuApp && (autoBook2At === null || thuApp.at <= autoBook2At)
      ? { session: thuApp.session, at: thuApp.at, via: 'app' }
      : autoBook2At !== null
        ? { session: SECOND_CLASS, at: autoBook2At, via: 'auto' }
        : null;
  let check2At: number | null = null;
  if (book2) {
    const auto = Math.max(chain + CHAIN.check2, book2.at + 1200);
    check2At = first(auto < LOOP_MS ? auto : null, tapIn(thuAt, Infinity, Math.max(book2.at, thuAt)));
  }

  const trained: { day: number; at: number }[] = [];
  if (check1At !== null) trained.push({ day: 1, at: check1At });
  if (check2At !== null) trained.push({ day: 3, at: check2At });
  const trainedBy = (x: number) => trained.filter((tr) => tr.at <= x);

  /* ---- missions and XP ---- */
  const accepted = waChoice === 'book';
  const all: Gain[] = [];
  if (check1At !== null) all.push({ id: 'check1', xp: XP.checkin, at: check1At });
  if (check2At !== null) all.push({ id: 'check2', xp: XP.checkin, at: check2At });
  let missionAt: number | null = null;
  if (accepted && trained.length >= 2) {
    missionAt = trained[1].at + 600;
    all.push({ id: 'comeback', xp: XP.comeback, at: missionAt });
  }
  const streakDoneAt = trained.length >= 2 && streakAt(trained.map((x) => x.day), 3) >= 3 ? trained[1].at + 600 : null;
  if (streakDoneAt !== null) all.push({ id: 'streak3', xp: XP.streak3, at: streakDoneAt });
  const friendAt = state.friendAt !== null ? state.friendAt + 2500 : null;
  if (friendAt !== null) all.push({ id: 'friend', xp: XP.friend, at: friendAt });
  all.sort((a, b) => a.at - b.at);
  const gains = all.filter((g) => g.at <= t);

  let level = HERO_LEVEL;
  let inLevel = HERO_XP;
  let levelUpAt: number | null = null;
  for (const g of gains) {
    inLevel += g.xp;
    while (inLevel >= levelNeed(level)) {
      inLevel -= levelNeed(level);
      level += 1;
      levelUpAt ??= g.at;
    }
  }

  const streak = streakAt(trainedBy(t).map((x) => x.day), day);
  const week = Array.from({ length: 7 }, (_, i) => trainedBy(t).some((x) => x.day === i));
  const missions: MissionView[] = MISSIONS.map((m) => {
    if (m.id === 'comeback') {
      const done = missionAt !== null && missionAt <= t;
      return { ...m, progress: done ? 2 : Math.min(2, trainedBy(t).length), doneAt: done ? missionAt : null, shown: accepted && waBookedAt !== null && waBookedAt <= t };
    }
    if (m.id === 'streak3') {
      const done = streakDoneAt !== null && streakDoneAt <= t;
      return { ...m, progress: done ? 3 : Math.min(2, streak), doneAt: done ? streakDoneAt : null, shown: true };
    }
    if (m.id === 'friend') {
      const done = friendAt !== null && friendAt <= t;
      return { ...m, progress: done ? 1 : 0, doneAt: done ? friendAt : null, shown: true };
    }
    return { ...m, progress: 0, doneAt: null, shown: true };
  });

  /* ---- status, churn ---- */
  const contacted = sentAt !== null && sentAt <= t;
  const churnAt = !contacted && (sentAt === null || sentAt > AT.churn) && !book1 && check1At === null && t >= AT.churn ? AT.churn : null;
  let status: HeroStatus = t < AT.flag ? 'away' : 'risk';
  if (contacted) status = 'contacted';
  if (book1 && book1.at <= t) status = 'booked';
  if (declinedAt !== null && declinedAt <= t && !(book1 && book1.at <= t)) status = 'paused';
  if (check1At !== null && check1At <= t) status = 'back';
  if (missionAt !== null && missionAt <= t) status = 'done';
  if (churnAt !== null) status = 'churned';
  const lastTrained = trainedBy(t).at(-1)?.day;
  const away = lastTrained !== undefined ? day - lastTrained : 9 + day;

  /* ---- league ---- */
  const leagueGains = all.filter((g) => (g.id === 'check1' || g.id === 'check2' ? g.at : g.at + LEAGUE_LAG) <= t);
  const heroPoints = leagueGains.reduce((s, g) => s + g.xp, 0);
  const rows: LeagueRow[] = LEAGUE.map((id) => ({ id, points: id === 'lucia' ? heroPoints : (LEAGUE_XP[day][id] ?? 0) }));
  // Ties: whoever got there first stays ahead (Lucía last).
  rows.sort((a, b) => b.points - a.points || (a.id === 'lucia' ? 1 : b.id === 'lucia' ? -1 : 0));
  const heroRank = rows.findIndex((r) => r.id === 'lucia') + 1;
  const missionLeagueAt = all.filter((g) => g.id !== 'check1' && g.id !== 'check2').map((g) => g.at + LEAGUE_LAG).filter((x) => x <= t);
  const leagueAt = missionLeagueAt.length ? Math.max(...missionLeagueAt) : null;
  let heroRankFrom = heroRank;
  if (leagueAt !== null) {
    const before = rows.map((r) => (r.id === 'lucia' ? { ...r, points: all.filter((g) => (g.id === 'check1' || g.id === 'check2' ? g.at : g.at + LEAGUE_LAG) < leagueAt).reduce((s, g) => s + g.xp, 0) } : r));
    before.sort((a, b) => b.points - a.points || (a.id === 'lucia' ? 1 : b.id === 'lucia' ? -1 : 0));
    heroRankFrom = before.findIndex((r) => r.id === 'lucia') + 1;
  }

  /* ---- classes ---- */
  const heroBookings: Booking[] = [];
  const addHero = (b: Booking | null) => {
    if (b && b.at <= t && !heroBookings.some((x) => x.session === b.session)) heroBookings.push(b);
  };
  addHero(book1);
  addHero(book2);
  for (const m of mine) addHero({ session: m.session, at: m.at, via: 'app' });
  const booked: Record<string, number> = {};
  for (const s of SESSIONS) booked[s.id] = s.booked;
  for (const b of heroBookings) booked[b.session] = Math.min(sessionById(b.session)!.cap, booked[b.session] + 1);
  if (trial && trial.at <= t) booked[trial.session] = Math.min(sessionById(trial.session)!.cap, booked[trial.session] + 1);

  /* ---- events ---- */
  const events: GymEvent[] = [{ id: 'flag', at: AT.flag, kind: 'flag', member: 'lucia', n: 9 }];
  for (const a of AT.ambient) {
    const at = (a.day === 0 ? 0 : a.day === 1 ? tueAt : thuAt) + a.offset;
    events.push({ id: `amb-${a.member}`, at, kind: a.kind === 'checkin' ? 'aCheckin' : a.kind === 'mission' ? 'aMission' : 'aBadge', member: a.member, n: memberById(a.member).streak });
  }
  for (const r of state.off) {
    if (r.from >= 0) events.push({ id: `off-${r.from}`, at: r.from, kind: 'off' });
    if (r.to !== null && r.to >= 0) events.push({ id: `on-${r.to}`, at: r.to, kind: 'on' });
  }
  if (sentAt !== null) events.push({ id: 'sent', at: sentAt, kind: 'sent', member: 'lucia' });
  if (book1) events.push({ id: 'booked', at: book1.at, kind: 'booked', member: 'lucia', session: book1.session, via: book1.via });
  if (declinedAt !== null) events.push({ id: 'declined', at: declinedAt, kind: 'declined', member: 'lucia' });
  if (trial) events.push({ id: 'trial', at: trial.at, kind: 'trial', member: 'tomas', session: trial.session });
  if (check1At !== null) events.push({ id: 'back', at: check1At, kind: 'back', member: 'lucia', n: 10, session: book1?.session });
  if (book2) events.push({ id: 'book2', at: book2.at, kind: 'book2', member: 'lucia', session: book2.session, via: book2.via });
  if (check2At !== null) events.push({ id: 'checkin2', at: check2At, kind: 'checkin2', member: 'lucia', session: book2?.session });
  if (missionAt !== null) events.push({ id: 'mission', at: missionAt, kind: 'mission', member: 'lucia' });
  if (friendAt !== null) events.push({ id: 'friend', at: friendAt, kind: 'friend', member: 'lucia' });
  if (levelUpAt !== null) events.push({ id: 'levelup', at: levelUpAt + 200, kind: 'levelup', member: 'lucia', n: level });
  if (leagueAt !== null && heroRank < heroRankFrom) events.push({ id: `league-${leagueAt}`, at: leagueAt, kind: 'league', member: 'lucia', n: heroRank });
  if (trialInAt !== null) events.push({ id: 'trialIn', at: trialInAt, kind: 'trialIn', member: 'tomas', session: trial?.session });
  if (churnAt !== null) events.push({ id: 'churn', at: churnAt, kind: 'churn', member: 'lucia' });
  for (const [id, at] of Object.entries(state.sentNow)) if (at !== undefined) events.push({ id: `manual-${id}`, at, kind: 'manual', member: id as MemberId });
  const shown = events.filter((e) => e.at <= t).sort((a, b) => a.at - b.at);

  /* ---- owner's numbers ---- */
  const backIn = check1At !== null && check1At <= t;
  const manualSent = Object.values(state.sentNow).filter((x) => x !== undefined && x <= t).length;
  const heroToday = trainedBy(t).filter((x) => x.day === day).length;
  const ambientToday = shown.filter((e) => e.kind === 'aCheckin' && (e.at >= (day === 0 ? 0 : day === 1 ? tueAt : thuAt))).length;
  const kpi = {
    active: ACTIVE - (churnAt !== null ? 1 : 0),
    atRisk: AT_RISK - (backIn ? 1 : 0) - (churnAt !== null ? 1 : 0),
    sent: WINBACK_SENT + (contacted ? 1 : 0) + manualSent,
    back: WINBACK_BACK + (backIn && contacted ? 1 : 0),
    checkins: CHECKINS[day] + heroToday + ambientToday + (trialInAt !== null && trialInAt <= t ? 1 : 0),
    leads: LEADS_WEEK + (trial && trial.at <= t ? 1 : 0),
    churnOct: CHURN_OCT + (churnAt !== null ? 1 : 0),
  };

  /* ---- clock ---- */
  let clock: number;
  if (day === 0) clock = CLOCK.mon.start + Math.floor(Math.max(0, t) / CLOCK.mon.msPerMin);
  else if (day === 1) clock = (s1?.day === 1 ? s1.start : 420) - CLOCK.tue.lead + Math.floor((t - tueAt) / CLOCK.tue.msPerMin);
  else clock = (book2 ? (sessionById(book2.session)?.start ?? 1140) : 1140) - CLOCK.thu.lead + Math.floor((t - thuAt) / CLOCK.thu.msPerMin);
  const dayCut: StoryDay | null = !instant && day !== 0 && t - (day === 1 ? tueAt : thuAt) < 1200 ? day : null;

  /* ---- the phone's check-in button ---- */
  let checkinFor: GymView['checkinFor'] = null;
  if (day === 1 && book1 && book1.at <= t && s1?.day === 1 && (check1At === null || t < check1At)) checkinFor = 'check1';
  if (day === 3 && book2 && book2.at <= t && (check2At === null || t < check2At)) checkinFor = 'check2';

  /* ---- what Lucía's phone shows when nobody touches it ---- */
  const scene: Scene = { tab: 'home', overlay: null, day, push: null };
  if (sentAt !== null && t >= sentAt && t < sentAt + CHAIN.overlay) scene.push = 'wa';
  if (sentAt !== null && t >= sentAt + CHAIN.overlay && (waCloseAt === null || t < waCloseAt)) scene.overlay = 'wa';
  if (churnAt !== null && t - churnAt < 3200) scene.push = 'churn';
  if (day === 1 && t - tueAt >= 1100 && book1 && (check1At === null || t < check1At + 900)) {
    scene.tab = 'classes';
    scene.day = 1;
  }
  if (day === 3 && t - thuAt >= 1100 && book2 && (missionAt === null || t < missionAt + 300)) {
    scene.tab = 'classes';
    scene.day = 3;
  }
  const celebrateAt = levelUpAt ?? missionAt;
  if (celebrateAt !== null && t >= celebrateAt + 300 && t < chain + CHAIN.league - 600) scene.overlay = 'levelup';
  if (celebrateAt !== null && t >= chain + CHAIN.league - 600) scene.tab = 'league';
  if (instant) {
    scene.overlay = null;
    scene.push = null;
    if (celebrateAt !== null) scene.tab = 'league';
  }

  return {
    t,
    day,
    clock,
    dayCut,
    sentAt,
    winOffAtSend: send.offAtSend,
    tueAt,
    thuAt,
    wa,
    waChoice,
    waCloseAt,
    lead,
    leadGoal,
    trial,
    trialInAt,
    book1,
    book2,
    check1At,
    check2At,
    missionAt,
    declinedAt,
    churnAt,
    status,
    away,
    gains,
    level,
    inLevel,
    need: levelNeed(level),
    levelUpAt,
    streak,
    week,
    missions,
    league: rows,
    heroRank,
    heroRankFrom,
    leagueAt,
    booked,
    heroSessions: heroBookings.map((b) => b.session),
    events: shown,
    kpi,
    checkinFor,
    scene,
  };
}

/** Lucía's level right before the latest level-up (for the "6 → 7" moment). */
export const levelFrom = (v: GymView) => (v.levelUpAt !== null ? HERO_LEVEL : v.level);
