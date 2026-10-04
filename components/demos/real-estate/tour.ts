import type { DemoTourStep } from '../tourTypes';

/**
 * Lumen Propiedades' guide (copy: demoTours.realEstate.<id>). Targets (`data-tour`):
 * - sim: the SimBar in both views (AppShell `sim.tour`).
 * - chat: the "Ahora" card on the laptop's "Hoy", the phone's conversation (Consultas) and the
 *   chat launcher / sheet on the buyer's phone.
 * - site: the laptop's "Sitio web" nav item, the phone app's "Comprador" button and the site's
 *   "Agendar visita" button.
 * - pipeline: the pipeline panel on "Hoy" and the nav item (both).
 * - visits: the nav item (both) and the calendar panel.
 * - followups: the nav item (both).
 */
export const tour: DemoTourStep[] = [
  { id: 'sim', view: 'both' },
  { id: 'chat', view: 'both' },
  { id: 'site', view: 'both' },
  { id: 'pipeline', view: 'both' },
  { id: 'visits', view: 'both' },
  { id: 'followups', view: 'both' },
];
