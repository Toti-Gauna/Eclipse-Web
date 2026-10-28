'use client';

import { gsap } from '@/components/motion/gsap';
import { artEntrance } from '@/components/sections/products/artMotion';
import { startPlateLoop, walkLoop } from '@/components/sections/products/artIdle';
import { FILM_END, GOLPES, SCENE, ZOOM_STEP } from './score/jingle';
import { GEO, ORBIT_PRODUCTS, STAGE, TURN, onOrbit, productAngle, type Layout } from './geometry';

/**
 * Something that should keep moving only while its scene is on screen (a plate's loop, the end card's vamp):
 * IntroFilm starts it when the film's clock enters [from, to) and stops it when the clock leaves.
 */
export interface LoopWindow {
  from: number;
  to: number;
  start: () => () => void;
}

/** How long a scene change (the light sweeping the stage) takes, and how far before the downbeat it starts. */
const WIPE = 0.75;
const LEAD = 0.45;

/**
 * The film, as one paused GSAP timeline in seconds on the music's grid (score/jingle.ts: 120 BPM, a bar every 2 s).
 * IntroFilm moves its playhead from the film's clock (the music's when the sound is on), always forward.
 * Kinetic Studio method: everything on screen is built from the site's own pieces — the eclipse, the plates (drawn by
 * artEntrance, then alive with their loops), the products' copy and the catalog's prices — never a recording.
 * transform / opacity / clip-path only.
 */
export function buildIntro(root: HTMLElement, layout: Layout, format: (usd: number) => string): { tl: gsap.core.Timeline; loops: LoopWindow[] } {
  const q = gsap.utils.selector(root);
  const one = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const geo = GEO[layout];
  const { w: W, h: H } = STAGE[layout];
  const E = geo.eclipse;
  const place = (p: { x: number; y: number; d: number }) => ({ x: p.x - E / 2, y: p.y - E / 2, scale: p.d / E });
  const loops: LoopWindow[] = [];
  const plateLoop = (plate: Element, from: number, to: number) => loops.push({ from, to, start: () => startPlateLoop(plate) });

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out', duration: 0.8 } });
  const scene = (name: string) => one(`[data-scene="${name}"]`);
  const world = one('[data-world]');
  const wrap = one('[data-eclipse-wrap]');
  const moon = wrap?.querySelector('[data-eclipse-moon]') ?? null;
  const glow = wrap?.querySelector('[data-eclipse-glow]') ?? null;
  const glint = one('[data-glint]');
  const wipe = one('[data-wipe]');
  const ground = one('[data-ground]');
  const sceneNames = ['golpes', 'eco', 'panels', 'soon', 'units', 'plans', 'end'];
  gsap.set(sceneNames.map(scene).filter(Boolean), { autoAlpha: 0 });
  gsap.set([world, ground, wipe].filter(Boolean), { autoAlpha: 0 });

  /** A scene change: the next layer is uncovered right to left behind a line of light. */
  const sweepIn = (el: Element | null, at: number) => {
    if (!el) return;
    tl.set(el, { autoAlpha: 1 }, at)
      .fromTo(el, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: WIPE, ease: 'expo.inOut' }, at);
    if (wipe) tl.fromTo(wipe, { x: W, autoAlpha: 1 }, { x: 0, duration: WIPE, ease: 'expo.inOut' }, at).set(wipe, { autoAlpha: 0 }, at + WIPE);
  };
  const rise = (els: Element[] | Element | null, at: number, vars: gsap.TweenVars = {}, dy = 28) => {
    if (!els || (Array.isArray(els) && !els.length)) return;
    tl.fromTo(els, { y: dy, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ...vars }, at);
  };

  // ---- 0 · Ignition (0–4): the eclipse comes out of the loading screen, the wordmark rises, the diamond ring fires.
  const t0 = SCENE.ignite;
  if (wrap) {
    gsap.set(wrap, { ...place(geo.ignite), autoAlpha: 0 });
    tl.to(wrap, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, t0).fromTo(wrap, { scale: place(geo.ignite).scale * 0.86 }, { scale: place(geo.ignite).scale, duration: 2.4 }, t0);
  }
  if (moon) tl.fromTo(moon, { xPercent: -46 }, { xPercent: 0, duration: 1.5, ease: 'expo.inOut' }, t0);
  if (glint) {
    tl.fromTo(glint, { scale: 0, rotation: -30, opacity: 0 }, { scale: 1.3, rotation: 15, opacity: 1, duration: 0.35, ease: 'power3.out' }, t0 + 1.35).to(glint, { scale: 0, rotation: 45, opacity: 0, duration: 0.6, ease: 'power2.in' }, t0 + 1.7);
    // The glockenspiel's three notes (bar 2, beats 3–4).
    [3, 3.25, 3.5].forEach((s, i) =>
      tl.fromTo(glint, { scale: 0, opacity: 0 }, { scale: 0.55 + i * 0.25, opacity: 1, duration: 0.12, ease: 'power3.out', immediateRender: false }, t0 + s).to(glint, { scale: 0, opacity: 0, duration: 0.18 }, t0 + s + 0.12),
    );
  }
  tl.fromTo(q('[data-letter]'), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.07 }, t0 + 0.45);
  rise(one('[data-tagline]'), t0 + 1.3);
  tl.to([...q('[data-letter]'), one('[data-tagline]')], { yPercent: -60, opacity: 0, duration: 0.35, stagger: 0.02, ease: 'power2.in' }, SCENE.golpes - 0.45);
  tl.set(scene('ignite'), { autoAlpha: 0 }, SCENE.golpes + 0.1);
  // The eclipse flies to the ecosystem's core while the first word slams over it.
  if (wrap) tl.to(wrap, { ...place(geo.core), duration: 0.9, ease: 'expo.inOut' }, SCENE.golpes - 0.4);

  // ---- 1 · Golpes (4–8): one word per two beats, each on its own panel.
  const golpes = q('[data-golpe]');
  tl.set(scene('golpes'), { autoAlpha: 1 }, SCENE.golpes - 0.1);
  golpes.forEach((panel, i) => {
    const at = GOLPES[i] ?? SCENE.golpes + i;
    const word = panel.querySelector('.it-golpe-word');
    const n = panel.querySelector('.it-golpe-n');
    const mark = panel.querySelector('[data-golpe-mark]');
    // Past the stage's edges too (-2000px): a light panel must fill the letterbox, not sit in a box.
    tl.fromTo(panel, { clipPath: i % 2 ? `inset(${H + 2000}px -2000px -2000px -2000px)` : `inset(-2000px -2000px -2000px ${W + 2000}px)` }, { clipPath: 'inset(-2000px -2000px -2000px -2000px)', duration: 0.4 }, at - 0.08);
    if (word) tl.fromTo(word, { scale: 1.24, opacity: 0, yPercent: 10 }, { scale: 1, opacity: 1, yPercent: 0, duration: 0.55 }, at).to(word, { scale: 1.05, duration: 0.5, ease: 'none' }, at + 0.55);
    if (n) tl.fromTo(n, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45 }, at + 0.08);
    if (mark) tl.fromTo(mark, { scale: 0.6, rotation: -10, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: 'back.out(2.2)' }, at + 0.1);
  });
  // The last panel closes into the core: the ecosystem is behind it.
  const last = golpes[golpes.length - 1];
  const cx = ((geo.core.x / W) * 100).toFixed(1);
  const cy = ((geo.core.y / H) * 100).toFixed(1);
  if (last) {
    tl.set(golpes.slice(0, -1), { autoAlpha: 0 }, SCENE.eco - 0.35)
      .set(last, { clipPath: `circle(150% at ${cx}% ${cy}%)` }, SCENE.eco - 0.3)
      .to(last, { clipPath: `circle(0% at ${cx}% ${cy}%)`, duration: 0.65, ease: 'expo.in' }, SCENE.eco - 0.3);
  }
  tl.set(scene('golpes'), { autoAlpha: 0 }, SCENE.eco + 0.4);

  // ---- 2 · The ecosystem (8–12): two orbits around Eclipse, every node feeding the core; people on the street.
  const te = SCENE.eco;
  tl.set(world, { autoAlpha: 1 }, te - 0.35);
  tl.fromTo(q('[data-ring]'), { scale: 0.7, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: 1.2, stagger: 0.15 }, te - 0.2);
  tl.fromTo(q('[data-spoke]'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.7, stagger: 0.04 }, te);
  tl.fromTo(q('[data-node]'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.05 }, te + 0.15);
  const orbitP = one('[data-orbit="products"]');
  const orbitU = one('[data-orbit="units"]');
  const spin = (orbit: Element | null, turn: number) => {
    if (!orbit) return;
    tl.fromTo(orbit, { rotation: 0, transformOrigin: '0px 0px' }, { rotation: turn, duration: 4.4, ease: 'none' }, te - 0.4);
    tl.fromTo(orbit.querySelectorAll('[data-node]'), { rotation: 0 }, { rotation: -turn, duration: 4.4, ease: 'none' }, te - 0.4);
  };
  spin(orbitP, TURN.products);
  spin(orbitU, TURN.units);
  const packets = q('[data-packet]');
  if (packets.length)
    tl.fromTo(
      packets,
      { x: (_i: number, el: Element) => (el.parentElement as HTMLElement).offsetWidth, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power2.in', stagger: { each: 0.08, repeat: 2, repeatDelay: 0.25 } },
      te + 0.9,
    ).set(packets, { autoAlpha: 0 }, SCENE.zoom - 0.3);
  if (wrap && glow) tl.fromTo(glow, { scale: 1 }, { scale: 1.18, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 5, immediateRender: false }, te + 1.8);
  tl.set(scene('eco'), { autoAlpha: 1 }, te);
  rise(q('[data-scene="eco"] .it-title'), te + 0.15, {}, 40);
  rise(one('[data-eco-kicker]'), te + 0.5);
  const street = (from: number, to: number) => {
    if (!ground) return;
    tl.set(ground, { autoAlpha: 1 }, from);
    const span = to - from;
    q('[data-walker-move]').forEach((move, i) => {
      tl.add(walkLoop(move, { distance: W * (0.42 + i * 0.12), duration: span + 0.4 - i * 0.3, pause: 0 }).repeat(0), from + i * 0.3);
    });
    tl.to(ground, { autoAlpha: 0, duration: 0.3 }, to);
  };
  street(te, SCENE.zoom - 0.6);

  // ---- 3 · Zoom (12–24): the camera dives into Roofy, then each product gets its screen.
  const tz = SCENE.zoom;
  const target = onOrbit(geo.core, geo.orbit.products, productAngle(ORBIT_PRODUCTS.indexOf('roofy')), TURN.products);
  const Z = 6;
  if (world) tl.to(world, { scale: Z, transformOrigin: `${target.x}px ${target.y}px`, duration: 1, ease: 'expo.in' }, tz - 0.6).to(world, { autoAlpha: 0, duration: 0.3 }, tz + 0.15);
  if (wrap) {
    const c = place(geo.core);
    const center = { x: geo.core.x, y: geo.core.y };
    const far = { x: target.x + (center.x - target.x) * Z, y: target.y + (center.y - target.y) * Z };
    tl.to(wrap, { x: far.x - E / 2, y: far.y - E / 2, scale: c.scale * Z, duration: 1, ease: 'expo.in' }, tz - 0.6).set(wrap, { autoAlpha: 0 }, tz + 0.4);
  }
  tl.to(scene('eco'), { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, tz - 0.6);

  const panels = q('[data-panel]');
  tl.set(scene('panels'), { autoAlpha: 1 }, tz - 0.05);
  panels.forEach((panel, i) => {
    const at = tz + i * ZOOM_STEP;
    if (i === 0) tl.fromTo(panel, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(80% at 50% 50%)', duration: 0.9 }, at - 0.05);
    else {
      tl.fromTo(panel, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: WIPE, ease: 'expo.inOut' }, at - LEAD);
      if (wipe) tl.fromTo(wipe, { x: W, autoAlpha: 1 }, { x: 0, duration: WIPE, ease: 'expo.inOut' }, at - LEAD).set(wipe, { autoAlpha: 0 }, at - LEAD + WIPE);
      const prev = panels[i - 1];
      tl.to(prev.querySelectorAll('[data-plate], .it-copy'), { xPercent: -8, duration: WIPE, ease: 'expo.inOut' }, at - LEAD);
    }
    const plate = panel.querySelector('[data-plate]');
    if (plate) {
      tl.add(artEntrance(plate, { duration: 1 }).paused(false), at + 0.05);
      tl.fromTo(plate, { scale: 0.95 }, { scale: 1.04, duration: ZOOM_STEP + 0.6, ease: 'none' }, at);
      plateLoop(plate, at + 1.2, at + ZOOM_STEP + 0.4);
    }
    const name = panel.querySelector('[data-name]');
    if (name) tl.fromTo(name, { yPercent: 50, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8 }, at + 0.1);
    rise(Array.from(panel.querySelectorAll('[data-copy-in]')), at + 0.2, { stagger: 0.12 });
    const points = Array.from(panel.querySelectorAll('[data-point]'));
    if (points.length) {
      tl.fromTo(points, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.15 }, at + 0.7);
      tl.fromTo(
        panel.querySelectorAll('[data-point-icon]'),
        { scale: 0.4, rotation: -25 },
        { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.6)', stagger: 0.15 },
        at + 0.7,
      );
    }
  });

  // ---- 4 · Coming soon (24–28): four cards land on the beat.
  const ts = SCENE.soon;
  sweepIn(scene('soon'), ts - LEAD);
  tl.set(scene('panels'), { autoAlpha: 0 }, ts + 0.5);
  rise(q('[data-scene="soon"] .it-title'), ts + 0.05, {}, 40);
  q('[data-soon-card]').forEach((card, i) => {
    const at = ts + 0.25 + i * 0.5;
    tl.fromTo(card, { y: 70, opacity: 0, rotation: [-3, 2, -2, 3][i] ?? 0 }, { y: 0, opacity: 1, rotation: 0, duration: 0.8 }, at);
    const plate = card.querySelector('[data-plate]');
    if (plate) {
      tl.add(artEntrance(plate, { duration: 0.8 }).paused(false), at + 0.05);
      plateLoop(plate, at + 0.9, SCENE.units + 0.4);
    }
    const pill = card.querySelector('.it-soon-pill');
    if (pill) tl.fromTo(pill, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.6)' }, at + 0.45);
  });

  // ---- 5 · The units (28–32): Media, Academy, Intelligence, Agency and Equipamiento on one bus.
  const tu = SCENE.units;
  sweepIn(scene('units'), tu - LEAD);
  tl.set(scene('soon'), { autoAlpha: 0 }, tu + 0.5);
  rise(q('[data-scene="units"] .it-title'), tu + 0.05, {}, 40);
  q('[data-unit]').forEach((unit, i) => {
    const at = tu + 0.2 + i * 0.3;
    tl.fromTo(unit, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, at);
    const plate = unit.querySelector('[data-plate]');
    if (plate) {
      tl.add(artEntrance(plate, { duration: 0.9 }).paused(false), at + 0.05);
      plateLoop(plate, at + 1, SCENE.plans + 0.4);
    }
  });
  const bus = one('[data-bus]');
  if (bus) {
    tl.fromTo(
      bus,
      layout === 'land' ? { scaleX: 0, transformOrigin: '0% 50%' } : { scaleY: 0, transformOrigin: '50% 0%' },
      layout === 'land' ? { scaleX: 1, duration: 1.2, ease: 'expo.inOut' } : { scaleY: 1, duration: 1.2, ease: 'expo.inOut' },
      tu + 0.5,
    );
    // The bus runs across the units on a wide stage, down their column on the portrait one.
    const along = layout === 'land' ? 'x' : 'y';
    tl.fromTo(
      q('[data-bus-packet]'),
      { x: 0, y: 0, autoAlpha: 0 },
      { [along]: () => (layout === 'land' ? bus.offsetWidth : bus.offsetHeight), autoAlpha: 1, duration: 1.4, ease: 'none', stagger: 0.7, repeat: 1 },
      tu + 1.4,
    );
  }
  street(tu, SCENE.plans - 0.5);

  // ---- 6 · The plans (32–38): the ladder rises, each price rolls up in the visitor's currency.
  const tp = SCENE.plans;
  sweepIn(scene('plans'), tp - LEAD);
  tl.set(scene('units'), { autoAlpha: 0 }, tp + 0.5);
  rise(q('[data-scene="plans"] .it-title'), tp + 0.05, {}, 40);
  q('[data-plan]').forEach((plan, i) => {
    const at = tp + 0.3 + i * 0.22;
    tl.fromTo(plan, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, at);
    const bar = plan.querySelector('[data-plan-bar]');
    // A column rising on a wide stage, a bar filling from the left on the portrait one.
    if (bar)
      tl.fromTo(
        bar,
        layout === 'land' ? { scaleY: 0, transformOrigin: '50% 100%' } : { scaleX: 0, transformOrigin: '0% 50%' },
        layout === 'land' ? { scaleY: 1, duration: 1.1 } : { scaleX: 1, duration: 1.1 },
        at + 0.1,
      );
    const price = plan.querySelector<HTMLElement>('[data-price]');
    const usd = Number(price?.dataset.usd);
    if (price && Number.isFinite(usd)) {
      const reading = { v: 0 };
      tl.fromTo(
        reading,
        { v: 0 },
        {
          v: usd,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: () => {
            price.textContent = format(Math.round(reading.v));
          },
          onComplete: () => {
            price.textContent = format(usd);
          },
        },
        at + 0.1,
      );
    }
  });
  const barGlows = q('[data-bar-glow]');
  if (barGlows.length) tl.fromTo(barGlows, { opacity: 0 }, { opacity: 1, duration: 0.3, yoyo: true, repeat: 1, stagger: 0.18, ease: 'power2.out' }, tp + 3.2);
  rise(one('[data-plans-note]'), tp + 2.1);

  // ---- 7 · The end card (38–40): the moon leaves the sun — «a plena luz» — and «Activar Eclipse».
  const tn = SCENE.end;
  tl.to(scene('plans'), { autoAlpha: 0, scale: 0.94, duration: 0.6, ease: 'power2.in' }, tn - 0.6);
  if (wrap) {
    tl.set(wrap, { ...place(geo.end), autoAlpha: 0 }, tn - 0.7);
    tl.fromTo(wrap, { autoAlpha: 0, scale: place(geo.end).scale * 0.55 }, { autoAlpha: 1, scale: place(geo.end).scale, duration: 1.4, immediateRender: false }, tn - 0.4);
  }
  if (moon) tl.fromTo(moon, { xPercent: 0, opacity: 1 }, { xPercent: 125, opacity: 0, duration: 1.6, ease: 'expo.inOut', immediateRender: false }, tn);
  if (glow) tl.fromTo(glow, { scale: 1 }, { scale: 1.3, duration: 1.4, immediateRender: false }, tn + 0.3);
  if (glint) tl.fromTo(glint, { scale: 0, opacity: 0, rotation: 0 }, { scale: 1.6, opacity: 1, rotation: 30, duration: 0.3, ease: 'power3.out', immediateRender: false }, tn + 0.9).to(glint, { scale: 0, opacity: 0, rotation: 60, duration: 0.7 }, tn + 1.2);
  tl.set(scene('end'), { autoAlpha: 1 }, tn - 0.2);
  const title = one('[data-end-title]');
  if (title) tl.fromTo(title, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9 }, tn + 0.1);
  const cta = one('[data-end-cta]');
  if (cta) tl.fromTo(cta, { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2)' }, tn + 0.6);
  rise(one('[data-end-hint]'), tn + 1);
  tl.to({}, { duration: 0.01 }, FILM_END);
  // The vamp: the end card keeps breathing until «Activar Eclipse» (CSS, on screen only while the film is open).
  loops.push({
    from: tn + 1.4,
    to: Number.POSITIVE_INFINITY,
    start: () => {
      root.dataset.vamp = '';
      return () => {
        delete root.dataset.vamp;
      };
    },
  });

  return { tl, loops };
}
