'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, Check, Send, TrendingDown, TriangleAlert, Target, Users, UserRoundCheck, type LucideIcon } from 'lucide-react';
import { gsap, useGSAP } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { Money } from '@/components/ui/Money';
import { AT_RISK, AT_RISK_TOTAL, RISK_DAYS, CHURN_AFTER_TREND, CHURN_BEFORE, CHURN_MONTHS, PARTICIPATION, QUEUED_AT_MIN, type MemberId } from './data';
import { isFresh, type MemberView } from './sim';
import { useFmt, useGym } from './context';
import { Avatar, Card, RollingNumber, ViewTitle } from './ui';
import { ActivityFeed } from './activity';
import { MissionStats } from './Missions';

/** Cancellations per month: average before missions, and last month (before − key number). */
export function useChurn() {
  const { keyNumber } = useGym();
  const before = Math.round(CHURN_BEFORE.reduce((a, b) => a + b, 0) / CHURN_BEFORE.length);
  const now = Math.round(before * (1 - keyNumber / 100));
  return { before, now, months: [...CHURN_BEFORE, ...CHURN_AFTER_TREND, now] };
}

export function ChurnCard({ chartHeight = 6.5, className = '' }: { chartHeight?: number; className?: string }) {
  const t = useTranslations('demoGym.churn');
  const fmt = useFmt();
  const { ticketUsd } = useGym();
  const { before, now, months } = useChurn();
  const chart = useRef<HTMLDivElement>(null);
  const max = Math.max(...months) * 1.15;
  const split = CHURN_BEFORE.length;
  const last = months.length - 1;
  const lastMonth = CHURN_MONTHS[last];

  useGSAP(
    () => {
      if (prefersReducedMotion() || !chart.current) return;
      gsap.from(chart.current.querySelectorAll('.gym-bar'), { scaleY: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.15 });
    },
    { scope: chart },
  );

  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-[1.15em] p-[1em] text-white shadow-[0_1em_2.4em_-1.2em_rgb(36_21_82/0.85)] ${className}`}
      style={{ background: 'var(--gym-space)' }}
    >
      <h3 className="text-[0.74em] font-semibold text-white/90">{t('title')}</h3>
      <p className="mt-[0.2em] flex items-baseline gap-[0.4em]">
        <span className="text-[3em] font-semibold leading-none tracking-[-0.04em]">{fmt.num(now)}</span>
        <span className="text-[0.74em] text-white/85">{t('inMonth', { month: fmt.monthLong(lastMonth) })}</span>
      </p>
      <p className="mt-[0.45em] flex flex-wrap items-center gap-[0.45em]">
        <span className="inline-flex items-center gap-[0.3em] rounded-full bg-[var(--gym-amber)] px-[0.6em] py-[0.22em] text-[0.68em] font-bold text-[#05050a]">
          <TrendingDown aria-hidden className="size-[1.15em]" strokeWidth={2.4} />
          {t('change', { value: fmt.delta((now - before) / before) })}
        </span>
        <span className="text-[0.68em] text-white/85">{t('before', { count: before })}</span>
      </p>

      <figure className="mt-[0.9em]">
        <figcaption className="sr-only">{t('chart')}</figcaption>
        <div ref={chart} aria-hidden className="relative border-b border-white/20" style={{ height: `${chartHeight}em` }}>
          <ol className="absolute inset-0 flex items-end gap-[0.45em] px-[0.1em]">
            {months.map((v, i) => (
              <li key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                {i === 0 || i === last ? <span className="tabular mb-[0.25em] text-[0.62em] font-semibold text-white/90">{v}</span> : null}
                <span
                  className="gym-bar block w-full max-w-[1.6em] rounded-t-[0.35em]"
                  style={{
                    height: `${(v / max) * 100}%`,
                    background: i < split ? 'rgb(255 255 255 / 0.22)' : i === last ? '#ffffff' : '#a993ff',
                  }}
                />
              </li>
            ))}
          </ol>
        </div>
        <ol aria-hidden className="mt-[0.3em] flex gap-[0.45em] px-[0.1em]">
          {months.map((_, i) => (
            <li key={i} className={`flex-1 text-center text-[0.56em] ${i === last ? 'font-semibold text-white' : 'text-white/70'}`}>
              {fmt.monthShort(CHURN_MONTHS[i])}
            </li>
          ))}
        </ol>
        <ul className="sr-only">
          {months.map((v, i) => (
            <li key={i}>
              {t('barLabel', { month: fmt.monthLong(CHURN_MONTHS[i]), count: v })} ({i < split ? t('legendBefore') : t('legendAfter')})
            </li>
          ))}
        </ul>
      </figure>
      <p aria-hidden className="mt-[0.55em] flex flex-wrap items-center gap-x-[0.8em] gap-y-[0.2em] text-[0.6em] text-white/80">
        <span className="flex items-center gap-[0.35em]">
          <span className="size-[0.75em] rounded-[0.2em] bg-white/25" />
          {t('legendBefore')}
        </span>
        <span className="flex items-center gap-[0.35em]">
          <span className="size-[0.75em] rounded-[0.2em] bg-[#a993ff]" />
          {t('legendAfter')}
        </span>
      </p>

      <div className="mt-auto pt-[0.8em]">
        <div className="flex items-end justify-between gap-[0.6em] border-t border-white/15 pt-[0.6em]">
          <span className="text-[0.68em] leading-[1.3] text-white/85">{t('kept', { count: before - now })}</span>
          <Money usd={(before - now) * ticketUsd} approx className="whitespace-nowrap text-[0.9em] font-semibold" />
        </div>
      </div>
    </section>
  );
}

function Kpi({ icon: Icon, label, value, hint, tone = 'accent' }: { icon: LucideIcon; label: string; value: number; hint: React.ReactNode; tone?: 'accent' | 'bad' | 'flame' }) {
  const toneCls =
    tone === 'bad'
      ? 'bg-[var(--gym-bad-bg)] text-[var(--gym-bad)]'
      : tone === 'flame'
        ? 'bg-[var(--gym-flame-bg)] text-[var(--gym-flame-ink)]'
        : 'bg-[var(--demo-accent-soft)] text-[var(--gym-accent-ink)]';
  return (
    <div className="min-w-0 rounded-[1em] border border-[var(--demo-line)] bg-white p-[0.8em]">
      <p className="flex items-center gap-[0.45em] text-[0.68em] font-medium text-[var(--demo-muted)]">
        <span aria-hidden className={`grid size-[1.8em] shrink-0 place-items-center rounded-[0.55em] ${toneCls}`}>
          <Icon className="size-[1.1em]" strokeWidth={2} />
        </span>
        <span className="min-w-0 leading-[1.2]">{label}</span>
      </p>
      <p className="mt-[0.45em] text-[1.6em] font-semibold leading-none tracking-[-0.02em]">
        <RollingNumber value={value} />
      </p>
      <p className="mt-[0.4em] text-[0.62em] leading-[1.3] text-[var(--demo-muted)]">{hint}</p>
    </div>
  );
}

export function KpiGrid({ columns = 4 }: { columns?: 2 | 4 }) {
  const t = useTranslations('demoGym.kpis');
  const fmt = useFmt();
  const { world } = useGym();
  const { kpis } = world;
  return (
    <div className={`grid gap-[0.6em] ${columns === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
      <Kpi icon={Users} label={t('active')} value={kpis.active} hint={t('activeHint')} />
      <Kpi
        icon={TriangleAlert}
        tone="bad"
        label={t('atRisk')}
        value={kpis.atRisk}
        hint={kpis.returnsToday ? <span className="font-semibold text-[var(--gym-ok)]">{t('returned', { count: kpis.returnsToday })}</span> : t('atRiskHint', { days: RISK_DAYS })}
      />
      <Kpi icon={Activity} tone="flame" label={t('checkins')} value={kpis.checkins} hint={t('checkinsHint')} />
      <Kpi icon={Target} label={t('missions')} value={kpis.missionsWeek} hint={t('missionsHint', { value: fmt.pct(PARTICIPATION) })} />
    </div>
  );
}

/** Status of a flagged member + the owner's action ("send now" for queued comeback missions). */
export function RiskStatus({ member }: { member: MemberView }) {
  const t = useTranslations('demoGym.risk');
  const tm = useTranslations('demoGym.members');
  const { store } = useGym();
  const state = member.risk?.state;
  if (!state) return null;
  if (state === 'queued' || state === 'sentNow') {
    const sent = state === 'sentNow';
    return (
      <button
        type="button"
        aria-disabled={sent || undefined}
        aria-label={t(sent ? 'sentTo' : 'sendTo', { name: tm(member.id) })}
        onClick={() => {
          if (!sent) store.sendNow(member.id);
        }}
        className={`gym-action inline-flex shrink-0 items-center gap-[0.35em] whitespace-nowrap rounded-full px-[0.65em] py-[0.32em] text-[0.66em] font-semibold ${
          sent
            ? 'bg-[var(--demo-accent-soft)] text-[var(--gym-accent-ink)]'
            : 'border border-[var(--demo-accent)] bg-white text-[var(--gym-accent-ink)] hover:bg-[var(--demo-accent-soft)]'
        }`}
      >
        {sent ? <Check aria-hidden className="size-[1.1em]" strokeWidth={2.6} /> : <Send aria-hidden className="size-[1.05em]" strokeWidth={2.2} />}
        {sent ? t('sentNow') : t('sendNow')}
      </button>
    );
  }
  const cls = state === 'back' ? 'bg-[var(--gym-ok-bg)] text-[var(--gym-ok)]' : 'bg-[var(--gym-warn-bg)] text-[var(--gym-warn)]';
  const Icon = state === 'back' ? UserRoundCheck : Send;
  return (
    <span key={state} className={`inline-flex shrink-0 items-center gap-[0.3em] whitespace-nowrap rounded-full px-[0.6em] py-[0.25em] text-[0.66em] font-semibold ${cls} ${state === 'back' ? 'gym-pop' : ''}`}>
      <Icon aria-hidden className="size-[1.05em]" strokeWidth={2.2} />
      {t(state)}
    </span>
  );
}

/** "9 days without coming" / "came back after 9 days" / "goes out at 18:00". */
export function useRiskDetail() {
  const t = useTranslations('demoGym.risk');
  const fmt = useFmt();
  return (m: MemberView) => {
    if (!m.risk) return '';
    if (m.risk.state === 'back') return t('backAfter', { count: m.risk.days });
    const away = t('away', { count: m.risk.days });
    return m.risk.state === 'queued' ? `${away} · ${t('queuedAt', { time: fmt.time(QUEUED_AT_MIN) })}` : away;
  };
}

export function AtRiskCard({ className = '' }: { className?: string }) {
  const t = useTranslations('demoGym');
  const { world, state } = useGym();
  const detail = useRiskDetail();
  const rows = AT_RISK.map((r) => world.members[r.id as MemberId]);
  const more = AT_RISK_TOTAL - rows.length;
  return (
    <Card className={`flex flex-col p-[0.85em] ${className}`} as="section">
      <div className="flex items-start justify-between gap-[0.6em]">
        <div className="min-w-0">
          <h3 className="text-[0.86em] font-semibold">{t('risk.title')}</h3>
          <p className="mt-[0.1em] text-[0.66em] leading-[1.35] text-[var(--demo-muted)]">{t('risk.subtitle', { days: RISK_DAYS })}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--gym-bad-bg)] px-[0.55em] py-[0.2em] text-[0.66em] font-semibold text-[var(--gym-bad)]">
          <RollingNumber value={world.kpis.atRisk} />
        </span>
      </div>
      <ul className="mt-[0.5em] divide-y divide-[var(--demo-line)]">
        {rows.map((m) => {
          const fresh = isFresh({ at: m.changedAt }, state.tick);
          const back = m.risk?.state === 'back';
          return (
            <li key={m.id} className={`flex items-center gap-[0.55em] py-[0.42em] ${fresh ? 'gym-fresh rounded-[0.6em]' : ''}`}>
              <span className="relative">
                <Avatar id={m.id} className={back ? '' : 'opacity-80'} />
                {!back && m.risk?.high ? (
                  <span aria-hidden className="absolute -right-[0.1em] -top-[0.1em] size-[0.6em] rounded-full border-[0.12em] border-white bg-[var(--gym-bad)]" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 leading-[1.2]">
                <span className="block truncate text-[0.78em] font-semibold">
                  {t(`members.${m.id}`)}
                  {!back && m.risk?.high ? <span className="sr-only"> ({t('risk.high')})</span> : null}
                </span>
                <span className={`block truncate text-[0.64em] ${back ? 'text-[var(--gym-ok)]' : 'text-[var(--demo-muted)]'}`}>{detail(m)}</span>
              </span>
              <RiskStatus member={m} />
            </li>
          );
        })}
      </ul>
      <p className="mt-auto border-t border-[var(--demo-line)] pt-[0.55em] text-[0.64em] text-[var(--demo-muted)]">{t('risk.more', { count: more })}</p>
    </Card>
  );
}

export function PhonePanel() {
  const t = useTranslations('demoGym');
  return (
    <div className="flex flex-col gap-[0.75em]">
      <ViewTitle eyebrow={t('ownerView')} title={t('retention.title')} subtitle={t('retention.subtitle')} />
      <ChurnCard chartHeight={5.5} />
      <KpiGrid columns={2} />
      <AtRiskCard />
      <Card className="p-[0.85em]">
        <ActivityFeed limit={4} />
      </Card>
      <MissionStats />
    </div>
  );
}

export function LaptopRetention() {
  const t = useTranslations('demoGym');
  return (
    <div className="flex flex-col gap-[0.9em]">
      <div className="mr-[var(--gym-safe-top,0em)]">
        <ViewTitle size="laptop" title={t('retention.title')} subtitle={t('retention.subtitle')} />
      </div>
      <div className="mr-[var(--gym-safe,0em)] flex flex-col gap-[0.8em]">
        <KpiGrid />
        <div className="grid grid-cols-[16.5em_minmax(0,1fr)] gap-[0.8em]">
          <ChurnCard />
          <AtRiskCard />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_15em] items-start gap-[0.8em]">
          <Card className="p-[0.85em]">
            <ActivityFeed limit={5} />
          </Card>
          <MissionStats />
        </div>
      </div>
    </div>
  );
}
