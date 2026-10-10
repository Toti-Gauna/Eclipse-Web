'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

/**
 * A labelled input in the portal's form language (`.pt-field` / `.pt-input`). The label is
 * always visible; the hint and the error are tied to the input with aria-describedby, the
 * error is announced when it appears and the input is marked invalid.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  ...input
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  optional?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>): ReactNode {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="pt-field">
      <label htmlFor={id}>
        {label}
        {optional ? <span className="lv-optional"> · {optional}</span> : null}
      </label>
      <input
        id={id}
        className="pt-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...input}
      />
      {hint ? (
        <p id={hintId} className="pt-fine">
          {hint}
        </p>
      ) : null}
      <p id={errorId} className="lv-field-error" role={error ? 'alert' : undefined}>
        {error ?? null}
      </p>
    </div>
  );
}

/** Failure line under a form: what happened in words, plus the reference for support. */
export function FormError({ message, reference }: { message: string; reference?: string | null }) {
  return (
    <p className="lv-error" role="alert">
      {message}
      {reference ? <span className="lv-ref"> {reference}</span> : null}
    </p>
  );
}
