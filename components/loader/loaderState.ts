'use client';

import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { LOADER_DONE_EVENT, LOADER_REDUCED_REVEAL_AT_MS, LOADER_REVEAL_AT_MS } from './constants';

export { LOADER_DONE_EVENT };

declare global {
  interface Window {
    __eclipseLoaderAt?: number;
  }
}

/** True while the loader covers (or is about to uncover) this page view. False once skipped or done. */
export function loaderActive(): boolean {
  return typeof document !== 'undefined' && document.documentElement.getAttribute('data-loader') === 'on';
}

/**
 * Milliseconds until the loader starts revealing the page (0 if there is no loader,
 * it was skipped, or it already opened). Use it to delay entrance animations, and
 * listen to LOADER_DONE_EVENT if they should start early when the visitor skips.
 */
export function loaderRemainingMs(): number {
  if (!loaderActive()) return 0;
  const start = window.__eclipseLoaderAt ?? 0;
  const at = prefersReducedMotion() ? LOADER_REDUCED_REVEAL_AT_MS : LOADER_REVEAL_AT_MS;
  return Math.max(0, start + at - performance.now());
}
