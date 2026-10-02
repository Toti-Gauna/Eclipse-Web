'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import type { Billing } from '@/lib/pricing';

const OPTIONS: Billing[] = ['monthly', 'annual'];

/**
 * Mensual / Anual for maintenance, as a native radio group (arrow keys work).
 * `freeMonths` (from content) shows the "2 meses gratis" badge; null hides it.
 */
export function BillingToggle({
  value,
  onChange,
  freeMonths,
  stacked = false,
  className = '',
}: {
  value: Billing;
  onChange: (billing: Billing) => void;
  freeMonths: number | null;
  /** Label above the control at every width. */
  stacked?: boolean;
  className?: string;
}) {
  const t = useTranslations('pricing.billing');
  const name = useId();
  const labelId = `${name}-label`;
  const badgeId = `${name}-badge`;

  return (
    <div className={`flex flex-col gap-2.5 ${stacked ? '' : 'sm:flex-row sm:items-center sm:gap-4'} ${className}`}>
      <span id={labelId} className="eyebrow">
        {t('label')}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap items-center gap-3">
        <div className="relative flex rounded-full border border-line-strong bg-surface p-1">
          {OPTIONS.map((option) => (
            <label
              key={option}
              className="relative grid min-h-11 min-w-[6.5rem] cursor-pointer place-items-center rounded-full px-4 text-sm font-medium text-fg-muted transition-colors duration-300 hover:text-fg has-[:checked]:bg-ink has-[:checked]:text-dawn has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus)]"
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                aria-describedby={option === 'annual' && freeMonths ? badgeId : undefined}
                className="sr-only"
              />
              {t(option)}
            </label>
          ))}
        </div>
        {freeMonths ? (
          <span id={badgeId} className="inline-flex h-7 items-center rounded-full bg-corona px-3 text-xs font-semibold text-ink">
            {t('free', { months: freeMonths })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
