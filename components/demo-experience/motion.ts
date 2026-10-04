/**
 * Opening / closing of the "Ver demo" layer (WAAPI: transform, opacity and clip-path only,
 * nothing runs per frame in JS, so the layer stays usable while it reveals).
 *
 * Opening (~0.8 s), tied to the hero's eclipse: at the point of the click a small eclipse
 * appears (moon over a corona), the moon slides down-left, the diamond ring flashes at the
 * exposed limb and the light is born there — the layer is uncovered by a circle that grows
 * from that point (clip-path), with a warm glow riding ahead of its edge.
 * Closing (~0.42 s): the light collapses back into the control that opened it.
 * Reduced motion: a 140 ms fade (in) / 120 ms (out).
 */

const EXPO_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EXPO_IN = 'cubic-bezier(0.7, 0, 0.84, 0)';
const IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** Eclipse glyph size (px) and its geometry (must match .dx-ecl in demo-experience.css). */
const ECL = 64;
const SUN_R = ECL * 0.21;
/** Moon travel (fraction of its own size): down-left, like the hero's moon. */
const MOON_SHIFT = 0.34;

export interface LayerParts {
  panel: HTMLElement;
  ecl: HTMLElement | null;
  glow: HTMLElement | null;
}

const reach = (x: number, y: number) =>
  Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 4;

const circle = (r: number, x: number, y: number) => `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;

/** Where the light is born: the limb the moon uncovers (up-right of the point). */
export function limbPoint(point: { x: number; y: number }) {
  return { x: point.x + SUN_R * Math.SQRT1_2, y: point.y - SUN_R * Math.SQRT1_2 };
}

export function playOpening(parts: LayerParts, point: { x: number; y: number }, reduced: boolean): Animation[] {
  const { panel, ecl, glow } = parts;
  if (reduced) return [panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'ease-out' })];

  const origin = limbPoint(point);
  const R = reach(origin.x, origin.y);
  const anims: Animation[] = [];

  if (ecl) {
    ecl.style.left = `${point.x}px`;
    ecl.style.top = `${point.y}px`;
    anims.push(
      ecl.animate(
        [
          { opacity: 0, transform: 'translate(-50%, -50%) scale(0.55)' },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.22 },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.62 },
          { opacity: 0, transform: 'translate(-50%, -50%) scale(1.3)' },
        ],
        { duration: 760, easing: 'linear' },
      ),
    );
    const moon = ecl.querySelector<HTMLElement>('[data-dx-moon]');
    const diamond = ecl.querySelector<HTMLElement>('[data-dx-diamond]');
    const flare = ecl.querySelector<HTMLElement>('[data-dx-flare]');
    if (moon)
      anims.push(
        moon.animate(
          [{ transform: 'translate(0, 0)' }, { transform: `translate(${-MOON_SHIFT * 100}%, ${MOON_SHIFT * 100}%)` }],
          { duration: 300, delay: 60, easing: IN_OUT, fill: 'both' },
        ),
      );
    if (diamond)
      anims.push(
        diamond.animate(
          [
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.2)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.35 },
            { opacity: 0, transform: 'translate(-50%, -50%) scale(2.6)' },
          ],
          { duration: 440, delay: 230, easing: 'ease-out', fill: 'both' },
        ),
      );
    if (flare)
      anims.push(
        flare.animate(
          [
            { opacity: 0, transform: 'translate(-50%, -50%) scaleX(0.05)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scaleX(1)', offset: 0.35 },
            { opacity: 0, transform: 'translate(-50%, -50%) scaleX(1.5)' },
          ],
          { duration: 380, delay: 250, easing: 'ease-out', fill: 'both' },
        ),
      );
  }

  if (glow) {
    // A fixed-size radial disc, scaled (transform only) to just beyond the light's reach.
    const size = glow.offsetWidth || 640;
    glow.style.left = `${origin.x - size / 2}px`;
    glow.style.top = `${origin.y - size / 2}px`;
    const end = (R * 2.3) / size;
    anims.push(
      glow.animate(
        [
          { opacity: 0, transform: 'scale(0.04)' },
          { opacity: 1, transform: `scale(${end * 0.32})`, offset: 0.3 },
          { opacity: 0, transform: `scale(${end})` },
        ],
        { duration: 680, delay: 220, easing: EXPO_OUT, fill: 'both' },
      ),
    );
  }

  anims.push(
    panel.animate([{ clipPath: circle(SUN_R * 0.6, origin.x, origin.y) }, { clipPath: circle(R, origin.x, origin.y) }], {
      duration: 580,
      delay: 220,
      easing: EXPO_OUT,
      fill: 'backwards',
    }),
  );
  return anims;
}

/** The light collapses into `point` (the opener, back in place). Resolves when done. */
export function playClosing(parts: LayerParts, point: { x: number; y: number }, reduced: boolean): Animation[] {
  const { panel, glow } = parts;
  if (reduced) return [panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' })];
  const R = reach(point.x, point.y);
  const anims: Animation[] = [
    panel.animate([{ clipPath: circle(R, point.x, point.y) }, { clipPath: circle(0, point.x, point.y) }], {
      duration: 420,
      easing: EXPO_IN,
      fill: 'forwards',
    }),
  ];
  if (glow) {
    const size = glow.offsetWidth || 640;
    glow.style.left = `${point.x - size / 2}px`;
    glow.style.top = `${point.y - size / 2}px`;
    anims.push(
      glow.animate(
        [
          { opacity: 0, transform: 'scale(0.6)' },
          { opacity: 0.9, transform: 'scale(0.18)', offset: 0.75 },
          { opacity: 0, transform: 'scale(0.04)' },
        ],
        { duration: 440, easing: 'ease-in', fill: 'forwards' },
      ),
    );
  }
  return anims;
}
