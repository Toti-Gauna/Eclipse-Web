import { describe, expect, it } from 'vitest';
import catalog from '../docs/v3/estateos/catalogo-estateos.v1.json';
import { levels, levelsCatalogVersion, lowestLevelUsd } from '@/lib/content';
import { routing, type Locale } from '@/i18n/routing';

const locales = routing.locales as readonly Locale[];

/**
 * Lote 2.3b · the six-level ladder shown on the landing (content/levels.json) is the owner's direction and must
 * stay in step with the versioned EstateOS catalog (docs/v3/estateos): same ids, same prices, same proposal status.
 */
describe('levels (content/levels.json) vs the EstateOS catalog', () => {
  it('six levels, in order, with the owner’s prices and Partner as a proposal', () => {
    expect(levels.map((lv) => [lv.id, lv.priceUsd, lv.priceStatus])).toEqual([
      ['contact', 30, 'owner'],
      ['growth', 75, 'owner'],
      ['escalar', 100, 'owner'],
      ['hipergrowth', 150, 'owner'],
      ['deluxe', 200, 'owner'],
      ['partner', 500, 'proposal'],
    ]);
  });

  it('matches the versioned catalog id by id, price by price', () => {
    expect(levelsCatalogVersion).toBe(catalog.catalogVersion);
    expect(levels.map((lv) => [lv.id, lv.priceUsd])).toEqual(catalog.plans.map((p) => [p.id, p.priceUsdMonthly]));
    for (const lv of levels) {
      const plan = catalog.plans.find((p) => p.id === lv.id)!;
      expect(lv.priceStatus === 'proposal', lv.id).toBe(plan.priceStatus === 'proposal');
    }
  });

  it('every text exists in the three locales and each level lists what it includes', () => {
    for (const lv of levels) {
      for (const field of [lv.name, lv.lead, lv.audience]) for (const loc of locales) expect(field[loc]?.length, `${lv.id}:${loc}`).toBeGreaterThan(1);
      for (const loc of locales) expect(lv.includes[loc].length, `${lv.id}:${loc}`).toBe(lv.includes.es.length);
      expect(lv.includes.es.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('shows no quota and no setup price (still a proposal): only qualitative inclusions', () => {
    const text = JSON.stringify(levels.map((lv) => lv.includes));
    expect(text).not.toMatch(/\bUSD\b|\$\s?\d|\b\d+\s?(min|mensajes|messages)\b/i);
  });

  it('"desde" is the lowest level (30) and the old «desde 50» is gone', () => {
    expect(lowestLevelUsd).toBe(30);
    expect(levels.some((lv) => lv.priceUsd === 50)).toBe(false);
  });
});
