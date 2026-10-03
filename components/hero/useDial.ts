'use client';

import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import { gsap } from '@/components/motion/gsap';
import { DIAL_POINTER_DEG, dialAngle } from './Dial';

/** Seconds per turn of the idle drift (must match `.hero-dial-bezel` in hero.css). */
const DRIFT_S = 240;

export interface DialController {
  /** Turns the bezel until rubro `index` sits under the pointer; null lets it drift again. */
  aimAt: (index: number | null) => void;
}

/** Current rotation of an element driven by a CSS animation (deg). */
function cssAngle(el: HTMLElement): number {
  const m = getComputedStyle(el).transform;
  if (!m || m === 'none') return 0;
  const v = m.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number);
  return v ? (Math.atan2(v[1], v[0]) * 180) / Math.PI : 0;
}

const norm = (deg: number) => ((deg % 360) + 360) % 360;

/**
 * Drives the dial's bezel. Idle: a slow CSS rotation (compositor only, paused
 * with the stage). Aimed: the CSS animation is frozen where it is and GSAP turns
 * the bezel along the shortest way; released: the CSS drift resumes from that
 * exact angle (negative animation-delay), so it never jumps.
 * The readout under the dial shows the rubro it points at (`names[index]`).
 * Without motion the bezel is still and aiming is instant.
 */
export function useDial(
  bezel: RefObject<HTMLDivElement | null>,
  readout: RefObject<HTMLDivElement | null>,
  names: string[],
  motion: boolean,
): DialController {
  const aimed = useRef(false);
  const tween = useRef<gsap.core.Tween | null>(null);
  const namesRef = useRef(names);
  const motionRef = useRef(motion);
  useEffect(() => {
    namesRef.current = names;
    motionRef.current = motion;
  });

  useEffect(
    () => () => {
      tween.current?.kill();
    },
    [],
  );

  const aimAt = useCallback(
    (index: number | null) => {
      const el = bezel.current;
      const out = readout.current;
      if (!el) return;

      if (out) {
        out.toggleAttribute('data-on', index !== null);
        if (index !== null) {
          const idx = out.querySelector('[data-readout-index]');
          const name = out.querySelector('[data-readout-name]');
          if (idx) idx.textContent = String(index + 1).padStart(2, '0');
          if (name) name.textContent = namesRef.current[index] ?? '';
        }
      }
      el.querySelectorAll('[data-dial-label]').forEach((label) =>
        label.toggleAttribute('data-on', Number(label.getAttribute('data-dial-label')) === index),
      );

      if (index === null) {
        if (!aimed.current) return;
        aimed.current = false;
        tween.current?.kill();
        const angle = norm(Number(gsap.getProperty(el, 'rotation')) || 0);
        gsap.set(el, { clearProps: 'transform', animationDelay: `${(-angle / 360) * DRIFT_S}s` });
        el.removeAttribute('data-aimed');
        return;
      }

      let current: number;
      if (!aimed.current) {
        current = cssAngle(el);
        el.setAttribute('data-aimed', '');
        gsap.set(el, { rotation: current });
        aimed.current = true;
      } else {
        current = Number(gsap.getProperty(el, 'rotation')) || 0;
      }
      const target = DIAL_POINTER_DEG - dialAngle(index, namesRef.current.length || undefined);
      const delta = ((((target - current) % 360) + 540) % 360) - 180;
      tween.current?.kill();
      if (!motionRef.current) {
        gsap.set(el, { rotation: current + delta });
        return;
      }
      tween.current = gsap.to(el, { rotation: current + delta, duration: 1.15, ease: 'expo.out' });
    },
    [bezel, readout],
  );

  return useMemo(() => ({ aimAt }), [aimAt]);
}
