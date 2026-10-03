'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { localeTags, type Locale } from '@/i18n/routing';
import { fallbackRates, type Rates } from '@/lib/content';
import { CURRENCY_STORAGE_KEY, defaultCurrencyFor, getRates, isCurrency, type Currency } from '@/lib/currency';
import { formatMoney, toCurrency } from '@/lib/pricing';
import { track } from '@/lib/analytics';

interface CurrencyContextValue {
  locale: Locale;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: Rates;
  /** Formats a USD amount in the active currency (ARS/BRL get "≈"). */
  format: (usd: number, options?: { approx?: boolean }) => string;
  /** Converted + rounded number in the active currency. */
  convert: (usd: number) => number;
  /** Today's rate as money: ARS → "$ 1.450", BRL → "R$ 5,40" (what 1 USD is worth). */
  formatRate: (currency: Exclude<Currency, 'USD'>) => string;
  /** The symbol prices use in this locale (es: US$ / $ / R$, en: $ / ARS / R$). */
  symbol: (currency: Currency) => string;
}

const rateFormats = new Map<string, Intl.NumberFormat>();

function rateFormat(tag: string, currency: Currency, digits: number): Intl.NumberFormat {
  const key = `${tag}|${currency}|${digits}`;
  let f = rateFormats.get(key);
  if (!f) {
    f = new Intl.NumberFormat(tag, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    rateFormats.set(key, f);
  }
  return f;
}

/** Same symbol rule as formatMoney (lib/pricing): BRL always reads "R$". */
function formatWithSymbol(value: number, currency: Currency, locale: Locale, digits: number): string {
  return rateFormat(localeTags[locale], currency, digits)
    .formatToParts(value)
    .map((part) => (part.type === 'currency' && currency === 'BRL' ? 'R$' : part.value))
    .join('');
}

function symbolFor(currency: Currency, locale: Locale): string {
  if (currency === 'BRL') return 'R$';
  return rateFormat(localeTags[locale], currency, 0).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStored(): Currency | null {
  try {
    const v = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isCurrency(v) ? v : null;
  } catch {
    return null;
  }
}

function writeStored(currency: Currency) {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // Storage blocked (private mode, policies): the choice lives in memory only.
  }
}

const CURRENCY_EVENT = 'eclipse:currency';

export function CurrencyProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  // SSR and the first client render use the locale default + fallback rates so
  // hydration matches; the stored choice and live rates arrive right after.
  const [currency, setCurrencyState] = useState<Currency>(() => defaultCurrencyFor(locale));
  const [rates, setRates] = useState<Rates>(fallbackRates);

  useEffect(() => {
    const stored = readStored();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from storage after hydration
    if (stored) setCurrencyState(stored);
    let alive = true;
    getRates().then((r) => {
      if (alive) setRates(r);
    });
    const onExternal = (e: Event) => {
      const next = (e as CustomEvent<Currency>).detail;
      if (isCurrency(next)) setCurrencyState(next);
    };
    window.addEventListener(CURRENCY_EVENT, onExternal);
    return () => {
      alive = false;
      window.removeEventListener(CURRENCY_EVENT, onExternal);
    };
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState((prev) => {
      if (prev !== next) track('currency_changed', { from: prev, to: next });
      return next;
    });
    writeStored(next);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      locale,
      currency,
      setCurrency,
      rates,
      format: (usd, options) => formatMoney(usd, currency, rates, locale, options),
      convert: (usd) => toCurrency(usd, currency, rates),
      formatRate: (c) => formatWithSymbol(rates[c], c, locale, rates[c] >= 100 ? 0 : 2),
      symbol: (c) => symbolFor(c, locale),
    }),
    [locale, currency, setCurrency, rates],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}
