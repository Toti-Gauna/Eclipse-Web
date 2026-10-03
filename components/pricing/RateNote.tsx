'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatRate } from '@/lib/pricing';
import { localeTags, type Locale } from '@/i18n/routing';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { CurrencySwitcher } from '@/components/layout/CurrencySwitcher';

/**
 * The calibration of every price in the section: which currency, the rate of the
 * day ("1 USD ≈ $ 1.450") and what "≈" means. The currency can be switched here.
 */
export function RateNote({ className = '' }: { className?: string }) {
  const t = useTranslations('pricing.rate');
  const tc = useTranslations('currency');
  const locale = useLocale() as Locale;
  const { currency, rates } = useCurrency();
  const date = new Intl.DateTimeFormat(localeTags[locale], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${rates.updatedAt}T12:00:00Z`),
  );

  return (
    <div className={`pr-rate ticks ${className}`}>
      <div className="pr-rate-top">
        <p className="pr-label">{t('label')}</p>
        <CurrencySwitcher className="pr-rate-switch" />
      </div>
      {currency !== 'USD' ? (
        <>
          <p className="pr-rate-value readout">{t('value', { rate: formatRate(currency, rates, locale) })}</p>
          <p className="pr-rate-source">{tc(rates.source === 'live' ? 'source' : 'sourceFallback', { date })}</p>
          <p className="pr-rate-note">{t('note')}</p>
        </>
      ) : (
        <p className="pr-rate-note">{t('usd')}</p>
      )}
    </div>
  );
}
