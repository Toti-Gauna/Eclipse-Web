/**
 * Link contract between Eclipse (this site) and EstateOS (its own repo `roofy`, subdomain
 * roofy.eclipse-business.com, D11), lote 1.6. Spec: docs/v3/lote-1.6-repo-subdominio-estateos.md
 * and `docs/contrato-enlace.md` in the `roofy` repo. The fixture tests/fixtures/handoff-cases.json
 * is the same file, byte for byte, in both repos: both test it, so a change on one side that is
 * not copied to the other fails a test.
 *
 * Language travels in the PATH (`/es/`, `/en/`, `/pt/`) and currency in the QUERY (`moneda`),
 * because the two sites are different origins and share no storage (the visitor's choice lives
 * in this site's localStorage). Pure functions, no DOM.
 *
 * DORMANT: nothing calls it yet. The selector's «Inmobiliarias» row keeps opening the Lumen demo
 * until EstateOS is published (D11); lote 3.5/3.9 wires it. Allow-lists are reused from the
 * showroom and currency modules so they cannot drift here; `roofy` keeps its own copy and the
 * shared fixture guards that copy.
 */
import type { Locale } from '@/i18n/routing';
import { CURRENCIES, isCurrency, type Currency } from '@/lib/currency';
import { SHOWROOM_AREAS, SHOWROOM_VISTAS, type ShowroomArea, type ShowroomVista } from '@/lib/showroom';

export const ESTATEOS_ORIGIN = 'https://roofy.eclipse-business.com';

export const ESTATEOS_UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export type EstateosUtmKey = (typeof ESTATEOS_UTM_KEYS)[number];

const UTM_VALUE = /^[A-Za-z0-9_.-]{1,100}$/;

const pick = <T extends string>(list: readonly T[], value: string | null | undefined): T | null => list.find((item) => item === value) ?? null;

export interface EstateosLinkInput {
  locale: Locale;
  currency?: Currency;
  vista?: ShowroomVista;
  /** Only valid inside the guide (`vista: 'guia'`); anywhere else it is left out. */
  area?: ShowroomArea;
  utm?: Partial<Record<EstateosUtmKey, string>>;
}

/**
 * URL of EstateOS for a visitor of this site. Parameters, in this order: `moneda`, `vista`,
 * `area`, `utm_*`. A value outside its allow-list is left out instead of failing: the link
 * still works, only without that detail.
 */
export function estateosUrl(input: EstateosLinkInput, origin: string = ESTATEOS_ORIGIN): string {
  const p = new URLSearchParams();
  const currency = pick(CURRENCIES, input.currency ?? null);
  if (currency) p.set('moneda', currency);
  const vista = pick(SHOWROOM_VISTAS, input.vista ?? null);
  if (vista) p.set('vista', vista);
  const area = vista === 'guia' ? pick(SHOWROOM_AREAS, input.area ?? null) : null;
  if (area) p.set('area', area);
  for (const key of ESTATEOS_UTM_KEYS) {
    const value = input.utm?.[key];
    if (value !== undefined && UTM_VALUE.test(value)) p.set(key, value);
  }
  const query = p.toString();
  return `${origin}/${input.locale}/${query ? `?${query}` : ''}`;
}

/**
 * The currency EstateOS sent back (`?moneda=` on the return link), or `null`. When a parameter
 * repeats the first value wins; anything outside `ARS | BRL | USD` is ignored.
 */
export function currencyFromEstateos(search: string): Currency | null {
  const value = new URLSearchParams(search).get('moneda');
  return isCurrency(value) ? value : null;
}
