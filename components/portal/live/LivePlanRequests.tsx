'use client';

import { Suspense, useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { endpoints, errorKind } from '@/lib/api';
import type { ApiPlanRequest } from '@/lib/api/types';
import { idFromSearch, livePaths } from '@/lib/portal/live';
import { LiveFrame } from './LiveFrame';
import { RequireAuth } from './RequireAuth';
import { EstimateLedger, StatusTag, useNames } from './RequestParts';
import { EmptyState, ErrorState, LoadingState, NotFoundState } from './states';
import { useLive, useResource } from './hooks';

const OPEN: ApiPlanRequest['status'][] = ['submitted', 'under_review', 'reviewed'];

/**
 * /[locale]/portal/solicitudes/ — the requests this client sent from "Armá tu plan", newest
 * first, with status, the stored estimate and the team's public response. Internal notes
 * never reach the browser (the API doesn't return them). Open requests can be cancelled
 * (the API's own action, with the request's current version).
 */
export function LivePlanRequests() {
  const { t, tp } = useLive();
  return (
    <LiveFrame crumbs={[{ label: tp('nav.site'), href: '/' }, { label: tp('nav.portal'), href: livePaths.login }, { label: t('requests.crumb') }]}>
      <RequireAuth verified={false}>{() => <ListBody />}</RequireAuth>
    </LiveFrame>
  );
}

function ListBody() {
  const { t } = useLive();
  const load = useCallback((signal: AbortSignal) => endpoints.planRequests(signal), []);
  const { state, reload, refresh } = useResource(load, true);
  return (
    <>
      <header className="pt-dash-head">
        <p className="pt-kicker label">{t('requests.label')}</p>
        <h1 className="display pt-hello">{t('requests.title')}</h1>
        <p className="pt-company">{state.status === 'ready' ? t('requests.count', { count: state.data.items.length }) : t('requests.lead')}</p>
      </header>
      {state.status === 'loading' ? <LoadingState label={t('requests.loading')} /> : null}
      {state.status === 'error' ? <ErrorState error={state.error} onRetry={reload} /> : null}
      {state.status === 'ready' ? (
        state.data.items.length === 0 ? (
          <EmptyState title={t('requests.empty.title')} body={t('requests.empty.body')} rail={false}>
            <Link href="/plan/" className="btn pt-btn-ink btn-sm">
              {t('requests.empty.cta')}
              <ArrowRight aria-hidden strokeWidth={1.6} />
            </Link>
          </EmptyState>
        ) : (
          <ul className="lv-requests">
            {state.data.items.map((request) => (
              <li key={request.id}>
                <RequestCard request={request} onChanged={refresh} />
              </li>
            ))}
          </ul>
        )
      ) : null}
    </>
  );
}

function RequestCard({ request, onChanged, detail = false }: { request: ApiPlanRequest; onChanged: () => void; detail?: boolean }) {
  const { t, locale, stamp } = useLive();
  const names = useNames();
  const sel = request.selection;
  const what = [sel.planId ? t('requests.packageHead', { plan: names.line(sel.planId, 'plan') }) : null, ...sel.items.map((id) => names.line(id, 'item'))]
    .filter(Boolean)
    .join(' · ');
  const titleId = `lv-req-${request.id}`;
  const Heading = detail ? 'h1' : 'h2';

  return (
    <article className="lv-request" aria-labelledby={titleId} data-request={request.id} data-status={request.status}>
      <div className="lv-request-top">
        <p className="pt-date">
          <time dateTime={request.createdAt}>{t('requests.sentOn', { date: stamp(request.createdAt) })}</time>
        </p>
        <StatusTag status={request.status} />
      </div>
      <Heading id={titleId} className="lv-request-title">
        {what || t('requests.noPieces')}
      </Heading>
      <p className="pt-fine">{t(`requests.statusHelp.${request.status}`)}</p>

      {request.publicResponse ? (
        <div className="lv-response">
          <p className="label">{t('requests.responseLabel')}</p>
          <p className="lv-pre">{request.publicResponse}</p>
          {request.reviewedAt ? <p className="pt-meta pt-date">{stamp(request.reviewedAt)}</p> : null}
        </div>
      ) : null}

      <dl className="pt-dl">
        <div>
          <dt>{t('requests.contact')}</dt>
          <dd>
            {request.contact.name} · <span className="pt-date">{request.contact.phone}</span>
          </dd>
        </div>
        {sel.vertical ? (
          <div>
            <dt>{t('requests.vertical')}</dt>
            <dd>{names.vertical(sel.vertical) ?? sel.vertical}</dd>
          </div>
        ) : null}
        {sel.goals.length ? (
          <div>
            <dt>{t('requests.goals')}</dt>
            <dd>{new Intl.ListFormat(locale, { type: 'conjunction' }).format(sel.goals.map((g) => goalName(g, t)))}</dd>
          </div>
        ) : null}
        {request.message ? (
          <div>
            <dt>{t('requests.note')}</dt>
            <dd className="lv-pre">{request.message}</dd>
          </div>
        ) : null}
      </dl>

      {detail ? (
        <EstimateLedger request={request} />
      ) : (
        <details className="lv-more">
          <summary>{t('requests.seeEstimate')}</summary>
          <EstimateLedger request={request} />
        </details>
      )}

      <div className="lv-request-foot">
        {detail ? null : (
          <Link href={livePaths.request(request.id)} className="btn btn-ghost btn-sm">
            {t('requests.open')}
            <span className="sr-only">: {what}</span>
            <ArrowRight aria-hidden strokeWidth={1.6} />
          </Link>
        )}
        {OPEN.includes(request.status) ? <CancelButton request={request} onChanged={onChanged} /> : null}
      </div>
    </article>
  );
}

function goalName(goal: string, t: ReturnType<typeof useLive>['t']): string {
  return t.has(`requests.goalNames.${goal}`) ? t(`requests.goalNames.${goal}`) : goal;
}

/** Two-step cancel: ask, then confirm. 409 means the team just changed the request: refresh and say so. */
function CancelButton({ request, onChanged }: { request: ApiPlanRequest; onChanged: () => void }) {
  const { t, describe } = useLive();
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'busy' | 'done' | 'conflict' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const cancel = async () => {
    setPhase('busy');
    try {
      await endpoints.cancelPlanRequest(request.id, request.version);
      setPhase('done');
      onChanged();
    } catch (error) {
      if (errorKind(error) === 'conflict') {
        setPhase('conflict');
        onChanged();
      } else {
        setMessage(describe(error).message);
        setPhase('error');
      }
    }
  };

  return (
    <div className="lv-cancel">
      {phase === 'idle' || phase === 'error' ? (
        <button type="button" className="pt-link lv-linkbtn" onClick={() => setPhase('confirm')}>
          {t('requests.cancel')}
        </button>
      ) : null}
      {phase === 'confirm' || phase === 'busy' ? (
        <div role="group" aria-label={t('requests.cancelAsk')} className="lv-confirm">
          <p className="pt-fine">{t('requests.cancelAsk')}</p>
          <button type="button" className="btn pt-btn-ink btn-sm" onClick={cancel} disabled={phase === 'busy'} aria-busy={phase === 'busy' || undefined}>
            {phase === 'busy' ? t('requests.cancelling') : t('requests.cancelYes')}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhase('idle')} disabled={phase === 'busy'}>
            {t('requests.cancelNo')}
          </button>
        </div>
      ) : null}
      <div role="status" aria-live="polite">
        {phase === 'done' ? <p className="pt-fine">{t('requests.cancelled')}</p> : null}
        {phase === 'conflict' ? <p className="pt-fine">{t('requests.cancelConflict')}</p> : null}
      </div>
      {phase === 'error' ? (
        <p className="lv-error" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** /[locale]/portal/solicitud/?id=<uuid> — one request in full. Same not-found for unknown and foreign ids. */
export function LivePlanRequest() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Detail />
    </Suspense>
  );
}

function Detail() {
  const { t, tp } = useLive();
  const search = useSearchParams();
  const id = idFromSearch(search);
  return (
    <LiveFrame
      crumbs={[
        { label: tp('nav.site'), href: '/' },
        { label: tp('nav.portal'), href: livePaths.login },
        { label: t('requests.crumb'), href: livePaths.requests },
        { label: t('requests.detailCrumb') },
      ]}
    >
      <RequireAuth verified={false}>{() => (id ? <DetailBody key={id} id={id} /> : <Missing />)}</RequireAuth>
    </LiveFrame>
  );
}

function Missing() {
  const { t } = useLive();
  return <NotFoundState title={t('requests.notFoundTitle')} body={t('requests.notFoundBody')} back={t('requests.backToList')} href={livePaths.requests} />;
}

function DetailBody({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => endpoints.planRequest(id, signal), [id]);
  const { state, reload, refresh } = useResource(load, true);
  const { t } = useLive();
  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return errorKind(state.error) === 'notFound' ? <Missing /> : <ErrorState error={state.error} onRetry={reload} />;
  return (
    <>
      <RequestCard request={state.data} onChanged={refresh} detail />
      <p>
        <Link href={livePaths.requests} className="pt-link">
          {t('requests.backToList')}
        </Link>
      </p>
    </>
  );
}
