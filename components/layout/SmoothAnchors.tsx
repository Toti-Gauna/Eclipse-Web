'use client';

import { useEffect } from 'react';
import { CV_OFF_CLASS } from '@/components/motion/ContentVisibilitySync';
import { HYDRATED_EVENT } from '@/components/motion/LazyHydrate';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';

/** Any of these from the visitor ends an in-progress re-aim: we never fight their own scrolling. */
const USER_INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
/** Re-aims at most this many times, within this window after the click. */
const MAX_CORRECTIONS = 4;
const WINDOW_MS = 4000;

let cancelAlign: (() => void) | null = null;

/**
 * Keeps an anchor jump on target. Deferred sections (LazyHydrate) hydrate while the page
 * scrolls past them and can grow above the target (their real content, pin spacers), so
 * a smooth scroll aimed at the click-time position stops short. Once the scroll has
 * settled (same position on two checks 160 ms apart) it compares the target with
 * scroll-padding-top and aims again; a section hydrating later re-arms the check.
 * Cheap: one debounced timer, removed after the window; any user input stops it.
 */
function keepAligned(id: string, behavior: ScrollBehavior) {
  cancelAlign?.();
  let timer = 0;
  let corrections = 0;
  let lastY = Number.NaN;
  const started = performance.now();
  const check = () => {
    const target = document.getElementById(id);
    if (!target || performance.now() - started > WINDOW_MS) return stop();
    // Still moving (or a long task delayed the scroll events): look again shortly.
    if (window.scrollY !== lastY) {
      lastY = window.scrollY;
      return arm();
    }
    const pad = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (Math.abs(target.getBoundingClientRect().top - pad) <= 4) return; // on target; late hydration re-arms
    if (corrections++ >= MAX_CORRECTIONS) return stop();
    lastY = Number.NaN;
    target.scrollIntoView({ behavior, block: 'start' });
  };
  function arm() {
    window.clearTimeout(timer);
    timer = window.setTimeout(check, 160);
  }
  const hardStop = window.setTimeout(() => stop(), WINDOW_MS);
  function stop() {
    window.clearTimeout(timer);
    window.clearTimeout(hardStop);
    window.removeEventListener('scroll', arm);
    window.removeEventListener(HYDRATED_EVENT, arm);
    USER_INPUT.forEach((type) => window.removeEventListener(type, stop, true));
    if (cancelAlign === stop) cancelAlign = null;
  }
  window.addEventListener('scroll', arm, { passive: true });
  window.addEventListener(HYDRATED_EVENT, arm);
  USER_INPUT.forEach((type) => window.addEventListener(type, stop, { capture: true, passive: true }));
  cancelAlign = stop;
  arm();
}

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
      const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
      target.scrollIntoView({ behavior, block: 'start' });
      keepAligned(id, behavior);
      if (window.location.hash !== url.hash) window.history.pushState(window.history.state, '', url.hash);
      const dialog = link.closest('dialog');
      // Looked up again by id: a deferred section may have re-created its DOM by then.
      if (dialog?.open) dialog.addEventListener('close', () => focusTarget(id), { once: true });
      else focusTarget(id);
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      cancelAlign?.();
    };
  }, []);
  return null;
}
