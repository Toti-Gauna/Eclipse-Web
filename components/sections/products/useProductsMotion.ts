'use client';

import { useRef, type RefObject } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/components/motion/gsap';
import { observeEnter } from '@/components/motion/observeEnter';
import { artEntrance } from './artMotion';

/**
 * Where the products banner becomes a horizontal track: wide screens with a mouse or a trackpad
 * (the hero's own rule: never pin on touch, it fights momentum scrolling and the toolbars) and
 * motion allowed. products.css has the same query to size the stacked screens one screen tall,
 * so the page measures the same before and after hydration (pinned: 1 screen + 3 of scroll).
 */
export const TRACK_QUERY =
  '(min-width: 1024px) and (min-height: 600px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

export interface ProductsMotion {
  /** Moves the page to a product's screen (the rail's buttons, focus inside an off-screen one). */
  goTo: (index: number) => void;
}

/**
 * The banner's motion (gsap.matchMedia):
 * - Track (TRACK_QUERY): the stage is pinned for (n − 1) screens of scroll with its own spacer
 *   ([data-pd-pin-spacer], so ScrollTrigger never re-parents the stage); scrubbed, the track
 *   slides one product per screen, each plate drifts against its copy (depth), the disc behind
 *   passes across (the occultation) and the rail's playhead follows. Each plate is drawn the first
 *   time its screen comes in (artEntrance).
 * - Touch screens, narrow or short screens: no pin. The screens stack and each plate is drawn
 *   once when it reaches the reading line (one pooled IntersectionObserver, no ScrollTrigger).
 * - Reduced motion: nothing; every plate is already drawn.
 * `onIndex` (a state setter: stable) fires only when the current product changes (the rail re-renders 4 times per pass).
 */
export function useProductsMotion(root: RefObject<HTMLElement | null>, onIndex: (index: number) => void): ProductsMotion {
  const api = useRef<ProductsMotion>({ goTo: () => {} });

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const stage = section.querySelector<HTMLElement>('[data-pd-stage]');
      const track = section.querySelector<HTMLElement>('[data-pd-track]');
      const screens = gsap.utils.toArray<HTMLElement>('[data-pd-screen]', section);
      if (!stage || !track || !screens.length) return;
      const n = screens.length;
      const mm = gsap.matchMedia();

      mm.add({ track: TRACK_QUERY, motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
        const conditions = ctx.conditions as { track: boolean; motion: boolean };
        if (!conditions.motion) return;
        const plates = screens.map((s) => s.querySelector<HTMLElement>('[data-pd-art]'));
        const entrances = plates.map((p) => (p ? artEntrance(p) : null));

        if (!conditions.track) {
          const cancels = screens.map((screen, i) => observeEnter(screen, 'top 70%', () => void entrances[i]?.play()));
          return () => cancels.forEach((cancel) => cancel());
        }

        section.dataset.mode = 'track';
        const spacer = stage.parentElement?.matches('[data-pd-pin-spacer]') ? stage.parentElement : undefined;
        const fill = section.querySelector<HTMLElement>('[data-pd-fill]');
        const orb = section.querySelector<HTMLElement>('[data-pd-orb]');
        let current = -1;
        const slide = gsap.to(track, { xPercent: (-100 * (n - 1)) / n, ease: 'none' });
        const st = ScrollTrigger.create({
          trigger: stage,
          start: 'top top',
          end: () => `+=${stage.offsetHeight * (n - 1)}`,
          pin: stage,
          pinSpacer: spacer,
          anticipatePin: 1,
          scrub: 0.6,
          animation: slide,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const i = Math.round(self.progress * (n - 1));
            if (i !== current) {
              current = i;
              onIndex(i);
            }
            if (fill) fill.style.transform = `scaleX(${self.progress.toFixed(4)})`;
          },
        });
        // The disc drifts behind the plates' side only (never across the copy).
        if (orb) gsap.fromTo(orb, { xPercent: 35 }, { xPercent: -45, ease: 'none', scrollTrigger: { trigger: stage, start: 'top top', end: () => `+=${stage.offsetHeight * (n - 1)}`, scrub: 0.9 } });

        screens.forEach((screen, i) => {
          const plate = plates[i];
          const copy = screen.querySelector('[data-pd-copy]');
          // Depth: the plate drifts a little faster than its copy while its screen crosses.
          if (plate)
            gsap.fromTo(plate, { xPercent: 14 }, { xPercent: -14, ease: 'none', scrollTrigger: { trigger: screen, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true } });
          if (copy)
            gsap.fromTo(copy, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: screen, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true } });
          const play = () => entrances[i]?.play();
          if (i === 0) ScrollTrigger.create({ trigger: stage, start: 'top 75%', once: true, onEnter: play });
          else ScrollTrigger.create({ trigger: screen, containerAnimation: slide, start: 'left 65%', once: true, onEnter: play });
        });

        api.current.goTo = (index: number) => {
          const top = st.start + ((st.end - st.start) * index) / (n - 1);
          window.scrollTo({ top, behavior: Math.abs(window.scrollY - top) > window.innerHeight * 2.5 ? 'auto' : 'smooth' });
        };
        // Keyboard: focus inside a screen that is off to the side brings the page to it
        // (the stage clips with `overflow: clip`, so the browser can't scroll it sideways).
        const onFocus = (e: FocusEvent) => {
          const i = screens.findIndex((s) => s.contains(e.target as Node));
          if (i >= 0 && i !== current) api.current.goTo(i);
        };
        stage.addEventListener('focusin', onFocus);
        return () => {
          stage.removeEventListener('focusin', onFocus);
          api.current.goTo = () => {};
          delete section.dataset.mode;
          if (fill) fill.style.transform = '';
          current = -1;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return { goTo: (index) => api.current.goTo(index) };
}
