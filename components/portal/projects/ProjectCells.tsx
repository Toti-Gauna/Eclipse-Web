import { Check } from 'lucide-react';
import { bucketOf, latestUpdate } from '@/lib/portal/project';
import type { PortalProject } from '@/lib/portal/types';
import type { PortalText } from '../usePortal';

/**
 * The readouts every project shows in the list, shared by the table (desktop) and the cards
 * (phones/tablets) so both say exactly the same thing. Everything is written out: a state is
 * never told by color alone.
 */

/** Date of the newest update + what it was. */
export function LastUpdate({ project, p }: { project: PortalProject; p: PortalText }) {
  const last = latestUpdate(project);
  if (!last) return null;
  return (
    <>
      <time className="pt-date" dateTime={last.date}>
        {p.date(last.date)}
      </time>
      <span className="pt-meta">{p.text(project, `updates.${last.id}.title`)}</span>
    </>
  );
}

/** Next milestone + "who · fecha estimada <date>". */
export function Milestone({ project, p }: { project: PortalProject; p: PortalText }) {
  return (
    <>
      {p.text(project, 'milestone')}
      <span className="pt-meta">
        {p.t.rich('projects.milestoneMeta', {
          owner: p.person(project.nextMilestone.owner),
          date: p.date(project.nextMilestone.due),
          d: (chunks) => <span className="pt-date">{chunks}</span>,
        })}
      </span>
    </>
  );
}

/** "Requiere tu acción" + what to do, or "Nada pendiente de tu lado" + who's working on it. */
export function Turn({ project, p }: { project: PortalProject; p: PortalText }) {
  const { t } = p;
  if (project.action) {
    return (
      <span className="pt-turn" data-turn="">
        <span className="pt-tag pt-tag-attn">{t('projects.actionNeeded')}</span>
        <span className="pt-turn-what">{p.text(project, 'action.title')}</span>
      </span>
    );
  }
  const bucket = bucketOf(project);
  return (
    <span className="pt-turn">
      <span className="pt-turn-none">
        <Check aria-hidden strokeWidth={1.6} />
        {t('projects.nothingPending')}
      </span>
      {bucket === 'active' || bucket === 'support' ? <span className="pt-meta">{t(`projects.whoWorks.${bucket}`)}</span> : null}
    </span>
  );
}
