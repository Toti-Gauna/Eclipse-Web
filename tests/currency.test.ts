import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  convert,
  defaultCurrencyFor,
  getRates,
  isCurrency,
  loadRates,
  parseArsResponse,
  parseBrlResponse,
  resetRatesCache,
  roundForCurrency,
  RATE_ENDPOINTS,
} from '@/lib/currency';

const fallback = { ARS: 1000, BRL: 5, updatedAt: '2026-01-01', source: 'fallback' as const };
const now = () => new Date('2026-10-02T10:00:00Z');

function mockFetch(map: Record<string, unknown | Error | 'hang'>) {
  return vi.fn((url: string, init?: { signal?: AbortSignal }) => {
    const v = map[url];
    if (v === 'hang')
      return new Promise<never>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    if (v instanceof Error) return Promise.reject(v);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(v) });
  });
}

afterEach(() => {
  resetRatesCache();
  vi.useRealTimers();
});

describe('defaults', () => {
  it('maps locale → currency', () => {
    expect(defaultCurrencyFor('es')).toBe('ARS');
    expect(defaultCurrencyFor('pt')).toBe('BRL');
    expect(defaultCurrencyFor('en')).toBe('USD');
  });
  it('validates currency codes', () => {
    expect(isCurrency('ARS')).toBe(true);
    expect(isCurrency('EUR')).toBe(false);
    expect(isCurrency(null)).toBe(false);
  });
});

describe('convert + round', () => {
  it('converts from USD', () => {
    expect(convert(10, 'USD', fallback)).toBe(10);
    expect(convert(10, 'ARS', fallback)).toBe(10000);
    expect(convert(10, 'BRL', fallback)).toBe(50);
  });
  it('rounds per currency', () => {
    expect(roundForCurrency(1_234_567, 'ARS')).toBe(1_235_000);
    expect(roundForCurrency(1_234_499, 'ARS')).toBe(1_234_000);
    expect(roundForCurrency(134, 'BRL')).toBe(130);
    expect(roundForCurrency(135, 'BRL')).toBe(140);
    expect(roundForCurrency(99.5, 'USD')).toBe(100);
    expect(roundForCurrency(-0.2, 'USD')).toBe(0);
  });
});

describe('parsers', () => {
  it('reads dolarapi "venta"', () => {
    expect(parseArsResponse({ compra: 1400, venta: 1460.5 })).toBe(1460.5);
    expect(parseArsResponse({ venta: '1500' })).toBe(1500);
    expect(parseArsResponse({ venta: 0 })).toBeNull();
    expect(parseArsResponse(null)).toBeNull();
  });
  it('reads frankfurter rates.BRL', () => {
    expect(parseBrlResponse({ rates: { BRL: 5.31 } })).toBe(5.31);
    expect(parseBrlResponse({ rates: {} })).toBeNull();
  });
});

describe('loadRates', () => {
  it('uses live values when both APIs answer', async () => {
    const fetchImpl = mockFetch({
      [RATE_ENDPOINTS.ARS]: { venta: 1500 },
      [RATE_ENDPOINTS.BRL]: { rates: { BRL: 5.5 } },
    });
    await expect(loadRates({ fetchImpl, fallback, now })).resolves.toEqual({
      ARS: 1500,
      BRL: 5.5,
      updatedAt: '2026-10-02',
      source: 'live',
    });
  });
  it('falls back per currency on error', async () => {
    const fetchImpl = mockFetch({
      [RATE_ENDPOINTS.ARS]: new Error('network'),
      [RATE_ENDPOINTS.BRL]: { rates: { BRL: 5.5 } },
    });
    const r = await loadRates({ fetchImpl, fallback, now });
    expect(r.ARS).toBe(1000);
    expect(r.BRL).toBe(5.5);
    expect(r.source).toBe('fallback');
  });
  it('falls back on malformed payloads', async () => {
    const fetchImpl = mockFetch({ [RATE_ENDPOINTS.ARS]: { nope: 1 }, [RATE_ENDPOINTS.BRL]: { rates: null } });
    await expect(loadRates({ fetchImpl, fallback, now })).resolves.toEqual(fallback);
  });
  it('times out after the configured delay', async () => {
    vi.useFakeTimers();
    const fetchImpl = mockFetch({ [RATE_ENDPOINTS.ARS]: 'hang', [RATE_ENDPOINTS.BRL]: 'hang' });
    const p = loadRates({ fetchImpl, fallback, now, timeoutMs: 3000 });
    await vi.advanceTimersByTimeAsync(3001);
    await expect(p).resolves.toEqual(fallback);
  });
});

describe('getRates cache', () => {
  it('fetches once per page life', async () => {
    const fetchImpl = mockFetch({
      [RATE_ENDPOINTS.ARS]: { venta: 1500 },
      [RATE_ENDPOINTS.BRL]: { rates: { BRL: 5.5 } },
    });
    const a = await getRates({ fetchImpl, fallback, now });
    const b = await getRates({ fetchImpl, fallback, now });
    expect(a).toBe(b);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
