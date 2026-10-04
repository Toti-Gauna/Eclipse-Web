/**
 * Shared eclipse geometry (must match hero.css: the disc is 42% of the square).
 * Offsets are expressed in disc radii; screen axes (+x right, +y down).
 */
export const DISC = 0.42;
export const DISC_RADIUS = DISC / 2;

/** The moon always slides down-left (toward the copy on desktop). */
export const MOON_DIR = { x: -Math.SQRT1_2, y: Math.SQRT1_2 } as const;

/** Moon travel at the end of the pinned scroll (third contact: a thin crescent). */
export const SCROLL_MOON = 0.16;
