import { describe, expect, it } from 'vitest';
import { catalogMismatches } from '@/lib/plan-request';
import type { ApiCatalog } from '@/lib/api/types';
import v1 from './fixtures/backend-catalog.v1.json';
import reto from './fixtures/backend-catalog.reto-2026-10-13-v2.json';

/**
 * Lote 2.2 · lane A: the web's divergence guard against the two REAL backend snapshots that exist
 * today (Eclipse-be `main` = the fixture v1, and Eclipse-be PR #10 = the 13/10 campaign catalog).
 * Neither carries the 16/10 offer (Adaptación 500 / Pack 700, one plan 30/75/150), so live
 * «Enviar solicitud» stays blocked until the backend is reconciled in its own authorized change.
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
    // The two offers and the three monthly plans of 16/10 do not exist on the backend side.
    expect(found).toContain('plans:adaptacion:missing in API');
    expect(found).toContain('plans:pack:missing in API');
    expect(found).toContain('maintenance:conectado:missing in API');
    expect(found).toContain('maintenance:ia:missing in API');
    // Pieces added after the snapshot, and the retired ones the web no longer sells.
    expect(found).toContain('items:whatsapp:missing in API');
    expect(found).toContain('items:asesorias:missing in API');
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
