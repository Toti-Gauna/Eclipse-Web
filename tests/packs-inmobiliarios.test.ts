import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import packsDoc from '../docs/v3/estateos/packs-inmobiliarios.v2.json';
import catalog from '../docs/v3/estateos/catalogo-estateos.v2.json';

/**
 * Lote 2.4 · the six real-estate Studio packs are a versioned DOCUMENT. These checks keep it honest: every price
 * is «A cotizar», every pack states its limits and exclusions, the 2D plan needs a geometry source, and nothing is
 * mandatory for using EstateOS.
 */
const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => [k, sortKeys(x)]))
      : v;

describe('EstateOS real-estate packs v1 (documental)', () => {
  const packs = packsDoc.packs;
  const byId = Object.fromEntries(packs.map((p) => [p.id, p]));

  it('six packs, in the order of the brief, built on the catalog version of the plans', () => {
    expect(packs.map((p) => p.id)).toEqual(['panorama', 'video_propiedad', 'voz_comercial', 'branding', 'redes', 'plano_2d']);
    expect(packsDoc.catalogVersion).toBe(catalog.catalogVersion);
  });

  it('every price stays «A cotizar» and every pack is optional', () => {
    for (const p of packs) {
      expect(p.price, p.id).toBe('A cotizar');
      expect(p.optional, p.id).toBe(true);
    }
    expect(JSON.stringify(packsDoc)).not.toMatch(/\bUSD\s?\d|\$\s?\d/);
  });

  it('each pack states brief, inputs, deliverables, quantities, revisions, formats, license, humans work and exclusions', () => {
    for (const p of packs) {
      for (const key of ['brief', 'revisions', 'license', 'synthetic'] as const) expect(String(p[key]).length, `${p.id}.${key}`).toBeGreaterThan(10);
      for (const key of ['inputs', 'deliverables', 'formats', 'humanWork', 'exclusions', 'exclusionsExtra', 'gates'] as const) expect(p[key].length, `${p.id}.${key}`).toBeGreaterThan(0);
      expect(Object.keys(p.quantities).length, p.id).toBeGreaterThan(0);
      expect(p.assetRecord, p.id).toEqual(expect.arrayContaining(['fuente', 'licencia', 'estadoSintetico']));
      expect(p.gates.some((g) => g.startsWith('G4')), p.id).toBe(true);
    }
  });

  it('the quantities of the brief hold: 15–20 s, 15–30 s, 80 words, 3 templates, four channels, one plan', () => {
    expect(byId.panorama.quantities).toMatchObject({ segundosEntregados: '15–20', relacionesDeAspecto: 2 });
    expect(byId.video_propiedad.quantities).toMatchObject({ segundosEntregados: '15–30', inmuebles: 1 });
    expect(byId.voz_comercial.quantities).toMatchObject({ palabrasMaximas: 80, voces: 1, rondasDePronunciacion: 1 });
    expect(byId.branding.quantities).toMatchObject({ carteles: 1, fichas: 1, plantillas: 3 });
    expect(byId.redes.quantities).toMatchObject({ canales: 4, conceptos: 1 });
    expect(byId.plano_2d.quantities).toMatchObject({ plantas: 1 });
  });

  it('the social kit defines the four channels and no publishing or ads', () => {
    const redes = byId.redes as typeof byId.redes & { channels: { canal: string }[] };
    expect(redes.channels.map((c) => c.canal)).toEqual(['Instagram', 'Facebook', 'TikTok', 'LinkedIn']);
    expect(redes.exclusions.join(' ')).toMatch(/Publicaci/);
    expect(redes.exclusions.join(' ')).toMatch(/Pauta/);
  });

  it('the 2D plan demands a geometry source and is never deduced from a photo', () => {
    const plano = byId.plano_2d as typeof byId.plano_2d & { geometryRule: { requiere: string; noAlcanza: string; etiqueta: string; validaciones: string[] } };
    expect(plano.geometryRule.requiere).toMatch(/plano base autorizado/i);
    expect(plano.geometryRule.noAlcanza).toMatch(/foto/i);
    expect(plano.geometryRule.etiqueta).toMatch(/Ilustrativo/);
    expect(plano.geometryRule.validaciones.length).toBeGreaterThanOrEqual(3);
    expect(plano.exclusions.join(' ')).toMatch(/foto/i);
  });

  it('the voice pack never clones a voice without specific consent and is not the voice agent', () => {
    expect(byId.voz_comercial.license).toMatch(/consentimiento espec/i);
    expect(byId.voz_comercial.planEquivalence.covers).toBe('ninguno');
  });

  it('plan equivalences use the units of the EstateOS catalog (tour, campaña, imagen)', () => {
    expect(byId.panorama.planEquivalence.unit).toMatch(/campaña/);
    expect(byId.video_propiedad.planEquivalence.unit).toMatch(/tour/);
    expect(byId.redes.planEquivalence.covers).toMatch(/4 imágenes/);
    expect(byId.branding.planEquivalence.covers).toMatch(/5 imágenes/);
    const defs = catalog.quotaDefinitions as Record<string, string>;
    expect(defs.tour).toMatch(/15 s/);
    expect(defs.campana).toMatch(/16:9 y 9:16/);
  });

  it('the digest matches the content', () => {
    const { digestSha256, ...rest } = packsDoc as typeof packsDoc & { digestSha256: string };
    expect(createHash('sha256').update(JSON.stringify(sortKeys(rest))).digest('hex')).toBe(digestSha256);
  });
});
