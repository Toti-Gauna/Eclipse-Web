'use client';

import { useTranslations } from 'next-intl';
import { Flame, Send, Smartphone, Target, Ticket, TrendingDown, TrendingUp, Trophy, UserPlus, UserRoundCheck, type LucideIcon } from 'lucide-react';
import { ME, missionById } from './data';
import { isFresh, type EventKind, type GymEvent } from './sim';
import { useGym } from './context';
import { useMissionName } from './ui';

export const EVENT_STYLE: Record<EventKind, { icon: LucideIcon; cls: string }> = {
  auto: { icon: Send, cls: 'bg-[var(--gym-neutral-bg)] text-[var(--demo-muted)]' },
  checkin: { icon: Flame, cls: 'bg-[var(--gym-flame-bg)] text-[var(--gym-flame-ink)]' },
  return: { icon: UserRoundCheck, cls: 'bg-[var(--gym-ok-bg)] text-[var(--gym-ok)]' },
  mission: { icon: Target, cls: 'bg-[var(--demo-accent-soft)] text-[var(--gym-accent-ink)]' },
  bonus: { icon: Trophy, cls: 'bg-[var(--gym-amber)] text-[#05050a]' },
  invite: { icon: Ticket, cls: 'bg-[var(--demo-accent-soft)] text-[var(--gym-accent-ink)]' },
  friend: { icon: UserPlus, cls: 'bg-[var(--gym-new-bg)] text-[var(--gym-new)]' },
  sent: { icon: Send, cls: 'bg-[var(--gym-warn-bg)] text-[var(--gym-warn)]' },
  rankUp: { icon: TrendingUp, cls: 'bg-[var(--gym-ok-bg)] text-[var(--gym-ok)]' },
  rankDown: { icon: TrendingDown, cls: 'bg-[var(--gym-bad-bg)] text-[var(--gym-bad)]' },
};

export function EventIcon({ kind, className = '' }: { kind: EventKind; className?: string }) {
  const { icon: Icon, cls } = EVENT_STYLE[kind];
  return (
    <span aria-hidden className={`grid size-[2em] shrink-0 place-items-center rounded-full ${cls} ${className}`}>
      <Icon className="size-[1.1em]" strokeWidth={2} />
    </span>
  );
}

/** Event text as the gym's owner reads it. */
export function useOwnerText() {
  const t = useTranslations('demoGym');
  const missionName = useMissionName();
  return (e: GymEvent): string =>
    t(`activity.${e.kind}`, {
      name: t(`members.${e.member}`),
      by: e.by ? t(`members.${e.by}`) : '',
      count: e.count ?? 0,
      points: e.points ?? 0,
      rank: e.rank ?? 0,
      mission: e.mission ? missionName(e.mission) : '',
    });
}

/** Event text as the member reads it (only the member's own events). */
export function useMemberText() {
  const t = useTranslations('demoGym');
  const missionName = useMissionName();
  return (e: GymEvent): string =>
    t(`you.${e.kind}`, {
      by: e.by ? t(`members.${e.by}`) : '',
      count: e.count ?? 0,
      points: e.kind === 'friend' ? missionById('friend').reward : (e.points ?? 0),
      rank: e.rank ?? 0,
      mission: e.mission ? missionName(e.mission) : '',
    });
}

const OWNER_HIDDEN: EventKind[] = ['rankDown'];

export function ActivityFeed({ limit = 6, className = '' }: { limit?: number; className?: string }) {
  const t = useTranslations('demoGym.activity');
  const { world, state, paired } = useGym();
  const text = useOwnerText();
  const list = world.events.filter((e) => !OWNER_HIDDEN.includes(e.kind)).reverse().slice(0, limit);
  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <h3 className="flex items-center gap-[0.45em] text-[0.88em] font-semibold">
        <span aria-hidden className="gym-live-dot" />
        {t('title')}
      </h3>
      <ol className="mt-[0.65em] flex flex-col gap-[0.5em]">
        {list.map((e) => {
          const fresh = isFresh(e, state.tick);
          return (
            <li key={e.id} className={`flex items-start gap-[0.6em] ${e.at >= 0 ? 'gym-pop' : ''}`}>
              <EventIcon kind={e.kind} className="text-[0.82em]" />
              <p className="min-w-0 flex-1 pt-[0.15em] text-[0.72em] leading-[1.35]">
                {text(e)}
                {paired && e.member === ME && e.at >= 0 ? (
                  <span className="ml-[0.4em] inline-flex items-center gap-[0.25em] rounded-full bg-[var(--demo-accent-soft)] px-[0.45em] align-[0.05em] text-[0.85em] font-semibold text-[var(--gym-accent-ink)]">
                    <Smartphone aria-hidden className="size-[1em]" strokeWidth={2} />
                    {t('onPhone')}
                  </span>
                ) : null}
                {fresh ? (
                  <span className="ml-[0.4em] inline-flex rounded-full bg-[var(--gym-ok-bg)] px-[0.45em] text-[0.85em] font-semibold text-[var(--gym-ok)]">{t('justNow')}</span>
                ) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The latest thing that happened, in the laptop's top bar (visible from every
 * tab, above the fold). Decorative: the announcer speaks.
 */
export function LiveTicker({ className = '' }: { className?: string }) {
  const t = useTranslations('demoGym.activity');
  const { world, state, paired } = useGym();
  const text = useOwnerText();
  const latest = [...world.events].reverse().find((e) => !OWNER_HIDDEN.includes(e.kind));
  if (!latest) return null;
  const fresh = isFresh(latest, state.tick);
  return (
    <div aria-hidden className={`flex min-w-0 items-center ${className}`}>
      <p
        key={latest.id}
        className={`flex min-w-0 items-center gap-[0.45em] rounded-full border border-[var(--demo-line)] bg-[var(--demo-bg)] py-[0.25em] pl-[0.25em] pr-[0.7em] ${latest.at >= 0 ? 'gym-pop' : ''}`}
      >
        <EventIcon kind={latest.kind} className="text-[0.66em]" />
        <span className="truncate text-[0.7em]">{text(latest)}</span>
        {paired && latest.member === ME && latest.at >= 0 ? (
          <Smartphone className="size-[0.85em] shrink-0 text-[var(--gym-accent-ink)]" strokeWidth={2} />
        ) : null}
        {fresh ? (
          <span className="shrink-0 rounded-full bg-[var(--gym-ok-bg)] px-[0.45em] text-[0.62em] font-semibold text-[var(--gym-ok)]">{t('justNow')}</span>
        ) : null}
      </p>
    </div>
  );
}

const TOAST_PRIORITY: Partial<Record<EventKind, number>> = { bonus: 6, friend: 5, mission: 4, rankUp: 3, rankDown: 3, invite: 1 };

/** The member's own fresh events, most important first. */
function useMemberHighlights(limit: number): GymEvent[] {
  const { world, state } = useGym();
  return world.events
    .filter((e) => e.member === ME && isFresh(e, state.tick) && TOAST_PRIORITY[e.kind] !== undefined)
    // The friend's check-in already says the mission is done.
    .filter((e, _, all) => !(e.kind === 'mission' && e.mission === 'friend' && all.some((x) => x.kind === 'friend')))
    .sort((a, b) => (TOAST_PRIORITY[b.kind] ?? 0) - (TOAST_PRIORITY[a.kind] ?? 0) || b.at - a.at)
    .slice(0, limit);
}

/** Notifications that drop in on the member's app (decorative: the announcer speaks). */
export function MemberToasts() {
  const { reduced } = useGym();
  const text = useMemberText();
  const list = useMemberHighlights(1);
  // With reduced motion the clock stands still, so a toast would never leave.
  if (reduced) return null;
  return (
    <div aria-hidden className="pointer-events-none sticky top-0 z-30 h-0">
      <div className="absolute inset-x-0 top-[0.4em] flex flex-col gap-[0.35em]">
        {list.map((e, i) => (
          <div
            key={e.id}
            className="gym-toast flex items-center gap-[0.6em] rounded-[0.95em] bg-[#15151b]/95 px-[0.7em] py-[0.55em] text-white shadow-[0_0.8em_2em_-0.6em_rgb(0_0_0/0.5)]"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <EventIcon kind={e.kind} className="text-[0.78em]" />
            <p className="min-w-0 flex-1 text-[0.74em] font-medium leading-[1.35]">{text(e)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Polite, single announcement of what just changed (one per laptop+phone pair). */
export function Announcer() {
  const { world, state, announce } = useGym();
  const member = useMemberText();
  const owner = useOwnerText();
  if (!announce) return null;
  const fresh = world.events.filter((e) => isFresh(e, state.tick));
  const latest = Math.max(-1, ...fresh.map((e) => e.at));
  const message = fresh
    .filter((e) => e.at === latest)
    .map((e) => {
      if (e.member === ME) return e.kind === 'mission' && e.mission === 'friend' ? '' : member(e);
      return e.kind === 'return' || e.kind === 'sent' ? owner(e) : '';
    })
    .filter(Boolean)
    .join('. ');
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
}
