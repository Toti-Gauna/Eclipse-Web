import { Lock } from 'lucide-react';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { TOTAL_STAGES, isMainStage, stageNumber, stagePhase, stagePosition } from '@/lib/portal/project';
import type { ClientAction, PortalProject } from '@/lib/portal/types';
import { InfoTip } from '../InfoTip';
import { usePortal } from '../usePortal';

const ACTION_BUTTONS: Record<ClientAction['kind'], ('approve' | 'adjust' | 'confirm' | 'upload')[]> = {
  approve: ['approve', 'adjust'],
  confirm: ['confirm'],
  upload: ['upload'],
};

/** Where the project is, what that stage means (definition, exit criterion, owner) and, if paused, why. */
export function CurrentStage({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  const position = stagePosition(project);
  const current = project.history[project.history.length - 1];
  const parts: string[] = [];
  if (isMainStage(project.stage) && position) parts.push(t('stage.position', { n: position, total: TOTAL_STAGES }));
  if (project.stage === 'paused' && project.pausedIn)
    parts.push(t('stage.pausedAt', { n: stageNumber(project.pausedIn), total: TOTAL_STAGES, stage: p.stage(project.pausedIn) }));
  parts.push(t(`stages.${project.stage}.short`));
  const since = project.stage === 'paused' && project.pause ? project.pause.since : current?.start;
  const plan = p.maintenance(project);

  return (
    <section className="pt-current ticks" data-stage={project.stage} aria-labelledby="pt-current-title" data-tour="pt-current">
      <div className="pt-dial">
        <PhaseGlyph phase={stagePhase(project)} size={72} />
        {position && project.stage !== 'support' && project.stage !== 'closed' ? (
          <p aria-hidden className="pt-dial-pos">
            {position}
            <span>/{TOTAL_STAGES}</span>
          </p>
        ) : null}
      </div>
      <div>
        <h2 id="pt-current-title" className="label">
          {t('detail.currentStage')}
        </h2>
        <p className="pt-current-name">
          {project.stage === 'support' && plan ? t('detail.supportWith', { plan: plan.name }) : p.stage(project.stage)}
        </p>
        <p className="pt-current-short">{parts.join(' · ')}</p>
        {since ? <p className="pt-current-since pt-date">{t('stage.since', { date: p.date(since) })}</p> : null}
        <p className="pt-current-note">{p.text(project, 'stageNote')}</p>

        {project.stage === 'paused' && project.pause ? (
          <div className="pt-pause">
            <p className="pt-pause-title">{t('detail.pause.title')}</p>
            <dl className="pt-dl">
              <div>
                <dt>{t('detail.pause.reason')}</dt>
                <dd>{p.text(project, 'pause.reason')}</dd>
              </div>
              <div>
                <dt>{t('detail.pause.next')}</dt>
                <dd>
                  {p.text(project, 'pause.next')} <span className="pt-meta">{t('detail.owner')}: {p.person(project.pause.owner)}</span>
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <dl className="pt-dl">
          <div>
            <dt>{t('detail.meaning')}</dt>
            <dd>{t(`stages.${project.stage}.definition`)}</dd>
          </div>
          <div>
            <dt>{t('detail.exit')}</dt>
            <dd>{t(`stages.${project.stage}.exit`)}</dd>
          </div>
          <div>
            <dt>{t('detail.owner')}</dt>
            <dd>{t(`stages.${project.stage}.owner`)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

/** Next milestone with its owner and an estimated date, labeled as an estimate. */
export function NextMilestone({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  return (
    <section className="pt-box" aria-labelledby="pt-milestone-title">
      <h2 id="pt-milestone-title" className="label">
        {t('detail.nextMilestone')}
      </h2>
      <p className="pt-box-title">{p.text(project, 'milestone')}</p>
      <dl className="pt-dl">
        <div>
          <dt>{t('detail.owner')}</dt>
          <dd>{p.person(project.nextMilestone.owner)}</dd>
        </div>
        <div>
          <dt>
            <span className="pt-term">
              {t('detail.estimate')}
              <InfoTip copy={p.info('estimate')} />
            </span>
          </dt>
          <dd>
            <time className="pt-date" dateTime={project.nextMilestone.due}>
              {p.date(project.nextMilestone.due)}
            </time>
          </dd>
        </div>
      </dl>
      <p className="pt-fine">{t('detail.estimateNote')}</p>
    </section>
  );
}

/** What the client has to do now. The buttons are disabled: approvals need the backend. */
export function ClientActionBox({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  const action = project.action;
  return (
    <section className="pt-box" data-turn={action ? '' : undefined} aria-labelledby="pt-action-title">
      <div className="pt-box-head">
        <h2 id="pt-action-title" className="label">
          {t('detail.yourAction')}
        </h2>
        {action ? <span className="pt-tag pt-tag-turn">{t('projects.yourTurn')}</span> : null}
      </div>
      {action ? (
        <>
          <p className="pt-box-title">{p.text(project, 'action.title')}</p>
          <p className="pt-box-text">{p.text(project, 'action.detail')}</p>
          <p className="pt-meta">
            <span className="pt-date">{t('detail.requested', { date: p.date(action.requestedOn) })}</span>
          </p>
          <div className="pt-actions">
            {ACTION_BUTTONS[action.kind].map((key) => (
              <button key={key} type="button" disabled className="btn btn-sm pt-btn-off">
                {t(`detail.actions.${key}`)}
              </button>
            ))}
          </div>
          <p className="pt-fine pt-backend">
            <Lock aria-hidden strokeWidth={1.6} />
            <span>
              <strong>{t('detail.needsBackend')}</strong> — {t('detail.needsBackendNote')}
            </span>
          </p>
        </>
      ) : (
        <>
          <p className="pt-box-title">{t('detail.noAction')}</p>
          <p className="pt-fine">{t('detail.noActionNote')}</p>
        </>
      )}
    </section>
  );
}
