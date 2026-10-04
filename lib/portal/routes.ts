/**
 * Portal mockup routes, locale-less (for the next-intl `Link`). Static export: every
 * locale × fixture id is generated at build time; unknown ids are a 404.
 * (Same paths as PORTAL_ROUTES in components/layout/navLinks.ts, used by the header.)
 */
export const portalPaths = {
  login: '/portal/',
  projects: '/portal/proyectos/',
  project: (id: string) => `/portal/proyectos/${id}/`,
} as const;
