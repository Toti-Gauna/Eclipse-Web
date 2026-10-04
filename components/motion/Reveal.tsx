'use client';

import { useLayoutEffect, useRef, type ElementType, type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { observeEnter } from './observeEnter';
import { prefersReducedMotion } from './useReducedMotion';

type RevealProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  /** Seconds between children. Default 0.06 (60 ms). */
  stagger?: number;
  /** Reading line, "top NN%" (when the block's top crosses NN% of the viewport). */
  start?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/** Duration of each child's rise (must match `[data-reveal-root]` in app/globals.css). */
const DURATION_MS = 900;

/**
 * Section entrance: every descendant with [data-reveal] fades in and rises 24px,
 * staggered 60 ms, once, when the block enters the viewport.
 * Content is fully visible without JS and with reduced motion.
 *
 * CSS transitions on opacity + translate (globals, "v2 · motion signature"), started by
 * a pooled IntersectionObserver: no ScrollTrigger updated on every scroll event and no
 * computed-style reads while the section hydrates (v2 created a GSAP tween per block).
 */
export function Reveal<T extends ElementType = 'div'>({
  as,
  children,
  stagger = 0.06,
  start = 'top 82%',
  className,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const targets = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
    if (!targets.length) return;
    const step = Math.round(stagger * 1000);
    targets.forEach((el, i) => el.style.setProperty('--reveal-delay', `${i * step}ms`));
    root.setAttribute('data-reveal-root', 'hidden');
    let timer = 0;
    const done = () => {
      root.removeAttribute('data-reveal-root');
      targets.forEach((el) => el.style.removeProperty('--reveal-delay'));
    };
    const stop = observeEnter(root, start, () => {
      root.setAttribute('data-reveal-root', 'playing');
      timer = window.setTimeout(done, DURATION_MS + step * (targets.length - 1) + 50);
    });
    return () => {
      stop();
      window.clearTimeout(timer);
      done();
    };
  }, [start, stagger]);

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
