/**
 * Section anchors shown in the header, the phone menu and the footer, in the order the
 * v3 header lists them (Servicios · Demos · Precios · Cómo trabajamos). Labels: `nav.<id>`.
 */
export const NAV_LINKS = [
  { id: 'services', hash: 'servicios' },
  { id: 'examples', hash: 'ejemplos' },
  { id: 'pricing', hash: 'precios' },
  { id: 'process', hash: 'proceso' },
] as const;

/** DOM ids of every landing section (unchanged since v2: anchors and shared links depend on them). */
export const SECTION_IDS = {
  hero: 'inicio',
  problem: 'problema',
  services: 'servicios',
  examples: 'ejemplos',
  process: 'proceso',
  pricing: 'precios',
  founders: 'fundadores',
  agent: 'contacto',
} as const;

/** Client portal mockup routes (locale-less paths for the next-intl Link). */
export const PORTAL_ROUTES = {
  login: '/portal/',
  projects: '/portal/proyectos/',
} as const;

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
    return { mode: 'portal', projects: path === '/portal/proyectos' || path.startsWith('/portal/proyectos/') };
  }
  return { mode: path === '/plan' ? 'plan' : 'landing', projects: false };
}
