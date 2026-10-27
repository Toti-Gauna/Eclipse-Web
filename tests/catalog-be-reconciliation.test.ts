import { describe, expect, it } from 'vitest';
import { catalogMismatches } from '@/lib/plan-request';
import type { ApiCatalog } from '@/lib/api/types';
import v1 from './fixtures/backend-catalog.v1.json';
import reto from './fixtures/backend-catalog.reto-2026-10-13-v2.json';
import reconciled from './fixtures/backend-catalog.2026-10-27.json';

/**
 * Lote 2.2 · lane A: the web's divergence guard against the two REAL backend snapshots that exist
 * today (Eclipse-be `main` = the fixture v1, and Eclipse-be PR #10 = the 13/10 campaign catalog).
 * Neither carries the 16/10 prices (one plan 30/75/150, add-on prices). Since lote 2.2b the two offers
 * (Adaptación 500 / Pack 700) and the financial-advisory pieces are hidden: the web never sends them, so
 * the guard no longer asks the API to know them. Live «Enviar solicitud» stays blocked until the backend
 * is reconciled in its own authorized change.
 * When that happens these expectations are the ones to update (the guard must then return []).
 */
const find = (c: unknown) => catalogMismatches(c as ApiCatalog).map((m) => `${m.area}:${m.id}:${m.detail}`);

describe('FE guard vs the real backend snapshots (blocker kept, not bypassed)', () => {
  it.each([
    ['backend main (fixture v1)', v1],
    ['backend PR #10 (reto 13/10 v2)', reto],
  ])('%s: differs from the web and says where', (_name, snapshot) => {
    const found = find(snapshot);
    expect(found.length).toBeGreaterThan(0);
    // The monthly plans of 16/10 do not exist on the backend side; its seven old level plans do not exist on the web.
    expect(found).toContain('maintenance:conectado:missing in API');
    expect(found).toContain('plans:diagnostico:missing in web');
    // Retired offers and pieces (hidden) are not requested from the API.
    expect(found).not.toContain('plans:adaptacion:missing in API');
    expect(found).not.toContain('plans:pack:missing in API');
    expect(found).not.toContain('items:asesorias:missing in API');
    expect(found).toContain('maintenance:ia:missing in API');
    // Pieces added after the snapshot.
    expect(found).toContain('items:whatsapp:missing in API');
    expect(found).toContain('items:automatizacion:missing in web');
    // Historical offers the backend still marks active.
    expect(found.some((f) => f.startsWith('offers:founder'))).toBe(true);
  });

  it('prices differ per piece, in cents, never silently', () => {
    const found = find(v1);
    expect(found).toContain('items:landing:price 50000 vs 25000');
    expect(found).toContain('maintenance:esencial:price');
  });

  it('the campaign snapshot already matches the landing price but not its add-on', () => {
    const found = find(reto);
    expect(found).toContain('items:landing:addon price');
    expect(found.some((f) => f.startsWith('items:landing:price'))).toBe(false);
  });

  it('the guard never reports an empty list for a backend that predates the offer', () => {
    expect(find(v1)).not.toEqual([]);
    expect(find(reto)).not.toEqual([]);
  });
});

/**
 * Lote D18 (27/10/2026): the backend reconciled with the web in Eclipse-be (branch claude/eclipse-v3-inventory-audit-2ukttn,
 * `GET /catalog/plans` snapshot saved as tests/fixtures/backend-catalog.2026-10-27.json). The guard must find NOTHING:
 * the same 18 pieces with their independent and add-on prices, the three builder maintenance plans, no offer on sale,
 * no voice fee and the ladder of six levels. It stays blocking for the two older catalogs above.
 */
describe('the reconciled backend (27/10/2026) matches the web 1:1', () => {
  it('the guard returns no difference', () => {
    expect(find(reconciled)).toEqual([]);
  });

  it('a single changed price, add-on or level on the backend would block again', () => {
    const changed = JSON.parse(JSON.stringify(reconciled)) as typeof reconciled;
    changed.items[0].priceCents += 100;
    changed.items[1].addonCents = 1;
    changed.levels[2].monthlyCents = 1;
    changed.offers[0].active = true;
    expect(find(changed)).toEqual(
      expect.arrayContaining(['items:landing:price 50000 vs 50100', 'items:web-multi:addon price', 'levels:escalar:price', 'offers:founder:active']),
    );
  });

  it('carries the current version format and every old plan is gone (nothing is sold as a package)', () => {
    expect(reconciled.version).toMatch(/^v1-[a-f0-9]{64}$/);
    expect(reconciled.plans).toEqual([]);
    expect(reconciled.levels.map((lv) => lv.id)).toEqual(['contact', 'growth', 'escalar', 'hipergrowth', 'deluxe', 'partner']);
  });
});
