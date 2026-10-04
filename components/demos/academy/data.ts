/**
 * Fictional data for "Atrio Idiomas — Demo": an online language school (English and
 * Portuguese for Spanish speakers). People, courses and lines are message keys
 * (namespace `demoAcademy`) so each locale names them. Nothing here is a real school,
 * exam brand or app.
 *
 * Time: minutes from midnight on Thursday 8 Oct 2026; the story starts at 20:10 and its
 * clock advances one minute every 2 s of story time — only while the visitor plays a beat.
 */
import type { DemoTheme, Tone } from '../kit';

/** Palette: chalkboard ink-blue · chalk · sky · salmon. Classroom & notebook, never green. */
export const ATRIO_THEME: DemoTheme = {
  mode: 'dark',
  bg: '#172338',
  surface: '#1E2C45',
  sunken: '#121C2D',
  ink: '#F3F0E6',
  muted: '#9DA9BE',
  line: 'rgb(243 240 230 / 0.12)',
  accent: '#7CC8F5',
  accentInk: '#0E1A2B',
  accentText: '#7CC8F5',
  accent2: '#FF9F87',
  accent2Ink: '#1A1730',
  accent2Text: '#FF9F87',
  // Chalk colors: yellow = right, orange = careful, red = lost. (No green on purpose.)
  ok: '#F0D98A',
  warn: '#FFB86B',
  bad: '#FF8A94',
  info: '#A8DAF8',
  radius: '0.85em',
  display: { family: 'sans', weight: 620, tracking: '-0.035em' },
};

/* ------------------------------------------------------------------ */
/* The day and the story clock                                          */
/* ------------------------------------------------------------------ */
/** A reply the story gives on its own inside a beat (absolute story time), unless the visitor answered first. */
export interface StoryPick {
  step: string;
  reply: string;
  at: number;
}

/**
 * v3 beats (labels: demoAcademy.sim.<id>): nothing plays on its own. Each `at` is where the
 * segment ends, on a calm frame (no toast, typing, live session or "just now" left).
 * 1 speak — Valentina's speaking practice with the AI tutor (her "Empezar" button plays it too)
 * 2 writing — she writes, the tutor corrects her and leaves a mini exercise (it waits for an answer)
 * 3 levelup — she answers, finishes the lesson, moves up to B1 and books the B1 club
 * 4 lead — a prospect takes the level test on the site, enrolls and pays
 * 5 nudge — Martín, 5 days away, gets a WhatsApp with a 5-minute lesson and comes back
 */
export const BEATS = [
  { id: 'speak', at: 15_000 },
  { id: 'writing', at: 21_500 },
  { id: 'levelup', at: 30_000 },
  { id: 'lead', at: 46_500 },
  { id: 'nudge', at: 59_000 },
] as const;
export const STORY_END = BEATS[BEATS.length - 1].at;
/** 20:10 when the story starts. */
export const CLOCK_START = 20 * 60 + 10;
export const storyClock = (t: number) => CLOCK_START + Math.floor(Math.max(0, t) / 2000);
/** Thursday (UTC) — the class days are Tuesday and Thursday. */
export const TODAY = Date.UTC(2026, 9, 8);
export const dayDate = (offset: number) => new Date(TODAY + offset * 86_400_000);
/** Index of today in a Monday-first week. */
export const WEEKDAY = 3;

/** Story times (ms). */
export const STORY = {
  /** The lesson's speaking session starts ringing (beat 1). */
  call: 600,
  /** Valentina's written practice with the AI tutor starts (beat 2). */
  writing: 15_000,
  /** She answers the mini exercise at the start of beat 3 (unless the visitor did). */
  quizPick: { step: 'quiz', reply: 'bought', at: 22_300 } as StoryPick,
  /** Lesson complete after the result; the level up right after. */
  completeDelay: 700,
  levelUpDelay: 400,
  /** She books the B1 conversation club (unless the visitor did). */
  book: 26_000,
  /** A prospect (Julieta) opens the site chat and takes the level test (beat 4). */
  lead: 30_500,
  leadPicks: [
    { step: 'hi', reply: 'start', at: 31_900 },
    { step: 'q1', reply: 'goes', at: 33_400 },
    { step: 'q2', reply: 'saw', at: 34_800 },
    { step: 'q3', reply: 'live', at: 36_200 },
    { step: 'result', reply: 'enroll', at: 38_600 },
    { step: 'pay', reply: 'card', at: 40_000 },
  ] as StoryPick[],
  /** Martín: flagged after 5 days away → WhatsApp nudge (automation on) → back; off → drops out (beat 5). */
  flag: 47_200,
  nudge: 48_000,
  waPick: { step: 'nudge', reply: 'yes', at: 50_400 } as StoryPick,
  drop: 53_000,
  /** Monthly fees arriving after this morning's reminder. */
  paid: [
    { id: 'bruno', at: 31_200, via: 'transfer' },
    { id: 'sofia', at: 48_600, via: 'card' },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Valentina (the student)                                              */
/* ------------------------------------------------------------------ */
export type PromptId = 'weekend' | 'series';
export const PROMPTS: PromptId[] = ['weekend', 'series'];

/** Speaking session: who speaks and for how long (texts per locale). Index 2 flags "th", 5 confirms it. */
export const SPEAK_FLOW = {
  ringMs: 500,
  lines: [
    { who: 'agent', ms: 1700, gapMs: 200 },
    { who: 'caller', ms: 2300, gapMs: 200 },
    { who: 'tool', ms: 700, gapMs: 200 },
    { who: 'agent', ms: 2000, gapMs: 200 },
    { who: 'caller', ms: 1200, gapMs: 200 },
    { who: 'tool', ms: 650, gapMs: 200 },
  ],
} as const;
/** The live timer runs faster: the ~10 s on screen read as a 2-minute session. */
export const SPEAK_SCALE = 12;
/** Session scores (out of 100) per prompt. */
export const SPEAK_SCORE: Record<PromptId, { total: number; pron: number; fluency: number; grammar: number }> = {
  weekend: { total: 92, pron: 88, fluency: 93, grammar: 95 },
  series: { total: 90, pron: 87, fluency: 91, grammar: 92 },
};

/** Points of the week (the class ranking). */
export const POINTS = { speaking: 30, right: 20, wrong: 5, lesson: 50, streak: 25 } as const;
export const HERO = {
  points: 1150,
  streak: 11,
  /** Minutes studied this week / weekly goal; today's lesson adds `lesson`. */
  minutes: 50,
  goal: 60,
  lesson: 12,
  /** Progress through A2 before today's lesson (0–1). */
  a2: 0.94,
  speakingSessions: 9,
} as const;

export type StudentId = 'valentina' | 'camila' | 'bruno' | 'sofia' | 'lucas' | 'martin' | 'julieta' | 'tomas' | 'renata' | 'joaquin';

/** Valentina's class (English A2, Tue & Thu): points of the week before the story. */
export const CLASSMATES: { id: StudentId; points: number; initials: string; color: string }[] = [
  { id: 'camila', points: 1320, initials: 'CM', color: '#FF9F87' },
  { id: 'bruno', points: 1240, initials: 'BA', color: '#A8DAF8' },
  { id: 'sofia', points: 1190, initials: 'SL', color: '#F0D98A' },
  { id: 'lucas', points: 1040, initials: 'LD', color: '#C9C2B2' },
  { id: 'martin', points: 410, initials: 'MS', color: '#FFB86B' },
];
export const HERO_COLOR = '#7CC8F5';
/** Martín's express lesson. */
export const MARTIN_BACK_POINTS = 40;

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export const CEFR: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

/** The course map (English A2): units, lessons done. Unit 6 lesson 3 is today's. */
export const UNITS = [
  { id: 1, lessons: 4, done: 4 },
  { id: 2, lessons: 4, done: 4 },
  { id: 3, lessons: 3, done: 3 },
  { id: 4, lessons: 4, done: 4 },
  { id: 5, lessons: 3, done: 3 },
  { id: 6, lessons: 3, done: 2 },
] as const;
export const CURRENT_UNIT = 6;
/** First units of the next level (unlocked by the level up). */
export const NEXT_UNITS = [1, 2] as const;

export type BadgeId = 'streak7' | 'firstLive' | 'words' | 'speak10' | 'levelB1' | 'streak30';

/* ------------------------------------------------------------------ */
/* The school                                                           */
/* ------------------------------------------------------------------ */
/** The panel's numbers before the story. Completion = on track / cohort (41 / 50 = the key number). */
export const SCHOOL = {
  active: 214,
  atRisk: 9,
  cohort: 50,
  onTrack: 41,
  enrollments: 23,
  feesPaid: 168,
  onlineNow: 37,
  remindersSent: 7,
} as const;

export type TeacherId = 'carla' | 'diego' | 'ana';
export const TEACHERS: { id: TeacherId; initials: string; color: string; ink: string; tone: Tone }[] = [
  { id: 'carla', initials: 'CF', color: '#7CC8F5', ink: '#0E1A2B', tone: 'accent' },
  { id: 'diego', initials: 'DR', color: '#F3F0E6', ink: '#172338', tone: 'ink' },
  { id: 'ana', initials: 'AV', color: '#FF9F87', ink: '#1A1730', tone: 'accent2' },
];

export type ClassId = 'en-a2' | 'en-b2' | 'pt-a1' | 'en-a1' | 'pt-a2' | 'club-b1';
/** Today's live classes (minutes from midnight). The B1 club has `seats`. */
export const LIVE_CLASSES: { id: ClassId; teacher: TeacherId; start: number; end: number; seats?: number; taken?: number }[] = [
  { id: 'en-a2', teacher: 'carla', start: 18 * 60, end: 19 * 60 },
  { id: 'club-b1', teacher: 'carla', start: 21 * 60, end: 22 * 60, seats: 14, taken: 11 },
  { id: 'en-b2', teacher: 'diego', start: 18 * 60 + 30, end: 19 * 60 + 30 },
  { id: 'en-a1', teacher: 'diego', start: 20 * 60, end: 21 * 60 },
  { id: 'pt-a1', teacher: 'ana', start: 19 * 60, end: 20 * 60 },
  { id: 'pt-a2', teacher: 'ana', start: 20 * 60 + 30, end: 21 * 60 + 30 },
];
export const LIVE_START = 18 * 60;
export const LIVE_END = 22 * 60;
/** Students connected to the class on air (English A1, 20:00). */
export const ON_AIR = 14;

/** The roster on the Students view (Valentina and Martín are live). */
export const ROSTER: { id: StudentId; course: string; level: CefrLevel; progress: number; lastDays: number; points: number; risk?: boolean }[] = [
  { id: 'valentina', course: 'en', level: 'A2', progress: 0.94, lastDays: 0, points: HERO.points },
  { id: 'martin', course: 'en', level: 'A2', progress: 0.58, lastDays: 5, points: 410, risk: true },
  { id: 'camila', course: 'en', level: 'A2', progress: 0.97, lastDays: 0, points: 1320 },
  { id: 'tomas', course: 'pt', level: 'A1', progress: 0.41, lastDays: 4, points: 260, risk: true },
  { id: 'renata', course: 'en', level: 'B2', progress: 0.72, lastDays: 1, points: 980 },
  { id: 'joaquin', course: 'pt', level: 'A2', progress: 0.33, lastDays: 2, points: 540 },
];

/** Courses on offer: students, average unit (of 8) and completion. */
export const COURSES: { id: string; lang: 'en' | 'pt'; level: CefrLevel; students: number; unit: number; completion: number; spread: number[] }[] = [
  { id: 'en-a1', lang: 'en', level: 'A1', students: 32, unit: 3, completion: 0.84, spread: [3, 6, 9, 7, 4, 2, 1, 0] },
  { id: 'en-a2', lang: 'en', level: 'A2', students: 48, unit: 5, completion: 0.81, spread: [1, 3, 5, 7, 11, 13, 6, 2] },
  { id: 'en-b1', lang: 'en', level: 'B1', students: 51, unit: 4, completion: 0.83, spread: [4, 6, 9, 12, 9, 6, 4, 1] },
  { id: 'en-b2', lang: 'en', level: 'B2', students: 27, unit: 6, completion: 0.8, spread: [0, 1, 2, 3, 5, 7, 6, 3] },
  { id: 'pt-a1', lang: 'pt', level: 'A1', students: 38, unit: 2, completion: 0.85, spread: [8, 11, 9, 5, 3, 1, 1, 0] },
  { id: 'pt-a2', lang: 'pt', level: 'A2', students: 18, unit: 4, completion: 0.79, spread: [1, 2, 3, 5, 4, 2, 1, 0] },
];

/**
 * Students still active per course week (the August cohort of 50): the old pattern
 * (no follow-up) lost most of them in week 3; with nudges the line holds at 41 = 82 %.
 */
export const RETENTION_WEEKS = [50, 49, 48, 47, 46, 45, 44, 43, 42, 42, 41, 41];
export const RETENTION_BEFORE = [50, 46, 37, 35, 34, 33, 32, 32, 31, 31, 31, 31];
/** Students rescued by a nudge this cohort (they came back after a WhatsApp lesson). */
export const RESCUED = 17;

/** The AI tutor today. */
export const TUTOR_TODAY = { corrections: 1284, sessions: 96, solved: 0.89 } as const;
export const COMMON_ERRORS: { id: 'th' | 'past' | 'prep' | 'third'; share: number }[] = [
  { id: 'th', share: 0.31 },
  { id: 'past', share: 0.24 },
  { id: 'prep', share: 0.17 },
  { id: 'third', share: 0.12 },
];

/** Enrollments earlier today (newest first; minutes from midnight). */
export const ENROLLED_TODAY: { id: string; who: StudentId | 'lead1' | 'lead2'; level: CefrLevel; course: CefrLevel; lang: 'en' | 'pt'; pay: 'card' | 'transfer'; time: number }[] = [
  { id: 'e2', who: 'lead2', level: 'A1', course: 'A1', lang: 'pt', pay: 'transfer', time: 18 * 60 + 42 },
  { id: 'e1', who: 'lead1', level: 'B1', course: 'B2', lang: 'en', pay: 'card', time: 11 * 60 + 5 },
];

export const SITE_URL = 'atrioidiomas.demo';
/** The level test → recommended course: the course that takes you to the next level. */
export const NEXT_LEVEL: Record<'A1' | 'A2' | 'B1', CefrLevel> = { A1: 'A2', A2: 'B1', B1: 'B2' };
