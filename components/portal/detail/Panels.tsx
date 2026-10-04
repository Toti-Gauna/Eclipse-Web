import { Check, FileText, Info, Lock } from 'lucide-react';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { TOTAL_STAGES, changeGroups, documentsByDate } from '@/lib/portal/project';
import { EXTRA_STAGES, MAIN_STAGES, type ChangeRequest, type PortalProject, type StageId } from '@/lib/portal/types';
import { usePortal } from '../usePortal';

/** Dated updates written by Eclipse, newest first; stage transitions are marked. */
export function UpdatesLog({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  return (
    <>
      <h2 className="sr-only">{t('detail.tabs.updates')}</h2>
      <ol className="pt-log">
        {project.updates.map((u) => (
          <li key={u.id} className="pt-log-item" data-change={u.stageChange ? '' : undefined}>
            <time className="pt-date pt-log-date" dateTime={u.date}>
              {p.date(u.date)}
            </time>
            <div className="pt-log-body">
              {u.stageChange ? (
                <p className="pt-log-change">
                  {u.stageChange.from ? t('detail.updates.stageChange') : t('detail.updates.projectStart')}
                  <span className="sr-only">: </span>
                  <b>
                    {u.stageChange.from ? `${p.stage(u.stageChange.from)} → ` : ''}
                    {p.stage(u.stageChange.to)}
                  </b>
                </p>
              ) : null}
              <h3 className="pt-log-title">{p.text(project, `updates.${u.id}.title`)}</h3>
              <p className="pt-log-text">{p.text(project, `updates.${u.id}.body`)}</p>
              <p className="pt-log-author">{p.byline(u.author)}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

const FLOW = ['received', 'evaluating', 'estimated', 'decided', 'closed'] as const;
const flowIndex = (status: ChangeRequest['status']) =>
  status === 'accepted' || status === 'rejected' ? 3 : FLOW.indexOf(status as (typeof FLOW)[number]);

/**
 * "Alcance aprobado" and "Cambios aceptados" as separate ledgers; requests still being
 * evaluated sit apart, dashed and marked "No incluido", under the rule that nothing
 * changes scope, cost or timeline until an acceptance is recorded.
 */
export function ScopePanel({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  const { accepted, open } = changeGroups(project);
  const key = (c: ChangeRequest, field: string) => `demo.projects.${project.id}.changes.${c.id}.${field}`;

  return (
    <div className="pt-scope">
      <h2 className="sr-only">{t('detail.tabs.scope')}</h2>

      <section aria-labelledby="pt-scope-approved">
        <div className="pt-scope-head">
          <h3 id="pt-scope-approved" className="pt-h3">
            {t('detail.scope.approvedTitle')}
          </h3>
          <p className="pt-fine">
            <span className="pt-date">
              {t('detail.scope.approvedMeta', { version: project.scope.version, date: p.date(project.scope.approvedOn) })}
            </span>
          </p>
        </div>
        <ul className="pt-checklist">
          {project.scope.items.map((item) => (
            <li key={item}>
              <Check aria-hidden strokeWidth={1.6} />
              <span>{p.text(project, `scope.${item}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pt-scope-accepted">
        <div className="pt-scope-head">
          <h3 id="pt-scope-accepted" className="pt-h3">
            {t('detail.scope.acceptedTitle')}
          </h3>
          <span className="pt-count">{accepted.length}</span>
        </div>
        {accepted.length ? (
          <ul className="pt-changes">
            {accepted.map((c) => (
              <li key={c.id} className="pt-change">
                <div className="pt-change-top">
                  <p className="pt-change-title">{t(key(c, 'title'))}</p>
                  <span className="pt-tag">
                    <Check aria-hidden strokeWidth={1.8} />
                    {t('detail.changeStatus.accepted')}
                  </span>
                </div>
                <p className="pt-fine">{t(key(c, 'detail'))}</p>
                {t.has(key(c, 'impact')) ? (
                  <dl className="pt-dl">
                    <div>
                      <dt>{t('detail.scope.impact')}</dt>
                      <dd>{t(key(c, 'impact'))}</dd>
                    </div>
                  </dl>
                ) : null}
                {c.decidedOn ? (
                  <p className="pt-meta">
                    {t('detail.scope.acceptedMeta', { date: p.date(c.decidedOn), name: p.name(c.requestedBy) })}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pt-fine">{t('detail.scope.noAccepted')}</p>
        )}
      </section>

      <section aria-labelledby="pt-scope-open">
        <div className="pt-scope-head">
          <h3 id="pt-scope-open" className="pt-h3">
            {t('detail.scope.openTitle')}
          </h3>
          <span className="pt-count">{open.length}</span>
        </div>
        {open.length ? (
          <ul className="pt-changes">
            {open.map((c) => (
              <li key={c.id} className="pt-change" data-open="">
                <div className="pt-change-top">
                  <p className="pt-change-title">{t(key(c, 'title'))}</p>
                  <span className="pt-tag pt-tag-out">{t('detail.scope.notIncluded')}</span>
                </div>
                <p className="pt-fine">{t(key(c, 'detail'))}</p>
                {t.has(key(c, 'impact')) ? <p className="pt-fine">{t(key(c, 'impact'))}</p> : null}
                <ol className="pt-flow" aria-label={t('detail.scope.flowLabel')}>
                  {FLOW.map((step, i) => (
                    <li key={step} aria-current={i === flowIndex(c.status) ? 'step' : undefined}>
                      {step === 'decided'
                        ? `${t('detail.changeStatus.accepted')} / ${t('detail.changeStatus.rejected')}`
                        : t(`detail.changeStatus.${step}`)}
                    </li>
                  ))}
                </ol>
                <p className="pt-meta">
                  {t('detail.scope.openMeta', { date: p.date(c.requestedOn), name: p.name(c.requestedBy) })}
                </p>
                {c.status === 'estimated' ? (
                  <div className="pt-request">
                    <button type="button" disabled className="btn btn-sm pt-btn-off">
                      {t('detail.scope.decide')}
                    </button>
                    <span className="pt-fine pt-backend">
                      <Lock aria-hidden strokeWidth={1.6} />
                      {t('detail.needsBackend')}
                    </span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pt-fine">{t('detail.scope.noOpen')}</p>
        )}
      </section>

      <p className="pt-rule">
        <Info aria-hidden strokeWidth={1.6} />
        <span>{t('detail.scope.rule')}</span>
      </p>
      <div className="pt-request">
        <button type="button" disabled className="btn btn-sm pt-btn-off">
          {t('detail.scope.request')}
        </button>
        <span className="pt-fine pt-backend">
          <Lock aria-hidden strokeWidth={1.6} />
          {t('detail.needsBackend')}
        </span>
      </div>
    </div>
  );
}

/** Document placeholders: title, category, version, date and author — no link, no file. */
export function DocumentsList({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  return (
    <>
      <h2 className="sr-only">{t('detail.docs.title')}</h2>
      <ul className="pt-docs">
        {documentsByDate(project).map((d) => (
          <li key={d.id} className="pt-doc">
            <FileText aria-hidden strokeWidth={1.5} className="pt-doc-icon" />
            <p className="pt-doc-title">{p.text(project, `docs.${d.id}`)}</p>
            <dl className="pt-doc-meta">
              <div>
                <dt>{t('detail.docs.columns.category')}</dt>
                <dd>{t(`detail.docCategory.${d.category}`)}</dd>
              </div>
              <div>
                <dt>{t('detail.docs.columns.version')}</dt>
                <dd className="pt-date">{t('detail.docs.version', { version: d.version })}</dd>
              </div>
              <div>
                <dt>{t('detail.docs.columns.date')}</dt>
                <dd>
                  <time className="pt-date" dateTime={d.date}>
                    {p.date(d.date)}
                  </time>
                </dd>
              </div>
              <div>
                <dt>{t('detail.docs.columns.author')}</dt>
                <dd>{p.name(d.author)}</dd>
              </div>
            </dl>
            <span className="pt-doc-file">{t('detail.docs.noFile')}</span>
          </li>
        ))}
      </ul>
      <p className="pt-fine pt-docs-note">
        <Lock aria-hidden strokeWidth={1.6} />
        {t('detail.docs.note')}
      </p>
    </>
  );
}

/** Every public stage with its definition, exit criterion and owner; the project's is marked. */
export function StagesGuide({ project }: { project: PortalProject }) {
  const { t } = usePortal();
  const item = (stage: StageId, phase: number, n?: number) => {
    const current = project.stage === stage;
    return (
      <li key={stage} className="pt-guide-item" data-current={current ? '' : undefined}>
        <div className="pt-guide-head">
          <PhaseGlyph phase={phase} size={20} />
          {n ? <span className="pt-guide-n">{t('stage.position', { n, total: TOTAL_STAGES })}</span> : null}{' '}
          <h3 className="pt-h3">{t(`stages.${stage}.name`)}</h3>
          <span className="pt-guide-short">{t(`stages.${stage}.short`)}</span>
          {current ? <span className="pt-tag pt-tag-turn">{t('detail.stagesTab.current')}</span> : null}
        </div>
        <dl className="pt-dl">
          <div>
            <dt>{t('detail.stagesTab.definition')}</dt>
            <dd>{t(`stages.${stage}.definition`)}</dd>
          </div>
          <div>
            <dt>{t('detail.stagesTab.exit')}</dt>
            <dd>{t(`stages.${stage}.exit`)}</dd>
          </div>
          <div>
            <dt>{t('detail.stagesTab.owner')}</dt>
            <dd>{t(`stages.${stage}.owner`)}</dd>
          </div>
        </dl>
      </li>
    );
  };
  return (
    <>
      <h2 className="sr-only">{t('detail.stagesTab.title')}</h2>
      <p className="pt-fine">{t('detail.stagesTab.intro')}</p>
      <ol className="pt-guide-list">
        {MAIN_STAGES.map((stage, i) => item(stage, (i + 1) / TOTAL_STAGES, i + 1))}
      </ol>
      <p className="label pt-guide-extra">{t('detail.stagesTab.extra')}</p>
      <ul className="pt-guide-list">
        {EXTRA_STAGES.map((stage) => item(stage, stage === 'paused' ? 0.4 : 1))}
      </ul>
    </>
  );
}
