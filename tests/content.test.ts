import { describe, expect, it } from 'vitest';
import {
  addons,
  founders,
  itemCategories,
  items,
  maintenancePlans,
  offers,
  plans,
  units,
  verticals,
  voiceUsage,
  featuredPlanId,
  fallbackRates,
} from '@/lib/content';

const LOCALES = ['es', 'en', 'pt'] as const;

/** Walks any value and returns the paths of localized objects missing a locale or empty. */
function missingTranslations(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => missingTranslations(v, `${path}[${i}]`));
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  const looksLocalized = keys.includes('es') || keys.includes('en') || keys.includes('pt');
  if (looksLocalized) {
    return LOCALES.filter((l) => {
      const v = obj[l];
      if (Array.isArray(v)) return v.length === 0 || v.some((s) => typeof s !== 'string' || !s.trim());
      return typeof v !== 'string' || !v.trim();
    }).map((l) => `${path}.${l}`);
  }
  return keys.flatMap((k) => missingTranslations(obj[k], `${path}.${k}`));
}

describe('content integrity', () => {
  const itemIds = new Set(items.map((i) => i.id));
  const planIds = new Set(plans.map((p) => p.id));

  it('has unique ids', () => {
    for (const list of [items, plans, addons, maintenancePlans, offers, verticals, founders.slots, units]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every item belongs to a known category and has a positive price', () => {
    const cats = new Set(itemCategories.map((c) => c.id));
    for (const item of items) {
      expect(cats.has(item.category), item.id).toBe(true);
      expect(item.priceUsd).toBeGreaterThan(0);
    }
  });

  it('plans reference existing items and have a valid range', () => {
    for (const plan of plans) {
      expect(plan.items.length, plan.id).toBeGreaterThan(0);
      for (const id of plan.items) expect(itemIds.has(id), `${plan.id} → ${id}`).toBe(true);
      expect(plan.priceUsd.from).toBeLessThanOrEqual(plan.priceUsd.to);
      for (const l of LOCALES) expect(plan.includes[l].length).toBe(plan.includes.es.length);
    }
    expect(planIds.has(featuredPlanId)).toBe(true);
  });

  it('matches the price table of the brief', () => {
    const table: Record<string, [number, number]> = {
      diagnostico: [150, 250],
      presencia: [250, 400],
      voz: [500, 700],
      automatiza: [400, 700],
      sistema: [1000, 1500],
      comercio: [2000, 3500],
      plataforma: [4000, 7000],
    };
    for (const [id, [from, to]] of Object.entries(table)) {
      const plan = plans.find((p) => p.id === id)!;
      expect(plan.priceUsd).toEqual({ from, to });
    }
    expect(maintenancePlans.map((m) => [m.id, m.priceUsd])).toEqual([
      ['esencial', 25],
      ['crecimiento', 79],
      ['escala', 199],
    ]);
    expect(voiceUsage.priceUsd).toBe(49);
  });

  it('addons reference existing items and offers', () => {
    const offerIds = new Set(offers.map((o) => o.id));
    for (const addon of addons) {
      expect(itemIds.has(addon.itemId), addon.id).toBe(true);
      if (addon.offer) expect(offerIds.has(addon.offer), addon.id).toBe(true);
    }
  });

  it('offers reference existing plans/items', () => {
    for (const offer of offers) {
      if (offer.kind === 'voiceCombo') {
        expect(itemIds.has(offer.itemId)).toBe(true);
        for (const p of offer.plans) expect(planIds.has(p), p).toBe(true);
      }
      if (offer.endsAt) expect(Number.isNaN(Date.parse(offer.endsAt))).toBe(false);
    }
  });

  it('plan maintenance suggestions point to real maintenance plans', () => {
    const ids = new Set(maintenancePlans.map((m) => m.id));
    for (const plan of plans) if (plan.maintenance) expect(ids.has(plan.maintenance), plan.id).toBe(true);
  });

  it('verticals: every one with a demo has a business and a key number', () => {
    for (const v of verticals) {
      if (v.demo) {
        expect(v.business, v.id).toBeTruthy();
        expect(v.keyNumber, v.id).toBeTruthy();
      }
    }
    expect(verticals.map((v) => v.id)).toEqual([
      'clinicas',
      'inmobiliarias',
      'gimnasios',
      'tiendas',
      'restaurantes',
      'academias',
      'otro',
    ]);
    // Every demo id is used by exactly one vertical.
    const demos = verticals.flatMap((v) => (v.demo ? [v.demo] : []));
    expect(new Set(demos).size).toBe(demos.length);
  });

  it('founders: slots match the total and filled slots are complete', () => {
    expect(founders.slots.length).toBe(founders.total);
    for (const s of founders.slots.filter((x) => x.filled)) {
      expect(s.name, s.id).toBeTruthy();
      expect(s.result, s.id).toBeTruthy();
    }
  });

  it('fallback rates are sane', () => {
    expect(fallbackRates.ARS).toBeGreaterThan(1);
    expect(fallbackRates.BRL).toBeGreaterThan(1);
  });

  it('every localized field has es, en and pt', () => {
    const all = { itemCategories, items, plans, addons, maintenancePlans, voiceUsage, offers, verticals, founders, units };
    expect(missingTranslations(all)).toEqual([]);
  });
});
