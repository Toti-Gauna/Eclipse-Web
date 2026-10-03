'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { BellRing, CircleDollarSign, Clock4, MessageCircle } from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { Card, ChatWidget, Meter, Pill, Switch, type Tone } from '../../kit';
import { ROSTER, SCHOOL, STORY, storyClock } from '../data';
import { act, isOffNow } from '../story';
import { useAcademy } from '../context';
import { AtrioMark, PersonAvatar, ViewHead, useAcademyText } from '../ui';

type Status = 'ok' | 'risk' | 'sent' | 'back' | 'later' | 'dropped' | 'lesson' | 'b1';
const STATUS_TONE: Record<Status, Tone> = { ok: 'neutral', risk: 'warn', sent: 'accent', back: 'ok', later: 'warn', dropped: 'bad', lesson: 'accent', b1: 'accent2' };

/** The roster with the live students' status. */
function useRoster() {
  const { view } = useAcademy();
  return ROSTER.map((r) => {
    let status: Status = r.risk ? 'risk' : 'ok';
    let progress = r.progress;
    let points = r.points;
    let last = r.lastDays;
    if (r.id === 'valentina') {
      status = view.level === 'B1' ? 'b1' : view.t >= STORY.open && (view.completeAt === null || view.t < view.completeAt) ? 'lesson' : 'ok';
      progress = view.level === 'B1' ? 1 : view.progress;
      points = view.points;
    }
    if (r.id === 'martin') {
      const m = view.martin.status;
      status = m === 'back' ? 'back' : m === 'dropped' ? 'dropped' : m === 'later' ? 'later' : m === 'nudged' || m === 'replied' ? 'sent' : 'risk';
      if (m === 'back') {
        last = 0;
        progress = r.progress + 0.02;
        points = r.points + 40;
      }
    }
    return { ...r, status, progress, points, last };
  });
}

function Roster({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.students');
  const { name, course, fmt } = useAcademyText();
  const rows = useRoster();
  return (
    <Card className="atrio-panel atrio-roster" as="section">
      <div className="atrio-panel-head">
        <h3 className="atrio-h3">{t('roster')}</h3>
        <span className="atrio-label demo-mono">{t('rosterCount', { shown: rows.length, total: SCHOOL.active })}</span>
      </div>
      {!compact ? (
        <div className="atrio-roster-head" aria-hidden>
          <span>{t('cols.student')}</span>
          <span>{t('cols.progress')}</span>
          <span>{t('cols.status')}</span>
        </div>
      ) : null}
      <ul className="atrio-roster-list">
        {rows.map((r) => (
          <li key={r.id} className="atrio-roster-row" data-status={r.status} data-compact={compact ? '' : undefined}>
            <span className="atrio-roster-who">
              <PersonAvatar id={r.id} />
              <span className="min-w-0 leading-[1.2]">
                <span className="block truncate text-[0.78em] font-semibold">{name(r.id)}</span>
                <span className="block truncate text-[0.62em] text-[var(--demo-muted)]">
                  {course(r.course as 'en' | 'pt', r.level)} · {r.last === 0 ? t('lastToday') : t('lastDays', { count: r.last })}
                </span>
              </span>
            </span>
            {!compact ? (
              <span className="atrio-roster-progress">
                <Meter value={r.progress} />
                <span className="demo-mono">{fmt.pct(Math.min(1, r.progress))}</span>
              </span>
            ) : null}
            <span className="atrio-roster-status">
              <Pill tone={STATUS_TONE[r.status]}>{t(`status.${r.status}`)}</Pill>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** The nudge automation: rule, switch, what it did this week. */
function NudgeCard() {
  const t = useTranslations('demoAcademy.students.nudge');
  const { state, run, view } = useAcademy();
  const id = useId();
  const on = !isOffNow(state.off);
  return (
    <Card className="atrio-panel atrio-auto" as="section" >
      <div className="atrio-auto-row">
        <span className="atrio-auto-icon" aria-hidden>
          <MessageCircle strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1 leading-[1.25]">
          <span id={`${id}-l`} className="block text-[0.8em] font-semibold">
            {t('title')}
          </span>
          <span id={`${id}-d`} className="block text-[0.64em] text-[var(--demo-muted)]">
            {on ? t('rule') : t('off')}
          </span>
        </span>
        <Switch checked={on} labelledBy={`${id}-l`} describedBy={`${id}-d`} onChange={() => run(act.toggleNudge(), 'toggle')} />
      </div>
      <dl className="atrio-auto-stats">
        <div>
          <dt>{t('sentWeek')}</dt>
          <dd className="demo-mono">{12 + (view.martin.nudged && view.t >= STORY.nudge ? 1 : 0)}</dd>
        </div>
        <div>
          <dt>{t('backWeek')}</dt>
          <dd className="demo-mono">{8 + (view.martin.status === 'back' ? 1 : 0)}</dd>
        </div>
        <div>
          <dt>{t('avg')}</dt>
          <dd className="demo-mono">{t('avgValue')}</dd>
        </div>
      </dl>
    </Card>
  );
}

/** Martín's WhatsApp (his phone): the nudge with a 5-minute lesson. */
function MartinThread({ className = '' }: { className?: string }) {
  const t = useTranslations('demoAcademy.wa');
  const { view, run, business, announce } = useAcademy();
  const { fmt, first } = useAcademyText();
  const wa = view.martin.wa;
  if (!wa) {
    return (
      <div className={`atrio-wa-empty ${className}`} data-dropped={view.martin.status === 'dropped' ? '' : undefined}>
        <Clock4 aria-hidden strokeWidth={1.7} />
        <p>{view.martin.status === 'dropped' ? t('dropped', { name: first('martin') }) : view.martin.nudged ? t('waiting', { name: first('martin') }) : t('noNudge', { name: first('martin') })}</p>
      </div>
    );
  }
  return (
    <ChatWidget
      variant="whatsapp"
      run={wa}
      title={business}
      avatar={<AtrioMark />}
      label={t('label', { name: first('martin') })}
      announce={announce}
      dateLabel={t('date')}
      stamp={(at) => fmt.time(storyClock(STORY.nudge + at))}
      onPick={(step, reply) => run(act.pickWa(wa, step, reply), 'select')}
      composer={false}
      className={`atrio-wa ${className}`}
    />
  );
}

function FeesCard() {
  const t = useTranslations('demoAcademy.students.fees');
  const { view, ticketUsd } = useAcademy();
  const { fmt, name } = useAcademyText();
  const paid = view.events.filter((e) => e.kind === 'paid' || (e.kind === 'enrolled' && e.at >= 0)).reverse();
  return (
    <Card className="atrio-panel atrio-fees" as="section">
      <div className="atrio-auto-row">
        <span className="atrio-auto-icon" aria-hidden>
          <BellRing strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1 leading-[1.25]">
          <span className="block text-[0.8em] font-semibold">{t('title')}</span>
          <span className="block text-[0.64em] text-[var(--demo-muted)]">{t('rule', { count: SCHOOL.remindersSent })}</span>
        </span>
      </div>
      <p className="atrio-fees-total">
        <Money usd={view.kpi.feesPaid * ticketUsd} className="demo-mono atrio-money" />
        <span className="text-[0.62em] text-[var(--demo-muted)]">{t('of', { paid: fmt.num(view.kpi.feesPaid), total: fmt.num(view.kpi.active) })}</span>
      </p>
      <Meter value={view.kpi.feesPaid / view.kpi.active} />
      {paid.length ? (
        <ul className="atrio-fees-list">
          {paid.slice(0, 3).map((e) => (
            <li key={e.id} className={view.t - e.at < 2400 ? 'demo-pop' : ''}>
              <CircleDollarSign aria-hidden strokeWidth={1.8} />
              <span className="min-w-0 flex-1 truncate">{e.kind === 'enrolled' ? t('firstFee', { name: name(e.who) }) : name(e.who)}</span>
              <span className="text-[var(--demo-muted)]">{e.pay ? t(`via.${e.pay}`) : ''}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

export function LaptopStudents() {
  const t = useTranslations('demoAcademy.students');
  const { view } = useAcademy();
  return (
    <div className="atrio-cols-students">
      <div className="flex min-w-0 flex-col gap-[0.8em]">
        <ViewHead index={t('index', { count: view.kpi.active })} title={t('title')} sub={t('sub')} />
        <Roster />
        <FeesCard />
      </div>
      <div className="flex min-w-0 flex-col gap-[0.8em]">
        <NudgeCard />
        <MartinThread className="atrio-wa-laptop" />
      </div>
    </div>
  );
}

export function PhoneStudents() {
  const t = useTranslations('demoAcademy.students');
  const { view } = useAcademy();
  return (
    <div className="atrio-school-phone">
      <ViewHead index={t('index', { count: view.kpi.active })} title={t('title')} />
      <NudgeCard />
      <MartinThread className="atrio-wa-phone" />
      <Roster compact />
      <FeesCard />
    </div>
  );
}
