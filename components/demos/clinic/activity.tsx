'use client';

import { useTranslations } from 'next-intl';
import { CalendarClock, CalendarPlus, CalendarX2, CheckCheck, Send, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { TIMES, parseSlotKey } from './data';
import type { EventKind, SimEvent } from './sim';
import { useClinic, useFmt } from './context';

export const EVENT_STYLE: Record<EventKind, { icon: LucideIcon; cls: string }> = {
  sent: { icon: Send, cls: 'bg-[var(--clinic-done-bg)] text-[var(--demo-muted)]' },
  new: { icon: CalendarPlus, cls: 'bg-[var(--clinic-new-bg)] text-[var(--clinic-new)]' },
  confirm: { icon: CheckCheck, cls: 'bg-[var(--clinic-ok-bg)] text-[var(--clinic-ok)]' },
  cancel: { icon: CalendarX2, cls: 'bg-[var(--clinic-bad-bg)] text-[var(--clinic-bad)]' },
  reschedule: { icon: CalendarClock, cls: 'bg-[var(--clinic-warn-bg)] text-[var(--clinic-warn)]' },
  refill: { icon: Users, cls: 'bg-[var(--clinic-wait-bg)] text-[var(--clinic-wait)]' },
  you: { icon: Sparkles, cls: 'bg-[var(--clinic-amber)] text-[#05050a]' },
};

export function EventIcon({ kind, className = '' }: { kind: EventKind; className?: string }) {
  const { icon: Icon, cls } = EVENT_STYLE[kind];
  return (
    <span aria-hidden className={`grid size-[2em] shrink-0 place-items-center rounded-full ${cls} ${className}`}>
      <Icon className="size-[1.1em]" strokeWidth={2} />
    </span>
  );
}

/** Human text for an agenda event. */
export function useEventText() {
  const t = useTranslations('demoClinic');
  const fmt = useFmt();
  const { kpis } = useClinic();
  return (e: SimEvent): string => {
    const { pro, idx } = parseSlotKey(e.key);
    const values = {
      time: fmt.time(TIMES[idx]),
      pro: t(`pros.${pro}.name`),
      patient: e.patient ? t(`patients.${e.patient}`) : '',
      count: kpis.sent,
    };
    return t(`activity.${e.kind}`, values);
  };
}

/** Events that just happened (this tick or the previous one). */
export function isFresh(e: SimEvent, tick: number): boolean {
  return e.at >= 0 && tick - e.at <= 1;
}

export function ActivityFeed({ limit = 7 }: { limit?: number }) {
  const t = useTranslations('demoClinic');
  const { agenda, state } = useClinic();
  const text = useEventText();
  const list = [...agenda.events].reverse().slice(0, limit);
  return (
    <div className="flex min-h-0 flex-col">
      <h3 className="flex items-center gap-[0.45em] text-[0.9em] font-semibold">
        <span aria-hidden className="clinic-live-dot" />
        {t('activity.title')}
      </h3>
      <ol className="mt-[0.7em] flex flex-col gap-[0.55em]">
        {list.map((e) => {
          const fresh = isFresh(e, state.tick);
          return (
            <li key={e.id} className={`flex items-start gap-[0.6em] ${e.at >= 0 ? 'clinic-pop' : ''}`}>
              <EventIcon kind={e.kind} className="text-[0.85em]" />
              <p className="min-w-0 flex-1 pt-[0.15em] text-[0.74em] leading-[1.35]">
                {text(e)}
                {fresh ? (
                  <span className="ml-[0.4em] inline-flex rounded-full bg-[var(--clinic-ok-bg)] px-[0.45em] text-[0.85em] font-semibold text-[var(--clinic-ok)]">
                    {t('activity.justNow')}
                  </span>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Dark notification that drops in when something happens live (decorative: the announcer speaks). */
export function LiveToast() {
  const { agenda, state, reduced } = useClinic();
  const text = useEventText();
  // With reduced motion the clock stands still, so a toast would never leave.
  const toast = reduced ? undefined : [...agenda.events].reverse().find((e) => isFresh(e, state.tick) && e.kind !== 'you' && e.kind !== 'sent');
  return (
    <div aria-hidden className="pointer-events-none sticky top-0 z-30 h-0">
      {toast ? (
        <div
          key={toast.id}
          className="clinic-toast absolute inset-x-0 top-[0.4em] flex items-center gap-[0.6em] rounded-[0.95em] bg-[#15151b]/95 px-[0.7em] py-[0.6em] text-white shadow-[0_0.8em_2em_-0.6em_rgb(0_0_0/0.5)]"
        >
          <EventIcon kind={toast.kind} className="text-[0.8em]" />
          <p className="min-w-0 flex-1 text-[0.74em] leading-[1.35]">{text(toast)}</p>
        </div>
      ) : null}
    </div>
  );
}

/** Polite, single announcement of the latest live change (one per laptop+phone pair). */
export function Announcer() {
  const { agenda, state, announce } = useClinic();
  const text = useEventText();
  if (!announce) return null;
  const latest = [...agenda.events].reverse().find((e) => isFresh(e, state.tick));
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {latest ? text(latest) : ''}
    </p>
  );
}
