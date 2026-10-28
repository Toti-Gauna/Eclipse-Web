'use client';

import { gsap } from '@/components/motion/gsap';
import { whileVisible } from '@/components/motion/idle';
import { artEntrance } from './artMotion';

/**
 * What every plate keeps doing once it is drawn (decision of Ignacio, 28/10/2026: «todo en
 * movimiento, cada uno por área»). Each plate tells its own small story on a loop, in the same
 * minimal language — hairlines, one amber light — and only with transform / opacity:
 *
 * - Roofy: a visitor walks up to the agency's door, smoke leaves the chimney, the lead travels from
 *   the lit window to the card and fills its bar, the visit pulses in the calendar.
 * - Foody: the cloche lifts off the plate and the steam rises; the QR menu is scanned.
 * - Markyt: the tag swings, the order travels to the box and the check pops; the variant changes.
 * - Handy: the specialist walks to the house with his toolbox, the pin bobs and pings its zone.
 * - Gimnasios: the barbell goes up, the streak ring turns, the class moves in the grid.
 * - DentalOS: the check-up travels to its new slot, the WhatsApp message pops, the tooth shines.
 * - Clínicas: the pulse runs along the line, the bell rings and the reminder reaches the agenda.
 * - VetOS: the paw prints walk to the home visit, the owner's call reaches the patient.
 * Plus the six Media frames, the Equipment parts (the exploded kit floats) and the unit emblems.
 *
 * Loops are built paused and only play on screen (`whileVisible`); callers never build them under
 * reduced motion. The plate's markup stays the finished, still drawing.
 */

type Q = (selector: string) => Element[];

const glowLoop = (q: Q) => {
  const glows = q('[data-i="glow"]');
  if (!glows.length) return null;
  return gsap.fromTo(
    glows,
    { opacity: 0.08, scale: 0.94, transformOrigin: '50% 50%' },
    { opacity: 0.26, scale: 1.12, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 },
  );
};

/** A traveller (`.pd-mover`) that fades in, runs along `path` and fades out at the end. */
function travel(tl: gsap.core.Timeline, mover: Element | undefined, path: Element | string | undefined, at: number, duration: number, ease = 'power1.inOut') {
  if (!mover || !path) return;
  tl.set(mover, { opacity: 0 }, at)
    .to(mover, { opacity: 1, duration: 0.25, ease: 'power1.out' }, at)
    .to(mover, { motionPath: { path: path as SVGPathElement }, duration, ease }, at)
    .to(mover, { opacity: 0, duration: 0.3, ease: 'power1.in' }, at + duration - 0.15);
}

/**
 * A walker's cycle (Walker.tsx): appears, walks `distance` units along the ground swinging legs and
 * arms, bobbing, fades out at its destination and starts again after `pause`.
 */
export function walkLoop(move: Element, { distance, duration, pause = 1.4, step = 0.42 }: { distance: number; duration: number; pause?: number; step?: number }): gsap.core.Timeline {
  const q = gsap.utils.selector(move);
  const tl = gsap.timeline({ repeat: -1, repeatDelay: pause });
  const steps = Math.max(2, Math.round(duration / step));
  const [legA, legB] = q('[data-walker-leg]');
  const [armA, armB] = q('[data-walker-arm]');
  const body = q('[data-walker-body]');
  tl.set(move, { x: 0, opacity: 0 }, 0)
    .to(move, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0)
    .to(move, { x: distance, duration, ease: 'none' }, 0)
    .to(move, { opacity: 0, duration: 0.45, ease: 'power1.in' }, duration - 0.4);
  const swing = (el: Element | undefined, origin: string, from: number) => {
    if (!el) return;
    tl.fromTo(el, { rotation: from, transformOrigin: origin }, { rotation: -from, duration: duration / steps, ease: 'sine.inOut', repeat: steps - 1, yoyo: true }, 0);
  };
  swing(legA, '100% 0%', 22);
  swing(legB, '0% 0%', -22);
  swing(armA, '100% 0%', -18);
  swing(armB, '0% 0%', 18);
  if (body.length) tl.fromTo(body, { y: 0 }, { y: -1.6, duration: duration / steps / 2, ease: 'sine.inOut', repeat: steps * 2 - 1, yoyo: true }, 0);
  return tl;
}

// ---- Products ----------------------------------------------------------------

const PRODUCT_LOOPS: Record<string, (q: Q, master: gsap.core.Timeline) => void> = {
  roofy(q, m) {
    const [visitor] = q('[data-i="visitor"]');
    if (visitor) m.add(walkLoop(visitor, { distance: 150, duration: 4.4, pause: 1.8 }), 0);
    q('[data-i="smoke"]').forEach((puff, i) => {
      const p = gsap.timeline({ repeat: -1, delay: i * 0.8 });
      p.set(puff, { opacity: 0 }, 0)
        .fromTo(puff, { y: 0, x: 0, scale: 0.6, transformOrigin: '50% 50%' }, { y: -38, x: (i - 1) * 7, scale: 1.6, duration: 2.4, ease: 'sine.out' }, 0)
        .to(puff, { opacity: 0.9, duration: 0.5, ease: 'power1.out' }, 0)
        .to(puff, { opacity: 0, duration: 1.5, ease: 'power1.in' }, 0.9);
      m.add(p, 0);
    });
    const lead = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
    const [dot] = q('[data-i="lead"]');
    const [path] = q('[data-i="lead-path"]');
    const [bar] = q('[data-i="bar"]');
    travel(lead, dot, path, 0, 1.7);
    if (bar) lead.fromTo(bar, { scaleX: 0.3, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 1.1, ease: 'expo.out' }, 1.6).to(bar, { scaleX: 0.3, duration: 0.7, ease: 'power2.inOut' }, 3.6);
    m.add(lead, 0.6);
    const [ring] = q('[data-i="ring"]');
    if (ring) m.add(gsap.fromTo(ring, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.45, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
  },
  foody(q, m) {
    const [cloche] = q('[data-i="cloche"]');
    const steam = q('[data-i="steam"]');
    const t = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    if (cloche) t.to(cloche, { y: -34, duration: 1.2, ease: 'expo.inOut' }, 0.4).to(cloche, { y: 0, duration: 1.1, ease: 'expo.inOut' }, 3.6);
    if (steam.length)
      t.fromTo(steam, { y: 8, opacity: 0 }, { y: -10, opacity: 1, duration: 1.1, stagger: 0.18, ease: 'sine.out' }, 1.0).to(steam, { y: -22, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'sine.in' }, 2.7);
    m.add(t, 0);
    const [scan] = q('[data-i="scan"]');
    if (scan) {
      const s = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
      s.set(scan, { opacity: 0, y: 0 }, 0).to(scan, { opacity: 0.8, duration: 0.2 }, 0).to(scan, { y: 56, duration: 1.6, ease: 'sine.inOut' }, 0).to(scan, { opacity: 0, duration: 0.3 }, 1.4);
      m.add(s, 1.2);
    }
  },
  markyt(q, m) {
    const [tag] = q('[data-i="tag"]');
    if (tag) m.add(gsap.fromTo(tag, { rotation: -5, svgOrigin: '272 146' }, { rotation: 5, duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
    const t = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
    const [parcel] = q('[data-i="parcel"]');
    const [route] = q('[data-i="route"]');
    const [check] = q('[data-i="check"]');
    travel(t, parcel, route, 0, 1.3);
    if (check) t.fromTo(check, { scale: 0.7, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.7, ease: 'back.out(3)' }, 1.2);
    m.add(t, 0.4);
    const [variant] = q('[data-i="variant"]');
    if (variant) {
      const v = gsap.timeline({ repeat: -1 });
      v.to(variant, { x: -24, duration: 0.6, ease: 'expo.inOut' }, 1.4).to(variant, { x: -12, duration: 0.6, ease: 'expo.inOut' }, 2.9).to(variant, { x: 0, duration: 0.6, ease: 'expo.inOut' }, 4.4).to({}, { duration: 1 });
      m.add(v, 0);
    }
  },
  handy(q, m) {
    const [specialist] = q('[data-i="specialist"]');
    if (specialist) m.add(walkLoop(specialist, { distance: 114, duration: 3.8, pause: 2 }), 0);
    const [pin] = q('[data-i="pin"]');
    if (pin) m.add(gsap.to(pin, { y: -8, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
    const [ping] = q('[data-i="ping"]');
    if (ping) m.add(gsap.fromTo(ping, { scale: 1, opacity: 0.85, transformOrigin: '50% 50%' }, { scale: 3.6, opacity: 0, duration: 2.6, ease: 'power2.out', repeat: -1, repeatDelay: 0.5 }), 0.3);
    const [zone] = q('[data-i="zone"]');
    if (zone) m.add(gsap.to(zone, { rotation: 360, svgOrigin: '300 214', duration: 48, ease: 'none', repeat: -1 }), 0);
    const [bolt] = q('[data-i="bolt"]');
    if (bolt) {
      const b = gsap.timeline({ repeat: -1, repeatDelay: 2.4 });
      b.to(bolt, { opacity: 0.15, duration: 0.07 }).to(bolt, { opacity: 1, duration: 0.07 }).to(bolt, { opacity: 0.3, duration: 0.06 }).to(bolt, { opacity: 1, duration: 0.12 });
      m.add(b, 1);
    }
    const [wrench] = q('[data-i="wrench"]');
    if (wrench) m.add(gsap.fromTo(wrench, { rotation: -14, svgOrigin: '228 150' }, { rotation: 14, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
    const [waves] = q('[data-i="waves"]');
    if (waves) m.add(gsap.fromTo(waves, { x: -4 }, { x: 4, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
  },
  gym(q, m) {
    const [barbell] = q('[data-i="barbell"]');
    if (barbell) {
      const b = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
      b.to(barbell, { y: -18, duration: 0.8, ease: 'power3.out' }).to(barbell, { y: -15, duration: 0.7, ease: 'sine.inOut' }).to(barbell, { y: 1.5, duration: 0.55, ease: 'power2.in' }).to(barbell, { y: 0, duration: 0.25, ease: 'power2.out' });
      m.add(b, 0.3);
    }
    const [spin] = q('[data-i="spin"]');
    if (spin) m.add(gsap.to(spin, { rotation: 360, svgOrigin: '170 150', duration: 30, ease: 'none', repeat: -1 }), 0);
    const [cell] = q('[data-i="cell"]');
    if (cell) {
      const c = gsap.timeline({ repeat: -1 });
      c.to(cell, { x: 34, duration: 0.55, ease: 'expo.inOut' }, 1.2)
        .to(cell, { y: 24, duration: 0.55, ease: 'expo.inOut' }, 2.5)
        .to(cell, { x: -34, duration: 0.7, ease: 'expo.inOut' }, 3.8)
        .to(cell, { x: 0, y: 0, duration: 0.6, ease: 'expo.inOut' }, 5.1)
        .to({}, { duration: 0.8 });
      m.add(c, 0);
    }
  },
  dental(q, m) {
    const t = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
    const [mover] = q('[data-i="mover"]');
    const [path] = q('[data-i="move-path"]');
    const [slot] = q('[data-i="slot"]');
    travel(t, mover, path, 0, 1.4);
    if (slot) t.fromTo(slot, { scale: 0.6, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, 1.3);
    const [bubble] = q('[data-i="bubble"]');
    if (bubble) t.fromTo(bubble, { scale: 0.9, transformOrigin: '20% 100%' }, { scale: 1, duration: 0.6, ease: 'back.out(2.6)' }, 2.1);
    m.add(t, 0.3);
    const [sparkle] = q('[data-i="sparkle"]');
    if (sparkle) {
      const s = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
      s.fromTo(sparkle, { opacity: 0, scale: 0.3, rotation: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, rotation: 45, duration: 0.5, ease: 'back.out(2)' }).to(sparkle, { opacity: 0, scale: 0.4, rotation: 90, duration: 0.6, ease: 'power2.in' });
      m.add(s, 1.4);
    }
  },
  clinic(q, m) {
    const pulse = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    travel(pulse, q('[data-i="beat"]')[0], q('[data-i="ecg"]')[0], 0, 2.2, 'none');
    m.add(pulse, 0);
    const t = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    const [bell] = q('[data-i="bell"]');
    if (bell) t.set(bell, { svgOrigin: '90 104' }, 0).to(bell, { keyframes: { rotation: [0, 14, -12, 9, -6, 3, 0], easeEach: 'sine.inOut' }, duration: 0.9 }, 0);
    travel(t, q('[data-i="remind"]')[0], q('[data-i="remind-path"]')[0], 0.5, 1.7);
    m.add(t, 0.8);
  },
  vet(q, m) {
    const prints = q('[data-i="print"]');
    if (prints.length) {
      const p = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
      prints.forEach((el, i) => p.fromTo(el, { opacity: 0 }, { opacity: 0.85, duration: 0.25, ease: 'power1.out' }, i * 0.45).to(el, { opacity: 0, duration: 0.6, ease: 'power1.in' }, i * 0.45 + 1.7));
      m.add(p, 0);
    }
    const t = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    travel(t, q('[data-i="call"]')[0], q('[data-i="call-path"]')[0], 0, 1.5);
    m.add(t, 1);
    const [zone] = q('[data-i="zone"]');
    if (zone) m.add(gsap.to(zone, { rotation: -360, svgOrigin: '392 304', duration: 40, ease: 'none', repeat: -1 }), 0);
  },
};

// ---- Eclipse Media's frames ----------------------------------------------------

const MEDIA_LOOPS: Record<string, (q: Q, master: gsap.core.Timeline) => void> = {
  trailer(q, m) {
    const [line] = q('[data-i="play-line"]');
    const [dot] = q('[data-i="play-dot"]');
    const t = gsap.timeline({ repeat: -1 });
    if (line) t.fromTo(line, { scaleX: 0.1, transformOrigin: '0% 50%' }, { scaleX: 2.69, duration: 4.5, ease: 'none' }, 0);
    if (dot) t.fromTo(dot, { x: -47 }, { x: 88, duration: 4.5, ease: 'none' }, 0);
    m.add(t, 0);
    const [play] = q('[data-i="play"]');
    if (play) m.add(gsap.fromTo(play, { scale: 1, transformOrigin: '40% 50%' }, { scale: 1.12, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
  },
  motion(q, m) {
    const t = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    travel(t, q('[data-i="mover"]')[0], q('[data-i="curve"]')[0], 0, 1.8, 'expo.inOut');
    const [key] = q('[data-i="key"]');
    if (key) t.fromTo(key, { rotation: 0, transformOrigin: '50% 50%' }, { rotation: 90, duration: 0.6, ease: 'back.out(2)' }, 1.6);
    m.add(t, 0);
  },
  photos(q, m) {
    const [glow] = q('[data-i="flash"]');
    if (glow) {
      const f = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
      f.to(glow, { opacity: 0.7, scale: 1.6, transformOrigin: '50% 50%', duration: 0.12, ease: 'power2.out' }).to(glow, { opacity: 0.12, scale: 1, duration: 0.8, ease: 'power2.inOut' });
      m.add(f, 0.6);
    }
    const t = gsap.timeline({ repeat: -1 });
    travel(t, q('[data-i="mover"]')[0], 'M34 80A40 7 0 1 0 114 80A40 7 0 1 0 34 80', 0, 3.4, 'none');
    m.add(t, 0);
  },
  social(q, m) {
    const [heart] = q('[data-i="heart"]');
    if (heart) {
      const h = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });
      h.to(heart, { scale: 1.3, transformOrigin: '50% 60%', duration: 0.18, ease: 'power2.out' }).to(heart, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      m.add(h, 0.4);
    }
    const [feed] = q('[data-i="feed"]');
    if (feed) m.add(gsap.fromTo(feed, { y: 3 }, { y: -3, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
  },
  launch(q, m) {
    const [flag] = q('[data-i="flag"]');
    if (flag) m.add(gsap.fromTo(flag, { scaleX: 1, transformOrigin: '0% 50%' }, { scaleX: 0.7, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
  },
  models(q, m) {
    const [cube] = q('[data-i="cube"]');
    if (cube) m.add(gsap.fromTo(cube, { scaleX: 1, transformOrigin: '50% 50%' }, { scaleX: 0.55, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
  },
};

// ---- Unit emblems -------------------------------------------------------------

const UNIT_LOOPS: Record<string, (q: Q, master: gsap.core.Timeline) => void> = {
  media(q, m) {
    const [head] = q('[data-i="playhead"]');
    const [line] = q('[data-i="progress"]');
    const t = gsap.timeline({ repeat: -1 });
    if (head) t.fromTo(head, { x: -150 }, { x: 160, duration: 6, ease: 'none' }, 0);
    if (line) t.fromTo(line, { scaleX: 22 / 172, transformOrigin: '0% 50%' }, { scaleX: 332 / 172, duration: 6, ease: 'none' }, 0);
    m.add(t, 0);
    const back = q('[data-i="back"]');
    if (back.length) m.add(gsap.fromTo(back, { x: -5 }, { x: 5, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.4 }), 0);
  },
  academy(q, m) {
    const [student] = q('[data-i="student"]');
    if (student) {
      const legs = gsap.utils.selector(student)('[data-walker-leg]');
      const t = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
      t.set(student, { x: 0, y: 0, opacity: 0 }).to(student, { opacity: 1, duration: 0.4 });
      for (let k = 1; k <= 4; k++) {
        t.to(student, { x: 60 * k, duration: 0.55, ease: 'power2.inOut' }, `+=0.5`).to(student, { y: -40 * k, duration: 0.55, ease: 'back.out(2)' }, '<');
        if (legs.length) t.fromTo(legs, { rotation: (i) => (i ? -24 : 24), transformOrigin: (i) => (i ? '0% 0%' : '100% 0%') }, { rotation: 0, duration: 0.55, ease: 'sine.out' }, '<');
      }
      t.to(student, { opacity: 0, duration: 0.5 }, '+=0.6');
      m.add(t, 0.6);
    }
    const [answer] = q('[data-i="answer"]');
    if (answer) {
      const a = gsap.timeline({ repeat: -1 });
      a.to(answer, { y: -20, duration: 0.5, ease: 'expo.inOut' }, 1.2).to(answer, { y: 20, duration: 0.6, ease: 'expo.inOut' }, 2.6).to(answer, { y: 0, duration: 0.5, ease: 'expo.inOut' }, 4).to({}, { duration: 1 });
      m.add(a, 0);
    }
  },
  intelligence(q, m) {
    const [needle] = q('[data-i="needle"]');
    if (needle) m.add(gsap.fromTo(needle, { rotation: -26, svgOrigin: '170 196' }, { rotation: 22, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
    const t = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
    travel(t, q('[data-i="reader"]')[0], q('[data-i="trace"]')[0], 0, 2.6, 'none');
    travel(t, q('[data-i="source"]')[0], q('[data-i="source-path"]')[0], 2.2, 1.1);
    m.add(t, 0.4);
  },
  agency(q, m) {
    const packets = q('[data-i="packet"]');
    const spokes = q('[data-i="spoke"]');
    packets.forEach((packet, i) => {
      const d = spokes[i]?.getAttribute('data-to');
      const t = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: i * 0.55 });
      travel(t, packet, d ?? undefined, 0, 1.2, 'power2.in');
      m.add(t, 0);
    });
    const [gear] = q('[data-i="gear"]');
    if (gear) m.add(gsap.to(gear, { rotation: 360, svgOrigin: '384 100', duration: 14, ease: 'none', repeat: -1 }), 0);
    const bars = q('[data-i="bar"]');
    if (bars.length)
      m.add(gsap.fromTo(bars, { scaleY: 0.5, transformOrigin: '50% 50%' }, { scaleY: 1.25, duration: 0.42, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.09, from: 'center' } }), 0);
  },
};

// ---- Equipment -----------------------------------------------------------------

function equipmentLoops(q: Q, m: gsap.core.Timeline) {
  q('[data-eq-part]').forEach((part, i) => {
    m.add(gsap.fromTo(part, { y: -3.5 }, { y: 3.5, duration: 2.4 + (i % 3) * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }), i * 0.35);
  });
  const [scan] = q('[data-i="qr-scan"]');
  if (scan) {
    const s = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });
    s.set(scan, { opacity: 0, y: 0 }).to(scan, { opacity: 0.85, duration: 0.2 }, 0).to(scan, { y: 42, duration: 1.4, ease: 'sine.inOut' }, 0).to(scan, { opacity: 0, duration: 0.3 }, 1.2);
    m.add(s, 0.8);
  }
  const [key] = q('[data-i="key"]');
  if (key) {
    const k = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    k.to(key, { opacity: 0.15, duration: 0.12 }).to(key, { opacity: 1, duration: 0.3 });
    m.add(k, 1.2);
  }
  const [tag] = q('[data-i="tag"]');
  if (tag) m.add(gsap.fromTo(tag, { rotation: -7, svgOrigin: '300 286' }, { rotation: 7, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }), 0);
}

/**
 * The loop of whatever plate `frame` holds (a ProductArt, a Media frame, a unit emblem or the
 * Equipment sheet), built paused; null when it has none.
 */
export function plateLoop(frame: Element): gsap.core.Timeline | null {
  const q = gsap.utils.selector(frame) as Q;
  const svg = frame.matches('svg') ? frame : frame.querySelector('svg');
  if (!svg) return null;
  const ds = (svg as SVGElement).dataset;
  const build = ds.productArt
    ? PRODUCT_LOOPS[ds.productArt]
    : ds.mediaArt
      ? MEDIA_LOOPS[ds.mediaArt]
      : ds.unitArt
        ? UNIT_LOOPS[ds.unitArt]
        : ds.eqArt !== undefined
          ? equipmentLoops
          : undefined;
  if (!build) return null;
  const master = gsap.timeline({ paused: true });
  build(q, master);
  const glow = glowLoop(q);
  if (glow) master.add(glow, 0);
  return master.getChildren().length ? master : null;
}

/**
 * Starts a plate's loop now (it plays only on screen). Returns its cleanup, which also puts every
 * moved part back where the drawing has it (gsap.context revert).
 */
export function startPlateLoop(frame: Element): () => void {
  let unwatch = () => {};
  const ctx = gsap.context(() => {
    const tl = plateLoop(frame);
    if (tl) unwatch = whileVisible(frame, tl);
  });
  return () => {
    ctx.revert();
    unwatch();
  };
}

/**
 * The plate's whole life: drawn once (artEntrance, returned paused for the caller to play when it
 * enters), then its loop for as long as it is on screen. `dispose` stops both.
 */
export function plateLife(frame: Element, opts?: { duration?: number }) {
  const entrance = artEntrance(frame, opts);
  let stop: (() => void) | null = null;
  entrance.call(() => {
    stop ??= startPlateLoop(frame);
  });
  return {
    entrance,
    dispose: () => {
      entrance.kill();
      stop?.();
      stop = null;
    },
  };
}
