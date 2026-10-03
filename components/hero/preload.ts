import type { DemoId } from '@/lib/content';
import { demoLoaders } from '@/components/demos/registry';

/**
 * Warms up the reveal before the click (hover/focus/touch of a chip): the
 * showcase chunk and the demo's own chunk. Both stay out of the initial bundle.
 */
export function preloadHeroDemo(id: DemoId) {
  void import('@/components/demos/DemoShowcase');
  void demoLoaders[id]();
}
