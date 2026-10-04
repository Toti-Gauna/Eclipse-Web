'use client';

import { useEffect, type RefObject } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/components/motion/gsap';
import { loaderRemainingMs } from '@/components/loader/loaderState';
import type { HeroMotionBus } from './HeroState';
import { DISC_RADIUS, MOON_DIR, SCROLL_MOON } from './geometry';

/**
 * Where the hero is pinned (if it fits the screen; the section then gets [data-pinned]):
 * wide, tall screens driven by a mouse or trackpad. Touch screens (phones, iPads) are
 * never pinned: a pin fights momentum scrolling and the browser toolbars there.
 */
const HERO_PIN_QUERY = '(min-width: 768px) and (min-height: 600px) and (hover: hover) and (pointer: fine)';
/** How long the WebGL corona keeps moving after each scroll update (it rests otherwise). */
const CORONA_WAKE_MS = 700;

/** Below this the loader is not covering the hero anymore: never hide what's painted. */
const MIN_COVER_MS = 160;

/**
 * Hero entrance (first visit only, when the loader's iris opens) and the
 * scroll timeline.
 *
 * Entrance: stars fade in, the eclipse ignites (scale + glow bloom), chips and
 * CTAs stagger in. The eyebrow, H1 and subtitle are never touched (LCP / CLS).
 * Initial states are set from JS while the loader still covers the page; on
 * repeat visits (no loader) nothing is hidden and there is no entrance.
 *
 * Scroll (gsap.matchMedia):
 * - ≥768px wide and ≥600px tall with a mouse/trackpad (and the hero fits the
 *   screen): the hero is pinned for 100vh with its own spacer; scrubbed, the moon
 *   slides diagonally (toward third contact), the corona/bloom brighten, the sky warms
 *   and the copy drifts up a little.
 * - Touch screens (phones, tablets) and short screens: same timeline, scrubbed while
 *   the hero scrolls away, no pin (pinning on touch fights momentum scrolling and the
 *   toolbars, and a pin would cut the demo reveal, which is taller than the screen on
 *   phones).
 * - Reduced motion: nothing.
 * The reveal lives on its own layers ([data-eclipse-moon], the light) so the two
 * never animate the same property.
 */
export function useHeroMotion(stageRef: RefObject<HTMLElement | null>, bus: RefObject<HeroMotionBus>, enabled: boolean) {
  // With or without motion: every trigger on the page is measured again once the
  // web fonts are in and whenever the hero's height changes (the demo reveal makes
  // it taller on phones). Safe mode: debounced, and it waits for an ongoing scroll
  // to end — a plain refresh() restores the scroll position it started from, which
  // would cancel the reveal's smooth scroll back to the top of the hero.
  useEffect(() => {
    const section = stageRef.current?.closest<HTMLElement>('[data-hero]');
    if (!section) return;
    let raf = 0;
    let disposed = false;
    const refresh = () => {
      if (raf || disposed) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        ScrollTrigger.refresh(true);
      });
    };
    document.fonts?.ready.then(refresh);
    let height = section.offsetHeight;
    const ro = new ResizeObserver(() => {
      const next = section.offsetHeight;
      if (Math.abs(next - height) < 1) return;
      height = next;
      refresh();
    });
    ro.observe(section);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [stageRef]);

  useGSAP(
    () => {
      const stage = stageRef.current;
      const section = stage?.closest<HTMLElement>('[data-hero]');
      if (!enabled || !stage || !section) return;

      playEntrance(stage, section);

      const mm = gsap.matchMedia();
      mm.add(
        { pinnable: HERO_PIN_QUERY, motion: '(prefers-reduced-motion: no-preference)' },
        (ctx) => {
          const conditions = ctx.conditions as { pinnable: boolean; motion: boolean };
          if (!conditions.motion) return;
          // Only pin what fits the screen (hero.css/Hero.tsx size the copy for it),
          // so the pinned stretch never hides the CTAs or slips under the header.
          const pin = conditions.pinnable && section.offsetHeight <= window.innerHeight + 2;
          section.toggleAttribute('data-pinned', pin);
          const b = bus.current;
          const q = <T extends Element>(root: Element, sel: string) => root.querySelector<T>(sel);
          const moonPct = SCROLL_MOON * DISC_RADIUS * 100; // % of the eclipse square

          const tl = gsap.timeline({
            defaults: { ease: 'none', duration: 1 },
            // The WebGL corona rests between events: each scroll update keeps it moving a bit.
            onUpdate: () => b.wake?.(CORONA_WAKE_MS),
          });
          tl.fromTo(
            q(stage, '[data-eclipse-moon-scroll]'),
            { xPercent: 0, yPercent: 0 },
            { xPercent: MOON_DIR.x * moonPct, yPercent: MOON_DIR.y * moonPct, ease: 'power1.inOut' },
            0,
          )
            .fromTo(b.scrollMoon, { x: 0, y: 0 }, { x: MOON_DIR.x * SCROLL_MOON, y: MOON_DIR.y * SCROLL_MOON, ease: 'power1.inOut' }, 0)
            .fromTo(b, { scroll: 0 }, { scroll: 1 }, 0)
            .fromTo(q(stage, '[data-hero-bloom]'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1.12 }, 0)
            .fromTo(q(stage, '[data-hero-sky]'), { autoAlpha: 0 }, { autoAlpha: 1 }, 0)
            .fromTo(q(stage, '[data-hero-eclipse-motion]'), { scale: 1 }, { scale: pin ? 1.08 : 1.05 }, 0)
            .fromTo(
              q(section, '[data-hero-copy-inner]'),
              { y: 0 },
              // A drift, not a fade-out: the copy and CTAs stay crisp (and AA) the whole way.
              { y: pin ? -56 : -24, ease: 'power1.in' },
              0,
            );

          const spacer = section.parentElement?.matches('[data-hero-pin-spacer]') ? section.parentElement : undefined;
          ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: pin ? '+=100%' : 'bottom top',
            pin: pin ? section : false,
            pinSpacer: pin ? spacer : undefined,
            anticipatePin: pin ? 1 : 0,
            scrub: pin ? 0.6 : 0.3,
            refreshPriority: 1,
            animation: tl,
          });
          return () => section.removeAttribute('data-pinned');
        },
      );

      // Triggers created earlier (e.g. the header's light zones further down the
      // page) must be measured again now that the pin spacer exists.
      const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => {
        cancelAnimationFrame(raf);
        mm.revert();
      };
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );
}

function playEntrance(stage: HTMLElement, section: HTMLElement) {
  const wait = loaderRemainingMs();
  if (wait < MIN_COVER_MS) return;

  const stars = stage.querySelectorAll('[data-star-layer]');
  const eclipse = stage.querySelector('[data-hero-eclipse]');
  const glow = stage.querySelector('[data-eclipse-glow]');
  const enter = section.querySelectorAll('[data-hero-enter]');

  const tl = gsap.timeline({ delay: wait / 1000 });
  tl.fromTo(stars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.2, stagger: 0.25, ease: 'power2.out', clearProps: 'opacity,visibility' }, 0);
  if (eclipse) {
    tl.fromTo(
      eclipse,
      { autoAlpha: 0, scale: 0.9 },
      { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'opacity,visibility,transform' },
      0.05,
    );
  }
  if (glow) {
    tl.fromTo(
      glow,
      { autoAlpha: 0, scale: 0.55 },
      { autoAlpha: 1, scale: 1, duration: 2.4, ease: 'expo.out', clearProps: 'opacity,visibility,transform' },
      0.2,
    );
  }
  if (enter.length) {
    tl.fromTo(
      enter,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06, ease: 'expo.out', clearProps: 'opacity,visibility,transform' },
      0.35,
    );
  }
}
