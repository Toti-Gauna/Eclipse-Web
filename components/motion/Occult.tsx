'use client';

import { useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP } from './gsap';
import { prefersReducedMotion } from './useReducedMotion';

export type OccultShape = 'circle' | 'inset';
export type OccultEdge = 'left' | 'right' | 'top' | 'bottom' | 'center';

/** Inset reveal: the light comes in from this edge (clip-path inset(top right bottom left)). */
const HIDDEN_INSET: Record<OccultEdge, [number, number, number, number]> = {
  left: [0, 100, 0, 0],
  right: [0, 0, 0, 100],
  top: [0, 0, 100, 0],
  bottom: [100, 0, 0, 0],
  center: [0, 50, 0, 50],
};

const inset = ([t, r, b, l]: number[], round: string) => `inset(${t}% ${r}% ${b}% ${l}%${round ? ` round ${round}` : ''})`;

type OccultProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  /** 'circle': a disc of light grows from `at` · 'inset': an edge passes, from `from`. */
  shape?: OccultShape;
  /** Inset only: the edge the light comes from. Default 'left'. */
  from?: OccultEdge;
  /** Circle only: where the disc is born, as "x% y%" of the box. Default "50% 50%". */
  at?: string;
  /** Inset only: corner radius kept while revealing (e.g. "20px"). */
  round?: string;
  /** 'enter' (default): the first time it scrolls in. 'mount': right away (e.g. a re-keyed stage). */
  on?: 'enter' | 'mount';
  /** ScrollTrigger start for on="enter". */
  start?: string;
  duration?: number;
  delay?: number;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/**
 * Motion signature #1 — "Occultation": the content is uncovered by a disc of
 * light growing (`circle`) or by an edge passing over it (`inset`), once.
 * clip-path only; the final state clears the clip so nothing stays clipped.
 *
 *   <Occult shape="circle" at="70% 30%">…</Occult>
 *   <Occult from="left" round="20px" on="mount" key={id}>…</Occult>
 *
 * Content is fully visible without JS and with reduced motion. With
 * on="enter", content that is already on screen when it mounts (a reload
 * mid-page, a deep link) is left as is instead of hiding and replaying.
 */
export function Occult<T extends ElementType = 'div'>({
  as,
  children,
  shape = 'inset',
  from = 'left',
  at = '50% 50%',
  round = '',
  on = 'enter',
  start = 'top 82%',
  duration = 0.9,
  delay = 0,
  className,
  ...rest
}: OccultProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      if (on === 'enter') {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.75 && r.bottom > 0) return;
      }

      let hidden: string;
      let shown: string;
      if (shape === 'circle') {
        // Radius in px that reaches the farthest corner from the birth point.
        const { width: w, height: h } = el.getBoundingClientRect();
        const [px, py] = at.split(/\s+/).map((v) => parseFloat(v) / 100);
        const x = (Number.isFinite(px) ? px : 0.5) * w;
        const y = (Number.isFinite(py) ? py : 0.5) * h;
        const far = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 2;
        hidden = `circle(0px at ${x}px ${y}px)`;
        shown = `circle(${far}px at ${x}px ${y}px)`;
      } else {
        hidden = inset(HIDDEN_INSET[from], round);
        shown = inset([0, 0, 0, 0], round);
      }

      gsap.fromTo(
        el,
        { clipPath: hidden },
        {
          clipPath: shown,
          duration,
          delay,
          ease: 'expo.inOut',
          clearProps: 'clipPath',
          scrollTrigger: on === 'enter' ? { trigger: el, start, once: true } : undefined,
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
