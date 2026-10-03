'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * FLIP for lists whose items move (Kanban cards changing column, leaderboard rows
 * re-ranking). Mark items with `data-flip="<stable id>"`; when `signature` changes,
 * each item that moved slides from its old place with a transform (WAAPI).
 * Positions are measured relative to the container and corrected for any ancestor
 * scale, so page scroll or a scaling showcase doesn't fake a move.
 */
export function useFlip(container: RefObject<HTMLElement | null>, signature: string, duration = 700) {
  const last = useRef<Map<string, { x: number; y: number }> | null>(null);
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const scale = root.offsetWidth ? box.width / root.offsetWidth : 1;
    const items = [...root.querySelectorAll<HTMLElement>('[data-flip]')];
    const now = new Map<string, { x: number; y: number }>();
    for (const el of items) {
      const r = el.getBoundingClientRect();
      now.set(el.dataset.flip!, { x: (r.left - box.left) / (scale || 1), y: (r.top - box.top) / (scale || 1) });
    }
    const before = last.current;
    last.current = now;
    if (!before || prefersReducedMotion()) return;
    for (const el of items) {
      const a = before.get(el.dataset.flip!);
      const b = now.get(el.dataset.flip!);
      if (!a || !b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      // A moved item may be a fresh node (new parent): skip its CSS entrance, just slide it.
      for (const a of el.getAnimations()) if (a instanceof CSSAnimation) a.finish();
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      });
    }
  }, [container, signature, duration]);
}
