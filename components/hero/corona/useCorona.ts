'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import { loaderRemainingMs } from '@/components/loader/loaderState';
import type { HeroMotionBus } from '../HeroState';
import type { CoronaHandle } from './coronaGL';

/** Extra canvas size on each side of the eclipse square (matches .eclipse-gl-host in hero.css). */
export const CORONA_BLEED = 0.15;

type NavigatorWithHints = Navigator & { connection?: { saveData?: boolean } };

/**
 * The WebGL corona only runs where it's cheap and wanted: WebGL available,
 * more than 4 cores, no reduced motion, no data saver. Everything else keeps
 * the CSS corona (which is also the first paint everywhere).
 */
export function canUseCorona(): boolean {
  if (typeof window === 'undefined' || prefersReducedMotion()) return false;
  const nav = navigator as NavigatorWithHints;
  // Dev-only QA switch (stripped from production builds): ?corona=gl skips the
  // device heuristics so the shader can be checked on low-core machines.
  const forced = process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).get('corona') === 'gl';
  if (!forced && nav.connection?.saveData) return false;
  if (!forced && !((nav.hardwareConcurrency ?? 0) > 4)) return false;
  try {
    const probe = document.createElement('canvas');
    const gl = (probe.getContext('webgl2') ?? probe.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Lazily mounts the WebGL corona inside `host` once the page is idle (after the
 * loader's iris opened). Returns `sync(active)` to run/pause the render loop.
 * The CSS corona crossfades out when the first GL frame is drawn
 * (`data-corona="gl"` on the .eclipse element).
 */
export function useCorona(host: RefObject<HTMLDivElement | null>, bus: RefObject<HeroMotionBus>) {
  const handle = useRef<CoronaHandle | null>(null);
  const active = useRef(true);

  useEffect(() => {
    const el = host.current;
    const eclipse = el?.closest<HTMLElement>('[data-eclipse]');
    if (!el || !eclipse || !canUseCorona()) return;
    const w = window as IdleWindow;
    let cancelled = false;
    let idleId = 0;

    const load = async () => {
      try {
        const { mountCorona } = await import('./coronaGL');
        if (cancelled) return;
        const h = mountCorona(el, {
          bleed: CORONA_BLEED,
          read: () => {
            const b = bus.current;
            return { intensity: b.scroll, moonX: b.scrollMoon.x + b.revealMoon.x, moonY: b.scrollMoon.y + b.revealMoon.y };
          },
          onFirstFrame: () => eclipse.setAttribute('data-corona', 'gl'),
          onLost: () => eclipse.removeAttribute('data-corona'),
        });
        if (!h || cancelled) {
          h?.dispose();
          return;
        }
        handle.current = h;
        h.setActive(active.current);
      } catch {
        // Chunk failed to load (offline, blocked): the CSS corona stays.
      }
    };

    const timer = window.setTimeout(
      () => {
        if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => void load(), { timeout: 2500 });
        else void load();
      },
      loaderRemainingMs() + 900,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId) w.cancelIdleCallback?.(idleId);
      handle.current?.dispose();
      handle.current = null;
      eclipse.removeAttribute('data-corona');
    };
  }, [host, bus]);

  return useCallback((next: boolean) => {
    active.current = next;
    handle.current?.setActive(next);
  }, []);
}
