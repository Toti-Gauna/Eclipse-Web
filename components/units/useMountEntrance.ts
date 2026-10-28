'use client';

import type { RefObject } from 'react';
import { useGSAP } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { LOADER_DONE_EVENT, loaderRemainingMs } from '@/components/loader/loaderState';
import { artEntrance } from '@/components/sections/products/artMotion';

/**
 * Draws a page's top plate once, as soon as the page shows: right after the loader opens (or at
 * once if the visitor skips it, or after a client navigation, where there is no loader).
 * The initial state is set before the first paint (useGSAP is a layout effect), so the plate never
 * flashes finished and then hides. Reduced motion: nothing, the plate is just there.
 */
export function useMountEntrance(ref: RefObject<HTMLElement | null>, duration = 1.6) {
  useGSAP(
    () => {
      const frame = ref.current;
      if (!frame || prefersReducedMotion()) return;
      const tl = artEntrance(frame, { duration });
      const play = () => tl.play();
      const timer = window.setTimeout(play, loaderRemainingMs() + 120);
      window.addEventListener(LOADER_DONE_EVENT, play, { once: true });
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener(LOADER_DONE_EVENT, play);
      };
    },
    { scope: ref },
  );
}
