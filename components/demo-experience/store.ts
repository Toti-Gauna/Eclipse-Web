'use client';

import { useSyncExternalStore } from 'react';
import type { DemoId, VerticalId } from '@/lib/content';
import { demoLoaders } from '@/components/demos/registry';
import { track } from '@/lib/analytics';

/** Where a demo was opened from (analytics `origin`, builder source, focus return). */
export type DemoOrigin = 'hero' | 'examples' | 'offerings' | 'selector' | 'url' | 'product';

/**
 * How the layer relates to the history stack (lote 1.3, showroomHistory.ts):
 * - `push`: a fresh entry on open (the default).
 * - `handoff`: the selector's entry is reused (replaceState), so Back never lands on a closed selector.
 * - `restore`: the browser's Forward brought us to an entry we already own: nothing is pushed.
 * - `direct`: the page loaded with the contract's parameters; no opening film, no entry of ours
 *   behind it, and closing cleans the URL instead of stepping back.
 */
export type ShowroomEntry = 'push' | 'handoff' | 'restore' | 'direct';

export interface DemoRequest {
  vertical: VerticalId;
  demo: DemoId;
  origin: DemoOrigin;
  entry: ShowroomEntry;
  /** Whether an entry of ours lies behind this one (closing steps back) or not (closing cleans the URL). */
  ownsEntry: boolean;
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
 * Opens the layer from a control (its eclipse takes the center of the screen; from the hero
 * it's the hero's own that glides there, motion.ts). `opener` gets the focus back on close.
 */
export function openDemoExperience(
  input: {
    vertical: VerticalId;
    demo: DemoId;
    origin: DemoOrigin;
    entry?: ShowroomEntry;
    ownsEntry?: boolean;
    openerKey?: string;
  },
  opener: HTMLElement | null,
): void {
  if (current) return;
  current = {
    ...input,
    entry: input.entry ?? 'push',
    ownsEntry: input.ownsEntry ?? (input.entry ?? 'push') !== 'direct',
    opener,
    openerKey: input.openerKey ?? openerKey(input.origin, input.demo),
    id: ++seq,
  };
  track('demo_opened', {
    demo: input.demo,
    origin: input.origin,
    vertical: input.vertical,
  });
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
  return useSyncExternalStore(
    subscribeDemoExperience,
    () => current !== null,
    () => false,
  );
}

// ---- The rubro selector (lote 1.3) ------------------------------------------------------
// Same host, same store module: the selector is the first state of the showroom. It never
// runs at the same time as a demo layer, except for the instant of the hand-off (the demo's
// void covers it before it unmounts).

/** Which control opened the selector (focus return, analytics). */
export type SelectorOrigin = 'hero' | 'header' | 'menu' | 'plan_card' | 'pricing' | 'calculator' | 'final_cta' | 'url';

export interface SelectorRequest {
  origin: SelectorOrigin;
  /** `direct`: the page loaded asking for it (no entry of ours behind, no opening motion). */
  entry: Extract<ShowroomEntry, 'push' | 'restore' | 'direct'>;
  opener: HTMLElement | null;
  id: number;
}

let currentSelector: SelectorRequest | null = null;
let selectorSeq = 0;

const loadSelector = () => import('./SelectorLayer');

/** Warms the selector's chunk (hover / focus / press of a control that opens it). */
export const preloadSelector = loadSelector;

export function getSelectorRequest(): SelectorRequest | null {
  return currentSelector;
}

export function useSelectorRequest(): SelectorRequest | null {
  return useSyncExternalStore(subscribeDemoExperience, getSelectorRequest, () => null);
}

/**
 * Opens the selector. No-op while any showroom layer is up. The chunk is fetched first: if it
 * can't be, nothing opens and the caller keeps the real link's behavior (`onFail`).
 */
export function openSelector(
  input: { origin: SelectorOrigin; entry?: SelectorRequest['entry'] },
  opener: HTMLElement | null,
  onFail?: () => void,
): void {
  if (currentSelector || current) return;
  loadSelector().then(
    () => {
      if (currentSelector || current) return;
      currentSelector = {
        origin: input.origin,
        entry: input.entry ?? 'push',
        opener,
        id: ++selectorSeq,
      };
      track('selector_opened', { origin: input.origin });
      emit();
    },
    () => onFail?.(),
  );
}

/** Called by the selector once it has fully closed (or handed over to a demo). */
export function clearSelectorRequest(id: number): void {
  if (currentSelector?.id !== id) return;
  currentSelector = null;
  emit();
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
