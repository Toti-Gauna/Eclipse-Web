'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { CheckCircle2, MailCheck, TriangleAlert } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { useSession } from '@/components/providers/SessionProvider';
import { endpoints, errorKind } from '@/lib/api';
import { livePaths, looksLikeEmail, tokenFromHash } from '@/lib/portal/live';
import { Breadcrumbs } from '../Breadcrumbs';
import { Field, FormError } from './Field';
import { useLive } from './hooks';
import './live.css';

type Phase = 'ready' | 'confirming' | 'done' | 'invalid' | 'failed';

/**
 * /[locale]/portal/verificar-email/ — where the email's link lands.
 *
 * The link carries a one-use token in the URL FRAGMENT (`#token=…`). It is read here, removed
 * from the address bar immediately (history.replaceState) and kept only in memory. Nothing
 * happens on load: the person confirms with a button, so link scanners never consume it. The
 * token travels in the JSON body of a POST, never in a URL. Without a token the page offers a
 * new link (for a signed-in unverified account, to its own address).
 */
export function VerifyEmailView() {
  const { t, tp, describe } = useLive();
  const id = useId();
  const session = useSession({ ensure: true });
  const [token, setToken] = useState<string | null>(null);
  const [hadFragment, setHadFragment] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [failure, setFailure] = useState<{ message: string; ref: string | null } | null>(null);

  // The fragment is only readable in the browser, after hydration.
  useEffect(() => {
    const take = () => {
      if (!window.location.hash) return;
      const found = tokenFromHash(window.location.hash);
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      setHadFragment(true);
      setToken(found);
      setPhase('ready');
    };
    take();
    window.addEventListener('hashchange', take);
    return () => window.removeEventListener('hashchange', take);
  }, []);

  const confirm = async () => {
    if (!token || phase === 'confirming') return;
    setPhase('confirming');
    setFailure(null);
    try {
      await endpoints.confirmEmailVerification(token);
      setToken(null);
      setPhase('done');
      void session.reload(); // the profile now says emailVerified
    } catch (error) {
      const info = describe(error);
      setFailure({ message: info.message, ref: info.ref });
      setPhase(errorKind(error) === 'invalid' ? 'invalid' : 'failed');
    }
  };

  const crumbs = [{ label: tp('nav.site'), href: '/' }, { label: tp('nav.portal'), href: livePaths.login }, { label: t('verify.crumb') }];
  const signedIn = session.state.status === 'authenticated' ? session.state.client : null;

  let body;
  if (phase === 'done') {
    body = (
      <div role="status" aria-live="polite">
        <h2 className="pt-login-form-title lv-done-title">
          <CheckCircle2 aria-hidden strokeWidth={1.5} className="size-6" />
          {t('verify.doneTitle')}
        </h2>
        <p className="pt-fine pt-login-hint">{t('verify.doneBody')}</p>
        <div className="lv-actions">
          <Link href={signedIn ? livePaths.projects : livePaths.login} className="btn pt-btn-ink btn-sm">
            {signedIn ? t('nav.projects') : t('nav.login')}
          </Link>
        </div>
      </div>
    );
  } else if (token && phase !== 'invalid') {
    body = (
      <div>
        <h2 id={`${id}-title`} className="pt-login-form-title">
          {t('verify.confirmTitle')}
        </h2>
        <p className="pt-fine pt-login-hint">{t('verify.confirmBody')}</p>
        <div className="lv-actions">
          <button type="button" className="btn pt-btn-ink" onClick={confirm} disabled={phase === 'confirming'} aria-busy={phase === 'confirming' || undefined}>
            {phase === 'confirming' ? t('verify.confirming') : t('verify.confirm')}
          </button>
        </div>
        <div aria-live="polite" className="lv-live">
          {failure ? <FormError message={failure.message} reference={failure.ref ? t('errors.ref', { id: failure.ref }) : null} /> : null}
        </div>
      </div>
    );
  } else {
    body = (
      <div>
        {hadFragment || phase === 'invalid' ? (
          <div className="lv-warn" role="alert">
            <TriangleAlert aria-hidden strokeWidth={1.5} className="size-5" />
            <div>
              <p className="lv-warn-title">{phase === 'invalid' ? t('verify.invalidTitle') : t('verify.noTokenTitle')}</p>
              <p className="pt-fine">{phase === 'invalid' ? t('verify.invalidBody') : t('verify.noTokenBody')}</p>
            </div>
          </div>
        ) : null}
        <ResendBlock signedEmail={signedIn ? signedIn.email : null} verified={!!signedIn?.emailVerified} loading={session.state.status === 'loading' || session.state.status === 'unknown'} />
      </div>
    );
  }

  return (
    <div className="container-x pt-page">
      <Breadcrumbs items={crumbs} />
      <div className="pt-login-grid">
        <div>
          <p className="pt-kicker label">
            <PhaseGlyph phase={0.6} size={16} className="text-accent" />
            {t('verify.label')}
          </p>
          <h1 className="display pt-login-title">{t.rich('verify.title', { em: (c) => <em>{c}</em> })}</h1>
          <p className="pt-lead">{t('verify.lead')}</p>
        </div>
        <div>
          <div className="pt-login-card ticks">
            <div className="pt-login-card-top">
              <p className="label">{t('verify.formLabel')}</p>
            </div>
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Send me a new link": to the signed-in account's own address, or to the one typed (neutral answer). */
function ResendBlock({ signedEmail, verified, loading }: { signedEmail: string | null; verified: boolean; loading: boolean }) {
  const { t, describe } = useLive();
  const id = useId();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [failure, setFailure] = useState<{ message: string; ref: string | null } | null>(null);

  const send = async (address: string) => {
    setPhase('sending');
    setFailure(null);
    try {
      await endpoints.requestEmailVerification(address);
      setPhase('sent');
    } catch (e) {
      const info = describe(e);
      setFailure({ message: info.message, ref: info.ref });
      setPhase('failed');
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = (signedEmail ?? email).trim();
    if (!looksLikeEmail(value)) {
      setError(t('login.emailInvalid'));
      return;
    }
    setError(null);
    void send(value);
  };

  if (loading) {
    return (
      <p className="pt-fine lv-checking" role="status">
        <PhaseGlyph phase={0.5} size={16} />
        {t('session.checking')}
      </p>
    );
  }
  if (verified) {
    return (
      <div role="status">
        <h2 className="pt-login-form-title lv-done-title">
          <MailCheck aria-hidden strokeWidth={1.5} className="size-6" />
          {t('verify.alreadyTitle')}
        </h2>
        <p className="pt-fine pt-login-hint">{t('verify.alreadyBody')}</p>
        <div className="lv-actions">
          <Link href={livePaths.projects} className="btn pt-btn-ink btn-sm">
            {t('nav.projects')}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h2 id={`${id}-title`} className="pt-login-form-title">
        {t('verify.requestTitle')}
      </h2>
      <p className="pt-fine pt-login-hint">{signedEmail ? t('verify.requestSigned', { email: signedEmail }) : t('verify.requestBody')}</p>
      <form className="pt-form" noValidate aria-labelledby={`${id}-title`} onSubmit={onSubmit}>
        {signedEmail ? null : (
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
        )}
        <button type="submit" className="btn pt-btn-ink" disabled={phase === 'sending' || phase === 'sent'} aria-busy={phase === 'sending' || undefined}>
          {phase === 'sending' ? t('verify.sending') : t('verify.send')}
        </button>
      </form>
      <div aria-live="polite" className="lv-live">
        {phase === 'sent' ? <p className="pt-fine">{t('verify.requested')}</p> : null}
        {failure ? <FormError message={failure.message} reference={failure.ref ? t('errors.ref', { id: failure.ref }) : null} /> : null}
      </div>
    </div>
  );
}
