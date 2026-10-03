/**
 * Fictional data for "Órbita Fitness — Demo" (vertical "gimnasios").
 * People, classes and coaches are message keys (namespace `demoGym`) so every locale
 * names them its own way. Time: minutes from midnight on fixed days of the week of
 * Monday 5 Oct 2026; the story is a time-lapse Mon 9:00 → Tue class → Thu class.
 */
import type { DemoTheme } from '../kit';

/** Palette: night #0B0C0F · lime #CCFF33 · hot pink #FF3E8A. Bold condensed caps, game UI. */
export const ORBITA_THEME: DemoTheme = {
  mode: 'dark',
  bg: '#0B0C0F',
  surface: '#14161B',
  sunken: '#1B1E24',
  ink: '#F1F3EC',
  muted: '#9DA3AE',
  line: 'rgb(241 243 236 / 0.1)',
  accent: '#CCFF33',
  accentInk: '#0B0C0F',
  accentText: '#CCFF33',
  accent2: '#FF3E8A',
  accent2Ink: '#0B0C0F',
  accent2Text: '#FF5C9C',
  ok: '#CCFF33',
  warn: '#FFB03A',
  bad: '#FF5C9C',
  info: '#7FD4FF',
  radius: '0.55em',
  display: { family: 'sans', weight: 850, tracking: '-0.015em', uppercase: true, italic: true },
};

/** Fictional site of the gym (reserved .demo TLD). */
export const SITE_URL = 'orbitafitness.demo';

/* ------------------------------------------------------------------ */
/* Calendar                                                             */
/* ------------------------------------------------------------------ */
/** Monday of the demo week (UTC). Days: 0 = Monday … 6 = Sunday. */
export const WEEK_START = Date.UTC(2026, 9, 5);
export const dayDate = (day: number) => new Date(WEEK_START + day * 86_400_000);
export type StoryDay = 0 | 1 | 3;

/* ------------------------------------------------------------------ */
/* People                                                               */
/* ------------------------------------------------------------------ */
export type MemberId =
  | 'lucia'
  | 'ramiro'
  | 'agus'
  | 'fede'
  | 'caro'
  | 'juli'
  | 'mica'
  | 'santi'
  | 'nacho'
  | 'belen'
  | 'gonza'
  | 'rocio'
  | 'mateo'
  | 'tomas';

/** The member on the phone: she hasn't come in 9 days when the story starts. */
export const HERO: MemberId = 'lucia';
/** The lead who books a trial class through the site's chatbot. */
export const LEAD: MemberId = 'tomas';

/** Identity tints (avatars and marks only — never text on light). */
const TINT = {
  lime: '#CCFF33',
  pink: '#FF3E8A',
  sky: '#7FD4FF',
  orange: '#FFB03A',
  mint: '#5FE3B0',
  bone: '#E9E4D8',
} as const;
type TintId = keyof typeof TINT;
export const tint = (id: TintId) => TINT[id];

export interface Member {
  id: MemberId;
  initials: string;
  tint: TintId;
  level: number;
  /** Days in a row with training (rest days of up to 2 don't break it). */
  streak: number;
  /** Days since the last check-in at 9:00 on Monday. */
  away: number;
  league: 'gold' | 'silver' | 'bronze' | null;
}

export const MEMBERS: Member[] = [
  { id: 'lucia', initials: 'LM', tint: 'pink', level: 6, streak: 0, away: 9, league: 'silver' },
  { id: 'ramiro', initials: 'RG', tint: 'sky', level: 9, streak: 21, away: 1, league: 'silver' },
  { id: 'agus', initials: 'AP', tint: 'mint', level: 8, streak: 12, away: 1, league: 'silver' },
  { id: 'fede', initials: 'FR', tint: 'orange', level: 7, streak: 9, away: 2, league: 'silver' },
  { id: 'caro', initials: 'CB', tint: 'bone', level: 7, streak: 6, away: 1, league: 'silver' },
  { id: 'juli', initials: 'JD', tint: 'lime', level: 6, streak: 4, away: 2, league: 'silver' },
  { id: 'mica', initials: 'MS', tint: 'sky', level: 5, streak: 3, away: 1, league: 'silver' },
  { id: 'santi', initials: 'SV', tint: 'orange', level: 5, streak: 2, away: 3, league: 'silver' },
  { id: 'nacho', initials: 'NF', tint: 'mint', level: 4, streak: 0, away: 12, league: 'bronze' },
  { id: 'belen', initials: 'BQ', tint: 'bone', level: 3, streak: 0, away: 8, league: 'bronze' },
  { id: 'gonza', initials: 'GT', tint: 'sky', level: 5, streak: 0, away: 15, league: 'bronze' },
  { id: 'rocio', initials: 'RA', tint: 'lime', level: 2, streak: 0, away: 7, league: 'bronze' },
  { id: 'mateo', initials: 'MC', tint: 'pink', level: 4, streak: 0, away: 21, league: 'bronze' },
  { id: 'tomas', initials: 'TL', tint: 'sky', level: 1, streak: 0, away: -1, league: null },
];
export const memberById = (id: MemberId) => MEMBERS.find((m) => m.id === id)!;

/* ------------------------------------------------------------------ */
/* Classes                                                              */
/* ------------------------------------------------------------------ */
export type ClassKind = 'functional' | 'spinning' | 'hiit' | 'yoga' | 'strength';
export type CoachId = 'nico' | 'vale' | 'juli' | 'caro';

/** Timetable rows (minutes from midnight). */
export const SLOTS = [420, 480, 1080, 1140, 1200];
/** Days shown in the timetable (Mon–Sat). */
export const DAYS = [0, 1, 2, 3, 4, 5];

export interface Session {
  id: string;
  day: number;
  start: number;
  kind: ClassKind;
  coach: CoachId;
  cap: number;
  /** Booked at 9:00 on Monday. */
  booked: number;
}

const S = (day: number, start: number, kind: ClassKind, coach: CoachId, cap: number, booked: number): Session => ({
  id: `${day}-${start}`,
  day,
  start,
  kind,
  coach,
  cap,
  booked,
});

export const SESSIONS: Session[] = [
  S(0, 420, 'hiit', 'juli', 14, 14),
  S(0, 480, 'yoga', 'caro', 16, 12),
  S(0, 1080, 'functional', 'nico', 14, 12),
  S(0, 1140, 'spinning', 'vale', 18, 16),
  S(0, 1200, 'strength', 'juli', 12, 9),
  S(1, 420, 'functional', 'nico', 14, 11),
  S(1, 480, 'yoga', 'caro', 16, 10),
  S(1, 1080, 'hiit', 'juli', 14, 13),
  S(1, 1140, 'spinning', 'vale', 18, 17),
  S(1, 1200, 'yoga', 'caro', 16, 8),
  S(2, 420, 'hiit', 'juli', 14, 12),
  S(2, 480, 'strength', 'nico', 12, 7),
  S(2, 1080, 'functional', 'vale', 14, 10),
  S(2, 1140, 'spinning', 'vale', 18, 15),
  S(2, 1200, 'strength', 'juli', 12, 11),
  S(3, 420, 'functional', 'nico', 14, 13),
  S(3, 480, 'yoga', 'caro', 16, 9),
  S(3, 1080, 'hiit', 'juli', 14, 12),
  S(3, 1140, 'functional', 'vale', 14, 11),
  S(3, 1200, 'spinning', 'vale', 18, 14),
  S(4, 420, 'hiit', 'juli', 14, 9),
  S(4, 480, 'yoga', 'caro', 16, 6),
  S(4, 1080, 'functional', 'nico', 14, 8),
  S(4, 1140, 'spinning', 'vale', 18, 12),
  S(5, 480, 'functional', 'nico', 14, 7),
];
export const sessionById = (id: string) => SESSIONS.find((s) => s.id === id);
export const sessionAt = (day: number, start: number) => SESSIONS.find((s) => s.day === day && s.start === start);

/** The two Tuesday classes the win-back WhatsApp offers (first = automatic pick). */
export const WA_OPTIONS = ['1-420', '1-1140'] as const;
/** The second class of the mission, suggested in the app (and the lead's trial class). */
export const SECOND_CLASS = '3-1140';
/** The lead's trial class options in the site chat (first = automatic pick). */
export const TRIAL_OPTIONS = ['3-1140', '2-1080'] as const;

/* ------------------------------------------------------------------ */
/* Game rules                                                           */
/* ------------------------------------------------------------------ */
export const XP = { checkin: 50, comeback: 300, streak3: 100, friend: 150 } as const;
/** XP to go from level n to n + 1. */
export const levelNeed = (level: number) => 400 + 200 * (level - 1);
/** Lucía at 9:00 on Monday: level 6 and 1,180 XP into it. */
export const HERO_LEVEL = 6;
export const HERO_XP = 1180;
export const HERO_BEST_STREAK = 21;
/** Days of rest that don't break a streak. */
export const STREAK_GRACE = 2;

export type MissionId = 'comeback' | 'streak3' | 'friend' | 'newClass';
export const MISSIONS: { id: MissionId; goal: number; xp: number }[] = [
  { id: 'comeback', goal: 2, xp: XP.comeback },
  { id: 'streak3', goal: 3, xp: XP.streak3 },
  { id: 'friend', goal: 1, xp: XP.friend },
  { id: 'newClass', goal: 1, xp: 120 },
];

/** Lucía's league this week: 8 members, top 3 move up to Gold on Sunday, bottom 2 go down. */
export const LEAGUE: MemberId[] = ['ramiro', 'agus', 'fede', 'caro', 'juli', 'mica', 'santi', 'lucia'];
export const PROMOTE = 3;
export const DEMOTE = 2;
/** The others' weekly XP on each story day (Mon 9:00 · Tue morning · Thu evening). */
export const LEAGUE_XP: Record<StoryDay, Partial<Record<MemberId, number>>> = {
  0: { ramiro: 120, agus: 90, fede: 80, caro: 60, juli: 40, mica: 30, santi: 0 },
  1: { ramiro: 210, agus: 180, fede: 150, caro: 140, juli: 90, mica: 80, santi: 60 },
  3: { ramiro: 560, agus: 510, fede: 430, caro: 380, juli: 330, mica: 260, santi: 200 },
};

/* ------------------------------------------------------------------ */
/* Story timing (ms of story time)                                      */
/* ------------------------------------------------------------------ */
export const LOOP_MS = 28_000;
export const AT = {
  /** The daily check flags Lucía (9 days without coming). */
  flag: 700,
  /** The win-back automation sends her WhatsApp (if it's on). */
  win: 2_800,
  /** Lucía quits if nobody wrote to her. */
  churn: 20_000,
  /** The lead opens the site's chat. */
  lead: 500,
  /** Ambient events of other members: ms after their day of the time-lapse starts. */
  ambient: [
    { offset: 1_500, member: 'ramiro' as MemberId, kind: 'checkin' as const, day: 0 },
    { offset: 7_400, member: 'agus' as MemberId, kind: 'mission' as const, day: 0 },
    { offset: 900, member: 'caro' as MemberId, kind: 'checkin' as const, day: 1 },
    { offset: 900, member: 'fede' as MemberId, kind: 'badge' as const, day: 3 },
  ],
};
/** Offsets from the moment the win-back was sent (the chain shifts if it's sent late). */
export const CHAIN = {
  overlay: 1_300,
  tue: 9_000,
  check1: 11_000,
  book2: 12_600,
  thu: 14_000,
  check2: 15_800,
  mission: 16_400,
  league: 20_200,
} as const;
/** Story clock: minutes per ms in each day of the time-lapse. */
export const CLOCK = {
  mon: { start: 540, msPerMin: 1500 },
  tue: { lead: 2, msPerMin: 1000 },
  thu: { lead: 2, msPerMin: 900 },
} as const;

/* ------------------------------------------------------------------ */
/* Owner's numbers                                                      */
/* ------------------------------------------------------------------ */
export const ACTIVE = 312;
/** Members flagged (7+ days without coming), Lucía included. */
export const AT_RISK = 18;
export const RISK_DAYS = 7;
export const HIGH_RISK_DAYS = 14;
/** Win-backs sent / members who came back this month, before the story. */
export const WINBACK_SENT = 41;
export const WINBACK_BACK = 23;
/** Trial classes booked through the site this week, before the story. */
export const LEADS_WEEK = 11;
/** Check-ins so far on each story day. */
export const CHECKINS: Record<StoryDay, number> = { 0: 38, 1: 21, 3: 96 };
/** Cancellations per month, Apr → Sep (missions and streaks went live in July). */
export const CHURN_MONTHS = [3, 4, 5, 6, 7, 8];
export const CHURN = [12, 13, 11, 10, 9, 8];
export const CHURN_LIVE_FROM = 3;
/** October so far. */
export const CHURN_OCT = 2;

/** Others flagged at risk (the panel lists the most urgent; Lucía goes first). */
export type RiskState = 'sent' | 'booked' | 'high' | 'queued';
export const RISK_LIST: { id: MemberId; state: RiskState }[] = [
  { id: 'nacho', state: 'sent' },
  { id: 'belen', state: 'booked' },
  { id: 'gonza', state: 'high' },
  { id: 'rocio', state: 'queued' },
  { id: 'mateo', state: 'high' },
];
/** Queued win-backs go out at 18:00. */
export const QUEUED_AT = 1080;
