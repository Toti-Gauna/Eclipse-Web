'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  CalendarCheck,
  CircleAlert,
  CircleDollarSign,
  GraduationCap,
  Mic,
  MessageCircle,
  NotebookPen,
  PenLine,
  Reply,
  RotateCcw,
  Sparkles,
  UserMinus,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, ToastStack, upperFirst, useDemoFormat, type FeedItem, type ToastItem, type Tone } from '../kit';
import { CEFR, CLASSMATES, HERO_COLOR, TEACHERS, TODAY, dayDate, storyClock, type CefrLevel, type StudentId, type TeacherId } from './data';
import type { AcademyEvent, EventKind } from './story';
import { useAcademy } from './context';

/* ------------------------------------------------------------------ */
/* Brand                                                                */
/* ------------------------------------------------------------------ */
/** Atrio's mark: an arch inside an arch (an atrium, a door into the language). */
export function AtrioMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 20.5V11a7.5 7.5 0 0 1 15 0v9.5" />
      <path d="M9 20.5v-6a3 3 0 0 1 6 0v6" opacity={0.6} />
      <path d="M2.5 20.5h19" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Chalk strokes (SVG, drawn in with a clip-path wipe)                  */
/* ------------------------------------------------------------------ */
type Chalk = 'sky' | 'salmon' | 'chalk' | 'ok';

/** A hand-drawn underline (two passes, like chalk). Place it under a word (`.atrio-mark`). */
export function ChalkUnderline({ tone = 'sky', className = '', draw = true }: { tone?: Chalk; className?: string; draw?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 100 10" preserveAspectRatio="none" className={`atrio-chalk atrio-chalk-under ${className}`} data-tone={tone} data-draw={draw ? '' : undefined}>
      <path d="M2 6.2C18 4.6 34 7.4 52 5.4S84 4.3 98 5.6" />
      <path d="M5 7.6C26 6.2 47 8.1 66 6.8S88 6.1 95 7" className="atrio-chalk-2" />
    </svg>
  );
}

/** A hand-drawn loop around something (overshoots its start, like a teacher's circle). */
export function ChalkCircle({ tone = 'salmon', className = '', draw = true }: { tone?: Chalk; className?: string; draw?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 100 60" preserveAspectRatio="none" className={`atrio-chalk atrio-chalk-circle ${className}`} data-tone={tone} data-draw={draw ? '' : undefined}>
      <path d="M60 5.5C33 3.6 6 12.5 5.2 30.4 4.5 47.6 30 56.2 55 55.2 80.6 54.2 95.4 44.4 94.6 28.6 93.8 13.4 74.6 4.4 44 7.6" />
    </svg>
  );
}

/** A chalk tick. */
export function ChalkTick({ tone = 'ok', className = '', draw = true }: { tone?: Chalk; className?: string; draw?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`atrio-chalk atrio-chalk-tick ${className}`} data-tone={tone} data-draw={draw ? '' : undefined}>
      <path d="M3.5 12.8c2 1.6 3.6 3.4 5.2 5.6C11.7 12.6 15.6 7.8 21 3.6" />
    </svg>
  );
}

/** A word with a chalk mark: `under` (the correct form) or `circle` (what was caught). */
export function Marked({ children, mark = 'under', tone, className = '' }: { children: ReactNode; mark?: 'under' | 'circle'; tone?: Chalk; className?: string }) {
  return (
    <span className={`atrio-mark ${className}`} data-mark={mark}>
      {children}
      {mark === 'under' ? <ChalkUnderline tone={tone ?? 'sky'} /> : <ChalkCircle tone={tone ?? 'salmon'} />}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Instruments                                                          */
/* ------------------------------------------------------------------ */
/** The CEFR ruler A1 → C1: ticks, the filled part and a chalk marker where the student is. */
export function CefrRuler({ level, progress, label, compact = false, className = '' }: { level: CefrLevel; progress: number; label: string; compact?: boolean; className?: string }) {
  const index = CEFR.indexOf(level);
  const pos = Math.max(0, Math.min(1, (index + progress) / CEFR.length));
  return (
    <div className={`atrio-cefr ${className}`} data-compact={compact ? '' : undefined} role="img" aria-label={label} style={{ '--pos': pos } as CSSProperties}>
      <div className="atrio-cefr-track" aria-hidden>
        <span className="atrio-cefr-fill" />
        {CEFR.map((l) => (
          <span key={l} className="atrio-cefr-seg" />
        ))}
        <span className="atrio-cefr-marker">
          <span />
        </span>
      </div>
      <ol className="atrio-cefr-labels" aria-hidden>
        {CEFR.map((l, i) => (
          <li key={l} data-state={i < index ? 'done' : i === index ? 'now' : 'next'}>
            {l}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Weekly goal ring (minutes). Static arc; the number rolls and a ring of chalk closes it when met. */
export function GoalRing({ value, goal, label, children, className = '' }: { value: number; goal: number; label: string; children?: ReactNode; className?: string }) {
  const p = Math.max(0, Math.min(1, value / goal));
  return (
    <figure className={`atrio-ring ${className}`} data-done={value >= goal ? '' : undefined}>
      <svg viewBox="0 0 42 42" aria-hidden>
        <circle cx="21" cy="21" r="17" pathLength={100} className="atrio-ring-track" />
        <circle cx="21" cy="21" r="17" pathLength={100} className="atrio-ring-arc" strokeDasharray={`${(p * 100).toFixed(1)} 100`} />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="21" y1="1.4" x2="21" y2={i % 3 ? '2.8' : '3.6'} transform={`rotate(${i * 30} 21 21)`} className="atrio-ring-tick" />
        ))}
      </svg>
      <figcaption className="atrio-ring-center">
        <span className="sr-only">{label}</span>
        {children}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* People                                                               */
/* ------------------------------------------------------------------ */
const PERSON_COLOR: Partial<Record<StudentId | 'you', string>> = {
  valentina: HERO_COLOR,
  julieta: '#F0D98A',
  tomas: '#C9C2B2',
  renata: '#A8DAF8',
  joaquin: '#FFB86B',
  you: '#FF9F87',
  ...Object.fromEntries(CLASSMATES.map((c) => [c.id, c.color])),
};
const INITIALS: Partial<Record<StudentId | 'you', string>> = {
  valentina: 'VR',
  julieta: 'JP',
  tomas: 'TG',
  renata: 'RV',
  joaquin: 'JM',
  ...Object.fromEntries(CLASSMATES.map((c) => [c.id, c.initials])),
};

export function PersonAvatar({ id, className = '' }: { id: StudentId | 'you'; className?: string }) {
  const t = useTranslations('demoAcademy');
  const initials = id === 'you' ? t('people.youInitials') : (INITIALS[id] ?? '··');
  return <Avatar initials={initials} color={PERSON_COLOR[id]} ink="#172338" className={`${id === 'you' ? 'atrio-av-you' : ''} ${className}`} />;
}

export function TeacherAvatar({ id, className = '' }: { id: TeacherId; className?: string }) {
  const tc = TEACHERS.find((x) => x.id === id)!;
  return <Avatar initials={tc.initials} color={tc.color} ink={tc.ink} className={className} />;
}

/* ------------------------------------------------------------------ */
/* Text                                                                 */
/* ------------------------------------------------------------------ */
/** Names, courses, days and times in the current locale (stable per locale). */
export function useAcademyText() {
  const t = useTranslations('demoAcademy');
  const fmt = useDemoFormat();
  return useMemo(() => {
    const name = (id: StudentId | 'you' | undefined) => (id ? t(`people.${id}`) : '');
    const first = (id: StudentId | 'you' | undefined) => (id ? t(`first.${id}`) : '');
    const course = (lang: 'en' | 'pt', level: string) => t('courseName', { lang: t(`langs.${lang}`), level });
    const teacher = (id: TeacherId) => t(`teachers.${id}`);
    const day = (offset = 0, style: 'short' | 'long' = 'short') =>
      upperFirst(
        fmt.date(dayDate(offset), style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric' }).replace('.', ''),
      );
    const weekday = (i: number) => upperFirst(fmt.date(new Date(TODAY + (i - 3) * 86_400_000), { weekday: 'narrow' }));
    return { t, fmt, name, first, course, teacher, day, weekday };
  }, [t, fmt]);
}

const EVENT_ICON: Record<EventKind, { icon: LucideIcon; tone: Tone }> = {
  reminders: { icon: BellRing, tone: 'neutral' },
  lesson: { icon: BookOpenCheck, tone: 'accent' },
  speaking: { icon: Mic, tone: 'accent' },
  complete: { icon: NotebookPen, tone: 'accent' },
  levelUp: { icon: GraduationCap, tone: 'accent2' },
  review: { icon: RotateCcw, tone: 'warn' },
  booked: { icon: CalendarCheck, tone: 'accent' },
  test: { icon: PenLine, tone: 'info' },
  level: { icon: Sparkles, tone: 'info' },
  enrolled: { icon: BadgeCheck, tone: 'ok' },
  flagged: { icon: CircleAlert, tone: 'warn' },
  nudge: { icon: MessageCircle, tone: 'accent' },
  replied: { icon: Reply, tone: 'accent' },
  later: { icon: Reply, tone: 'warn' },
  back: { icon: UserRoundCheck, tone: 'ok' },
  dropped: { icon: UserMinus, tone: 'bad' },
  paid: { icon: CircleDollarSign, tone: 'ok' },
};
/** Human sentence for an event (feed, toasts, announcements). */
export function useEventText() {
  const { t, name, course } = useAcademyText();
  return (e: AcademyEvent): string =>
    t(`feed.${e.who === 'you' && (e.kind === 'enrolled' || e.kind === 'level') ? `${e.kind}You` : e.kind}`, {
      name: name(e.who),
      level: e.level ?? '',
      course: e.course ? course('en', e.course) : '',
      pay: e.pay ? t(`pay.${e.pay}`) : '',
      score: e.score ?? 0,
      count: 7,
    });
}

/** When an event happened, as a clock label. */
export function useEventTime() {
  const { fmt } = useAcademyText();
  return (e: AcademyEvent) => fmt.time(e.clock ?? (e.at < 0 ? 19 * 60 : storyClock(e.at)));
}

export function useFeedItems(limit = 6, filter?: (e: AcademyEvent) => boolean): FeedItem[] {
  const { view } = useAcademy();
  const text = useEventText();
  const time = useEventTime();
  return [...view.events]
    .filter((e) => (filter ? filter(e) : true))
    .reverse()
    .slice(0, limit)
    .map((e) => ({ id: e.id, ...EVENT_ICON[e.kind], text: text(e), time: time(e), fresh: e.at >= 0 && view.t - e.at < 2600 }));
}

const TOASTY = new Set<EventKind>(['enrolled', 'levelUp', 'back', 'dropped', 'review']);

/** Live toasts (decorative: the Announcer speaks). */
export function AcademyToasts({ placement }: { placement: 'top' | 'bottom-right' }) {
  const { view, reduced } = useAcademy();
  const text = useEventText();
  const t = useTranslations('demoAcademy.toast');
  if (reduced) return null;
  const items: ToastItem[] = view.events
    .filter((e) => e.at >= 0 && TOASTY.has(e.kind) && view.t - e.at < 3400)
    .slice(-2)
    .map((e) => ({ id: e.id, icon: EVENT_ICON[e.kind].icon, tone: EVENT_ICON[e.kind].tone, title: t(e.kind), body: text(e), leaving: view.t - e.at >= 2900 }));
  return <ToastStack items={items} placement={placement} className="atrio-toasts" />;
}

/** One polite announcement of the latest live change (one instance per pair). */
export function Announcer() {
  const { view, announce } = useAcademy();
  const text = useEventText();
  if (!announce) return null;
  const latest = [...view.events].reverse().find((e) => e.at >= 0 && view.t - e.at < 2600);
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {latest ? text(latest) : ''}
    </p>
  );
}

/** Section header: a label (mono index) + a title with a chalk underline + one quiet line. */
export function ViewHead({ index, title, sub, aside, className = '' }: { index?: string; title: ReactNode; sub?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={`atrio-head ${className}`}>
      <div className="min-w-0">
        {index ? <p className="atrio-index">{index}</p> : null}
        <h2 className="atrio-title demo-display">{title}</h2>
        {sub ? <p className="atrio-sub">{sub}</p> : null}
      </div>
      {aside ? <div className="atrio-head-aside">{aside}</div> : null}
    </div>
  );
}
