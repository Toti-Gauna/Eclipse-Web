/**
 * Fictional data for "Clínica Aurora — Demo" (dental & aesthetics). People and
 * treatments are message keys (namespace `demoClinic`) so each locale names them.
 * Time: minutes from midnight on a fixed Thursday; "now" is 9:41 when the story starts.
 */
import type { DemoTheme, Tone } from '../kit';

/** Palette: porcelain · ink · teal · blush. Calm, rounded, airy. */
export const CLINIC_THEME: DemoTheme = {
  mode: 'light',
  bg: '#F7F4EF',
  surface: '#FFFFFF',
  sunken: '#EFEAE2',
  ink: '#1D2A2B',
  muted: '#55615F',
  line: 'rgb(29 42 43 / 0.1)',
  accent: '#127C74',
  accentInk: '#FFFFFF',
  accentText: '#0F6B64',
  accent2: '#F2C4B3',
  accent2Ink: '#1D2A2B',
  accent2Text: '#8E4A35',
  ok: '#1C6B4A',
  warn: '#8A5A12',
  bad: '#A33A3A',
  info: '#2B5F86',
  radius: '1.15em',
  display: { family: 'serif', weight: 400, tracking: '-0.01em' },
};

/* ------------------------------------------------------------------ */
/* People                                                               */
/* ------------------------------------------------------------------ */
export type ProId = 'lucia' | 'tomas' | 'sofia';
export type Specialty = 'dental' | 'ortho' | 'aesthetic';

export interface Pro {
  id: ProId;
  specialty: Specialty;
  initials: string;
  /** Calendar tone of the pro's appointments. */
  tone: Tone;
  /** Avatar colors. */
  color: string;
  ink: string;
}

export const PROS: Pro[] = [
  { id: 'lucia', specialty: 'dental', initials: 'LM', tone: 'accent', color: '#127C74', ink: '#FFFFFF' },
  { id: 'tomas', specialty: 'ortho', initials: 'TR', tone: 'ink', color: '#1D2A2B', ink: '#F7F4EF' },
  { id: 'sofia', specialty: 'aesthetic', initials: 'SP', tone: 'accent2', color: '#F2C4B3', ink: '#1D2A2B' },
];
export const proById = (id: ProId) => PROS.find((p) => p.id === id)!;

export type TreatmentId =
  | 'cleaning'
  | 'checkup'
  | 'filling'
  | 'whitening'
  | 'orthoConsult'
  | 'braces'
  | 'aligners'
  | 'facial'
  | 'peeling'
  | 'aestheticConsult';

/** Duration in minutes. */
export const TREATMENTS: Record<TreatmentId, { specialty: Specialty; minutes: number }> = {
  cleaning: { specialty: 'dental', minutes: 30 },
  checkup: { specialty: 'dental', minutes: 30 },
  filling: { specialty: 'dental', minutes: 60 },
  whitening: { specialty: 'dental', minutes: 60 },
  orthoConsult: { specialty: 'ortho', minutes: 30 },
  braces: { specialty: 'ortho', minutes: 30 },
  aligners: { specialty: 'ortho', minutes: 30 },
  facial: { specialty: 'aesthetic', minutes: 60 },
  peeling: { specialty: 'aesthetic', minutes: 30 },
  aestheticConsult: { specialty: 'aesthetic', minutes: 30 },
};
/** What the public site offers to book (one per specialty first). */
export const SITE_TREATMENTS: TreatmentId[] = ['cleaning', 'facial', 'orthoConsult', 'whitening'];
export const proFor = (treatment: TreatmentId): ProId => PROS.find((p) => p.specialty === TREATMENTS[treatment].specialty)!.id;

export type PatientId =
  | 'ana'
  | 'diego'
  | 'carla'
  | 'martina'
  | 'pedro'
  | 'lucas'
  | 'bruno'
  | 'elena'
  | 'joaquin'
  | 'sebastian'
  | 'valentina'
  | 'nicolas'
  | 'renata'
  | 'lola'
  | 'irene'
  | 'florencia'
  | 'micaela'
  | 'rocio'
  | 'camila'
  | 'paula'
  | 'julian';

/* ------------------------------------------------------------------ */
/* The day                                                              */
/* ------------------------------------------------------------------ */
/** Visible agenda: 9:00 → 14:00 in 30-minute rows. */
export const DAY_START = 540;
export const DAY_END = 840;
export const STEP = 30;
/** 9:41 when the story starts; the story clock advances ~1 minute every 2.5 s. */
export const NOW_START = 581;
export const storyClock = (t: number) => NOW_START + Math.floor(Math.max(0, t) / 2500);

/** Monday of the demo week (UTC); today is Thursday. Days are indices from that Monday (negative = earlier). */
export const WEEK_START = Date.UTC(2026, 9, 5);
export const TODAY = 3;
export const dayDate = (day: number) => new Date(WEEK_START + day * 86_400_000);
/** The clinic opens Monday to Saturday. */
export const isOpenDay = (weekday: number) => weekday < 6;
/** Days the public site offers (today, Fri, Sat, Mon). */
export const SITE_DAYS = [TODAY, 4, 5, 7];

export type Status = 'done' | 'now' | 'confirmed' | 'reminded' | 'new' | 'freed' | 'waitlist' | 'voice' | 'you';

export interface BaseAppt {
  pro: ProId;
  start: number;
  patient: PatientId;
  treatment: TreatmentId;
  status: Status;
}

const a = (pro: ProId, start: number, patient: PatientId, treatment: TreatmentId, status: Status): BaseAppt => ({ pro, start, patient, treatment, status });

/** Today at 9:41, before the story. Missing ranges are free. */
export const BASE_DAY: BaseAppt[] = [
  a('lucia', 540, 'ana', 'checkup', 'done'),
  a('lucia', 570, 'diego', 'cleaning', 'now'),
  a('lucia', 630, 'carla', 'filling', 'confirmed'),
  a('lucia', 690, 'martina', 'cleaning', 'reminded'),
  a('lucia', 720, 'pedro', 'checkup', 'confirmed'),
  a('lucia', 780, 'lucas', 'whitening', 'confirmed'),
  a('tomas', 540, 'bruno', 'braces', 'done'),
  a('tomas', 570, 'elena', 'braces', 'now'),
  a('tomas', 600, 'joaquin', 'aligners', 'confirmed'),
  a('tomas', 660, 'sebastian', 'orthoConsult', 'confirmed'),
  a('tomas', 690, 'valentina', 'braces', 'reminded'),
  a('tomas', 720, 'nicolas', 'braces', 'confirmed'),
  a('tomas', 780, 'renata', 'aligners', 'confirmed'),
  a('sofia', 540, 'lola', 'peeling', 'done'),
  a('sofia', 570, 'irene', 'facial', 'now'),
  a('sofia', 690, 'florencia', 'aestheticConsult', 'confirmed'),
  a('sofia', 750, 'micaela', 'facial', 'confirmed'),
  a('sofia', 810, 'rocio', 'peeling', 'reminded'),
];

/* ------------------------------------------------------------------ */
/* The story: four simulations the visitor plays (no autoplay)          */
/* ------------------------------------------------------------------ */
/**
 * Story times (ms). Nothing runs on its own: each beat is a segment the visitor plays from the
 * SimBar ("Simular: …"); the clock stops at the beat's `at`, always on a calm frame (no toast,
 * typing or "just now" halo left on screen).
 */
export const STORY = {
  /** Beat "online": Camila books on the site (the patient phone plays her taps), WhatsApp confirms. */
  site: { pick: 900, day: 1800, time: 2700, confirm: 3500, booked: 4000, push: 4800, open: 6400 },
  camila: { pro: 'sofia' as ProId, start: 630, treatment: 'facial' as TreatmentId },
  /** Beat "reminder": Valentina confirms; Martina answers her reminder and moves to another day. */
  valentina: { at: 10_000, pro: 'tomas' as ProId, start: 690 },
  chatStart: 11_000,
  martina: { pro: 'lucia' as ProId, start: 690, treatment: 'cleaning' as TreatmentId },
  /** Beat "freed": Nicolás cancels → the waitlist refills his slot with Paula. */
  nicolas: { cancel: 24_500, offer: 25_500, refill: 27_500, pro: 'tomas' as ProId, start: 720, refillTreatment: 'braces' as TreatmentId },
  /** Beat "call": Julián calls; the AI receptionist books him (into Martina's freed 11:30). */
  callStart: 32_500,
} as const;

/** The SimBar's beats (labels: demoClinic.sim.<id>). `at` = where each segment ends. */
export const BEATS = [
  { id: 'online', at: 9_000 },
  { id: 'reminder', at: 23_500 },
  { id: 'freed', at: 31_500 },
  { id: 'call', at: 48_500 },
] as const;
export const LOOP_MS = BEATS[BEATS.length - 1].at;

/** Rescheduling options offered to Martina (day index + minutes). */
export const MARTINA_OPTIONS = [
  { day: 4, start: 600 },
  { day: 4, start: 750 },
  { day: 7, start: 570 },
] as const;

/** Waitlist at 9:41 (Paula takes one). */
export const WAITLIST_START = 6;
/** Waitlist people the cancelled slot is offered to. */
export const WAITLIST_OFFERED = 3;

/** Recovered this week before the story starts, by source (sums to keyNumber − live recoveries). */
export const RECOVERED_BASE = { reminder: 4, waitlist: 3, voice: 2 } as const;
/** No-shows per week: 3 weeks before the automations, then with them (last = this week so far). */
export const NO_SHOWS = [15, 14, 16, 7, 5, 3];
export const NO_SHOWS_BEFORE_WEEKS = 3;
/** Recovered per weekday this week (Mon → today) at the end of the story. */
export const RECOVERED_BY_DAY = [3, 2, 4] as const;

/** Reminders sent this morning for today's appointments. */
export const REMINDERS_TODAY = { sent: 18, confirmed: 14, rescheduled: 0, cancelled: 0, noReply: 4 } as const;

/** Earlier calls today (for the AI receptionist log). Newest first. */
export const CALL_LOG = [
  { id: 'c4', time: 552, caller: 'unknown1', topic: 'priceWhitening', outcome: 'answered' },
  { id: 'c3', time: 527, caller: 'lola', topic: 'moveCheckup', outcome: 'rescheduled' },
  { id: 'c2', time: 485, caller: 'unknown2', topic: 'afterHoursOrtho', outcome: 'booked' },
  { id: 'c1', time: 478, caller: 'unknown3', topic: 'toothache', outcome: 'handoff' },
] as const;
export const CALLS_BEFORE = { total: 22, booked: 8, afterHours: 7, avgSec: 102 } as const;

/** Phone numbers are masked and fictional. */
export const CALLER_NUMBER = '+54 11 5•••-2817';
export const SITE_URL = 'clinicaaurora.demo';
