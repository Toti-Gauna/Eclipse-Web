/**
 * Órbita Fitness — the story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did;
 * every screen derives the week from (story time t, that state) with `deriveGym`, which
 * is pure: pausing, reduced motion and two screens in sync come for free.
 *
 * Nothing plays on its own (v3). The visitor plays four beats from the SimBar (model.ts BEATS):
 *  1 lead — Tomás asks the site's chatbot for a free trial and books Thursday 19:00.
 *  2 winback — Lucía hasn't come in 9 days → flagged → the automation sends her a WhatsApp
 *    with a personal mission (2 classes = +300 XP). It waits for her answer.
 *  3 tuesday — she books Tuesday 7:00 → time-lapse → she checks in (back after 10 days) →
 *    the app books her Thursday class. Nobody wrote to her? She cancels her membership.
 *  4 thursday — second check-in → mission complete → level 7 → she climbs to #3 of her league.
 * Between beats the clock is stopped. What the visitor does is stamped with `t` and shows at
 * once: answer the WhatsApp as Lucía, book any future class, check in, send a guest pass,
 * try the site chat, send queued win-backs, or switch the automation off.
 */
import { createDemoStore, runChat, type ChatPick, type ChatRun, type ChatScript, type DemoStore, type RunChatOptions } from '../kit';
import {
  ACTIVE,
  AT,
  AT_RISK,
  BEATS,
  CHECKINS,
  CHURN_OCT,
  CLOCK,
  HERO_LEVEL,
  HERO_XP,
  KNOWN_KINDS,
  LEADS_WEEK,
  LEAGUE,
  LEAGUE_XP,
  MISSIONS,
  SECOND_CLASS,
  STREAK_GRACE,
  THU,
  TRIAL_OPTIONS,
  TUE,
  WA_OPTIONS,
  WINBACK_BACK,
  WINBACK_SENT,
  XP,
  levelNeed,
  memberById,
  sessionById,
  type MemberId,
  type MissionId,
  type Session,
  type StoryDay,
  type StoryPick,
} from './model';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export interface Range {
  from: number;
  to: number | null;
}

export interface GymState {
  /** Lucía's WhatsApp: the visitor's answers as Lucía (chat time since it was sent). */
  wa: Record<string, ChatPick>;
  /** Tomás' site chat: the visitor's answers as Tomás (chat time since he opened it). */
  lead: Record<string, ChatPick>;
  /** The visitor's own site chat ("Clase gratis"), started at `start` (story time). */
  leadMine: { start: number; picks: Record<string, ChatPick> } | null;
  /** When the win-back automation was off (story time). */
  off: Range[];
  /** Classes the visitor booked in Lucía's app. */
  mine: { session: string; at: number }[];
  /** Check-ins the visitor made in Lucía's app. */
  checkins: { session: string; at: number }[];
  /** The visitor sent Lucía's guest pass (mission "bring a friend"). */
  friendAt: number | null;
  /** Win-backs the owner sent by hand (queued members, or Lucía when the automation was off). */
  sentNow: Partial<Record<MemberId, number>>;
}

export const freshGym = (): GymState => ({ wa: {}, lead: {}, leadMine: null, off: [], mine: [], checkins: [], friendAt: null, sentNow: {} });

export type GymStore = DemoStore<GymState>;

/** Module-level (stable) factory for usePairedStore. Beats: no autoplay; "Reiniciar" = a fresh week. */
export function createGymStore(paired: boolean): GymStore {
  return createDemoStore<GymState>(freshGym(), { beats: BEATS, paired, reset: freshGym });
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
  /** The visitor opens the site chat themselves (a fresh conversation, answered at once). */
  startLead: () => (s: GymState, t: number): GymState => ({ ...s, leadMine: { start: t, picks: {} } }),
  pickLeadMine: (step: string, reply: string) => (s: GymState, t: number): GymState =>
    s.leadMine ? { ...s, leadMine: { ...s.leadMine, picks: { ...s.leadMine.picks, [step]: { reply, at: t - s.leadMine.start } } } } : s,
  toggleWin: () => (s: GymState, t: number): GymState => {
    const next = isOffNow(s.off) ? s.off.map((r) => (r.to === null ? { ...r, to: t } : r)) : [...s.off, { from: t, to: null }];
    return { ...s, off: next };
  },
  book: (session: string) => (s: GymState, t: number): GymState =>
    s.mine.some((m) => m.session === session) ? s : { ...s, mine: [...s.mine, { session, at: t }] },
  checkin: (session: string) => (s: GymState, t: number): GymState =>
    s.checkins.some((c) => c.session === session) ? s : { ...s, checkins: [...s.checkins, { session, at: t }] },
  friend: () => (s: GymState, t: number): GymState => (s.friendAt === null ? { ...s, friendAt: t } : s),
  sendNow: (id: MemberId) => (s: GymState, t: number): GymState => (s.sentNow[id] !== undefined ? s : { ...s, sentNow: { ...s.sentNow, [id]: t } }),
};

/* ------------------------------------------------------------------ */
/* Script shapes (timing here; texts per locale in scripts.tsx)         */
/* ------------------------------------------------------------------ */
type FlowStep = { from: 'bot' | 'user' | 'note'; typingMs?: number; pauseMs?: number; next?: string; replies?: readonly string[] };
type Flow = { start: string; steps: Record<string, FlowStep>; goto: Record<string, string> };

/** Lucía's win-back WhatsApp (no automatic answers: the story or the visitor answers). */
export const WA_FLOW: Flow = {
  start: 'hello',
  steps: {
    hello: { from: 'bot', typingMs: 500, pauseMs: 300, next: 'mission' },
    mission: { from: 'bot', typingMs: 800, pauseMs: 300, replies: ['book', 'later'] },
    slots: { from: 'bot', typingMs: 700, pauseMs: 300, replies: ['opt0', 'opt1'] },
    booked: { from: 'bot', typingMs: 600, pauseMs: 300, next: 'noteBooked' },
    noteBooked: { from: 'note', typingMs: 400 },
    later: { from: 'bot', typingMs: 800, pauseMs: 300, next: 'notePaused' },
    notePaused: { from: 'note', typingMs: 400 },
  },
  goto: { book: 'slots', later: 'later', opt0: 'booked', opt1: 'booked' },
};

/** The site's chatbot (a free trial class). */
export const LEAD_FLOW: Flow = {
  start: 'hi',
  steps: {
    hi: { from: 'bot', typingMs: 700, pauseMs: 300, replies: ['try', 'classes'] },
    classes: { from: 'bot', typingMs: 900, pauseMs: 300, next: 'goal' },
    goal: { from: 'bot', typingMs: 800, pauseMs: 300, replies: ['strength', 'cardio', 'unsure'] },
    pick: { from: 'bot', typingMs: 1000, pauseMs: 300, replies: ['opt0', 'opt1'] },
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
      replies: s.replies?.map((r) => ({ id: r, label: replyLabel(id, r), goto: flow.goto[r] })),
      ...content(id),
    };
  }
  return { start: flow.start, steps };
}
/** Same flow without texts: enough to know when things happen. */
const WA_TIMING = buildScript(WA_FLOW, () => ({}), () => '');
const LEAD_TIMING = buildScript(LEAD_FLOW, () => ({}), () => '');

/**
 * The picks of a chat: the visitor's, plus the story's own answers (absolute times) for the
 * steps the visitor didn't answer — only until the visitor first takes over.
 */
export function chatPicks(story: StoryPick[], start: number, visitor: Record<string, ChatPick>, t: number): Record<string, ChatPick> {
  const times = Object.values(visitor).map((p) => start + p.at);
  const takeover = times.length ? Math.min(...times) : Infinity;
  const out: Record<string, ChatPick> = {};
  for (const p of story) if (p.at <= t && p.at < takeover && !visitor[p.step]) out[p.step] = { reply: p.reply, at: p.at - start };
  return { ...out, ...visitor };
}

/** Everything a view needs to run a chat with its localized script (same picks as the story). */
export interface ChatSource {
  start: number;
  picks: Record<string, ChatPick>;
  options: RunChatOptions;
}

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
export type Via = 'wa' | 'app' | 'auto' | 'chat';
export interface Booking {
  session: string;
  at: number;
  via: Via;
  /** The visitor did it (no "just now" window: their feedback is local). */
  mine?: boolean;
}
export interface Checkin {
  session: string;
  at: number;
  mine: boolean;
}
export type GainId = string;
export interface Gain {
  id: GainId;
  /** check-in, or a mission. */
  kind: 'checkin' | MissionId;
  xp: number;
  at: number;
  mine: boolean;
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
  | 'newClass'
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
  member?: MemberId | 'you';
  session?: string;
  /** back: days away · levelup: level · league: rank. */
  n?: number;
  via?: Via;
  /** The visitor did it (no toast / "just now" window on the frozen clock). */
  mine?: boolean;
}

export type { MemberTab, PhoneOverlay } from './model';

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
  /** A day just started (time-lapse cut, inside a beat). */
  dayCut: StoryDay | null;
  sentAt: number | null;
  /** The visitor sent it by hand (the chat shows at once). */
  sentManual: boolean;
  /** The automation was off when the send time came. */
  winOffAtSend: boolean;
  tueAt: number;
  thuAt: number;
  /** Start of the class the Tuesday / Thursday clocks run up to (minutes). */
  tueStart: number;
  thuStart: number;
  wa: ChatRun;
  waSource: ChatSource | null;
  waChoice: 'book' | 'later' | null;
  /** Tomás' chat (the story's), and the visitor's own if they opened one. */
  lead: ChatRun;
  leadSource: ChatSource;
  leadMine: ChatRun | null;
  leadMineSource: ChatSource | null;
  /**
   * The site's widget shows the visitor's own chat (else Tomás'): the latest one started wins —
   * playing the lead beat after trying it yourself shows Tomás' conversation; trying it during
   * or after the beat shows yours.
   */
  leadShowMine: boolean;
  trial: Booking | null;
  trialYou: Booking | null;
  trialInAt: number | null;
  book1: Booking | null;
  book2: Booking | null;
  check1At: number | null;
  check2At: number | null;
  checkins: Checkin[];
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
  /** The latest level-up (from → to) and when. */
  levelUpAt: number | null;
  levelFrom: number;
  streak: number;
  /** Mon … Sun: trained that day. */
  week: boolean[];
  missions: MissionView[];
  league: LeagueRow[];
  heroRank: number;
  /** Lucía's rank before her latest league gain (for the trend arrow). */
  heroRankFrom: number;
  leagueAt: number | null;
  /** Extra bookings per session (Lucía, trials) on top of the session's base count. */
  extra: Record<string, number>;
  /** Sessions Lucía is booked into (any channel). */
  heroSessions: string[];
  events: GymEvent[];
  kpi: { active: number; atRisk: number; sent: number; back: number; checkins: number; leads: number; churnOct: number };
  /** Push banner on Lucía's phone (inside a beat only). */
  push: 'wa' | 'churn' | null;
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

/** Mission XP reaches the league once the celebration is over (the climb is its own moment). */
const LEAGUE_LAG = THU.league - THU.mission;
const dayOf = (session: string) => sessionById(session)?.day ?? -99;

export function deriveGym(state: GymState, t: number, instant: boolean): GymView {
  const tueAt = AT.tue;
  const thuAt = AT.thu;
  const day: StoryDay = t < tueAt ? 0 : t < thuAt ? 1 : 3;
  const events: GymEvent[] = [];
  const push = (e: GymEvent) => {
    if (e.at <= t) events.push(e);
  };

  /* ---- the lead (Tomás, beat 1) and the visitor's own site chat ---- */
  const leadSource: ChatSource = {
    start: AT.lead,
    picks: chatPicks(AT.leadPicks, AT.lead, state.lead, t),
    options: { instant, instantAfterPick: Object.keys(state.lead).length > 0 },
  };
  const lead = runChat(LEAD_TIMING, t - AT.lead, leadSource.picks, leadSource.options);
  const trialAt = lead.at.done !== undefined ? AT.lead + lead.at.done : null;
  const trial: Booking | null =
    trialAt !== null ? { session: TRIAL_OPTIONS[lead.chosen.pick === 'opt1' ? 1 : 0], at: trialAt, via: 'chat', mine: Object.keys(state.lead).length > 0 } : null;
  const leadMineSource: ChatSource | null = state.leadMine ? { start: state.leadMine.start, picks: state.leadMine.picks, options: { instant: true } } : null;
  const leadMine = leadMineSource ? runChat(LEAD_TIMING, t - leadMineSource.start, leadMineSource.picks, leadMineSource.options) : null;
  const trialYou: Booking | null =
    leadMine && leadMineSource && leadMine.at.done !== undefined
      ? { session: TRIAL_OPTIONS[leadMine.chosen.pick === 'opt1' ? 1 : 0], at: leadMineSource.start + leadMine.at.done, via: 'chat', mine: true }
      : null;
  const leadShowMine = !!state.leadMine && (state.leadMine.start >= AT.lead || t < AT.lead);
  if (trial) push({ id: 'trial', at: trial.at, kind: 'trial', member: 'tomas', session: trial.session, mine: trial.mine });
  if (trialYou) push({ id: 'trial-you', at: trialYou.at, kind: 'trial', member: 'you', session: trialYou.session, mine: true });
  const trialInAt = trial && dayOf(trial.session) === 3 ? thuAt + THU.trialIn : null;
  if (trialInAt !== null) push({ id: 'trialIn', at: trialInAt, kind: 'trialIn', member: 'tomas', session: trial?.session });

  /* ---- the win-back (beat 2) ---- */
  const autoSend = isOn(state.off, AT.win);
  const manualAt = state.sentNow.lucia ?? null;
  const sentAt = autoSend && t >= AT.win ? AT.win : manualAt !== null && manualAt <= t ? manualAt : null;
  const sentManual = sentAt !== null && sentAt === manualAt && !(autoSend && t >= AT.win);
  const waSource: ChatSource | null =
    sentAt !== null
      ? { start: sentAt, picks: chatPicks(AT.waPicks, sentAt, state.wa, t), options: { instant: instant || sentManual, instantAfterPick: Object.keys(state.wa).length > 0 } }
      : null;
  const wa = waSource ? runChat(WA_TIMING, t - waSource.start, waSource.picks, waSource.options) : runChat(WA_TIMING, -1);
  const waChoice = (wa.chosen.mission as 'book' | 'later' | undefined) ?? null;
  const optIndex = wa.chosen.slots === 'opt1' ? 1 : 0;
  const waMine = !!state.wa.slots || !!state.wa.mission;
  const waBookedAt = sentAt !== null && wa.at.booked !== undefined ? sentAt + wa.at.booked : null;
  const declinedAt = sentAt !== null && wa.at.later !== undefined ? sentAt + wa.at.later : null;
  const acceptedAt = waBookedAt;

  push({ id: 'flag', at: AT.flag, kind: 'flag', member: 'lucia', n: 9 });
  if (sentAt !== null) push({ id: 'sent', at: sentAt, kind: sentManual ? 'manual' : 'sent', member: 'lucia', mine: sentManual });
  if (declinedAt !== null) push({ id: 'declined', at: declinedAt, kind: 'declined', member: 'lucia', mine: !!state.wa.mission });

  /* ---- Lucía's bookings ---- */
  const bookings: Booking[] = [];
  const addBooking = (b: Booking) => {
    if (b.at <= t && !bookings.some((x) => x.session === b.session)) bookings.push(b);
  };
  const candidates: Booking[] = [];
  if (waBookedAt !== null) candidates.push({ session: WA_OPTIONS[optIndex], at: waBookedAt, via: 'wa', mine: waMine });
  for (const m of state.mine) candidates.push({ session: m.session, at: m.at, via: 'app', mine: true });
  candidates.sort((a, b) => a.at - b.at).forEach(addBooking);

  /* ---- check-ins: the story's (inside beats 3 and 4) and the visitor's ---- */
  const checkins: Checkin[] = state.checkins.filter((c) => c.at <= t).map((c) => ({ ...c, mine: true }));
  const checkedIn = (session: string) => checkins.some((c) => c.session === session);
  const firstOn = (d: number, by: number) => bookings.filter((b) => dayOf(b.session) === d && b.at <= by).sort((a, b) => a.at - b.at)[0];

  const tueCheck = tueAt + TUE.checkin;
  const tueBooking = firstOn(1, tueCheck);
  if (tueBooking && t >= tueCheck && !checkedIn(tueBooking.session)) checkins.push({ session: tueBooking.session, at: tueCheck, mine: false });

  // The app books her Thursday class after Tuesday's check-in (one class left of the mission).
  const book2At = tueAt + TUE.book2;
  const trainedTue = checkins.some((c) => dayOf(c.session) === 1 && c.at <= book2At);
  if (t >= book2At && trainedTue && acceptedAt !== null && acceptedAt <= book2At && !firstOn(3, book2At)) {
    addBooking({ session: SECOND_CLASS, at: book2At, via: 'auto' });
  }
  const thuCheck = thuAt + THU.checkin;
  const thuBooking = firstOn(3, thuCheck);
  if (thuBooking && t >= thuCheck && !checkedIn(thuBooking.session)) checkins.push({ session: thuBooking.session, at: thuCheck, mine: false });
  checkins.sort((a, b) => a.at - b.at);

  /* ---- churn: nobody wrote to her, she never booked or came ---- */
  const churnCheck = tueAt + TUE.churn;
  const contactedBy = (x: number) => sentAt !== null && sentAt <= x;
  const churnAt =
    t >= churnCheck && !contactedBy(churnCheck) && !bookings.some((b) => b.at <= churnCheck) && !checkins.some((c) => c.at <= churnCheck) ? churnCheck : null;

  /* ---- XP: check-ins and missions ---- */
  const all: Gain[] = [];
  checkins.forEach((c) => all.push({ id: `check-${c.session}`, kind: 'checkin', xp: XP.checkin, at: c.at, mine: c.mine }));
  let missionAt: number | null = null;
  if (acceptedAt !== null && checkins.length >= 2) {
    const second = checkins[1];
    missionAt = Math.max(acceptedAt, second.at + (second.mine ? 0 : THU.mission));
    all.push({ id: 'comeback', kind: 'comeback', xp: XP.comeback, at: missionAt, mine: second.mine });
  }
  let streakDoneAt: number | null = null;
  for (let i = 0; i < checkins.length && streakDoneAt === null; i++) {
    const c = checkins[i];
    const days = checkins.slice(0, i + 1).map((x) => dayOf(x.session));
    if (streakAt(days, dayOf(c.session)) >= 3) {
      streakDoneAt = c.at + (c.mine ? 0 : THU.mission);
      all.push({ id: 'streak3', kind: 'streak3', xp: XP.streak3, at: streakDoneAt, mine: c.mine });
    }
  }
  const newIn = checkins.find((c) => {
    const s = sessionById(c.session);
    return s && !KNOWN_KINDS.includes(s.kind);
  });
  const newMission = MISSIONS.find((m) => m.id === 'newClass')!;
  if (newIn) all.push({ id: 'newClass', kind: 'newClass', xp: newMission.xp, at: newIn.at, mine: newIn.mine });
  if (state.friendAt !== null) all.push({ id: 'friend', kind: 'friend', xp: XP.friend, at: state.friendAt, mine: true });
  all.sort((a, b) => a.at - b.at);
  const gains = all.filter((g) => g.at <= t);

  let level = HERO_LEVEL;
  let inLevel = HERO_XP;
  let levelUpAt: number | null = null;
  let levelFrom = HERO_LEVEL;
  let levelUpMine = false;
  for (const g of gains) {
    const before = level;
    inLevel += g.xp;
    while (inLevel >= levelNeed(level)) {
      inLevel -= levelNeed(level);
      level += 1;
    }
    if (level > before) {
      levelUpAt = g.at;
      levelFrom = before;
      levelUpMine = g.mine;
    }
  }

  const trainedBy = (x: number) => checkins.filter((c) => c.at <= x);
  const trainedDays = trainedBy(t).map((c) => dayOf(c.session));
  const streak = streakAt(trainedDays, day);
  const week = Array.from({ length: 7 }, (_, i) => trainedDays.includes(i));
  const accepted = acceptedAt !== null && acceptedAt <= t;
  const done = (id: MissionId) => gains.find((g) => g.kind === id)?.at ?? null;
  const missions: MissionView[] = MISSIONS.map((m) => {
    const doneAt = done(m.id);
    if (m.id === 'comeback') return { ...m, progress: doneAt !== null ? m.goal : Math.min(m.goal, trainedBy(t).length), doneAt, shown: accepted };
    if (m.id === 'streak3') return { ...m, progress: doneAt !== null ? m.goal : Math.min(m.goal - 1, streak), doneAt, shown: true };
    return { ...m, progress: doneAt !== null ? m.goal : 0, doneAt, shown: true };
  });

  /* ---- status ---- */
  const contacted = sentAt !== null && sentAt <= t;
  const book1 = bookings[0] ?? null;
  const book2 = bookings[1] ?? null;
  const check1At = checkins[0]?.at ?? null;
  const check2At = checkins[1]?.at ?? null;
  let status: HeroStatus = t < AT.flag ? 'away' : 'risk';
  if (contacted) status = 'contacted';
  if (book1) status = 'booked';
  if (declinedAt !== null && !book1) status = 'paused';
  if (check1At !== null) status = 'back';
  if (missionAt !== null && missionAt <= t) status = 'done';
  if (churnAt !== null) status = 'churned';
  const lastDay = trainedDays.length ? Math.max(...trainedDays) : null;
  const away = lastDay !== null ? Math.max(0, day - lastDay) : 9 + day;

  /* ---- league ---- */
  const leagueTime = (g: Gain) => (g.kind === 'checkin' || g.mine ? g.at : g.at + LEAGUE_LAG);
  const inLeague = all.filter((g) => leagueTime(g) <= t);
  const heroPoints = inLeague.reduce((s, g) => s + g.xp, 0);
  const sortRows = (points: number): LeagueRow[] =>
    LEAGUE.map((id) => ({ id, points: id === 'lucia' ? points : (LEAGUE_XP[day][id] ?? 0) })).sort(
      // Ties: whoever got there first stays ahead (Lucía last).
      (a, b) => b.points - a.points || (a.id === 'lucia' ? 1 : b.id === 'lucia' ? -1 : 0),
    );
  const rows = sortRows(heroPoints);
  const rankIn = (list: LeagueRow[]) => list.findIndex((r) => r.id === 'lucia') + 1;
  const heroRank = rankIn(rows);
  const leagueAt = inLeague.length ? Math.max(...inLeague.map(leagueTime)) : null;
  const latest = leagueAt !== null ? inLeague.filter((g) => leagueTime(g) === leagueAt) : [];
  const heroRankFrom = leagueAt !== null ? rankIn(sortRows(heroPoints - latest.reduce((s, g) => s + g.xp, 0))) : heroRank;

  /* ---- classes: extra bookings ---- */
  const extra: Record<string, number> = {};
  const bump = (session: string) => (extra[session] = (extra[session] ?? 0) + 1);
  for (const b of bookings) bump(b.session);
  if (trial && trial.at <= t) bump(trial.session);
  if (trialYou && trialYou.at <= t) bump(trialYou.session);

  /* ---- events ---- */
  for (const a of AT.ambient) {
    push({ id: `amb-${a.member}`, at: a.at, kind: a.kind === 'checkin' ? 'aCheckin' : a.kind === 'mission' ? 'aMission' : 'aBadge', member: a.member, n: memberById(a.member).streak });
  }
  // By index: at rest the clock is frozen, so switching it off and on again repeats the same time.
  state.off.forEach((r, i) => {
    push({ id: `off-${i}`, at: r.from, kind: 'off', mine: true });
    if (r.to !== null) push({ id: `on-${i}`, at: r.to, kind: 'on', mine: true });
  });
  bookings.forEach((b, i) => {
    const kind: EventKind = i === 0 ? 'booked' : b.via === 'auto' ? 'book2' : 'booked';
    push({ id: `booked-${b.session}`, at: b.at, kind, member: 'lucia', session: b.session, via: b.via, mine: b.mine });
  });
  checkins.forEach((c, i) => push({ id: `in-${c.session}`, at: c.at, kind: i === 0 ? 'back' : 'checkin2', member: 'lucia', n: 9 + dayOf(c.session), session: c.session, mine: c.mine }));
  for (const g of all) {
    if (g.kind === 'comeback') push({ id: 'mission', at: g.at, kind: 'mission', member: 'lucia', mine: g.mine });
    if (g.kind === 'newClass') push({ id: 'newClass', at: g.at, kind: 'newClass', member: 'lucia', mine: g.mine });
    if (g.kind === 'friend') push({ id: 'friend', at: g.at, kind: 'friend', member: 'lucia', mine: true });
  }
  if (levelUpAt !== null) push({ id: `levelup-${level}`, at: levelUpAt + (levelUpMine ? 0 : 200), kind: 'levelup', member: 'lucia', n: level, mine: levelUpMine });
  if (leagueAt !== null && heroRank < heroRankFrom) push({ id: `league-${leagueAt}`, at: leagueAt, kind: 'league', member: 'lucia', n: heroRank, mine: latest.some((g) => g.mine) });
  if (churnAt !== null) push({ id: 'churn', at: churnAt, kind: 'churn', member: 'lucia' });
  for (const [id, at] of Object.entries(state.sentNow)) {
    if (at !== undefined && id !== 'lucia') push({ id: `manual-${id}`, at, kind: 'manual', member: id as MemberId, mine: true });
  }
  events.sort((a, b) => a.at - b.at);

  /* ---- owner's numbers ---- */
  const backIn = check1At !== null && check1At <= t;
  const manualSent = Object.entries(state.sentNow).filter(([id, x]) => id !== 'lucia' && x !== undefined && x <= t).length;
  const heroToday = trainedBy(t).filter((c) => dayOf(c.session) === day).length;
  const dayStart = day === 0 ? 0 : day === 1 ? tueAt : thuAt;
  const ambientToday = events.filter((e) => e.kind === 'aCheckin' && e.at >= dayStart).length;
  const kpi = {
    active: ACTIVE - (churnAt !== null ? 1 : 0),
    atRisk: AT_RISK - (backIn ? 1 : 0) - (churnAt !== null ? 1 : 0),
    sent: WINBACK_SENT + (contacted ? 1 : 0) + manualSent,
    back: WINBACK_BACK + (backIn && contacted ? 1 : 0),
    checkins: CHECKINS[day] + heroToday + ambientToday + (trialInAt !== null && trialInAt <= t ? 1 : 0),
    leads: LEADS_WEEK + (trial && trial.at <= t ? 1 : 0) + (trialYou && trialYou.at <= t ? 1 : 0),
    churnOct: CHURN_OCT + (churnAt !== null ? 1 : 0),
  };

  /* ---- clock ---- */
  const tueClass = sessionById(tueBooking?.session ?? '1-420');
  const thuClass = sessionById(thuBooking?.session ?? SECOND_CLASS);
  let clock: number;
  if (day === 0) clock = CLOCK.mon.start + Math.floor(Math.max(0, t) / CLOCK.mon.msPerMin);
  else if (day === 1) clock = (tueClass?.start ?? 420) - CLOCK.tue.lead + Math.floor((t - tueAt) / CLOCK.tue.msPerMin);
  else clock = (thuClass?.start ?? 1140) - CLOCK.thu.lead + Math.floor((t - thuAt) / CLOCK.thu.msPerMin);
  const dayCut: StoryDay | null = !instant && day !== 0 && t - (day === 1 ? tueAt : thuAt) < 1200 ? day : null;

  /* ---- push banners on Lucía's phone (inside beats only) ---- */
  let pushBanner: GymView['push'] = null;
  if (!instant && sentAt !== null && !sentManual && t - sentAt < 3000) pushBanner = 'wa';
  if (!instant && churnAt !== null && t - churnAt < 3000) pushBanner = 'churn';

  return {
    t,
    day,
    clock,
    dayCut,
    sentAt,
    sentManual,
    winOffAtSend: !autoSend && t >= AT.win,
    tueAt,
    thuAt,
    tueStart: tueClass?.start ?? 420,
    thuStart: thuClass?.start ?? 1140,
    wa,
    waSource,
    waChoice,
    lead,
    leadSource,
    leadMine,
    leadMineSource,
    leadShowMine,
    trial,
    trialYou,
    trialInAt,
    book1,
    book2,
    check1At,
    check2At,
    checkins,
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
    levelFrom,
    streak,
    week,
    missions,
    league: rows,
    heroRank,
    heroRankFrom,
    leagueAt,
    extra,
    heroSessions: bookings.map((b) => b.session),
    events,
    kpi,
    push: pushBanner,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers for the views                                                */
/* ------------------------------------------------------------------ */
/** Spots taken in a session (base + Lucía + trials). */
export const taken = (view: GymView, s: Session) => Math.min(s.cap, s.booked + (view.extra[s.id] ?? 0));
/** The session is over (or on a past day of the story). */
export const isPast = (view: GymView, s: Session) => s.day < view.day || (s.day === view.day && s.start + 50 <= view.clock);
/** Lucía can check in: booked, on the story's day, not yet checked in, membership active. */
export const canCheckIn = (view: GymView, session: string) =>
  view.status !== 'churned' &&
  view.heroSessions.includes(session) &&
  dayOf(session) === view.day &&
  !view.checkins.some((c) => c.session === session);
/** Lucía can book it: on the story's day or later, not over, not full, not booked. */
export const canBook = (view: GymView, s: Session) =>
  view.status !== 'churned' && !isPast(view, s) && !view.heroSessions.includes(s.id) && taken(view, s) < s.cap;
export const checkedInAt = (view: GymView, session: string) => view.checkins.find((c) => c.session === session) ?? null;
/** Story time → that moment's day and clock (feeds, chat stamps). */
export function storyClockAt(view: GymView, at: number): { day: StoryDay; clock: number } {
  if (at < view.tueAt) return { day: 0, clock: CLOCK.mon.start + Math.floor(Math.max(0, at) / CLOCK.mon.msPerMin) };
  if (at < view.thuAt) return { day: 1, clock: view.tueStart - CLOCK.tue.lead + Math.floor((at - view.tueAt) / CLOCK.tue.msPerMin) };
  return { day: 3, clock: view.thuStart - CLOCK.thu.lead + Math.floor((at - view.thuAt) / CLOCK.thu.msPerMin) };
}
/** A story event that just happened (toasts, halos) — never the visitor's own (the clock is frozen). */
export const isFreshEvent = (view: GymView, e: { at: number; mine?: boolean }, ms = 2600) => !e.mine && view.t >= e.at && view.t - e.at < ms;
