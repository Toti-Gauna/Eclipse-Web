'use client';

import { useEffect, useState } from 'react';

/**
 * Elements that own the solid amber "Pedí tu demo" while they are on screen: the hero's
 * own CTA (`data-hero-cta`, set by the hero) and any page-level primary CTA marked
 * `data-page-cta` (the footer's). While one is visible the header's CTA turns quiet,
 * so a viewport never shows two solid amber buttons.
 */
export const PAGE_CTA_SELECTOR = '[data-hero-cta], [data-page-cta]';

/**
 * True while any PAGE_CTA_SELECTOR element is visible below the header; false when none
 * is (or the page has none: the header CTA is then the solid one). One
 * IntersectionObserver, no scroll listeners.
 *
 * The elements are queried again whenever `query` changes: build it from the pathname
 * (the layout's header survives client navigations) and a counter bumped on
 * HYDRATED_EVENT (LazyHydrate re-creates a section's DOM, e.g. the footer's). The
 * current answer is kept until the new observer reports (its first report comes on the
 * next frame), so a re-query never flashes the other tone.
 */
export function usePageCtaInView(query: string, enabled = true): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const targets = document.querySelectorAll(PAGE_CTA_SELECTOR);
    if (!targets.length) {
      // Syncing with the DOM of the page just rendered: nothing on it owns the amber.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external (DOM) state, no observer to report it
      setInView(false);
      return;
    }
    const header = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setInView(visible.size > 0);
      },
      // A CTA scrolled under the fixed header no longer counts as visible.
      { rootMargin: `-${Math.round(header)}px 0px 0px 0px` },
    );
    targets.forEach((target) => io.observe(target));
    return () => io.disconnect();
  }, [enabled, query]);

  return enabled && inView;
}
