import { SECTION_IDS } from '@/components/layout/navLinks';

/**
 * The page's index (v2 "Efemérides"): every section has a number 01–08 and a
 * phase of the eclipse, from totality in the hero (1) to the full sun at the
 * final CTA (0). Plain module: safe in server and client components.
 *
 * Labels live in messages under `sections.labels.<key>`.
 */
export const SECTION_KEYS = ['hero', 'problem', 'services', 'examples', 'process', 'pricing', 'founders', 'agent'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/** 1-based position on the page (hero = 1 … agent = 8). */
export function sectionNumber(key: SectionKey): number {
  return SECTION_KEYS.indexOf(key) + 1;
}

/** "01" … "08". */
export function sectionIndexLabel(key: SectionKey): string {
  return String(sectionNumber(key)).padStart(2, '0');
}

/** Phase of the eclipse at a section: 1 (totality, hero) → 0 (full sun, final CTA). */
export function sectionPhase(key: SectionKey): number {
  return phaseAt(SECTION_KEYS.indexOf(key));
}

/** Phase at a (fractional) 0-based position along the index: lets a rail scrub between sections. */
export function phaseAt(position: number): number {
  const last = SECTION_KEYS.length - 1;
  return 1 - Math.min(last, Math.max(0, position)) / last;
}

/** DOM id of a section (the anchor target). */
export function sectionDomId(key: SectionKey): string {
  return SECTION_IDS[key];
}
