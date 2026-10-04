import { Link } from '@/i18n/navigation';
import { personById, summarize, type ProjectBucket } from '@/lib/portal/project';
import { portalPaths } from '@/lib/portal/routes';
import { usePortal } from '../usePortal';

const BUCKETS: ProjectBucket[] = ['active', 'support', 'paused', 'closed'];

/** Overall state, last update and next step — one ledger line, each value actionable. */
export function Overview() {
  const p = usePortal();
  const { t } = p;
  const s = summarize();
  const buckets = BUCKETS.filter((b) => s.buckets[b] > 0).map((b) => t(`projects.buckets.${b}`, { count: s.buckets[b] }));
  const next = s.next;
  const nextIsClients = next ? personById(next.nextMilestone.owner)?.side === 'client' : false;

  return (
    <section aria-labelledby="pt-overview-title">
      <h2 id="pt-overview-title" className="sr-only">
        {t('projects.summaryTitle')}
      </h2>
      <dl className="pt-overview">
        <div>
          <dt>{t('projects.overall')}</dt>
          <dd>
            <span className="pt-overview-strong">{t('projects.waiting', { count: s.waiting.length })}</span>
            <span className="pt-fine">{buckets.join(' · ')}</span>
          </dd>
        </div>
        {s.last ? (
          <div>
            <dt>{t('projects.lastUpdate')}</dt>
            <dd>
              <time className="pt-date" dateTime={s.last.update.date}>
                {p.date(s.last.update.date)}
              </time>
              <span>
                <Link href={portalPaths.project(s.last.project.id)}>{p.text(s.last.project, 'name')}</Link>
                {': '}
                {p.text(s.last.project, `updates.${s.last.update.id}.title`)}
              </span>
            </dd>
          </div>
        ) : null}
        {next ? (
          <div>
            <dt>{t('projects.nextStep')}</dt>
            <dd>
              {nextIsClients ? <span className="pt-tag pt-tag-turn">{t('projects.yourTurn')}</span> : null}
              <span>
                <Link href={portalPaths.project(next.id)}>{p.text(next, 'milestone')}</Link>
              </span>
              <span className="pt-fine">
                {p.text(next, 'name')} ·{' '}
                {t.rich('projects.milestoneMeta', {
                  owner: p.person(next.nextMilestone.owner),
                  date: p.date(next.nextMilestone.due),
                  d: (chunks) => <span className="pt-date">{chunks}</span>,
                })}
              </span>
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
