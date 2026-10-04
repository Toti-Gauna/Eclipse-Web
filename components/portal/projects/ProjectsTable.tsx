import { Link } from '@/i18n/navigation';
import { PORTAL_PROJECTS } from '@/lib/portal/fixtures';
import { latestUpdate } from '@/lib/portal/project';
import { portalPaths } from '@/lib/portal/routes';
import { StageMark } from '../StageMark';
import { usePortal } from '../usePortal';

const COLUMNS = ['project', 'service', 'stage', 'updated', 'milestone', 'action'] as const;

/** Desktop (≥1024px): one row per project; the name and the action open the detail. */
export function ProjectsTable() {
  const p = usePortal();
  const { t } = p;
  return (
    <div className="pt-table-wrap">
      {/* Explicit role: a stable hook for the e2e checks (same semantics as <table>). */}
      <table role="table" className="pt-table" data-portal-projects-table>
        <caption className="sr-only">{t('projects.tableCaption')}</caption>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c} scope="col">
                {t(`projects.columns.${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PORTAL_PROJECTS.map((project) => {
            const href = portalPaths.project(project.id);
            const name = p.text(project, 'name');
            const last = latestUpdate(project);
            return (
              <tr key={project.id} data-portal-project={project.id}>
                <th scope="row">
                  <Link href={href} className="pt-table-name">
                    {name}
                  </Link>
                  <span className="pt-table-code">{project.code}</span>
                </th>
                <td>{p.service(project)}</td>
                <td>
                  <StageMark project={project} layout="stack" />
                </td>
                <td>
                  {last ? (
                    <time className="pt-date" dateTime={last.date}>
                      {p.date(last.date)}
                    </time>
                  ) : null}
                </td>
                <td>
                  {p.text(project, 'milestone')}
                  <span className="pt-meta">
                    {t.rich('projects.milestoneMeta', {
                      owner: p.person(project.nextMilestone.owner),
                      date: p.date(project.nextMilestone.due),
                      d: (chunks) => <span className="pt-date">{chunks}</span>,
                    })}
                  </span>
                </td>
                <td>
                  <div className="pt-table-action">
                    {project.action ? <span className="pt-tag pt-tag-attn">{t('projects.actionNeeded')}</span> : null}
                    <Link href={href} className="btn btn-ghost btn-sm">
                      {project.action ? t('projects.review') : t('projects.view')}
                      <span className="sr-only">: {name}</span>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
