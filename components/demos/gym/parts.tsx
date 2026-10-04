'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChevronsUp,
  DoorOpen,
  Flame,
  Globe,
  Medal,
  Power,
  PowerOff,
  ScanLine,
  Send,
  Sparkles,
  Target,
  TriangleAlert,
  Trophy,
  UserCheck,
  UserX,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, Switch, ToastStack, type FeedItem, type Tone, type ToastItem } from '../kit';
import { memberById, tint, type MemberId } from './model';
import { act, isFreshEvent, isOffNow, storyClockAt, type EventKind, type GymEvent } from './story';
import { useGym, useGymText } from './hooks';

/** Órbita's mark: a planet on a tilted orbit with its moon. */
export function OrbitaMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(-28 12 12)" />
      <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
      <circle cx="19.9" cy="7.6" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MemberAvatar({ id, className = '' }: { id: MemberId; className?: string }) {
  const m = memberById(id);
  const c = tint(m.tint);
  return <Avatar initials={m.initials} color={`color-mix(in oklab, ${c} 24%, #14161B)`} ink={c} className={`gym-avatar ${className}`} />;
}

/** Owner section header: mono index + condensed caps title + one line. */
export function HudHead({ index, label, title, sub, aside, className = '' }: { index: string; label: string; title: ReactNode; sub?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={`gym-head ${className}`}>
      <div className="min-w-0">
        <p className="gym-index">
          <span>{index}</span>
          {label}
        </p>
        <h2 className="gym-title demo-display">{title}</h2>
        {sub ? <p className="gym-sub">{sub}</p> : null}
      </div>
      {aside ? <div className="gym-head-aside">{aside}</div> : null}
    </div>
  );
}

/** Segmented progress (missions): one block per step, lit when done. */
export function Segments({ value, goal, className = '' }: { value: number; goal: number; className?: string }) {
  return (
    <span aria-hidden className={`gym-segs ${className}`} style={{ '--segs': goal } as CSSProperties}>
      {Array.from({ length: goal }, (_, i) => (
        <span key={i} data-on={i < value ? '' : undefined} />
      ))}
    </span>
  );
}

export { storyClockAt };

const EVENT: Record<EventKind, { icon: LucideIcon; tone: Tone }> = {
  flag: { icon: TriangleAlert, tone: 'bad' },
  sent: { icon: Send, tone: 'accent' },
  off: { icon: PowerOff, tone: 'warn' },
  on: { icon: Power, tone: 'accent' },
  booked: { icon: CalendarCheck, tone: 'accent' },
  declined: { icon: CalendarClock, tone: 'warn' },
  trial: { icon: Globe, tone: 'info' },
  back: { icon: DoorOpen, tone: 'ok' },
  book2: { icon: CalendarPlus, tone: 'accent' },
  checkin2: { icon: ScanLine, tone: 'ok' },
  mission: { icon: Target, tone: 'accent' },
  newClass: { icon: Sparkles, tone: 'accent' },
  levelup: { icon: ChevronsUp, tone: 'accent' },
  league: { icon: Trophy, tone: 'accent2' },
  trialIn: { icon: UserCheck, tone: 'info' },
  churn: { icon: UserX, tone: 'bad' },
  manual: { icon: Send, tone: 'accent' },
  friend: { icon: Users, tone: 'accent' },
  aCheckin: { icon: Flame, tone: 'neutral' },
  aMission: { icon: Target, tone: 'neutral' },
  aBadge: { icon: Medal, tone: 'neutral' },
};

/** Human sentence for an event (feed, toasts, announcements). */
export function useEventText() {
  const { t, short, session } = useGymText();
  return (e: GymEvent): string => {
    const values = {
      name: e.member === 'you' ? t('people.you') : e.member ? short(e.member) : '',
      class: session(e.session),
      count: e.n ?? 0,
      level: e.n ?? 0,
      rank: e.n ?? 0,
    };
    if ((e.kind === 'booked' || e.kind === 'book2') && e.via) return t(`feed.${e.kind}.${e.via === 'wa' ? 'wa' : 'app'}`, values);
    if (e.kind === 'aCheckin') return t('feed.aCheckin', { ...values, count: e.member && e.member !== 'you' ? memberById(e.member).streak : 0 });
    if (e.kind === 'trial' && e.member === 'you') return t('feed.trialYou', values);
    return t(`feed.${e.kind}`, values);
  };
}

/** Feed rows (newest first). */
export function useFeedItems(limit = 6): FeedItem[] {
  const { view } = useGym();
  const { fmt, dayShort } = useGymText();
  const text = useEventText();
  return [...view.events]
    .reverse()
    .slice(0, limit)
    .map((e) => {
      const at = storyClockAt(view, e.at);
      return {
        id: e.id,
        ...EVENT[e.kind],
        text: text(e),
        time: at.day === view.day ? fmt.time(at.clock) : dayShort(at.day),
        fresh: isFreshEvent(view, e),
      };
    });
}

const TOASTED: EventKind[] = ['booked', 'trial', 'back', 'levelup', 'league', 'churn'];

/**
 * Toasts: story events while a beat plays (they leave before it ends), and the visitor's own
 * latest action (`flash`, cleared by the timer their click started). Decorative: the Announcer speaks.
 */
export function GymToasts({ placement }: { placement: 'top' | 'bottom-right' }) {
  const { view, reduced, flash } = useGym();
  const text = useEventText();
  const t = useTranslations('demoGym.toast');
  if (reduced) return null;
  const items: ToastItem[] = view.events
    .filter((e) => TOASTED.includes(e.kind) && isFreshEvent(view, e, 3400))
    .slice(-2)
    .map((e) => ({ id: e.id, icon: EVENT[e.kind].icon, tone: EVENT[e.kind].tone, title: t(e.kind), body: text(e), leaving: view.t - e.at >= 2900 }));
  if (flash) items.push({ id: `flash-${flash.id}`, icon: EVENT[flash.kind].icon, tone: EVENT[flash.kind].tone, title: t(flash.kind), body: text(flash) });
  return <ToastStack items={items.slice(-2)} placement={placement} />;
}

/** One polite announcement of the latest change (one instance per pair). */
export function Announcer() {
  const { view, announce, flash } = useGym();
  const text = useEventText();
  if (!announce) return null;
  const latest = flash ?? [...view.events].reverse().find((e) => isFreshEvent(view, e));
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {latest ? text(latest) : ''}
    </p>
  );
}

/** The win-back automation's on/off switch. */
export function WinbackSwitch({ id }: { id: string }) {
  const { state, run } = useGym();
  const on = !isOffNow(state.off);
  return (
    <span className="gym-switch" data-off={on ? undefined : ''}>
      <span id={id} className="gym-switch-label">
        <WinbackState on={on} />
      </span>
      <Switch checked={on} onChange={() => run(act.toggleWin(), 'toggle')} labelledBy={id} />
    </span>
  );
}
function WinbackState({ on }: { on: boolean }) {
  const t = useTranslations('demoGym.win');
  return <>{on ? t('on') : t('off')}</>;
}

/** "Mon 5 · 9:04" with the three days of the time-lapse as ticks. */
export function DayDial({ compact = false }: { compact?: boolean }) {
  const { view } = useGym();
  const { fmt, dayShort, dayNum, t } = useGymText();
  return (
    <span className="gym-dial" data-compact={compact ? '' : undefined} data-cut={view.dayCut !== null ? '' : undefined}>
      <span className="gym-dial-days" aria-hidden>
        {[0, 1, 3].map((d) => (
          <span key={d} data-on={d === view.day ? '' : undefined} data-past={d < view.day ? '' : undefined}>
            {dayShort(d).slice(0, compact ? 1 : 3)}
          </span>
        ))}
      </span>
      <span className="gym-dial-now">
        <span className="sr-only">{t('top.timelapse')} </span>
        {dayShort(view.day)} {dayNum(view.day)} · <span className="demo-num">{fmt.time(view.clock)}</span>
      </span>
    </span>
  );
}
