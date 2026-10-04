import type { DemoTourStep } from '../tourTypes';

/**
 * Atrio Idiomas' guide (copy: demoTours.academy.<id>). Targets (`data-tour`):
 * - sim: the SimBar in both views (AppShell `sim.tour`).
 * - speaking: the student app's Speaking tab and its "Empezar la práctica" button.
 * - tutor: the Tutora IA item (school sidebar / tabs), the student app's Tutora tab and the
 *   quick questions under the tutor chat.
 * - ranking: the student app's Clase tab (streak, level, class ranking).
 * - followup: the Alumnos item (school), the follow-up board and the nudge automation card.
 * - enroll: the Sitio item (school) and the site's "Hacé el test vos" button.
 */
export const tour: DemoTourStep[] = [
  { id: 'sim', view: 'both' },
  { id: 'speaking', view: 'phone' },
  { id: 'tutor', view: 'both' },
  { id: 'ranking', view: 'phone' },
  { id: 'followup', view: 'laptop' },
  { id: 'enroll', view: 'laptop' },
];
