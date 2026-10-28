import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { levelById, levels, products } from '@/lib/content';
import { fromUsd, launchDate } from '@/components/sections/products/products';
import { PAGE_SECTIONS, phaseAt, sectionDomId, sectionIndexLabel, sectionPhase } from '@/components/ui/sectionIndex';
import { NAV_LINKS, SECTION_IDS, AGENCY_TOC, currentUnit } from '@/components/layout/navLinks';
import { isAgencyHash, legacyAnchorsScript } from '@/components/layout/legacyAnchors';

const root = path.resolve(import.meta.dirname, '..');
const LOCALES = ['es', 'en', 'pt'] as const;
type Tree = { [k: string]: string | Tree };
const messages = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(readFileSync(path.join(root, 'messages', `${l}.json`), 'utf8')) as Tree]));
const get = (tree: Tree, key: string) => key.split('.').reduce<string | Tree | undefined>((node, k) => (node && typeof node === 'object' ? node[k] : undefined), tree);

/**
 * The home's products (decision of Ignacio, 28/10/2026): Roofy, Foody, Markyt and Handy, each
 * honest about where it stands — only what is on sale carries a price, and that price is read
 * from content/levels.json, never written in the copy.
 */
describe('products (content/products.json)', () => {
  it('lists the four products the home shows, in order', () => {
    expect(products.map((p) => p.id)).toEqual(['roofy', 'foody', 'markyt', 'handy']);
  });

  it('only what is on sale has a «desde», and it comes from the levels', () => {
    for (const p of products) {
      if (p.status === 'available') {
        expect(levelById(p.fromLevel), p.id).toBeDefined();
        expect(fromUsd(p)).toBe(levelById(p.fromLevel)!.priceUsd);
      } else {
        expect(p.fromLevel, p.id).toBeNull();
        expect(fromUsd(p), p.id).toBeNull();
      }
    }
    // Roofy is EstateOS: its «desde» is the first level of the ladder.
    expect(fromUsd(products[0])).toBe(Math.min(...levels.map((lv) => lv.priceUsd)));
  });

  it('a launching product has a real date, written out per locale', () => {
    for (const p of products.filter((x) => x.status === 'launch')) {
      expect(p.launchDate, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(launchDate(p, 'es')).toBe('10 de noviembre de 2026');
      expect(launchDate(p, 'en')).toBe('November 10, 2026');
      expect(launchDate(p, 'pt')).toBe('10 de novembro de 2026');
    }
  });

  it('every point, feature and in-design item has its copy in the three locales', () => {
    for (const l of LOCALES) {
      for (const p of products) {
        const base = `products.items.${p.id}`;
        for (const k of ['name', 'rubro', 'line', 'lead', 'start', 'ask']) expect(typeof get(messages[l], `${base}.${k}`), `${l} ${base}.${k}`).toBe('string');
        for (const k of p.points) expect(typeof get(messages[l], `${base}.points.${k}`), `${l} ${base}.points.${k}`).toBe('string');
        for (const k of p.features) expect(typeof get(messages[l], `${base}.features.${k}.name`), `${l} ${base}.features.${k}`).toBe('string');
        for (const k of p.later) expect(typeof get(messages[l], `${base}.later.${k}.name`), `${l} ${base}.later.${k}`).toBe('string');
      }
    }
  });

  it('no price, quota or currency is written in the products copy (prices come from content)', () => {
    for (const l of LOCALES) {
      const text = JSON.stringify(get(messages[l], 'products.items'));
      expect(text, l).not.toMatch(/USD|US\$|R\$|\$\s?\d|\d+\s?(?:usd|dólares|dollars)/i);
    }
  });

  it('in-design items are never listed as included', () => {
    for (const p of products) for (const k of p.later) expect(p.features, p.id).not.toContain(k);
  });
});

describe('page indexes and navigation', () => {
  it('the home is hero · productos · Eclipse Media · equipamiento; Agency keeps the v3 order', () => {
    expect(PAGE_SECTIONS.home).toEqual(['hero', 'products', 'media', 'equipment']);
    expect(PAGE_SECTIONS.agency).toEqual(['agency', 'services', 'pyme', 'examples', 'pricing', 'problem', 'process', 'agent']);
    expect(sectionIndexLabel('equipment')).toBe('04');
    expect(sectionIndexLabel('pricing')).toBe('05');
    expect(sectionPhase('hero')).toBe(1);
    expect(sectionPhase('equipment')).toBe(0);
    expect(sectionPhase('agent')).toBe(0);
    expect(phaseAt(1.5, 4)).toBeCloseTo(0.5);
  });

  it('every indexed section has its own id, and the v3 ids did not change', () => {
    const ids = [...PAGE_SECTIONS.home, ...PAGE_SECTIONS.agency].map(sectionDomId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SECTION_IDS).toMatchObject({ services: 'servicios', examples: 'ejemplos', pricing: 'precios', process: 'proceso', agent: 'contacto', problem: 'problema' });
    for (const key of AGENCY_TOC) expect(PAGE_SECTIONS.agency).toContain(key);
  });

  it('the header leads to the four units, each its own page', () => {
    expect(NAV_LINKS.map((l) => l.href)).toEqual(['/media/', '/academy/', '/intelligence/', '/agency/']);
    expect(currentUnit('/agency')).toBe('agency');
    expect(currentUnit('/agency/')).toBe('agency');
    expect(currentUnit('/')).toBeNull();
    for (const l of LOCALES) for (const link of NAV_LINKS) expect(typeof get(messages[l], `nav.${link.id}`)).toBe('string');
  });

  it('old home anchors are sent to /agency/, the new ones stay', () => {
    for (const hash of ['precios', 'contacto', 'servicios', 'ejemplos', 'proceso', 'problema', 'pyme', 'plan-contact', 'pr-tab-pieces', 'pr-fam-web'])
      expect(isAgencyHash(hash), hash).toBe(true);
    for (const hash of ['productos', 'media', 'equipamiento', 'inicio', 'main', '']) expect(isAgencyHash(hash), hash).toBe(false);
    const script = legacyAnchorsScript('es');
    expect(script).toContain('/es/agency/');
    expect(() => new Function(script)).not.toThrow();
  });
});
