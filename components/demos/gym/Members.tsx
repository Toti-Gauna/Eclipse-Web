'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flame, Smartphone } from 'lucide-react';
import { MEMBERS, ME, MISSIONS, QUEUED_AT_MIN, RISK_DAYS } from './data';
import { isFresh, type MemberView } from './sim';
import { useFmt, useGym } from './context';
import { Avatar, Card, ViewTitle } from './ui';
import { RiskStatus } from './Retention';

type Filter = 'all' | 'risk' | 'streak' | 'back';
const FILTERS: Filter[] = ['all', 'risk', 'streak', 'back'];
/** A streak this long counts as "on a streak". */
const STREAK_DAYS = 7;

const matches = (m: MemberView, f: Filter) =>
  f === 'all' ||
  (f === 'risk' && !!m.risk && m.risk.state !== 'back') ||
  (f === 'back' && m.risk?.state === 'back') ||
  (f === 'streak' && m.streak >= STREAK_DAYS);

/** At risk first (longest away first), then those who came back, then by streak. */
function sortKey(m: MemberView): number {
  if (m.risk && m.risk.state !== 'back') return 0 - m.risk.days;
  if (m.risk?.state === 'back') return 1000;
  return 2000 - m.streak;
}

function StatusChip({ member }: { member: MemberView }) {
  const t = useTranslations('demoGym.membersView.status');
  if (member.risk && member.risk.state !== 'back') {
    return (
      <span className="inline-flex shrink-0 items-center gap-[0.3em] whitespace-nowrap rounded-full bg-[var(--gym-bad-bg)] px-[0.55em] py-[0.2em] text-[0.64em] font-semibold text-[var(--gym-bad)]">
        <span aria-hidden className="size-[0.55em] rounded-full bg-current" />
        {member.risk.high ? t('high') : t('medium')}
      </span>
    );
  }
  if (member.risk?.state === 'back') {
    return <span className="gym-pop shrink-0 whitespace-nowrap rounded-full bg-[var(--gym-ok-bg)] px-[0.55em] py-[0.2em] text-[0.64em] font-semibold text-[var(--gym-ok)]">{t('back')}</span>;
  }
  if (member.streak >= STREAK_DAYS) {
    return (
      <span className="inline-flex shrink-0 items-center gap-[0.25em] whitespace-nowrap rounded-full bg-[var(--gym-flame-bg)] px-[0.55em] py-[0.2em] text-[0.64em] font-semibold text-[var(--gym-flame-ink)]">
        <Flame aria-hidden className="size-[1.05em]" strokeWidth={2.2} />
        {t('streak')}
      </span>
    );
  }
  return <span className="shrink-0 whitespace-nowrap rounded-full bg-[var(--gym-neutral-bg)] px-[0.55em] py-[0.2em] text-[0.64em] font-semibold text-[var(--demo-muted)]">{t('active')}</span>;
}

export function LaptopMembers() {
  const t = useTranslations('demoGym');
  const fmt = useFmt();
  const { world, state, paired } = useGym();
  const [filter, setFilter] = useState<Filter>('all');
  const all = MEMBERS.map((m) => world.members[m.id]);
  const rows = all.filter((m) => matches(m, filter)).sort((a, b) => sortKey(a) - sortKey(b));
  const lastVisit = (m: MemberView) =>
    m.lastVisit === 0 ? t('membersView.today') : m.lastVisit === 1 ? t('membersView.yesterday') : t('membersView.daysAgo', { count: m.lastVisit });
  // What the comeback automation did for a flagged member (the visit itself is in its own column).
  const note = (m: MemberView) =>
    m.risk ? t(`membersView.note.${m.risk.state}`, { time: fmt.time(QUEUED_AT_MIN) }) : '';

  return (
    <div className="flex flex-col gap-[0.9em]">
      <div className="mr-[var(--gym-safe-top,0em)]">
        <ViewTitle size="laptop" title={t('membersView.title')} subtitle={t('membersView.subtitle', { count: world.kpis.active })} />
      </div>
      <div className="mr-[var(--gym-safe,0em)] flex flex-col gap-[0.7em]">
        <div role="group" aria-label={t('membersView.filter')} className="flex flex-wrap gap-[0.35em]">
          {FILTERS.map((f) => {
            const on = f === filter;
            const count = all.filter((m) => matches(m, f)).length;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f)}
                className={`inline-flex items-center gap-[0.45em] rounded-full border px-[0.75em] py-[0.38em] text-[0.72em] font-medium transition-colors ${
                  on ? 'border-[var(--demo-ink)] bg-[var(--demo-ink)] text-white' : 'border-[var(--demo-line)] bg-white text-[var(--demo-muted)] hover:text-[var(--demo-ink)]'
                }`}
              >
                {t(`membersView.filters.${f}`)}
                <span className={`tabular rounded-full px-[0.4em] text-[0.9em] ${on ? 'bg-white/20' : 'bg-black/[0.05]'}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <Card className="overflow-hidden" as="section">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">{t('membersView.caption', { filter: t(`membersView.filters.${filter}`) })}</caption>
            <colgroup>
              <col />
              <col style={{ width: '5.6em' }} />
              <col style={{ width: '6.2em' }} />
              <col style={{ width: '4.8em' }} />
              <col style={{ width: '12.6em' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--demo-line)] text-[0.6em] font-semibold uppercase tracking-[0.08em] text-[var(--demo-muted)]">
                <th scope="col" className="px-[1.2em] py-[0.9em] font-semibold">
                  {t('membersView.colMember')}
                </th>
                <th scope="col" className="py-[0.9em] font-semibold">
                  {t('membersView.colStreak')}
                </th>
                <th scope="col" className="py-[0.9em] font-semibold">
                  {t('membersView.colLast')}
                </th>
                <th scope="col" className="py-[0.9em] font-semibold">
                  {t('membersView.colMissions')}
                </th>
                <th scope="col" className="py-[0.9em] pr-[1.2em] font-semibold">
                  {t('membersView.colStatus')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const fresh = isFresh({ at: m.changedAt }, state.tick);
                const me = m.id === ME;
                return (
                  <tr key={m.id} className={`border-b border-[var(--demo-line)] last:border-0 ${fresh ? 'bg-[var(--demo-accent-soft)]/50' : ''} ${me ? 'bg-[var(--demo-accent-soft)]/40' : ''}`}>
                    <th scope="row" className="px-[0.7em] py-[0.42em] font-normal">
                      <span className="flex items-center gap-[0.55em]">
                        <Avatar id={m.id} />
                        <span className="min-w-0 leading-[1.2]">
                          <span className="block truncate text-[0.78em] font-semibold">
                            {t(`members.${m.id}`)}
                            {me ? <span className="sr-only"> ({t('you.tag')})</span> : null}
                          </span>
                          {me && paired ? (
                            <span className="flex items-center gap-[0.25em] text-[0.62em] font-semibold text-[var(--gym-accent-ink)]">
                              <Smartphone aria-hidden className="size-[1.1em] shrink-0" strokeWidth={2} />
                              <span className="truncate">{t('activity.onPhone')}</span>
                            </span>
                          ) : m.risk ? (
                            <span className={`block truncate text-[0.62em] ${m.risk.state === 'back' ? 'text-[var(--gym-ok)]' : 'text-[var(--demo-muted)]'}`}>{note(m)}</span>
                          ) : null}
                        </span>
                      </span>
                    </th>
                    <td className="py-[0.42em] text-[0.72em]">
                      {m.streak > 0 ? (
                        <span className="inline-flex items-center gap-[0.25em] whitespace-nowrap">
                          <Flame aria-hidden className="size-[1.05em] shrink-0 text-[var(--gym-flame)]" strokeWidth={2} />
                          <span key={m.streak} className={fresh ? 'gym-count-in' : ''}>
                            {t('ranking.streak', { count: m.streak })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[var(--demo-muted)]">{t('ranking.noStreak')}</span>
                      )}
                    </td>
                    <td className={`whitespace-nowrap py-[0.42em] text-[0.72em] ${m.lastVisit >= RISK_DAYS ? 'font-semibold text-[var(--gym-bad)]' : ''}`}>{lastVisit(m)}</td>
                    <td className="py-[0.42em]">
                      <span className="flex items-center gap-[0.2em]" aria-hidden>
                        {MISSIONS.map((x, i) => (
                          <span key={x.id} className={`h-[0.45em] w-[0.9em] rounded-full ${i < m.missions ? 'bg-[var(--demo-accent)]' : 'bg-black/[0.08]'}`} />
                        ))}
                      </span>
                      <span className="sr-only">{t('membersView.missionsOf', { done: fmt.num(m.missions), total: MISSIONS.length })}</span>
                    </td>
                    <td className="py-[0.42em] pr-[0.7em]">
                      <span className="flex items-center gap-[0.3em]">
                        <StatusChip member={m} />
                        {m.risk && (m.risk.state === 'queued' || m.risk.state === 'sentNow') ? <RiskStatus member={m} /> : null}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length ? null : <p className="px-[1.2em] py-[1em] text-[0.74em] text-[var(--demo-muted)]">{t('membersView.empty')}</p>}
        </Card>
      </div>
    </div>
  );
}
