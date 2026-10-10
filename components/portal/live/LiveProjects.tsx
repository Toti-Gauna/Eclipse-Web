'use client';

import { useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { endpoints } from '@/lib/api';
import type { ApiProjectSummary } from '@/lib/api/types';
import { countBuckets, byUpdated, knownProject } from '@/lib/portal/live-model';
import { livePaths } from '@/lib/portal/live';
import { InfoTip } from '../InfoTip';
import { LiveFrame } from './LiveFrame';
import { LiveStageMark } from './StageMark';
import { RequireAuth } from './RequireAuth';
import { EmptyState, ErrorState, LoadingState, WhatsAppHelp } from './states';
import { useLive, useResource } from './hooks';

/**
 * /[locale]/portal/proyectos/ in live mode — "Mis proyectos" from GET /client/projects.
 * The list DTO has stage, status, planned end and last change; the milestone and the
 * required actions are per project, so they live in the detail (no N+1 requests here).
 * Table on desktop, cards on phones — the same two layouts as the demo.
 */
export function LiveProjects() {
  const { t, tp } = useLive();
  return (
    <LiveFrame crumbs={[{ label: tp('nav.site'), href: '/' }, { label: tp('nav.portal'), href: livePaths.login }, { label: tp('nav.projects') }]}>
      <RequireAuth>{(client) => <ProjectsBody name={client.displayName} email={client.email} />}</RequireAuth>
      <span className="sr-only">{t('projects.title')}</span>
    </LiveFrame>
  );
}

function ProjectsBody({ name, email }: { name: string | null; email: string }) {
  const { t, tp } = useLive();
  const load = useCallback((signal: AbortSignal) => endpoints.projects(signal), []);
  const { state, reload } = useResource(load, true);
  const first = (name ?? '').trim().split(/\s+/)[0];

  return (
    <>
      <header className="pt-dash-head">
        <p className="pt-kicker label">{tp('projects.label')}</p>
        <h1 className="display pt-hello">{first ? tp('projects.hello', { name: first }) : t('projects.helloAnon')}</h1>
        {state.status === 'ready' ? <p className="pt-company">{t('projects.count', { count: state.data.items.length })}</p> : <p className="pt-company">{email}</p>}
      </header>

      {state.status === 'loading' ? <LoadingState label={t('projects.loading')} /> : null}
      {state.status === 'error' ? <ErrorState error={state.error} onRetry={reload} /> : null}
      {state.status === 'ready' ? (
        state.data.items.length === 0 ? (
          <EmptyState title={t('projects.empty.title')} body={t('projects.empty.body')}>
            <WhatsAppHelp message={t('projects.empty.message')} label={t('projects.empty.cta')} from="empty" />
            <Link href={livePaths.requests} className="pt-link">
              {t('projects.empty.requests')}
            </Link>
          </EmptyState>
        ) : (
          <ProjectList projects={byUpdated(state.data.items)} />
        )
      ) : null}
    </>
  );
}

function ProjectList({ projects }: { projects: ApiProjectSummary[] }) {
  const { t, tp, date, stamp, info } = useLive();
  const shown = projects.filter(knownProject);
  const buckets = countBuckets(shown);
  const parts = (['active', 'support', 'paused', 'closed'] as const).filter((b) => buckets[b] > 0).map((b) => tp(`projects.buckets.${b}`, { count: buckets[b] }));
  const lastUpdated = shown[0];

  return (
    <>
      <section aria-labelledby="lv-overview-title">
        <h2 id="lv-overview-title" className="sr-only">
          {tp('projects.summaryTitle')}
        </h2>
        <dl className="pt-overview">
          <div>
            <dt>{tp('projects.overall')}</dt>
            <dd>
              <span className="pt-overview-strong">{t('projects.total', { count: shown.length })}</span> <span className="pt-fine">{parts.join(' · ')}</span>
            </dd>
          </div>
          {lastUpdated ? (
            <div>
              <dt>{tp('projects.lastUpdate')}</dt>
              <dd>
                <time className="pt-date" dateTime={lastUpdated.updatedAt}>
                  {stamp(lastUpdated.updatedAt)}
                </time>{' '}
                <Link href={livePaths.project(lastUpdated.id)}>{lastUpdated.name}</Link>
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="pt-list" aria-labelledby="lv-list-title">
        <div className="pt-list-head">
          <h2 id="lv-list-title" className="pt-h2">
            {tp('projects.listTitle')}
          </h2>
          <span className="pt-count">{shown.length}</span>
        </div>
        <div className="pt-legend">
          <p className="label pt-legend-label">{tp('info.legend')}</p>
          <InfoTip copy={info('stages', true)} />
          <InfoTip copy={info('estimate', true)} />
        </div>

        <div className="pt-table-wrap">
          <table role="table" className="pt-table" data-portal-projects-table>
            <caption className="sr-only">{t('projects.tableCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{tp('projects.columns.project')}</th>
                <th scope="col">{tp('projects.columns.stage')}</th>
                <th scope="col">{tp('projects.columns.updated')}</th>
                <th scope="col">{t('projects.columns.plannedEnd')}</th>
                <th scope="col">
                  <span className="sr-only">{tp('projects.columns.open')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((project) => (
                <tr key={project.id} data-portal-project={project.id}>
                  <th scope="row">
                    <Link href={livePaths.project(project.id)} className="pt-table-name">
                      {project.name}
                    </Link>
                    <span className="pt-meta">{project.service}</span>
                  </th>
                  <td>
                    <LiveStageMark project={project} layout="stack" meaning />
                  </td>
                  <td>
                    <time className="pt-date" dateTime={project.updatedAt}>
                      {stamp(project.updatedAt)}
                    </time>
                  </td>
                  <td>{project.plannedEndOn ? <time className="pt-date" dateTime={project.plannedEndOn}>{date(project.plannedEndOn)}</time> : <span className="pt-meta">—</span>}</td>
                  <td>
                    <Link href={livePaths.project(project.id)} className="btn btn-sm pt-open btn-ghost" data-portal-open>
                      {tp('projects.view')}
                      <span className="sr-only">: {project.name}</span>
                      <ArrowRight aria-hidden strokeWidth={1.6} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="pt-cards" data-portal-projects-cards>
          {shown.map((project) => (
            <li key={project.id}>
              <article className="pt-card" data-portal-project={project.id} aria-labelledby={`lv-card-${project.id}`}>
                <h3 id={`lv-card-${project.id}`} className="pt-card-title">
                  {project.name}
                </h3>
                <p className="pt-card-service">{project.service}</p>
                <dl className="pt-dl">
                  <div>
                    <dt>{tp('projects.columns.stage')}</dt>
                    <dd>
                      <LiveStageMark project={project} layout="stack" meaning />
                    </dd>
                  </div>
                  <div>
                    <dt>{tp('projects.columns.updated')}</dt>
                    <dd>
                      <time className="pt-date" dateTime={project.updatedAt}>
                        {stamp(project.updatedAt)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('projects.columns.plannedEnd')}</dt>
                    <dd>{project.plannedEndOn ? <time className="pt-date" dateTime={project.plannedEndOn}>{date(project.plannedEndOn)}</time> : '—'}</dd>
                  </div>
                </dl>
                <div className="pt-card-foot">
                  <Link href={livePaths.project(project.id)} className="btn btn-sm pt-open pt-stretched btn-ghost" data-portal-open>
                    {tp('projects.view')}
                    <span className="sr-only">: {project.name}</span>
                    <ArrowRight aria-hidden strokeWidth={1.6} />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
