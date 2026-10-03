'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import type { Billing } from '@/lib/pricing';
import { useSound } from '@/components/sound/SoundContext';

const OPTIONS: Billing[] = ['monthly', 'annual'];

/**
 * Mensual / Anual for maintenance: the only billing switch of the page's pricing.
 * A native radio group (arrow keys work); the ink indicator slides with transform.
 * `freeMonths` (from content) labels the annual side; the caller hides the whole
 * switch when the annual offer is off.
 */
export function BillingToggle({
  value,
  onChange,
  freeMonths,
  className = '',
}: {
  value: Billing;
  onChange: (billing: Billing) => void;
  freeMonths: number;
  className?: string;
}) {
  const t = useTranslations('pricing.billing');
  const { play } = useSound();
  const name = useId();
  const labelId = `${name}-label`;
  const badgeId = `${name}-badge`;

  return (
    <div className={`pr-billing ${className}`}>
      <span id={labelId} className="pr-label">
        {t('label')}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="pr-billing-switch" data-value={value}>
        <span aria-hidden className="pr-billing-thumb" />
        {OPTIONS.map((option) => (
          <label key={option} className="pr-billing-option">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => {
                onChange(option);
                play('toggle');
              }}
              aria-describedby={option === 'annual' ? badgeId : undefined}
              className="sr-only"
            />
            <span>{t(option)}</span>
          </label>
        ))}
      </div>
      <span id={badgeId} className="pr-billing-free">
        {t('free', { months: freeMonths })}
      </span>
    </div>
  );
}
