'use client';

import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  AudioLines,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  Check,
  CheckCheck,
  Globe,
  Hourglass,
  MoonStar,
  PhoneIncoming,
  PhoneMissed,
  Send,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, useDemoFormat, upperFirst, type CalendarEvent, type FeedItem, type Tone } from '../kit';
import { MARTINA_OPTIONS, REMINDERS_TODAY, WAITLIST_OFFERED, dayDate, proById, type ProId, type Status } from './data';
import type { Appt, ClinicEvent } from './story';
import { useClinic } from './context';

/** Clínica Aurora's mark: the sun rising over a calm horizon. */
export function AuroraMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <path d="M3 16.2h18" />
      <path d="M7.2 16.2a4.8 4.8 0 0 1 9.6 0" />
      <path d="M12 6.4v2.2M6.1 9.1l1.4 1.3M17.9 9.1l-1.4 1.3" />
      <path d="M7.5 19.4h9" opacity={0.55} />
    </svg>
  );
}

export function ProAvatar({ pro, className = '' }: { pro: ProId; className?: string }) {
  const p = proById(pro);
  return <Avatar initials={p.initials} color={p.color} ink={p.ink} className={className} />;
}

/** Status → icon + tone (pills, calendar marks, lists). */
export const STATUS: Record<Status, { icon: LucideIcon | null; tone: Tone }> = {
  done: { icon: Check, tone: 'neutral' },
  now: { icon: null, tone: 'accent' },
  confirmed: { icon: CheckCheck, tone: 'ok' },
  reminded: { icon: Send, tone: 'warn' },
  new: { icon: Globe, tone: 'info' },
  freed: { icon: Hourglass, tone: 'bad' },
  waitlist: { icon: Users, tone: 'accent2' },
  voice: { icon: AudioLines, tone: 'accent' },
  you: { icon: Sparkles, tone: 'accent2' },
};

export function StatusMark({ status }: { status: Status }) {
  const { icon: Icon } = STATUS[status];
  if (!Icon) return <span className="clinic-now-dot demo-loop" />;
  return <Icon strokeWidth={2.2} />;
}

/** Names, treatments and slot labels in the current locale (stable per locale). */
export function useClinicText() {
  const t = useTranslations('demoClinic');
  const fmt = useDemoFormat();
  return useMemo(() => {
    const patient = (id: Appt['patient'] | undefined) => (id ? t(`patients.${id}`) : '');
    const pro = (id: ProId) => t(`pros.${id}.name`);
    const proShort = (id: ProId) => t(`pros.${id}.short`);
    const treatment = (id: string) => t(`treatments.${id}`);
    const day = (index: number, style: 'short' | 'long' = 'short') =>
      upperFirst(fmt.date(dayDate(index), style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric' }).replace('.', ''));
    const option = (i: number) => {
      const o = MARTINA_OPTIONS[i];
      return `${day(o.day)} · ${fmt.time(o.start)}`;
    };
    return { t, fmt, patient, pro, proShort, treatment, day, option };
  }, [t, fmt]);
}

/** An appointment as a kit Calendar event. */
export function useApptEvent() {
  const { t, patient, treatment, fmt, proShort } = useClinicText();
  const { view } = useClinic();
  return (a: Appt): CalendarEvent => {
    const freed = a.status === 'freed';
    const title = freed ? t('agenda.freedTitle') : patient(a.patient);
    const sub = freed ? t('agenda.freedSub', { name: patient(a.patient) }) : treatment(a.treatment);
    return {
      id: a.key,
      column: a.pro,
      start: a.start,
      end: a.end,
      title,
      sub,
      tone: freed ? 'bad' : a.status === 'you' ? 'accent2' : proById(a.pro).tone,
      status: <StatusMark status={a.status} />,
      state: a.status === 'done' ? 'done' : freed ? 'ghost' : a.status === 'you' ? 'mine' : 'default',
      fresh: a.changedAt >= 0 && view.t - a.changedAt < 2200,
      version: a.version,
      label: `${fmt.time(a.start)}, ${proShort(a.pro)}: ${title}, ${sub}. ${t(`status.${a.status}`)}`,
    };
  };
}

const EVENT_ICON: Record<ClinicEvent['kind'], { icon: LucideIcon; tone: Tone }> = {
  afterHours: { icon: MoonStar, tone: 'accent' },
  sent: { icon: Send, tone: 'neutral' },
  online: { icon: Globe, tone: 'info' },
  confirm: { icon: CheckCheck, tone: 'ok' },
  cancel: { icon: CalendarX2, tone: 'bad' },
  offer: { icon: Users, tone: 'warn' },
  waitlist: { icon: Users, tone: 'accent2' },
  reschedule: { icon: CalendarClock, tone: 'warn' },
  call: { icon: PhoneIncoming, tone: 'accent' },
  voice: { icon: CalendarCheck, tone: 'accent' },
  missed: { icon: PhoneMissed, tone: 'bad' },
  you: { icon: Sparkles, tone: 'accent2' },
};
export const eventIcon = (kind: ClinicEvent['kind']) => EVENT_ICON[kind];

/** Human sentence for an event (feed, toasts, announcements). */
export function useEventText() {
  const { t, fmt, patient, proShort, treatment, option } = useClinicText();
  return (e: ClinicEvent): string =>
    t(`feed.${e.kind}`, {
      patient: patient(e.patient),
      time: e.start !== undefined ? fmt.time(e.start) : '',
      pro: e.pro ? proShort(e.pro) : '',
      treatment: e.treatment ? treatment(e.treatment) : '',
      slot: e.option !== undefined ? option(e.option) : '',
      count: e.kind === 'sent' ? REMINDERS_TODAY.sent : WAITLIST_OFFERED,
    });
}

/** When an event happened, as a clinic clock label. */
export function useEventTime() {
  const { fmt } = useClinicText();
  return (e: ClinicEvent) => fmt.time(e.clock ?? (e.at < 0 ? 540 : 581 + Math.floor(e.at / 2500)));
}

export function useFeedItems(limit = 6): FeedItem[] {
  const { view } = useClinic();
  const text = useEventText();
  const time = useEventTime();
  return [...view.events]
    .reverse()
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      ...EVENT_ICON[e.kind],
      text: text(e),
      time: time(e),
      fresh: e.at >= 0 && view.t - e.at < 2600,
    }));
}

/** One polite announcement of the latest live change (one instance per pair). */
export function Announcer() {
  const { view, announce } = useClinic();
  const text = useEventText();
  if (!announce) return null;
  const latest = [...view.events].reverse().find((e) => e.at >= 0 && view.t - e.at < 2600);
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {latest ? text(latest) : ''}
    </p>
  );
}

/** Clinic section header: serif title + one quiet line. */
export function ViewHead({ title, sub, aside, className = '' }: { title: ReactNode; sub?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={`clinic-head ${className}`}>
      <div className="min-w-0">
        <h2 className="clinic-title demo-display">{title}</h2>
        {sub ? <p className="clinic-sub">{sub}</p> : null}
      </div>
      {aside ? <div className="clinic-head-aside">{aside}</div> : null}
    </div>
  );
}
