'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { useSound } from '@/components/sound/SoundContext';
import { CalendarCheck, CheckCheck, Clock3, Headset, MoonStar, PhoneForwarded, type LucideIcon } from 'lucide-react';
import { Card, Kpi, Pill, Switch, VoiceCall, type Tone } from '../../kit';
import { CALLER_NUMBER, CALL_LOG, CALLS_BEFORE, STORY, TODAY } from '../data';
import { act, isOffNow } from '../story';
import { useClinic } from '../context';
import { ApptCard } from '../scripts';
import { useClinicText, ViewHead } from '../ui';

/** What the AI receptionist did on Julián's call (inside or under the call card). */
export function CallOutcome({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('demoClinic.call');
  const { view } = useClinic();
  const { fmt, treatment, pro, patient } = useClinicText();
  const target = view.callTarget;
  if (!target) return null;
  return (
    <div className={`clinic-outcome ${compact ? 'clinic-outcome-compact' : ''}`}>
      <p className="clinic-outcome-title">
        <CalendarCheck aria-hidden strokeWidth={1.9} />
        {t('outcome', { name: patient('julian') })}
      </p>
      <ApptCard day={TODAY} time={fmt.time(target.start)} lines={[treatment('cleaning'), pro(target.pro)]} />
      {compact ? (
        <p className="clinic-outcome-sent">
          <CheckCheck aria-hidden strokeWidth={2} />
          {t('sent')}
        </p>
      ) : null}
    </div>
  );
}

function AgentSwitch() {
  const t = useTranslations('demoClinic.calls');
  const { state, store, active } = useClinic();
  const { play } = useSound();
  const id = useId();
  const on = !isOffNow(state.off.voice);
  return (
    <div className="clinic-switchrow">
      <span className="min-w-0 flex-1 leading-[1.25]">
        <span id={`${id}-l`} className="block text-[0.76em] font-semibold">
          {t('switch')}
        </span>
        <span id={`${id}-d`} className="block text-[0.64em] text-[var(--demo-muted)]">
          {on ? t('switchOn') : t('switchOff')}
        </span>
      </span>
      <Switch
        checked={on}
        labelledBy={`${id}-l`}
        describedBy={`${id}-d`}
        onChange={() => {
          store.update(act.toggle('voice'));
          store.engage();
          if (active) play('toggle');
        }}
      />
    </div>
  );
}

/** The live call, full size (phone tab / laptop console). */
function LiveCall() {
  const t = useTranslations('demoClinic');
  const { view, announce } = useClinic();
  const { patient } = useClinicText();
  const known = view.call.phase === 'ended' || (view.call.current >= 4 && view.call.phase === 'live');
  return (
    <VoiceCall
      state={view.call}
      caller={known ? patient('julian') : CALLER_NUMBER}
      callerSub={t('call.newPatient')}
      agent={t('call.agent')}
      agentTag={t('call.agentTag')}
      callerTag={t('call.callerTag')}
      label={t('call.label')}
      announce={announce}
      outcome={view.callMissed ? <p className="clinic-missed">{t('call.missedNote')}</p> : <CallOutcome />}
      sent={view.callMissed ? false : t('call.sent')}
      className="clinic-livecall-card"
    />
  );
}

const OUTCOME: Record<string, { tone: Tone; icon: LucideIcon }> = {
  answered: { tone: 'info', icon: CheckCheck },
  rescheduled: { tone: 'ok', icon: CalendarCheck },
  booked: { tone: 'ok', icon: CalendarCheck },
  handoff: { tone: 'warn', icon: PhoneForwarded },
  live: { tone: 'accent', icon: Headset },
  missed: { tone: 'bad', icon: PhoneForwarded },
};

function CallLog({ limit = 5 }: { limit?: number }) {
  const t = useTranslations('demoClinic.calls');
  const { view } = useClinic();
  const { fmt, patient, proShort } = useClinicText();
  const liveRow =
    view.t >= STORY.callStart
      ? {
          id: 'live',
          time: fmt.time(view.clock),
          caller: view.call.phase === 'ended' ? patient('julian') : CALLER_NUMBER,
          topic: t('topics.cleaningToday'),
          outcome: view.callMissed ? 'missed' : view.call.phase === 'ended' ? 'booked' : 'live',
        }
      : null;
  const rows = [
    ...(liveRow ? [liveRow] : []),
    ...CALL_LOG.map((c) => ({
      id: c.id,
      time: fmt.time(c.time),
      caller: c.caller.startsWith('unknown') ? t(`callers.${c.caller}`) : patient(c.caller as 'lola'),
      topic: t(`topics.${c.topic}`),
      outcome: c.outcome as string,
    })),
  ].slice(0, limit);
  return (
    <Card className="p-[0.85em]">
      <h3 className="demo-card-title">{t('logTitle')}</h3>
      <ul className="mt-[0.4em] divide-y divide-[var(--demo-line)]">
        {rows.map((r) => {
          const o = OUTCOME[r.outcome];
          return (
            <li key={r.id} className={`flex items-center gap-[0.6em] py-[0.5em] ${r.id === 'live' ? 'demo-pop' : ''}`}>
              <span className="demo-num w-[3.1em] shrink-0 text-[0.68em] font-semibold text-[var(--demo-muted)]">{r.time}</span>
              <span className="min-w-0 flex-1 leading-[1.25]">
                <span className="block truncate text-[0.76em] font-semibold">{r.caller}</span>
                <span className="block truncate text-[0.64em] text-[var(--demo-muted)]">{r.topic}</span>
              </span>
              <Pill tone={o.tone} icon={o.icon}>
                {t(`outcomes.${r.outcome}`, { pro: proShort('lucia') })}
              </Pill>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AgentCard() {
  const t = useTranslations('demoClinic.calls.agentCard');
  const rows: { icon: LucideIcon; key: string }[] = [
    { icon: Headset, key: 'voice' },
    { icon: MoonStar, key: 'hours' },
    { icon: CalendarCheck, key: 'can' },
    { icon: PhoneForwarded, key: 'handoff' },
  ];
  return (
    <Card className="p-[0.85em]">
      <h3 className="demo-card-title">{t('title')}</h3>
      <dl className="mt-[0.5em] flex flex-col gap-[0.55em]">
        {rows.map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-start gap-[0.55em]">
            <Icon aria-hidden className="mt-[0.1em] size-[1em] shrink-0 text-[var(--demo-accent-text)]" strokeWidth={1.7} />
            <div className="min-w-0 leading-[1.3]">
              <dt className="text-[0.62em] font-semibold uppercase tracking-[0.08em] text-[var(--demo-muted)]">{t(`${key}.label`)}</dt>
              <dd className="text-[0.74em]">{t(`${key}.value`)}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function useCallStats() {
  const { view } = useClinic();
  const started = view.t >= STORY.callStart;
  const booked = view.events.some((e) => e.kind === 'voice');
  return {
    total: CALLS_BEFORE.total + (started ? 1 : 0),
    booked: CALLS_BEFORE.booked + (booked ? 1 : 0),
    afterHours: CALLS_BEFORE.afterHours,
    avg: CALLS_BEFORE.avgSec * 1000,
  };
}

export function PhoneCalls() {
  const t = useTranslations('demoClinic.calls');
  const s = useCallStats();
  return (
    <div className="flex flex-col gap-[0.8em] pt-[0.2em]">
      <ViewHead title={t('title')} sub={t('subtitle')} />
      <LiveCall />
      <div className="grid grid-cols-2 gap-[0.55em]">
        <Kpi label={t('kpis.total')} value={s.total} />
        <Kpi label={t('kpis.booked')} value={s.booked} />
      </div>
      <Card className="p-[0.75em]">
        <AgentSwitch />
      </Card>
      <CallLog limit={4} />
    </div>
  );
}

export function LaptopCalls() {
  const t = useTranslations('demoClinic.calls');
  const { fmt } = useClinicText();
  const s = useCallStats();
  return (
    <div className="flex flex-col gap-[0.9em]">
      <ViewHead
        title={t('title')}
        sub={t('subtitle')}
        aside={
          <Card className="w-[17em] px-[0.75em] py-[0.55em]">
            <AgentSwitch />
          </Card>
        }
      />
      <div className="grid grid-cols-4 gap-[0.7em]">
        <Kpi label={t('kpis.total')} value={s.total} hint={t('kpis.totalHint')} />
        <Kpi label={t('kpis.booked')} value={s.booked} emphasis hint={t('kpis.bookedHint')} />
        <Kpi label={t('kpis.afterHours')} value={s.afterHours} hint={t('kpis.afterHoursHint')} />
        <Kpi label={t('kpis.avg')} value={s.avg} format={(ms) => fmt.duration(ms)} hint={t('kpis.avgHint')} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] items-start gap-[0.8em]">
        <LiveCall />
        <div className="flex flex-col gap-[0.8em]">
          <CallLog />
          <AgentCard />
        </div>
      </div>
      <p className="clinic-footnote">
        <Clock3 aria-hidden strokeWidth={1.7} />
        {t('footnote')}
      </p>
    </div>
  );
}
