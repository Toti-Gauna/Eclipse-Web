'use client';

import { useCallback, useSyncExternalStore } from 'react';

const PREFIX = 'eclipse:tour:';
const EVENT = 'eclipse:tour-seen';

/** Fallback when storage throws (private mode, blocked site data): remembered for this page only. */
const memory = new Set<string>();

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(PREFIX + key) === '1';
  } catch {
    return memory.has(key);
  }
}

function write(key: string, seen: boolean) {
  if (seen) memory.add(key);
  else memory.delete(key);
  try {
    if (seen) window.localStorage.setItem(PREFIX + key, '1');
    else window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Storage unavailable: the in-memory flag above still answers for this page.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/**
 * "Don't show the guide again" flag in localStorage (`eclipse:tour:<key>`).
 * `seen` is null on the server and during hydration, then true/false; it stays in sync
 * across components and tabs. Works when storage throws (falls back to memory).
 */
export function useTourSeen(key: string): { seen: boolean | null; markSeen: () => void; reset: () => void } {
  const seen = useSyncExternalStore<boolean | null>(
    subscribe,
    () => read(key),
    () => null,
  );
  const markSeen = useCallback(() => write(key, true), [key]);
  const reset = useCallback(() => write(key, false), [key]);
  return { seen, markSeen, reset };
}
