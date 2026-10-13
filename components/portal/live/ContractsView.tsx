'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { endpoints, newUuid } from '@/lib/api';
import type { ContractIssue, Engagement } from '@/lib/api/contracts';
import { useSession } from '@/components/providers/SessionProvider';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { IS_LIVE } from '@/lib/env';
import { RequireAuth } from './RequireAuth';
import { LiveFrame } from './LiveFrame';
import { useResource, useLive } from './hooks';
import './contracts.css';

const DEMO: Engagement = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Comercio ficticio · Volta',
  status: 'published',
  sandbox: true,
  projectId: null,
  snapshot: {
    catalogVersion: 'eclipse-reto-2026-10-13-v2',
    currency: 'USD',
    totalCents: 65000,
    depositCents: 32500,
    balanceCents: 32500,
    monthlyCents: 2000,
    bonusMonths: 3,
    scope: [
      'Una marca ficticia; hasta 25 productos aportados',
      'Consulta/pedido manual WhatsApp; publicación, móvil y una revisión',
      'Landing compartida + disparador y notificación compatibles, sujetos a validación',
    ],
    externals: 'Dominio, APIs, mensajes y demás consumos a validar por separado.',
  },
  deposit: { state: 'pending', amountCents: null, verifiedAt: null },
  monthly: { publishedOn: null, activatedOn: null, firstChargeOn: null, calendarRule: 'pending', approved: false },
  issues: [
    {
      id: '00000000-0000-4000-8000-000000000002',
      kind: 'start',
      number: 1,
      status: 'published',
      documentHash: 'demo-only',
      templateVersion: 'internal-outline-2026-10-13-v2',
      templateApproved: false,
      method: 'sandbox_test',
      publishedAt: null,
      expiresAt: null,
      completedAt: null,
      sessionId: null,
    },
  ],
};

export function ContractsView({ welcome = false }: { welcome?: boolean }) {
  const t = useTranslations('contracting');
  if (!IS_LIVE)
    return (
      <div className="container-x pt-page">
        <p className="ct-notice">{t('demo')}</p>
        <ContractPanel row={DEMO} welcome={welcome} demo />
      </div>
    );
  return <RequireAuth contracting={false}>{() => <LiveContracts welcome={welcome} />}</RequireAuth>;
}
function LiveContracts({ welcome }: { welcome: boolean }) {
  const t = useTranslations('contracting');
  const { tp, describe } = useLive();
  const session = useSession();
  const search = useSearchParams();
  const id = search.get('id');
  const load = useCallback(
    (signal: AbortSignal) => (id ? endpoints.engagement(id, signal).then((row) => [row]) : endpoints.engagements(signal)),
    [id],
  );
  const { state, reload } = useResource(load, true);
  const rows = state.status === 'ready' ? state.data : [];
  const ordered = [...rows].sort(
    (a, b) =>
      Number(b.issues.some((i) => i.kind === 'start' && i.status === 'published')) -
      Number(a.issues.some((i) => i.kind === 'start' && i.status === 'published')),
  );
  return (
    <LiveFrame crumbs={[{ label: tp('nav.site'), href: '/' }, { label: t('title') }]}>
      <h1 className="display ct-title">{t(welcome ? 'welcome' : 'title')}</h1>
      <p className="pt-lead">{t('sequence')}</p>
      {state.status === 'loading' ? (
        <p role="status">{t('loading')}</p>
      ) : state.status === 'error' ? (
        <div role="alert">
          <p>{describe(state.error).message}</p>
          <button className="btn btn-ghost" onClick={reload}>
            {t('retry')}
          </button>
        </div>
      ) : !rows.length ? (
        <section className="ct-empty">
          <h2>{t('emptyTitle')}</h2>
          <p>{t('emptyBody')}</p>
          <Link href="/portal/solicitudes/" className="btn btn-ghost">
            {t('requests')}
          </Link>
        </section>
      ) : (
        ordered.map((row) => <ContractPanel key={row.id} row={row} welcome={welcome} onChanged={reload} />)
      )}
      <div className="lv-actions">
        <Link href="/" className="pt-link">
          {t('back')}
        </Link>
        <WhatsAppLink origin="portal" message={t('clarifyMessage')} className="pt-link">
          {t('clarify')}
        </WhatsAppLink>
        <button className="pt-link" onClick={() => void session.logout()}>
          {t('logout')}
        </button>
      </div>
    </LiveFrame>
  );
}
function ContractPanel({
  row,
  welcome,
  demo = false,
  onChanged,
}: {
  row: Engagement;
  welcome: boolean;
  demo?: boolean;
  onChanged?: () => void;
}) {
  const t = useTranslations('contracting');
  const [selected, setSelected] = useState<string | null>(null);
  const current =
    row.issues.find((i) => i.kind === 'start' && i.status === 'published') ?? row.issues.find((i) => i.kind === 'start') ?? row.issues[0];
  const issue = row.issues.find((i) => i.id === selected) ?? current;
  const usd = (c: number) => `USD ${(c / 100).toFixed(2)}`;
  return (
    <section className="ct-panel ticks">
      <header>
        <p className="label">{row.sandbox ? t('sandbox') : t('offer')}</p>
        <h2>{row.name}</h2>
        <p>{t(row.projectId ? 'projectActive' : current?.status === 'test_completed' ? 'acceptedPending' : 'reviewPending')}</p>
      </header>
      <dl className="ct-facts">
        <div>
          <dt>{t('total')}</dt>
          <dd>{usd(row.snapshot.totalCents)}</dd>
        </div>
        <div>
          <dt>{t('deposit')}</dt>
          <dd>
            {usd(row.snapshot.depositCents)} · {t(row.deposit.state === 'available' ? 'paymentVerified' : 'paymentPending')}
          </dd>
        </div>
        <div>
          <dt>{t('balance')}</dt>
          <dd>
            {usd(row.balance?.remainingCents ?? row.snapshot.balanceCents)} ·{' '}
            {t(row.balance?.state === 'available' ? 'paymentVerified' : 'balanceSeparate')}
          </dd>
        </div>
        <div>
          <dt>{t('monthly')}</dt>
          <dd>
            {usd(row.snapshot.monthlyCents)} {t('perMonth')}
          </dd>
        </div>
      </dl>
      <p>{row.snapshot.bonusMonths ? t('bonus') : t('activation')}</p>
      <p>{row.monthly.firstChargeOn ? `${t('firstCharge')}: ${row.monthly.firstChargeOn} · ${t('calendarPreview')}` : t('noDates')}</p>
      <ul>
        {row.snapshot.scope.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p>{row.snapshot.externals}</p>
      <p className="ct-notice">{t('legalBlock')}</p>
      {row.issues.length > 1 ? (
        <nav aria-label={t('history')}>
          <h3>{t('history')}</h3>
          {row.issues.map((i) => (
            <button className="btn btn-ghost btn-sm" key={i.id} aria-pressed={issue?.id === i.id} onClick={() => setSelected(i.id)}>
              {t(i.kind === 'start' ? 'startAgreement' : 'delivery')} · v{i.number} · {t(`states.${i.status}`)}
            </button>
          ))}
        </nav>
      ) : null}
      {issue ? <IssuePanel key={issue.id} issue={issue} row={row} demo={demo} onChanged={onChanged} /> : <p>{t('emptyTitle')}</p>}
      {row.projectId ? (
        <Link className="btn btn-primary" href={`/portal/proyecto/?id=${row.projectId}`}>
          {t('goProject')}
        </Link>
      ) : null}
      {!welcome ? (
        <Link className="pt-link" href="/portal/bienvenida/">
          {t('welcome')}
        </Link>
      ) : null}
    </section>
  );
}
function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function IssuePanel({ issue, row, demo, onChanged }: { issue: ContractIssue; row: Engagement; demo: boolean; onChanged?: () => void }) {
  const t = useTranslations('contracting');
  const [loadedText, setText] = useState<string | null>(null);
  const [failure, setFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [read, setRead] = useState(false);
  const [portfolio, setPortfolio] = useState(false);
  const [observation, setObservation] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const key = useRef<string | null>(null);
  const obsKey = useRef<{ text: string; key: string } | null>(null);
  useEffect(() => {
    let stopped = false;
    if (demo) return;
    const controller = new AbortController();
    endpoints.contractContent(issue.id, controller.signal).then(
      async (file) => {
        const content = await file.blob.text();
        if (!stopped) setText(content);
      },
      () => {
        if (!stopped) setFailure(true);
      },
    );
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [issue.id, row.snapshot, demo, t, retry]);
  const text = demo
    ? `${t('legalBlock')}\n\n${t('demoOutline')}\n\n${t('total')}: USD ${(row.snapshot.totalCents / 100).toFixed(2)}\n${t('deposit')}: USD ${(row.snapshot.depositCents / 100).toFixed(2)}\n${t('balance')}: USD ${(row.snapshot.balanceCents / 100).toFixed(2)}\n${t('monthly')}: USD ${(row.snapshot.monthlyCents / 100).toFixed(2)} ${t('perMonth')}\n\n${row.snapshot.scope.join('\n')}\n\n${row.snapshot.externals}`
    : loadedText;
  const action = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setFailure(false);
    try {
      await work();
    } catch {
      setFailure(true);
    } finally {
      setBusy(false);
    }
  };
  const complete = () =>
    action(async () => {
      if (demo) {
        setNotice(t('visualTestDone'));
        return;
      }
      const session = await endpoints.contractSession(issue.id);
      if (!session.sandbox || session.method !== 'sandbox_test') throw new Error('method_unavailable');
      key.current ??= newUuid();
      await endpoints.contractTest(
        issue.id,
        { sessionId: session.sessionId, documentHash: issue.documentHash, confirmTest: true, portfolio },
        key.current,
      );
      setNotice(t('testDone'));
      onChanged?.();
    });
  const expired = !!issue.expiresAt && new Date(issue.expiresAt) < new Date();
  const canTest = issue.status === 'published' && !expired && row.sandbox;
  return (
    <article className="ct-document">
      <h3>
        {t(issue.kind === 'start' ? 'startAgreement' : 'delivery')} · v{issue.number}
      </h3>
      <p>
        {t(`states.${issue.status}`)} · {t('method')}: {issue.method}
      </p>
      <p className="ct-hash">
        {t('version')}: {issue.templateVersion} · SHA-256: {issue.documentHash}
      </p>
      {issue.completedAt ? (
        <p>
          {t('completedAt')}: {issue.completedAt}
        </p>
      ) : null}
      {expired ? <p role="alert">{t('expired')}</p> : null}
      {failure ? (
        <div role="alert">
          <p>{t('error')}</p>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setFailure(false);
              setRetry((n) => n + 1);
            }}
          >
            {t('retry')}
          </button>
        </div>
      ) : null}
      {text ? (
        <pre className="ct-readable" tabIndex={0} aria-label={t('fullDocument')}>
          {text}
        </pre>
      ) : !failure ? (
        <p role="status">{t('loading')}</p>
      ) : null}
      <div className="lv-actions">
        <button
          className="btn btn-ghost"
          disabled={busy || !text}
          onClick={() =>
            void action(async () => {
              if (demo) save(new Blob([text ?? ''], { type: 'text/plain' }), 'demo-interno.txt');
              else {
                const file = await endpoints.contractContent(issue.id);
                save(file.blob, file.fileName ?? 'acuerdo.txt');
              }
            })
          }
        >
          {t('download')}
        </button>
        <button
          className="btn btn-ghost"
          disabled={busy || demo}
          onClick={() =>
            void action(async () => {
              const file = await endpoints.contractEvidence(issue.id);
              save(file.blob, file.fileName ?? 'evidencia.json');
            })
          }
        >
          {t('evidence')}
        </button>
        <WhatsAppLink origin="portal" message={t('clarifyMessage')} className="pt-link">
          {t('clarify')}
        </WhatsAppLink>
      </div>
      {canTest ? (
        <fieldset disabled={busy || !text} className="ct-consents">
          <legend>{t('testOnly')}</legend>
          <label>
            <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} />
            {t('readConfirm')}
          </label>
          <label>
            <input type="checkbox" checked={portfolio} onChange={(e) => setPortfolio(e.target.checked)} />
            {t('portfolio')}
          </label>
          <button className="btn btn-primary" disabled={!read || busy || !text} onClick={complete}>
            {busy ? t('loading') : t('testAction')}
          </button>
        </fieldset>
      ) : null}
      <p role="status">{notice ?? t('nextStep')}</p>
      {issue.kind === 'delivery' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              if (demo) {
                setNotice(t('visualObservation'));
                return;
              }
              if (!obsKey.current || obsKey.current.text !== observation) obsKey.current = { text: observation, key: newUuid() };
              await endpoints.contractObservation(issue.id, observation, obsKey.current.key);
              setNotice(t('observationDone'));
              setObservation('');
            });
          }}
        >
          <label htmlFor={`obs-${issue.id}`}>{t('observations')}</label>
          <textarea id={`obs-${issue.id}`} maxLength={2000} required value={observation} onChange={(e) => setObservation(e.target.value)} />
          <button className="btn btn-ghost" disabled={busy || !observation.trim()}>
            {t('sendObservation')}
          </button>
        </form>
      ) : null}
    </article>
  );
}
