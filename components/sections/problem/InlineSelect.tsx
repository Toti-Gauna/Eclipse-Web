'use client';

import './inline-select.css';
import type { ChangeEvent } from 'react';
import { ChevronDown } from 'lucide-react';

export interface InlineSelectOption<T extends string> {
  value: T;
  label: string;
}

/**
 * A native <select> that reads as part of a sentence: "Tengo [una clínica ▾]."
 * The visible text is the current option (so the pill hugs it); the real select sits
 * on top, transparent, and gives native pickers on phones, keyboard and screen
 * readers for free. Styles: inline-select.css. Also used by the plan builder.
 */
export function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
  id,
}: {
  value: T;
  options: readonly InlineSelectOption<T>[];
  onChange: (value: T) => void;
  /** Accessible name ("Tu rubro"). */
  label: string;
  className?: string;
  id?: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <span className={`isel ${className}`}>
      <span aria-hidden className="isel-text">
        {current?.label}
      </span>
      <ChevronDown aria-hidden className="isel-caret" strokeWidth={1.5} />
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.currentTarget.value as T)}
        className="isel-native"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}
