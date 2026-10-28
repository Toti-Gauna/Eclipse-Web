'use client';

import type { RefObject } from 'react';
import { useGSAP } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { LOADER_DONE_EVENT, loaderRemainingMs } from '@/components/loader/loaderState';
import { plateLife } from '@/components/sections/products/artIdle';

/**
 * Draws a page's top plate once, as soon as the page shows: right after the loader opens (or at
 * once if the visitor skips it, or after a client navigation, where there is no loader); then the
 * plate keeps moving while it is on screen (artIdle).
 * The initial state is set before the first paint (useGSAP is a layout effect), so the plate never
 * flashes finished and then hides. Reduced motion: nothing, the plate is just there.
 */
export function useMountEntrance(ref: RefObject<HTMLElement | null>, duration = 1.3) {
  useGSAP(
    () => {
      const frame = ref.current;
      if (!frame || prefersReducedMotion()) return;
      const life = plateLife(frame, { duration });
      const play = () => life.entrance.play();
      const timer = window.setTimeout(play, loaderRemainingMs() + 60);
      window.addEventListener(LOADER_DONE_EVENT, play, { once: true });
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener(LOADER_DONE_EVENT, play);
        life.dispose();
      };
    },
    { scope: ref },
  );
}
