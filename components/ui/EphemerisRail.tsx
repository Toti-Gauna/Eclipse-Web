'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { useMediaQuery } from '@/components/motion/useMediaQuery';

const RailView = lazy(() => import('./EphemerisRailView'));

/** Where the rail exists: wide screens only (it lives in the page's side margin). */
export const RAIL_QUERY = '(min-width: 1280px)';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * <EphemerisRail> — the page index as an instrument scale on the left edge
 * (≥ 1280px): eight ticks 01–08 that are real links, the current section's
 * label and an eclipse whose moon scrubs with the scroll.
 *
 * Mount it once, outside <LazyHydrate> (app/[locale]/page.tsx). It renders
 * nothing on the server and on smaller screens, and its code is only fetched
 * once the page is idle (EphemerisRailView).
 */
export function EphemerisRail() {
  const wide = useMediaQuery(RAIL_QUERY);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!wide || idle) return;
    const w = window as IdleWindow;
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setIdle(true), { timeout: 3000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(() => setIdle(true), 1500);
    return () => window.clearTimeout(timer);
  }, [wide, idle]);

  if (!wide || !idle) return null;
  return (
    <Suspense fallback={null}>
      <RailView />
    </Suspense>
  );
}
