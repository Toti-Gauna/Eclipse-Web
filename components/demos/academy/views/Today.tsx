'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { ActivityFeed, Card, Meter, Readout } from '../../kit';
import { RETENTION_BEFORE, RETENTION_WEEKS, SCHOOL, STORY } from '../data';
import type { AcademyEvent } from '../story';
import { useAcademy } from '../context';
import { ChalkCircle, ChalkTick, PersonAvatar, useAcademyText, useEventTime, useFeedItems } from '../ui';

/* ------------------------------------------------------------------ */
/* The key number: completion of the cohort                             */
/* ------------------------------------------------------------------ */
export function CompletionCard({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const t = useTranslations('demoAcademy.today');
  const { view } = useAcademy();
  const { fmt, first } = useAcademyText();
  const pct = Math.round(view.kpi.completion * 100);
  const fell = view.kpi.onTrack < SCHOOL.onTrack;
  const before = RETENTION_BEFORE[RETENTION_BEFORE.length - 1] / SCHOOL.cohort;
  const weeks = RETENTION_WEEKS.map((v, i) => (i === RETENTION_WEEKS.length - 1 ? view.kpi.onTrack : v));
  const body = (
    <>
      <span className="atrio-label atrio-key-label">{t('completion')}</span>
      <span className="atrio-key-value">
        <span className="relative inline-block">
          <Readout value={pct} rollDown className="demo-mono" />
          <ChalkCircle key={fell ? 'fell' : 'held'} tone={fell ? 'chalk' : 'salmon'} className="atrio-key-circle" />
        </span>
        <span className="atrio-key-pct demo-mono">%</span>
      </span>
      <span className="atrio-key-sub">
        {t.rich('completionSub', { n: view.kpi.onTrack, total: SCHOOL.cohort, b: (c) => <b className="demo-mono font-semibold text-[var(--demo-ink)]">{c}</b> })}
      </span>
      {!compact ? (
        <span className="atrio-key-chart" aria-hidden>
          {weeks.map((v, i) => (
            <span key={i} className="atrio-key-col" style={{ '--i': i } as CSSProperties}>
              <span className="atrio-key-before" style={{ transform: `scaleY(${RETENTION_BEFORE[i] / SCHOOL.cohort})` }} />
              <span className="atrio-key-now" data-week3={i === 2 ? '' : undefined} style={{ transform: `scaleY(${v / SCHOOL.cohort})` }} />
            </span>
          ))}
        </span>
      ) : null}
      <span className="atrio-key-foot" data-compact={compact && !fell ? '' : undefined}>
        {fell ? (
          <span className="atrio-key-alert">{t('completionFell', { name: first('martin') })}</span>
        ) : (
          <>
            <span className="atrio-key-legend" data-k="now" />
            {t('withNudges')}
            <span className="atrio-key-legend" data-k="before" />
            {t('before', { pct: fmt.pct(before) })}
          </>
        )}
      </span>
      {onOpen ? (
        <span className="atrio-key-open" aria-hidden>
          <ArrowUpRight strokeWidth={2} />
        </span>
      ) : null}
    </>
  );
  return onOpen ? (
    <button type="button" className="atrio-key" data-compact={compact ? '' : undefined} data-fell={fell ? '' : undefined} onClick={onOpen}>
      {body}
    </button>
  ) : (
    <div className="atrio-key" data-compact={compact ? '' : undefined} data-fell={fell ? '' : undefined}>
      {body}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Now in Atrio": three live stories as lanes of steps                 */
/* ------------------------------------------------------------------ */
interface LaneStep {
  label: string;
  at: number | null;
  /** Skipped (e.g. the nudge when the automation is off). */
  off?: boolean;
  tone?: 'bad';
}
interface Lane {
  id: string;
  who: 'valentina' | 'julieta' | 'martin' | 'you';
  context: string;
  steps: LaneStep[];
  outcome: { label: string; tone: 'accent2' | 'ok' | 'bad' | 'warn' } | null;
}

function useLanes(): Lane[] {
  const t = useTranslations('demoAcademy.lanes');
  const { view } = useAcademy();
  const { t: root } = useAcademyText();
  const find = (kind: AcademyEvent['kind'], who?: string) => view.events.find((e) => e.kind === kind && (who === undefined || e.who === who))?.at ?? null;

  const quizAt = view.answerAt;
  const leveled = find('levelUp');
  const review = find('review');
  const valentina: Lane = {
    id: 'valentina',
    who: 'valentina',
    context: t('valentina.context'),
    steps: [
      { label: t('valentina.s1'), at: find('lesson') },
      { label: find('speaking') !== null ? t('valentina.s2', { score: view.events.find((e) => e.kind === 'speaking')?.score ?? 0 }) : t('valentina.s2pending'), at: find('speaking') },
      { label: view.answer === 'wrong' ? t('valentina.s3wrong') : t('valentina.s3'), at: quizAt },
      { label: t('valentina.s4'), at: find('complete') },
    ],
    outcome: leveled !== null && view.t >= leveled ? { label: t('valentina.outB1'), tone: 'accent2' } : review !== null && view.t >= review ? { label: t('valentina.outReview'), tone: 'warn' } : null,
  };

  const mine = view.siteMine !== null;
  const site = view.siteMine ?? view.lead;
  const level = mine ? view.mineLevel : view.leadLevel;
  const siteAt = (rel: number | undefined) => (rel === undefined ? null : (mine ? (view.siteMineStart ?? 0) : STORY.lead) + rel);
  const enrolled = mine ? view.mineEnrollment : view.enrollments.find((e) => e.who === 'julieta');
  const lead: Lane = {
    id: 'lead',
    who: mine ? 'you' : 'julieta',
    context: t('lead.context'),
    steps: [
      { label: t('lead.s1'), at: siteAt(site.at.hi) },
      { label: level ? t('lead.s2', { level }) : t('lead.s2pending'), at: siteAt(site.at.result) },
      { label: t('lead.s3'), at: siteAt(site.at.pay) },
      { label: enrolled?.pay ? t('lead.s4', { pay: root(`pay.${enrolled.pay}`) }) : t('lead.s4pending'), at: enrolled?.at ?? null },
    ],
    outcome: enrolled ? { label: mine ? t('lead.outYou') : t('lead.out'), tone: 'ok' } : null,
  };

  const m = view.martin;
  const martin: Lane = {
    id: 'martin',
    who: 'martin',
    context: t('martin.context'),
    steps: [
      { label: t('martin.s1'), at: find('flagged') },
      m.nudged ? { label: t('martin.s2'), at: find('nudge') } : { label: t('martin.s2off'), at: find('flagged'), off: true },
      m.nudged ? { label: m.status === 'later' ? t('martin.s3later') : t('martin.s3'), at: find('replied') ?? find('later') } : { label: t('martin.s3off'), at: null, off: true },
      m.nudged ? { label: t('martin.s4'), at: find('back') } : { label: t('martin.s4off'), at: find('dropped'), tone: 'bad' },
    ],
    outcome: m.status === 'back' ? { label: t('martin.outBack'), tone: 'ok' } : m.status === 'dropped' ? { label: t('martin.outDropped'), tone: 'bad' } : m.status === 'later' ? { label: t('martin.outLater'), tone: 'warn' } : null,
  };
  return [valentina, lead, martin];
}

export function NowLanes({ vertical = false }: { vertical?: boolean }) {
  const t = useTranslations('demoAcademy.lanes');
  const { view } = useAcademy();
  const { name } = useAcademyText();
  const time = useEventTime();
  const lanes = useLanes();
  return (
    <ol className="atrio-lanes" data-vertical={vertical ? '' : undefined} aria-label={t('label')}>
      {lanes.map((lane) => {
        const doneCount = lane.steps.filter((s) => s.at !== null && view.t >= s.at).length;
        return (
          <li key={lane.id} className="atrio-lane">
            <div className="atrio-lane-who">
              <PersonAvatar id={lane.who} />
              <span className="min-w-0 leading-[1.2]">
                <span className="block truncate text-[0.8em] font-semibold">{name(lane.who)}</span>
                <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{lane.context}</span>
              </span>
            </div>
            <ol className="atrio-lane-steps">
              {lane.steps.map((s, i) => {
                const done = s.at !== null && view.t >= s.at;
                const now = !done && i === doneCount && doneCount > 0 && !s.off && lane.outcome === null;
                const fresh = done && s.at !== null && view.t - s.at < 2200;
                return (
                  <li key={i} className="atrio-step" data-done={done ? '' : undefined} data-now={now ? '' : undefined} data-off={s.off ? '' : undefined} data-tone={s.tone}>
                    <span className="atrio-step-node" aria-hidden>
                      {done && !s.off ? s.tone === 'bad' ? <span className="atrio-step-x">×</span> : <ChalkTick draw={fresh} tone={s.tone === 'bad' ? 'salmon' : 'ok'} /> : null}
                      {now ? <span className="atrio-step-pulse demo-loop" /> : null}
                    </span>
                    <span className="atrio-step-label">{s.label}</span>
                    <span className="atrio-step-time demo-mono">{done && s.at !== null ? time({ id: '', at: s.at, kind: 'lesson' }) : ''}</span>
                    <span className="sr-only">{done ? t('done') : now ? t('now') : t('pending')}</span>
                  </li>
                );
              })}
            </ol>
            <div className="atrio-lane-out">
              {lane.outcome ? (
                <span key={lane.outcome.label} className="atrio-outcome" data-tone={lane.outcome.tone}>
                  {lane.outcome.label}
                </span>
              ) : (
                <span className="atrio-outcome" data-tone="pending">
                  {doneCount ? t('inProgress') : t('notStarted')}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                 */
/* ------------------------------------------------------------------ */
type Tone = 'ok' | 'bad' | 'warn';

/** The school's numbers as a notebook ledger: label, dotted leader, a mono readout, one quiet note. */
function KpiLedger({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.today');
  const { view, ticketUsd } = useAcademy();
  const { fmt } = useAcademyText();
  const newToday = view.kpi.enrollments - SCHOOL.enrollments;
  const riskDelta = SCHOOL.atRisk - view.kpi.atRisk;
  const dropped = view.martin.status === 'dropped';
  const rows: { id: string; label: string; value: ReactNode; note: ReactNode; tone?: Tone; extra?: ReactNode }[] = [
    { id: 'active', label: t('active'), value: <Readout value={view.kpi.active} rollDown />, note: t('activeHint') },
    {
      id: 'risk',
      label: t('atRisk'),
      value: <Readout value={view.kpi.atRisk} rollDown />,
      note: riskDelta ? (dropped ? t('atRiskDropped') : t('atRiskDelta', { count: riskDelta })) : t('atRiskHint'),
      tone: riskDelta ? (dropped ? 'bad' : 'ok') : undefined,
    },
    {
      id: 'enrollments',
      label: t('enrollments'),
      value: <Readout value={view.kpi.enrollments} />,
      note: newToday ? t('enrollmentsDelta', { count: newToday }) : t('enrollmentsHint'),
      tone: newToday ? 'ok' : undefined,
    },
    {
      id: 'fees',
      label: t('fees'),
      value: <Money usd={view.kpi.feesPaid * ticketUsd} />,
      note: t('feesHint', { paid: fmt.num(view.kpi.feesPaid), total: fmt.num(view.kpi.active) }),
      extra: <Meter value={view.kpi.feesPaid / view.kpi.active} className="atrio-krow-meter" />,
    },
  ];
  return (
    <dl className="atrio-kledger" data-compact={compact ? '' : undefined}>
      {rows.map((r) => (
        <div key={r.id} className="atrio-krow" data-row={r.id}>
          <dt>{r.label}</dt>
          <dd className="atrio-krow-main">
            <span className="atrio-krow-leader" aria-hidden />
            <span className="atrio-krow-value">{r.value}</span>
          </dd>
          <dd className="atrio-krow-note" data-tone={r.tone}>
            {r.extra}
            <span>{r.note}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Views                                                                */
/* ------------------------------------------------------------------ */
export function LaptopToday() {
  const t = useTranslations('demoAcademy.today');
  const { go } = useAcademy();
  const feed = useFeedItems(4);
  return (
    <div className="atrio-today">
      <div className="atrio-today-top">
        <CompletionCard onOpen={() => go('courses')} />
        <KpiLedger />
      </div>
      <Card className="atrio-panel">
        <div className="atrio-panel-head">
          <h3 className="atrio-h3">{t('now')}</h3>
          <button type="button" className="atrio-link" onClick={() => go('students')}>
            {t('openStudents')}
            <ChevronRight aria-hidden strokeWidth={2} />
          </button>
        </div>
        <NowLanes />
      </Card>
      <Card className="atrio-panel atrio-feed2">
        <ActivityFeed title={t('activity')} items={feed} empty={t('feedEmpty')} />
      </Card>
    </div>
  );
}

export function PhoneToday() {
  const t = useTranslations('demoAcademy.today');
  const { go } = useAcademy();
  const { day } = useAcademyText();
  const feed = useFeedItems(4);
  return (
    <div className="atrio-school-phone">
      <header className="atrio-hello">
        <p className="atrio-index">{day(0, 'long')}</p>
        <h2 className="atrio-hello-title demo-display">{t('greeting')}</h2>
      </header>
      <CompletionCard compact onOpen={() => go('courses')} />
      <KpiLedger compact />
      <Card className="atrio-panel">
        <h3 className="atrio-h3">{t('now')}</h3>
        <NowLanes vertical />
      </Card>
      <Card className="atrio-panel">
        <ActivityFeed title={t('activity')} items={feed} empty={t('feedEmpty')} />
      </Card>
    </div>
  );
}
