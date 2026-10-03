'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CalendarPlus,
  CalendarX2,
  Check,
  CheckCheck,
  Hourglass,
  MessageCircle,
  Send,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { l, verticalById } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { proById, type ProId, type SlotStatus } from './data';
import { useFmt } from './context';

/** Clínica Aurora mark: a sun rising over the horizon. */
export function AuroraLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[1.25em]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M3.5 16.5h17" />
      <path d="M7 16.5a5 5 0 0 1 10 0" />
      <path d="M12 6.2v2.3M5.6 9.3l1.6 1.5M18.4 9.3l-1.6 1.5" />
      <path d="M8 19.8h8" opacity={0.6} />
    </svg>
  );
}

const STATUS_STYLE: Record<SlotStatus, { cls: string; icon: LucideIcon | null }> = {
  done: { cls: 'bg-[var(--clinic-done-bg)] text-[var(--demo-muted)]', icon: Check },
  now: { cls: 'bg-[var(--demo-accent-soft)] text-[var(--clinic-accent-ink)]', icon: null },
  confirmed: { cls: 'bg-[var(--clinic-ok-bg)] text-[var(--clinic-ok)]', icon: CheckCheck },
  reminded: { cls: 'bg-[var(--clinic-warn-bg)] text-[var(--clinic-warn)]', icon: Send },
  new: { cls: 'bg-[var(--clinic-new-bg)] text-[var(--clinic-new)]', icon: CalendarPlus },
  waitlist: { cls: 'bg-[var(--clinic-wait-bg)] text-[var(--clinic-wait)]', icon: Users },
  you: { cls: 'bg-[var(--clinic-amber)] text-[#05050a]', icon: Sparkles },
  freed: { cls: 'bg-[var(--clinic-bad-bg)] text-[var(--clinic-bad)]', icon: Hourglass },
  noshow: { cls: 'bg-[var(--clinic-bad-bg)] text-[var(--clinic-bad)]', icon: CalendarX2 },
};

export function StatusChip({ status, className = '' }: { status: SlotStatus; className?: string }) {
  const t = useTranslations('demoClinic.status');
  const { cls, icon: Icon } = STATUS_STYLE[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-[0.3em] whitespace-nowrap rounded-full px-[0.55em] py-[0.2em] text-[0.68em] font-semibold ${cls} ${className}`}>
      {Icon ? (
        <Icon aria-hidden className="size-[1.05em]" strokeWidth={2.2} />
      ) : (
        <span aria-hidden className="clinic-live-dot" style={{ background: 'var(--demo-accent)' }} />
      )}
      {t(status)}
    </span>
  );
}

/** Icon-only status (compact grid cells). Decorative: pair it with a text label. */
export function StatusIcon({ status }: { status: SlotStatus }) {
  const { cls, icon: Icon } = STATUS_STYLE[status];
  return (
    <span aria-hidden className={`grid size-[1.35em] shrink-0 place-items-center rounded-full text-[0.8em] ${cls}`}>
      {Icon ? <Icon className="size-[0.8em]" strokeWidth={2.4} /> : <span className="clinic-live-dot" style={{ background: 'var(--demo-accent)' }} />}
    </span>
  );
}

export function LiveBadge({ className = '' }: { className?: string }) {
  const t = useTranslations('demoClinic');
  return (
    <span className={`inline-flex shrink-0 items-center gap-[0.45em] whitespace-nowrap rounded-full bg-[var(--clinic-ok-bg)] px-[0.6em] py-[0.25em] text-[0.7em] font-semibold text-[var(--clinic-ok)] ${className}`}>
      <span aria-hidden className="clinic-live-dot" />
      {t('live')}
    </span>
  );
}

export function ProAvatar({ pro, className = '' }: { pro: ProId; className?: string }) {
  const p = proById(pro);
  return (
    <span aria-hidden className={`grid size-[1.9em] shrink-0 place-items-center rounded-full text-[0.8em] font-semibold text-white ${className}`} style={{ background: p.color }}>
      {p.initials}
    </span>
  );
}

/** "Quiero esto para mi negocio" → WhatsApp with the business and vertical prefilled. */
export function WantThis({ variant }: { variant: 'header' | 'floating' }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const v = verticalById('clinicas')!;
  const message = t('whatsapp.wantThis', { business: v.business ?? '', vertical: l(v.name, locale) });
  const size =
    variant === 'header'
      ? 'gap-[0.5em] px-[1em] py-[0.6em] text-[0.85em]'
      : 'w-full justify-center gap-[0.55em] px-[1em] py-[0.85em] text-[0.85em]';
  return (
    <WhatsAppLink
      origin="demo"
      message={message}
      extra={{ demo: 'clinic' }}
      className={`clinic-cta inline-flex items-center rounded-full font-semibold leading-none ${size}`}
    >
      <MessageCircle aria-hidden className="size-[1.15em] shrink-0" strokeWidth={2} />
      {t('hero.wantThis')}
    </WhatsAppLink>
  );
}

/** A number that rolls to its new value (GSAP). Screen readers read the final value. */
export function RollingNumber({
  value,
  fromZero = false,
  tabular = true,
  className = '',
}: {
  value: number;
  fromZero?: boolean;
  /** Tabular digits avoid jitter while rolling; big hero figures read better proportional. */
  tabular?: boolean;
  className?: string;
}) {
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
    const from = shown.current ?? (fromZero ? 0 : value);
    if (from === value || prefersReducedMotion()) {
      shown.current = value;
      setText(value);
      return;
    }
    const state = { v: from };
    setText(from);
    const tween = gsap.to(state, {
      v: value,
      duration: 1.2,
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
  }, [value, fromZero, fmt]);

  return (
    <span ref={ref} className={`${tabular ? 'tabular' : ''} ${className}`}>
      {fmt.num(value)}
    </span>
  );
}

export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'figure' }) {
  return <Tag className={`demo-card shadow-[0_0.1em_0.4em_rgb(21_21_27/0.04)] ${className}`}>{children}</Tag>;
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[0.66em] font-semibold uppercase tracking-[0.12em] text-[var(--demo-muted)] ${className}`}>{children}</p>;
}
