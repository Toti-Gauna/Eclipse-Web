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
import { Dial } from './Dial';
import { useDial } from './useDial';
import { l, verticals } from '@/lib/content';
import type { Locale } from '@/i18n/routing';
import { useDemoExperienceOpen } from '@/components/demo-experience/store';

/**
 * Full-bleed visual layer of the hero (behind the copy, decorative).
 *
 * Layers, back to front: warm sky (scroll) · stars (mouse parallax) · bloom (scroll) ·
 * eclipse (CSS corona first paint → WebGL corona when supported) · the dial
 * (instrument bezel, aimed by the rubro chips).
 * Nothing here moves on its own (v3): the entrance, the scroll scrub, the pointer and the
 * chips move it; at rest it is a still picture that costs no frames.
 * Wrappers keep every motion on its own element:
 *   [data-hero-eclipse-motion] parallax x/y + scroll scale
 *   [data-hero-eclipse]        entrance (opacity + scale)
 *   [data-eclipse-moon-scroll] scroll moon offset
 */
export function HeroStage() {
  const { bus, registerDial } = useHeroState();
  const reduced = useReducedMotion();
  const isClient = useIsClient();
  const motion = isClient && !reduced;
  const locale = useLocale() as Locale;
  const stage = useRef<HTMLDivElement>(null);
  const glHost = useRef<HTMLDivElement>(null);
  const bezel = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  // The "Ver demo" layer covers the whole viewport while it is open.
  const covered = useDemoExperienceOpen();

  const names = useMemo(() => verticals.map((v) => l(v.name, locale)), [locale]);
  const dialController = useDial(bezel, readout, names, motion);
  useEffect(() => {
    registerDial(dialController);
    return () => registerDial(null);
  }, [registerDial, dialController]);

  const setCoronaActive = useCorona(glHost, bus);
  useStarParallax(stage, motion);
  useHeroMotion(stage, bus, motion);

  // The WebGL corona never draws when nobody can see it: hero off-screen, tab
  // hidden or the page covered by the demo layer.
  const coveredRef = useRef(covered);
  useEffect(() => {
    coveredRef.current = covered;
  }, [covered]);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let inView = true;
    const sync = () => setCoronaActive(inView && !document.hidden && !coveredRef.current);
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
          </div>
        </div>
      </div>
    </div>
  );
}
