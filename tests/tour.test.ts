import { describe, expect, it } from 'vitest';
import {
  centerDelta,
  computePlacement,
  mergeHoles,
  roundedRectPath,
  veilClipPath,
  overlaps,
  ARROW_INSET,
  TOUR_GAP,
  TOUR_MARGIN,
  type Rect,
} from '@/components/ui/tour/geometry';

const desktop = { width: 1440, height: 900 };
const phone = { width: 360, height: 780 };
const card = { width: 380, height: 220 };
const sheet = { width: 336, height: 240 };

const rect = (x: number, y: number, width: number, height: number): Rect => ({ x, y, width, height });
const cardOf = (p: { x: number; y: number }, size = card): Rect => ({ x: p.x, y: p.y, width: size.width, height: size.height });
const inside = (r: Rect, vp: { width: number; height: number }, m = TOUR_MARGIN) =>
  r.x >= m - 0.01 && r.y >= m - 0.01 && r.x + r.width <= vp.width - m + 0.01 && r.y + r.height <= vp.height - m + 0.01;

describe('tour · mergeHoles', () => {
  it('pads each target and keeps separate targets apart', () => {
    const holes = mergeHoles([rect(100, 100, 50, 20), rect(400, 100, 50, 20)], 6);
    expect(holes).toEqual([rect(94, 94, 62, 32), rect(394, 94, 62, 32)]);
  });

  it('merges overlapping holes into their bounding box (even-odd would re-cover the overlap)', () => {
    const holes = mergeHoles([rect(100, 100, 50, 20), rect(140, 110, 50, 20), rect(600, 600, 10, 10)], 6);
    expect(holes).toHaveLength(2);
    expect(holes[0]).toEqual(rect(94, 94, 102, 42));
  });

  it('merges chains transitively and drops empty rects', () => {
    const holes = mergeHoles([rect(0, 0, 20, 20), rect(300, 0, 20, 20), rect(15, 0, 290, 20), rect(5, 5, 0, 10)], 0);
    expect(holes).toEqual([rect(0, 0, 320, 20)]);
  });
});

describe('tour · clip path', () => {
  it('is none without holes and an even-odd path with them', () => {
    expect(veilClipPath(desktop, [])).toBe('none');
    const clip = veilClipPath(desktop, [rect(10, 10, 100, 40)]);
    expect(clip.startsWith("path(evenodd, 'M-50 -50H1490V950H-50Z")).toBe(true);
    expect(clip).toContain('A12 12 0 0 1');
  });

  it('clamps the radius to small rects', () => {
    expect(roundedRectPath(rect(0, 0, 10, 10), 12)).toContain('A5 5');
    expect(roundedRectPath(rect(0, 0, 10, 10), 0)).toBe('M0 0H10V10H0Z');
  });
});

describe('tour · computePlacement (wide)', () => {
  it('centers the card without an anchor, with no arrow', () => {
    const p = computePlacement({ anchor: null, card, viewport: desktop });
    expect(p.mode).toBe('center');
    expect(p.arrow).toBeNull();
    expect(p.x).toBe((1440 - 380) / 2);
    expect(p.y).toBe((900 - 220) / 2);
  });

  it('picks the side with most room and points the arrow back at the anchor', () => {
    const anchor = rect(100, 80, 200, 40); // top-left: most room below
    const p = computePlacement({ anchor, card, viewport: desktop });
    expect(p.mode).toBe('float');
    expect(p.side).toBe('bottom');
    expect(p.y).toBe(80 + 40 + TOUR_GAP);
    expect(p.arrow?.edge).toBe('top');
    // Arrow under the anchor's center (card is clamped to the margin on the left).
    expect(p.x + (p.arrow?.offset ?? 0)).toBe(200);
    expect(overlaps(cardOf(p), anchor)).toBe(false);
  });

  it('honours a preferred side when it fits', () => {
    const anchor = rect(600, 400, 200, 60);
    expect(computePlacement({ anchor, card, viewport: desktop, placement: 'top' }).side).toBe('top');
    expect(computePlacement({ anchor, card, viewport: desktop, placement: 'left' }).side).toBe('left');
  });

  it('flips to the opposite side on collision', () => {
    const anchor = rect(600, 40, 200, 60); // no room above
    const p = computePlacement({ anchor, card, viewport: desktop, placement: 'top' });
    expect(p.side).toBe('bottom');
    expect(p.arrow?.edge).toBe('top');
  });

  it('flips left → right near the left edge', () => {
    const anchor = rect(40, 300, 120, 300);
    const p = computePlacement({ anchor, card, viewport: desktop, placement: 'left' });
    expect(p.side).toBe('right');
    expect(p.x).toBe(40 + 120 + TOUR_GAP);
  });

  it('keeps the card inside the viewport with the margin', () => {
    const anchor = rect(1380, 860, 50, 30); // bottom-right corner
    const p = computePlacement({ anchor, card, viewport: desktop });
    expect(inside(cardOf(p), desktop)).toBe(true);
    expect(p.covers).toBe(false);
    // Arrow stays away from the card's corners.
    expect(p.arrow!.offset).toBeGreaterThanOrEqual(ARROW_INSET);
  });

  it('prefers a side that leaves the other lit targets uncovered', () => {
    // Desktop view on the left, phone view on the right (the demo guide's split layout).
    const anchor = rect(200, 300, 300, 80);
    const other = rect(560, 200, 400, 600);
    const plain = computePlacement({ anchor, card, viewport: desktop });
    const p = computePlacement({ anchor, card, viewport: desktop, avoid: [other] });
    expect(overlaps(cardOf(p), other)).toBe(false);
    expect(overlaps(cardOf(p), anchor)).toBe(false);
    expect(plain.side).not.toBeNull();
  });

  it('when nothing fits (huge anchor) it stays on screen, flags the cover and drops the arrow', () => {
    const anchor = rect(20, 20, 1400, 860);
    const p = computePlacement({ anchor, card, viewport: desktop });
    expect(inside(cardOf(p), desktop)).toBe(true);
    expect(p.covers).toBe(true);
    expect(p.arrow).toBeNull();
    expect(p.leader).toBeNull();
  });
});

describe('tour · computePlacement (narrow → docked sheet)', () => {
  it('docks to the bottom when the anchor is high, arrow up, leader to the anchor', () => {
    const anchor = rect(40, 120, 120, 48);
    const p = computePlacement({ anchor, card: sheet, viewport: phone });
    expect(p.mode).toBe('dock');
    expect(p.side).toBe('bottom');
    expect(p.y).toBe(780 - TOUR_MARGIN - 240);
    expect(p.x).toBe(TOUR_MARGIN);
    expect(p.arrow?.edge).toBe('top');
    expect(p.x + p.arrow!.offset).toBe(100);
    expect(p.leader).not.toBeNull();
    expect(p.leader!.y2).toBe(120 + 48); // ends on the anchor's bottom edge
  });

  it('docks to the top when the anchor is low', () => {
    const anchor = rect(200, 640, 120, 60);
    const p = computePlacement({ anchor, card: sheet, viewport: phone });
    expect(p.side).toBe('top');
    expect(p.y).toBe(TOUR_MARGIN);
    expect(p.arrow?.edge).toBe('bottom');
    expect(overlaps(cardOf(p, sheet), anchor)).toBe(false);
  });

  it('when neither fits, covers as little of the anchor as possible', () => {
    const anchor = rect(20, 200, 320, 400);
    const p = computePlacement({ anchor, card: sheet, viewport: phone });
    expect(p.mode).toBe('dock');
    expect(p.covers).toBe(true);
    expect(p.arrow).toBeNull();
  });

  it('ignores left/right preferences on phones', () => {
    const anchor = rect(40, 120, 120, 48);
    expect(computePlacement({ anchor, card: sheet, viewport: phone, placement: 'right' }).side).toBe('bottom');
  });
});

describe('tour · centerDelta', () => {
  it('centers the anchor vertically in the region', () => {
    expect(centerDelta(rect(0, 1000, 100, 100), rect(0, 0, 400, 800))).toEqual({ dx: 0, dy: 650 });
    expect(centerDelta(rect(0, 350, 100, 100), rect(0, 0, 400, 800))).toEqual({ dx: 0, dy: 0 });
  });

  it('aligns a tall anchor to the top of the region', () => {
    expect(centerDelta(rect(0, 300, 100, 1000), rect(0, 100, 400, 500))).toEqual({ dx: 0, dy: 200 });
  });

  it('scrolls horizontally only when the anchor is not fully inside', () => {
    expect(centerDelta(rect(50, 0, 100, 10), rect(0, -100, 400, 220)).dx).toBe(0);
    expect(centerDelta(rect(500, 0, 100, 10), rect(0, -100, 400, 220)).dx).toBe(350);
  });
});

describe('tour · the card always fits on screen', () => {
  const small = { width: 360, height: 640 };
  const tallSheet = { width: 336, height: 700 }; // long copy: taller than the screen

  it('caps the card to the visible height and keeps it inside the margins (docked sheet)', () => {
    const anchor = rect(20, 560, 320, 60); // last item of a list, near the bottom
    const p = computePlacement({ anchor, card: tallSheet, viewport: small });
    expect(p.maxHeight).toBe(640 - 2 * TOUR_MARGIN);
    const shown = cardOf(p, { width: 336, height: Math.min(700, p.maxHeight) });
    expect(inside(shown, small)).toBe(true);
    // No room around the target: covering part of it beats pushing the buttons off screen.
    expect(p.covers).toBe(true);
  });

  it('a docked sheet with little room still ends 12px above the bottom edge', () => {
    const anchor = rect(20, 300, 320, 120);
    const sheetCard = { width: 336, height: 420 };
    const p = computePlacement({ anchor, card: sheetCard, viewport: { width: 360, height: 780 } });
    expect(inside(cardOf(p, sheetCard), { width: 360, height: 780 })).toBe(true);
  });

  it('caps a floating card too', () => {
    const anchor = rect(600, 860, 120, 30);
    const p = computePlacement({ anchor, card: { width: 380, height: 1200 }, viewport: desktop });
    expect(p.maxHeight).toBe(900 - 2 * TOUR_MARGIN);
    expect(inside(cardOf(p, { width: 380, height: p.maxHeight }), desktop)).toBe(true);
  });

  it('fits the visual viewport when it is smaller than the layer (browser bars, zoom)', () => {
    const bounds = rect(0, 0, 360, 560); // layer 780 tall, only 560 visible
    const anchor = rect(20, 380, 320, 60);
    const p = computePlacement({ anchor, card: sheet, viewport: phone, bounds });
    expect(p.maxHeight).toBe(560 - 2 * TOUR_MARGIN);
    expect(p.y + Math.min(sheet.height, p.maxHeight)).toBeLessThanOrEqual(560 - TOUR_MARGIN);
    expect(p.y).toBeGreaterThanOrEqual(TOUR_MARGIN);
  });

  it('places relative to an offset visual viewport', () => {
    const bounds = rect(0, 200, 360, 500);
    const p = computePlacement({ anchor: null, card: sheet, viewport: phone, bounds });
    expect(p.y).toBe(200 + (500 - 240) / 2);
  });
});
