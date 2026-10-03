'use client';

import type { CSSProperties, ReactNode } from 'react';
import { rangePercent, type SliderRange } from '@/lib/calculator';

/**
 * Native range input (keyboard, touch and screen readers for free) with a visible
 * label, the current value, min/max hints and an amber "eclipse" thumb (problem.css).
 * The visible value is aria-hidden: the input exposes it through aria-valuetext.
 */
export function CalcSlider({
  id,
  label,
  value,
  range,
  display,
  valueText,
  minLabel,
  maxLabel,
  onChange,
}: {
  id: string;
  label: ReactNode;
  value: number;
  range: SliderRange;
  display: ReactNode;
  valueText: string;
  minLabel: ReactNode;
  maxLabel: ReactNode;
  onChange: (value: number) => void;
}) {
  const fill = rangePercent(value, range);
  return (
    <div className="calc-field">
      <div className="flex items-end justify-between gap-4">
        <label htmlFor={id} className="text-[0.95rem] leading-snug text-fg">
          {label}
        </label>
        <span aria-hidden className="tabular shrink-0 whitespace-nowrap font-serif text-[1.65rem] leading-none text-corona sm:text-3xl">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="calc-range mt-1.5"
        style={{ '--fill': `${fill}%` } as CSSProperties}
      />
      <div aria-hidden className="tabular -mt-1 flex justify-between text-[0.7rem] tracking-wide text-fg-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
