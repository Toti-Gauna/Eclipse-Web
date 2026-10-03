'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '../../kit';
import { COURSES, RESCUED, RETENTION_BEFORE, RETENTION_WEEKS, SCHOOL } from '../data';
import { useAcademy } from '../context';
import { ViewHead, useAcademyText } from '../ui';

/** Students still active per course week: before (no follow-up) vs now. The story is week 3. */
function RetentionChart({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.courses');
  const { view } = useAcademy();
  const { fmt } = useAcademyText();
  const now = RETENTION_WEEKS.map((v, i) => (i === RETENTION_WEEKS.length - 1 ? view.kpi.onTrack : v));
  const last = now[now.length - 1];
  return (
    <Card className="atrio-panel atrio-retention" as="section">
      <div className="atrio-panel-head">
        <h3 className="atrio-h3">{t('retention')}</h3>
        <span className="atrio-retention-legend" aria-hidden>
          <span data-k="now">{t('legendNow')}</span>
          <span data-k="before">{t('legendBefore')}</span>
        </span>
      </div>
      <figure className="atrio-retention-plot" data-compact={compact ? '' : undefined}>
        <div className="atrio-retention-cols" aria-hidden>
          {now.map((v, i) => (
            <span key={i} className="atrio-retention-col" data-week3={i === 2 ? '' : undefined} style={{ '--i': i } as CSSProperties}>
              <span className="atrio-retention-before" style={{ transform: `scaleY(${RETENTION_BEFORE[i] / SCHOOL.cohort})` }} />
              <span className="atrio-retention-now" style={{ transform: `scaleY(${v / SCHOOL.cohort})` }} />
              <span className="atrio-retention-w demo-mono">{i + 1}</span>
            </span>
          ))}
          <span className="atrio-retention-note" style={{ '--x': 2 } as CSSProperties}>
            <span className="demo-mono">{t('week3', { before: RETENTION_BEFORE[2], now: RETENTION_WEEKS[2] })}</span>
          </span>
        </div>
        <figcaption className="atrio-retention-cap">
          {t.rich('caption', {
            last,
            total: SCHOOL.cohort,
            before: RETENTION_BEFORE[RETENTION_BEFORE.length - 1],
            b: (c) => <b className="demo-mono font-semibold text-[var(--demo-ink)]">{c}</b>,
          })}
        </figcaption>
      </figure>
      <p className="sr-only">
        {t('srSummary', { pct: fmt.pct(last / SCHOOL.cohort), before: fmt.pct(RETENTION_BEFORE[RETENTION_BEFORE.length - 1] / SCHOOL.cohort) })}
      </p>
    </Card>
  );
}

/** Courses as a ledger: students, where they are in the syllabus (8 units), completion. */
function CourseLedger({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoAcademy.courses');
  const { course, fmt } = useAcademyText();
  return (
    <Card className="atrio-panel atrio-ledger" as="section">
      <div className="atrio-panel-head">
        <h3 className="atrio-h3">{t('ledger')}</h3>
        <span className="atrio-label">{t('ledgerHint')}</span>
      </div>
      <ul className="atrio-ledger-list">
        {COURSES.map((c) => {
          const max = Math.max(...c.spread);
          return (
            <li key={c.id} className="atrio-ledger-row" data-compact={compact ? '' : undefined}>
              <span className="atrio-ledger-name">
                <span className="atrio-ledger-level demo-mono" data-lang={c.lang}>
                  {c.level}
                </span>
                <span className="min-w-0 truncate">{course(c.lang, c.level)}</span>
              </span>
              <span className="atrio-ledger-students demo-mono">{t('students', { count: c.students })}</span>
              {!compact ? (
                <span className="atrio-ledger-units" role="img" aria-label={t('unitsLabel', { unit: c.unit })}>
                  {c.spread.map((n, i) => (
                    <span key={i} data-avg={i + 1 === c.unit ? '' : undefined}>
                      <span style={{ transform: `scaleY(${max ? Math.max(0.06, n / max) : 0.06})` }} />
                    </span>
                  ))}
                </span>
              ) : null}
              <span className="atrio-ledger-pct demo-mono">{fmt.pct(c.completion)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function LaptopCourses() {
  const t = useTranslations('demoAcademy.courses');
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ViewHead index={t('index', { count: COURSES.length })} title={t('title')} sub={t('sub', { rescued: RESCUED })} />
      <RetentionChart />
      <CourseLedger />
    </div>
  );
}

export function PhoneCourses() {
  const t = useTranslations('demoAcademy.courses');
  return (
    <div className="atrio-school-phone">
      <ViewHead index={t('index', { count: COURSES.length })} title={t('title')} />
      <RetentionChart compact />
      <CourseLedger compact />
    </div>
  );
}
