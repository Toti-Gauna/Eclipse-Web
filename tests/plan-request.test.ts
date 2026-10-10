import { describe, expect, it } from 'vitest';
import catalog from './fixtures/backend-catalog.v1.json';
import type { ApiCatalog } from '@/lib/api/types';
import { buildPlanRequestBody, catalogMismatches, checkContact, hasProblems, toApiSelection } from '@/lib/plan-request';
import { emptyPlanState, type PlanState } from '@/lib/plan-url';
import { items, plans } from '@/lib/content';

const api = catalog as unknown as ApiCatalog;
const state = (over: Partial<PlanState>): PlanState => ({ ...emptyPlanState, ...over });

describe('plan request — selection mapping', () => {
  it('maps the builder state 1:1 to the API selection (no prices, no extras repeated from the package)', () => {
    const sel = toApiSelection(
      state({ goals: ['atender', 'encontrar'], planId: 'sistema', items: ['trailer', 'landing', 'seo'], maintenance: 'escala', billing: 'annual', vertical: 'clinicas', founder: true }),
    );
    expect(sel).toEqual({
      goals: ['encontrar', 'atender'],
      planId: 'sistema',
      items: ['seo', 'trailer'], // landing is included in Sistema: never sent twice
      maintenance: 'escala',
      billing: 'annual',
      vertical: 'clinicas',
      founder: true,
    });
  });

  it('keeps the three maintenance meanings: omitted (suggest), null (none), id', () => {
    expect('maintenance' in toApiSelection(state({ items: ['seo'] }))).toBe(false);
    expect(toApiSelection(state({ items: ['seo'], maintenance: null })).maintenance).toBeNull();
    expect(toApiSelection(state({ items: ['seo'], maintenance: 'esencial' })).maintenance).toBe('esencial');
  });

  it("drops a package's free bonus piece from the extras (Voz and Automatiza include the premium landing)", () => {
    expect(toApiSelection(state({ planId: 'voz', items: ['landing', 'seo'] })).items).toEqual(['seo']);
  });

  it('only sends ids the API enumerates', () => {
    const ids = new Set(api.items.map((i) => i.id));
    for (const item of items) expect(ids.has(item.id)).toBe(true);
    const planIds = new Set(api.plans.map((p) => p.id));
    for (const plan of plans) expect(planIds.has(plan.id)).toBe(true);
  });

  it('builds the body with the catalog version and a trimmed, E.164 contact', () => {
    const body = buildPlanRequestBody(state({ planId: 'presencia' }), { name: '  Ana Pérez ', phone: '+54 9 223 555-0000', message: '  Hola ' }, api.version);
    expect(body).toEqual({
      catalogVersion: api.version,
      selection: expect.objectContaining({ planId: 'presencia' }),
      contact: { name: 'Ana Pérez', phone: '+5492235550000' },
      message: 'Hola',
    });
    expect(JSON.stringify(body)).not.toMatch(/price|total|estimate|status|clientId/i);
  });

  it('omits an empty message and refuses an empty selection', () => {
    const body = buildPlanRequestBody(state({ items: ['seo'] }), { name: 'A', phone: '+5491100000000', message: '   ' }, api.version);
    expect('message' in body).toBe(false);
    expect(() => buildPlanRequestBody(emptyPlanState, { name: 'A', phone: '+5491100000000' }, api.version)).toThrow();
  });
});

describe('plan request — contact validation', () => {
  it('requires a name and an international phone without guessing a country', () => {
    expect(checkContact({ name: '', phone: '' })).toEqual({ name: 'required', phone: 'required' });
    expect(checkContact({ name: 'Ana', phone: '011 4000-1234' })).toEqual({ phone: 'format' });
    expect(checkContact({ name: 'Ana', phone: '+54 11 4000 1234' })).toEqual({});
    expect(checkContact({ name: 'Ana', phone: '0054 11 4000 1234' })).toEqual({});
    expect(checkContact({ name: 'x'.repeat(101), phone: '+5491100000000' })).toEqual({ name: 'long' });
    expect(hasProblems(checkContact({ name: 'Ana', phone: '+5491100000000', message: 'y'.repeat(2001) }))).toBe(true);
  });
});

describe('plan request — web content vs the backend catalog', () => {
  it('matches the backend catalog snapshot 1:1 (prices, packages, maintenance, offers, enums)', () => {
    // If this fails the web and the backend drifted: refresh tests/fixtures/backend-catalog.v1.json from
    // GET /api/v1/catalog/plans, review the differences and align /content (or ask for a new catalog).
    expect(catalogMismatches(api)).toEqual([]);
  });

  it('detects a changed price, package or offer', () => {
    const changed = structuredClone(api);
    changed.items[0].priceCents += 100;
    changed.plans[2].items = changed.plans[2].items.slice(1);
    changed.maintenance[1].monthlyCents = 1;
    changed.offers.find((o) => o.kind === 'voiceCombo')!.priceCents = 1;
    const found = catalogMismatches(changed).map((m) => `${m.area}:${m.id}`);
    expect(found).toEqual(expect.arrayContaining(['items:landing', 'plans:voz', 'maintenance:crecimiento', 'offers:combo-voz']));
  });
});
