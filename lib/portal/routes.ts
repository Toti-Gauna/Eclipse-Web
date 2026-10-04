/**
 * Portal mockup routes, locale-less (for the next-intl `Link`). Static export: every
 * locale × fixture id is generated at build time; unknown ids are a 404.
 * The header re-exports them as PORTAL_ROUTES (components/layout/navLinks.ts).
 */
export const portalPaths = {
  login: '/portal/',
  projects: '/portal/proyectos/',
  project: (id: string) => `/portal/proyectos/${id}/`,
} as const;
