'use client';

import './inline-select.css';
import type { ChangeEvent } from 'react';
import { ChevronDown, PencilLine } from 'lucide-react';

export interface InlineSelectOption<T extends string> {
  value: T;
  label: string;
}

/**
 * A native <select> that reads as part of a sentence: "Tengo [✎ una clínica ⌄]."
 * The visible text is the current option (so the field hugs it); the real select sits
 * on top, transparent, and gives native pickers on phones, keyboard (arrows, type-ahead)
 * and screen readers for free.
 * - variant "field" (default): a bordered field token with an edit pencil and a chevron
 *   cap, like the number fields around it — it has to look editable at a glance.
 * - variant "inline": the v2 dashed-underline word (kept for denser contexts).
 * Styles: inline-select.css. Also used by the plan builder.
 */
export function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
  id,
  describedBy,
  variant = 'field',
}: {
  value: T;
  options: readonly InlineSelectOption<T>[];
  onChange: (value: T) => void;
  /** Accessible name ("Tu rubro"). */
  label: string;
  className?: string;
  id?: string;
  /** Id of a hint read after the name (e.g. what changing it does). */
  describedBy?: string;
  variant?: 'field' | 'inline';
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <span className={`isel isel--${variant} ${className}`} data-isel>
      {variant === 'field' ? <PencilLine aria-hidden className="isel-edit" strokeWidth={1.5} /> : null}
      <span aria-hidden className="isel-text">
        {current?.label}
      </span>
      <span aria-hidden className="isel-cap">
        <ChevronDown className="isel-caret" strokeWidth={1.5} />
      </span>
      <select
        id={id}
        aria-label={label}
        aria-describedby={describedBy}
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
