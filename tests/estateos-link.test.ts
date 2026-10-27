import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SECTION_IDS } from '@/components/layout/navLinks';
import { CURRENCIES, defaultCurrencyFor } from '@/lib/currency';
import { ESTATEOS_PLANS, ESTATEOS_UTM_KEYS, currencyFromEstateos, estateosUrl, type EstateosLinkInput } from '@/lib/estateos-link';
import { routing } from '@/i18n/routing';
import { levels } from '@/lib/content';
import { SHOWROOM_AREAS, SHOWROOM_VISTAS } from '@/lib/showroom';

interface Fixture {
  digest: string;
  cases: {
    toEstateos: { name: string; input: unknown; url: string }[];
    toEclipse: { name: string; input: { section?: string } }[];
    fromEstateos: { name: string; search: string; currency: string | null }[];
  };
}

const fixture = JSON.parse(readFileSync(new URL('./fixtures/handoff-cases.json', import.meta.url), 'utf8')) as Fixture;

describe('EstateOS link contract (lote 1.6, shared fixture with the `roofy` repo)', () => {
  // The same file lives in `roofy` (tests/fixtures/handoff-cases.json). If the digest there and
  // here differ, the two sites no longer agree on the link.
  it('carries the digest of its own cases', () => {
    expect(fixture.digest).toBe(createHash('sha256').update(JSON.stringify(fixture.cases)).digest('hex'));
    expect(fixture.digest).toBe('f66d6ee102d306fef6e9cc6222edf8abec3a5d628764c6470803086692e05665');
  });

  describe('Eclipse → EstateOS', () => {
    it.each(fixture.cases.toEstateos)('$name', ({ input, url }) => {
      expect(estateosUrl(input as EstateosLinkInput)).toBe(url);
    });

    it('uses the origin it is given (previews)', () => {
      expect(estateosUrl({ locale: 'en', currency: 'USD' }, 'http://localhost:3000')).toBe('http://localhost:3000/en/?moneda=USD');
    });

    it('drops a utm value longer than 100 characters', () => {
      expect(estateosUrl({ locale: 'es', utm: { utm_source: 'a'.repeat(101) } })).toBe('https://roofy.eclipse-business.com/es/');
      expect(estateosUrl({ locale: 'es', utm: { utm_source: 'a'.repeat(100) } })).toContain(`utm_source=${'a'.repeat(100)}`);
    });

    it('never builds a URL from something that is not on a list', () => {
      const url = estateosUrl({ locale: 'es', currency: '<b>' as never, vista: '<i>' as never, area: '<u>' as never, plan: '<p>' as never, utm: { utm_source: '<s>' } });
      expect(url).toBe('https://roofy.eclipse-business.com/es/');
    });
  });

  describe('EstateOS → Eclipse (what this site reads on the way back)', () => {
    it.each(fixture.cases.fromEstateos)('$name', ({ search, currency }) => {
      expect(currencyFromEstateos(search)).toBe(currency);
    });
  });

  describe('allow-lists follow the rest of the site', () => {
    it('currencies, views and areas are the ones the site already uses', () => {
      expect(CURRENCIES).toEqual(['ARS', 'BRL', 'USD']);
      expect(SHOWROOM_VISTAS).toEqual(['entrada', 'guia', 'branding', 'intelligence', 'academy']);
      expect(SHOWROOM_AREAS).toEqual(['recepcion', 'administracion', 'ventas', 'marketing']);
      expect(ESTATEOS_PLANS).toEqual(levels.map((lv) => lv.id));
      expect(ESTATEOS_UTM_KEYS).toEqual(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']);
    });

    it('the default currency per language matches the one `roofy` assumes', () => {
      expect(Object.fromEntries(routing.locales.map((l) => [l, defaultCurrencyFor(l)]))).toEqual({ es: 'ARS', en: 'USD', pt: 'BRL' });
    });

    it('every section EstateOS may link back to exists on the home (the removed Fundadores is not one of them)', () => {
      const anchors = Object.values(SECTION_IDS) as string[];
      const returnable = ['inicio', 'servicios', 'pyme', 'ejemplos', 'precios', 'problema', 'proceso', 'contacto'];
      returnable.forEach((id) => expect(anchors).toContain(id));
      expect(returnable).not.toContain('fundadores');
      const sectionsInFixture = fixture.cases.toEclipse.map((c) => c.input.section).filter((s): s is string => !!s && s !== 'admin');
      sectionsInFixture.forEach((id) => expect(returnable).toContain(id));
    });
  });
});
