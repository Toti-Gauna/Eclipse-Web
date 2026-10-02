/**
 * "¿Cuánto te cuesta no tener esto?" — pure logic for the loss calculator.
 * Every amount is USD; conversion and formatting happen at the edge (useCurrency).
 *
 * Formula (monthly):
 *   lost revenue = lostPerWeek × ticketUsd × WEEKS_PER_MONTH
 *   team time    = hoursPerWeek × WEEKS_PER_MONTH × hourlyUsd   (hourlyUsd defaults to 5 USD)
 *   total        = lost revenue + team time
 */
import { verticals as allVerticals, type Rates, type Vertical, type VerticalId } from '@/lib/content';
import { convert, type Currency } from '@/lib/currency';

export const WEEKS_PER_MONTH = 4.3;
export const DEFAULT_HOURLY_USD = 5;

export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

/** Slider ranges. The ticket is stored in USD (step 5) whatever the display currency. */
export const CALCULATOR_RANGES = {
  lostPerWeek: { min: 0, max: 50, step: 1 },
  ticketUsd: { min: 5, max: 500, step: 5 },
  hoursPerWeek: { min: 0, max: 40, step: 1 },
} as const satisfies Record<string, SliderRange>;

export type CalculatorField = keyof typeof CALCULATOR_RANGES;

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

/** Clamps a value to a slider range and snaps it to the range's step. */
export function clampToRange(value: number, range: SliderRange): number {
  if (!Number.isFinite(value)) return range.min;
  const snapped = range.min + Math.round((value - range.min) / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, snapped));
}

/** Position of a value inside its range, 0–100 (for the slider fill). */
export function rangePercent(value: number, range: SliderRange): number {
  const span = range.max - range.min;
  if (span <= 0) return 0;
  return Math.min(100, Math.max(0, ((value - range.min) / span) * 100));
}

/** Clamps every field to its slider range. */
export function clampValues(values: CalculatorValues): CalculatorValues {
  return {
    lostPerWeek: clampToRange(values.lostPerWeek, CALCULATOR_RANGES.lostPerWeek),
    ticketUsd: clampToRange(values.ticketUsd, CALCULATOR_RANGES.ticketUsd),
    hoursPerWeek: clampToRange(values.hoursPerWeek, CALCULATOR_RANGES.hoursPerWeek),
  };
}

/** Default slider values for a vertical (content/verticals.json → calculator), clamped to the ranges. */
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
