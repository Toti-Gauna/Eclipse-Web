'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { CheckCircle2, MailCheck, TriangleAlert } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { endpoints, errorKind } from '@/lib/api';
import { PASSWORD_MAX, PASSWORD_MIN, livePaths, looksLikeEmail, passwordProblem, tokenFromHash } from '@/lib/portal/live';
import { Breadcrumbs } from '../Breadcrumbs';
import { Field, FormError } from './Field';
import { useLive } from './hooks';
import './live.css';

type Phase = 'ready' | 'sending' | 'done' | 'invalid' | 'failed';

/**
 * /[locale]/portal/recuperar-contrasena/ — two screens in one route.
 * Without a token: ask for a reset email (the API answers the same whether or not the
 * address has an account). With `#token=…` (from the email): the fragment is read, removed
 * from the address bar at once, kept in memory, and the new-password form posts it in the
 * JSON body. A successful reset revokes every session of the account: sign in again.
 */
export function ResetPasswordView() {
  const { t, tp } = useLive();
  const [token, setToken] = useState<string | null>(null);
  const [hadFragment, setHadFragment] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const take = () => {
      if (!window.location.hash) return;
      const found = tokenFromHash(window.location.hash);
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      setHadFragment(true);
      setToken(found);
    };
    take();
    window.addEventListener('hashchange', take);
    return () => window.removeEventListener('hashchange', take);
  }, []);

  return (
    <div className="container-x pt-page">
      <Breadcrumbs items={[{ label: tp('nav.site'), href: '/' }, { label: tp('nav.portal'), href: livePaths.login }, { label: t('reset.crumb') }]} />
      <div className="pt-login-grid">
        <div>
          <p className="pt-kicker label">
            <PhaseGlyph phase={0.8} size={16} className="text-accent" />
            {t('reset.label')}
          </p>
          <h1 className="display pt-login-title">{t.rich('reset.title', { em: (c) => <em>{c}</em> })}</h1>
          <p className="pt-lead">{t('reset.lead')}</p>
        </div>
        <div>
          <div className="pt-login-card ticks">
            <div className="pt-login-card-top">
              <p className="label">{t('reset.formLabel')}</p>
            </div>
            {done ? (
              <div role="status" aria-live="polite">
                <h2 className="pt-login-form-title lv-done-title">
                  <CheckCircle2 aria-hidden strokeWidth={1.5} className="size-6" />
                  {t('reset.doneTitle')}
                </h2>
                <p className="pt-fine pt-login-hint">{t('reset.doneBody')}</p>
                <div className="lv-actions">
                  <Link href={livePaths.login} className="btn pt-btn-ink btn-sm">
                    {t('nav.login')}
                  </Link>
                </div>
              </div>
            ) : token ? (
              <NewPasswordForm token={token} onDone={() => setDone(true)} onInvalid={() => setToken(null)} />
            ) : (
              <RequestForm tokenProblem={hadFragment} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestForm({ tokenProblem }: { tokenProblem: boolean }) {
  const { t, describe } = useLive();
  const id = useId();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [failure, setFailure] = useState<{ message: string; ref: string | null } | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === 'sending') return;
    const value = email.trim();
    if (!looksLikeEmail(value)) {
      setError(t('login.emailInvalid'));
      return;
    }
    setError(null);
    setFailure(null);
    setPhase('sending');
    try {
      await endpoints.requestPasswordReset(value);
      setPhase('done');
    } catch (e) {
      const info = describe(e);
      setFailure({ message: info.message, ref: info.ref });
      setPhase('failed');
    }
  };

  if (phase === 'done') {
    return (
      <div role="status" aria-live="polite">
        <h2 className="pt-login-form-title lv-done-title">
          <MailCheck aria-hidden strokeWidth={1.5} className="size-6" />
          {t('reset.requestedTitle')}
        </h2>
        <p className="pt-fine pt-login-hint">{t('reset.requestedBody')}</p>
        <p className="pt-fine">{t('reset.requestedNote')}</p>
      </div>
    );
  }
  return (
    <div>
      {tokenProblem ? (
        <div className="lv-warn" role="alert">
          <TriangleAlert aria-hidden strokeWidth={1.5} className="size-5" />
          <div>
            <p className="lv-warn-title">{t('reset.invalidTitle')}</p>
            <p className="pt-fine">{t('reset.invalidBody')}</p>
          </div>
        </div>
      ) : null}
      <h2 id={`${id}-title`} className="pt-login-form-title">
        {t('reset.requestTitle')}
      </h2>
      <p className="pt-fine pt-login-hint">{t('reset.requestBody')}</p>
      <form className="pt-form" noValidate aria-labelledby={`${id}-title`} onSubmit={onSubmit}>
        <Field
          id={`${id}-email`}
          label={t('login.email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />
        {failure ? <FormError message={failure.message} reference={failure.ref ? t('errors.ref', { id: failure.ref }) : null} /> : null}
        <button type="submit" className="btn pt-btn-ink" disabled={phase === 'sending'} aria-busy={phase === 'sending' || undefined}>
          {phase === 'sending' ? t('reset.sending') : t('reset.send')}
        </button>
      </form>
      <div className="lv-links">
        <Link href={livePaths.login} className="pt-link">
          {t('reset.backToLogin')}
        </Link>
      </div>
    </div>
  );
}

function NewPasswordForm({ token, onDone, onInvalid }: { token: string; onDone: () => void; onInvalid: () => void }) {
  const { t, describe } = useLive();
  const id = useId();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<{ password?: string; again?: string }>({});
  const [phase, setPhase] = useState<Phase>('ready');
  const [failure, setFailure] = useState<{ message: string; ref: string | null } | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === 'sending') return;
    const problem = passwordProblem(password);
    const next: typeof errors = {};
    if (problem === 'short') next.password = t('register.passwordShort', { min: PASSWORD_MIN });
    if (problem === 'long') next.password = t('register.passwordLong', { max: PASSWORD_MAX });
    if (!next.password && again !== password) next.again = t('reset.mismatch');
    setErrors(next);
    if (Object.keys(next).length) return;
    setPhase('sending');
    setFailure(null);
    try {
      await endpoints.confirmPasswordReset(token, password);
      setPassword('');
      setAgain('');
      onDone();
    } catch (e) {
      const info = describe(e);
      if (errorKind(e) === 'invalid') {
        // 400: used, expired or replaced by a newer link. Back to asking for one.
        onInvalid();
        return;
      }
      setFailure({ message: info.message, ref: info.ref });
      setPhase('failed');
    }
  };

  return (
    <div>
      <h2 id={`${id}-title`} className="pt-login-form-title">
        {t('reset.newTitle')}
      </h2>
      <p className="pt-fine pt-login-hint">{t('reset.newBody')}</p>
      <form className="pt-form" noValidate aria-labelledby={`${id}-title`} onSubmit={onSubmit}>
        <Field
          id={`${id}-password`}
          label={t('reset.newPassword')}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={t('register.passwordHint', { min: PASSWORD_MIN })}
          error={errors.password}
          required
        />
        <Field
          id={`${id}-again`}
          label={t('reset.repeatPassword')}
          type="password"
          autoComplete="new-password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          error={errors.again}
          required
        />
        {failure ? <FormError message={failure.message} reference={failure.ref ? t('errors.ref', { id: failure.ref }) : null} /> : null}
        <button type="submit" className="btn pt-btn-ink" disabled={phase === 'sending'} aria-busy={phase === 'sending' || undefined}>
          {phase === 'sending' ? t('reset.saving') : t('reset.save')}
        </button>
      </form>
    </div>
  );
}
