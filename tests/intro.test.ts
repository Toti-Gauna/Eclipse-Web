import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { BAR, BEAT, FILM_END, GOLPES, SCENE, SCORE, VAMP, VAMP_LOOP, ZOOM_STEP, filmNotes, vampNotes } from '@/components/intro/score/jingle';
import { GEO, ORBIT_PRODUCTS, ORBIT_UNITS, PORTRAIT_BELOW, STAGE, layoutFor, onOrbit } from '@/components/intro/geometry';
import { COMING, ZOOMED } from '@/components/intro/IntroScenes';
import { INTRO_STORAGE_KEY, introScript } from '@/components/intro/introScript';
import { levels, pagedProducts, products } from '@/lib/content';

const root = path.resolve(import.meta.dirname, '..');
const LOCALES = ['es', 'en', 'pt'] as const;
type Tree = { [k: string]: string | Tree };
const messages = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(readFileSync(path.join(root, 'messages', `${l}.json`), 'utf8')) as Tree]));

/**
 * «Eclipse en 40 segundos» (decision of Ignacio, 28/10/2026): the intro film after the loading screen, on every full
 * load of the home, ending with «Activar Eclipse».
 */
describe('intro film: clock and music', () => {
  it('runs at 120 BPM and every scene starts on a bar, in order, inside the film', () => {
    expect(BEAT).toBe(0.5);
    expect(BAR).toBe(2);
    const starts = Object.values(SCENE);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
    for (const s of starts) {
      expect(s % BAR, `scene at ${s}`).toBe(0);
      expect(s).toBeLessThan(FILM_END);
    }
    expect(FILM_END).toBe(40);
  });

  it('the four word slams fall on the beat, inside their scene', () => {
    for (const g of GOLPES) {
      expect(g % BEAT).toBe(0);
      expect(g).toBeGreaterThanOrEqual(SCENE.golpes);
      expect(g).toBeLessThan(SCENE.eco);
    }
  });

  it('the product zooms fit their scene: one per zoomed product, then «Próximamente»', () => {
    expect(ZOOMED.length * ZOOM_STEP).toBe(SCENE.soon - SCENE.zoom);
    expect(ZOOMED).toEqual(pagedProducts.map((p) => p.id));
    expect(COMING).toEqual(products.filter((p) => p.status === 'soon').map((p) => p.id));
  });

  it('the score covers the film bar by bar, and the vamp loops two clean bars', () => {
    // Sections are in seconds, back to back from 0 to the end of the film, each on a bar line.
    expect(SCORE[0].from).toBe(0);
    expect(SCORE.at(-1)?.to).toBe(FILM_END);
    SCORE.forEach((s, i) => {
      if (i) expect(s.from, s.style).toBe(SCORE[i - 1].to);
      expect(s.from % BAR).toBe(0);
      expect(s.chords.length, `${s.style} ${s.from}`).toBeGreaterThan(0);
    });
    expect(VAMP.at(-1)?.to).toBe(VAMP_LOOP.end);
    expect(VAMP_LOOP.end - VAMP_LOOP.start).toBe(2 * BAR);
  });

  it('every note lands inside its piece and is playable', () => {
    const film = filmNotes();
    expect(film.length).toBeGreaterThan(200);
    for (const n of film) {
      expect(n.t).toBeGreaterThanOrEqual(0);
      expect(n.t).toBeLessThan(FILM_END);
      expect(n.vel).toBeGreaterThan(0);
      expect(n.vel).toBeLessThanOrEqual(1);
    }
    // A melody, a harmony and a bass: music, not only percussion (Ignacio, 27/10/2026).
    const kinds = new Set(film.map((n) => n.inst));
    for (const inst of ['lead', 'keys', 'bass'] as const) expect(kinds.has(inst), inst).toBe(true);
    for (const n of vampNotes()) expect(n.t).toBeLessThan(VAMP_LOOP.end);
  });
});

describe('intro film: stage', () => {
  it('portrait screens get the portrait stage', () => {
    expect(layoutFor(1440, 900)).toBe('land');
    expect(layoutFor(390, 844)).toBe('port');
    expect(layoutFor(360, 640)).toBe('port');
    expect(layoutFor(768, 1024)).toBe('port');
    expect(layoutFor(1024, 768)).toBe('land');
    expect(PORTRAIT_BELOW).toBeLessThan(1);
  });

  it('both orbits stay on the stage, and the eclipse fits in every scene', () => {
    for (const layout of ['land', 'port'] as const) {
      const { w, h } = STAGE[layout];
      const g = GEO[layout];
      for (let a = 0; a < 360; a += 15) {
        const p = onOrbit(g.core, g.orbit.units + g.orbit.node / 2, a);
        expect(p.x, `${layout} ${a}`).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(w);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(h);
      }
      for (const at of [g.ignite, g.core, g.end]) {
        expect(at.x - at.d / 2).toBeGreaterThanOrEqual(0);
        expect(at.x + at.d / 2).toBeLessThanOrEqual(w);
      }
    }
    expect(ORBIT_PRODUCTS).toEqual(products.map((p) => p.id));
    expect(ORBIT_UNITS).toEqual(['media', 'academy', 'intelligence', 'agency', 'equipment']);
  });

  it('the plans come from the catalog (six levels), never from the copy', () => {
    expect(levels.map((lv) => lv.id)).toEqual(['contact', 'growth', 'escalar', 'hipergrowth', 'deluxe', 'partner']);
    for (const l of LOCALES) expect(JSON.stringify(messages[l].intro), l).not.toMatch(/USD\s?\d|\$\s?\d|R\$\s?\d/);
  });
});

describe('intro film: when it plays (introScript)', () => {
  const run = (url: string, stored: string | null = null) => {
    const attrs: Record<string, string> = {};
    const u = new URL(url, 'https://example.test');
    const document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
    const location = { search: u.search, hash: u.hash };
    const localStorage = { getItem: (k: string) => (k === INTRO_STORAGE_KEY ? stored : null) };
    new Function('document', 'location', 'localStorage', introScript())(document, location, localStorage);
    return attrs['data-intro'] ?? null;
  };

  it('plays on every load of the home', () => {
    expect(run('/es/')).toBe('on');
    expect(run('/es/?utm_source=x')).toBe('on');
  });

  it('stays off for a link to a section, to the showroom, or when switched off', () => {
    expect(run('/es/#productos')).toBeNull();
    expect(run('/es/#precios')).toBeNull();
    expect(run('/es/?rubro=inmobiliarias')).toBeNull();
    expect(run('/es/?vista=entrada')).toBeNull();
    expect(run('/es/?intro=0')).toBeNull();
    expect(run('/es/', 'off')).toBeNull();
  });
});
