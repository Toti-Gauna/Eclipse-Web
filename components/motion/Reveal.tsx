'use client';

import { useRef, type ElementType, type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { prefersReducedMotion } from './useReducedMotion';

type RevealProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  /** Seconds between children. Default 0.06 (60 ms). */
  stagger?: number;
  /** ScrollTrigger start. */
  start?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/**
 * Section entrance: every descendant with [data-reveal] fades in and rises 24px,
 * staggered 60 ms, once, when the block enters the viewport.
 * Content is fully visible without JS and with reduced motion.
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

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;
      const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
      if (!targets.length) return;
      gsap.from(targets, {
        autoAlpha: 0,
        y: 24,
        duration: 0.9,
        ease: 'expo.out',
        stagger,
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: root, start, once: true },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
