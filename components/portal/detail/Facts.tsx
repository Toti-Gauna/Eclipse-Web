import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PORTAL_PROJECTS } from '@/lib/portal/fixtures';
import { portalPaths } from '@/lib/portal/routes';
import type { PortalProject } from '@/lib/portal/types';
import { StageMark } from '../StageMark';
import { usePortal } from '../usePortal';

/** Project facts: code, service, start (seña), Eclipse lead, delivery, maintenance, agreed channel. */
export function ProjectFacts({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  const delivered = project.history.find((h) => h.stage === 'delivery' && h.end)?.end;
  const plan = p.maintenance(project);
  return (
    <aside className="pt-facts" aria-labelledby="pt-facts-title">
      <h2 id="pt-facts-title" className="label">
        {t('detail.facts.title')}
      </h2>
      <dl className="pt-dl">
        <div>
          <dt>{t('detail.facts.code')}</dt>
          <dd className="pt-date">{project.code}</dd>
        </div>
        <div>
          <dt>{t('detail.facts.service')}</dt>
          <dd>{p.service(project)}</dd>
        </div>
        <div>
          <dt>{t('detail.facts.start')}</dt>
          <dd>
            <time className="pt-date" dateTime={project.startedOn}>
              {p.date(project.startedOn)}
            </time>{' '}
            · {t('detail.facts.startNote')}
          </dd>
        </div>
        <div>
          <dt>{t('detail.facts.lead')}</dt>
          <dd>{p.byline(project.lead)}</dd>
        </div>
        <div>
          <dt>{delivered ? p.stage('delivery') : t('detail.facts.delivery')}</dt>
          <dd>
            {delivered ? (
              <span className="pt-date">{t('detail.facts.delivered', { date: p.date(delivered) })}</span>
            ) : project.deliveryEstimate ? (
              <>
                <time className="pt-date" dateTime={project.deliveryEstimate}>
                  {p.date(project.deliveryEstimate)}
                </time>
                <span className="pt-meta">{t('detail.estimateNote')}</span>
              </>
            ) : project.stage === 'paused' ? (
              t('detail.facts.deliveryPaused')
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt>{t('detail.facts.maintenance')}</dt>
          <dd>
            {plan ? (
              <>
                {plan.name}
                <ul>
                  {plan.includes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            ) : (
              t('detail.facts.noMaintenance')
            )}
          </dd>
        </div>
        <div>
          <dt>{t('detail.facts.channel')}</dt>
          <dd>{t('detail.facts.channelValue')}</dd>
        </div>
      </dl>
      <Link href={portalPaths.projects} className="pt-link">
        <ArrowLeft aria-hidden strokeWidth={1.5} />
        {t('nav.backToProjects')}
      </Link>
    </aside>
  );
}

/** The client's other projects, to move between them without going back. */
export function OtherProjects({ current }: { current: PortalProject }) {
  const p = usePortal();
  const others = PORTAL_PROJECTS.filter((x) => x.id !== current.id);
  if (!others.length) return null;
  return (
    <nav className="pt-others" aria-labelledby="pt-others-title">
      <h2 id="pt-others-title" className="label">
        {p.t('detail.others')}
      </h2>
      <ul>
        {others.map((project) => (
          <li key={project.id}>
            <Link href={portalPaths.project(project.id)}>
              <span className="pt-others-name">{p.text(project, 'name')}</span>
              <StageMark project={project} size={14} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
