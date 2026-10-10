'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, Send, TriangleAlert } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { useSound } from '@/components/sound/SoundContext';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { endpoints, errorKind, isApiError, isRetryable, newUuid, type ApiCatalog, type ApiPlanRequest } from '@/lib/api';
import { livePaths, loginHref, registerHref } from '@/lib/portal/live';
import { buildPlanRequestBody, catalogMismatches, checkContact, hasProblems, CONTACT_NAME_MAX, MESSAGE_MAX, type ContactProblem } from '@/lib/plan-request';
import { encodePlanState, type PlanState } from '@/lib/plan-url';

type Phase = 'form' | 'sending' | 'sent' | 'failed';

/**
 * "Enviar solicitud" — the server-side path of the builder's summary (live mode only; the
 * WhatsApp button in the dock stays exactly as it was).
 *
 * - anonymous: no form, a clear route to sign in / create an account. The selection travels
 *   in the plan link (`/plan/?items=…`), which the builder already knows how to read — nothing
 *   is stored.
 * - signed in, email not verified: the API would answer 403; say so and offer a new link.
 * - signed in + verified: name + phone (E.164) + optional note. The browser sends the SELECTION
 *   (never a price); the server recomputes the provisional estimate from its versioned
 *   catalog. Success is shown only after the API answers 201/200. A failed send can be
 *   retried with the SAME Idempotency-Key (so it can't create two requests); changing the
 *   content or the selection renews it.
 */
export function RequestAction({
  state,
  active,
  localTotalUsd,
  onNavigate,
  Sub = 'h3',
}: {
  Sub?: 'h3' | 'h4';
  state: PlanState;
  /** The summary step is showing: only then does the session get checked. */
  active: boolean;
  /** What the builder displays as the one-time total, to flag a difference with the saved estimate. */
  localTotalUsd: number;
  /** Called before following a link (the drawer closes). */
  onNavigate?: () => void;
}) {
  const t = useTranslations('builder.request');
  const session = useSession({ ensure: active });
  const { play } = useSound();
  const id = useId();
  const locale = useLocale();
  const { format } = useCurrency();
  // null = untouched: the field shows the profile's name until the person types.
  const [typedName, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [problems, setProblems] = useState<ContactProblem>({});
  const [phase, setPhase] = useState<Phase>('form');
  const [failure, setFailure] = useState<{ kind: ReturnType<typeof errorKind>; retryable: boolean; ref: string | null; seconds: number | null } | null>(null);
  const [saved, setSaved] = useState<{ request: ApiPlanRequest; replay: boolean } | null>(null);
  const [catalog, setCatalog] = useState<ApiCatalog | null>(null);
  const [catalogChanged, setCatalogChanged] = useState(false);
  const attempt = useRef<{ key: string; fingerprint: string } | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const verified = session.state.status === 'authenticated' && session.state.client.emailVerified;
  const displayName = session.state.status === 'authenticated' ? session.state.client.displayName : null;
  const name = typedName ?? displayName?.slice(0, CONTACT_NAME_MAX) ?? '';

  // Fetch the team's catalog when the form is on screen: needed for the version, and to warn about drift.
  useEffect(() => {
    if (!active || !verified || catalog) return;
    const controller = new AbortController();
    endpoints.catalog(controller.signal).then(
      (c) => {
        if (!controller.signal.aborted) setCatalog(c);
      },
      () => undefined, // retried at submit time
    );
    return () => controller.abort();
  }, [active, verified, catalog]);

  const drift = catalog ? catalogMismatches(catalog).length > 0 : false;
  const planHref = `/plan/?${encodePlanState(state)}`;

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (phase === 'sending') return;
    const found = checkContact({ name, phone, message: note });
    setProblems(found);
    if (hasProblems(found)) return;
    setPhase('sending');
    setFailure(null);
    try {
      const latest = catalog ?? (await endpoints.catalog());
      if (!catalog) setCatalog(latest);
      const body = buildPlanRequestBody(state, { name, phone, message: note }, latest.version);
      // Same content = same submission = same key (safe retry). Different content = new key.
      const fingerprint = JSON.stringify(body);
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) attempt.current = { key: newUuid(), fingerprint };
      const result = await endpoints.createPlanRequest(body, attempt.current.key);
      attempt.current = null;
      setSaved(result);
      setPhase('sent');
      play('success');
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (error) {
      const kind = errorKind(error);
      const retryAfter = isApiError(error) ? error.retryAfter : null;
      const ref = isApiError(error) ? error.requestId : null;
      if (kind === 'conflict') {
        // Stale catalog (prices changed while the plan was being built) or a changed request: re-read and ask to review.
        attempt.current = null;
        try {
          const fresh = await endpoints.catalog();
          setCatalogChanged(!catalog || fresh.version !== catalog.version);
          setCatalog(fresh);
        } catch {
          /* the message below still applies */
        }
      }
      if (kind === 'forbidden') void session.reload(); // most likely an unverified email: refresh the profile
      setFailure({ kind, retryable: isRetryable(error), ref, seconds: retryAfter });
      setPhase('failed');
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  };

  const startAnother = () => {
    setSaved(null);
    setPhase('form');
    setNote('');
  };

  if (!active) return null;

  const heading = (
    <>
      <p className="label pb-request-label">
        <PhaseGlyph phase={0.75} size={14} className="pb-proposal-glyph" />
        {t('label')}
      </p>
      <Sub id={`${id}-t`} className="pb-request-title">
        {t('title')}
      </Sub>
    </>
  );

  // ---- states --------------------------------------------------------------------
  if (session.state.status === 'unknown' || session.state.status === 'loading') {
    return (
      <section className="pb-request ticks" aria-labelledby={`${id}-t`} aria-busy="true">
        {heading}
        <p className="pb-request-text" role="status">
          {t('checking')}
        </p>
      </section>
    );
  }
  if (session.state.status === 'error') {
    return (
      <section className="pb-request ticks" aria-labelledby={`${id}-t`}>
        {heading}
        <p className="pb-request-text" role="alert">
          {t('sessionError')}
        </p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void session.reload()}>
          {t('retry')}
        </button>
      </section>
    );
  }
  if (session.state.status !== 'authenticated') {
    return (
      <section className="pb-request ticks" aria-labelledby={`${id}-t`}>
        {heading}
        <p className="pb-request-text">{t('anonymous')}</p>
        <p className="pb-request-fine">{t('keepsPlan')}</p>
        <div className="pb-request-actions">
          <Link href={loginHref(planHref)} className="btn btn-ghost btn-sm" onClick={onNavigate}>
            {t('login')}
          </Link>
          <Link href={registerHref(planHref)} className="btn btn-ghost btn-sm" onClick={onNavigate}>
            {t('register')}
          </Link>
        </div>
      </section>
    );
  }
  if (!verified) {
    return <UnverifiedBlock heading={heading} email={session.state.client.email} onRecheck={() => void session.reload()} labelId={`${id}-t`} />;
  }

  if (phase === 'sent' && saved) {
    const request = saved.request;
    const serverUsd = request.estimate.totalCents / 100;
    const differs = Math.round(localTotalUsd * 100) !== request.estimate.totalCents;
    return (
      <section className="pb-request pb-request--done ticks" aria-labelledby={`${id}-t`}>
        {heading}
        <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="pb-request-done">
          <p className="pb-request-ok">
            <CheckCircle2 aria-hidden strokeWidth={1.6} className="size-5" />
            {saved.replay ? t('sentAgain') : t('sent')}
          </p>
          <p className="pb-request-text">{t('sentBody', { name: request.contact.name })}</p>
          <p className="pb-request-fine">
            {t('sentEstimate', { amount: format(serverUsd) })}
          </p>
          {differs ? <p className="pb-request-fine">{t('sentDiffers')}</p> : null}
        </div>
        <div className="pb-request-actions">
          <Link href={livePaths.request(request.id)} className="btn btn-ghost btn-sm" onClick={onNavigate}>
            {t('viewRequest')}
          </Link>
          <button type="button" className="pb-link" onClick={startAnother}>
            {t('another')}
          </button>
        </div>
      </section>
    );
  }

  const sending = phase === 'sending';
  return (
    <section className="pb-request ticks" aria-labelledby={`${id}-t`}>
      {heading}
      <p className="pb-request-text">{t('intro')}</p>
      {drift ? (
        <p className="pb-request-warn" role="note">
          <TriangleAlert aria-hidden strokeWidth={1.6} className="size-4" />
          {t('drift')}
        </p>
      ) : null}
      <form className="pb-request-form" noValidate onSubmit={submit} aria-labelledby={`${id}-t`}>
        <div className="pb-request-field">
          <label htmlFor={`${id}-name`}>{t('name')}</label>
          <input
            id={`${id}-name`}
            className="pb-request-input"
            autoComplete="name"
            maxLength={CONTACT_NAME_MAX + 20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={problems.name ? true : undefined}
            aria-describedby={problems.name ? `${id}-name-e` : undefined}
            required
          />
          <p id={`${id}-name-e`} className="pb-request-error" role={problems.name ? 'alert' : undefined}>
            {problems.name ? t(`errors.name.${problems.name}`, { max: CONTACT_NAME_MAX }) : null}
          </p>
        </div>
        <div className="pb-request-field">
          <label htmlFor={`${id}-phone`}>{t('phone')}</label>
          <input
            id={`${id}-phone`}
            className="pb-request-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+54 9 223 555 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={problems.phone ? true : undefined}
            aria-describedby={`${id}-phone-h ${id}-phone-e`}
            required
          />
          <p id={`${id}-phone-h`} className="pb-request-fine">
            {t('phoneHint')}
          </p>
          <p id={`${id}-phone-e`} className="pb-request-error" role={problems.phone ? 'alert' : undefined}>
            {problems.phone ? t(`errors.phone.${problems.phone}`) : null}
          </p>
        </div>
        <div className="pb-request-field">
          <label htmlFor={`${id}-note`}>
            {t('note')} <span className="pb-request-opt">· {t('optional')}</span>
          </label>
          <textarea
            id={`${id}-note`}
            className="pb-request-input pb-request-textarea"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={problems.message ? true : undefined}
            aria-describedby={problems.message ? `${id}-note-e` : undefined}
          />
          <p id={`${id}-note-e`} className="pb-request-error" role={problems.message ? 'alert' : undefined}>
            {problems.message ? t('errors.message.long', { max: MESSAGE_MAX }) : null}
          </p>
        </div>

        <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="pb-request-status">
          {sending ? <p className="pb-request-fine">{t('sending')}</p> : null}
          {phase === 'failed' && failure ? (
            <div className="pb-request-fail" role="alert">
              <p>{failure.kind === 'rateLimited' && failure.seconds ? t('errors.rateLimitedFor', { seconds: failure.seconds }) : t(`errors.${failure.kind}`)}</p>
              {catalogChanged && failure.kind === 'conflict' ? <p>{t('errors.catalogChanged')}</p> : null}
              {failure.retryable ? <p className="pb-request-fine">{t('retryHint')}</p> : null}
              {failure.ref ? <p className="pb-request-ref">{t('reference', { id: failure.ref })}</p> : null}
              {failure.kind === 'sessionExpired' ? (
                <Link href={loginHref(planHref)} className="pb-link" onClick={onNavigate}>
                  {t('login')}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <button type="submit" className="btn btn-ghost pb-request-submit" disabled={sending} aria-busy={sending || undefined}>
          <Send aria-hidden className="size-4 shrink-0" strokeWidth={1.7} />
          {sending ? t('sending') : phase === 'failed' && failure?.retryable ? t('retry') : t('submit')}
        </button>
      </form>
      <p className="pb-request-fine" lang={locale}>
        {t('notBinding')}
      </p>
    </section>
  );
}

function UnverifiedBlock({ heading, email, onRecheck, labelId }: { heading: React.ReactNode; email: string; onRecheck: () => void; labelId: string }) {
  const t = useTranslations('builder.request');
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const resend = async () => {
    setPhase('sending');
    try {
      await endpoints.requestEmailVerification(email);
      setPhase('sent');
    } catch {
      setPhase('failed');
    }
  };
  return (
    <section className="pb-request ticks" aria-labelledby={labelId}>
      {heading}
      <p className="pb-request-text">{t('unverified', { email })}</p>
      <div className="pb-request-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={resend} disabled={phase === 'sending' || phase === 'sent'}>
          {phase === 'sending' ? t('sendingLink') : t('resend')}
        </button>
        <button type="button" className="pb-link" onClick={onRecheck}>
          {t('recheck')}
        </button>
      </div>
      <div role="status" aria-live="polite">
        {phase === 'sent' ? <p className="pb-request-fine">{t('linkSent')}</p> : null}
        {phase === 'failed' ? (
          <p className="pb-request-error" role="alert">
            {t('errors.unavailable')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
