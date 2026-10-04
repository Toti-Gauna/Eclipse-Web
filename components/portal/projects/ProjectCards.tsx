import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PORTAL_PROJECTS } from '@/lib/portal/fixtures';
import { tourHooks } from '@/lib/portal/project';
import { portalPaths } from '@/lib/portal/routes';
import { StageMark } from '../StageMark';
import { usePortal } from '../usePortal';
import { LastUpdate, Milestone, Turn } from './ProjectCells';

/**
 * Phones and tablets (<1024px): the table's readouts, one card per project, in reading order —
 * stage, your action, next milestone, last update — closed by a visible "Ver proyecto" button.
 * That button is the card's one link and stretches over the whole card (tap anywhere).
 */
export function ProjectCards() {
  const p = usePortal();
  const { t } = p;
  return (
    <ul className="pt-cards" data-portal-projects-cards>
      {PORTAL_PROJECTS.map((project) => {
        const titleId = `pt-card-${project.id}`;
        const name = p.text(project, 'name');
        const hooks = tourHooks(project);
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
                {name}
              </h3>
              <p className="pt-card-service">{p.service(project)}</p>
              <dl className="pt-dl">
                <div data-tour={hooks.stage}>
                  <dt>{t('projects.columns.stage')}</dt>
                  <dd>
                    <StageMark project={project} layout="stack" meaning />
                  </dd>
                </div>
                {project.action ? (
                  <div data-tour={hooks.turn}>
                    <dt>{t('projects.columns.action')}</dt>
                    <dd className="pt-card-turn">{p.text(project, 'action.title')}</dd>
                  </div>
                ) : (
                  <div>
                    <dt>{t('projects.columns.action')}</dt>
                    <dd>
                      <Turn project={project} p={p} />
                    </dd>
                  </div>
                )}
                <div data-tour={hooks.next}>
                  <dt>{t('projects.columns.milestone')}</dt>
                  <dd>
                    <Milestone project={project} p={p} />
                  </dd>
                </div>
                <div>
                  <dt>{t('projects.columns.updated')}</dt>
                  <dd>
                    <LastUpdate project={project} p={p} />
                  </dd>
                </div>
              </dl>
              <div className="pt-card-foot">
                <Link
                  href={portalPaths.project(project.id)}
                  className={`btn btn-sm pt-open pt-stretched ${project.action ? 'pt-btn-ink' : 'btn-ghost'}`}
                  data-tour={hooks.open}
                  data-portal-open
                >
                  {t('projects.view')}
                  <span className="sr-only">: {name}</span>
                  <ArrowRight aria-hidden strokeWidth={1.6} />
                </Link>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
