'use client';

import { useLayoutEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useDemoFormat } from './format';

/** Semantic color of a pill, icon chip, event… (see `.demo-tone-*` in demo.css). */
export type Tone = 'accent' | 'accent2' | 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'ink';
export const toneClass = (tone: Tone = 'neutral') => `demo-tone-${tone}`;

/** The amber "Demo" badge (Eclipse's layer, never themed). Decorative: pair it with sr-only text. */
export function DemoBadge({ className = '' }: { className?: string }) {
  const t = useTranslations('common');
  return (
    <span className={`demo-badge ${className}`} aria-hidden>
      {t('demo')}
    </span>
  );
}

/** Brand mark + business name + "Demo" badge (the name reads "Clínica Aurora — Demo"). */
export function BrandName({
  business,
  logo,
  logoStyle = 'tile',
  stacked = false,
  className = '',
}: {
  business: string;
  logo?: ReactNode;
  /** tile: mark on an accent square · plain: the mark alone in the accent color. */
  logoStyle?: 'tile' | 'plain';
  /** Badge under the name instead of next to it. */
  stacked?: boolean;
  className?: string;
}) {
  const t = useTranslations('common');
  return (
    <span className={`demo-brand ${className}`}>
      {logo ? (
        <span className="demo-brand-mark" data-style={logoStyle} aria-hidden>
          {logo}
        </span>
      ) : null}
      <span className={stacked ? 'demo-side-name' : 'flex min-w-0 items-center gap-[0.5em]'}>
        <span className="demo-brand-name">
          {business}
          <span className="sr-only"> — {t('demo')}</span>
        </span>
        <DemoBadge />
      </span>
    </span>
  );
}

export function Card({
  children,
  className = '',
  elevated = false,
  as: Tag = 'div',
  style,
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  as?: 'div' | 'section' | 'article' | 'figure' | 'li';
  style?: CSSProperties;
}) {
  return (
    <Tag className={`demo-card ${className}`} data-elevated={elevated ? '' : undefined} style={style}>
      {children}
    </Tag>
  );
}

/** Small status pill. `solid` fills it with the tone color. */
export function Pill({
  tone = 'neutral',
  icon: Icon,
  solid = false,
  children,
  className = '',
}: {
  tone?: Tone;
  icon?: LucideIcon;
  solid?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`demo-pill ${toneClass(tone)} ${className}`} data-solid={solid ? '' : undefined}>
      {Icon ? <Icon aria-hidden strokeWidth={2} /> : null}
      {children}
    </span>
  );
}

/** A round icon on a soft tone background (feeds, lists). Decorative. */
export function IconChip({ icon: Icon, tone = 'neutral', className = '' }: { icon: LucideIcon; tone?: Tone; className?: string }) {
  return (
    <span aria-hidden className={`demo-icon-chip ${toneClass(tone)} ${className}`}>
      <Icon strokeWidth={1.8} />
    </span>
  );
}

/** Initials avatar. `color` is any CSS color (a person's identity color), `ink` its text color. */
export function Avatar({ initials, color, ink, className = '' }: { initials: string; color?: string; ink?: string; className?: string }) {
  const style = { '--avatar-bg': color, '--avatar-ink': ink } as CSSProperties;
  return (
    <span aria-hidden className={`demo-avatar ${className}`} style={style}>
      {initials}
    </span>
  );
}

/** Pulsing "live" dot (a loop: it pauses with the demo). */
export function LiveDot({ color, className = '' }: { color?: string; className?: string }) {
  return <span aria-hidden className={`demo-livedot demo-loop ${className}`} style={color ? ({ '--dot': color } as CSSProperties) : undefined} />;
}

/** Accessible on/off switch. Label it with `aria-labelledby` or `label`. */
export function Switch({
  checked,
  onChange,
  label,
  labelledBy,
  describedBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className="demo-switch"
    />
  );
}

export function Button({
  variant = 'primary',
  icon: Icon,
  children,
  className = '',
  ...rest
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" data-variant={variant} className={`demo-btn ${className}`} {...rest}>
      {Icon ? <Icon aria-hidden strokeWidth={2} /> : null}
      {children}
    </button>
  );
}

/** Horizontal meter (0–1). The fill scales with a transform. */
export function Meter({ value, className = '', fill, track }: { value: number; className?: string; fill?: string; track?: string }) {
  const style = { '--meter-fill': fill, '--meter-track': track } as CSSProperties;
  return (
    <span aria-hidden className={`demo-meter ${className}`} style={style}>
      <span style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }} />
    </span>
  );
}

/** Small uppercase caption. */
export function Label({ children, className = '', as: Tag = 'p' }: { children: ReactNode; className?: string; as?: 'p' | 'span' | 'h3' | 'h4' }) {
  return <Tag className={`demo-label ${className}`}>{children}</Tag>;
}

/** Three bouncing dots ("typing…"). */
export function TypingDots({ label }: { label: string }) {
  return (
    <span className="demo-typing demo-loop" role="status" aria-label={label}>
      <span />
      <span />
      <span />
    </span>
  );
}

/**
 * A number that rolls to its new value like an instrument readout (GSAP, text only).
 * Increases roll; decreases snap (a story restarting must not "count down").
 * Screen readers get the final value.
 */
export function Readout({
  value,
  format,
  fromZero = false,
  rollDown = false,
  duration = 1.1,
  className = '',
}: {
  value: number;
  format?: (n: number) => string;
  fromZero?: boolean;
  rollDown?: boolean;
  duration?: number;
  className?: string;
}) {
  const fmt = useDemoFormat();
  const show = format ?? ((n: number) => fmt.num(Math.round(n)));
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);
  const showRef = useRef(show);

  useLayoutEffect(() => {
    showRef.current = show;
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setText = (n: number) => {
      const text = showRef.current(n);
      if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = text;
      else el.textContent = text;
    };
    const from = shown.current ?? (fromZero ? 0 : value);
    if (from === value || prefersReducedMotion() || (value < from && !rollDown)) {
      shown.current = value;
      setText(value);
      return;
    }
    const state = { v: from };
    setText(from);
    const tween = gsap.to(state, {
      v: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => setText(Math.round(state.v)),
      onComplete: () => {
        shown.current = value;
        setText(value);
      },
    });
    return () => {
      tween.kill();
      shown.current = Math.round(state.v);
    };
  }, [value, fromZero, rollDown, duration]);

  return (
    <span ref={ref} className={`demo-num ${className}`}>
      {show(value)}
    </span>
  );
}
