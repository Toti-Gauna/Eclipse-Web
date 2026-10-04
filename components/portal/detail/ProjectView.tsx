import { PORTAL_COMPANY } from '@/lib/portal/fixtures';
import { portalPaths } from '@/lib/portal/routes';
import type { PortalProject } from '@/lib/portal/types';
import { PageBar } from '../PageBar';
import { usePortal } from '../usePortal';
import { OtherProjects, ProjectFacts } from './Facts';
import { DocumentsList, ScopePanel, StagesGuide, UpdatesLog } from './Panels';
import { PortalTabs } from './PortalTabs';
import { StageTimeline } from './StageTimeline';
import { ClientActionBox, CurrentStage, NextMilestone } from './Summary';

/**
 * /[locale]/portal/proyectos/[id]/ — one project: current stage and what it means, next
 * milestone, the client's action (disabled), the five-stage timeline, then "Seguimiento":
 * updates, scope and changes, documents and the stage guide as tabs, with the project facts
 * beside them. Each block carries a `data-tour` hook for the detail guide (lib/portal/tour).
 */
export function ProjectView({ project }: { project: PortalProject }) {
  const p = usePortal();
  const { t } = p;
  const name = p.text(project, 'name');
  return (
    <div className="container-x pt-page">
      <PageBar
        tour="project"
        items={[
          { label: t('nav.site'), href: '/' },
          { label: t('nav.portal'), href: portalPaths.login },
          { label: t('nav.projects'), href: portalPaths.projects },
          { label: name },
        ]}
      />
      <header className="pt-detail-head">
        <p className="pt-detail-meta">
          <span className="badge-demo">{t('badge')}</span>{' '}
          <span className="pt-detail-code">{project.code}</span>{' '}
          <span>{PORTAL_COMPANY}</span>
        </p>
        <h1 className="display pt-detail-title">{name}</h1>
        <p className="pt-detail-sub">
          <strong>{p.service(project)}</strong> — {p.text(project, 'summary')}
        </p>
      </header>

      <div className="pt-top">
        <CurrentStage project={project} />
        <div className="pt-side" data-tour="pt-next">
          <NextMilestone project={project} />
          <ClientActionBox project={project} />
        </div>
      </div>

      <StageTimeline project={project} />

      <div className="pt-bottom">
        <section className="pt-follow" aria-labelledby="pt-follow-title">
          <div className="pt-follow-head" data-tour="pt-follow">
            <h2 id="pt-follow-title" className="pt-h2">
              {t('detail.follow.title')}
            </h2>
            <p className="pt-fine">{t('detail.follow.intro')}</p>
          </div>
          <PortalTabs
            id={`pt-${project.id}`}
            label={t('detail.tabs.label')}
            tourHook="pt-follow-tabs"
            tabs={[
              { id: 'updates', label: t('detail.tabs.updates'), count: project.updates.length, content: <UpdatesLog project={project} /> },
              { id: 'scope', label: t('detail.tabs.scope'), content: <ScopePanel project={project} /> },
              { id: 'documents', label: t('detail.tabs.documents'), count: project.documents.length, content: <DocumentsList project={project} /> },
              { id: 'stages', label: t('detail.tabs.stages'), content: <StagesGuide project={project} /> },
          ]}
          />
        </section>
        <ProjectFacts project={project} />
      </div>

      <OtherProjects current={project} />
    </div>
  );
}
