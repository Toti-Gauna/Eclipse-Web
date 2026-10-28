import { IS_LIVE } from '@/lib/env';

/**
 * The header, the phone menu and the footer lead to the units, each its own page (decision of
 * Ignacio, 28/10/2026): Media · Academy · Intelligence · Agency. Locale-less paths for the
 * next-intl Link; labels: `nav.<id>`. The v3 sections (qué ofrecemos, demos, precios, cómo
 * trabajamos, contacto) live on /agency/ now, under their old ids.
 */
export const NAV_LINKS = [
  { id: 'media', href: '/media/' },
  { id: 'academy', href: '/academy/' },
  { id: 'intelligence', href: '/intelligence/' },
  { id: 'agency', href: '/agency/' },
] as const;
export type UnitId = (typeof NAV_LINKS)[number]['id'];

/** «Potenciar mi negocio» everywhere outside the Agency page: the products banner of the home. */
export const PRODUCTS_HREF = '/#productos';

/** A product's page inside Eclipse (until its own site is published). */
export const productPath = (id: string) => `/productos/${id}/`;

/**
 * The Agency page's own short index, under its intro (the header no longer lists these sections).
 * Keys of the page index (sectionIndex.ts); labels: `sections.labels.<key>`, targets: SECTION_IDS.
 */
export const AGENCY_TOC = ['services', 'examples', 'pricing', 'process', 'agent'] as const;

/** DOM ids of every indexed section (home and Agency). */
export const SECTION_IDS = {
  // Home
  hero: 'inicio',
  products: 'productos',
  media: 'media',
  equipment: 'equipamiento',
  // Agency (the v3 landing, moved on 28/10/2026)
  agency: 'agency',
  problem: 'problema',
  services: 'servicios',
  pyme: 'pyme',
  examples: 'ejemplos',
  process: 'proceso',
  pricing: 'precios',
  founders: 'fundadores',
  agent: 'contacto',
} as const;

/** Old home anchors that now live on /agency/ (a shared `/#precios` is sent there, LegacyAnchors). */
export const AGENCY_HASHES: readonly string[] = [
  SECTION_IDS.services,
  SECTION_IDS.pyme,
  SECTION_IDS.examples,
  SECTION_IDS.pricing,
  SECTION_IDS.problem,
  SECTION_IDS.process,
  SECTION_IDS.agent,
  SECTION_IDS.founders,
  'paquetes',
  'ofertas',
  'mantenimiento',
];

/** Client portal mockup routes (locale-less paths for the next-intl Link); defined in lib/portal/routes. */
export { portalPaths as PORTAL_ROUTES } from '@/lib/portal/routes';

export type ChromeMode = 'landing' | 'plan' | 'portal';

/**
 * Which chrome a route gets, from the locale-less pathname (next-intl usePathname):
 * - portal: /portal and below — logo, "Volver al sitio" (+ "Mis proyectos" / "Salir de la
 *   demo" inside /portal/proyectos), preferences; no landing nav or sales CTAs.
 * - plan: /plan — the builder is the page, so no plan CTA and the demo CTA stays quiet.
 * - landing: everything else.
 */
export function chromeRoute(pathname: string | null): { mode: ChromeMode; projects: boolean } {
  const path = (pathname ?? '/').replace(/\/+$/, '') || '/';
  if (path === '/portal' || path.startsWith('/portal/')) {
    const demoArea = path === '/portal/proyectos' || path.startsWith('/portal/proyectos/');
    // Live portal: the private areas (projects, one project, requests) show the account links.
    const liveArea = IS_LIVE && (demoArea || /^\/portal\/(proyecto|solicitudes|solicitud)$/.test(path));
    return { mode: 'portal', projects: IS_LIVE ? liveArea : demoArea };
  }
  return { mode: path === '/plan' ? 'plan' : 'landing', projects: false };
}

/** The unit whose page this is (aria-current in the header), from the locale-less pathname. */
export function currentUnit(pathname: string | null): UnitId | null {
  const path = (pathname ?? '/').replace(/\/+$/, '') + '/';
  return NAV_LINKS.find((link) => path === link.href)?.id ?? null;
}
