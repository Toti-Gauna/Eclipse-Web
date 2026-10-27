import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import v1 from '../docs/v3/estateos/catalogo-estateos.v1.json';
import v2 from '../docs/v3/estateos/catalogo-estateos.v2.json';
import catalog from '../docs/v3/estateos/catalogo-estateos.v3.json';

/**
 * Lote 2.3 · the EstateOS catalog is a versioned DOCUMENT (docs/v3/estateos), not product content: it states the
 * owner's direction (30/75/100/150/200), the Partner 500 proposal and the monthly quotas as proposals to cost.
 * These checks keep that document internally consistent and honest (nothing is marked available without proof).
 */
const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => [k, sortKeys(x)]))
      : v;

describe('EstateOS catalog v1 (documental)', () => {
  const plans = catalog.plans;

  it('exactly six plans at the owner’s prices; Partner is a proposal, the rest the owner’s direction', () => {
    expect(plans.map((p) => [p.id, p.priceUsdMonthly, p.priceStatus])).toEqual([
      ['contact', 30, 'owner_direction'],
      ['growth', 75, 'owner_direction'],
      ['escalar', 100, 'owner_direction'],
      ['hipergrowth', 150, 'owner_direction'],
      ['deluxe', 200, 'owner_direction'],
      ['partner', 500, 'proposal'],
    ]);
    expect(catalog.currency).toBe('USD');
  });

  it('the old «desde USD 50» appears only as a superseded antecedent and no plan sells at 50', () => {
    expect(plans.some((p) => p.priceUsdMonthly === 50)).toBe(false);
    expect(catalog.historical[0].label).toMatch(/50/);
    expect(catalog.historical[0].status).toMatch(/sustituido/);
  });

  it('keeps the sector catalog apart from the general one (same amount is not the same offer)', () => {
    expect(catalog.scope).toMatch(/no es el catálogo general/i);
  });

  it('monthly quotas are the totals of each plan, as proposed, and never decrease with the level', () => {
    const q = (k: keyof (typeof plans)[number]['quota']) => plans.map((p) => p.quota[k]);
    expect(q('tours15s')).toEqual([0, 1, 2, 3, 4, 8]);
    expect(q('campanas15sx2')).toEqual([0, 0, 1, 2, 3, 5]);
    expect(q('imagenesFinales')).toEqual([0, 4, 8, 12, 16, 24]);
    expect(q('mensajesAutomatizadosSalientes')).toEqual([0, 300, 600, 1000, 2000, 5000]);
    expect(q('minutosAgenteVoz')).toEqual([0, 0, 15, 30, 60, 150]);
    expect(q('consorciosAdministrados')).toEqual([0, 0, 0, 0, 1, 3]);
    expect(q('unidadesAdministradas')).toEqual([0, 0, 0, 0, 20, 60]);
    expect(q('sedesConfiguracionEstandar')).toEqual([1, 1, 1, 1, 1, 3]);
    for (const key of Object.keys(plans[0].quota) as (keyof (typeof plans)[number]['quota'])[]) {
      if (key === 'motionPlantilla') continue; // from Escalar the motion is part of the campaigns
      const values = q(key);
      expect(values, key).toEqual([...values].sort((a, b) => a - b));
    }
    expect(plans.every((p) => p.quotaStatus === 'proposed_to_cost')).toBe(true);
  });

  it('every level inherits the previous one, in a single chain from Contact', () => {
    expect(plans.map((p) => p.inherits)).toEqual([null, 'contact', 'growth', 'escalar', 'hipergrowth', 'deluxe']);
  });

  it('team sizes are suggestions, never contractual caps', () => {
    expect(plans.every((p) => p.teamIsContractualCap === false)).toBe(true);
  });

  it('every capability belongs to a plan, has evidence and a future lot, and none is marked available', () => {
    const ids = new Set(plans.map((p) => p.id));
    for (const c of catalog.capabilities) {
      expect(ids.has(c.fromPlan), c.id).toBe(true);
      expect(c.evidence.length, c.id).toBeGreaterThan(5);
      expect(c.futureLot.length, c.id).toBeGreaterThan(0);
      expect(['demo_simulated', 'planned'], c.id).toContain(c.availability);
    }
    // the plan lists exactly the capabilities that start at it
    for (const p of plans) {
      expect(p.capabilityIds).toEqual(catalog.capabilities.filter((c) => c.fromPlan === p.id).map((c) => c.id));
    }
  });

  it('the CRM is in Contact (corrección 26/10): not reserved to a higher plan', () => {
    const crm = catalog.capabilities.find((c) => c.id === 'crm_core')!;
    expect(crm.fromPlan).toBe('contact');
    expect(plans[0].capabilityIds).toContain('crm_core');
    expect(catalog.capabilities.find((c) => c.id === 'owner_panel')!.fromPlan).toBe('growth');
    expect(catalog.capabilities.find((c) => c.id === 'crm_chatbot')!.fromPlan).toBe('deluxe');
  });

  it('the bounded setup is included in the price (D19, 27/10); what exceeds it stays a quoted extra', () => {
    expect(plans.every((p) => p.setup.status === 'incluida_en_el_precio' && p.setup.extras === 'A cotizar')).toBe(true);
    expect(catalog.setupExcludes).toContain('Rediseño integral de identidad');
    expect(catalog.setupNote).toMatch(/incluida en el precio/);
  });

  it('Contact has no human support hours except a critical bug (D21); the other levels wait for measurement', () => {
    expect(plans[0].humanSupport).toMatchObject({ hoursIncluded: 0 });
    expect((plans[0].humanSupport as { exception: string }).exception).toMatch(/bug crítico/);
    for (const p of plans.slice(1)) expect(p.humanSupport.hoursIncluded, p.id).toBe('a definir tras medir');
  });

  it('a campaign is two 15 s pieces: one concept in two formats or two concepts, same cost (D23)', () => {
    const def = (catalog.quotaDefinitions as Record<string, string>).campana;
    expect(def).toMatch(/dos conceptos distintos/);
    expect(def).toMatch(/16:9 y 9:16/);
  });

  it('keeps the history: v3 supersedes v2, which superseded v1; the earlier files still exist unchanged', () => {
    expect(catalog.supersedes).toBe(v2.catalogVersion);
    expect(v2.supersedes).toBe(v1.catalogVersion);
    expect(v1.catalogVersion).toBe('estateos-2026-10-26-v1');
    expect(catalog.decisionLog.map((d) => d.id)).toEqual(expect.arrayContaining(['D17', 'D19', 'D20', 'D21', 'D23', 'D24', 'D27', 'cobros', 'D22']));
  });

  it('the guided chat is part of Contact (D20) and there is no deposit on the monthly plans (D27)', () => {
    const chat = catalog.capabilities.find((c) => c.id === 'guided_chat')!;
    expect(chat.fromPlan).toBe('contact');
    expect(chat.availability).toBe('demo_simulated');
    expect(plans[0].capabilityIds).toContain('guided_chat');
    expect(catalog.paymentTerms.deposit).toBe('ninguna');
    expect(catalog.paymentTerms.firstMonth).toMatch(/antes de empezar/);
  });

  it('the digest matches the content (sorted keys, compact JSON)', () => {
    const { digestSha256, ...rest } = catalog as typeof catalog & { digestSha256: string };
    const body = JSON.stringify(sortKeys(rest));
    expect(createHash('sha256').update(body).digest('hex')).toBe(digestSha256);
  });
});
