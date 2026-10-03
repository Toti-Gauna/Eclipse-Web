import { foundersState } from '@/lib/founders';

/** Section anchors shown in the header, mobile menu and footer. */
export const NAV_LINKS = [
  { id: 'services', hash: 'servicios' },
  { id: 'examples', hash: 'ejemplos' },
  { id: 'pricing', hash: 'precios' },
  { id: 'founders', hash: 'fundadores' },
] as const;

/** DOM ids of every landing section, in page order. */
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

/** Message key under `nav` for a link: the founders link reads "Clientes" once every spot is taken (as the section does). */
export const navLabelKey = (id: (typeof NAV_LINKS)[number]['id']) => (id === 'founders' && foundersState().allFilled ? 'clients' : id);
