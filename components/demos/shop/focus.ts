import type { ShopSpot } from './data';

/** The element each beat target points at, in both screens (BEAT_FOCUS → `spot`). */
export const SPOTS: Record<ShopSpot, string> = {
  'ines-chat': '.shop-chatview-transcript, .shop-chatview-row',
  carts: '.shop-carts',
  thread: '.shop-msg',
  levelup: '.shop-levelup',
};
