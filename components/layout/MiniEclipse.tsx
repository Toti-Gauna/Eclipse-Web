'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollTrigger, useGSAP } from '@/components/motion/gsap';

/**
 * 20px eclipse that doubles as the reading-progress indicator: total eclipse at
 * the top of the page, full sun at the bottom. Updated straight on the DOM (no
 * React re-render per scroll frame).
 */
export function MiniEclipse({ size = 20 }: { size?: number }) {
  const t = useTranslations('header');
  const root = useRef<HTMLSpanElement>(null);
  const moon = useRef<SVGCircleElement>(null);
  const glow = useRef<SVGCircleElement>(null);
  const lastStep = useRef(-1);

  useGSAP(
    () => {
      const update = (p: number) => {
        moon.current?.setAttribute('transform', `translate(${(p * 15).toFixed(2)} ${(-p * 7).toFixed(2)})`);
        glow.current?.setAttribute('opacity', (0.35 + p * 0.65).toFixed(2));
        const step = Math.round(p * 20) * 5;
        if (step !== lastStep.current && root.current) {
          lastStep.current = step;
          root.current.setAttribute('aria-valuenow', String(step));
          root.current.setAttribute('aria-valuetext', t('progress', { value: step }));
        }
      };
      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => update(self.progress),
        onRefresh: (self) => update(self.progress),
      });
      update(st.progress);
    },
    { scope: root },
  );

  return (
    <span
      ref={root}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-valuetext={t('progress', { value: 0 })}
      aria-label={t('progressLabel')}
      className="inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden className="overflow-hidden rounded-full">
        <defs>
          <radialGradient id="mini-eclipse-glow" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#FFE8B0" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#F5B942" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F5B942" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle ref={glow} cx="10" cy="10" r="10" fill="url(#mini-eclipse-glow)" opacity="0.35" />
        <circle cx="10" cy="10" r="6.4" fill="#FFE8B0" />
        <circle cx="10" cy="10" r="6.9" fill="none" stroke="#F5B942" strokeWidth="0.8" opacity="0.9" />
        <circle ref={moon} cx="10" cy="10" r="6.6" fill="#05050A" />
      </svg>
    </span>
  );
}
