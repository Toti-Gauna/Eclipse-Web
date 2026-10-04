import { PEOPLE, PORTAL_COMPANY, PORTAL_PROJECTS, PORTAL_VIEWER } from '@/lib/portal/fixtures';
import { portalPaths } from '@/lib/portal/routes';
import { InfoTip } from '../InfoTip';
import { PageBar } from '../PageBar';
import { usePortal } from '../usePortal';
import { EmptyProjects } from './EmptyProjects';
import { Overview } from './Overview';
import { ProjectCards } from './ProjectCards';
import { ProjectsBoard } from './ProjectsBoard';
import { ProjectsSkeleton } from './ProjectsSkeleton';
import { ProjectsTable } from './ProjectsTable';

/** /[locale]/portal/proyectos/ — "Mis proyectos" for the fictional demo client. */
export function ProjectsView() {
  const p = usePortal();
  const { t } = p;
  const firstName = PEOPLE[PORTAL_VIEWER].name.split(' ')[0];

  return (
    <div className="container-x pt-page">
      <PageBar
        tour="projects"
        items={[
          { label: t('nav.site'), href: '/' },
          { label: t('nav.portal'), href: portalPaths.login },
          { label: t('nav.projects') },
        ]}
      />
      <header className="pt-dash-head">
        <p className="pt-kicker">
          <span className="badge-demo">{t('badge')}</span>{' '}
          <span className="label">{t('projects.label')}</span>
        </p>
        <h1 className="display pt-hello">{t('projects.hello', { name: firstName })}</h1>
        <p className="pt-company">{t('projects.company', { company: PORTAL_COMPANY, count: PORTAL_PROJECTS.length })}</p>
      </header>

      <ProjectsBoard
        copy={{
          label: t('projects.states.label'),
          hint: t('projects.states.hint'),
          full: t('projects.states.full'),
          empty: t('projects.states.empty'),
          loading: t('projects.states.loading'),
        }}
        full={
          <>
            <Overview />
            <section className="pt-list" aria-labelledby="pt-list-title">
              <div className="pt-list-head" data-tour="pt-list-head">
                <h2 id="pt-list-title" className="pt-h2">
                  {t('projects.listTitle')}
                </h2>
                <span className="pt-count">{PORTAL_PROJECTS.length}</span>
              </div>
              <div className="pt-legend">
                <p className="label pt-legend-label">{t('info.legend')}</p>
                <InfoTip copy={p.info('stages', true)} />
                <InfoTip copy={p.info('estimate', true)} />
                <InfoTip copy={p.info('action', true)} />
              </div>
              <ProjectsTable />
              <ProjectCards />
            </section>
          </>
        }
        empty={<EmptyProjects />}
        loading={<ProjectsSkeleton />}
      />
    </div>
  );
}
