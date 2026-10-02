/**
 * Currency conversion. Every price in /content is in USD; ARS and BRL are
 * reference values computed client-side from today's rate.
 *
 * - ARS: dólar MEP (dolarapi.com "bolsa", field `venta`)
 * - BRL: frankfurter (ECB reference rate)
 * Each request has a 3 s timeout, results are cached in memory, and any failure
 * falls back to /content/rates.fallback.json (per currency).
 */
import { fallbackRates, type Rates } from '@/lib/content';
import type { Locale } from '@/i18n/routing';

export type Currency = 'ARS' | 'BRL' | 'USD';
export const CURRENCIES: readonly Currency[] = ['ARS', 'BRL', 'USD'] as const;

export const RATE_ENDPOINTS = {
  ARS: 'https://dolarapi.com/v1/dolares/bolsa',
  BRL: 'https://api.frankfurter.app/latest?from=USD&to=BRL',
} as const;

export const RATES_TIMEOUT_MS = 3000;

export const CURRENCY_STORAGE_KEY = 'eclipse:currency';

const DEFAULT_CURRENCY: Record<Locale, Currency> = { es: 'ARS', pt: 'BRL', en: 'USD' };

export function defaultCurrencyFor(locale: Locale): Currency {
  return DEFAULT_CURRENCY[locale] ?? 'USD';
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

/** Converts a USD amount to the target currency (unrounded). */
export function convert(usd: number, currency: Currency, rates: Pick<Rates, 'ARS' | 'BRL'>): number {
  if (currency === 'USD') return usd;
  return usd * rates[currency];
}

/** ARS → nearest 1.000, BRL → nearest 10, USD → integer. */
export function roundForCurrency(value: number, currency: Currency): number {
  const step = currency === 'ARS' ? 1000 : currency === 'BRL' ? 10 : 1;
  const rounded = Math.round(value / step) * step;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** ARS and BRL are always shown as approximations ("≈"). */
export function isApproximate(currency: Currency): boolean {
  return currency !== 'USD';
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export async function fetchJsonWithTimeout(
  url: string,
  timeoutMs = RATES_TIMEOUT_MS,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await Promise.race([
      fetchImpl(url, { signal: controller.signal }),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error(`timeout after ${timeoutMs}ms`)));
      }),
    ]);
    if (!res.ok) throw new Error(`HTTP error for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function positive(n: unknown): number | null {
  const v = typeof n === 'string' ? Number(n) : n;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

export function parseArsResponse(json: unknown): number | null {
  if (!json || typeof json !== 'object') return null;
  return positive((json as { venta?: unknown }).venta);
}

export function parseBrlResponse(json: unknown): number | null {
  if (!json || typeof json !== 'object') return null;
  return positive((json as { rates?: { BRL?: unknown } }).rates?.BRL);
}

let cache: Promise<Rates> | null = null;

/**
 * Fetches today's rates once per page life (in-memory cache). Never rejects:
 * any currency that fails or times out uses the fallback value.
 */
export function getRates(options: { fetchImpl?: FetchLike; timeoutMs?: number; fallback?: Rates; now?: () => Date } = {}): Promise<Rates> {
  if (!cache) cache = loadRates(options);
  return cache;
}

export async function loadRates({
  fetchImpl,
  timeoutMs = RATES_TIMEOUT_MS,
  fallback = fallbackRates,
  now = () => new Date(),
}: { fetchImpl?: FetchLike; timeoutMs?: number; fallback?: Rates; now?: () => Date } = {}): Promise<Rates> {
  const [ars, brl] = await Promise.all([
    fetchJsonWithTimeout(RATE_ENDPOINTS.ARS, timeoutMs, fetchImpl).then(parseArsResponse, () => null),
    fetchJsonWithTimeout(RATE_ENDPOINTS.BRL, timeoutMs, fetchImpl).then(parseBrlResponse, () => null),
  ]);
  const live = ars !== null && brl !== null;
  return {
    ARS: ars ?? fallback.ARS,
    BRL: brl ?? fallback.BRL,
    updatedAt: live || ars !== null || brl !== null ? now().toISOString().slice(0, 10) : fallback.updatedAt,
    source: live ? 'live' : 'fallback',
  };
}

/** Test helper. */
export function resetRatesCache(): void {
  cache = null;
}
