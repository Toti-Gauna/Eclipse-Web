import { describe, expect, it } from 'vitest';
import catalog from './fixtures/backend-catalog.v1.json';
import type { ApiCatalog } from '@/lib/api/types';
import { buildPlanRequestBody, catalogMismatches, checkContact, hasProblems, toApiSelection } from '@/lib/plan-request';
import { emptyPlanState, type PlanState } from '@/lib/plan-url';
import { maintenancePlans, plans, sellableItems, sellablePlans } from '@/lib/content';

const api = catalog as unknown as ApiCatalog;
const state = (over: Partial<PlanState>): PlanState => ({ ...emptyPlanState, ...over });

describe('plan request — selection mapping', () => {
  it('maps the builder state 1:1 to the API selection (no prices, no extras repeated from the package)', () => {
    const sel = toApiSelection(
      state({ goals: ['atender', 'encontrar'], planId: 'pack', items: ['trailer', 'landing', 'seo', 'voz'], maintenance: 'ia', billing: 'annual', vertical: 'clinicas', founder: true }),
    );
    expect(sel).toEqual({
      goals: ['encontrar', 'atender'],
      planId: 'pack',
      items: ['trailer', 'voz'], // landing and SEO are covered by the pack: never sent twice
      maintenance: 'ia',
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

  it('sends the advisory combo instead of its two pieces, and never a price', () => {
    expect(toApiSelection(state({ items: ['asesoria-growth', 'asesoria-economica'] })).items).toEqual(['asesorias']);
  });

  it('builds the body with the catalog version and a trimmed, E.164 contact', () => {
    const body = buildPlanRequestBody(state({ planId: 'adaptacion' }), { name: '  Ana Pérez ', phone: '+54 9 223 555-0000', message: '  Hola ' }, api.version);
    expect(body).toEqual({
      catalogVersion: api.version,
      selection: expect.objectContaining({ planId: 'adaptacion' }),
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
  /** A catalog built from /content, as the backend would publish it once it carries the 16/10 offer. */
  const fromContent = (): ApiCatalog => ({
    ...api,
    items: sellableItems.map((i) => ({ id: i.id, category: i.category, name: i.name, priceCents: i.priceUsd * 100, addonCents: i.addonUsd == null ? null : i.addonUsd * 100 })),
    plans: sellablePlans.map((p) => ({ id: p.id, name: p.name, tier: p.tier, rangeCents: { from: p.priceUsd.from * 100, to: p.priceUsd.to * 100 }, items: p.items, maintenance: p.maintenance, bonusItemId: null })),
    maintenance: maintenancePlans.map((m) => ({ id: m.id, name: m.name, monthlyCents: m.priceUsd * 100 })),
    voiceUsage: undefined,
    offers: api.offers.map((o) => ({ ...o, active: false })),
  });

  it('BLOCKER: the backend catalog v1 predates the 16/10 offer, and the web detects it', () => {
    // tests/fixtures/backend-catalog.v1.json is GET /api/v1/catalog/plans before the 16/10 offer.
    // Until Eclipse-be publishes the new catalog, every request is drift: RequestAction sends
    // nothing and points to WhatsApp. Refresh the fixture when the backend is updated.
    const found = catalogMismatches(api).map((m) => `${m.area}:${m.id}`);
    expect(found).toEqual(expect.arrayContaining(['items:whatsapp', 'maintenance:conectado', 'voice:voz-uso']));
    // Hidden offers and pieces are never sent, so the API is not asked to know them.
    expect(found).not.toContain('plans:pack');
    expect(found).not.toContain('items:asesorias');
  });

  it('a backend catalog that carries the 16/10 offer matches 1:1', () => {
    expect(catalogMismatches(fromContent())).toEqual([]);
  });

  it('detects a changed price, add-on price, offer contents or plan', () => {
    const changed = fromContent();
    changed.items[0].priceCents += 100;
    changed.items[1].addonCents = 1;
    changed.plans.push({ id: 'zzz', name: plans[0].name, tier: 'starter', rangeCents: { from: 1, to: 1 }, items: [], maintenance: null, bonusItemId: null } as never);
    changed.maintenance[1].monthlyCents = 1;
    const found = catalogMismatches(changed).map((m) => `${m.area}:${m.id}`);
    expect(found).toEqual(expect.arrayContaining(['items:landing', 'items:web-multi', 'plans:zzz', 'maintenance:conectado']));
  });
});
