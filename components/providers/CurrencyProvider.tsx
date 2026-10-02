'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
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
