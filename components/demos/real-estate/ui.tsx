'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AtSign, BedDouble, Bath, CalendarCheck, Globe, MessageCircle, Ruler, Sparkles, UserCheck, type LucideIcon } from 'lucide-react';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { WhatsAppLink } from '@/components/ui/WhatsAppLink';
import { l, verticalById } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import type { Channel, Listing, Stage } from './data';
import { useFmt } from './context';

/** Lumen Propiedades mark: a house whose window lets the light out. */
export function LumenLogo({ className = 'size-[1.25em]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.2 12 4.5l8 6.7" />
      <path d="M6 9.6V19.5h12V9.6" />
      <rect x="10" y="12.2" width="4" height="4" rx="0.6" fill="currentColor" stroke="none" />
      <path d="M12 9.2v-.9M15.6 10.6l.6-.6M8.4 10.6l-.6-.6" opacity={0.75} />
    </svg>
  );
}

/** "IA activa" pill with a live dot. */
export function LiveBadge({ className = '' }: { className?: string }) {
  const t = useTranslations('demoRealEstate');
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-[0.45em] whitespace-nowrap rounded-full bg-[var(--re-ok-bg)] px-[0.6em] py-[0.25em] text-[0.7em] font-semibold text-[var(--re-ok)] ${className}`}
    >
      <span aria-hidden className="re-live-dot" />
      {t('aiOn')}
    </span>
  );
}

/** "Quiero esto para mi negocio" → WhatsApp with the business and vertical prefilled. */
export function WantThis({ variant }: { variant: 'header' | 'floating' }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const v = verticalById('inmobiliarias')!;
  const message = t('whatsapp.wantThis', { business: v.business ?? '', vertical: l(v.name, locale) });
  const size =
    variant === 'header'
      ? 'gap-[0.5em] px-[1em] py-[0.6em] text-[0.85em]'
      : 'w-full justify-center gap-[0.55em] px-[1em] py-[0.85em] text-[0.85em]';
  return (
    <WhatsAppLink
      origin="demo"
      message={message}
      extra={{ demo: 'realEstate' }}
      className={`re-cta inline-flex items-center rounded-full font-semibold leading-none ${size}`}
    >
      <MessageCircle aria-hidden className="size-[1.15em] shrink-0" strokeWidth={2} />
      {t('hero.wantThis')}
    </WhatsAppLink>
  );
}

/** A number that rolls to its new value (GSAP). Screen readers read the final value. */
export function RollingNumber({ value, className = '' }: { value: number; className?: string }) {
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
    <span ref={ref} className={`tabular ${className}`}>
      {fmt.num(value)}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`demo-card shadow-[0_0.1em_0.4em_rgb(21_21_27/0.04)] ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[0.66em] font-semibold uppercase tracking-[0.12em] text-[var(--demo-muted)] ${className}`}>{children}</p>;
}

export function Avatar({ initial, color, className = '' }: { initial: string; color: string; className?: string }) {
  return (
    <span aria-hidden className={`grid size-[2.1em] shrink-0 place-items-center rounded-full text-[0.8em] font-semibold text-white ${className}`} style={{ background: color }}>
      {initial}
    </span>
  );
}

export const CHANNEL_ICON: Record<Channel, LucideIcon> = { whatsapp: MessageCircle, web: Globe, instagram: AtSign };

export function ChannelLabel({ channel, className = '' }: { channel: Channel; className?: string }) {
  const t = useTranslations('demoRealEstate.channels');
  const Icon = CHANNEL_ICON[channel];
  return (
    <span className={`inline-flex items-center gap-[0.3em] ${className}`}>
      <Icon aria-hidden className="size-[1.05em] shrink-0" strokeWidth={2} />
      {t(channel)}
    </span>
  );
}

const STAGE_STYLE: Record<Stage | 'live', { cls: string; icon: LucideIcon | null }> = {
  live: { cls: 'bg-[var(--demo-accent-soft)] text-[var(--re-accent-ink)]', icon: null },
  new: { cls: 'bg-[var(--re-neutral-bg)] text-[var(--demo-muted)]', icon: Sparkles },
  qualified: { cls: 'bg-[var(--re-warn-bg)] text-[var(--re-warn)]', icon: UserCheck },
  visit: { cls: 'bg-[var(--re-ok-bg)] text-[var(--re-ok)]', icon: CalendarCheck },
};

export function StageChip({ stage, className = '' }: { stage: Stage | 'live'; className?: string }) {
  const t = useTranslations('demoRealEstate.stages');
  const { cls, icon: Icon } = STAGE_STYLE[stage];
  return (
    <span className={`inline-flex shrink-0 items-center gap-[0.3em] whitespace-nowrap rounded-full px-[0.55em] py-[0.2em] text-[0.66em] font-semibold ${cls} ${className}`}>
      {Icon ? <Icon aria-hidden className="size-[1.05em]" strokeWidth={2.2} /> : <span aria-hidden className="re-live-dot" style={{ background: 'var(--demo-accent)' }} />}
      {t(stage)}
    </span>
  );
}

/** "2 dorm. · 1 baño · 68 m²" with thin icons. */
export function Specs({ listing, className = '' }: { listing: Listing; className?: string }) {
  const t = useTranslations('demoRealEstate.listing');
  const items: { icon: LucideIcon; text: string }[] = [
    { icon: BedDouble, text: t('beds', { count: listing.beds }) },
    { icon: Bath, text: t('baths', { count: listing.baths }) },
    { icon: Ruler, text: t('area', { count: listing.area }) },
  ];
  return (
    <span className={`flex flex-wrap items-center gap-x-[0.7em] gap-y-[0.15em] text-[var(--demo-muted)] ${className}`}>
      {items.map(({ icon: Icon, text }) => (
        <span key={text} className="inline-flex items-center gap-[0.3em] whitespace-nowrap">
          <Icon aria-hidden className="size-[1.1em] shrink-0" strokeWidth={1.8} />
          {text}
        </span>
      ))}
    </span>
  );
}

/** Score out of 100 with a meter. */
export function ScoreMeter({ score, className = '' }: { score: number; className?: string }) {
  const tone = score >= 80 ? 'bg-[var(--re-ok)]' : score >= 60 ? 'bg-[var(--re-warn)]' : 'bg-[var(--demo-muted)]';
  return (
    <span aria-hidden className={`re-meter block h-[0.32em] overflow-hidden rounded-full bg-black/[0.07] ${className}`}>
      <span className={`rounded-full ${tone}`} style={{ transform: `scaleX(${score / 100})` }} />
    </span>
  );
}
