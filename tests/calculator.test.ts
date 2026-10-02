import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_RANGES,
  DEFAULT_HOURLY_USD,
  WEEKS_PER_MONTH,
  calculatorDefaults,
  clampToRange,
  clampValues,
  hourlyRateIn,
  lossShares,
  monthlyLoss,
  perMonth,
  rangePercent,
} from '@/lib/calculator';
import { formatMoney } from '@/lib/pricing';
import { verticals, type Vertical } from '@/lib/content';

const rates = { ARS: 1450, BRL: 5.4 };

describe('constants', () => {
  it('uses 4.3 weeks per month and 5 USD per hour', () => {
    expect(WEEKS_PER_MONTH).toBe(4.3);
    expect(DEFAULT_HOURLY_USD).toBe(5);
  });
  it('ranges match the brief', () => {
    expect(CALCULATOR_RANGES.lostPerWeek).toEqual({ min: 0, max: 50, step: 1 });
    expect(CALCULATOR_RANGES.ticketUsd).toEqual({ min: 5, max: 500, step: 5 });
    expect(CALCULATOR_RANGES.hoursPerWeek).toEqual({ min: 0, max: 40, step: 1 });
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
    const r = monthlyLoss({ lostPerWeek: 50, ticketUsd: 500, hoursPerWeek: 40 });
    expect(r.totalUsd).toBe(107500 + 860);
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
});

describe('clampToRange / clampValues', () => {
  it('snaps to the step and clamps to the range', () => {
    expect(clampToRange(37, CALCULATOR_RANGES.ticketUsd)).toBe(35);
    expect(clampToRange(38, CALCULATOR_RANGES.ticketUsd)).toBe(40);
    expect(clampToRange(0, CALCULATOR_RANGES.ticketUsd)).toBe(5);
    expect(clampToRange(9999, CALCULATOR_RANGES.ticketUsd)).toBe(500);
    expect(clampToRange(-4, CALCULATOR_RANGES.lostPerWeek)).toBe(0);
    expect(clampToRange(Number.NaN, CALCULATOR_RANGES.hoursPerWeek)).toBe(0);
  });
  it('clamps every field', () => {
    expect(clampValues({ lostPerWeek: 80, ticketUsd: 2, hoursPerWeek: 12.4 })).toEqual({
      lostPerWeek: 50,
      ticketUsd: 5,
      hoursPerWeek: 12,
    });
  });
});

describe('rangePercent', () => {
  it('maps a value to 0–100', () => {
    expect(rangePercent(0, CALCULATOR_RANGES.lostPerWeek)).toBe(0);
    expect(rangePercent(25, CALCULATOR_RANGES.lostPerWeek)).toBe(50);
    expect(rangePercent(500, CALCULATOR_RANGES.ticketUsd)).toBe(100);
    expect(rangePercent(5000, CALCULATOR_RANGES.ticketUsd)).toBe(100);
    expect(rangePercent(5, { min: 5, max: 5, step: 1 })).toBe(0);
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

  it('every vertical default sits inside the slider ranges', () => {
    for (const v of verticals) {
      const c = v.calculator;
      expect(c.lostPerWeek).toBeGreaterThanOrEqual(CALCULATOR_RANGES.lostPerWeek.min);
      expect(c.lostPerWeek).toBeLessThanOrEqual(CALCULATOR_RANGES.lostPerWeek.max);
      expect(c.ticketUsd).toBeGreaterThanOrEqual(CALCULATOR_RANGES.ticketUsd.min);
      expect(c.ticketUsd).toBeLessThanOrEqual(CALCULATOR_RANGES.ticketUsd.max);
      expect(c.ticketUsd % CALCULATOR_RANGES.ticketUsd.step).toBe(0);
      expect(c.hoursPerWeek).toBeGreaterThanOrEqual(CALCULATOR_RANGES.hoursPerWeek.min);
      expect(c.hoursPerWeek).toBeLessThanOrEqual(CALCULATOR_RANGES.hoursPerWeek.max);
    }
  });

  it('falls back to "otro" for an unknown id and clamps out-of-range content', () => {
    const list = [
      { ...verticals.find((v) => v.id === 'otro')!, calculator: { ...verticals[0].calculator, lostPerWeek: 99, ticketUsd: 3, hoursPerWeek: 5 } },
    ] as Vertical[];
    expect(calculatorDefaults('clinicas', list)).toEqual({ lostPerWeek: 50, ticketUsd: 5, hoursPerWeek: 5 });
  });

  it('clinic defaults → USD 1.462 per month, ≈ $ 2.120.000 in ARS', () => {
    const r = monthlyLoss(calculatorDefaults('clinicas'));
    expect(r.totalUsd).toBe(1462);
    expect(formatMoney(r.totalUsd, 'ARS', rates, 'es')).toBe('≈ $ 2.120.000');
    expect(formatMoney(r.totalUsd, 'USD', rates, 'en')).toBe('$1,462');
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
