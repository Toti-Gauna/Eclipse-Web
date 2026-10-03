/**
 * Atrio Idiomas — the live story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did;
 * every screen DERIVES the evening from (story time t, that state) with `deriveAcademy`,
 * which is pure: pausing, looping, reduced motion (t = end) and two screens in sync
 * come for free.
 *
 * The 30 s loop (20:10 → 20:25, Thursday):
 *  Valentina opens today's lesson (streak 11) → a speaking session by voice with the AI
 *  tutor (it catches "sink" → "think", the /θ/ sound) → the tutor corrects a written
 *  sentence and gives her a mini exercise → lesson complete: streak 12, A2 → B1, she
 *  climbs in her class ranking and books the B1 conversation club.
 *  Meanwhile a lead (Julieta) takes the level test on the site's chatbot (A2) → enrolls
 *  and pays → shows up in the panel; and Martín (5 days away) gets an automatic WhatsApp
 *  with a 5-minute lesson and comes back: the completion rate holds at 82 %.
 * Visitor: pick the speaking prompt, answer the tutor's exercise (a wrong answer leaves
 * B1 for tomorrow), take the level test and enroll themselves, answer as Martín, or switch
 * the nudges off (Martín drops out and the completion rate falls to 80 %).
 */
import { createDemoStore, runChat, runVoice, type ChatPick, type ChatRun, type ChatScript, type DemoStore, type VoiceScript, type VoiceState } from '../kit';
import {
  CLASSMATES,
  HERO,
  LOOP_MS,
  MARTIN_BACK_POINTS,
  NEXT_LEVEL,
  POINTS,
  SCHOOL,
  SPEAK_FLOW,
  SPEAK_SCORE,
  STORY,
  storyClock,
  type BadgeId,
  type CefrLevel,
  type PromptId,
  type StudentId,
} from './data';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export interface Range {
  from: number;
  to: number | null;
}
export interface SiteRun {
  /** Story time the chat opened. */
  start: number;
  picks: Record<string, ChatPick>;
  /** The visitor is taking the test (no automatic answers; the enrollment is theirs). */
  mine: boolean;
}
export interface Enrollment {
  who: 'julieta' | 'you';
  level: 'A1' | 'A2' | 'B1';
  course: CefrLevel;
  pay: 'card' | 'transfer';
  /** Story time it was paid (−1: an earlier loop). */
  at: number;
}

export interface AcademyState {
  /** Speaking prompts the visitor picked (story time); each starts a session. */
  prompts: { prompt: PromptId; at: number }[];
  /** Valentina's written practice (chat time). */
  tutorPicks: Record<string, ChatPick>;
  /** The site's level test chat. */
  site: SiteRun;
  /** Martín's WhatsApp (chat time since the nudge). */
  waPicks: Record<string, ChatPick>;
  /** When the nudge automation was off (story time). */
  off: Range[];
  /** The visitor booked Valentina's B1 club (story time). */
  booked: number | null;
  /** The visitor's own enrollments (kept across loops). */
  enrolled: Enrollment[];
}

const freshSite = (): SiteRun => ({ start: STORY.lead, picks: {}, mine: false });
const fresh = (): AcademyState => ({ prompts: [], tutorPicks: {}, site: freshSite(), waPicks: {}, off: [], booked: null, enrolled: [] });
/** A switch left off stays off in the next loop. */
const carry = (ranges: Range[]): Range[] => (ranges.some((r) => r.to === null) ? [{ from: -1, to: null }] : []);

export type AcademyStore = DemoStore<AcademyState>;

/** Module-level (stable) factory for usePairedStore. */
export function createAcademyStore(paired: boolean): AcademyStore {
  return createDemoStore<AcademyState>(fresh(), {
    loopMs: LOOP_MS,
    paired,
    onLoop: (s) => {
      const mine = siteOutcome(s.site, LOOP_MS);
      return {
        ...fresh(),
        off: carry(s.off),
        enrolled: [...s.enrolled, ...(mine && mine.who === 'you' ? [mine] : [])].map((e) => ({ ...e, at: -1 })).slice(-3),
      };
    },
  });
}

export const isOn = (ranges: Range[], at: number) => !ranges.some((r) => at >= r.from && (r.to === null || at < r.to));
export const isOffNow = (ranges: Range[]) => ranges.some((r) => r.to === null);

/**
 * Picks for a chat where the visitor just tapped `reply` on `step`: the answers given so far
 * (automatic ones too) are frozen, so taking over never rewinds the conversation.
 */
export function freezePicks(run: ChatRun, step: string, reply: string, at: number): Record<string, ChatPick> {
  const picks: Record<string, ChatPick> = {};
  for (const item of run.items) {
    if (!item.id.endsWith(':reply') || item.step === step) continue;
    const chosen = run.chosen[item.step];
    if (chosen) picks[item.step] = { reply: chosen, at: item.at };
  }
  picks[step] = { reply, at: Math.max(at, run.at[step] ?? 0) };
  return picks;
}

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  prompt: (prompt: PromptId) => (s: AcademyState, t: number): AcademyState => ({ ...s, prompts: [...s.prompts, { prompt, at: t }] }),
  pickTutor: (step: string, reply: string) => (s: AcademyState, t: number): AcademyState => ({
    ...s,
    tutorPicks: { ...s.tutorPicks, [step]: { reply, at: t - STORY.writing } },
  }),
  /**
   * `run` is the chat on screen. Tapping in the lead's test makes it the visitor's own (same
   * answers so far, the lead carries on in the background); in their own, it's the next answer.
   */
  pickSite: (run: ChatRun, step: string, reply: string) => (s: AcademyState, t: number): AcademyState => {
    const start = s.site.mine ? s.site.start : STORY.lead;
    return { ...s, site: { start, mine: true, picks: freezePicks(run, step, reply, t - start) } };
  },
  /** "Take the test yourself": a fresh chat (a finished one of yours is kept as an enrollment). */
  restartSite: () => (s: AcademyState, t: number): AcademyState => {
    const before = siteOutcome(s.site, t);
    return {
      ...s,
      enrolled: before && before.who === 'you' ? [...s.enrolled, before] : s.enrolled,
      site: { start: t, picks: {}, mine: true },
    };
  },
  pickWa: (run: ChatRun, step: string, reply: string) => (s: AcademyState, t: number): AcademyState => ({
    ...s,
    waPicks: freezePicks(run, step, reply, t - STORY.nudge),
  }),
  toggleNudge: () => (s: AcademyState, t: number): AcademyState => {
    const next = isOffNow(s.off) ? s.off.map((r) => (r.to === null ? { ...r, to: t } : r)) : [...s.off, { from: t, to: null }];
    return { ...s, off: next };
  },
  book: () => (s: AcademyState, t: number): AcademyState => (s.booked === null ? { ...s, booked: t } : s),
};

/* ------------------------------------------------------------------ */
/* Script shapes (timing here; texts per locale in scripts.tsx)         */
/* ------------------------------------------------------------------ */
type FlowStep = { from: 'bot' | 'user' | 'note'; typingMs?: number; pauseMs?: number; next?: string; replies?: readonly string[]; auto?: string; autoMs?: number };
export type Flow = { start: string; steps: Record<string, FlowStep>; goto: Record<string, string> };

/** Valentina writes, the tutor corrects and gives her a mini exercise. */
export const TUTOR_FLOW: Flow = {
  start: 'msg',
  steps: {
    msg: { from: 'user', typingMs: 300, pauseMs: 250, next: 'fix' },
    fix: { from: 'bot', typingMs: 1000, pauseMs: 250, next: 'quiz' },
    quiz: { from: 'bot', typingMs: 800, replies: ['bought', 'buyed', 'buys'], auto: 'bought', autoMs: 1600 },
    right: { from: 'bot', typingMs: 700 },
    wrong: { from: 'bot', typingMs: 700 },
  },
  goto: { bought: 'right', buyed: 'wrong', buys: 'wrong' },
};

/** The site's chatbot: a 3-question level test → course → enroll → pay. */
export const SITE_FLOW: Flow = {
  start: 'hi',
  steps: {
    hi: { from: 'bot', typingMs: 700, replies: ['start', 'courses'], auto: 'start', autoMs: 1300 },
    courses: { from: 'bot', typingMs: 900, replies: ['start'], auto: 'start', autoMs: 1400 },
    q1: { from: 'bot', typingMs: 800, replies: ['go', 'goes', 'going'], auto: 'goes', autoMs: 1200 },
    q2: { from: 'bot', typingMs: 700, replies: ['see', 'saw', 'seen'], auto: 'saw', autoMs: 1100 },
    q3: { from: 'bot', typingMs: 700, replies: ['live', 'have', 'am'], auto: 'live', autoMs: 1200 },
    result: { from: 'bot', typingMs: 1100, replies: ['enroll', 'doubt'], auto: 'enroll', autoMs: 1500 },
    doubt: { from: 'bot', typingMs: 900, replies: ['enroll'], auto: 'enroll', autoMs: 1300 },
    pay: { from: 'bot', typingMs: 700, replies: ['card', 'transfer'], auto: 'card', autoMs: 1200 },
    paidCard: { from: 'bot', typingMs: 1000 },
    alias: { from: 'bot', typingMs: 900, next: 'paidTransfer' },
    paidTransfer: { from: 'note', typingMs: 1800 },
  },
  goto: {
    start: 'q1',
    courses: 'courses',
    go: 'q2',
    goes: 'q2',
    going: 'q2',
    see: 'q3',
    saw: 'q3',
    seen: 'q3',
    live: 'result',
    have: 'result',
    am: 'result',
    enroll: 'pay',
    doubt: 'doubt',
    card: 'paidCard',
    transfer: 'alias',
  },
};
/** Right answers of the level test. */
export const SITE_RIGHT: Record<string, string> = { q1: 'goes', q2: 'saw', q3: 'have' };

/** Martín's nudge on WhatsApp (his phone: the school writes, he answers). */
export const WA_FLOW: Flow = {
  start: 'nudge',
  steps: {
    nudge: { from: 'bot', typingMs: 500, replies: ['yes', 'later'], auto: 'yes', autoMs: 2600 },
    go: { from: 'bot', typingMs: 800, next: 'done' },
    done: { from: 'note', typingMs: 5200 },
    tomorrow: { from: 'bot', typingMs: 800, next: 'noteLater' },
    noteLater: { from: 'note', typingMs: 500 },
  },
  goto: { yes: 'go', later: 'tomorrow' },
};

/** A chat script from a flow + per-locale content (`auto: false` drops the automatic answers). */
export function scriptFrom(
  flow: Flow,
  content: (step: string) => Partial<ChatScript['steps'][string]> = () => ({}),
  replyLabel: (step: string, id: string) => string = (_s, id) => id,
  options: { auto?: boolean } = {},
): ChatScript {
  const auto = options.auto ?? true;
  const steps: ChatScript['steps'] = {};
  for (const [id, s] of Object.entries(flow.steps)) {
    steps[id] = {
      from: s.from,
      typingMs: s.typingMs,
      pauseMs: s.pauseMs,
      next: s.next,
      auto: auto ? s.auto : undefined,
      autoMs: s.autoMs,
      replies: s.replies?.map((r) => ({ id: r, label: replyLabel(id, r), goto: flow.goto[r] })),
      ...content(id),
    };
  }
  return { start: flow.start, steps };
}

/** Voice script of a speaking session (texts per locale, one per line). */
export function speakScript(texts: string[]): VoiceScript {
  return { ringMs: SPEAK_FLOW.ringMs, lines: SPEAK_FLOW.lines.map((l, i) => ({ ...l, text: texts[i] ?? '' })) };
}

const SHAPE = { siteMine: scriptFrom(SITE_FLOW, undefined, undefined, { auto: false }) };
const SPEAK_END = runVoice(speakScript([]), 0).endsAt;

/** Level, course and payment of a level-test chat (pure; shape only). */
function siteResult(run: ChatRun, mine: boolean, start: number): Enrollment | null {
  const right = Object.entries(SITE_RIGHT).filter(([step, answer]) => run.chosen[step] === answer).length;
  const level = right >= 3 ? 'B1' : right === 2 ? 'A2' : 'A1';
  const pay = run.chosen.pay as 'card' | 'transfer' | undefined;
  const paidStep = pay === 'card' ? 'paidCard' : pay === 'transfer' ? 'paidTransfer' : null;
  const rel = paidStep ? run.at[paidStep] : undefined;
  if (!pay || rel === undefined) return null;
  return { who: mine ? 'you' : 'julieta', level, course: NEXT_LEVEL[level], pay, at: start + rel };
}
export function siteLevel(run: ChatRun): 'A1' | 'A2' | 'B1' | null {
  if (!['q1', 'q2', 'q3'].every((q) => run.chosen[q])) return null;
  const right = Object.entries(SITE_RIGHT).filter(([step, answer]) => run.chosen[step] === answer).length;
  return right >= 3 ? 'B1' : right === 2 ? 'A2' : 'A1';
}
/** The enrollment a site chat produced by story time `t` (null: not paid yet). */
export function siteOutcome(site: SiteRun, t: number): Enrollment | null {
  if (!site.mine) return null;
  const run = runChat(SHAPE.siteMine, t - site.start, site.picks);
  return siteResult(run, true, site.start);
}

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
export type StudentTab = 'home' | 'course' | 'speak' | 'tutor' | 'class';

export type EventKind =
  | 'reminders'
  | 'lesson'
  | 'speaking'
  | 'complete'
  | 'levelUp'
  | 'review'
  | 'booked'
  | 'test'
  | 'level'
  | 'enrolled'
  | 'flagged'
  | 'nudge'
  | 'replied'
  | 'later'
  | 'back'
  | 'dropped'
  | 'paid';

export interface AcademyEvent {
  id: string;
  /** Story time (negative: before the story; `clock` says when). */
  at: number;
  kind: EventKind;
  who?: StudentId | 'you';
  level?: string;
  course?: CefrLevel;
  pay?: 'card' | 'transfer';
  score?: number;
  clock?: number;
}

export interface SpeakSession {
  prompt: PromptId;
  start: number;
  state: VoiceState;
  /** The first session of the loop (the lesson's), or a replay. */
  replay: boolean;
}

export interface AcademyScripts {
  tutor: ChatScript;
  site: ChatScript;
  siteMine: ChatScript;
  wa: ChatScript;
  speak: (prompt: PromptId) => VoiceScript;
}

export interface LeaderEntry {
  id: StudentId;
  points: number;
  delta: number;
}

export interface AcademyView {
  t: number;
  clock: number;
  /* Valentina */
  speak: SpeakSession;
  /** Story time the lesson's speaking session ends. */
  speakEnd: number;
  /** The prompt picker is open (no session running). */
  canPick: boolean;
  /** The prompt chosen for the lesson's session (null: not yet). */
  prompt: PromptId | null;
  tutor: ChatRun;
  answer: 'right' | 'wrong' | null;
  completeAt: number | null;
  levelUpAt: number | null;
  level: 'A2' | 'B1';
  /** Progress through the current level (0–1). */
  progress: number;
  streak: number;
  minutes: number;
  points: number;
  rank: number;
  board: LeaderEntry[];
  badges: { id: BadgeId; earned: boolean; fresh: boolean; progress: number }[];
  booked: number | null;
  scene: { tab: StudentTab; overlay: boolean };
  /* The site and enrollments */
  site: ChatRun;
  siteMine: boolean;
  siteLevel: 'A1' | 'A2' | 'B1' | null;
  enrollments: Enrollment[];
  /* Martín */
  martin: { status: 'idle' | 'flagged' | 'nudged' | 'replied' | 'later' | 'back' | 'dropped'; wa: ChatRun | null; nudged: boolean };
  /* The school's numbers */
  kpi: { active: number; atRisk: number; onTrack: number; completion: number; enrollments: number; feesPaid: number; online: number };
  events: AcademyEvent[];
}

export function deriveAcademy(state: AcademyState, t: number, instant: boolean, scripts: AcademyScripts): AcademyView {
  const events: AcademyEvent[] = [{ id: 'reminders', at: -1, kind: 'reminders', clock: 19 * 60 }];

  /* ---- Speaking: the lesson's session (auto prompt unless picked first), then replays ---- */
  const early = state.prompts.find((p) => p.at < STORY.promptAuto);
  const first = { prompt: early?.prompt ?? ('weekend' as PromptId), start: early ? early.at + 300 : STORY.call };
  const speakEnd = first.start + SPEAK_END;
  const sessions = [
    first,
    ...state.prompts.filter((p) => p !== early && p.at >= speakEnd).map((p) => ({ prompt: p.prompt, start: p.at + 300 })),
  ];
  const current = [...sessions].reverse().find((s) => s.start <= t) ?? first;
  const speakState = runVoice(scripts.speak(current.prompt), t - current.start, { instant: instant && current === first });
  const speak: SpeakSession = { prompt: current.prompt, start: current.start, state: speakState, replay: current !== first };
  const canPick = t < first.start || speakState.phase === 'ended';
  events.push({ id: 'lesson', at: STORY.open, kind: 'lesson', who: 'valentina' });
  if (t >= speakEnd) events.push({ id: 'speaking', at: speakEnd, kind: 'speaking', who: 'valentina', score: SPEAK_SCORE[first.prompt].total });

  /* ---- Writing with the tutor → lesson complete → level up ---- */
  const tutor = runChat(scripts.tutor, t - STORY.writing, state.tutorPicks, { instant });
  const quiz = tutor.chosen.quiz;
  const answer = quiz ? (quiz === 'bought' ? 'right' : 'wrong') : null;
  const resultRel = tutor.at.right ?? tutor.at.wrong;
  const resultAt = resultRel !== undefined ? STORY.writing + resultRel : null;
  const completeAt = resultAt !== null ? resultAt + STORY.completeDelay : null;
  const complete = completeAt !== null && t >= completeAt;
  const passed = answer === 'right';
  const levelUpAt = completeAt !== null && passed ? completeAt + 400 : null;
  const leveled = levelUpAt !== null && t >= levelUpAt;
  if (complete) events.push({ id: 'complete', at: completeAt, kind: 'complete', who: 'valentina' });
  if (leveled) events.push({ id: 'levelUp', at: levelUpAt, kind: 'levelUp', who: 'valentina', level: 'B1' });
  if (complete && !passed) events.push({ id: 'review', at: completeAt + 400, kind: 'review', who: 'valentina' });

  let booked: number | null = null;
  if (levelUpAt !== null && t >= levelUpAt) booked = state.booked !== null ? Math.max(state.booked, levelUpAt) : t >= STORY.book ? STORY.book : null;
  if (booked !== null && t >= booked) events.push({ id: 'booked', at: booked, kind: 'booked', who: 'valentina' });

  /* ---- Martín: flagged → nudged (automation on) → back, or drops out ---- */
  const nudged = isOn(state.off, STORY.nudge);
  let martin: AcademyView['martin'] = { status: 'idle', wa: null, nudged };
  let martinBackAt: number | null = null;
  if (t >= STORY.flag) {
    events.push({ id: 'flagged', at: STORY.flag, kind: 'flagged', who: 'martin' });
    martin = { ...martin, status: 'flagged' };
  }
  if (nudged) {
    const wa = runChat(scripts.wa, t - STORY.nudge, state.waPicks, { instant });
    if (wa.items.length) {
      events.push({ id: 'nudge', at: STORY.nudge + (wa.at.nudge ?? 0), kind: 'nudge', who: 'martin' });
      martin = { ...martin, status: 'nudged', wa };
    }
    const reply = wa.chosen.nudge;
    const replyItem = wa.items.find((i) => i.id === 'nudge:reply');
    if (reply && replyItem) {
      events.push({ id: 'replied', at: STORY.nudge + replyItem.at, kind: reply === 'yes' ? 'replied' : 'later', who: 'martin' });
      martin = { ...martin, status: reply === 'yes' ? 'replied' : 'later' };
    }
    if (wa.at.done !== undefined) {
      martinBackAt = STORY.nudge + wa.at.done;
      events.push({ id: 'back', at: martinBackAt, kind: 'back', who: 'martin' });
      martin = { ...martin, status: 'back' };
    }
  } else if (t >= STORY.drop) {
    events.push({ id: 'dropped', at: STORY.drop, kind: 'dropped', who: 'martin' });
    martin = { ...martin, status: 'dropped' };
  }
  const dropped = martin.status === 'dropped';

  /* ---- The site: level test → course → enrollment ---- */
  // Julieta's test always plays (on the site, in the background once the visitor takes their own).
  const lead = runChat(scripts.site, t - STORY.lead, {}, { instant });
  const leadLevel = siteLevel(lead);
  const leadEnrolled = siteResult(lead, false, STORY.lead);
  if (lead.items.length) events.push({ id: 'test', at: STORY.lead + (lead.at.hi ?? 0), kind: 'test', who: 'julieta' });
  if (leadLevel && lead.at.result !== undefined) events.push({ id: 'level-lead', at: STORY.lead + lead.at.result, kind: 'level', who: 'julieta', level: leadLevel });
  // The visitor's own test (when they took over or started one).
  const mineRun = state.site.mine ? runChat(scripts.siteMine, t - state.site.start, state.site.picks) : null;
  const mineLevel = mineRun ? siteLevel(mineRun) : null;
  const mineEnrolled = mineRun ? siteResult(mineRun, true, state.site.start) : null;
  if (mineRun && mineLevel && mineRun.at.result !== undefined) {
    events.push({ id: `level-you-${state.site.start}`, at: state.site.start + mineRun.at.result, kind: 'level', who: 'you', level: mineLevel });
  }
  const site = mineRun ?? lead;
  const level = mineRun ? mineLevel : leadLevel;
  const enrollments = [...state.enrolled, ...(leadEnrolled ? [leadEnrolled] : []), ...(mineEnrolled ? [mineEnrolled] : [])];
  for (const e of enrollments) {
    if (e.at < 0) continue;
    events.push({ id: `enrolled-${e.who}-${e.at}`, at: e.at, kind: 'enrolled', who: e.who, level: e.level, course: e.course, pay: e.pay });
  }

  /* ---- Fees arriving ---- */
  let feesPaid = SCHOOL.feesPaid;
  for (const p of STORY.paid) {
    if (t < p.at) continue;
    feesPaid += 1;
    events.push({ id: `paid-${p.id}`, at: p.at, kind: 'paid', who: p.id, pay: p.via });
  }
  feesPaid += enrollments.length;

  events.sort((a, b) => a.at - b.at);

  /* ---- Valentina's numbers ---- */
  const quizAt = STORY.writing + (tutor.at.right ?? tutor.at.wrong ?? Infinity);
  const points =
    HERO.points +
    (t >= speakEnd ? POINTS.speaking : 0) +
    (answer && t >= quizAt ? (passed ? POINTS.right : POINTS.wrong) : 0) +
    (complete ? POINTS.lesson + POINTS.streak : 0);
  const martinPoints = CLASSMATES.find((c) => c.id === 'martin')!.points + (martinBackAt !== null && t >= martinBackAt ? MARTIN_BACK_POINTS : 0);
  const pointsBefore = HERO.points;
  const rankOf = (list: LeaderEntry[]) => list.findIndex((e) => e.id === 'valentina') + 1;
  const sortBoard = (list: LeaderEntry[]) => [...list].sort((a, b) => b.points - a.points);
  const startBoard = sortBoard([{ id: 'valentina', points: pointsBefore, delta: 0 }, ...CLASSMATES.map((c) => ({ id: c.id, points: c.points, delta: 0 }))]);
  const board = sortBoard([
    { id: 'valentina', points, delta: 0 },
    ...CLASSMATES.map((c) => ({ id: c.id, points: c.id === 'martin' ? (dropped ? 0 : martinPoints) : c.points, delta: 0 })),
  ])
    .filter((e) => !(dropped && e.id === 'martin'))
    .map((e, i) => {
      const before = startBoard.findIndex((s) => s.id === e.id);
      return { ...e, delta: before - i };
    });

  const sessionsDone = HERO.speakingSessions + (t >= speakEnd ? 1 : 0);
  const fresh = (at: number | null) => at !== null && t >= at && t - at < 2600;
  const badges: AcademyView['badges'] = [
    { id: 'levelB1', earned: leveled, fresh: fresh(levelUpAt), progress: complete ? (passed ? 1 : 0.97) : HERO.a2 },
    { id: 'speak10', earned: sessionsDone >= 10, fresh: fresh(speakEnd), progress: sessionsDone / 10 },
    { id: 'streak7', earned: true, fresh: false, progress: 1 },
    { id: 'firstLive', earned: true, fresh: false, progress: 1 },
    { id: 'words', earned: true, fresh: false, progress: 1 },
    { id: 'streak30', earned: false, fresh: false, progress: (HERO.streak + (complete ? 1 : 0)) / 30 },
  ];

  /* ---- Valentina's phone, driven by the story ---- */
  const scene: AcademyView['scene'] = { tab: 'home', overlay: false };
  if (t >= STORY.open) scene.tab = 'speak';
  if (t >= STORY.writing) scene.tab = 'tutor';
  if (completeAt !== null && t >= completeAt) {
    if (t < completeAt + STORY.levelUpFor) scene.overlay = true;
    else scene.tab = 'class';
  }

  /* ---- The school's numbers ---- */
  const newStudents = enrollments.length;
  const kpi = {
    active: SCHOOL.active + newStudents - (dropped ? 1 : 0),
    atRisk: SCHOOL.atRisk - (martin.status === 'back' || dropped ? 1 : 0),
    onTrack: SCHOOL.onTrack - (dropped ? 1 : 0),
    completion: (SCHOOL.onTrack - (dropped ? 1 : 0)) / SCHOOL.cohort,
    enrollments: SCHOOL.enrollments + newStudents,
    feesPaid,
    online: SCHOOL.onlineNow + Math.round(Math.sin(t / 4000) * 2) + (lead.items.length && !lead.done ? 1 : 0),
  };

  return {
    t,
    clock: storyClock(t),
    speak,
    speakEnd,
    canPick,
    prompt: early?.prompt ?? (t >= STORY.promptAuto ? 'weekend' : null),
    tutor,
    answer,
    completeAt,
    levelUpAt,
    level: leveled ? 'B1' : 'A2',
    progress: leveled ? 0.04 : complete ? 0.97 : HERO.a2,
    streak: HERO.streak + (complete ? 1 : 0),
    minutes: HERO.minutes + (complete ? HERO.lesson : 0),
    points,
    rank: rankOf(board),
    board,
    badges,
    booked,
    scene,
    site,
    siteMine: state.site.mine,
    siteLevel: level,
    enrollments,
    martin,
    kpi,
    events,
  };
}
