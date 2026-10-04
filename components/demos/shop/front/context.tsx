'use client';

import { createContext, useContext } from 'react';
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
  /** The phone shows Inés's evening (beats) — false once the visitor takes over (until the next beat). */
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
