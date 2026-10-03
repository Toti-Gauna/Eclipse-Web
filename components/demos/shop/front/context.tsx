'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ChatRun } from '../../kit';
import type { GrindId, Line, PayId, ProductId, SizeId } from '../data';

export type FrontScreen = 'catalog' | 'product' | 'checkout' | 'order' | 'club' | 'lock' | 'whatsapp';
export type FrontSheet = 'cart' | 'chat' | null;

/** The storefront's own navigation state (the visitor's session; the story derives its own). */
export interface FrontUi {
  screen: FrontScreen;
  product: ProductId;
  size: SizeId;
  grind: GrindId;
  sheet: FrontSheet;
  cat: 'all' | 'coffee' | 'gear';
  pay: PayId;
  delivery: 'home' | 'pickup';
}

export interface FrontApi {
  variant: 'phone' | 'desktop';
  /** Inés's journey is playing (autoplay) — false once the visitor takes over. */
  story: boolean;
  ui: FrontUi;
  lines: Line[];
  coupon: boolean;
  /** The order shown on the "order" screen. */
  orderKey: string | null;
  /** Story mode: which control Inés is "tapping" right now. */
  tap: string | null;
  /** Story mode: the pay button is being pressed. */
  pressing: boolean;
  chat: ChatRun | null;
  /** Something changes the store: in story mode the visitor takes over first. */
  act: (fn: (ui: FrontUi) => Partial<FrontUi>, sound?: 'select' | 'open' | 'close' | null) => void;
  /** Adds to the visitor's cart (and opens it). */
  add: (line: Line, openCart?: boolean) => void;
  setQty: (index: number, qty: number) => void;
  pay: () => void;
  pickChat: (step: string, reply: string) => void;
  openChat: () => void;
  /** Phone alone: back to the owner's panel. */
  onPanel?: () => void;
}

const Ctx = createContext<FrontApi | null>(null);
export const FrontProvider = Ctx.Provider;
export function useFront(): FrontApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFront outside <FrontProvider>');
  return ctx;
}

/**
 * Milliseconds since `since` (a Date.now() stamp), ticking while `active` until `cap`.
 * The visitor's own chats run on real time: the story clock holds still while they play.
 */
export function useWallElapsed(since: number | null, active: boolean, cap = 16_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (since === null || !active) return;
    const id = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n - since > cap) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [since, active, cap]);
  return since === null ? -1 : Math.max(0, now - since);
}
