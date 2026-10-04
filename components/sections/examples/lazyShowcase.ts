import { lazy } from 'react';
import type { DemoId } from '@/lib/content';

const load = () => import('@/components/demos/DemoShowcase');

/** <DemoShowcase>, downloaded only when the stage's live demo is about to show. */
export const LazyShowcase = lazy(() => load().then((m) => ({ default: m.DemoShowcase })));

/** Warms the showcase + one demo's code (hover / focus with intent). Mounts nothing. */
export function preloadShowcase(demo: DemoId) {
  void load().then((m) => m.preloadDemo(demo));
}
