/**
 * Fictional data for the "Clínica Aurora" demo. Names and treatments are message
 * keys (namespace `demoClinic`), so every locale can use its own names.
 * Time is measured in demo "ticks" (useDemoClock); "now" is 9:41 on a fixed day.
 */

export const ACCENT = '#0d6b74';
export const TICK_MS = 1700;
/** Effectively endless (the chat can be replayed); reduced motion jumps here. */
export const MAX_TICK = 100_000;

export type ProId = 'lucia' | 'tomas' | 'sofia';
export type Specialty = 'dental' | 'ortho' | 'aesthetic';
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

export type PatientId =
  | 'ana'
  | 'diego'
  | 'carla'
  | 'camila'
  | 'pedro'
  | 'martina'
  | 'lucas'
  | 'paula'
  | 'bruno'
  | 'elena'
  | 'sebastian'
  | 'nicolas'
  | 'renata'
  | 'joaquin'
  | 'valentina'
  | 'lola'
  | 'irene'
  | 'florencia'
  | 'micaela'
  | 'julieta'
  | 'rocio'
  | 'gabriela'
  | 'julian'
  | 'agustina'
  | 'mateo'
  | 'emilia'
  | 'santiago'
  | 'clara'
  | 'facundo';

export const PATIENT_POOL: PatientId[] = [
  'ana', 'diego', 'carla', 'pedro', 'lucas', 'bruno', 'elena', 'joaquin', 'lola', 'irene', 'florencia',
  'micaela', 'rocio', 'gabriela', 'agustina', 'mateo', 'emilia', 'santiago', 'clara', 'facundo', 'renata', 'camila',
];

export interface Pro {
  id: ProId;
  specialty: Specialty;
  /** Identity color (marks only, never text). */
  color: string;
  initials: string;
}

export const PROS: Pro[] = [
  { id: 'lucia', specialty: 'dental', color: ACCENT, initials: 'L' },
  { id: 'tomas', specialty: 'ortho', color: '#5a4fc4', initials: 'T' },
  { id: 'sofia', specialty: 'aesthetic', color: '#c0477f', initials: 'S' },
];
export const proById = (id: ProId) => PROS.find((p) => p.id === id)!;

export const TREATMENTS: Record<Specialty, TreatmentId[]> = {
  dental: ['cleaning', 'checkup', 'filling', 'whitening'],
  ortho: ['orthoConsult', 'braces', 'aligners'],
  aesthetic: ['facial', 'peeling', 'aestheticConsult'],
};

/** Slot start times in minutes from midnight (30-minute slots). */
export const TIMES = [540, 570, 600, 630, 660, 690, 720, 750];
/** 9:41 — the demo's "now" (matches the phone status bar). */
export const NOW_MIN = 581;

/** Monday of the demo week (UTC). Days: 0 = Monday … 5 = Saturday. */
export const WEEK_START = Date.UTC(2026, 9, 5);
export const DAYS = [0, 1, 2, 3, 4, 5];
export const TODAY = 3;
export const dayDate = (day: number, minutes = 0) => new Date(WEEK_START + day * 86_400_000 + minutes * 60_000);

export type SlotStatus = 'done' | 'now' | 'confirmed' | 'reminded' | 'new' | 'waitlist' | 'you' | 'freed' | 'noshow';

export interface Booking {
  patient: PatientId | 'you';
  treatment: TreatmentId;
  status: SlotStatus;
}

/** `${day}:${pro}:${timeIndex}` */
export type SlotKey = string;
export const slotKey = (day: number, pro: ProId, idx: number): SlotKey => `${day}:${pro}:${idx}`;
export function parseSlotKey(key: SlotKey): { day: number; pro: ProId; idx: number } {
  const [day, pro, idx] = key.split(':');
  return { day: Number(day), pro: pro as ProId, idx: Number(idx) };
}

const b = (patient: PatientId, treatment: TreatmentId, status: SlotStatus): Booking => ({ patient, treatment, status });

/** Today's agenda at 9:41, before the live story starts. Missing keys are free slots. */
export const TODAY_BASE: Record<string, Booking> = {
  'lucia:0': b('ana', 'checkup', 'done'),
  'lucia:1': b('diego', 'cleaning', 'now'),
  'lucia:2': b('carla', 'filling', 'confirmed'),
  'lucia:4': b('pedro', 'checkup', 'confirmed'),
  'lucia:5': b('martina', 'cleaning', 'reminded'),
  'lucia:7': b('lucas', 'whitening', 'confirmed'),
  'tomas:0': b('bruno', 'braces', 'done'),
  'tomas:1': b('elena', 'braces', 'now'),
  'tomas:3': b('sebastian', 'orthoConsult', 'reminded'),
  'tomas:5': b('joaquin', 'aligners', 'confirmed'),
  'tomas:6': b('valentina', 'braces', 'reminded'),
  'sofia:0': b('lola', 'facial', 'done'),
  'sofia:1': b('irene', 'peeling', 'now'),
  'sofia:2': b('florencia', 'facial', 'confirmed'),
  'sofia:4': b('micaela', 'aestheticConsult', 'confirmed'),
  'sofia:6': b('rocio', 'peeling', 'reminded'),
  'sofia:7': b('gabriela', 'facial', 'confirmed'),
};

export type StoryKind = 'new' | 'confirm' | 'cancel' | 'reschedule' | 'refill';
export interface StoryStep {
  at: number;
  slot: string; // `${pro}:${idx}` (today)
  kind: StoryKind;
  patient?: PatientId;
  treatment?: TreatmentId;
}

/** What happens live today (besides the WhatsApp conversation). */
export const STORY: StoryStep[] = [
  { at: 2, slot: 'lucia:3', kind: 'new', patient: 'camila', treatment: 'cleaning' },
  { at: 4, slot: 'tomas:6', kind: 'confirm' },
  { at: 6, slot: 'tomas:4', kind: 'new', patient: 'renata', treatment: 'orthoConsult' },
  { at: 8, slot: 'lucia:7', kind: 'cancel' },
  { at: 9, slot: 'lucia:7', kind: 'refill', patient: 'paula', treatment: 'checkup' },
  { at: 11, slot: 'sofia:5', kind: 'new', patient: 'julieta', treatment: 'peeling' },
  { at: 13, slot: 'tomas:3', kind: 'reschedule' },
  { at: 14, slot: 'tomas:3', kind: 'refill', patient: 'nicolas', treatment: 'braces' },
];

/** The patient in the WhatsApp reminder, and who takes her slot from the waitlist. */
export const CHAT = {
  patient: 'martina' as PatientId,
  slot: 'lucia:5',
  treatment: 'cleaning' as TreatmentId,
  waitlistPatient: 'julian' as PatientId,
  /** Alternatives offered when she reschedules (all free in the generated agenda). */
  options: [slotKey(4, 'lucia', 2), slotKey(4, 'lucia', 7), slotKey(5, 'lucia', 1)],
};

/** Waitlist size at 9:41; every refill takes one patient from it. */
export const WAITLIST_START = 6;
/**
 * Recoveries that happen live today (Paula, Nicolás and the WhatsApp reminder).
 * The weekly counter starts at keyNumber − this and reaches the vertical's key number.
 */
export const LIVE_RECOVERIES = 3;
/** Of the recoveries before today: how many came from the waitlist (the rest: confirmed by reminder). */
export const BASE_WAITLIST_RECOVERIES = 4;

/** No-shows per week before/after the reminders (last bar = this week = before − key number). */
export const NO_SHOWS_BEFORE = [15, 14, 16];
export const NO_SHOWS_AFTER_TREND = [7, 5];
/** Average ticket (USD) comes from content/verticals.json (calculator.ticketUsd). */

/** Past days: the only no-shows of the week (matches the dashboard). */
const NO_SHOWS: Record<string, true> = {
  [slotKey(0, 'lucia', 4)]: true,
  [slotKey(1, 'sofia', 2)]: true,
  [slotKey(2, 'tomas', 6)]: true,
};
const FORCE_FREE = new Set(CHAT.options);

function hash(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/** Deterministic agenda for the other days of the week. */
export function generatedBooking(day: number, pro: ProId, idx: number): Booking | null {
  const key = slotKey(day, pro, idx);
  if (FORCE_FREE.has(key)) return null;
  const p = PROS.findIndex((x) => x.id === pro);
  const h = hash(day * 97 + p * 31 + idx * 7 + 3);
  const fill = day < TODAY ? 84 : day === TODAY + 1 ? 72 : 58;
  if (!NO_SHOWS[key] && h % 100 >= fill) return null;
  const patient = PATIENT_POOL[(h >>> 8) % PATIENT_POOL.length];
  const list = TREATMENTS[PROS[p].specialty];
  const treatment = list[(h >>> 4) % list.length];
  if (day < TODAY) return { patient, treatment, status: NO_SHOWS[key] ? 'noshow' : 'done' };
  return { patient, treatment, status: (h >>> 12) % 3 === 0 ? 'reminded' : 'confirmed' };
}
