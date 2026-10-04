'use client';

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * True once the element has entered the viewport (from either direction).
 * Fires once; geometry only, so it works while <Reveal> still hides the block.
 */
export function useInViewOnce<T extends Element>(ref: RefObject<T | null>, rootMargin = '0px 0px -6% 0px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, inView]);
  return inView;
}

/**
 * True while the element intersects the viewport (both directions, every time).
 * IntersectionObserver only: nothing runs per scroll event.
 */
export function useInView<T extends Element>(ref: RefObject<T | null>, rootMargin = '0px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last) setInView(last.isIntersecting);
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/**
 * True once the element's top has scrolled above the top of the viewport (and back to
 * false when it comes down again). Observe a zero-height sentinel to know when a sticky
 * sibling is actually stuck. IntersectionObserver only.
 */
export function useScrolledPast<T extends Element>(ref: RefObject<T | null>): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last) setPast(!last.isIntersecting && last.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return past;
}

/**
 * A number that counts up from 0 the first time `started` becomes true, then
 * rolls from its current value to every new one (slider changes, currency switch).
 *
 * - SSR / no-JS render the final value; the client holds it at 0 until `started`.
 * - Reduced motion: always the final value, instantly.
 * - The animated digits are aria-hidden; screen readers get the final value from a
 *   visually hidden twin (unless `srOnly={false}`, e.g. when an aria-live region
 *   announces it elsewhere).
 */
export function RollingNumber({
  value,
  format,
  started,
  duration = 0.6,
  introDuration = 1.6,
  srOnly = true,
  className = '',
}: {
  value: number;
  /** Must be referentially stable (useCallback) — it formats every frame. */
  format: (value: number) => string;
  started: boolean;
  duration?: number;
  introDuration?: number;
  srOnly?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  /** Value currently on screen; null until the intro count-up has started. */
  const shown = useRef<number | null>(null);

  // Mutates the existing text node (never replaces it) so React stays in sync.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const setText = (text: string) => {
      if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) el.firstChild.nodeValue = text;
      else el.textContent = text;
    };
    if (prefersReducedMotion()) {
      shown.current = value;
      setText(format(value));
      return;
    }
    if (!started) {
      shown.current = null;
      setText(format(0));
      return;
    }
    const intro = shown.current === null;
    const from = shown.current ?? 0;
    if (from === value) {
      shown.current = value;
      setText(format(value));
      return;
    }
    const state = { v: from };
    setText(format(from));
    const tween = gsap.to(state, {
      v: value,
      duration: intro ? introDuration : duration,
      ease: 'power3.out',
      onUpdate: () => {
        shown.current = state.v;
        setText(format(state.v));
      },
      onComplete: () => {
        shown.current = value;
        setText(format(value));
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, format, started, duration, introDuration]);

  const final = format(value);
  return (
    <span className={`tabular ${className}`}>
      {srOnly ? <span className="sr-only">{final}</span> : null}
      <span ref={ref} aria-hidden>
        {final}
      </span>
    </span>
  );
}
