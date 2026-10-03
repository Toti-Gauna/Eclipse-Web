import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_RANGES,
  COUNT_PRESETS,
  DEFAULT_HOURLY_USD,
  WEEKS_PER_MONTH,
  calculatorDefaults,
  clampTicketUsd,
  clampToRange,
  clampValues,
  displayTicket,
  hourlyRateIn,
  lossShares,
  monthlyLoss,
  niceRound,
  parseTyped,
  perMonth,
  perYear,
  rateOf,
  roundSignificant,
  stepAmount,
  stepCount,
  ticketBounds,
  ticketPresets,
  ticketStep,
  ticketUsdFromLocal,
} from '@/lib/calculator';
import { formatMoney } from '@/lib/pricing';
import { verticals, type Vertical } from '@/lib/content';

const rates = { ARS: 1450, BRL: 5.4 };
/** Intl uses no-break spaces; compare with plain ones. */
const clean = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

describe('constants', () => {
  it('uses 4.3 weeks per month and 5 USD per hour', () => {
    expect(WEEKS_PER_MONTH).toBe(4.3);
    expect(DEFAULT_HOURLY_USD).toBe(5);
  });
  it('accepts the numbers a real business types', () => {
    expect(CALCULATOR_RANGES.lostPerWeek).toEqual({ min: 0, max: 200, step: 1 });
    expect(CALCULATOR_RANGES.ticketUsd).toMatchObject({ min: 1, max: 2000 });
    expect(CALCULATOR_RANGES.hoursPerWeek).toEqual({ min: 0, max: 80, step: 1 });
  });
  it('count presets sit inside their ranges', () => {
    for (const field of ['lostPerWeek', 'hoursPerWeek'] as const) {
      for (const n of COUNT_PRESETS[field]) {
        expect(n).toBeGreaterThanOrEqual(CALCULATOR_RANGES[field].min);
        expect(n).toBeLessThanOrEqual(CALCULATOR_RANGES[field].max);
      }
    }
  });
});

describe('monthlyLoss', () => {
  it('(perdidos × ticket × 4,3) + (horas × 4,3 × valorHora)', () => {
    const r = monthlyLoss({ lostPerWeek: 10, ticketUsd: 30, hoursPerWeek: 8 });
    expect(r.lostRevenueUsd).toBe(1290);
    expect(r.timeCostUsd).toBe(172);
    expect(r.totalUsd).toBe(1462);
  });

  it('accepts a custom hourly value', () => {
    const r = monthlyLoss({ lostPerWeek: 0, ticketUsd: 100, hoursPerWeek: 10, hourlyUsd: 12 });
    expect(r.lostRevenueUsd).toBe(0);
    expect(r.timeCostUsd).toBe(516);
    expect(r.totalUsd).toBe(516);
  });

  it('is zero when nothing is lost', () => {
    expect(monthlyLoss({ lostPerWeek: 0, ticketUsd: 500, hoursPerWeek: 0 }).totalUsd).toBe(0);
  });

  it('treats negative or non-finite inputs as 0', () => {
    const r = monthlyLoss({ lostPerWeek: -3, ticketUsd: Number.NaN, hoursPerWeek: Number.POSITIVE_INFINITY });
    expect(r).toEqual({ lostRevenueUsd: 0, timeCostUsd: 0, totalUsd: 0, lostPerMonth: 0, hoursPerMonth: 0 });
  });

  it('never leaks floating-point noise', () => {
    const r = monthlyLoss({ lostPerWeek: 3, ticketUsd: 35, hoursPerWeek: 7 });
    expect(r.lostRevenueUsd).toBe(451.5);
    expect(r.timeCostUsd).toBe(150.5);
    expect(r.totalUsd).toBe(602);
  });

  it('reports monthly volumes to one decimal, so the breakdown adds up', () => {
    const r = monthlyLoss({ lostPerWeek: 3, ticketUsd: 30, hoursPerWeek: 8 });
    expect(r.lostPerMonth).toBe(12.9);
    expect(r.hoursPerMonth).toBe(34.4);
    expect(r.lostPerMonth * 30).toBeCloseTo(r.lostRevenueUsd);
    expect(r.hoursPerMonth * DEFAULT_HOURLY_USD).toBeCloseTo(r.timeCostUsd);
  });

  it('maximum inputs stay finite', () => {
    const r = monthlyLoss({ lostPerWeek: 200, ticketUsd: 2000, hoursPerWeek: 80 });
    expect(r.totalUsd).toBe(1_720_000 + 1720);
  });

  it('a year is twelve months', () => {
    expect(perYear(1462)).toBe(17544);
    expect(perYear(-1)).toBe(0);
  });
});

describe('perMonth', () => {
  it('converts weekly volumes to monthly, one decimal', () => {
    expect(perMonth(10)).toBe(43);
    expect(perMonth(5)).toBe(21.5);
    expect(perMonth(6)).toBe(25.8);
    expect(perMonth(7)).toBe(30.1);
    expect(perMonth(0)).toBe(0);
    expect(perMonth(-1)).toBe(0);
  });
});

describe('hourlyRateIn', () => {
  it('converts the hourly value without the coarse price rounding', () => {
    expect(hourlyRateIn('USD', rates)).toBe(5);
    expect(hourlyRateIn('BRL', rates)).toBe(27); // a price would round to R$ 30
    expect(hourlyRateIn('ARS', rates)).toBe(7250); // a price would round to $ 7.000
    expect(hourlyRateIn('ARS', { ARS: 1437.5, BRL: 5.4 })).toBe(7190); // nearest 10
    expect(hourlyRateIn('BRL', rates, 12)).toBe(65);
    expect(hourlyRateIn('USD', rates, -3)).toBe(0);
  });

  it('hours × rate matches the team-time amount within rounding', () => {
    const r = monthlyLoss({ lostPerWeek: 0, ticketUsd: 30, hoursPerWeek: 40 });
    const brl = r.timeCostUsd * rates.BRL; // 928.8 → shown as ≈ R$ 930
    expect(Math.abs(r.hoursPerMonth * hourlyRateIn('BRL', rates) - brl) / brl).toBeLessThan(0.01);
  });

  it('rateOf is 1 for USD', () => {
    expect(rateOf('USD', rates)).toBe(1);
    expect(rateOf('ARS', rates)).toBe(1450);
  });
});

describe('clamping', () => {
  it('counts snap to the step and stay in range', () => {
    expect(clampToRange(12.4, CALCULATOR_RANGES.hoursPerWeek)).toBe(12);
    expect(clampToRange(-4, CALCULATOR_RANGES.lostPerWeek)).toBe(0);
    expect(clampToRange(999, CALCULATOR_RANGES.lostPerWeek)).toBe(200);
    expect(clampToRange(Number.NaN, CALCULATOR_RANGES.hoursPerWeek)).toBe(0);
  });
  it('the ticket is clamped but never snapped (it comes from a local amount)', () => {
    expect(clampTicketUsd(29.66)).toBe(29.66);
    expect(clampTicketUsd(0)).toBe(1);
    expect(clampTicketUsd(99999)).toBe(2000);
    expect(clampTicketUsd(Number.NaN)).toBe(1);
  });
  it('clamps every field', () => {
    expect(clampValues({ lostPerWeek: 800, ticketUsd: 0.2, hoursPerWeek: 12.4 })).toEqual({
      lostPerWeek: 200,
      ticketUsd: 1,
      hoursPerWeek: 12,
    });
  });
});

describe('calculatorDefaults', () => {
  it('reads every vertical from content/verticals.json', () => {
    for (const v of verticals) {
      expect(calculatorDefaults(v.id)).toEqual({
        lostPerWeek: v.calculator.lostPerWeek,
        ticketUsd: v.calculator.ticketUsd,
        hoursPerWeek: v.calculator.hoursPerWeek,
      });
    }
  });

  it('every vertical default sits inside the ranges', () => {
    for (const v of verticals) {
      const c = v.calculator;
      expect(c.lostPerWeek).toBeGreaterThanOrEqual(CALCULATOR_RANGES.lostPerWeek.min);
      expect(c.lostPerWeek).toBeLessThanOrEqual(CALCULATOR_RANGES.lostPerWeek.max);
      expect(c.ticketUsd).toBeGreaterThanOrEqual(CALCULATOR_RANGES.ticketUsd.min);
      expect(c.ticketUsd).toBeLessThanOrEqual(CALCULATOR_RANGES.ticketUsd.max);
      expect(c.hoursPerWeek).toBeGreaterThanOrEqual(CALCULATOR_RANGES.hoursPerWeek.min);
      expect(c.hoursPerWeek).toBeLessThanOrEqual(CALCULATOR_RANGES.hoursPerWeek.max);
    }
  });

  it('falls back to "otro" for an unknown id and clamps out-of-range content', () => {
    const list = [
      { ...verticals.find((v) => v.id === 'otro')!, calculator: { ...verticals[0].calculator, lostPerWeek: 999, ticketUsd: 0.5, hoursPerWeek: 5 } },
    ] as Vertical[];
    expect(calculatorDefaults('clinicas', list)).toEqual({ lostPerWeek: 200, ticketUsd: 1, hoursPerWeek: 5 });
  });

  it('clinic defaults → USD 1.462 per month, ≈ $ 2.120.000 in ARS', () => {
    const r = monthlyLoss(calculatorDefaults('clinicas'));
    expect(r.totalUsd).toBe(1462);
    expect(clean(formatMoney(r.totalUsd, 'ARS', rates, 'es'))).toBe('≈ $ 2.120.000');
    expect(clean(formatMoney(r.totalUsd, 'USD', rates, 'en'))).toBe('$1,462');
  });
});

describe('lossShares', () => {
  it('splits the total between lost revenue and team time', () => {
    const s = lossShares(monthlyLoss({ lostPerWeek: 10, ticketUsd: 30, hoursPerWeek: 8 }));
    expect(s.revenue).toBeCloseTo(1290 / 1462);
    expect(s.time).toBeCloseTo(172 / 1462);
    expect(s.revenue + s.time).toBeCloseTo(1);
  });
  it('is zero when the total is zero', () => {
    expect(lossShares({ lostRevenueUsd: 0, timeCostUsd: 0, totalUsd: 0 })).toEqual({ revenue: 0, time: 0 });
  });
});

describe('editing', () => {
  it('count steppers move by one (or more on long press) and stay in range', () => {
    expect(stepCount(10, 1, CALCULATOR_RANGES.lostPerWeek)).toBe(11);
    expect(stepCount(10, -1, CALCULATOR_RANGES.lostPerWeek)).toBe(9);
    expect(stepCount(0, -1, CALCULATOR_RANGES.lostPerWeek)).toBe(0);
    expect(stepCount(198, 1, CALCULATOR_RANGES.lostPerWeek, 5)).toBe(200);
    expect(stepCount(12, 1, CALCULATOR_RANGES.hoursPerWeek, 5)).toBe(17);
  });

  it('parses what the visitor types, whatever the separators', () => {
    expect(parseTyped('43.500')).toBe(43500);
    expect(parseTyped('43,500')).toBe(43500);
    expect(parseTyped('$ 1.200')).toBe(1200);
    expect(parseTyped('12')).toBe(12);
    expect(parseTyped('')).toBeNull();
    expect(parseTyped('abc')).toBeNull();
  });

  it('nice and significant rounding', () => {
    expect(niceRound(14500)).toBe(15000);
    expect(niceRound(36250)).toBe(40000);
    expect(niceRound(72500)).toBe(75000);
    expect(niceRound(135)).toBe(150);
    expect(niceRound(540)).toBe(500);
    expect(niceRound(25)).toBe(25);
    expect(niceRound(0)).toBe(0);
    expect(roundSignificant(43125)).toBe(43000);
    expect(roundSignificant(162)).toBe(160);
    expect(roundSignificant(30)).toBe(30);
    expect(roundSignificant(5)).toBe(5);
  });

  it('ticket steps are about a tenth of the amount, on a 1·2·5 grid', () => {
    expect(ticketStep(43500)).toBe(2000);
    expect(ticketStep(7250)).toBe(500);
    expect(ticketStep(30)).toBe(2);
    expect(ticketStep(162)).toBe(10);
    expect(ticketStep(3)).toBe(1);
    expect(stepAmount(43500, 1)).toBe(44000);
    expect(stepAmount(44000, 1)).toBe(46000);
    expect(stepAmount(43500, -1)).toBe(42000);
    expect(stepAmount(30, 1)).toBe(32);
    expect(stepAmount(1, -1)).toBe(0);
  });

  it('ticket bounds and conversion from a local amount', () => {
    expect(ticketBounds('ARS', rates)).toEqual({ min: 1450, max: 2_900_000 });
    expect(ticketBounds('USD', rates)).toEqual({ min: 1, max: 2000 });
    expect(ticketUsdFromLocal(43500, 'ARS', rates)).toBe(30);
    expect(ticketUsdFromLocal(10, 'ARS', rates)).toBe(1); // below the minimum
    expect(ticketUsdFromLocal(54, 'BRL', rates)).toBe(10);
  });

  it('defaults show as round local amounts; edited tickets stay exact', () => {
    expect(displayTicket(30, false, 'ARS', rates)).toEqual({ local: 44000, usd: 44000 / 1450 });
    expect(displayTicket(30, false, 'BRL', rates)).toEqual({ local: 160, usd: 160 / 5.4 });
    expect(displayTicket(30, false, 'USD', rates)).toEqual({ local: 30, usd: 30 });
    expect(displayTicket(47350 / 1450, true, 'ARS', rates).local).toBe(47350);
  });

  it('the maths on the displayed ticket adds up: count × local ticket = local amount', () => {
    const t = displayTicket(30, false, 'ARS', rates);
    const r = monthlyLoss({ lostPerWeek: 10, ticketUsd: t.usd, hoursPerWeek: 0 });
    // Only the cents rounding of the USD amount separates them (< 1 cent × rate).
    expect(Math.abs(r.lostPerMonth * t.local - r.lostRevenueUsd * 1450)).toBeLessThan(0.01 * 1450);
  });

  it('ticket presets are nice amounts in each currency', () => {
    expect(ticketPresets('USD', rates)).toEqual([10, 25, 50, 100]);
    expect(ticketPresets('ARS', rates)).toEqual([15000, 40000, 75000, 150000]);
    expect(ticketPresets('BRL', rates)).toEqual([50, 150, 250, 500]);
  });
});
