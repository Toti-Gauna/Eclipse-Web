'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/motion/gsap';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { Eclipse } from '@/components/hero/Eclipse';
import { BASE_PATH } from '@/lib/env';
import './page-transition.css';

type Tone = 'night' | 'light';

/** If a navigation hangs, the page is loaded the plain way after this long. */
const FALLBACK_MS = 8000;
/** The loading screen stays at least this long once the new page is there (it must read as a moment, not a flicker). */
const MIN_HOLD = 0.25;

/**
 * Covers the page (night, or night then light) from the click point and calls `navigate` under the cover.
 * Resolves `covered` once the screen is fully covered (the reveal waits for it).
 */
function playCover(el: HTMLElement, tone: Tone, x: number, y: number, navigate: () => void) {
  const q = gsap.utils.selector(el);
  const [dark] = q('[data-pt-dark]');
  const [light] = q('[data-pt-light]');
  const [stage] = q('[data-pt-stage]');
  const [moon] = q('[data-eclipse-moon]');
  const [glint] = q('[data-pt-glint]');
  const [copy] = q('[data-pt-copy]');
  const at = `${x}px ${y}px`;
  el.dataset.state = 'on';
  gsap.killTweensOf([dark, light, stage, moon, glint, copy]);
  const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
  tl.set(light, { autoAlpha: 0 })
    .fromTo(dark, { autoAlpha: 1, clipPath: `circle(0% at ${at})` }, { clipPath: `circle(150% at ${at})`, duration: 0.6 }, 0)
    .fromTo(stage, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'expo.out' }, 0.3)
    .fromTo(copy, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, 0.42);
  let navAt = 0.55;
  if (tone === 'light') {
    // The demo's opening, short: the moon slides off, the diamond ring, the light floods from the sun.
    tl.fromTo(moon, { xPercent: 0, opacity: 1 }, { xPercent: 120, opacity: 0, duration: 0.9 }, 0.5)
      .fromTo(glint, { scale: 0, opacity: 0, rotation: -20 }, { scale: 1.4, opacity: 1, rotation: 20, duration: 0.25, ease: 'power3.out' }, 0.95)
      .to(glint, { scale: 0, opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.2)
      .fromTo(light, { autoAlpha: 1, clipPath: 'circle(0% at 50% 46%)' }, { clipPath: 'circle(150% at 50% 46%)', duration: 0.8, ease: 'expo.in' }, 1.05);
    navAt = 1.1;
  } else {
    tl.fromTo(moon, { xPercent: -30, opacity: 1 }, { xPercent: 0, duration: 0.8, ease: 'expo.out' }, 0.3);
  }
  let done: () => void = () => {};
  const covered = new Promise<void>((resolve) => (done = resolve));
  tl.call(navigate, [], navAt).call(() => done(), [], tl.duration());
  return { tl, covered };
}

/**
 * The loading screen between pages (decision of Ignacio, 28/10/2026: «pantallas de carga de transición entre cada
 * página»). A click on a link to another page of the site:
 * - night (every page): the dark of the eclipse closes over the page from where the visitor clicked, the eclipse and
 *   the destination's name hold the screen while the page loads, then the night opens onto the new page.
 * - light (`data-transition="light"`, «Conocer <producto>»): like opening the Lumen demo — the page goes dark, the
 *   eclipse takes the centre, the moon slides, the diamond ring fires and the light floods the screen from it; the
 *   product's page (all dawn) comes up out of that light.
 * The click is taken in the capture phase (next/link would navigate first) and the route is pushed under the cover.
 * Links with a modifier, `target`, a download, the same page (SmoothAnchors scrolls those) or the selector
 * (`data-opens-selector`) are left alone. Reduced motion: no screen, the navigation is immediate.
 * transform / opacity / clip-path only.
 */
export function PageTransition() {
  const t = useTranslations('transition');
  const router = useRouter();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [tone, setTone] = useState<Tone>('night');
  const pending = useRef<{ tl: gsap.core.Timeline; covered: Promise<void>; fallback: number } | null>(null);

  // Take internal navigations.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download') || link.hasAttribute('data-opens-selector')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (BASE_PATH && !url.pathname.startsWith(`${BASE_PATH}/`)) return;
      if (pending.current || prefersReducedMotion() || !root.current) return;
      e.preventDefault();
      const href = url.pathname.slice(BASE_PATH.length) + url.search + url.hash;
      const nextTone: Tone = link.dataset.transition === 'light' ? 'light' : 'night';
      const name = (link.dataset.transitionLabel ?? link.getAttribute('aria-label') ?? link.textContent ?? '').trim().slice(0, 48);
      setLabel(name);
      setTone(nextTone);
      const x = e.clientX || window.innerWidth / 2;
      const y = e.clientY || window.innerHeight / 2;
      const { tl, covered } = playCover(root.current, nextTone, x, y, () => router.push(href));
      const fallback = window.setTimeout(() => window.location.assign(BASE_PATH + href), FALLBACK_MS);
      pending.current = { tl, covered, fallback };
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  // The new page is there: hold a moment, then open onto it.
  useEffect(() => {
    const p = pending.current;
    const el = root.current;
    if (!p || !el) return;
    let cancelled = false;
    void p.covered.then(() => {
      if (cancelled) return;
      window.clearTimeout(p.fallback);
      const q = gsap.utils.selector(el);
      const [dark] = q('[data-pt-dark]');
      const [light] = q('[data-pt-light]');
      const [stage] = q('[data-pt-stage]');
      const [copy] = q('[data-pt-copy]');
      const lit = Number(gsap.getProperty(light, 'autoAlpha')) > 0;
      const tl = gsap.timeline({
        delay: MIN_HOLD,
        defaults: { ease: 'expo.inOut' },
        onComplete: () => {
          el.dataset.state = 'off';
          pending.current = null;
        },
      });
      tl.to([stage, copy], { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0);
      if (lit) tl.set(dark, { autoAlpha: 0 }, 0).to(light, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, 0.15);
      else tl.to(dark, { clipPath: 'circle(0% at 50% 50%)', duration: 0.75 }, 0.1);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div ref={root} className="pt" data-state="off" data-tone={tone} aria-hidden>
      <div className="pt-dark" data-pt-dark />
      <div className="pt-stage" data-pt-stage>
        <Eclipse size="var(--pt-eclipse)" />
        <span className="pt-glint" data-pt-glint />
      </div>
      <div className="pt-copy" data-pt-copy>
        <p className="pt-name display">{label}</p>
        <p className="pt-state label">{tone === 'light' ? t('light') : t('loading')}</p>
      </div>
      <div className="pt-light" data-pt-light />
    </div>
  );
}
