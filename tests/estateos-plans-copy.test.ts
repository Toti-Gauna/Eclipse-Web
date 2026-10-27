import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import catalog from '../docs/v3/estateos/catalogo-estateos.v3.json';

/**
 * Lote 3.5 · EstateOS (repo `roofy`) keeps a copy of the plan ladder in `content/estateos-plans.json` to show names, prices and
 * «Desde <plan>» on its demo. The copy is a subset of this catalog, and `roofy` pins its digest in `tests/plans.test.ts`. Here the
 * same subset is rebuilt from the versioned catalog and must hash to that digest: if the catalog changes a plan, a price or the plan a
 * capability starts at, this fails until `roofy`'s copy is regenerated and both pins move together (same cycle, both repos).
 */
const ROOFY_PLANS_DIGEST = '42b268777840a7001524fe83575e429b5a3326e8f1c01f66eb4223f4b51ea25c';

describe('EstateOS plan copy in `roofy` (content/estateos-plans.json)', () => {
  it('is exactly the subset of catalogo-estateos.v3.json that roofy pins', () => {
    const subset = {
      catalogVersion: catalog.catalogVersion,
      source: 'Eclipse-Web docs/v3/estateos/catalogo-estateos.v3.json',
      plans: catalog.plans.map((p) => ({
        id: p.id,
        name: p.name,
        priceUsdMonthly: p.priceUsdMonthly,
        priceStatus: p.priceStatus,
        inherits: p.inherits,
        capabilityIds: p.capabilityIds,
      })),
      capabilities: catalog.capabilities.map((c) => ({ id: c.id, fromPlan: c.fromPlan })),
    };
    expect(createHash('sha256').update(JSON.stringify(subset)).digest('hex')).toBe(ROOFY_PLANS_DIGEST);
  });
});
