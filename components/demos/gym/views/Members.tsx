'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';
import { Pill, type Tone } from '../../kit';
import { ACTIVE, HERO, LEAD, MEMBERS, RISK_DAYS, type MemberId } from '../model';
import { useGym, useGymText } from '../hooks';
import { HudHead, MemberAvatar } from '../parts';

type Filter = 'all' | 'risk' | 'streak' | 'new';
type Status = 'risk' | 'back' | 'streak' | 'ok' | 'trial' | 'churned';
const TONE: Record<Status, Tone> = { risk: 'bad', back: 'ok', streak: 'accent', ok: 'neutral', trial: 'info', churned: 'bad' };

interface Row {
  id: MemberId;
  level: number;
  streak: number;
  /** Days since the last visit (−1: hasn't come yet). */
  away: number;
  league: string;
  status: Status;
  fresh: boolean;
}

function useRows(): Row[] {
  const t = useTranslations('demoGym.league');
  const { view } = useGym();
  return MEMBERS.filter((m) => m.id !== LEAD || (view.trial && view.trial.at <= view.t)).map((m) => {
    if (m.id === HERO) {
      const status: Status = view.churnAt !== null ? 'churned' : view.check1At !== null && view.check1At <= view.t ? 'back' : 'risk';
      return { id: m.id, level: view.level, streak: view.streak, away: view.away, league: t('silver'), status, fresh: view.t - (view.check1At ?? -9e9) < 2500 };
    }
    if (m.id === LEAD) {
      const came = view.trialInAt !== null && view.trialInAt <= view.t;
      return { id: m.id, level: 1, streak: came ? 1 : 0, away: came ? 0 : -1, league: '—', status: 'trial', fresh: view.t - (view.trial?.at ?? -9e9) < 2500 };
    }
    const away = m.away + view.day;
    const status: Status = away >= RISK_DAYS ? 'risk' : m.streak >= 7 ? 'streak' : 'ok';
    return { id: m.id, level: m.level, streak: away > 2 ? 0 : m.streak + view.day, away, league: m.league ? t(m.league) : '—', status, fresh: false };
  });
}

const FILTERS: Filter[] = ['all', 'risk', 'streak', 'new'];
const match = (f: Filter, r: Row) => f === 'all' || (f === 'risk' && (r.status === 'risk' || r.status === 'churned')) || (f === 'streak' && r.streak >= 7) || (f === 'new' && r.status === 'trial');

function Filters({ value, onChange, rows }: { value: Filter; onChange: (f: Filter) => void; rows: Row[] }) {
  const t = useTranslations('demoGym.members');
  return (
    <div className="gym-filters" role="group" aria-label={t('filter')}>
      {FILTERS.map((f) => (
        <button key={f} type="button" className="gym-chip" aria-pressed={value === f} onClick={() => onChange(f)}>
          {t(`filters.${f}`)}
          <span className="demo-num">{rows.filter((r) => match(f, r)).length}</span>
        </button>
      ))}
    </div>
  );
}

function useLast() {
  const t = useTranslations('demoGym.members');
  return (away: number) => (away < 0 ? t('never') : away === 0 ? t('today') : t('daysAgo', { count: away }));
}

export function LaptopMembers() {
  const t = useTranslations('demoGym.members');
  const { short } = useGymText();
  const rows = useRows();
  const [filter, setFilter] = useState<Filter>('all');
  const last = useLast();
  const shown = rows.filter((r) => match(filter, r));
  return (
    <div className="gym-view">
      <HudHead index="03" label={t('index')} title={t('title')} sub={t('sub', { count: ACTIVE })} aside={<Filters value={filter} onChange={setFilter} rows={rows} />} />
      <table className="gym-table">
        <caption className="sr-only">{t('caption', { filter: t(`filters.${filter}`) })}</caption>
        <thead>
          <tr>
            <th scope="col">{t('colMember')}</th>
            <th scope="col">{t('colLevel')}</th>
            <th scope="col">{t('colStreak')}</th>
            <th scope="col">{t('colLast')}</th>
            <th scope="col">{t('colLeague')}</th>
            <th scope="col">{t('colStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.id} data-hero={r.id === HERO ? '' : undefined} data-fresh={r.fresh ? '' : undefined}>
              <th scope="row">
                <span className="flex min-w-0 items-center gap-[0.55em]">
                  <MemberAvatar id={r.id} />
                  <span className="truncate">{short(r.id)}</span>
                </span>
              </th>
              <td className="demo-num">{r.level}</td>
              <td>
                <span className="gym-table-streak" data-on={r.streak > 0 ? '' : undefined}>
                  <Flame aria-hidden strokeWidth={2} />
                  <span className="demo-num">{r.streak}</span>
                </span>
              </td>
              <td className="demo-num">{last(r.away)}</td>
              <td>{r.league}</td>
              <td>
                <Pill tone={TONE[r.status]}>{t(`status.${r.status}`)}</Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PhoneMembers() {
  const t = useTranslations('demoGym.members');
  const { short } = useGymText();
  const rows = useRows();
  const [filter, setFilter] = useState<Filter>('all');
  const last = useLast();
  return (
    <div className="gym-view" data-screen="phone">
      <HudHead index="03" label={t('index')} title={t('title')} sub={t('sub', { count: ACTIVE })} />
      <Filters value={filter} onChange={setFilter} rows={rows} />
      <ul className="gym-mlist">
        {rows
          .filter((r) => match(filter, r))
          .map((r) => (
            <li key={r.id} data-hero={r.id === HERO ? '' : undefined} data-fresh={r.fresh ? '' : undefined}>
              <MemberAvatar id={r.id} />
              <span className="min-w-0 flex-1 leading-[1.2]">
                <span className="block truncate font-semibold">{short(r.id)}</span>
                <span className="block truncate text-[0.82em] text-[var(--demo-muted)]">
                  {t('line', { level: r.level, last: last(r.away) })}
                </span>
              </span>
              <Pill tone={TONE[r.status]}>{t(`status.${r.status}`)}</Pill>
            </li>
          ))}
      </ul>
    </div>
  );
}
