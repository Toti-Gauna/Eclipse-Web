/**
 * "¿Cuánto te cuesta no tener esto?" — pure logic for the loss calculator.
 * Every amount is USD; conversion and formatting happen at the edge (useCurrency).
 *
 * Formula (monthly):
 *   lost revenue = lostPerWeek × ticketUsd × WEEKS_PER_MONTH
 *   team time    = hoursPerWeek × WEEKS_PER_MONTH × hourlyUsd   (hourlyUsd defaults to 5 USD)
 *   total        = lost revenue + team time
 *
 * The visitor edits the numbers as a sentence ("Cada semana se pierden [10] turnos…") with
 * −/+ steppers, typing and preset chips. Counts step by 1; the ticket is edited in the
 * display currency (steps and presets are "nice" local amounts, see ticketStep / ticketPresets).
 */
import { verticals as allVerticals, type Rates, type Vertical, type VerticalId } from '@/lib/content';
import { convert, type Currency } from '@/lib/currency';

export const WEEKS_PER_MONTH = 4.3;
export const DEFAULT_HOURLY_USD = 5;
export const MONTHS_PER_YEAR = 12;

export interface ValueRange {
  min: number;
  max: number;
  step: number;
}

/** Accepted values. The ticket is USD (any amount: it is typed in the display currency). */
export const CALCULATOR_RANGES = {
  lostPerWeek: { min: 0, max: 200, step: 1 },
  ticketUsd: { min: 1, max: 2000, step: 1 },
  hoursPerWeek: { min: 0, max: 80, step: 1 },
} as const satisfies Record<string, ValueRange>;

export type CalculatorField = keyof typeof CALCULATOR_RANGES;
export type CountField = Exclude<CalculatorField, 'ticketUsd'>;

/** Quick values offered under the sentence for the field being edited. */
export const COUNT_PRESETS: Record<CountField, readonly number[]> = {
  lostPerWeek: [5, 10, 20, 40],
  hoursPerWeek: [2, 5, 10, 20],
};
/** Ticket presets as USD anchors, shown as "nice" amounts in the display currency. */
export const TICKET_PRESETS_USD: readonly number[] = [10, 25, 50, 100];

export interface CalculatorValues {
  lostPerWeek: number;
  ticketUsd: number;
  hoursPerWeek: number;
}

export interface CalculatorInput extends CalculatorValues {
  hourlyUsd?: number;
}

export interface MonthlyLoss {
  /** Lost bookings / inquiries / members × ticket, per month (USD). */
  lostRevenueUsd: number;
  /** Team hours spent on repetitive tasks, valued per hour, per month (USD). */
  timeCostUsd: number;
  totalUsd: number;
  /** Lost bookings / inquiries per month (one decimal, e.g. 5 a week → 21.5). */
  lostPerMonth: number;
  /** Hours per month on repetitive tasks (one decimal, e.g. 6 a week → 25.8). */
  hoursPerMonth: number;
}

/** Non-finite or negative → 0. */
function nonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Rounds to cents so floating-point noise (4.3 × …) never leaks into the UI or tests. */
function cents(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Weekly amount → monthly, to one decimal (10 a week → 43, 5 a week → 21.5).
 * One decimal keeps the breakdown honest: "21,5 × ticket" adds up to the amount shown.
 */
export function perMonth(perWeek: number): number {
  return Math.round(nonNegative(perWeek) * WEEKS_PER_MONTH * 10) / 10;
}

/** Units of the display currency per USD (1 for USD). */
export function rateOf(currency: Currency, rates: Pick<Rates, 'ARS' | 'BRL'>): number {
  return currency === 'USD' ? 1 : rates[currency];
}

/**
 * The hourly value in the display currency, rounded finer than prices (ARS → 10,
 * BRL / USD → 1) so "hours × rate" matches the team-time amount: 5 USD is R$ 27, not R$ 30.
 */
export function hourlyRateIn(
  currency: Currency,
  rates: Pick<Rates, 'ARS' | 'BRL'>,
  hourlyUsd: number = DEFAULT_HOURLY_USD,
): number {
  const step = currency === 'ARS' ? 10 : 1;
  return Math.round(convert(nonNegative(hourlyUsd), currency, rates) / step) * step;
}

export function monthlyLoss({ lostPerWeek, ticketUsd, hoursPerWeek, hourlyUsd = DEFAULT_HOURLY_USD }: CalculatorInput): MonthlyLoss {
  const lost = nonNegative(lostPerWeek);
  const ticket = nonNegative(ticketUsd);
  const hours = nonNegative(hoursPerWeek);
  const hourly = nonNegative(hourlyUsd);
  const lostRevenueUsd = cents(lost * ticket * WEEKS_PER_MONTH);
  const timeCostUsd = cents(hours * WEEKS_PER_MONTH * hourly);
  return {
    lostRevenueUsd,
    timeCostUsd,
    totalUsd: cents(lostRevenueUsd + timeCostUsd),
    lostPerMonth: perMonth(lost),
    hoursPerMonth: perMonth(hours),
  };
}

/** A monthly amount over a year. */
export function perYear(monthlyUsd: number): number {
  return cents(nonNegative(monthlyUsd) * MONTHS_PER_YEAR);
}

/** Clamps a value to a range and snaps it to the range's step. */
export function clampToRange(value: number, range: ValueRange): number {
  if (!Number.isFinite(value)) return range.min;
  const snapped = range.min + Math.round((value - range.min) / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, snapped));
}

export type RangeEdge = 'min' | 'max';

/**
 * Which end of the range a typed value went past (null when it fits): the calculator
 * clamps it and says so next to the field ("Máximo 200: usamos ese número").
 */
export function outOfRange(value: number, range: Pick<ValueRange, 'min' | 'max'>): RangeEdge | null {
  if (!Number.isFinite(value)) return null;
  if (value > range.max) return 'max';
  if (value < range.min) return 'min';
  return null;
}

/** Clamps a USD ticket to its range without snapping (it comes from a local amount). */
export function clampTicketUsd(value: number): number {
  const { min, max } = CALCULATOR_RANGES.ticketUsd;
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Clamps every field to its range. */
export function clampValues(values: CalculatorValues): CalculatorValues {
  return {
    lostPerWeek: clampToRange(values.lostPerWeek, CALCULATOR_RANGES.lostPerWeek),
    ticketUsd: clampTicketUsd(values.ticketUsd),
    hoursPerWeek: clampToRange(values.hoursPerWeek, CALCULATOR_RANGES.hoursPerWeek),
  };
}

/** Default values for a vertical (content/verticals.json → calculator), clamped to the ranges. */
export function calculatorDefaults(id: VerticalId, list: readonly Vertical[] = allVerticals): CalculatorValues {
  const v = list.find((x) => x.id === id) ?? list.find((x) => x.id === 'otro') ?? list[0];
  const c = v?.calculator ?? { lostPerWeek: 0, ticketUsd: CALCULATOR_RANGES.ticketUsd.min, hoursPerWeek: 0 };
  return clampValues({ lostPerWeek: c.lostPerWeek, ticketUsd: c.ticketUsd, hoursPerWeek: c.hoursPerWeek });
}

/** Share of the total that each part represents, 0–1 (both 0 when the total is 0). */
export function lossShares(loss: Pick<MonthlyLoss, 'lostRevenueUsd' | 'timeCostUsd' | 'totalUsd'>): { revenue: number; time: number } {
  if (loss.totalUsd <= 0) return { revenue: 0, time: 0 };
  return { revenue: loss.lostRevenueUsd / loss.totalUsd, time: loss.timeCostUsd / loss.totalUsd };
}

// ---------------------------------------------------------------------------
// Editing: steppers, typing, presets
// ---------------------------------------------------------------------------

/** One stepper press on a count field (±1 × times), clamped. */
export function stepCount(value: number, direction: 1 | -1, range: ValueRange, times = 1): number {
  const base = clampToRange(value, range);
  return clampToRange(base + direction * range.step * Math.max(1, Math.round(times)), range);
}

/** Digits typed by the visitor → integer (separators and symbols ignored). null when empty. */
export function parseTyped(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number(digits.slice(0, 12));
  return Number.isFinite(n) ? n : null;
}

const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 10];

/** Nearest "nice" amount (1 · 1,5 · 2 · 2,5 · 3 · 4 · 5 · 6 · 7,5 × 10ⁿ): 14.500 → 15.000, 36.250 → 40.000. */
export function niceRound(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const n = value / magnitude;
  const best = NICE.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
  return Math.round(best * magnitude);
}

/** Rounds to two significant digits (43.125 → 43.000, 162 → 160, 30 → 30). */
export function roundSignificant(value: number, digits = 2): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(value)) - (digits - 1));
  return Math.round(value / magnitude) * magnitude;
}

/**
 * Stepper size for an amount in the display currency: the largest 1·2·5 × 10ⁿ that is
 * at most a tenth of the amount (43.500 → 2.000, 7.250 → 500, 30 → 2, 162 → 10). Min 1.
 */
export function ticketStep(amount: number): number {
  const target = Math.max(1, amount) / 10;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const best = [5, 2, 1].map((k) => k * magnitude).find((s) => s <= target) ?? magnitude;
  return Math.max(1, best);
}

/** Next local amount for a stepper press: snaps to the step grid (43.500 + → 44.000, − → 42.000). */
export function stepAmount(amount: number, direction: 1 | -1): number {
  const step = ticketStep(amount);
  const next = direction > 0 ? (Math.floor(amount / step) + 1) * step : (Math.ceil(amount / step) - 1) * step;
  return Math.max(0, next);
}

/** Ticket bounds in the display currency (integers). */
export function ticketBounds(currency: Currency, rates: Pick<Rates, 'ARS' | 'BRL'>): { min: number; max: number } {
  const rate = rateOf(currency, rates);
  return {
    min: Math.ceil(CALCULATOR_RANGES.ticketUsd.min * rate),
    max: Math.floor(CALCULATOR_RANGES.ticketUsd.max * rate),
  };
}

/** A local amount → the USD ticket it represents (clamped to the range). */
export function ticketUsdFromLocal(local: number, currency: Currency, rates: Pick<Rates, 'ARS' | 'BRL'>): number {
  const { min, max } = ticketBounds(currency, rates);
  const clamped = Math.min(max, Math.max(min, Math.round(nonNegative(local))));
  return clampTicketUsd(clamped / rateOf(currency, rates));
}

/**
 * The ticket as the visitor sees it: an integer in the display currency, plus the USD
 * value that integer represents (used for the maths, so "43 × $ 43.000" adds up).
 * Content defaults (`edited` false) show as a round number (two significant digits);
 * amounts the visitor typed or stepped stay exact.
 */
export function displayTicket(
  ticketUsd: number,
  edited: boolean,
  currency: Currency,
  rates: Pick<Rates, 'ARS' | 'BRL'>,
): { local: number; usd: number } {
  const raw = convert(clampTicketUsd(ticketUsd), currency, rates);
  const { min, max } = ticketBounds(currency, rates);
  const shown = edited ? Math.round(raw) : roundSignificant(raw);
  const local = Math.min(max, Math.max(min, shown));
  return { local, usd: local / rateOf(currency, rates) };
}

/** Ticket presets in the display currency: nice amounts, unique, ascending. */
export function ticketPresets(currency: Currency, rates: Pick<Rates, 'ARS' | 'BRL'>, anchors: readonly number[] = TICKET_PRESETS_USD): number[] {
  return [...new Set(anchors.map((usd) => niceRound(convert(usd, currency, rates))))].filter((n) => n > 0).sort((a, b) => a - b);
}
