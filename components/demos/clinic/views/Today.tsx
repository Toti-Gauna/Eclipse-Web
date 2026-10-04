'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ChevronRight, Globe } from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { ActivityFeed, Calendar, Card, Kpi, Meter, Pill, Readout, Sparkline, ToastStack, VoiceCall, type ToastItem } from '../../kit';
import { CALLER_NUMBER, DAY_END, DAY_START, PROS, RECOVERED_BY_DAY, SITE_URL, STEP, STORY } from '../data';
import { dayStats } from '../story';
import { useClinic } from '../context';
import { STATUS, ProAvatar, eventIcon, useApptEvent, useClinicText, useEventText, useFeedItems, ViewHead } from '../ui';
import { CallOutcome } from './Calls';

/** "Recovered this week": the clinic's key number (content/verticals.json), lit like a sunrise. */
export function RecoveredCard({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const t = useTranslations('demoClinic.today');
  const { view, ticketUsd } = useClinic();
  const total = view.recovered.total;
  const weekBefore = RECOVERED_BY_DAY.reduce((a, b) => a + b, 0);
  // Cumulative recoveries Mon → today.
  const days = RECOVERED_BY_DAY.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], [0]);
  const body = (
    <>
      <span className="clinic-recovered-sun" aria-hidden />
      <span className="clinic-recovered-label">{t('recovered')}</span>
      <span className="clinic-recovered-value demo-display">
        <Readout value={total} />
        <span className="clinic-recovered-of">{t('recoveredToday', { count: Math.max(0, total - weekBefore) })}</span>
      </span>
      <span className="clinic-recovered-money">
        <Money usd={total * ticketUsd} approx className="font-semibold" /> {t('recoveredMoney')}
      </span>
      <Sparkline values={[...days, total]} label={t('recoveredTrend', { count: total })} tone="ink" className="clinic-recovered-spark" />
      {onOpen ? (
        <span className="clinic-recovered-open" aria-hidden>
          <ArrowUpRight strokeWidth={2} />
        </span>
      ) : null}
    </>
  );
  return onOpen ? (
    <button type="button" onClick={onOpen} className="clinic-recovered" data-compact={compact ? '' : undefined} data-tour="recovered">
      {body}
    </button>
  ) : (
    <div className="clinic-recovered" data-compact={compact ? '' : undefined} data-tour="recovered">
      {body}
    </div>
  );
}

/**
 * Toasts (decorative: the Announcer speaks). Story events show while their beat plays (the
 * beat always ends after they leave); the visitor's own bookings show for a few seconds.
 */
export function ClinicToasts({ placement }: { placement: 'top' | 'bottom-right' }) {
  const { view, reduced } = useClinic();
  const text = useEventText();
  const t = useTranslations('demoClinic.toast');
  // The visitor's bookings made while this view is on screen (not the ones from before).
  const mine = view.events.filter((e) => e.kind === 'you');
  const ids = mine.map((e) => e.id).join('|');
  const known = useRef<Set<string> | null>(null);
  const timers = useRef<number[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const now = ids ? ids.split('|') : [];
    const before = known.current;
    known.current = new Set(now);
    const added = before ? now.filter((id) => !before.has(id)) : [];
    if (!added.length) return;
    setRecent((r) => [...r, ...added]);
    timers.current.push(window.setTimeout(() => setRecent((r) => r.filter((x) => !added.includes(x))), 3400));
  }, [ids]);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);
  if (reduced) return null;
  const items: ToastItem[] = view.events
    .filter((e) => (e.kind === 'you' ? recent.includes(e.id) : e.at >= 0 && ['online', 'waitlist', 'voice', 'missed'].includes(e.kind) && view.t - e.at < 3400))
    .slice(-2)
    .map((e) => ({
      id: e.id,
      icon: eventIcon(e.kind).icon,
      tone: eventIcon(e.kind).tone,
      title: t(e.kind),
      body: text(e),
      leaving: e.kind !== 'you' && view.t - e.at >= 2900,
    }));
  return <ToastStack items={items} placement={placement} />;
}

function NextUp({ limit = 3 }: { limit?: number }) {
  const t = useTranslations('demoClinic');
  const { view } = useClinic();
  const { fmt, patient, treatment, proShort } = useClinicText();
  const list = view.appts.filter((a) => a.start > view.clock && a.status !== 'freed').slice(0, limit);
  return (
    <Card className="p-[0.85em]">
      <h3 className="demo-card-title">{t('today.next')}</h3>
      <ul className="mt-[0.5em] divide-y divide-[var(--demo-line)]">
        {list.map((a) => (
          <li key={`${a.key}-${a.version}`} className="flex items-center gap-[0.6em] py-[0.45em]">
            <span className="demo-num w-[3.2em] shrink-0 text-[0.72em] font-semibold text-[var(--demo-muted)]">{fmt.time(a.start)}</span>
            <ProAvatar pro={a.pro} className="text-[0.7em]" />
            <span className="min-w-0 flex-1 leading-[1.2]">
              <span className="block truncate text-[0.8em] font-semibold">{patient(a.patient)}</span>
              <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">
                {treatment(a.treatment)} · {proShort(a.pro)}
              </span>
            </span>
            <Pill tone={STATUS[a.status].tone}>{t(`status.${a.status}`)}</Pill>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LiveCallCard({ compact }: { compact?: boolean }) {
  const t = useTranslations('demoClinic');
  const { view, go } = useClinic();
  const { patient } = useClinicText();
  const before = view.t < STORY.callStart;
  const phase = view.call.phase;
  return (
    <VoiceCall
      variant="compact"
      state={view.call}
      caller={phase === 'idle' ? t('call.agent') : phase === 'ended' ? patient('julian') : CALLER_NUMBER}
      callerSub={phase === 'idle' ? undefined : t('call.newPatient')}
      agent={t('call.agent')}
      agentTag={t('call.agentTag')}
      callerTag={t('call.callerTag')}
      label={t('call.label')}
      announce={false}
      onOpen={() => go('calls')}
      openLabel={before ? t('call.openIdle') : t('call.open')}
      sent={view.call.phase === 'ended' ? t('call.sent') : false}
      className={compact ? 'clinic-callcard' : ''}
      tour="reception"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Phone                                                                */
/* ------------------------------------------------------------------ */
export function PhoneToday() {
  const t = useTranslations('demoClinic.today');
  const { view, go, openSite } = useClinic();
  const { day } = useClinicText();
  const feed = useFeedItems(4);
  const stats = dayStats(view.appts);
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.2em]">
      <ViewHead title={t('greeting')} sub={day(3, 'long')} />
      <RecoveredCard compact onOpen={() => go('recovered')} />
      <div className="grid grid-cols-2 gap-[0.55em]">
        <Card className="p-[0.75em]">
          <p className="text-[0.66em] text-[var(--demo-muted)]">{t('appointments')}</p>
          <p className="demo-display mt-[0.15em] text-[1.9em]">
            <Readout value={stats.count} />
          </p>
          <Meter value={stats.occupancy} className="mt-[0.5em]" />
          <p className="mt-[0.35em] text-[0.62em] text-[var(--demo-muted)]">{t('occupancy', { pct: Math.round(stats.occupancy * 100) })}</p>
        </Card>
        <Card className="p-[0.75em]">
          <p className="text-[0.66em] text-[var(--demo-muted)]">{t('confirmed')}</p>
          <p className="demo-display mt-[0.15em] text-[1.9em]">
            <Readout value={stats.confirmed} />
          </p>
          <p className="mt-[0.5em] text-[0.62em] text-[var(--demo-muted)]">{t('pending', { count: stats.pending })}</p>
        </Card>
      </div>
      <LiveCallCard compact />
      <NextUp />
      <Card className="p-[0.85em]">
        <ActivityFeed title={t('activity')} items={feed} />
      </Card>
      <button type="button" onClick={openSite} className="clinic-sitecard" data-tour="booking">
        <span className="clinic-sitecard-icon" aria-hidden>
          <Globe strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1 text-left leading-[1.25]">
          <span className="block text-[0.82em] font-semibold">{t('siteTitle')}</span>
          <span className="block truncate text-[0.66em] text-[var(--demo-muted)]">{SITE_URL}</span>
        </span>
        <ChevronRight aria-hidden className="size-[1.1em] shrink-0 text-[var(--demo-muted)]" strokeWidth={1.8} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Laptop                                                               */
/* ------------------------------------------------------------------ */
export function LaptopToday() {
  const t = useTranslations('demoClinic');
  const { view, go } = useClinic();
  const { fmt, proShort, t: tc } = useClinicText();
  const toEvent = useApptEvent();
  const feed = useFeedItems(4);
  const stats = dayStats(view.appts);
  const callsToday = 22 + (view.t >= STORY.callStart ? 1 : 0);

  return (
    <div className="flex flex-col gap-[0.9em]">
      <div className="grid grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(0,1fr))] gap-[0.7em]">
        <RecoveredCard onOpen={() => go('recovered')} />
        <Kpi
          label={t('today.appointments')}
          value={stats.count}
          suffix={t('today.occupancyShort', { pct: Math.round(stats.occupancy * 100) })}
          hint={<Meter value={stats.occupancy} className="mt-[0.2em]" />}
        />
        <Kpi label={t('today.confirmed')} value={stats.confirmed} hint={t('today.pending', { count: stats.pending })} />
        <Kpi label={t('today.calls')} value={callsToday} hint={t('today.callsHint')} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_15.5em] items-start gap-[0.8em]">
        <Card className="p-[0.75em] pb-[0.4em]" tour="agenda">
          <div className="mb-[0.6em] flex items-center justify-between gap-[0.6em] px-[0.2em]">
            <h3 className="demo-card-title">{t('today.agendaTitle')}</h3>
            <button type="button" onClick={() => go('agenda')} className="clinic-link">
              {t('today.openAgenda')}
            </button>
          </div>
          <Calendar
            label={t('agenda.label')}
            columns={PROS.map((p) => ({ id: p.id, label: proShort(p.id), sub: tc(`specialties.${p.specialty}`), mark: <ProAvatar pro={p.id} className="text-[0.66em]" /> }))}
            start={DAY_START}
            end={DAY_END}
            step={STEP}
            events={view.appts.map(toEvent)}
            now={view.clock}
            formatTime={fmt.time}
            formatGutter={fmt.gutter}
            rowHeight="1.92em"
            gutter="3em"
          />
        </Card>
        <div className="flex flex-col gap-[0.8em]">
          <div className="flex flex-col gap-[0.45em]">
            <LiveCallCard />
            {view.call.phase === 'ended' ? <CallOutcome compact /> : null}
          </div>
          <Card className="p-[0.85em]">
            <ActivityFeed title={t('today.activity')} items={feed} />
          </Card>
        </div>
      </div>
    </div>
  );
}
