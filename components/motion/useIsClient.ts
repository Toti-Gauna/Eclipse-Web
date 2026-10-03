'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** False during SSR and hydration, true afterwards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
