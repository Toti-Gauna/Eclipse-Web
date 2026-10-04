'use client';

import { startTransition, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Fired on window after a deferred section hydrates (its DOM is re-created). */
export const HYDRATED_EVENT = 'eclipse:hydrated';

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

/**
 * Partial hydration for below-the-fold sections.
 *
 * The server HTML of `children` is kept as-is (fully visible, links work) and
 * React only hydrates it when the section gets close to the viewport, or the
 * visitor focuses / touches something inside it. On a phone you only pay for the
 * sections you actually reach, which keeps the main thread free during load.
 *
 * How: during hydration the wrapper renders an empty dangerouslySetInnerHTML,
 * which React leaves untouched (the server markup stays). Once triggered it
 * renders the real children. If focus was inside, it is restored on the same
 * focusable element (or the same script-focused target, by id) afterwards.
 *
 * Woken by the scroll (the section gets close), the render is a transition: React
 * works on it in short slices between frames instead of one long task, so a scroll
 * that is still moving (the hero's scrub, for instance) keeps its frames. Woken by
 * the visitor (focus, a tap, a #hash), it renders right away.
 */
export function LazyHydrate({
  children,
  rootMargin = '600px 0px',
  className,
}: {
  children: ReactNode;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Server: render the children into the HTML. Client: start dormant.
  const [hydrated, setHydrated] = useState(() => typeof window === 'undefined');
  // What had focus inside the dormant markup: its index among the focusables, or
  // the id of a script-focused target (an in-page anchor focuses its section).
  const pendingFocus = useRef<{ index: number } | { id: string } | null>(null);

  useEffect(() => {
    if (hydrated) return;
    const el = ref.current;
    if (!el) return;
    const wake = () => setHydrated(true);
    const wakeSoon = () => startTransition(() => setHydrated(true));
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && wakeSoon(), { rootMargin });
    io.observe(el);
    const onFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const index = [...el.querySelectorAll(FOCUSABLE)].indexOf(target);
        pendingFocus.current = index >= 0 ? { index } : target.id ? { id: target.id } : null;
      }
      wake();
    };
    el.addEventListener('focusin', onFocus);
    el.addEventListener('pointerdown', wake, { passive: true });
    // Hash navigation (#precios) straight into a dormant section.
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (id && el.querySelector(`[id="${CSS.escape(id)}"]`)) wake();
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => {
      io.disconnect();
      el.removeEventListener('focusin', onFocus);
      el.removeEventListener('pointerdown', wake);
      window.removeEventListener('hashchange', onHash);
    };
  }, [hydrated, rootMargin]);

  useLayoutEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const pending = pendingFocus.current;
    if (pending && 'index' in pending) {
      ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[pending.index]?.focus({ preventScroll: true });
    } else if (pending) {
      const target = ref.current?.querySelector<HTMLElement>(`[id="${CSS.escape(pending.id)}"]`);
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
    pendingFocus.current = null;
    window.dispatchEvent(new Event(HYDRATED_EVENT));
  }, [hydrated]);

  if (!hydrated) {
    return <div ref={ref} className={className} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: '' }} />;
  }
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
