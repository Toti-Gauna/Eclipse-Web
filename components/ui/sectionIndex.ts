import { SECTION_IDS } from '@/components/layout/navLinks';

/**
 * Each indexed page has its own index: every section gets a number and a phase of the
 * eclipse, from totality at the page's first section (1) to the full sun at its last (0).
 * Plain module: safe in server and client components.
 *
 *   home   (28/10/2026, decision of Ignacio): 01 hero · 02 productos · 03 Eclipse Media · 04 equipamiento
 *   agency (the v3 landing, moved whole):     01 Eclipse Agency · 02 qué ofrecemos · 03 para tu PyME ·
 *                                             04 demos · 05 precios · 06 calculadora · 07 cómo trabajamos ·
 *                                             08 preguntas y contacto
 *
 * The order here IS the page order (app/[locale]/page.tsx and app/[locale]/agency/page.tsx render them
 * the same way): <SectionMark> numbers and <EphemerisRail page> ticks are derived from it.
 * Labels live in messages under `sections.labels.<key>`.
 */
export const PAGE_SECTIONS = {
  home: ['hero', 'products', 'media', 'equipment'],
  agency: ['agency', 'services', 'pyme', 'examples', 'pricing', 'problem', 'process', 'agent'],
} as const;
export type IndexedPage = keyof typeof PAGE_SECTIONS;
export type SectionKey = (typeof PAGE_SECTIONS)[IndexedPage][number];

/** The index a section belongs to (every key lives in exactly one page). */
function indexOf(key: SectionKey): readonly SectionKey[] {
  return (Object.values(PAGE_SECTIONS) as readonly (readonly SectionKey[])[]).find((keys) => keys.includes(key)) ?? [key];
}

/** 1-based position on its page (hero = 1 … equipment = 4; agency = 1 … agent = 8). */
export function sectionNumber(key: SectionKey): number {
  return indexOf(key).indexOf(key) + 1;
}

/** "01" … "08". */
export function sectionIndexLabel(key: SectionKey): string {
  return String(sectionNumber(key)).padStart(2, '0');
}

/** Phase of the eclipse at a section: 1 (totality, first section) → 0 (full sun, last section). */
export function sectionPhase(key: SectionKey): number {
  const keys = indexOf(key);
  return phaseAt(keys.indexOf(key), keys.length);
}

/** Phase at a (fractional) 0-based position along an index of `count` sections: lets a rail scrub between them. */
export function phaseAt(position: number, count: number): number {
  const last = Math.max(1, count - 1);
  return 1 - Math.min(last, Math.max(0, position)) / last;
}

/** DOM id of a section (the anchor target). */
export function sectionDomId(key: SectionKey): string {
  return SECTION_IDS[key];
}
