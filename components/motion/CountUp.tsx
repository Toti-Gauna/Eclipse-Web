'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { prefersReducedMotion } from './useReducedMotion';
import { localeTags, type Locale } from '@/i18n/routing';

/**
 * Counts from 0 to `value` the first time it enters the viewport (`on="enter"`,
 * default) or right when it mounts (`on="mount"`: e.g. a readout that changes
 * with a selection the visitor just made, already on screen).
 * Screen readers get the final value only (the animated digits are aria-hidden).
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.6,
  locale = 'es',
  on = 'enter',
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  locale?: Locale;
  on?: 'enter' | 'mount';
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = new Intl.NumberFormat(localeTags[locale], { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const final = `${prefix}${fmt.format(value)}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const setText = (text: string) => {
        if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = text;
        else el.textContent = text;
      };
      const state = { v: 0 };
      setText(`${prefix}${fmt.format(0)}${suffix}`);
      gsap.to(state, {
        v: value,
        duration,
        ease: 'power3.out',
        scrollTrigger: on === 'enter' ? { trigger: el, start: 'top 90%', once: true } : undefined,
        onUpdate: () => {
          setText(`${prefix}${fmt.format(state.v)}${suffix}`);
        },
        onComplete: () => {
          setText(final);
        },
      });
    },
    { dependencies: [value, prefix, suffix, decimals, locale, on], revertOnUpdate: true },
  );

  return (
    <span className={`tabular ${className}`}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden>
        {final}
      </span>
    </span>
  );
}
