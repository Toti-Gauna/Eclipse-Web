import type { DemoTourStep } from '../tourTypes';

/**
 * Órbita Fitness' guide (copy: demoTours.gym.<id>). Targets (`data-tour`):
 * - sim: the SimBar in both views (AppShell `sim.tour`).
 * - winback: Lucía's comeback card (owner "Hoy"), the automation card ("Retención"), the
 *   Retención dock/tab item, and the mission card on Lucía's phone.
 * - missions: the missions list on Lucía's phone (home).
 * - classes: the Clases item (owner dock / tabs) and the member app's Clases tab.
 * - league: the Ligas item (owner dock) and the member app's Liga tab.
 * - lead: the Sitio item (owner dock / tabs) and the site's "Clase gratis" button.
 */
export const tour: DemoTourStep[] = [
  { id: 'sim', view: 'both' },
  { id: 'winback', view: 'both' },
  { id: 'missions', view: 'phone' },
  { id: 'classes', view: 'both' },
  { id: 'league', view: 'both' },
  { id: 'lead', view: 'laptop' },
];
