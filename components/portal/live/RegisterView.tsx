'use client';

import { useId, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { endpoints, errorKind } from '@/lib/api';
import { PASSWORD_MAX, PASSWORD_MIN, livePaths, loginHref, looksLikeEmail, passwordProblem, safeNext } from '@/lib/portal/live';
import { Breadcrumbs } from '../Breadcrumbs';
import { Field, FormError } from './Field';
import { useLive } from './hooks';
import './live.css';

const NAME_MAX = 100;

/**
 * /[locale]/portal/registro/ — create an account. The API answers 202 for a new and for an
 * existing email (anti-enumeration) and never signs in, so the confirmation is the same
 * neutral text either way: "if the address is valid, we sent a link". The email still has to
 * be verified before projects and plan requests open up.
 */
export function RegisterView() {
  const { t, tp, describe } = useLive();
  const id = useId();
  const search = useSearchParams();
  const next = safeNext(search.get('next'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [failure, setFailure] = useState<{ message: string; ref: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setFailure(null);
    const value = email.trim();
    const problem = passwordProblem(password);
    const next_: typeof errors = {};
    if (!looksLikeEmail(value)) next_.email = t('login.emailInvalid');
    if (problem === 'short') next_.password = t('register.passwordShort', { min: PASSWORD_MIN });
    if (problem === 'long') next_.password = t('register.passwordLong', { max: PASSWORD_MAX });
    if (Array.from(name.trim()).length > NAME_MAX) next_.name = t('register.nameLong', { max: NAME_MAX });
    setErrors(next_);
    if (Object.keys(next_).length) return;
    setBusy(true);
    try {
      await endpoints.register({ email: value, password, ...(name.trim() ? { displayName: name.trim() } : {}) });
      setPassword('');
      setSentTo(value);
    } catch (error) {
      const info = describe(error);
      setFailure({ message: errorKind(error) === 'invalid' ? t('register.rejected') : info.message, ref: info.ref });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x pt-page">
      <Breadcrumbs items={[{ label: tp('nav.site'), href: '/' }, { label: tp('nav.portal'), href: livePaths.login }, { label: t('register.crumb') }]} />
      <div className="pt-login-grid">
        <div>
          <p className="pt-kicker label">
            <PhaseGlyph phase={0.2} size={16} className="text-accent" />
            {t('register.label')}
          </p>
          <h1 className="display pt-login-title">{t.rich('register.title', { em: (c) => <em>{c}</em> })}</h1>
          <p className="pt-lead">{t('register.lead')}</p>
        </div>
        <div>
          <div className="pt-login-card ticks">
            <div className="pt-login-card-top">
              <p className="label">{t('register.formLabel')}</p>
            </div>
            {sentTo ? (
              <div role="status" aria-live="polite">
                <h2 className="pt-login-form-title lv-done-title">
                  <MailCheck aria-hidden strokeWidth={1.5} className="size-6" />
                  {t('register.doneTitle')}
                </h2>
                <p className="pt-fine pt-login-hint">{t('register.doneBody', { email: sentTo })}</p>
                <p className="pt-fine">{t('register.doneNote')}</p>
                <div className="lv-actions">
                  <Link href={loginHref(next)} className="btn pt-btn-ink btn-sm">
                    {t('nav.login')}
                  </Link>
                  <Link href={livePaths.verifyEmail} className="pt-link">
                    {t('register.noMail')}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 id={`${id}-title`} className="pt-login-form-title">
                  {t('register.formTitle')}
                </h2>
                <p className="pt-fine pt-login-hint">{t('register.formHint')}</p>
                <form className="pt-form" noValidate aria-labelledby={`${id}-title`} onSubmit={onSubmit}>
                  <Field
                    id={`${id}-name`}
                    label={t('register.name')}
                    optional={t('common.optional')}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                  />
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
                    error={errors.email}
                    required
                  />
                  <Field
                    id={`${id}-password`}
                    label={t('login.password')}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    hint={t('register.passwordHint', { min: PASSWORD_MIN })}
                    error={errors.password}
                    required
                  />
                  {failure ? <FormError message={failure.message} reference={failure.ref ? t('errors.ref', { id: failure.ref }) : null} /> : null}
                  <button type="submit" className="btn pt-btn-ink" disabled={busy} aria-busy={busy || undefined}>
                    {busy ? t('register.submitting') : t('register.submit')}
                  </button>
                </form>
                <div className="lv-links">
                  <p className="pt-fine">
                    {t('register.haveAccount')}{' '}
                    <Link href={loginHref(next)} className="pt-link">
                      {t('nav.login')}
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
