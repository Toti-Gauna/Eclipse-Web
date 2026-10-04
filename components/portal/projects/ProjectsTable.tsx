import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PORTAL_PROJECTS } from '@/lib/portal/fixtures';
import { tourHooks } from '@/lib/portal/project';
import { portalPaths } from '@/lib/portal/routes';
import { StageMark } from '../StageMark';
import { usePortal } from '../usePortal';
import { LastUpdate, Milestone, Turn } from './ProjectCells';

const COLUMNS = ['project', 'stage', 'updated', 'milestone', 'action'] as const;

/**
 * Desktop (≥1024px): one row per project. Each row ends with its "Ver proyecto" button —
 * solid ink when the project is waiting on the client, outlined otherwise — and the name
 * opens the detail too. Service sits under the name; the client's action has its own column.
 */
export function ProjectsTable() {
  const p = usePortal();
  const { t } = p;
  return (
    <div className="pt-table-wrap" data-tour="pt-list">
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
            <th scope="col">
              <span className="sr-only">{t('projects.columns.open')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {PORTAL_PROJECTS.map((project) => {
            const href = portalPaths.project(project.id);
            const name = p.text(project, 'name');
            const hooks = tourHooks(project);
            return (
              <tr key={project.id} data-portal-project={project.id} data-turn={project.action ? '' : undefined}>
                <th scope="row">
                  <Link href={href} className="pt-table-name">
                    {name}
                  </Link>
                  <span className="pt-meta">{p.service(project)}</span>
                  <span className="pt-table-code">{project.code}</span>
                </th>
                <td data-tour={hooks.stage}>
                  <StageMark project={project} layout="stack" meaning />
                </td>
                <td>
                  <LastUpdate project={project} p={p} />
                </td>
                <td data-tour={hooks.next}>
                  <Milestone project={project} p={p} />
                </td>
                <td data-tour={hooks.turn}>
                  <Turn project={project} p={p} />
                </td>
                <td>
                  <Link
                    href={href}
                    className={`btn btn-sm pt-open ${project.action ? 'pt-btn-ink' : 'btn-ghost'}`}
                    data-tour={hooks.open}
                    data-portal-open
                  >
                    {t('projects.view')}
                    <span className="sr-only">: {name}</span>
                    <ArrowRight aria-hidden strokeWidth={1.6} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
