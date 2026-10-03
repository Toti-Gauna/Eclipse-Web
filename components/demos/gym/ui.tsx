'use client';

import { useId, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarCheck, HeartPulse, MessageCircle, UserPlus, Users, Zap, type LucideIcon } from 'lucide-react';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { l, verticalById } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { memberBase, missionById, type MemberId, type MissionId } from './data';
import { useFmt } from './context';

/** Órbita Fitness mark: a planet with a satellite on its orbit. */
export function OrbitaLogo({ className = 'size-[1.3em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <ellipse cx="12" cy="12" rx="9.6" ry="4.1" transform="rotate(-24 12 12)" />
      <circle cx="12" cy="12" r="3.7" fill="currentColor" stroke="none" />
      <circle cx="17.6" cy="6.6" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** The streak flame (two layered tongues; `gym-flame` flickers them). */
export function FlameMark({ className = '', lit = true }: { className?: string; lit?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 32 37" aria-hidden className={`gym-flame ${className}`} data-lit={lit ? '' : undefined}>
      <defs>
        <linearGradient id={`${id}-o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc35a" />
          <stop offset="0.55" stopColor="#ff7a2f" />
          <stop offset="1" stopColor="#f2461c" />
        </linearGradient>
        <linearGradient id={`${id}-i`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="1" stopColor="#ffc94d" />
        </linearGradient>
      </defs>
      <path
        className="gym-flame-outer"
        fill={lit ? `url(#${id}-o)` : 'currentColor'}
        d="M16 1c1 6 7 9 9.5 15 3 7 .5 15-5.5 18.5-2.5 1.5-5.5 1.5-8 .5C5.5 32.5 3 25.5 5.5 19c1-2.5 2.5-4.3 4-5.6.1 2.6 1.1 4.6 2.9 5.6C11.6 12.2 13.2 6 16 1Z"
      />
      {lit ? (
        <path
          className="gym-flame-inner"
          fill={`url(#${id}-i)`}
          d="M16.5 17c1.5 3.5 4.5 5.5 4.5 9.5 0 3.8-2.4 6.5-5.2 6.5-2.9 0-5-2.4-4.8-5.4.2-2.6 1.8-4 3-5.4.3 1.6 1 2.6 2 3-.4-2.8-.4-5.6.5-8.2Z"
        />
      ) : null}
    </svg>
  );
}

export function LiveBadge({ className = '' }: { className?: string }) {
  const t = useTranslations('demoGym');
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-[0.45em] whitespace-nowrap rounded-full bg-[var(--gym-ok-bg)] px-[0.6em] py-[0.25em] text-[0.7em] font-semibold text-[var(--gym-ok)] ${className}`}
    >
      <span aria-hidden className="gym-live-dot" />
      {t('live')}
    </span>
  );
}

/** The member's points in the app header (they roll when they change). */
export function PointsPill({ points }: { points: number }) {
  const t = useTranslations('demoGym');
  return (
    <span className="inline-flex shrink-0 items-center gap-[0.3em] whitespace-nowrap rounded-full bg-[var(--demo-accent-soft)] px-[0.6em] py-[0.3em] text-[0.74em] font-semibold text-[var(--gym-accent-ink)]">
      <Zap aria-hidden className="size-[1.05em] fill-current" strokeWidth={1.8} />
      <span aria-hidden>
        <RollingNumber value={points} /> {t('pts')}
      </span>
      <span className="sr-only">{t('pointsLabel', { count: points })}</span>
    </span>
  );
}

/** "Quiero esto para mi negocio" → WhatsApp with the business and vertical prefilled. */
export function WantThis({ variant }: { variant: 'header' | 'floating' }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const v = verticalById('gimnasios')!;
  const message = t('whatsapp.wantThis', { business: v.business ?? '', vertical: l(v.name, locale) });
  const size =
    variant === 'header'
      ? 'shrink-0 gap-[0.5em] whitespace-nowrap px-[1em] py-[0.6em] text-[0.85em]'
      : 'w-full justify-center gap-[0.55em] px-[1em] py-[0.85em] text-[0.85em]';
  return (
    <WhatsAppLink origin="demo" message={message} extra={{ demo: 'gym' }} className={`gym-cta inline-flex items-center rounded-full font-semibold leading-none ${size}`}>
      <MessageCircle aria-hidden className="size-[1.15em] shrink-0" strokeWidth={2} />
      {t('hero.wantThis')}
    </WhatsAppLink>
  );
}

/** A number that rolls to its new value (GSAP). Screen readers read the final value. */
export function RollingNumber({ value, tabular = true, className = '' }: { value: number; tabular?: boolean; className?: string }) {
  const fmt = useFmt();
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setText = (n: number) => {
      const text = fmt.num(Math.round(n));
      if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = text;
      else el.textContent = text;
    };
    const from = shown.current ?? value;
    if (from === value || prefersReducedMotion()) {
      shown.current = value;
      setText(value);
      return;
    }
    const state = { v: from };
    setText(from);
    const tween = gsap.to(state, {
      v: value,
      duration: 1.1,
      ease: 'power3.out',
      onUpdate: () => setText(state.v),
      onComplete: () => {
        shown.current = value;
        setText(value);
      },
    });
    return () => {
      tween.kill();
      shown.current = state.v;
    };
  }, [value, fmt]);

  return (
    <span ref={ref} className={`${tabular ? 'tabular' : ''} ${className}`}>
      {fmt.num(value)}
    </span>
  );
}

export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' }) {
  return <Tag className={`demo-card shadow-[0_0.1em_0.4em_rgb(21_21_27/0.04)] ${className}`}>{children}</Tag>;
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[0.66em] font-semibold uppercase tracking-[0.12em] text-[var(--demo-muted)] ${className}`}>{children}</p>;
}

/** Progress bar (scaleX transition, so it animates when the value changes). */
export function Meter({ value, className = '', tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'ok' | 'light' }) {
  const track = tone === 'light' ? 'bg-white/20' : tone === 'ok' ? 'bg-[var(--gym-ok-bg)]' : 'bg-[var(--demo-accent-soft)]';
  const bar = tone === 'light' ? 'bg-white' : tone === 'ok' ? 'bg-[var(--gym-ok-bar)]' : 'bg-[var(--demo-accent)]';
  return (
    <span aria-hidden className={`gym-meter block overflow-hidden rounded-full ${track} ${className}`}>
      <span className={`rounded-full ${bar}`} style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }} />
    </span>
  );
}

/** Initial on a colored disc (decorative: the name is always next to it). */
export function Avatar({ id, className = '' }: { id: MemberId; className?: string }) {
  const t = useTranslations('demoGym.members');
  return (
    <span aria-hidden className={`grid size-[2em] shrink-0 place-items-center rounded-full text-[0.8em] font-semibold text-white ${className}`} style={{ background: memberBase(id).color }}>
      {t(id).charAt(0)}
    </span>
  );
}

/** A mission's name ("title" in the member's app, "short" in lists and feeds). */
export function useMissionName() {
  const t = useTranslations('demoGym.missions');
  return (id: MissionId, form: 'title' | 'short' = 'short') => t(`${id}.${form}`, { goal: missionById(id).goal });
}

export const MISSION_ICON: Record<MissionId, LucideIcon> = {
  days: CalendarCheck,
  cardio: HeartPulse,
  class: Users,
  friend: UserPlus,
};

export function MissionIcon({ id, done = false, className = '' }: { id: MissionId; done?: boolean; className?: string }) {
  const Icon = MISSION_ICON[id];
  return (
    <span
      aria-hidden
      className={`grid size-[2.3em] shrink-0 place-items-center rounded-[0.75em] transition-colors duration-500 ${
        done ? 'bg-[var(--gym-ok-bg)] text-[var(--gym-ok)]' : 'bg-[var(--demo-accent-soft)] text-[var(--gym-accent-ink)]'
      } ${className}`}
    >
      <Icon className="size-[1.15em]" strokeWidth={2} />
    </span>
  );
}

/** Title block of a view. */
export function ViewTitle({ title, subtitle, eyebrow, size = 'phone' }: { title: string; subtitle?: string; eyebrow?: string; size?: 'phone' | 'laptop' }) {
  return (
    <div className="min-w-0">
      {eyebrow ? <Eyebrow className="mb-[0.3em]">{eyebrow}</Eyebrow> : null}
      <h2 className={`${size === 'laptop' ? 'text-[1.45em]' : 'text-[1.3em]'} font-semibold leading-tight tracking-[-0.02em]`}>{title}</h2>
      {subtitle ? <p className={`${size === 'laptop' ? 'text-[0.78em]' : 'text-[0.74em]'} text-[var(--demo-muted)]`}>{subtitle}</p> : null}
    </div>
  );
}

/** Particles flying out of the center of the parent (decorative, runs once on mount). */
export function Burst({ count = 10, colors = ['#ff7a2f', '#f5b942', '#ffffff'], radius = 2.4 }: { count?: number; colors?: string[]; radius?: number }) {
  return (
    <span aria-hidden className="gym-burst">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--a': `${(360 / count) * i + 9}deg`,
              '--c': colors[i % colors.length],
              '--r': `${radius * (i % 2 ? 0.78 : 1)}em`,
              '--d': `${(i % 3) * 40}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

/** Four arcs, one per weekly mission. */
export function MissionRing({ done, total, className = '' }: { done: number; total: number; className?: string }) {
  const r = 15;
  const gap = 16; // degrees between arcs
  const arc = (i: number) => {
    const a0 = ((360 / total) * i - 90 + gap / 2) * (Math.PI / 180);
    const a1 = ((360 / total) * (i + 1) - 90 - gap / 2) * (Math.PI / 180);
    return `M${18 + r * Math.cos(a0)} ${18 + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${18 + r * Math.cos(a1)} ${18 + r * Math.sin(a1)}`;
  };
  return (
    <svg viewBox="0 0 36 36" aria-hidden className={className} fill="none" strokeLinecap="round" strokeWidth={3.4}>
      {Array.from({ length: total }, (_, i) => (
        <g key={i}>
          <path d={arc(i)} stroke="var(--demo-accent-soft)" />
          <path d={arc(i)} stroke="var(--demo-accent)" className="gym-ring-seg" style={{ opacity: i < done ? 1 : 0 }} />
        </g>
      ))}
    </svg>
  );
}
