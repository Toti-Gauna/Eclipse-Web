/**
 * Atrio Idiomas — the story and everything derived from it.
 *
 * One store per showcase (laptop + phone share it) holds only what the visitor did;
 * every screen DERIVES the evening from (story time t, that state) with `deriveAcademy`,
 * which is pure: pausing, reduced motion and two screens in sync come for free.
 *
 * Nothing plays on its own (v3). Five beats from the SimBar (data.ts BEATS), 20:10 → 20:39:
 *  1 speak — Valentina's speaking session with the AI tutor (it catches "sink" → "think").
 *  2 writing — she writes a sentence, the tutor corrects it and leaves a mini exercise.
 *  3 levelup — she answers → lesson complete: streak 12, A2 → B1, she climbs in her class
 *    ranking and books the B1 conversation club.
 *  4 lead — a prospect (Julieta) takes the level test on the site, enrolls and pays.
 *  5 nudge — Martín (5 days away) gets a WhatsApp with a 5-minute lesson and comes back:
 *    completion holds at 82 %. With the nudges off he drops out (80 %).
 * What the visitor does is stamped with `t` and shows at once: pick the speaking topic and
 * start the session, answer the exercise (a wrong answer leaves B1 for tomorrow), ask the
 * tutor, book the club, take the level test and enroll, answer as Martín, move cards on the
 * follow-up board, or switch the nudges off.
 */
import { createDemoStore, runChat, runVoice, type ChatPick, type ChatRun, type ChatScript, type DemoStore, type VoiceScript, type VoiceState } from '../kit';
import {
  BEATS,
  CLASSMATES,
  HERO,
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
  type StoryPick,
  type StudentId,
} from './data';

/* ------------------------------------------------------------------ */
/* State (what the visitor did) + store                                 */
/* ------------------------------------------------------------------ */
export interface Range {
  from: number;
  to: number | null;
}
export interface Enrollment {
  who: 'julieta' | 'you';
  level: 'A1' | 'A2' | 'B1';
  course: CefrLevel;
  pay: 'card' | 'transfer';
  /** Story time it was paid. */
  at: number;
  /** The visitor did it (no "just now" window on the frozen clock). */
  mine?: boolean;
}
export type AskId = 'past' | 'th' | 'more';
export const ASKS: AskId[] = ['past', 'th', 'more'];
export type BoardColumn = 'risk' | 'nudged' | 'back';

export interface AcademyState {
  /** The topic the visitor picked for the lesson's speaking session. */
  prompt: PromptId | null;
  /** Extra sessions the visitor started after the lesson's one (they show their result at once). */
  replays: { prompt: PromptId; at: number }[];
  /** Valentina's exercise, answered by the visitor (chat time). */
  tutorPicks: Record<string, ChatPick>;
  /** Quick questions the visitor asked the tutor (answered at once). */
  asks: AskId[];
  /** Julieta's level test: the visitor's answers as her (chat time). */
  leadPicks: Record<string, ChatPick>;
  /** The visitor's own level test ("Hacé el test vos"), started at `start`. */
  siteMine: { start: number; picks: Record<string, ChatPick> } | null;
  /** The visitor's earlier own enrollments (when they take the test again). */
  enrolled: Enrollment[];
  /** Martín's WhatsApp: the visitor's answers as Martín (chat time). */
  waPicks: Record<string, ChatPick>;
  /** When the nudge automation was off (story time). */
  off: Range[];
  /** The visitor booked Valentina's B1 club (story time). */
  booked: number | null;
  /** Follow-up board: cards the visitor moved (column + story time). */
  moved: Record<string, { column: BoardColumn; at: number }>;
}

export const freshAcademy = (): AcademyState => ({
  prompt: null,
  replays: [],
  tutorPicks: {},
  asks: [],
  leadPicks: {},
  siteMine: null,
  enrolled: [],
  waPicks: {},
  off: [],
  booked: null,
  moved: {},
});

export type AcademyStore = DemoStore<AcademyState>;

/** Module-level (stable) factory for usePairedStore. Beats: no autoplay; "Reiniciar" = a fresh evening. */
export function createAcademyStore(paired: boolean): AcademyStore {
  return createDemoStore<AcademyState>(freshAcademy(), { beats: BEATS, paired, reset: freshAcademy });
}

export const isOn = (ranges: Range[], at: number) => !ranges.some((r) => at >= r.from && (r.to === null || at < r.to));
export const isOffNow = (ranges: Range[]) => ranges.some((r) => r.to === null);

/** State updates (use with `store.update(...)`; `t` is the store's story time). */
export const act = {
  pickPrompt: (prompt: PromptId) => (s: AcademyState): AcademyState => ({ ...s, prompt }),
  /** Practice again after the lesson's session: the result shows at once. */
  replay: (prompt: PromptId) => (s: AcademyState, t: number): AcademyState => ({ ...s, replays: [...s.replays, { prompt, at: t }] }),
  pickTutor: (step: string, reply: string) => (s: AcademyState, t: number): AcademyState => ({
    ...s,
    tutorPicks: { ...s.tutorPicks, [step]: { reply, at: t - STORY.writing } },
  }),
  ask: (id: AskId) => (s: AcademyState): AcademyState => (s.asks.includes(id) ? s : { ...s, asks: [...s.asks, id] }),
  pickLead: (step: string, reply: string) => (s: AcademyState, t: number): AcademyState => ({
    ...s,
    leadPicks: { ...s.leadPicks, [step]: { reply, at: t - STORY.lead } },
  }),
  /** "Hacé el test vos": a fresh test (a finished one of yours is kept as an enrollment). */
  startSite: (previous: Enrollment | null) => (s: AcademyState, t: number): AcademyState => ({
    ...s,
    enrolled: previous ? [...s.enrolled, previous] : s.enrolled,
    siteMine: { start: t, picks: {} },
  }),
  pickSite: (step: string, reply: string) => (s: AcademyState, t: number): AcademyState =>
    s.siteMine ? { ...s, siteMine: { ...s.siteMine, picks: { ...s.siteMine.picks, [step]: { reply, at: t - s.siteMine.start } } } } : s,
  pickWa: (step: string, reply: string, sentAt: number) => (s: AcademyState, t: number): AcademyState => ({
    ...s,
    waPicks: { ...s.waPicks, [step]: { reply, at: t - sentAt } },
  }),
  toggleNudge: () => (s: AcademyState, t: number): AcademyState => {
    const next = isOffNow(s.off) ? s.off.map((r) => (r.to === null ? { ...r, to: t } : r)) : [...s.off, { from: t, to: null }];
    return { ...s, off: next };
  },
  book: () => (s: AcademyState, t: number): AcademyState => (s.booked === null ? { ...s, booked: t } : s),
  moveCard: (id: string, column: BoardColumn) => (s: AcademyState, t: number): AcademyState => ({ ...s, moved: { ...s.moved, [id]: { column, at: t } } }),
};

/* ------------------------------------------------------------------ */
/* Script shapes (timing here; texts per locale in scripts.tsx)         */
/* ------------------------------------------------------------------ */
type FlowStep = { from: 'bot' | 'user' | 'note'; typingMs?: number; pauseMs?: number; next?: string; replies?: readonly string[] };
export type Flow = { start: string; steps: Record<string, FlowStep>; goto: Record<string, string> };

/** Valentina writes, the tutor corrects and gives her a mini exercise (no automatic answers). */
export const TUTOR_FLOW: Flow = {
  start: 'msg',
  steps: {
    msg: { from: 'user', typingMs: 300, pauseMs: 250, next: 'fix' },
    fix: { from: 'bot', typingMs: 1000, pauseMs: 250, next: 'quiz' },
    quiz: { from: 'bot', typingMs: 800, replies: ['bought', 'buyed', 'buys'] },
    right: { from: 'bot', typingMs: 700 },
    wrong: { from: 'bot', typingMs: 700 },
  },
  goto: { bought: 'right', buyed: 'wrong', buys: 'wrong' },
};

/** The site's chatbot: a 3-question level test → course → enroll → pay. */
export const SITE_FLOW: Flow = {
  start: 'hi',
  steps: {
    hi: { from: 'bot', typingMs: 700, replies: ['start', 'courses'] },
    courses: { from: 'bot', typingMs: 900, replies: ['start'] },
    q1: { from: 'bot', typingMs: 800, replies: ['go', 'goes', 'going'] },
    q2: { from: 'bot', typingMs: 700, replies: ['see', 'saw', 'seen'] },
    q3: { from: 'bot', typingMs: 700, replies: ['live', 'have', 'am'] },
    result: { from: 'bot', typingMs: 1100, replies: ['enroll', 'doubt'] },
    doubt: { from: 'bot', typingMs: 900, replies: ['enroll'] },
    pay: { from: 'bot', typingMs: 700, replies: ['card', 'transfer'] },
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
    nudge: { from: 'bot', typingMs: 500, replies: ['yes', 'later'] },
    go: { from: 'bot', typingMs: 800, next: 'done' },
    done: { from: 'note', typingMs: 2500 },
    tomorrow: { from: 'bot', typingMs: 800, next: 'noteLater' },
    noteLater: { from: 'note', typingMs: 500 },
  },
  goto: { yes: 'go', later: 'tomorrow' },
};

/** A chat script from a flow + per-locale content. */
export function scriptFrom(
  flow: Flow,
  content: (step: string) => Partial<ChatScript['steps'][string]> = () => ({}),
  replyLabel: (step: string, id: string) => string = (_s, id) => id,
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

/** Voice script of a speaking session (texts per locale, one per line). */
export function speakScript(texts: string[]): VoiceScript {
  return { ringMs: SPEAK_FLOW.ringMs, lines: SPEAK_FLOW.lines.map((l, i) => ({ ...l, text: texts[i] ?? '' })) };
}

/** Timing-only scripts (tests, and anything that only needs to know when things happen). */
export const TIMING_SCRIPTS: AcademyScripts = {
  tutor: scriptFrom(TUTOR_FLOW),
  site: scriptFrom(SITE_FLOW),
  siteMine: scriptFrom(SITE_FLOW),
  wa: scriptFrom(WA_FLOW),
  speak: () => speakScript([]),
};
export const SPEAK_END = runVoice(speakScript([]), 0).endsAt;

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

/** Level of a level-test chat once the three questions are answered. */
export function siteLevel(run: ChatRun): 'A1' | 'A2' | 'B1' | null {
  if (!['q1', 'q2', 'q3'].every((q) => run.chosen[q])) return null;
  const right = Object.entries(SITE_RIGHT).filter(([step, answer]) => run.chosen[step] === answer).length;
  return right >= 3 ? 'B1' : right === 2 ? 'A2' : 'A1';
}
/** The enrollment a level-test chat produced (null: not paid yet). */
export function siteResult(run: ChatRun, who: 'julieta' | 'you', start: number, mine: boolean): Enrollment | null {
  const level = siteLevel(run) ?? 'A1';
  const pay = run.chosen.pay as 'card' | 'transfer' | undefined;
  const paidStep = pay === 'card' ? 'paidCard' : pay === 'transfer' ? 'paidTransfer' : null;
  const rel = paidStep ? run.at[paidStep] : undefined;
  if (!pay || rel === undefined) return null;
  return { who, level, course: NEXT_LEVEL[level], pay, at: start + rel, mine };
}

/* ------------------------------------------------------------------ */
/* Derivation                                                           */
/* ------------------------------------------------------------------ */
export type { StudentTab } from './data';

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
  | 'paid'
  | 'moved';

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
  column?: BoardColumn;
  /** The visitor did it (no toast / "just now" window on the frozen clock). */
  mine?: boolean;
}

export interface SpeakSession {
  prompt: PromptId;
  start: number;
  state: VoiceState;
  /** A practice the visitor started after the lesson's session (shown at once). */
  replay: boolean;
}

export interface AcademyScripts {
  tutor: ChatScript;
  /** The level test: Julieta's (story) and the visitor's own (cards read their own level). */
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

export interface BoardCard {
  id: StudentId;
  column: BoardColumn;
  /** Martín dropped out (nudges off). */
  dropped?: boolean;
  changedAt: number;
  /** Changed in a beat just now (halo). */
  fresh?: boolean;
}

export interface AcademyView {
  t: number;
  clock: number;
  /* Valentina */
  speak: SpeakSession;
  /** Story time the lesson's speaking session ends. */
  speakEnd: number;
  speakDone: boolean;
  /** The topic picker is open (no session running). */
  canPick: boolean;
  /** The topic of the lesson's session. */
  prompt: PromptId;
  tutor: ChatRun;
  /** The written practice started (beat 2). */
  writingStarted: boolean;
  answer: 'right' | 'wrong' | null;
  answerAt: number | null;
  completeAt: number | null;
  levelUpAt: number | null;
  /** The visitor answered the exercise themselves (they see the celebration at once). */
  answerMine: boolean;
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
  /* The site and enrollments */
  /** Julieta's test (the story's), and the visitor's own if they took one. */
  lead: ChatRun;
  siteMine: ChatRun | null;
  siteMineStart: number | null;
  /**
   * The site's chat (and the school's lane) show the visitor's own test (else Julieta's): the latest
   * one started wins — playing the lead beat after testing yourself shows Julieta taking hers.
   */
  siteShowMine: boolean;
  leadLevel: 'A1' | 'A2' | 'B1' | null;
  mineLevel: 'A1' | 'A2' | 'B1' | null;
  mineEnrollment: Enrollment | null;
  /** Today's enrollments, each with a stable `id` (repeat tests at rest share their time). */
  enrollments: (Enrollment & { id: string })[];
  /* Martín */
  martin: {
    status: 'idle' | 'flagged' | 'nudged' | 'replied' | 'later' | 'back' | 'dropped';
    wa: ChatRun | null;
    sentAt: number | null;
    nudged: boolean;
  };
  cards: BoardCard[];
  /* The school's numbers */
  kpi: { active: number; atRisk: number; onTrack: number; completion: number; enrollments: number; feesPaid: number; online: number };
  events: AcademyEvent[];
}

/** A story event that just happened (toasts, halos) — never the visitor's own (the clock is frozen). */
export const isFreshEvent = (t: number, e: { at: number; mine?: boolean }, ms = 2600) => !e.mine && e.at >= 0 && t >= e.at && t - e.at < ms;

export function deriveAcademy(state: AcademyState, t: number, instant: boolean, scripts: AcademyScripts): AcademyView {
  const events: AcademyEvent[] = [{ id: 'reminders', at: -1, kind: 'reminders', clock: 19 * 60 }];
  const push = (e: AcademyEvent) => {
    if (e.at <= t) events.push(e);
  };
  const fresh = (at: number | null, mine = false) => at !== null && isFreshEvent(t, { at, mine });

  /* ---- Speaking: the lesson's session (beat 1), then the visitor's replays (instant) ---- */
  const prompt = state.prompt ?? 'weekend';
  const speakEnd = STORY.call + SPEAK_END;
  const speakDone = t >= speakEnd;
  const replay = speakDone ? state.replays[state.replays.length - 1] : undefined;
  const speak: SpeakSession = replay
    ? { prompt: replay.prompt, start: replay.at, state: runVoice(scripts.speak(replay.prompt), t - replay.at, { instant: true }), replay: true }
    : { prompt, start: STORY.call, state: runVoice(scripts.speak(prompt), t - STORY.call, { instant }), replay: false };
  const canPick = t < STORY.call || speakDone;
  if (t >= STORY.call) push({ id: 'lesson', at: STORY.call, kind: 'lesson', who: 'valentina' });
  if (speakDone) push({ id: 'speaking', at: speakEnd, kind: 'speaking', who: 'valentina', score: SPEAK_SCORE[prompt].total });

  /* ---- Writing with the tutor (beat 2) → the exercise (beat 3 or the visitor) → level up ---- */
  const answerMine = !!state.tutorPicks.quiz;
  const tutorPicks = chatPicks([STORY.quizPick], STORY.writing, state.tutorPicks, t);
  const tutor = runChat(scripts.tutor, t - STORY.writing, tutorPicks, { instant, instantAfterPick: answerMine });
  const quiz = tutor.chosen.quiz;
  const answer = quiz ? (quiz === 'bought' ? 'right' : 'wrong') : null;
  const resultRel = tutor.at.right ?? tutor.at.wrong;
  const answerAt = resultRel !== undefined ? STORY.writing + resultRel : null;
  const completeAt = answerAt !== null ? answerAt + (answerMine ? 0 : STORY.completeDelay) : null;
  const complete = completeAt !== null && t >= completeAt;
  const passed = answer === 'right';
  const levelUpAt = completeAt !== null && passed ? completeAt + (answerMine ? 0 : STORY.levelUpDelay) : null;
  const leveled = levelUpAt !== null && t >= levelUpAt;
  if (complete) push({ id: 'complete', at: completeAt, kind: 'complete', who: 'valentina', mine: answerMine });
  if (leveled) push({ id: 'levelUp', at: levelUpAt, kind: 'levelUp', who: 'valentina', level: 'B1', mine: answerMine });
  if (complete && !passed) push({ id: 'review', at: completeAt + (answerMine ? 0 : 400), kind: 'review', who: 'valentina', mine: answerMine });

  let booked: number | null = null;
  if (leveled && levelUpAt !== null) {
    if (state.booked !== null) booked = Math.max(state.booked, levelUpAt);
    else if (t >= STORY.book && levelUpAt <= STORY.book) booked = STORY.book;
  }
  if (booked !== null) push({ id: 'booked', at: booked, kind: 'booked', who: 'valentina', mine: state.booked !== null });

  /* ---- The site (beat 4): Julieta's test, and the visitor's own ---- */
  const leadMine = Object.keys(state.leadPicks).length > 0;
  const lead = runChat(scripts.site, t - STORY.lead, chatPicks(STORY.leadPicks, STORY.lead, state.leadPicks, t), { instant, instantAfterPick: leadMine });
  const leadLevel = siteLevel(lead);
  const leadEnrolled = siteResult(lead, 'julieta', STORY.lead, leadMine);
  if (lead.items.length) push({ id: 'test', at: STORY.lead + (lead.at.hi ?? 0), kind: 'test', who: 'julieta' });
  if (leadLevel && lead.at.result !== undefined) push({ id: 'level-lead', at: STORY.lead + lead.at.result, kind: 'level', who: 'julieta', level: leadLevel, mine: leadMine });
  const mineStart = state.siteMine?.start ?? null;
  const siteMine = state.siteMine ? runChat(scripts.siteMine, t - state.siteMine.start, state.siteMine.picks, { instant: true }) : null;
  const mineLevel = siteMine ? siteLevel(siteMine) : null;
  const mineEnrollment = siteMine && mineStart !== null ? siteResult(siteMine, 'you', mineStart, true) : null;
  if (siteMine && mineLevel && mineStart !== null && siteMine.at.result !== undefined) {
    push({ id: `level-you-${mineStart}`, at: mineStart + siteMine.at.result, kind: 'level', who: 'you', level: mineLevel, mine: true });
  }
  // Ids by position, not time: at rest the clock is frozen, so the visitor's repeat tests share `at`.
  const enrollments = [
    ...state.enrolled.map((e, k) => ({ ...e, id: `you-${k}` })),
    ...(leadEnrolled ? [{ ...leadEnrolled, id: 'julieta' }] : []),
    ...(mineEnrollment ? [{ ...mineEnrollment, id: `you-${state.enrolled.length}` }] : []),
  ].filter((e) => e.at <= t);
  for (const e of enrollments) push({ id: `enrolled-${e.id}`, at: e.at, kind: 'enrolled', who: e.who, level: e.level, course: e.course, pay: e.pay, mine: e.mine });

  /* ---- Martín (beat 5): flagged → nudged (automation on) → back, or drops out ---- */
  const flagged = t >= STORY.flag;
  const nudged = isOn(state.off, STORY.nudge);
  const sentAt = nudged && t >= STORY.nudge ? STORY.nudge : null;
  let martin: AcademyView['martin'] = { status: flagged ? 'flagged' : 'idle', wa: null, sentAt, nudged };
  let martinBackAt: number | null = null;
  if (flagged) push({ id: 'flagged', at: STORY.flag, kind: 'flagged', who: 'martin' });
  if (sentAt !== null) {
    const waMine = Object.keys(state.waPicks).length > 0;
    const wa = runChat(scripts.wa, t - sentAt, chatPicks([STORY.waPick], sentAt, state.waPicks, t), { instant, instantAfterPick: waMine });
    if (wa.items.length) {
      push({ id: 'nudge', at: sentAt + (wa.at.nudge ?? 0), kind: 'nudge', who: 'martin' });
      martin = { ...martin, status: 'nudged', wa };
    } else martin = { ...martin, wa };
    const reply = wa.chosen.nudge;
    const replyItem = wa.items.find((i) => i.id === 'nudge:reply');
    if (reply && replyItem) {
      push({ id: 'replied', at: sentAt + replyItem.at, kind: reply === 'yes' ? 'replied' : 'later', who: 'martin', mine: waMine });
      martin = { ...martin, status: reply === 'yes' ? 'replied' : 'later' };
    }
    if (wa.at.done !== undefined) {
      martinBackAt = sentAt + wa.at.done;
      push({ id: 'back', at: martinBackAt, kind: 'back', who: 'martin', mine: waMine });
      martin = { ...martin, status: 'back' };
    }
  } else if (t >= STORY.drop) {
    push({ id: 'dropped', at: STORY.drop, kind: 'dropped', who: 'martin' });
    martin = { ...martin, status: 'dropped' };
  }
  const dropped = martin.status === 'dropped';

  /* ---- Follow-up board (students falling behind) ---- */
  const base: BoardCard[] = [
    { id: 'tomas', column: 'risk', changedAt: -Infinity },
    { id: 'joaquin', column: 'nudged', changedAt: -Infinity },
    { id: 'renata', column: 'back', changedAt: -Infinity },
  ];
  if (flagged) {
    const m: BoardCard = { id: 'martin', column: 'risk', changedAt: STORY.flag, dropped };
    if (dropped) m.changedAt = STORY.drop;
    if (sentAt !== null && martin.wa?.items.length) {
      m.column = 'nudged';
      m.changedAt = sentAt;
    }
    if (martinBackAt !== null) {
      m.column = 'back';
      m.changedAt = martinBackAt;
    }
    base.unshift(m);
  }
  const cards = base.map((c) => {
    const mv = state.moved[c.id];
    const card = mv && mv.at >= c.changedAt ? { ...c, column: mv.column, changedAt: mv.at } : c;
    return { ...card, fresh: !(mv && mv.at >= c.changedAt) && fresh(c.changedAt) };
  });
  for (const [id, mv] of Object.entries(state.moved)) push({ id: `moved-${id}-${mv.at}`, at: mv.at, kind: 'moved', who: id as StudentId, column: mv.column, mine: true });

  /* ---- Fees arriving (inside beats 4 and 5) ---- */
  let feesPaid = SCHOOL.feesPaid;
  for (const p of STORY.paid) {
    if (t < p.at) continue;
    feesPaid += 1;
    push({ id: `paid-${p.id}`, at: p.at, kind: 'paid', who: p.id, pay: p.via });
  }
  feesPaid += enrollments.length;

  events.sort((a, b) => a.at - b.at);

  /* ---- Valentina's numbers ---- */
  const points =
    HERO.points +
    (speakDone ? POINTS.speaking : 0) +
    (answer && answerAt !== null && t >= answerAt ? (passed ? POINTS.right : POINTS.wrong) : 0) +
    (complete ? POINTS.lesson + POINTS.streak : 0);
  const martinPoints = CLASSMATES.find((c) => c.id === 'martin')!.points + (martinBackAt !== null && t >= martinBackAt ? MARTIN_BACK_POINTS : 0);
  const rankOf = (list: LeaderEntry[]) => list.findIndex((e) => e.id === 'valentina') + 1;
  const sortBoard = (list: LeaderEntry[]) => [...list].sort((a, b) => b.points - a.points);
  const startBoard = sortBoard([{ id: 'valentina', points: HERO.points, delta: 0 }, ...CLASSMATES.map((c) => ({ id: c.id, points: c.points, delta: 0 }))]);
  const board = sortBoard([
    { id: 'valentina', points, delta: 0 },
    ...CLASSMATES.map((c) => ({ id: c.id, points: c.id === 'martin' ? martinPoints : c.points, delta: 0 })),
  ])
    .filter((e) => !(dropped && e.id === 'martin'))
    .map((e, i) => ({ ...e, delta: startBoard.findIndex((s) => s.id === e.id) - i }));

  const sessionsDone = HERO.speakingSessions + (speakDone ? 1 : 0);
  const badges: AcademyView['badges'] = [
    { id: 'levelB1', earned: leveled, fresh: fresh(levelUpAt, answerMine), progress: complete ? (passed ? 1 : 0.97) : HERO.a2 },
    { id: 'speak10', earned: sessionsDone >= 10, fresh: fresh(speakEnd), progress: sessionsDone / 10 },
    { id: 'streak7', earned: true, fresh: false, progress: 1 },
    { id: 'firstLive', earned: true, fresh: false, progress: 1 },
    { id: 'words', earned: true, fresh: false, progress: 1 },
    { id: 'streak30', earned: false, fresh: false, progress: (HERO.streak + (complete ? 1 : 0)) / 30 },
  ];

  /* ---- The school's numbers ---- */
  const newStudents = enrollments.length;
  const leadTesting = lead.items.length > 0 && !lead.done;
  const kpi = {
    active: SCHOOL.active + newStudents - (dropped ? 1 : 0),
    atRisk: SCHOOL.atRisk - (martin.status === 'back' || dropped ? 1 : 0),
    onTrack: SCHOOL.onTrack - (dropped ? 1 : 0),
    completion: (SCHOOL.onTrack - (dropped ? 1 : 0)) / SCHOOL.cohort,
    enrollments: SCHOOL.enrollments + newStudents,
    feesPaid,
    online: SCHOOL.onlineNow + (leadTesting ? 1 : 0),
  };

  return {
    t,
    clock: storyClock(t),
    speak,
    speakEnd,
    speakDone,
    canPick,
    prompt,
    tutor,
    writingStarted: t >= STORY.writing,
    answer,
    answerAt,
    completeAt,
    levelUpAt,
    answerMine,
    level: leveled ? 'B1' : 'A2',
    progress: leveled ? 0.04 : complete ? 0.97 : HERO.a2,
    streak: HERO.streak + (complete ? 1 : 0),
    minutes: HERO.minutes + (complete ? HERO.lesson : 0),
    points,
    rank: rankOf(board),
    board,
    badges,
    booked,
    lead,
    siteMine,
    siteMineStart: mineStart,
    siteShowMine: mineStart !== null && (mineStart >= STORY.lead || t < STORY.lead),
    leadLevel,
    mineLevel,
    mineEnrollment,
    enrollments,
    martin,
    cards,
    kpi,
    events,
  };
}
