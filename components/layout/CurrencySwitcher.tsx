'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { CURRENCIES } from '@/lib/currency';

/** ARS / BRL / USD as a radio group (arrow keys move between options). */
export function CurrencySwitcher({ className = '' }: { className?: string }) {
  const t = useTranslations();
  const { currency, setCurrency } = useCurrency();
  const name = useId();
  return (
    <fieldset className={`currency-switch flex items-center rounded-full border border-line p-0.5 ${className}`}>
      <legend className="sr-only">{t('header.currency')}</legend>
      {CURRENCIES.map((c) => (
        <label
          key={c}
          title={t(`currency.${c}`)}
          className="relative grid h-9 min-w-11 cursor-pointer place-items-center rounded-full px-2 text-xs font-medium tracking-wider text-fg-muted transition-colors hover:text-fg has-[:checked]:bg-corona has-[:checked]:text-void has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus)]"
        >
          <input
            type="radio"
            name={name}
            value={c}
            checked={currency === c}
            onChange={() => setCurrency(c)}
            className="sr-only"
            aria-label={`${c} — ${t(`currency.${c}`)}`}
          />
          <span aria-hidden>{c}</span>
        </label>
      ))}
    </fieldset>
  );
}
