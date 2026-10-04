'use client';

import { useId, useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { portalPaths } from '@/lib/portal/routes';

export interface LoginFormCopy {
  badge: string;
  formLabel: string;
  formTitle: string;
  formHint: string;
  email: string;
  password: string;
  submit: string;
  doneTitle: string;
  doneEmpty: string;
  doneFilled: string;
  doneCta: string;
}

/**
 * The demo sign-in form. It only shows the layout: it never submits anywhere, checks
 * nothing and stores nothing. On submit it clears the fields and explains, in place,
 * that this is a demo with a way into the example portal — never a "wrong password".
 */
export function LoginForm({ copy }: { copy: LoginFormCopy }) {
  const id = useId();
  const [result, setResult] = useState<'empty' | 'filled' | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const typed = Array.from(form.querySelectorAll('input')).some((input) => input.value.trim() !== '');
    form.reset(); // nothing typed stays on screen
    setResult(typed ? 'filled' : 'empty');
  };

  return (
    <div className="pt-login-card ticks">
      <div className="pt-login-card-top">
        <p className="label">{copy.formLabel}</p>
        <span className="badge-demo">{copy.badge}</span>
      </div>
      <h2 id={`${id}-title`} className="pt-login-form-title">
        {copy.formTitle}
      </h2>
      <p id={`${id}-hint`} className="pt-fine pt-login-hint">
        {copy.formHint}
      </p>
      <form
        className="pt-form"
        noValidate
        autoComplete="off"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-hint`}
        onSubmit={onSubmit}
      >
        <div className="pt-field">
          <label htmlFor={`${id}-email`}>{copy.email}</label>
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="pt-input"
          />
        </div>
        <div className="pt-field">
          <label htmlFor={`${id}-password`}>{copy.password}</label>
          <input id={`${id}-password`} type="password" autoComplete="off" className="pt-input" />
        </div>
        <button type="submit" className="btn pt-btn-ink">
          {copy.submit}
        </button>
      </form>
      <div role="status" className="pt-login-status">
        {result ? (
          <>
            <p className="pt-login-status-title">
              <PhaseGlyph phase={1} size={18} />
              {copy.doneTitle}
            </p>
            <p className="pt-fine">{result === 'filled' ? copy.doneFilled : copy.doneEmpty}</p>
            <Link href={portalPaths.projects} className="pt-link">
              {copy.doneCta}
              <ArrowRight aria-hidden strokeWidth={1.5} />
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
