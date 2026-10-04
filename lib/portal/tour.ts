/**
 * First-visit onboarding of the portal mockup: one short guide on "Mis proyectos" and one on
 * a project's detail, each remembered separately. Words live in `portal.guide.<tour>.<step>`;
 * targets are `data-tour="…"` hooks inside the portal's <main data-portal> (on the list, only
 * the rows/cards picked by `tourHooks()` in ./project carry them). No fixtures here: this file
 * is imported by client components.
 *
 * In this mockup "already seen" is kept only in this browser (localStorage). With a real
 * backend it would be stored per account, so the guide doesn't come back on another device.
 */

/**
 * Keys for the engine's `useTourSeen` (components/ui/tour), stored as `eclipse:tour:<key>` = "1".
 * Bump the version to show a changed guide again.
 */
export const PORTAL_TOUR_KEYS = {
  projects: 'portal-projects-v1',
  project: 'portal-project-v1',
} as const;

export type PortalTourId = keyof typeof PORTAL_TOUR_KEYS;

/** Fired on window right before a guide starts (e.g. the dashboard shows its "with projects" view). */
export const PORTAL_TOUR_EVENT = 'eclipse:portal-tour';

const hook = (id: string) => `[data-tour="${id}"]`;

export interface PortalTourStepDef {
  id: string;
  targets: string[];
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
}

export const PORTAL_TOURS: Record<PortalTourId, PortalTourStepDef[]> = {
  projects: [
    // The table on desktop; on phones (four cards don't fit on screen) the list's heading.
    { id: 'list', targets: [hook('pt-list'), hook('pt-list-head')] },
    { id: 'stage', targets: [hook('pt-stage')] },
    { id: 'next', targets: [hook('pt-next'), hook('pt-turn')] },
    { id: 'open', targets: [hook('pt-open')] },
    { id: 'help', targets: [hook('pt-help')] },
  ],
  project: [
    { id: 'current', targets: [hook('pt-current')] },
    { id: 'next', targets: [hook('pt-next')] },
    { id: 'timeline', targets: [hook('pt-timeline')] },
    // The heading and the tabs, not the whole (long) panel.
    { id: 'follow', targets: [hook('pt-follow'), hook('pt-follow-tabs')] },
    { id: 'help', targets: [hook('pt-help')] },
  ],
};
