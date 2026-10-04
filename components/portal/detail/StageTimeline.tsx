import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { TOTAL_STAGES, timeline, type TimelineStep } from '@/lib/portal/project';
import type { PortalProject } from '@/lib/portal/types';
import { usePortal, type PortalText } from '../usePortal';

function stepDate(step: TimelineStep, project: PortalProject, p: PortalText): string | null {
  if (step.status === 'done' && step.end) return p.date(step.end);
  if (step.status === 'current' && step.start) return p.t('stage.since', { date: p.date(step.start) });
  if (step.status === 'paused' && project.pause) return p.t('stage.since', { date: p.date(project.pause.since) });
  if (step.stage === 'delivery' && project.deliveryEstimate)
    return `${p.t('detail.estimate')} ${p.date(project.deliveryEstimate)}`;
  return null;
}

/** The five public stages: completed / current (or paused) / next, each status written out. */
export function StageTimeline({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  const support = project.history.find((h) => h.stage === 'support');
  const plan = p.maintenance(project);
  return (
    <section className="pt-timeline" aria-labelledby="pt-timeline-title">
      <h2 id="pt-timeline-title" className="pt-h2">
        {t('detail.timeline')}
      </h2>
      <ol className="pt-rail">
        {timeline(project).map((step) => {
          const date = stepDate(step, project, p);
          return (
            <li
              key={step.stage}
              className="pt-rail-step"
              data-status={step.status}
              aria-current={step.status === 'current' || step.status === 'paused' ? 'step' : undefined}
            >
              <PhaseGlyph phase={step.n / TOTAL_STAGES} size={28} className="pt-rail-mark" />
              <span className="pt-rail-n">{t('stage.position', { n: step.n, total: TOTAL_STAGES })}</span>
              <span className="pt-rail-name">{p.stage(step.stage)}</span>
              <span className="pt-rail-status">
                <strong>{t(`stage.status.${step.status}`)}</strong>
                {date ? (
                  <>
                    {' · '}
                    <span className="pt-date">{date}</span>
                  </>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
      {support ? (
        <p className="pt-rail-extra">
          <PhaseGlyph phase={1} size={20} />
          <strong>{plan ? t('detail.supportWith', { plan: plan.name }) : p.stage('support')}</strong>
          <span className="pt-fine">
            {t('stage.status.current')} · <span className="pt-date">{t('stage.since', { date: p.date(support.start) })}</span>
          </span>
        </p>
      ) : null}
      <p className="pt-fine">{t('detail.timelineNote')}</p>
    </section>
  );
}
