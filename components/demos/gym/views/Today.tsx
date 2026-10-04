'use client';

import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { ActivityFeed, Pill, Readout, type Tone } from '../../kit';
import { AT, CHURN, CHURN_LIVE_FROM, HERO, LEAD, RISK_DAYS, sessionsOn } from '../model';
import { isFreshEvent, taken, type HeroStatus } from '../story';
import { useGym, useGymText } from '../hooks';
import { HudHead, MemberAvatar, storyClockAt, useFeedItems } from '../parts';

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
export const CHURN_BEFORE = Math.round(avg(CHURN.slice(0, CHURN_LIVE_FROM)));
export const CHURN_AFTER = Math.round(avg(CHURN.slice(CHURN_LIVE_FROM)));

/* ------------------------------------------------------------------ */
/* Scoreboard: the four numbers of the gym                              */
/* ------------------------------------------------------------------ */
export function Scoreboard({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoGym.today');
  const { view, keyNumber, go } = useGym();
  const { fmt } = useGymText();
  const k = view.kpi;
  const back = view.events.find((e) => e.kind === 'back');
  const backNow = !!back && isFreshEvent(view, back, 5000);
  return (
    <div className="gym-board-strip" data-compact={compact ? '' : undefined}>
      <div className="gym-stat">
        <p className="gym-stat-k">{t('active')}</p>
        <p className="gym-stat-v demo-display">
          <Readout value={k.active} />
        </p>
        <p className="gym-stat-h">{view.churnAt !== null ? t('activeLost') : t('activeHint')}</p>
      </div>
      <button type="button" className="gym-stat" data-tone="risk" onClick={() => go('retention')}>
        <p className="gym-stat-k">{t('atRisk')}</p>
        <p className="gym-stat-v demo-display">
          <Readout value={k.atRisk} />
        </p>
        <p className="gym-stat-h">{backNow ? t('atRiskDrop') : t('atRiskHint', { days: RISK_DAYS })}</p>
        <ArrowUpRight aria-hidden className="gym-stat-go" strokeWidth={2} />
      </button>
      <div className="gym-stat">
        <p className="gym-stat-k">{t('back')}</p>
        <p className="gym-stat-v demo-display">
          <Readout value={k.back} />
          <span className="gym-stat-of demo-num">/{fmt.num(k.sent)}</span>
        </p>
        <p className="gym-stat-h">{t('backHint', { pct: fmt.pct(k.back / k.sent) })}</p>
      </div>
      <div className="gym-stat" data-tone="key">
        <p className="gym-stat-k">{t('churn')}</p>
        <p className="gym-stat-v demo-display">
          {keyNumber.prefix}
          {keyNumber.value}
          {keyNumber.suffix}
        </p>
        <p className="gym-stat-h">{t('churnHint', { before: CHURN_BEFORE, after: CHURN_AFTER })}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lucía's comeback, step by step                                       */
/* ------------------------------------------------------------------ */
type StepState = 'done' | 'now' | 'todo' | 'bad' | 'warn';
const STATUS_TONE: Record<HeroStatus, Tone> = {
  away: 'neutral',
  risk: 'bad',
  contacted: 'accent',
  booked: 'accent',
  back: 'ok',
  done: 'accent',
  paused: 'warn',
  churned: 'bad',
};

export function Journey({ vertical = false }: { vertical?: boolean }) {
  const t = useTranslations('demoGym.journey');
  const { view, go, screen } = useGym();
  const { name, session, fmt, dayShort } = useGymText();
  const v = view;
  const when = (at: number | null) => {
    if (at === null || at > v.t) return '';
    const c = storyClockAt(v, at);
    return `${dayShort(c.day)} ${fmt.time(c.clock)}`;
  };
  const past = (at: number | null) => at !== null && at <= v.t;

  const steps: { id: string; label: string; detail: string; state: StepState }[] = [];
  steps.push({ id: 'risk', label: t('risk'), detail: t('riskDetail', { count: 9 }), state: v.t >= AT.flag ? 'done' : 'now' });
  if (v.churnAt !== null || (v.winOffAtSend && v.sentAt === null)) {
    steps.push({ id: 'none', label: t('none'), detail: t('noneDetail'), state: 'warn' });
    steps.push({ id: 'churn', label: t('churn'), detail: v.churnAt !== null ? when(v.churnAt) : t('churnSoon'), state: v.churnAt !== null ? 'bad' : 'todo' });
  } else {
    steps.push({ id: 'wa', label: t('wa'), detail: past(v.sentAt) ? when(v.sentAt) : t('waSoon'), state: past(v.sentAt) ? 'done' : 'todo' });
    if (v.declinedAt !== null && past(v.declinedAt) && !(v.book1 && past(v.book1.at))) {
      steps.push({ id: 'paused', label: t('paused'), detail: t('pausedDetail'), state: 'warn' });
      steps.push({ id: 'follow', label: t('follow'), detail: t('followDetail'), state: 'todo' });
    } else {
      steps.push({ id: 'booked', label: t('booked'), detail: v.book1 && past(v.book1.at) ? session(v.book1.session) : '', state: v.book1 && past(v.book1.at) ? 'done' : 'todo' });
      steps.push({ id: 'back', label: t('back'), detail: past(v.check1At) ? when(v.check1At) : '', state: past(v.check1At) ? 'done' : 'todo' });
      steps.push({
        id: 'done',
        label: t('done'),
        detail: past(v.missionAt) ? t('doneDetail', { level: v.level }) : v.check1At !== null && past(v.check1At) ? t('doneProgress', { count: v.checkins.length }) : '',
        state: past(v.missionAt) ? 'done' : 'todo',
      });
    }
  }
  // The first pending step after the last done one is "now".
  const lastDone = steps.map((s) => s.state === 'done' || s.state === 'bad' || s.state === 'warn').lastIndexOf(true);
  if (steps[lastDone + 1]?.state === 'todo' && v.churnAt === null) steps[lastDone + 1].state = 'now';

  return (
    <section className="gym-journey gym-cut" data-vertical={vertical ? '' : undefined} aria-labelledby={`gym-journey-${screen}`} data-tour="winback">
      <header className="gym-journey-head">
        <MemberAvatar id={HERO} className="gym-journey-av" />
        <span className="min-w-0 flex-1">
          <span id={`gym-journey-${screen}`} className="gym-journey-name">
            {t('title', { name: name(HERO) })}
          </span>
          <span className="gym-journey-sub">{t('sub', { level: v.level, rank: v.heroRank })}</span>
        </span>
        <Pill tone={STATUS_TONE[v.status]} solid={v.status === 'done'}>
          {t(`status.${v.status}`)}
        </Pill>
      </header>
      <ol className="gym-rail" style={{ '--steps': steps.length } as CSSProperties}>
        {steps.map((s, i) => (
          <li key={s.id} data-state={s.state}>
            <span className="gym-rail-dot" aria-hidden>
              <span className="demo-num">{String(i + 1).padStart(2, '0')}</span>
            </span>
            <span className="gym-rail-label">{s.label}</span>
            {s.detail ? <span className="gym-rail-detail">{s.detail}</span> : null}
            <span className="sr-only">{t(`state.${s.state}`)}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="gym-journey-link" onClick={() => go('retention')}>
        {t('open')}
        <ArrowUpRight aria-hidden strokeWidth={2} />
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Today's classes                                                      */
/* ------------------------------------------------------------------ */
export function TodayClasses({ limit = 5 }: { limit?: number }) {
  const t = useTranslations('demoGym.today');
  const { view, go } = useGym();
  const { fmt, kind, dayLong, short } = useGymText();
  const list = sessionsOn(view.day).slice(0, limit);
  return (
    <section className="gym-classes-today" aria-labelledby="gym-ct-h">
      <div className="gym-row-head">
        <h3 id="gym-ct-h" className="gym-h3">
          {t('classes', { day: dayLong(view.day) })}
        </h3>
        <button type="button" className="gym-link" onClick={() => go('classes')}>
          {t('classesAll')}
        </button>
      </div>
      <ul className="gym-ct-list">
        {list.map((s) => {
          const booked = taken(view, s);
          const hero = view.heroSessions.includes(s.id);
          const lead = view.trial?.session === s.id;
          const live = s.start <= view.clock + 5 && view.clock < s.start + 50;
          return (
            <li key={s.id} className="gym-ct" data-live={live ? '' : undefined} data-full={booked >= s.cap ? '' : undefined}>
              <span className="gym-ct-time demo-num">{fmt.gutter(s.start)}</span>
              <span className="gym-ct-kind">{kind(s.kind)}</span>
              <span className="gym-ct-bar" aria-hidden>
                <span style={{ transform: `scaleX(${booked / s.cap})` }} />
              </span>
              <span className="gym-ct-n demo-num">
                {booked}/{s.cap}
              </span>
              <span className="gym-ct-who">
                {hero ? <MemberAvatar id={HERO} /> : null}
                {lead ? <MemberAvatar id={LEAD} /> : null}
                <span className="sr-only">{[hero ? short(HERO) : '', lead ? short(LEAD) : ''].filter(Boolean).join(', ')}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function LaptopToday() {
  const t = useTranslations('demoGym.today');
  const items = useFeedItems(6);
  return (
    <div className="gym-today">
      <Scoreboard />
      <div className="gym-today-grid">
        <Journey />
        <ActivityFeed items={items} title={t('feedTitle')} empty={t('feedEmpty')} className="gym-feed" />
      </div>
      <TodayClasses />
    </div>
  );
}

export function PhoneToday() {
  const t = useTranslations('demoGym.today');
  const items = useFeedItems(4);
  return (
    <div className="gym-today" data-screen="phone">
      <HudHead index="01" label={t('index')} title={t('title')} />
      <Scoreboard compact />
      <Journey vertical />
      <ActivityFeed items={items} title={t('feedTitle')} empty={t('feedEmpty')} className="gym-feed" />
    </div>
  );
}
