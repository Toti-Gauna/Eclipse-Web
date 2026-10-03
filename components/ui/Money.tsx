'use client';

import { useLayoutEffect, useRef } from 'react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { formatMoney } from '@/lib/pricing';

/** A USD amount rendered in the active currency. */
export function Money({ usd, approx, className }: { usd: number; approx?: boolean; className?: string }) {
  const { format } = useCurrency();
  return <span className={`tabular ${className ?? ''}`}>{format(usd, { approx })}</span>;
}

/**
 * Same as <Money>, but the number "rolls" to its new value when it changes
 * (totals in the builder, the calculator output, plan cards).
 * Pair it with an aria-live region that announces the final value.
 */
export function AnimatedMoney({ usd, approx, className, duration = 0.6 }: { usd: number; approx?: boolean; className?: string; duration?: number }) {
  const { currency, rates, locale, format } = useCurrency();
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(usd);

  // Mutates the existing text node (never replaces it) so React stays in sync.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setText = (text: string) => {
      if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = text;
      else el.textContent = text;
    };
    const from = shown.current;
    if (from === usd || prefersReducedMotion()) {
      shown.current = usd;
      setText(format(usd, { approx }));
      return;
    }
    const state = { v: from };
    const tween = gsap.to(state, {
      v: usd,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        shown.current = state.v;
        setText(formatMoney(state.v, currency, rates, locale, { approx }));
      },
      onComplete: () => {
        shown.current = usd;
        setText(format(usd, { approx }));
      },
    });
    return () => {
      tween.kill();
    };
  }, [usd, currency, rates, locale, format, approx, duration]);

  return (
    <span ref={ref} className={`tabular ${className ?? ''}`}>
      {format(usd, { approx })}
    </span>
  );
}
