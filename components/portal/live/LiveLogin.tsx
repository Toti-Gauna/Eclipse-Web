'use client';

import { useId, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { useSession } from '@/components/providers/SessionProvider';
import { errorKind } from '@/lib/api';
import { livePaths, looksLikeEmail, registerHref, safeNext } from '@/lib/portal/live';
import { Breadcrumbs } from '../Breadcrumbs';
import { Field, FormError } from './Field';
import { useLive } from './hooks';
import './live.css';

/**
 * /[locale]/portal/ in live mode — the real sign-in. Same layout as the demo's (headline +
 * lead on the left, the form card on the right). Wrong credentials get one generic answer
 * (the API never says whether the email exists); an unverified account can sign in and is
 * told what is missing. If there is already a session it says so instead of showing the form.
 */
export function LiveLogin() {
  const { t, tp, describe } = useLive();
  const session = useSession({ ensure: true });
  const router = useRouter();
  const search = useSearchParams();
  const id = useId();
  const next = safeNext(search.get('next'));
  const expired = search.get('expired') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ message: string; ref: string | null } | null>(null);
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setFailure(null);
    const value = email.trim();
    if (!looksLikeEmail(value)) {
      setEmailError(t('login.emailInvalid'));
      return;
    }
    setEmailError(null);
    if (!password) {
      setFailure({ message: t('login.passwordRequired'), ref: null });
      return;
    }
    setBusy(true);
    try {
      await session.login(value, password);
      setPassword('');
      router.replace(next ?? livePaths.projects);
    } catch (error) {
      setPassword('');
      const info = describe(error);
      // 401 = wrong email or password (one generic answer, by design of the API).
      setFailure({ message: errorKind(error) === 'sessionExpired' ? t('login.invalid') : info.message, ref: info.ref });
      setBusy(false);
    }
  };

  const signedIn = session.state.status === 'authenticated' ? session.state.client : null;

  return (
    <div className="container-x pt-page">
      <Breadcrumbs items={[{ label: tp('nav.site'), href: '/' }, { label: tp('nav.portal') }]} />
      <div className="pt-login-grid">
        <div>
          <p className="pt-kicker label">
            <PhaseGlyph phase={0.4} size={16} className="text-accent" />
            {t('login.label')}
          </p>
          <h1 className="display pt-login-title">{t.rich('login.title', { em })}</h1>
          <p className="pt-lead">{t('login.lead')}</p>
          <div className="pt-login-ctas">
            <Link href="/" className="pt-link">
              {tp('nav.backToSite')}
            </Link>
          </div>
        </div>

        <div>
          <div className="pt-login-card ticks">
            <div className="pt-login-card-top">
              <p className="label">{t('login.formLabel')}</p>
            </div>
            {signedIn ? (
              <div role="status">
                <h2 className="pt-login-form-title">{t('login.alreadyTitle')}</h2>
                <p className="pt-fine pt-login-hint">{t('login.alreadyBody', { email: signedIn.email })}</p>
                <div className="lv-actions">
                  <Link href={next ?? livePaths.projects} className="btn pt-btn-ink btn-sm">
                    {t('nav.projects')}
                    <ArrowRight aria-hidden strokeWidth={1.6} />
                  </Link>
                  <Link href={livePaths.requests} className="pt-link">
                    {t('nav.requests')}
                  </Link>
                  <button type="button" className="pt-link lv-linkbtn" onClick={() => void session.logout()}>
                    {t('nav.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 id={`${id}-title`} className="pt-login-form-title">
                  {t('login.formTitle')}
                </h2>
                {expired ? (
                  <p className="lv-note" role="status">
                    {t('session.expiredBody')}
                  </p>
                ) : next ? (
                  <p className="pt-fine pt-login-hint">{t('login.nextHint')}</p>
                ) : null}
                <form className="pt-form" noValidate aria-labelledby={`${id}-title`} onSubmit={onSubmit}>
                  <Field
                    id={`${id}-email`}
                    label={t('login.email')}
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={emailError}
                    required
                  />
                  <Field
                    id={`${id}-password`}
                    label={t('login.password')}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {failure ? <FormError message={failure.message} reference={failure.ref ? t('errors.ref', { id: failure.ref }) : null} /> : null}
                  <button type="submit" className="btn pt-btn-ink" disabled={busy} aria-busy={busy || undefined}>
                    {busy ? t('login.submitting') : t('login.submit')}
                  </button>
                </form>
                <div className="lv-links">
                  <Link href={livePaths.resetPassword} className="pt-link">
                    {t('login.forgot')}
                  </Link>
                  <p className="pt-fine">
                    {t('login.noAccount')}{' '}
                    <Link href={registerHref(next)} className="pt-link">
                      {t('login.createAccount')}
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="pt-help">
            <p className="pt-help-title">{t('login.helpTitle')}</p>
            <p className="pt-fine">{t('login.help')}</p>
            <WhatsAppLink message={t('login.helpMessage')} origin="portal" extra={{ from: 'login' }} className="pt-link">
              <MessageCircle aria-hidden strokeWidth={1.6} />
              {t('login.helpCta')}
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </div>
  );
}
