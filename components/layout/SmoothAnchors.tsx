'use client';

import { useEffect } from 'react';
import { CV_OFF_CLASS } from '@/components/motion/ContentVisibilitySync';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * Smooth in-page anchor scrolling without `scroll-behavior: smooth` on <html>
 * (ScrollTrigger toggles that inline on every refresh, which invalidates the
 * style of the whole document — expensive on phones). Respects reduced motion,
 * the header offset (scroll-padding-top) and moves focus to the target.
 *
 * Listens in the capture phase: next/link (header, footer, menu links) calls
 * preventDefault in its own click handler and does a plain router navigation,
 * which scrolls but leaves keyboard focus behind in the header. Handling the
 * click first (and preventing it) makes next/link skip its navigation.
 * A link inside an open modal (mobile menu) focuses the target once the dialog
 * has closed: while it is open the page is inert, and closing it restores focus
 * to its opener.
 */
export function SmoothAnchors() {
  useEffect(() => {
    const focusTarget = (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank') return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
      const id = decodeURIComponent(url.hash.slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      // Sections below the fold use content-visibility: auto (estimated heights until they
      // render). Render them all before measuring so the jump lands exactly.
      document.documentElement.classList.add(CV_OFF_CLASS);
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      if (window.location.hash !== url.hash) window.history.pushState(window.history.state, '', url.hash);
      const dialog = link.closest('dialog');
      // Looked up again by id: a deferred section may have re-created its DOM by then.
      if (dialog?.open) dialog.addEventListener('close', () => focusTarget(id), { once: true });
      else focusTarget(id);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}
