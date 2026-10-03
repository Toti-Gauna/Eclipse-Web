'use client';

import { useTranslations } from 'next-intl';
import { isApproximate } from '@/lib/currency';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { AnimatedMoney } from '@/components/ui/Money';
import './price-readout.css';

/**
 * A price as an instrument reading: the amount in the active currency in mono, with
 * the "≈" of converted currencies drawn small and spoken as a word ("aproximadamente").
 * The period ("pago único", "por mes") is always written by the caller next to it.
 * `animated` rolls the digits when the amount changes (pair it with an aria-live region).
 */
export function PriceReadout({ usd, animated = false, className = '' }: { usd: number; animated?: boolean; className?: string }) {
  const t = useTranslations('pricing');
  const { currency, format } = useCurrency();
  const approx = isApproximate(currency);
  return (
    <span className={`pr-readout ${className}`}>
      {approx ? (
        <>
          <span aria-hidden className="pr-approx">
            ≈
          </span>
          <span className="sr-only">{t('approx')} </span>
        </>
      ) : null}
      {animated ? (
        <AnimatedMoney usd={usd} approx={false} className="readout" />
      ) : (
        <span className="readout">{format(usd, { approx: false })}</span>
      )}
    </span>
  );
}
