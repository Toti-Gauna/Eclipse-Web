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
/** The timetable repeats every week (Mon–Sat); Sunday is closed. */
export const weekdayOf = (day: number) => ((day % 7) + 7) % 7;
/** A stable pseudo-random number in [0, 1) for a seed. */
function hash(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
/**
 * Any session of any week: the demo week (0–6) is the hand-written one; other weeks repeat the
 * timetable with deterministic attendance (past weeks fuller, later weeks emptier).
 */
export function sessionAt(day: number, start: number): Session | undefined {
  const wd = weekdayOf(day);
  const base = SESSIONS.find((s) => s.day === wd && s.start === start);
  if (!base) return undefined;
  if (day >= 0 && day < 7) return base;
  const weeks = Math.floor(day / 7);
  const ratio = weeks < 0 ? 0.62 + 0.38 * hash(day * 31 + start) : Math.max(0.15, 0.55 - 0.12 * weeks) * (0.6 + 0.6 * hash(day * 17 + start));
  return { ...base, id: `${day}-${start}`, day, booked: Math.min(base.cap, Math.round(base.cap * ratio)) };
}
/** Session ids are `${day}-${start}` (day may be negative: earlier weeks). */
export const sessionById = (id: string) => {
  const m = /^(-?\d+)-(\d+)$/.exec(id);
  return m ? sessionAt(Number(m[1]), Number(m[2])) : undefined;
};
/** Sessions of a day (any week), in time order. */
export const sessionsOn = (day: number) => SLOTS.map((m) => sessionAt(day, m)).filter((s): s is Session => !!s);
/** Kinds Lucía already trained before the story (a "new class" is any other). */
export const KNOWN_KINDS: ClassKind[] = ['functional', 'hiit', 'yoga'];

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
/* Story timing (ms of story time) — v3 beats, nothing plays on its own  */
/* ------------------------------------------------------------------ */
/**
 * The visitor plays four beats from the SimBar (labels: demoGym.sim.<id>). Each `at` is where
 * its segment ends, on a calm frame (no toast, push, typing or "just now" left).
 * 1 lead — Tomás asks the site's chatbot for a free trial (Mon 9:00)
 * 2 winback — Lucía, 9 days away, is flagged; the automation sends her WhatsApp mission
 * 3 tuesday — she answers and books; Tuesday 7:00 she checks in; the app books Thursday
 * 4 thursday — second check-in: mission done, level up, she climbs in her league
 */
export const BEATS = [
  { id: 'lead', at: 14_500 },
  { id: 'winback', at: 22_000 },
  { id: 'tuesday', at: 34_000 },
  { id: 'thursday', at: 44_000 },
] as const;
export const STORY_END = BEATS[BEATS.length - 1].at;
export type BeatId = (typeof BEATS)[number]['id'];

/* ------------------------------------------------------------------ */
/* Screens + where each beat happens (v3c: a simulation takes you there) */
/* ------------------------------------------------------------------ */
/** The owner's panel: every section on the laptop; the phone has no "Ligas" (the member app has it). */
export const OWNER_TABS = {
  laptop: ['today', 'retention', 'members', 'classes', 'league', 'site'],
  phone: ['today', 'retention', 'members', 'classes', 'site'],
} as const;
export type OwnerTab = (typeof OWNER_TABS.laptop)[number];
/** Lucía's member app (phone). */
export const MEMBER_TAB_IDS = ['home', 'classes', 'league'] as const;
export type MemberTab = (typeof MEMBER_TAB_IDS)[number];
export const PHONE_OVERLAYS = ['wa', 'levelup'] as const;
export type PhoneOverlay = (typeof PHONE_OVERLAYS)[number];
/** Elements a beat brings into view inside its screen (marked `data-beat="<id>"`). */
export const BEAT_MARKS = ['chat'] as const;
export type BeatMark = (typeof BEAT_MARKS)[number];

export type OwnerTarget = { side: 'owner'; tab: OwnerTab; reveal?: BeatMark };
export type MemberTarget = { side: 'member'; tab: MemberTab; overlay?: PhoneOverlay; reveal?: BeatMark };
/** Nothing of this beat happens on that screen: it stays where the visitor left it. */
export type StayTarget = { side: 'stay' };
export interface BeatScreens {
  /** The owner's panel (desktop view). */
  laptop: OwnerTarget;
  /** The phone alone: the complete product (member app ⇄ owner's panel). */
  phone: OwnerTarget | MemberTarget;
  /** The phone next to the laptop: Lucía's phone only. */
  paired: MemberTarget | StayTarget;
}
/**
 * Where each beat is legible, per screen (`useBeatFocus` in GymDemo takes each view there when
 * the story enters the beat; the visitor can move away at once):
 * - lead: the site with its chatbot open (Tomás chats with it). Lucía's phone: nothing happens.
 * - winback: the owner sees Lucía flagged and the automation send; her phone opens the WhatsApp.
 * - tuesday: the owner's "Hoy" (her comeback rail, the check-in); her app's home (check-in, 1/2).
 * - thursday: the leagues (mission done, level 7 reward, she climbs); her app's home (level up).
 */
export const BEAT_SCREENS: Record<BeatId, BeatScreens> = {
  lead: {
    laptop: { side: 'owner', tab: 'site', reveal: 'chat' },
    phone: { side: 'owner', tab: 'site', reveal: 'chat' },
    paired: { side: 'stay' },
  },
  winback: {
    laptop: { side: 'owner', tab: 'retention' },
    phone: { side: 'member', tab: 'home', overlay: 'wa' },
    paired: { side: 'member', tab: 'home', overlay: 'wa' },
  },
  tuesday: {
    laptop: { side: 'owner', tab: 'today' },
    phone: { side: 'member', tab: 'home' },
    paired: { side: 'member', tab: 'home' },
  },
  thursday: {
    laptop: { side: 'owner', tab: 'league' },
    phone: { side: 'member', tab: 'home' },
    paired: { side: 'member', tab: 'home' },
  },
};

/** A reply the story gives on its own inside a beat (absolute story time), unless the visitor answered first. */
export interface StoryPick {
  step: string;
  reply: string;
  at: number;
}
export const AT = {
  /** Tomás opens the site's chat (beat 1) and answers it. */
  lead: 600,
  leadPicks: [
    { step: 'hi', reply: 'try', at: 2_600 },
    { step: 'goal', reply: 'unsure', at: 4_800 },
    { step: 'pick', reply: 'opt0', at: 7_200 },
  ] as StoryPick[],
  /** The daily check flags Lucía (beat 2). */
  flag: 15_200,
  /** The win-back automation sends her WhatsApp (if it's on at that moment). */
  win: 16_500,
  /** Lucía answers at the start of beat 3 (unless the visitor answered as her). */
  waPicks: [
    { step: 'mission', reply: 'book', at: 22_600 },
    { step: 'slots', reply: 'opt0', at: 24_600 },
  ] as StoryPick[],
  /** Time-lapse cuts: Tuesday morning, Thursday evening. */
  tue: 27_500,
  thu: 35_000,
  /** Other members, inside the beats. */
  ambient: [
    { at: 15_700, member: 'ramiro' as MemberId, kind: 'checkin' as const, day: 0 },
    { at: 18_000, member: 'agus' as MemberId, kind: 'mission' as const, day: 0 },
    { at: 28_100, member: 'caro' as MemberId, kind: 'checkin' as const, day: 1 },
    { at: 35_900, member: 'fede' as MemberId, kind: 'badge' as const, day: 3 },
  ],
};
/** Offsets from the Tuesday cut. */
export const TUE = { checkin: 1_500, churn: 2_000, book2: 3_000 } as const;
/** Offsets from the Thursday cut (mission: after the check-in; league: the climb, after the celebration). */
export const THU = { checkin: 1_500, trialIn: 2_300, mission: 600, league: 3_000 } as const;
/** Story clock: minutes per ms in each day of the time-lapse. */
export const CLOCK = {
  mon: { start: 540, msPerMin: 1500 },
  tue: { lead: 1, msPerMin: 1000 },
  thu: { lead: 1, msPerMin: 900 },
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
