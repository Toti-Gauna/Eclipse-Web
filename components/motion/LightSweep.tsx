'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { observeEnter } from './observeEnter';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Passes a diagonal amber light over its children once, when they enter the
 * viewport. Purely decorative overlay (aria-hidden), transform-only animation:
 * a CSS animation (`.light-sweep-beam[data-sweep]`, globals "v2 · motion signature")
 * started by a pooled IntersectionObserver — no ScrollTrigger, no style reads.
 */
export function LightSweep({ children, className = '' }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const beam = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    const b = beam.current;
    if (!el || !b || prefersReducedMotion()) return;
    const stop = observeEnter(el, 'top 85%', () => b.setAttribute('data-sweep', ''));
    const end = () => b.removeAttribute('data-sweep');
    b.addEventListener('animationend', end);
    return () => {
      stop();
      b.removeEventListener('animationend', end);
      end();
    };
  }, []);

  return (
    <span ref={root} className={`relative inline-block overflow-hidden align-top ${className}`}>
      {children}
      <span
        ref={beam}
        aria-hidden
        className="light-sweep-beam pointer-events-none absolute inset-y-0 -left-1/4 w-[150%] opacity-0"
      />
    </span>
  );
}
