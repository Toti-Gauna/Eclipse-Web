'use client';

import { useSyncExternalStore } from 'react';
import { isOfferActive } from '@/lib/pricing';
import type { Offer } from '@/lib/content';

/**
 * A shared minute clock (one interval for the whole page, only while subscribed).
 * Returns null during SSR / hydration so time-dependent UI never mismatches.
 */
let current = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(callback);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  if (!current) current = Date.now();
  return current;
}

export function useNow(): number | null {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => 0);
  return value || null;
}

/**
 * Whether an offer is live. Offers without `endsAt` are decided at render time
 * (identical on server and client); offers with a deadline are only shown once
 * the client clock is known, and disappear by themselves when they expire.
 */
export function offerLive(offer: Offer | undefined, now: number | null): boolean {
  if (!offer) return false;
  if (!offer.endsAt) return isOfferActive(offer);
  return now !== null && isOfferActive(offer, new Date(now));
}
