import type { ProductId } from '@/lib/content';
import type { UnitId } from '@/components/layout/navLinks';

/**
 * The film is drawn on a fixed stage, scaled to fit the screen (IntroFilm): 1600 × 900 on landscape screens and
 * 540 × 1080 on phones and portrait tablets, each with its own composition (not a squeezed desktop). Every number here
 * is in stage units; the markup and the timeline read the same ones, so the camera always lands on what it aims at.
 */
export type Layout = 'land' | 'port';

export const STAGE: Record<Layout, { w: number; h: number }> = {
  land: { w: 1600, h: 900 },
  port: { w: 540, h: 1080 },
};

/** Screens narrower than this (width / height) get the portrait stage. */
export const PORTRAIT_BELOW = 0.85;

export const layoutFor = (w: number, h: number): Layout => (w / h < PORTRAIT_BELOW ? 'port' : 'land');

export interface Point {
  x: number;
  y: number;
}

export interface Geo {
  /** The eclipse's box at full size (ignition) and where it sits in each scene (centre + diameter). */
  eclipse: number;
  ignite: Point & { d: number };
  core: Point & { d: number };
  end: Point & { d: number };
  /** The ecosystem: the products' orbit and the units' orbit. */
  orbit: { products: number; units: number; node: number };
  /** Where the ground line runs (the walkers' street). */
  ground: number;
}

export const GEO: Record<Layout, Geo> = {
  land: {
    eclipse: 340,
    ignite: { x: 800, y: 372, d: 340 },
    core: { x: 980, y: 470, d: 150 },
    end: { x: 800, y: 300, d: 300 },
    orbit: { products: 215, units: 345, node: 64 },
    ground: 846,
  },
  port: {
    eclipse: 300,
    ignite: { x: 270, y: 420, d: 300 },
    core: { x: 270, y: 640, d: 110 },
    end: { x: 270, y: 330, d: 250 },
    orbit: { products: 135, units: 228, node: 48 },
    ground: 1030,
  },
};

/** The product orbit's order (clockwise from the top) and the units' (the four units, then Equipamiento). */
export const ORBIT_PRODUCTS: ProductId[] = ['roofy', 'foody', 'markyt', 'handy', 'gym', 'dental', 'clinic', 'vet'];
export type OrbitUnit = UnitId | 'equipment';
export const ORBIT_UNITS: OrbitUnit[] = ['media', 'academy', 'intelligence', 'agency', 'equipment'];

/** How far each orbit turns while the ecosystem is on screen (deg). */
export const TURN = { products: 34, units: -22 };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** A node's angle on its orbit at rest (deg, 0 = right, clockwise). */
export const productAngle = (i: number) => -90 + i * (360 / ORBIT_PRODUCTS.length);
export const unitAngle = (i: number) => -90 + 36 + i * (360 / ORBIT_UNITS.length);

/** Where a point of an orbit is once the orbit has turned `turn` degrees. */
export function onOrbit(center: Point, r: number, angle: number, turn = 0): Point {
  const a = rad(angle + turn);
  return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) };
}
