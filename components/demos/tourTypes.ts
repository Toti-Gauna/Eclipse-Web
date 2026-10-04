/**
 * A step of a demo's guide ("Ver con guía"). Each demo lists its steps in `<demo>/tour.ts`.
 * - Targets: elements marked `data-tour="<id>"` inside the demo's views (desktop and/or mobile).
 *   Mark the SAME function in both views when it exists in both: the guide lights both at once.
 * - `view`: which view the step is about; in the tabs layout (phones) the host switches to it.
 * - Copy: messages namespace `demoTours`, keys `<demoId>.<stepId>.title` / `.body`
 *   (written for that demo's vertical — never a generic guide). Keep 4–6 steps.
 */
export interface DemoTourStep {
  id: string;
  view: 'laptop' | 'phone' | 'both';
}
