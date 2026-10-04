'use client';

import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import { gsap } from '@/components/motion/gsap';
import { DIAL_POINTER_DEG, dialAngle } from './Dial';

export interface DialController {
  /** Turns the bezel until rubro `index` sits under the pointer; null releases it (it rests there). */
  aimAt: (index: number | null) => void;
}

/**
 * Drives the dial's bezel. It only moves on interaction (v3: no permanent decorative
 * animation; the v2 idle drift kept a compositor animation running forever): aimed at a
 * rubro, GSAP turns it the shortest way until that rubro's number sits under the
 * pointer; released, it stays where it is.
 * The readout under the dial shows the rubro it points at (`names[index]`).
 * Without motion aiming is instant.
 */
export function useDial(
  bezel: RefObject<HTMLDivElement | null>,
  readout: RefObject<HTMLDivElement | null>,
  names: string[],
  motion: boolean,
): DialController {
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
      if (index === null) return;

      const current = Number(gsap.getProperty(el, 'rotation')) || 0;
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
