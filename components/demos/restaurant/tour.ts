import type { DemoTourStep } from '../tourTypes';

/**
 * Bodegón Lucero's guide (copy: demoTours.restaurant.<id>). Targets (`data-tour`):
 * - sim: the SimBar in both views (AppShell `sim.tour`).
 * - order: the QR / web carta — the customer's phone carta (paired), the phone app's
 *   "Cliente" button and "Lo que ve el cliente" card, the laptop's "Carta QR" nav item and view.
 * - voice: the switchboard on "Servicio" (both views), the "Teléfono IA" nav item and its lines.
 * - kitchen: the ticket rail / kitchen counts on "Servicio" and the "Cocina" nav item.
 * - floor: the salón glance on "Servicio", the "Salón" nav item and the floor plan.
 */
export const tour: DemoTourStep[] = [
  { id: 'sim', view: 'both' },
  { id: 'order', view: 'both' },
  { id: 'voice', view: 'both' },
  { id: 'kitchen', view: 'both' },
  { id: 'floor', view: 'both' },
];
