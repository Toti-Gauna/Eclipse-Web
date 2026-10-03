'use client';

import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  CircleSlash,
  DoorOpen,
  Globe,
  Hourglass,
  KeyRound,
  ListChecks,
  MessageCircle,
  MessageSquareText,
  Newspaper,
  Send,
  Signpost,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { ToastStack, upperFirst, useDemoFormat, type FeedItem, type Tone, type ToastItem } from '../kit';
import { CLOCK_START, STAGES, dayDate, listingById, type ListingId, type PersonId, type Source, type Stage, type ZoneId } from './data';
import { LATE_MINUTES, clockMinutes, type Clock, type EstateEvent, type LeadCard } from './story';
import { useEstate } from './context';

/** Lumen's mark: light falling through a square window. */
export function LumenMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="square">
      <path d="M4.5 4.5h15v15h-15z" />
      <path d="M12 4.5v15M4.5 12h15" opacity={0.45} />
      <path d="M4.5 19.5 15.5 8.5" strokeWidth={2.4} />
    </svg>
  );
}

export const SOURCE_ICON: Record<Source | 'site', LucideIcon> = {
  web: Globe,
  whatsapp: MessageCircle,
  portal: Newspaper,
  sign: Signpost,
  site: CalendarCheck,
};

/** Names, places, prices and dates in the current locale (stable per locale). */
export function useEstateText() {
  const t = useTranslations('demoRealEstate');
  const fmt = useDemoFormat();
  return useMemo(() => {
    const person = (id: PersonId | 'you') => t(`people.${id}`);
    /** "Carolina M." (cards, narrow columns). */
    const short = (id: PersonId | 'you') => {
      const [first, ...rest] = person(id).split(' ');
      return rest.length ? `${first} ${rest[rest.length - 1].charAt(0)}.` : first;
    };
    const zone = (id: ZoneId) => t(`zones.${id}`);
    const price = (n: number) => t('listing.price', { amount: fmt.num(n) });
    const kind = (id: ListingId) => t(`kinds.${listingById(id).kind}`);
    const title = (id: ListingId) => {
      const l = listingById(id);
      return t('listing.title', { kind: t(`kinds.${l.kind}`), zone: zone(l.zone) });
    };
    const rooms = (id: ListingId, short = false) => {
      const l = listingById(id);
      return t(short ? 'listing.roomsShort' : 'listing.rooms', { rooms: l.rooms, beds: l.beds });
    };
    /** "Vie 9" (short) · "viernes 9" (mid, inside sentences) · "Viernes 9 de octubre" (long). */
    const day = (d: number, style: 'short' | 'mid' | 'long' = 'short') => {
      const date = dayDate(d);
      if (style === 'long') return upperFirst(fmt.date(date, { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', ''));
      // Weekday first in every locale ("Vie 9", "Fri 9", "Sex 9"; mid: "viernes 9", "Friday 9").
      const weekday = fmt.date(date, { weekday: style === 'mid' ? 'long' : 'short' }).replace('.', '');
      const s = `${weekday} ${fmt.date(date, { day: 'numeric' })}`;
      return style === 'mid' && fmt.locale !== 'en' ? s : upperFirst(s);
    };
    const slot = (s: { day: number; start: number }) => t('slot', { day: day(s.day), time: fmt.time(s.start) });
    const slotLong = (s: { day: number; start: number }) => t('slotLong', { day: day(s.day, 'mid'), time: fmt.time(s.start) });
    /** A duration in minutes: "12 min" · "9 h 32 min". */
    const wait = (minutes: number) =>
      minutes >= 60 ? t('time.late', { hours: Math.floor(minutes / 60), minutes: minutes % 60 }) : t('time.minutes', { minutes: Math.max(1, minutes) });
    const late = wait(LATE_MINUTES);
    const clock = (c: Clock) => fmt.time(c.min);
    return { t, fmt, person, short, zone, price, kind, title, rooms, day, slot, slotLong, wait, late, clock };
  }, [t, fmt]);
}
export type EstateText = ReturnType<typeof useEstateText>;

/** Minutes the 23:40 inquiry has been waiting (assistant off). */
export const waitedMinutes = (c: Clock) => Math.max(0, clockMinutes(c) - CLOCK_START.min);

/** What a pipeline card says under the name. */
export function useCardNote() {
  const x = useEstateText();
  const { view } = useEstate();
  return (c: LeadCard): string => {
    const { t } = x;
    const l = listingById(c.listing);
    switch (c.note) {
      case 'base':
        return t('notes.base', { listing: `${x.rooms(c.listing, true)} · ${x.zone(l.zone)}` });
      case 'waiting':
        return t('notes.waiting', { wait: x.wait(waitedMinutes(view.clock)) });
      case 'lost':
        return t('notes.lost', { wait: x.late });
      case 'qualified':
        return t('notes.qualified', { budget: view.budget ? t(`budget.${view.budget}`) : '', pay: view.pay ? t(`pay.${view.pay}`) : '' });
      case 'booked':
      case 'you':
        return t(`notes.${c.note}`, { slot: c.visit ? x.slot(c.visit) : '' });
      case 'reserved':
        return t('notes.reserved', { street: l.street });
      default:
        return t(`notes.${c.note}`);
    }
  };
}

const EVENT_ICON: Record<EstateEvent['kind'], { icon: LucideIcon; tone: Tone }> = {
  pastPortal: { icon: Newspaper, tone: 'neutral' },
  pastWhatsApp: { icon: MessageCircle, tone: 'neutral' },
  pastFollow: { icon: Send, tone: 'neutral' },
  inquiry: { icon: MessageSquareText, tone: 'ink' },
  answered: { icon: Sparkles, tone: 'accent' },
  qualified: { icon: ListChecks, tone: 'accent2' },
  booked: { icon: CalendarCheck, tone: 'accent' },
  visited: { icon: DoorOpen, tone: 'neutral' },
  followSent: { icon: Send, tone: 'accent' },
  reserved: { icon: KeyRound, tone: 'ink' },
  similar: { icon: Send, tone: 'accent2' },
  think: { icon: CalendarClock, tone: 'accent2' },
  waiting: { icon: Hourglass, tone: 'bad' },
  opens: { icon: DoorOpen, tone: 'neutral' },
  human: { icon: MessageCircle, tone: 'warn' },
  lost: { icon: CircleSlash, tone: 'bad' },
  you: { icon: BadgeCheck, tone: 'accent' },
};
export const eventIcon = (kind: EstateEvent['kind']) => EVENT_ICON[kind];

/** Human sentence for an event (feed, toasts, announcements). */
export function useEventText() {
  const x = useEstateText();
  const { view } = useEstate();
  return (e: EstateEvent): string => {
    const name = e.kind === 'pastPortal' ? x.person('valeria') : e.kind === 'pastWhatsApp' ? x.person('andres') : e.kind === 'pastFollow' ? x.person('tomas') : x.t('people.carolinaFirst');
    return x.t(`feed.${e.kind}`, {
      name,
      street: listingById(e.listing ?? view.listing).street,
      budget: view.budget ? x.t(`budget.${view.budget}`) : '',
      pay: view.pay ? x.t(`pay.${view.pay}`).toLowerCase() : '',
      slot: e.visit ? x.slotLong(e.visit) : '',
      advisor: x.t('people.juliaFirst'),
      late: x.late,
    });
  };
}

/** The activity of the night, newest first. */
export function useFeedItems(limit = 6): FeedItem[] {
  const { view } = useEstate();
  const text = useEventText();
  const x = useEstateText();
  return [...view.events]
    .reverse()
    .slice(0, limit)
    .map((e) => ({ id: e.id, ...EVENT_ICON[e.kind], text: text(e), time: x.clock(e.clock), fresh: e.at >= 0 && view.t - e.at < 2600 }));
}

const TOASTED: EstateEvent['kind'][] = ['inquiry', 'qualified', 'booked', 'followSent', 'reserved', 'similar', 'think', 'waiting', 'lost', 'you'];

/** Live toasts (decorative: the Announcer speaks). */
export function EstateToasts({ placement }: { placement: 'top' | 'bottom-right' }) {
  const { view, reduced } = useEstate();
  const text = useEventText();
  const t = useTranslations('demoRealEstate.toast');
  if (reduced) return null;
  const items: ToastItem[] = view.events
    .filter((e) => e.at >= 0 && TOASTED.includes(e.kind) && view.t - e.at < 3200)
    .slice(-2)
    .map((e) => ({ id: e.id, ...EVENT_ICON[e.kind], title: t(e.kind as 'inquiry'), body: text(e), leaving: view.t - e.at >= 2700 }));
  return <ToastStack items={items} placement={placement} className="re-toasts" />;
}

/** One polite announcement of the latest live change (one instance per pair). */
export function Announcer() {
  const { view, announce } = useEstate();
  const text = useEventText();
  if (!announce) return null;
  const latest = [...view.events].reverse().find((e) => e.at >= 0 && view.t - e.at < 2600);
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {latest ? text(latest) : ''}
    </p>
  );
}

/** Section header: mono kicker, serif title, one quiet line; `aside` on the right. */
export function ViewHead({ kicker, title, sub, aside, className = '' }: { kicker?: ReactNode; title: ReactNode; sub?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <header className={`re-head ${className}`}>
      <div className="min-w-0">
        {kicker ? <p className="re-kicker">{kicker}</p> : null}
        <h2 className="re-title demo-display">{title}</h2>
        {sub ? <p className="re-sub">{sub}</p> : null}
      </div>
      {aside ? <div className="re-head-aside">{aside}</div> : null}
    </header>
  );
}

/** The four stages as a ruler: ticks, the reached part drawn in, the current one labelled. */
export function StageTrack({ stage, lost = false, className = '' }: { stage: Stage | null; lost?: boolean; className?: string }) {
  const t = useTranslations('demoRealEstate');
  const i = stage ? STAGES.indexOf(stage) : -1;
  return (
    <div
      className={`re-track ${className}`}
      data-lost={lost ? '' : undefined}
      role="img"
      aria-label={t('lead.stageTrack', { stage: lost ? t('lead.nextSteps.lost') : stage ? t(`stages.${stage}`) : t('lead.pending') })}
    >
      <span aria-hidden className="re-track-rule">
        <span style={{ transform: `scaleX(${i <= 0 ? 0 : i / (STAGES.length - 1)})` }} />
      </span>
      {STAGES.map((s, k) => (
        <span key={s} aria-hidden className="re-track-stop" data-on={k <= i ? '' : undefined} data-current={k === i ? '' : undefined}>
          <span className="re-track-dot" />
          <span className="re-track-label">{t(`stages.${s}`)}</span>
        </span>
      ))}
    </div>
  );
}

/** A label / value row (lead file, listing facts). Shows a quiet dash until the value exists. */
export function Field({ label, value, fresh = false, accent = false }: { label: string; value: ReactNode | null; fresh?: boolean; accent?: boolean }) {
  return (
    <div className={`re-field ${fresh ? 'demo-fresh' : ''}`} data-empty={value === null ? '' : undefined} data-accent={accent ? '' : undefined}>
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  );
}
