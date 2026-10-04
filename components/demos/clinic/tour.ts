import type { DemoTourStep } from '../tourTypes';

/**
 * Clínica Aurora's guide (copy: demoTours.clinic.<id>). Targets (`data-tour`):
 * - sim: the SimBar in both views (AppShell `sim.tour`).
 * - booking: the site's booking widget (patient phone / site view), the phone app's "Sitio"
 *   button and site card, the laptop's "Sitio web" nav item.
 * - agenda: the agenda card (laptop "Hoy" and "Agenda", phone "Agenda") and the phone dock item.
 * - reception: the AI receptionist call card ("Hoy" in both views).
 * - reminders: the WhatsApp nav item (both views).
 * - recovered: the "recovered this week" card ("Hoy") and the no-shows hero ("Ausencias").
 */
export const tour: DemoTourStep[] = [
  { id: 'sim', view: 'both' },
  { id: 'booking', view: 'phone' },
  { id: 'agenda', view: 'both' },
  { id: 'reception', view: 'both' },
  { id: 'reminders', view: 'both' },
  { id: 'recovered', view: 'both' },
];
