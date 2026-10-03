'use client';

import { LOADER_IRIS_AT_MS } from './Loader';

declare global {
  interface Window {
    __eclipseLoaderAt?: number;
  }
}

/** True if the first-visit loader is (or was) showing on this page view. */
export function loaderActive(): boolean {
  return typeof document !== 'undefined' && document.documentElement.getAttribute('data-loader') === 'on';
}

/**
 * Milliseconds until the loader starts revealing the page (0 if there is no
 * loader or it already opened). Use it to delay hero entrance animations.
 */
export function loaderRemainingMs(): number {
  if (!loaderActive()) return 0;
  const start = window.__eclipseLoaderAt ?? 0;
  return Math.max(0, start + LOADER_IRIS_AT_MS - performance.now());
}
