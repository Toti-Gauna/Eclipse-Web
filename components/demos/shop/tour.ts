import type { DemoTourStep } from '../tourTypes';

/**
 * Bruma Tostadores' guide (copy: demoTours.shop.<id>). Targets (`data-tour`):
 * - sim: the SimBar in both views (AppShell `sim.tour`).
 * - store: the laptop dock's "Tienda online", the phone app's "Tienda" button and the store's cart
 *   button (customer phone, desktop store).
 * - bot: the "Chat del sitio" nav item (both) and the store's chat launcher.
 * - recovery: the "Carritos" nav item, the recovered-carts card on "Hoy" and the recovery switch.
 * - orders / club: their nav items (both).
 */
export const tour: DemoTourStep[] = [
  { id: 'sim', view: 'both' },
  { id: 'store', view: 'both' },
  { id: 'bot', view: 'both' },
  { id: 'recovery', view: 'both' },
  { id: 'orders', view: 'both' },
  { id: 'club', view: 'both' },
];
