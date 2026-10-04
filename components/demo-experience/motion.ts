/**
 * Opening / closing of the "Ver demo" layer (WAAPI: transform, opacity and clip-path only;
 * nothing runs per frame in JS).
 *
 * Opening (~2.4 s, "el momento estrella", the hero's reveal brought to the whole screen):
 * 1. the page goes dark (the void) and THE eclipse takes the center of the screen, as big as
 *    the hero's — opened from the hero, the hero's own eclipse glides there;
 * 2. the moon slides down-left; at the limb it uncovers, the diamond ring fires (a point and
 *    a horizontal flare);
 * 3. the light is born there and floods the screen (a circle that grows, clip-path), a warm
 *    halo riding its edge, the diamond blooming into glare;
 * 4. the layer's content rises inside the light.
 * A click or a key during the opening skips to the end (`finishAll`).
 * Closing (~1.15–1.4 s): the content fades, the light collapses back into the eclipse, the
 * moon covers the sun again and the void lifts off the page (which never moved); opened from
 * the hero, the eclipse glides back into the hero's.
 * Reduced motion: a 140 ms fade (in) / 120 ms (out); no eclipse.
 */
import { LIMB_POINT, MOON_DIR } from '@/components/hero/geometry';

const EXPO_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EXPO_IN_OUT = 'cubic-bezier(0.87, 0, 0.13, 1)';
const IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const POWER_IN = 'cubic-bezier(0.55, 0, 1, 0.45)';

/** Moon travel when the diamond ring fires, in disc radii (the hero's second contact). */
const MOON_TRAVEL = 0.2;
/** The moon element is a hair bigger than the disc (hero.css): % of its size per disc radius. */
const MOON_PCT_PER_RADIUS = 50 * (0.42 / 0.428);
/** Halo radius / light radius: the soft ring that runs just outside the light's edge. */
const HALO = 1.35;

/** Opening timeline (ms). */
export const OPEN = {
  void: 320,
  eclipseIn: 560,
  moonAt: 380,
  moon: 620,
  diamondAt: 720,
  flareAt: 780,
  lightAt: 1080,
  light: 1150,
  riseAt: 1700,
  rise: 900,
} as const;

export interface LayerParts {
  panel: HTMLElement;
  void: HTMLElement | null;
  /** The centered eclipse (its square; `.eclipse` inside). */
  stage: HTMLElement | null;
  halo: HTMLElement | null;
  /** The layer's content blocks that rise into the light (header, body). */
  items: HTMLElement[];
}

const circle = (r: number, x: number, y: number) => `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;

const heroEclipse = () => document.querySelector<HTMLElement>('#inicio [data-hero-stage] [data-eclipse]');

/** Where the hero's eclipse is (its square), when it's on screen. */
function heroEclipseRect(): DOMRect | null {
  const el = heroEclipse();
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight ? r : null;
}

/** The hero eclipse's size (px, untransformed), so the centered one matches it exactly. */
export function heroEclipseSize(): number | null {
  return heroEclipse()?.offsetWidth || null;
}

/**
 * While the layer's eclipse stands in for the hero's (it left from there and goes back
 * there), the hero's own is hidden, so there's only ever one. `false` shows it again.
 */
export function holdHeroEclipse(on: boolean) {
  const el = heroEclipse();
  if (el) el.style.visibility = on ? 'hidden' : '';
}

/** Geometry of the centered eclipse: its center, size and the limb where the light is born. */
export function eclipseGeometry(stage: HTMLElement | null) {
  const size = stage?.offsetWidth || Math.min(window.innerWidth * 0.4, 620);
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  return {
    size,
    cx,
    cy,
    limb: { x: cx + (LIMB_POINT.x - 0.5) * size, y: cy + (LIMB_POINT.y - 0.5) * size },
  };
}

const reach = (x: number, y: number) =>
  Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 8;

const part = (stage: HTMLElement | null, sel: string) => stage?.querySelector<HTMLElement>(sel) ?? null;

export function playOpening(parts: LayerParts, opts: { reduced: boolean; fromHero: boolean }): Animation[] {
  const { panel, stage, halo, items } = parts;
  const voidEl = parts.void;
  if (opts.reduced) return [panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'ease-out' })];

  const g = eclipseGeometry(stage);
  const R = reach(g.limb.x, g.limb.y);
  const r0 = g.size * 0.05;
  const anims: Animation[] = [];
  const add = (el: HTMLElement | null, frames: Keyframe[], o: KeyframeAnimationOptions) => {
    if (el) anims.push(el.animate(frames, o));
  };

  // 1 · the void, and the eclipse takes the center.
  // (Both hidden at rest, see demo-experience.css: they only exist while a fill holds them.)
  add(voidEl, [{ opacity: 0 }, { opacity: 1 }], { duration: OPEN.void, easing: 'ease-out', fill: 'both' });
  if (stage) {
    const from = opts.fromHero ? heroEclipseRect() : null;
    if (from) holdHeroEclipse(true);
    const start = from
      ? `translate(${(from.left + from.width / 2 - g.cx).toFixed(1)}px, ${(from.top + from.height / 2 - g.cy).toFixed(1)}px) scale(${(from.width / g.size).toFixed(3)})`
      : 'scale(0.86)';
    anims.push(
      stage.animate(
        [
          { opacity: from ? 1 : 0, transform: start },
          { opacity: 1, transform: 'none' },
        ],
        { duration: OPEN.eclipseIn, delay: from ? 0 : 80, easing: EXPO_OUT, fill: 'both' },
      ),
    );
  }

  // 2 · the moon slides; the diamond ring fires at the uncovered limb.
  const moonTo = MOON_TRAVEL * MOON_PCT_PER_RADIUS;
  add(
    part(stage, '[data-eclipse-moon]'),
    [{ transform: 'translate(0, 0)' }, { transform: `translate(${MOON_DIR.x * moonTo}%, ${MOON_DIR.y * moonTo}%)` }],
    { duration: OPEN.moon, delay: OPEN.moonAt, easing: IN_OUT, fill: 'both' },
  );
  const core = part(stage, '[data-dx-core]');
  add(
    core,
    [
      { opacity: 0, transform: 'scale(0.15)' },
      { opacity: 1, transform: 'scale(1)', offset: (OPEN.lightAt - OPEN.diamondAt) / 1160 },
      { opacity: 1, transform: 'scale(4.5)', offset: (OPEN.lightAt - OPEN.diamondAt + 300) / 1160 },
      { opacity: 0, transform: 'scale(4.5)' },
    ],
    { duration: 1160, delay: OPEN.diamondAt, easing: 'ease-out', fill: 'both' },
  );
  add(
    part(stage, '[data-dx-flare]'),
    [
      { opacity: 0, transform: 'scaleX(0.04)' },
      { opacity: 1, transform: 'scaleX(1)', offset: 0.4 },
      { opacity: 0, transform: 'scaleX(1.4)' },
    ],
    { duration: 400, delay: OPEN.flareAt, easing: 'ease-out', fill: 'both' },
  );

  // 3 · the light floods the screen from the diamond, a halo riding its edge.
  panel.style.setProperty('--dx-x', `${g.limb.x}px`);
  panel.style.setProperty('--dx-y', `${g.limb.y}px`);
  anims.push(
    // From nothing: before the light starts, the panel isn't there at all.
    panel.animate([{ clipPath: circle(0, g.limb.x, g.limb.y) }, { clipPath: circle(R, g.limb.x, g.limb.y) }], {
      duration: OPEN.light,
      delay: OPEN.lightAt,
      easing: EXPO_IN_OUT,
      fill: 'backwards',
    }),
  );
  if (halo) {
    const size = R * HALO * 2;
    Object.assign(halo.style, { width: `${size}px`, height: `${size}px`, left: `${g.limb.x - size / 2}px`, top: `${g.limb.y - size / 2}px` });
    anims.push(
      halo.animate(
        [
          { opacity: 1, transform: `scale(${(r0 / R).toFixed(4)})` },
          { opacity: 1, transform: 'scale(1)', offset: 0.72 },
          { opacity: 0, transform: 'scale(1)' },
        ],
        // No backwards fill: before the light starts it isn't there.
        { duration: OPEN.light * 1.38, delay: OPEN.lightAt, easing: EXPO_IN_OUT },
      ),
    );
  }

  // 4 · the content rises inside the light.
  items.forEach((el, i) =>
    anims.push(
      el.animate(
        [
          { opacity: 0, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: OPEN.rise, delay: OPEN.riseAt + i * 70, easing: EXPO_OUT, fill: 'backwards' },
      ),
    ),
  );
  return anims;
}

/** Moments of the opening worth a sound cue (ms from the start). */
export const OPEN_CUES = { glint: OPEN.diamondAt, whoosh: OPEN.lightAt } as const;

/** The light collapses back into the eclipse, the moon covers it, the void lifts. */
export function playClosing(parts: LayerParts, opts: { reduced: boolean; toHero: boolean }): Animation[] {
  const reduced = opts.reduced;
  const { panel, stage, halo, items } = parts;
  const voidEl = parts.void;
  if (reduced) return [panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' })];
  const g = eclipseGeometry(stage);
  const R = reach(g.limb.x, g.limb.y);
  const r0 = g.size * 0.05;
  const anims: Animation[] = [];
  const add = (el: HTMLElement | null, frames: Keyframe[], o: KeyframeAnimationOptions) => {
    if (el) anims.push(el.animate(frames, o));
  };
  const moonTo = MOON_TRAVEL * MOON_PCT_PER_RADIUS;
  const moonOff = `translate(${MOON_DIR.x * moonTo}%, ${MOON_DIR.y * moonTo}%)`;

  items.forEach((el) =>
    anims.push(el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(10px)' }], { duration: 220, easing: POWER_IN, fill: 'forwards' })),
  );
  anims.push(
    panel.animate([{ clipPath: circle(R, g.limb.x, g.limb.y) }, { clipPath: circle(0, g.limb.x, g.limb.y) }], {
      duration: 720,
      delay: 120,
      easing: EXPO_IN_OUT,
      fill: 'forwards',
    }),
  );
  if (halo) {
    const size = R * HALO * 2;
    Object.assign(halo.style, { width: `${size}px`, height: `${size}px`, left: `${g.limb.x - size / 2}px`, top: `${g.limb.y - size / 2}px` });
    add(
      halo,
      [
        { opacity: 0, transform: 'scale(1)' },
        { opacity: 1, transform: 'scale(1)', offset: 0.2 },
        { opacity: 1, transform: `scale(${(r0 / R).toFixed(4)})`, offset: 0.9 },
        { opacity: 0, transform: `scale(${(r0 / R).toFixed(4)})` },
      ],
      { duration: 800, delay: 120, easing: EXPO_IN_OUT, fill: 'forwards' },
    );
  }
  // Behind the light: the eclipse, its diamond still burning, then the moon closes it.
  add(
    part(stage, '[data-dx-core]'),
    [
      { opacity: 0, transform: 'scale(3)' },
      { opacity: 1, transform: 'scale(1)', offset: 0.45 },
      { opacity: 0, transform: 'scale(0.3)' },
    ],
    { duration: 640, delay: 460, easing: 'ease-in-out', fill: 'both' },
  );
  add(part(stage, '[data-eclipse-moon]'), [{ transform: moonOff }, { transform: 'translate(0, 0)' }], {
    duration: 420,
    delay: 640,
    easing: IN_OUT,
    fill: 'both',
  });
  // Back where it came from (the hero's eclipse, still in place: the page never scrolled), or
  // it simply fades. Either way it ends invisible or exactly over the hero's.
  const to = opts.toHero ? heroEclipseRect() : null;
  if (to)
    add(
      stage,
      [
        { opacity: 1, transform: 'none' },
        {
          opacity: 1,
          transform: `translate(${(to.left + to.width / 2 - g.cx).toFixed(1)}px, ${(to.top + to.height / 2 - g.cy).toFixed(1)}px) scale(${(to.width / g.size).toFixed(3)})`,
        },
      ],
      { duration: 520, delay: 900, easing: EXPO_IN_OUT, fill: 'both' },
    );
  else add(stage, [{ opacity: 1 }, { opacity: 0, transform: 'scale(0.94)' }], { duration: 300, delay: 860, easing: 'ease-in', fill: 'both' });
  add(voidEl, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 860, easing: 'ease-in', fill: 'both' });
  return anims;
}
