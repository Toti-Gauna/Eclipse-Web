'use client';

import { useTranslations } from 'next-intl';
import { BellRing, CalendarCheck, MessageCircle, Send, TimerReset, type LucideIcon } from 'lucide-react';
import { Bars, Pill, type Tone } from '../../kit';
import { CHURN, CHURN_LIVE_FROM, CHURN_MONTHS, HERO, HIGH_RISK_DAYS, QUEUED_AT, RISK_DAYS, RISK_LIST, memberById, type MemberId, type RiskState } from '../model';
import { act, isOffNow, type HeroStatus } from '../story';
import { useGym, useGymText } from '../hooks';
import { useChats } from '../scripts';
import { HudHead, MemberAvatar, WinbackSwitch } from '../parts';
import { CHURN_AFTER, CHURN_BEFORE } from './Today';

const HERO_TONE: Record<HeroStatus, Tone> = {
  away: 'bad',
  risk: 'bad',
  contacted: 'accent',
  booked: 'accent',
  back: 'ok',
  done: 'ok',
  paused: 'warn',
  churned: 'bad',
};
const RISK_TONE: Record<RiskState, Tone> = { sent: 'accent', booked: 'ok', high: 'bad', queued: 'warn' };

interface RiskRow {
  id: MemberId;
  days: number;
  tone: Tone;
  status: string;
  action?: { label: string; onClick: () => void; aria: string };
  fresh?: boolean;
}

function useRiskRows(): RiskRow[] {
  const t = useTranslations('demoGym.risk');
  const { view, state, run } = useGym();
  const { short, session } = useGymText();
  const hero: RiskRow = {
    id: HERO,
    days: view.away,
    tone: HERO_TONE[view.status],
    status:
      view.status === 'booked' && view.book1
        ? t('heroBooked', { class: session(view.book1.session, false) })
        : t(`hero.${view.status === 'away' ? 'risk' : view.status}`),
    fresh: view.events.length > 0 && view.t - view.events[view.events.length - 1].at < 2000 && view.events[view.events.length - 1].member === HERO,
  };
  const rows = RISK_LIST.map(({ id, state: s }) => {
    const m = memberById(id);
    const sent = state.sentNow[id] !== undefined && state.sentNow[id]! <= view.t;
    const st: RiskState = sent ? 'sent' : s;
    return {
      id,
      days: m.away + view.day,
      tone: RISK_TONE[st],
      status: st === 'sent' && sent ? t('sentNow') : t(`state.${st}`),
      action:
        st === 'queued'
          ? { label: t('send'), aria: t('sendTo', { name: short(id) }), onClick: () => run(act.sendNow(id), 'success') }
          : undefined,
    } satisfies RiskRow;
  });
  return [hero, ...rows.sort((a, b) => b.days - a.days)];
}

export function RiskList({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoGym.risk');
  const { view } = useGym();
  const { short } = useGymText();
  const rows = useRiskRows();
  return (
    <section className="gym-risk" data-compact={compact ? '' : undefined} aria-labelledby={`gym-risk-h-${compact ? 'p' : 'l'}`}>
      <div className="gym-row-head">
        <h3 id={`gym-risk-h-${compact ? 'p' : 'l'}`} className="gym-h3">
          {t('title')}
        </h3>
        <span className="gym-count gym-count-risk demo-num">{t('count', { count: view.kpi.atRisk })}</span>
      </div>
      <ul className="gym-risk-list">
        {rows.map((r) => (
          <li key={r.id} className="gym-risk-row" data-hero={r.id === HERO ? '' : undefined} data-fresh={r.fresh ? '' : undefined}>
            <MemberAvatar id={r.id} />
            <span className="gym-risk-name">
              <span className="block truncate font-semibold">{short(r.id)}</span>
              <span className="gym-heat" data-high={r.days >= HIGH_RISK_DAYS ? '' : undefined} aria-hidden>
                <span style={{ transform: `scaleX(${Math.min(1, r.days / 21)})` }} />
              </span>
            </span>
            <span className="gym-risk-days demo-num">
              {r.days > 0 ? t('days', { count: r.days }) : t('today')}
            </span>
            <Pill tone={r.tone} className="gym-risk-pill">
              {r.status}
            </Pill>
            {r.action ? (
              <button type="button" className="gym-btn" data-variant="secondary" onClick={r.action.onClick} aria-label={r.action.aria}>
                {r.action.label}
              </button>
            ) : (
              <span className="gym-risk-gap" aria-hidden />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const FLOW: { id: string; icon: LucideIcon }[] = [
  { id: 'trigger', icon: TimerReset },
  { id: 'message', icon: MessageCircle },
  { id: 'reminder', icon: CalendarCheck },
  { id: 'coach', icon: BellRing },
];

export function Automation({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoGym.win');
  const { view, state, screen } = useGym();
  const { fmt, short } = useGymText();
  const { wa } = useChats();
  const on = !isOffNow(state.off);
  const preview = wa?.items.find((i) => i.step === 'hello');
  const id = `gym-win-${screen}-${compact ? 'c' : 'f'}`;
  return (
    <section className="gym-auto gym-cut" data-off={on ? undefined : ''} aria-labelledby={`${id}-h`}>
      <div className="gym-auto-head">
        <span className="min-w-0 flex-1">
          <span className="gym-auto-kicker">{t('kicker')}</span>
          <h3 id={`${id}-h`} className="gym-auto-title demo-display">
            {t('title')}
          </h3>
        </span>
        <WinbackSwitch id={`${id}-sw`} />
      </div>
      {!on ? <p className="gym-auto-warn">{t('offWarn', { name: short(HERO) })}</p> : null}
      {compact ? null : (
        <ol className="gym-flow">
          {FLOW.map((f, i) => {
            const Icon = f.icon;
            return (
              <li key={f.id}>
                <span className="gym-flow-icon" aria-hidden>
                  <Icon strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="gym-flow-k demo-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="gym-flow-t">{t(`flow.${f.id}`, { days: RISK_DAYS, time: fmt.time(QUEUED_AT) })}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="gym-auto-preview" aria-hidden={!preview}>
        <span className="gym-auto-preview-k">
          <Send aria-hidden strokeWidth={2} />
          {preview ? t('lastSent', { name: short(HERO) }) : on ? t('nextSend', { name: short(HERO) }) : t('notSent')}
        </span>
        {preview ? <span className="gym-auto-bubble">{preview.text}</span> : null}
      </div>
      <p className="gym-auto-stats">
        {t('stats', { sent: fmt.num(view.kpi.sent), back: fmt.num(view.kpi.back), pct: fmt.pct(view.kpi.back / view.kpi.sent) })}
      </p>
    </section>
  );
}

export function ChurnChart({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoGym.churn');
  const { view, keyNumber } = useGym();
  const { fmt } = useGymText();
  const month = (m: number) => fmt.date(new Date(Date.UTC(2026, m, 1)), { month: 'short' }).replace('.', '');
  const data = CHURN.map((v, i) => ({ label: month(CHURN_MONTHS[i]), value: v, tone: (i >= CHURN_LIVE_FROM ? 'accent' : 'neutral') as Tone }));
  return (
    <section className="gym-churn gym-cut" data-compact={compact ? '' : undefined} aria-labelledby={`gym-churn-h-${compact ? 'p' : 'l'}`}>
      <div className="gym-churn-key">
        <p id={`gym-churn-h-${compact ? 'p' : 'l'}`} className="gym-auto-kicker">
          {t('title')}
        </p>
        <p className="gym-churn-big demo-display">
          {keyNumber.prefix}
          {keyNumber.value}
          {keyNumber.suffix}
        </p>
        <p className="gym-churn-cap">{t('caption', { before: CHURN_BEFORE, after: CHURN_AFTER })}</p>
        <p className="gym-churn-oct" data-up={view.churnAt !== null ? '' : undefined}>
          {t('october', { count: view.kpi.churnOct })}
        </p>
      </div>
      <Bars
        data={data}
        label={t('chart', { before: CHURN_BEFORE, after: CHURN_AFTER })}
        height={compact ? '5.5em' : '7.5em'}
        values="all"
        className="gym-bars"
      />
      <p className="gym-churn-legend" aria-hidden>
        <span data-k="before">{t('before')}</span>
        <span data-k="after">{t('after')}</span>
      </p>
    </section>
  );
}

export function LaptopRetention() {
  const t = useTranslations('demoGym.retention');
  const { short } = useGymText();
  return (
    <div className="gym-view">
      <HudHead index="02" label={t('index')} title={t('title')} sub={t('sub', { days: RISK_DAYS, name: short(HERO) })} />
      <div className="gym-ret-grid">
        <RiskList />
        <Automation />
      </div>
      <ChurnChart />
    </div>
  );
}

export function PhoneRetention() {
  const t = useTranslations('demoGym.retention');
  const { short } = useGymText();
  return (
    <div className="gym-view" data-screen="phone">
      <HudHead index="02" label={t('index')} title={t('title')} sub={t('sub', { days: RISK_DAYS, name: short(HERO) })} />
      <Automation compact />
      <RiskList compact />
      <ChurnChart compact />
    </div>
  );
}
