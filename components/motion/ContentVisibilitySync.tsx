'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/components/motion/gsap';

/** Added to <html> to render every `.cv-section` for good (see app/globals.css). */
export const CV_OFF_CLASS = 'cv-off';

/**
 * Companion of `.cv-section` (content-visibility: auto on the sections below the fold).
 * Those sections start with an estimated height and take their real one when they get
 * close to the viewport, so:
 * - ScrollTrigger measures again (safe mode: after the scroll ends) whenever <main>
 *   changes height, keeping the header's light zones and section triggers exact;
 * - a page opened on a #hash renders everything first, so the browser lands exactly.
 * In-page anchor clicks do the same through <SmoothAnchors>.
 */
export function ContentVisibilitySync() {
  useEffect(() => {
    if (window.location.hash) document.documentElement.classList.add(CV_OFF_CLASS);
    const main = document.getElementById('main');
    if (!main) return;
    let height = main.offsetHeight;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      const next = main.offsetHeight;
      if (Math.abs(next - height) < 2) return;
      height = next;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(true), 150);
    });
    ro.observe(main);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);
  return null;
}
