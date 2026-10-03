'use client';

import { useEffect, useId, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from '@/components/motion/useReducedMotion';

/** Where the moon ends up (viewBox units) once it has fully left the sun. */
const MOON_PATH = { x: -12.6, y: 6.4 };

/**
 * The logo's eclipse doubles as the reading-progress indicator. At the top of the
 * page it is in totality (corona ring + diamond-ring glint); scrolling slides the
 * moon away toward the lower left and the sun comes out, glowing, by the bottom
 * ("dawn"). The moon is a mask, so the uncovered sun reads on any header theme.
 *
 * Updates go straight to SVG attributes (transform / opacity), at most once per
 * frame, without re-rendering React. With reduced motion it stays at totality.
 */
export function MiniEclipse({ size = 22 }: { size?: number }) {
  const t = useTranslations('header');
  const reduced = useReducedMotion();
  const uid = `me${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const root = useRef<HTMLSpanElement>(null);
  const moon = useRef<SVGCircleElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const glow = useRef<SVGCircleElement>(null);
  const glint = useRef<SVGGElement>(null);
  const lastStep = useRef(-1);

  useEffect(() => {
    const draw = (p: number) => {
      moon.current?.setAttribute('transform', `translate(${(p * MOON_PATH.x).toFixed(2)} ${(p * MOON_PATH.y).toFixed(2)})`);
      ring.current?.setAttribute('opacity', Math.max(0, 1 - p * 3.2).toFixed(3));
      glint.current?.setAttribute('opacity', Math.max(0, 1 - p * 7).toFixed(3));
      glow.current?.setAttribute('opacity', (0.12 + p * 0.88).toFixed(3));
    };
    const announce = (p: number) => {
      const step = Math.round(p * 20) * 5;
      if (step === lastStep.current || !root.current) return;
      lastStep.current = step;
      root.current.setAttribute('aria-valuenow', String(step));
      root.current.setAttribute('aria-valuetext', t('progress', { value: step }));
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      announce(p);
      draw(reduced ? 0 : p);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [reduced, t]);

  return (
    <span
      ref={root}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-valuetext={t('progress', { value: 0 })}
      aria-label={t('progressLabel')}
      className="mini-eclipse inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false" className="overflow-visible">
        <defs>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="40%" stopColor="#FFE8B0" stopOpacity="0.85" />
            <stop offset="62%" stopColor="#F5B942" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F5B942" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-sun`} cx="45%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#FFFAF0" />
            <stop offset="60%" stopColor="#FFE8B0" />
            <stop offset="100%" stopColor="#F5B942" />
          </radialGradient>
          <mask id={`${uid}-moon`} maskUnits="userSpaceOnUse" x="-8" y="-8" width="40" height="40">
            <rect x="-8" y="-8" width="40" height="40" fill="#fff" />
            <circle ref={moon} cx="12" cy="12" r="6.75" fill="#000" />
          </mask>
        </defs>
        <circle ref={glow} cx="12" cy="12" r="12" fill={`url(#${uid}-glow)`} opacity="0.12" />
        {/* The sun's limb, so the covered part still reads (as in <PhaseGlyph>). */}
        <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="0.75" />
        <circle cx="12" cy="12" r="6.5" fill={`url(#${uid}-sun)`} mask={`url(#${uid}-moon)`} />
        <circle ref={ring} cx="12" cy="12" r="8.6" fill="none" stroke="#F5B942" strokeWidth="0.9" />
        <g ref={glint} className="mini-eclipse-glint">
          <circle cx="16.95" cy="7.05" r="1.35" fill="#FFF8E6" />
          <path d="M16.95 3.6v6.9M13.5 7.05h6.9" stroke="#FFF8E6" strokeWidth="0.5" strokeLinecap="round" opacity="0.85" />
        </g>
      </svg>
    </span>
  );
}
