'use client';

import { useSyncExternalStore } from 'react';
import type { DemoId, VerticalId } from '@/lib/content';
import { demoLoaders } from '@/components/demos/registry';
import { track } from '@/lib/analytics';

/** Where a demo was opened from (analytics `origin`, builder source, focus return). */
export type DemoOrigin = 'hero' | 'examples';

export interface DemoRequest {
  vertical: VerticalId;
  demo: DemoId;
  origin: DemoOrigin;
  /** Viewport point the opening eclipse is born at (the click, or the control's center). */
  point: { x: number; y: number };
  /**
   * Stable selector value of the control that opened it (`data-demo-opener`), used to find it
   * again if its section re-created its DOM (LazyHydrate) while the layer was open.
   */
  openerKey: string;
  opener: HTMLElement | null;
  /** Changes on every open (the same demo can be reopened). */
  id: number;
}

/**
 * The one "Ver demo" layer of the page (components/demo-experience/DemoLayer.tsx, mounted
 * once by <DemoExperienceHost> in the hero). Any control opens it with `openDemoExperience`;
 * a tiny external store, so callers in other (lazily hydrated) sections need no provider.
 */
let current: DemoRequest | null = null;
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribeDemoExperience(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDemoRequest(): DemoRequest | null {
  return current;
}

/** The `data-demo-opener` value of a control that opens `demo` from `origin`. */
export const openerKey = (origin: DemoOrigin, demo: DemoId) => `${origin}:${demo}`;

/**
 * Opens the layer from a control. `event` (a click) places the eclipse at the pointer; a
 * keyboard activation (detail 0) uses the control's center.
 */
export function openDemoExperience(
  input: { vertical: VerticalId; demo: DemoId; origin: DemoOrigin },
  opener: HTMLElement | null,
  event?: { clientX: number; clientY: number; detail: number },
): void {
  if (current) return;
  let point = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  if (event && event.detail > 0 && (event.clientX || event.clientY)) point = { x: event.clientX, y: event.clientY };
  else if (opener) {
    const r = opener.getBoundingClientRect();
    point = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  current = { ...input, point, opener, openerKey: openerKey(input.origin, input.demo), id: ++seq };
  track('demo_opened', { demo: input.demo, origin: input.origin, vertical: input.vertical });
  emit();
}

/** Called by the layer once it has fully closed. */
export function clearDemoRequest(id: number): void {
  if (current?.id !== id) return;
  current = null;
  emit();
}

/** True while the layer is open (or opening/closing): e.g. the demos section pauses its live stage. */
export function useDemoExperienceOpen(): boolean {
  return useSyncExternalStore(subscribeDemoExperience, () => current !== null, () => false);
}

/** The current request (null when closed). */
export function useDemoRequest(): DemoRequest | null {
  return useSyncExternalStore(subscribeDemoExperience, getDemoRequest, () => null);
}

const loadLayer = () => import('./DemoLayerBody');

/** The layer's body chunk (header actions, views, guide, project block). */
export const layerBodyLoader = loadLayer;

/**
 * Warms the layer + showcase + one demo's code (and the demo copy for `locale`) on intent
 * (hover / focus / touch of an opener). Mounts nothing; each chunk is fetched once.
 */
export function preloadDemoExperience(demo: DemoId, locale?: string): void {
  void loadLayer();
  void import('@/components/demos/DemoShowcase');
  void demoLoaders[demo]();
  if (locale) void import('@/components/demos/DemoMessages').then((m) => m.preloadDemoMessages(locale));
}
