'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useIsClient } from '@/components/motion/useIsClient';
import { useReducedMotion } from '@/components/motion/useReducedMotion';
import { Eclipse } from './Eclipse';
import { Starfield } from './Starfield';
import { useHeroState } from './HeroState';
import { useCorona } from './corona/useCorona';
import { useStarParallax } from './useStarParallax';
import { useHeroMotion } from './useHeroMotion';
import { LIMB_POINT } from './geometry';
import { Dial } from './Dial';
import { useDial } from './useDial';
import { l, verticals } from '@/lib/content';
import type { Locale } from '@/i18n/routing';

/**
 * Full-bleed visual layer of the hero (behind the copy, decorative).
 *
 * Layers, back to front: warm sky (scroll) · stars (parallax) · bloom (scroll) ·
 * eclipse (CSS corona first paint → WebGL corona when supported) · the dial
 * (instrument bezel, aimed by the rubro chips) · diamond ring (reveal only).
 * Wrappers keep every motion on its own element:
 *   [data-hero-eclipse-motion] parallax x/y + scroll scale
 *   [data-hero-eclipse]        entrance (opacity + scale)
 *   [data-eclipse-moon-scroll] scroll moon offset · [data-eclipse-moon] reveal moon offset
 */
export function HeroStage() {
  const { phase, bus, registerDial } = useHeroState();
  const reduced = useReducedMotion();
  const isClient = useIsClient();
  const motion = isClient && !reduced;
  const locale = useLocale() as Locale;
  const stage = useRef<HTMLDivElement>(null);
  const glHost = useRef<HTMLDivElement>(null);
  const bezel = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  const covered = phase === 'open';

  const names = useMemo(() => verticals.map((v) => l(v.name, locale)), [locale]);
  const dialController = useDial(bezel, readout, names, motion);
  useEffect(() => {
    registerDial(dialController);
    return () => registerDial(null);
  }, [registerDial, dialController]);

  const setCoronaActive = useCorona(glHost, bus);
  useStarParallax(stage, motion);
  useHeroMotion(stage, bus, motion);

  // Pause the corona (WebGL loop and CSS animations) when nobody can see it:
  // hero off-screen, tab hidden or the stage covered by the demo light.
  const coveredRef = useRef(covered);
  useEffect(() => {
    coveredRef.current = covered;
  }, [covered]);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let inView = true;
    const sync = () => {
      const visible = inView && !document.hidden;
      el.toggleAttribute('data-paused', !visible || coveredRef.current);
      setCoronaActive(visible && !coveredRef.current);
    };
    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [setCoronaActive, covered]);

  return (
    <div ref={stage} data-hero-stage aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {motion ? <div data-hero-sky className="hero-sky absolute inset-0" /> : null}
      <Starfield />
      <div data-hero-eclipse-anchor className="hero-eclipse-anchor">
        <div data-hero-eclipse-motion className="relative">
          {motion ? <div data-hero-bloom className="hero-bloom" /> : null}
          <div data-hero-eclipse className="relative">
            <Eclipse className="[--eclipse-size:var(--hero-eclipse-size)]">
              <div ref={glHost} data-corona-host className="eclipse-gl-host" />
            </Eclipse>
            <Dial bezelRef={bezel} readoutRef={readout} />
            {phase !== 'closed' && !reduced ? (
              <div
                data-diamond
                className="eclipse-diamond"
                style={{ left: `${LIMB_POINT.x * 100}%`, top: `${LIMB_POINT.y * 100}%` }}
              >
                <span data-diamond-flare className="eclipse-diamond-flare" />
                <span data-diamond-core className="eclipse-diamond-core" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
