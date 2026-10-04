import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PORTAL_PROJECTS } from '@/lib/portal/fixtures';
import { latestUpdate } from '@/lib/portal/project';
import { portalPaths } from '@/lib/portal/routes';
import { StageMark } from '../StageMark';
import { usePortal } from '../usePortal';

/** Phones and tablets (<1024px): the same columns as the table, one card per project. */
export function ProjectCards() {
  const p = usePortal();
  const { t } = p;
  return (
    <ul className="pt-cards" data-portal-projects-cards>
      {PORTAL_PROJECTS.map((project) => {
        const last = latestUpdate(project);
        const titleId = `pt-card-${project.id}`;
        return (
          <li key={project.id}>
            <article
              className="pt-card"
              data-portal-project={project.id}
              data-turn={project.action ? '' : undefined}
              aria-labelledby={titleId}
            >
              <div className="pt-card-top">
                <span className="pt-code">{project.code}</span>
                {project.action ? <span className="pt-tag pt-tag-attn">{t('projects.actionNeeded')}</span> : null}
              </div>
              <h3 id={titleId} className="pt-card-title">
                <Link href={portalPaths.project(project.id)} className="pt-stretched">
                  {p.text(project, 'name')}
                </Link>
              </h3>
              <p className="pt-card-service">{p.service(project)}</p>
              <dl className="pt-dl">
                <div>
                  <dt>{t('projects.columns.stage')}</dt>
                  <dd>
                    <StageMark project={project} layout="stack" />
                  </dd>
                </div>
                <div>
                  <dt>{t('projects.columns.updated')}</dt>
                  <dd>
                    {last ? (
                      <time className="pt-date" dateTime={last.date}>
                        {p.date(last.date)}
                      </time>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt>{t('projects.columns.milestone')}</dt>
                  <dd>
                    {p.text(project, 'milestone')}
                    <span className="pt-meta">
                      {t.rich('projects.milestoneMeta', {
                        owner: p.person(project.nextMilestone.owner),
                        date: p.date(project.nextMilestone.due),
                        d: (chunks) => <span className="pt-date">{chunks}</span>,
                      })}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className="pt-card-foot">
                <span aria-hidden className="pt-card-go">
                  {project.action ? t('projects.review') : t('projects.view')}
                  <ArrowRight strokeWidth={1.5} />
                </span>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
