'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { errorKind, endpoints } from '@/lib/api';
import type { ApiChangeRequest, ApiMilestone, ApiProjectDetail, ApiUpdate } from '@/lib/api/types';
import { idFromSearch, livePaths } from '@/lib/portal/live';
import {
  TOTAL_STAGES,
  changeGroups,
  displayStage,
  newestFirst,
  nextMilestone,
  openActions,
  phase,
  position,
  rail,
} from '@/lib/portal/live-model';
import { EXTRA_STAGES, MAIN_STAGES } from '@/lib/portal/types';
import { InfoTip } from '../InfoTip';
import { PortalTabs } from '../detail/PortalTabs';
import { DocumentsPanel } from './DocumentsPanel';
import { LiveFrame } from './LiveFrame';
import { RequireAuth } from './RequireAuth';
import { ErrorState, LoadingState, NotFoundState, WhatsAppHelp } from './states';
import { useLive, useResource } from './hooks';

/**
 * /[locale]/portal/proyecto/?id=<uuid> in live mode. Real project ids only exist at runtime,
 * so this is ONE static page that reads the id from the query. The id is validated as a UUID
 * before any request; an unknown id and another client's id both end in the same "not found".
 * Everything shown comes from GET /client/projects/:id (+ its documents): the DTO has no
 * money, internal notes or Eclipse people, and nothing is invented to fill those gaps.
 */
export function LiveProject() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { t, tp } = useLive();
  const search = useSearchParams();
  const id = idFromSearch(search);
  return (
    <LiveFrame
      crumbs={[
        { label: tp('nav.site'), href: '/' },
        { label: tp('nav.portal'), href: livePaths.login },
        { label: tp('nav.projects'), href: livePaths.projects },
        { label: t('detail.crumb') },
      ]}
    >
      <RequireAuth>{() => (id ? <Body key={id} id={id} /> : <Missing />)}</RequireAuth>
    </LiveFrame>
  );
}

function Missing() {
  const { t, tp } = useLive();
  return <NotFoundState title={t('detail.notFoundTitle')} body={t('detail.notFoundBody')} back={tp('nav.backToProjects')} href={livePaths.projects} />;
}

function Body({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => endpoints.project(id, signal), [id]);
  const { state, reload, refresh } = useResource(load, true);
  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') {
    return errorKind(state.error) === 'notFound' ? <Missing /> : <ErrorState error={state.error} onRetry={reload} />;
  }
  return <ProjectDetail project={state.data} onRefresh={refresh} />;
}

function ProjectDetail({ project, onRefresh }: { project: ApiProjectDetail; onRefresh: () => void }) {
  const { t, tp } = useLive();
  const updates = newestFirst(project.updates);
  const actions = openActions(project.updates);
  const tabs = [
    { id: 'updates', label: tp('detail.tabs.updates'), count: updates.length, content: <UpdatesLog updates={updates} /> },
    { id: 'milestones', label: t('detail.tabs.milestones'), count: project.milestones.length, content: <Milestones milestones={project.milestones} /> },
    { id: 'scope', label: tp('detail.tabs.scope'), content: <ScopePanel project={project} /> },
    { id: 'documents', label: tp('detail.tabs.documents'), content: <DocumentsPanel projectId={project.id} /> },
    { id: 'stages', label: tp('detail.tabs.stages'), content: <StagesGuide project={project} /> },
  ];

  return (
    <>
      <header className="pt-detail-head">
        <p className="pt-detail-meta">
          <span className="pt-detail-code">{t(`detail.role.${project.myRole}`)}</span>
          <button type="button" className="pt-link lv-linkbtn" onClick={onRefresh}>
            {t('detail.refresh')}
          </button>
        </p>
        <h1 className="display pt-detail-title">{project.name}</h1>
        <p className="pt-detail-sub">
          <strong>{project.service}</strong>
        </p>
      </header>

      <div className="pt-top">
        <CurrentStage project={project} />
        <div className="pt-side">
          <NextMilestoneBox milestones={project.milestones} />
          <ActionBox actions={actions} />
        </div>
      </div>

      <Timeline project={project} />

      <div className="pt-bottom">
        <section className="pt-follow" aria-labelledby="pt-follow-title">
          <div className="pt-follow-head">
            <h2 id="pt-follow-title" className="pt-h2">
              {tp('detail.follow.title')}
            </h2>
            <p className="pt-fine">{t('detail.follow.intro')}</p>
          </div>
          <PortalTabs id={`pt-${project.id}`} label={tp('detail.tabs.label')} tabs={tabs} />
        </section>
        <Facts project={project} />
      </div>
    </>
  );
}

function CurrentStage({ project }: { project: ApiProjectDetail }) {
  const { t, tp, date, info } = useLive();
  const shown = displayStage(project);
  const n = position(project);
  const main = shown !== 'support' && shown !== 'closed';
  const parts: string[] = [];
  if (shown !== 'paused' && shown !== 'closed' && shown !== 'support') parts.push(tp('stage.position', { n, total: TOTAL_STAGES }));
  if (shown === 'paused') parts.push(tp('stage.pausedAt', { n, total: TOTAL_STAGES, stage: tp(`stages.${displayStage({ stage: project.stage, status: 'active' })}.name`) }));
  parts.push(tp(`stages.${shown}.short`));

  return (
    <section className="pt-current ticks" data-stage={shown} aria-labelledby="pt-current-title">
      <div className="pt-dial">
        <PhaseGlyph phase={phase(project)} size={72} />
        {main ? (
          <p aria-hidden className="pt-dial-pos">
            {n}
            <span>/{TOTAL_STAGES}</span>
          </p>
        ) : null}
      </div>
      <div>
        <h2 id="pt-current-title" className="label">
          {tp('detail.currentStage')}
        </h2>
        <p className="pt-current-name">{tp(`stages.${shown}.name`)}</p>
        <p className="pt-current-short">{parts.join(' · ')}</p>
        {project.startedOn ? <p className="pt-current-since pt-date">{t('detail.startedOn', { date: date(project.startedOn) })}</p> : null}
        {shown === 'paused' ? (
          <div className="pt-pause">
            <p className="pt-pause-title">{tp('detail.pause.title')}</p>
            <p className="pt-fine">{t('detail.pausedNote')}</p>
          </div>
        ) : null}
        {shown === 'closed' ? (
          <p className="pt-current-note">{project.completedOn ? t('detail.closedOn', { date: date(project.completedOn) }) : t('detail.closedNote')}</p>
        ) : null}
        <dl className="pt-dl">
          <div>
            <dt>{tp('detail.meaning')}</dt>
            <dd>{tp(`stages.${shown}.definition`)}</dd>
          </div>
          <div>
            <dt>{tp('detail.exit')}</dt>
            <dd>{tp(`stages.${shown}.exit`)}</dd>
          </div>
          <div>
            <dt>{tp('detail.owner')}</dt>
            <dd>
              {tp(`stages.${shown}.owner`)}
              {shown === 'clientReview' ? <InfoTip copy={info('clientReview')} /> : null}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function NextMilestoneBox({ milestones }: { milestones: ApiMilestone[] }) {
  const { t, tp, date, info } = useLive();
  const next = nextMilestone(milestones);
  return (
    <section className="pt-box" aria-labelledby="pt-milestone-title">
      <h2 id="pt-milestone-title" className="label">
        {tp('detail.nextMilestone')}
      </h2>
      {next ? (
        <>
          <p className="pt-box-title">{next.title}</p>
          {next.description ? <p className="pt-box-text lv-pre">{next.description}</p> : null}
          <dl className="pt-dl">
            <div>
              <dt>{tp('detail.owner')}</dt>
              <dd>{t(`detail.party.${next.ownerParty}`)}</dd>
            </div>
            <div>
              <dt>
                <span className="pt-term">
                  {tp('detail.estimate')}
                  <InfoTip copy={info('estimate')} />
                </span>
              </dt>
              <dd>
                {next.plannedOn ? (
                  <time className="pt-date" dateTime={next.plannedOn}>
                    {date(next.plannedOn)}
                  </time>
                ) : (
                  t('detail.noDate')
                )}
              </dd>
            </div>
          </dl>
          <p className="pt-fine">{tp('detail.estimateNote')}</p>
        </>
      ) : (
        <>
          <p className="pt-box-title">{t('detail.noMilestone')}</p>
          <p className="pt-fine">{t('detail.noMilestoneNote')}</p>
        </>
      )}
    </section>
  );
}

function ActionBox({ actions }: { actions: ApiUpdate[] }) {
  const { t, tp, date, stamp } = useLive();
  return (
    <section className="pt-box" data-turn={actions.length ? '' : undefined} aria-labelledby="pt-action-title">
      <div className="pt-box-head">
        <h2 id="pt-action-title" className="label">
          {tp('detail.yourAction')}
        </h2>
        {actions.length ? <span className="pt-tag pt-tag-turn">{tp('projects.yourTurn')}</span> : null}
      </div>
      {actions.length ? (
        <>
          <ul className="lv-actions-list">
            {actions.map((a) => (
              <li key={a.id}>
                <p className="pt-box-title">{a.title ?? t('detail.actionUntitled')}</p>
                <p className="pt-box-text lv-pre">{a.body}</p>
                <p className="pt-meta">
                  {a.dueOn ? (
                    <span className="pt-date">
                      {t('detail.due')} <time dateTime={a.dueOn}>{date(a.dueOn)}</time>
                    </span>
                  ) : (
                    <span className="pt-date">{t('detail.noDue')}</span>
                  )}
                  {' · '}
                  <span className="pt-date">{tp('detail.requested', { date: stamp(a.publishedAt) })}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="pt-fine">{t('detail.actionHow')}</p>
          <div className="pt-actions">
            <WhatsAppHelp message={t('detail.actionMessage')} label={t('detail.actionCta')} from="project-action" />
          </div>
        </>
      ) : (
        <>
          <p className="pt-box-title">{tp('detail.noAction')}</p>
          <p className="pt-fine">{tp('detail.noActionNote')}</p>
        </>
      )}
    </section>
  );
}

function Timeline({ project }: { project: ApiProjectDetail }) {
  const { t, tp, date, info } = useLive();
  const delivered = project.stage === 'support' || (project.status === 'closed' && project.stage === 'delivery');
  return (
    <section className="pt-timeline" aria-labelledby="pt-timeline-title">
      <h2 id="pt-timeline-title" className="pt-h2">
        {tp('detail.timeline')}
      </h2>
      <ol className="pt-rail">
        {rail(project).map((step) => {
          const extra =
            step.stage === 'delivery'
              ? project.completedOn && delivered
                ? tp('detail.facts.delivered', { date: date(project.completedOn) })
                : project.plannedEndOn && step.status !== 'done'
                  ? `${tp('detail.estimate')} ${date(project.plannedEndOn)}`
                  : null
              : null;
          return (
            <li
              key={step.stage}
              className="pt-rail-step"
              data-status={step.status}
              aria-current={step.status === 'current' || step.status === 'paused' ? 'step' : undefined}
            >
              <PhaseGlyph phase={step.n / TOTAL_STAGES} size={28} className="pt-rail-mark" />
              <span className="pt-rail-n">{tp('stage.position', { n: step.n, total: TOTAL_STAGES })}</span>{' '}
              <span className="pt-rail-name">
                {tp(`stages.${step.stage}.name`)}
                {step.stage === 'clientReview' ? <InfoTip copy={info('clientReview')} /> : null}
              </span>{' '}
              <span className="pt-rail-status">
                <strong>{tp(`stage.status.${step.status}`)}</strong>
                {extra ? (
                  <>
                    {' · '}
                    <span className="pt-date">{extra}</span>
                  </>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
      {project.stage === 'support' ? (
        <p className="pt-rail-extra">
          <PhaseGlyph phase={1} size={20} />
          <strong>{tp('stages.support.name')}</strong>{' '}
          <span className="pt-fine">{tp('stage.status.current')}</span>
        </p>
      ) : null}
      <p className="pt-fine">{tp('detail.timelineNote')}</p>
      <span className="sr-only">{t('detail.timelineNoDates')}</span>
    </section>
  );
}

function UpdatesLog({ updates }: { updates: ApiUpdate[] }) {
  const { t, tp, stamp, date } = useLive();
  if (!updates.length) return <p className="pt-fine">{t('detail.updates.empty')}</p>;
  return (
    <>
      <h3 className="sr-only">{tp('detail.tabs.updates')}</h3>
      <ol className="pt-log">
        {updates.map((u) => (
          <li key={u.id} className="pt-log-item" data-change={u.kind === 'status_change' ? '' : undefined}>
            <time className="pt-date pt-log-date" dateTime={u.publishedAt}>
              {stamp(u.publishedAt)}
            </time>
            <div className="pt-log-body">
              {u.kind === 'status_change' ? (
                <p className="pt-log-change">{tp('detail.updates.stageChange')}</p>
              ) : null}
              {u.kind === 'action_required' ? (
                <p className="lv-update-tags">
                  <span className={`pt-tag ${u.resolved ? '' : 'pt-tag-attn'}`}>
                    {u.resolved ? (
                      <>
                        <Check aria-hidden strokeWidth={1.8} />
                        {t('detail.updates.resolved')}
                      </>
                    ) : (
                      t('detail.updates.actionOpen')
                    )}
                  </span>
                  {u.dueOn ? (
                    <span className="pt-date">
                      {t('detail.due')} {date(u.dueOn)}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {u.title ? <h4 className="pt-log-title">{u.title}</h4> : null}
              <p className="pt-log-text lv-pre">{u.body}</p>
              <p className="pt-log-author">{t('detail.byEclipse')}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function Milestones({ milestones }: { milestones: ApiMilestone[] }) {
  const { t, tp, date } = useLive();
  if (!milestones.length) return <p className="pt-fine">{t('detail.milestones.empty')}</p>;
  return (
    <>
      <h3 className="sr-only">{t('detail.tabs.milestones')}</h3>
      <ul className="pt-changes">
        {milestones.map((m) => (
          <li key={m.id} className="pt-change" data-open={m.status === 'done' ? undefined : ''}>
            <div className="pt-change-top">
              <p className="pt-change-title">{m.title}</p>
              <span className={`pt-tag ${m.status === 'current' ? 'pt-tag-attn' : m.status === 'upcoming' ? 'pt-tag-out' : ''}`}>{t(`detail.milestones.status.${m.status}`)}</span>
            </div>
            {m.description ? <p className="pt-fine lv-pre">{m.description}</p> : null}
            <p className="pt-meta">
              {tp(`stages.${displayStage({ stage: m.stage, status: 'active' })}.name`)} · {t(`detail.party.${m.ownerParty}`)}
              {m.status === 'done' && m.actualOn ? (
                <>
                  {' · '}
                  <span className="pt-date">{t('detail.milestones.doneOn', { date: date(m.actualOn) })}</span>
                </>
              ) : m.plannedOn ? (
                <>
                  {' · '}
                  <span className="pt-date">{t('detail.milestones.plannedOn', { date: date(m.plannedOn) })}</span>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

const FLOW = ['received', 'evaluating', 'estimated', 'decided', 'closed'] as const;
const flowIndex = (status: ApiChangeRequest['status']) =>
  status === 'accepted' || status === 'rejected' ? FLOW.indexOf('decided') : FLOW.indexOf(status as (typeof FLOW)[number]);

function ScopePanel({ project }: { project: ApiProjectDetail }) {
  const { t, tp, date, stamp, info } = useLive();
  const { accepted, open, closed } = changeGroups(project.changeRequests);
  const history = project.scope.history.filter((h) => h.version !== project.scope.version);

  const change = (c: ApiChangeRequest, kind: 'accepted' | 'open' | 'closed') => (
    <li key={c.number} className="pt-change" data-open={kind === 'open' ? '' : undefined}>
      <div className="pt-change-top">
        <p className="pt-change-title">
          <span className="pt-date">#{c.number}</span> {c.title}
        </p>
        {kind === 'accepted' ? (
          <span className="pt-tag">
            <Check aria-hidden strokeWidth={1.8} />
            {tp('detail.changeStatus.accepted')}
          </span>
        ) : kind === 'open' ? (
          <span className="pt-tag pt-tag-out">{tp('detail.scope.notIncluded')}</span>
        ) : (
          <span className="pt-tag pt-tag-out">{tp(`detail.changeStatus.${c.status}`)}</span>
        )}
      </div>
      {c.description ? <p className="pt-fine lv-pre">{c.description}</p> : null}
      {c.scheduleImpactDays !== null && c.scheduleImpactDays !== 0 ? (
        <dl className="pt-dl">
          <div>
            <dt>{t('detail.scope.scheduleImpact')}</dt>
            <dd>{t('detail.scope.days', { count: c.scheduleImpactDays })}</dd>
          </div>
        </dl>
      ) : null}
      {kind === 'open' ? (
        <ol className="pt-flow" aria-label={tp('detail.scope.flowLabel')}>
          {FLOW.map((step, i) => (
            <li key={step} aria-current={i === flowIndex(c.status) ? 'step' : undefined}>
              {step === 'decided' ? `${tp('detail.changeStatus.accepted')} / ${tp('detail.changeStatus.rejected')}` : tp(`detail.changeStatus.${step}`)}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="pt-meta">
        <span className="pt-date">{t('detail.scope.requestedOn', { date: stamp(c.requestedAt) })}</span>
        {c.decidedAt ? (
          <>
            {' · '}
            <span className="pt-date">{t('detail.scope.decidedOn', { date: stamp(c.decidedAt) })}</span>
          </>
        ) : null}
      </p>
    </li>
  );

  return (
    <div className="pt-scope">
      <h3 className="sr-only">{tp('detail.tabs.scope')}</h3>
      <section aria-labelledby="pt-scope-approved">
        <div className="pt-scope-head">
          <h4 id="pt-scope-approved" className="pt-h3">
            {tp('detail.scope.approvedTitle')}
          </h4>
          <p className="pt-fine">
            <span className="pt-date">{tp('detail.scope.approvedMeta', { version: project.scope.version, date: date(project.scope.acceptedOn) })}</span>
          </p>
        </div>
        <ul className="pt-checklist">
          {project.scope.items.map((item, i) => (
            <li key={`${i}-${item}`}>
              <Check aria-hidden strokeWidth={1.6} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {history.length ? (
          <details className="lv-history">
            <summary>{t('detail.scope.history', { count: history.length })}</summary>
            <ul>
              {history.map((h) => (
                <li key={h.version}>
                  <p className="pt-fine">
                    <span className="pt-date">{tp('detail.scope.approvedMeta', { version: h.version, date: date(h.acceptedOn) })}</span>
                  </p>
                  <ul className="pt-checklist">
                    {h.items.map((item, i) => (
                      <li key={`${i}-${item}`}>
                        <Check aria-hidden strokeWidth={1.6} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section aria-labelledby="pt-scope-accepted">
        <div className="pt-scope-head">
          <h4 id="pt-scope-accepted" className="pt-h3">
            {tp('detail.scope.acceptedTitle')}
          </h4>
          <span className="pt-count">{accepted.length}</span>
        </div>
        {accepted.length ? <ul className="pt-changes">{accepted.map((c) => change(c, 'accepted'))}</ul> : <p className="pt-fine">{tp('detail.scope.noAccepted')}</p>}
      </section>

      <section aria-labelledby="pt-scope-open">
        <div className="pt-scope-head">
          <div className="pt-term">
            <h4 id="pt-scope-open" className="pt-h3">
              {tp('detail.scope.openTitle')}
            </h4>
            <InfoTip copy={info('changes')} />
          </div>
          <span className="pt-count">{open.length}</span>
        </div>
        {open.length ? <ul className="pt-changes">{open.map((c) => change(c, 'open'))}</ul> : <p className="pt-fine">{tp('detail.scope.noOpen')}</p>}
      </section>

      {closed.length ? (
        <section aria-labelledby="pt-scope-closed">
          <div className="pt-scope-head">
            <h4 id="pt-scope-closed" className="pt-h3">
              {t('detail.scope.closedTitle')}
            </h4>
            <span className="pt-count">{closed.length}</span>
          </div>
          <ul className="pt-changes">{closed.map((c) => change(c, 'closed'))}</ul>
        </section>
      ) : null}

      <p className="pt-rule">
        <Info aria-hidden strokeWidth={1.6} />
        <span>{tp('detail.scope.rule')}</span>
      </p>
      <div className="pt-request">
        <WhatsAppHelp message={t('detail.scope.requestMessage', { name: project.name })} label={tp('detail.scope.request')} from="project-change" />
      </div>
    </div>
  );
}

function StagesGuide({ project }: { project: ApiProjectDetail }) {
  const { tp } = useLive();
  const current = displayStage(project);
  const item = (stage: string, ph: number, n?: number) => (
    <li key={stage} className="pt-guide-item" data-current={current === stage ? '' : undefined}>
      <div className="pt-guide-head">
        <PhaseGlyph phase={ph} size={20} />
        {n ? <span className="pt-guide-n">{tp('stage.position', { n, total: TOTAL_STAGES })}</span> : null}{' '}
        <h4 className="pt-h3">{tp(`stages.${stage}.name`)}</h4>
        <span className="pt-guide-short">{tp(`stages.${stage}.short`)}</span>
        {current === stage ? <span className="pt-tag pt-tag-turn">{tp('detail.stagesTab.current')}</span> : null}
      </div>
      <dl className="pt-dl">
        <div>
          <dt>{tp('detail.stagesTab.definition')}</dt>
          <dd>{tp(`stages.${stage}.definition`)}</dd>
        </div>
        <div>
          <dt>{tp('detail.stagesTab.exit')}</dt>
          <dd>{tp(`stages.${stage}.exit`)}</dd>
        </div>
        <div>
          <dt>{tp('detail.stagesTab.owner')}</dt>
          <dd>{tp(`stages.${stage}.owner`)}</dd>
        </div>
      </dl>
    </li>
  );
  return (
    <>
      <h3 className="sr-only">{tp('detail.stagesTab.title')}</h3>
      <p className="pt-fine">{tp('detail.stagesTab.intro')}</p>
      <ol className="pt-guide-list">{MAIN_STAGES.map((stage, i) => item(stage, (i + 1) / TOTAL_STAGES, i + 1))}</ol>
      <p className="label pt-guide-extra">{tp('detail.stagesTab.extra')}</p>
      <ul className="pt-guide-list">{EXTRA_STAGES.map((stage) => item(stage, stage === 'paused' ? 0.4 : 1))}</ul>
    </>
  );
}

function Facts({ project }: { project: ApiProjectDetail }) {
  const { t, tp, date } = useLive();
  const done = project.completedOn;
  return (
    <aside className="pt-facts" aria-labelledby="pt-facts-title">
      <h2 id="pt-facts-title" className="label">
        {tp('detail.facts.title')}
      </h2>
      <dl className="pt-dl">
        <div>
          <dt>{tp('detail.facts.service')}</dt>
          <dd>{project.service}</dd>
        </div>
        {project.startedOn ? (
          <div>
            <dt>{tp('detail.facts.start')}</dt>
            <dd>
              <time className="pt-date" dateTime={project.startedOn}>
                {date(project.startedOn)}
              </time>{' '}
              · {tp('detail.facts.startNote')}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>{done ? tp('stages.delivery.name') : tp('detail.facts.delivery')}</dt>
          <dd>
            {done ? (
              <span className="pt-date">{tp('detail.facts.delivered', { date: date(done) })}</span>
            ) : project.plannedEndOn ? (
              <>
                <time className="pt-date" dateTime={project.plannedEndOn}>
                  {date(project.plannedEndOn)}
                </time>
                <span className="pt-meta">{tp('detail.estimateNote')}</span>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt>{t('detail.facts.role')}</dt>
          <dd>{t(`detail.role.${project.myRole}`)}</dd>
        </div>
        <div>
          <dt>{tp('detail.facts.channel')}</dt>
          <dd>{tp('detail.facts.channelValue')}</dd>
        </div>
      </dl>
      <Link href={livePaths.projects} className="pt-link">
        <ArrowLeft aria-hidden strokeWidth={1.5} />
        {tp('nav.backToProjects')}
      </Link>
    </aside>
  );
}
