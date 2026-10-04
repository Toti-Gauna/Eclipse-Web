/**
 * Pure geometry of the guided tour (no DOM): spotlight holes, card placement, arrow and
 * leader line, and how far to scroll so the anchor sits in the free part of the screen.
 * Every rect is in the tour layer's coordinates (the viewport, unless a transformed
 * ancestor moves the layer). Unit-tested in tests/tour.test.ts.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type PlacementPref = 'auto' | Side;

/** Distance kept between the card and the viewport edges. */
export const TOUR_MARGIN = 12;
/** Distance between the card and the (padded) anchor in floating mode. */
export const TOUR_GAP = 16;
/** Padding of a spotlight hole around its target. */
export const TOUR_PAD = 6;
/** Corner radius of the spotlight holes. */
export const TOUR_RADIUS = 12;
/** Below this layer width the card docks to the bottom (or top) as a sheet. */
export const TOUR_NARROW = 640;
/** How far the arrow tip sticks out of the card edge. */
export const ARROW_TIP = 8;
/** Minimum distance between the arrow and a card corner. */
export const ARROW_INSET = 24;

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

export const right = (r: Rect) => r.x + r.width;
export const bottom = (r: Rect) => r.y + r.height;
const cx = (r: Rect) => r.x + r.width / 2;
const cy = (r: Rect) => r.y + r.height / 2;
const clamp = (v: number, min: number, max: number) => (max < min ? min : Math.min(max, Math.max(min, v)));

export function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const r = Math.min(right(a), right(b));
  const btm = Math.min(bottom(a), bottom(b));
  if (r - x <= 0 || btm - y <= 0) return null;
  return { x, y, width: r - x, height: btm - y };
}

export function overlaps(a: Rect, b: Rect): boolean {
  return intersect(a, b) !== null;
}

export function inflate(r: Rect, pad: number): Rect {
  return { x: r.x - pad, y: r.y - pad, width: r.width + 2 * pad, height: r.height + 2 * pad };
}

export function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(right(a), right(b)) - x, height: Math.max(bottom(a), bottom(b)) - y };
}

/**
 * Spotlight holes: each rect padded by `pad`; overlapping holes become one (their bounding
 * box), since an even-odd clip path would re-cover the area where two holes overlap.
 * Keeps the input order (the first hole contains the anchor).
 */
export function mergeHoles(rects: Rect[], pad = TOUR_PAD): Rect[] {
  const out = rects.filter((r) => r.width > 0 && r.height > 0).map((r) => inflate(r, pad));
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        if (overlaps(out[i], out[j])) {
          out[i] = union(out[i], out[j]);
          out.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return out;
}

const n = (v: number) => String(Math.round(v * 10) / 10);

/** SVG path of a rounded rectangle (clockwise). */
export function roundedRectPath(r: Rect, radius = TOUR_RADIUS): string {
  const k = Math.max(0, Math.min(radius, r.width / 2, r.height / 2));
  const { x, y, width: w, height: h } = r;
  if (k === 0) return `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;
  return (
    `M${n(x + k)} ${n(y)}H${n(x + w - k)}A${n(k)} ${n(k)} 0 0 1 ${n(x + w)} ${n(y + k)}` +
    `V${n(y + h - k)}A${n(k)} ${n(k)} 0 0 1 ${n(x + w - k)} ${n(y + h)}` +
    `H${n(x + k)}A${n(k)} ${n(k)} 0 0 1 ${n(x)} ${n(y + h - k)}` +
    `V${n(y + k)}A${n(k)} ${n(k)} 0 0 1 ${n(x + k)} ${n(y)}Z`
  );
}

/**
 * `clip-path` value for the veil: the whole layer minus the holes (even-odd), or 'none'
 * when there is nothing to light.
 */
export function veilClipPath(size: Size, holes: Rect[], radius = TOUR_RADIUS): string {
  if (!holes.length) return 'none';
  // The outer frame overshoots the layer so the veil's blurred edge never shows.
  const frame = `M-50 -50H${n(size.width + 50)}V${n(size.height + 50)}H-50Z`;
  return `path(evenodd, '${frame}${holes.map((h) => roundedRectPath(h, radius)).join('')}')`;
}

export interface PlacementInput {
  /** The (padded) anchor hole, or null for a centered card without arrow. */
  anchor: Rect | null;
  card: Size;
  viewport: Size;
  placement?: PlacementPref;
  /** Other lit targets the card should not cover when there is a choice. */
  avoid?: Rect[];
  margin?: number;
  gap?: number;
  narrowBelow?: number;
}

export interface Placement {
  /** float: next to the anchor · dock: a sheet at the bottom/top (narrow screens) · center: no anchor. */
  mode: 'float' | 'dock' | 'center';
  /** Where the card sits relative to the anchor (null when centered). */
  side: Side | null;
  x: number;
  y: number;
  /** The arrow on the card edge facing the anchor; `offset` runs along that edge from the card's corner. */
  arrow: { edge: Side; offset: number } | null;
  /** Hairline from the arrow tip to the anchor when they don't touch (docked sheets mostly). */
  leader: { x1: number; y1: number; x2: number; y2: number } | null;
  /** True when the card could not avoid covering part of the anchor. */
  covers: boolean;
}

function cardRect(x: number, y: number, card: Size): Rect {
  return { x, y, width: card.width, height: card.height };
}

/** Point on the card's `edge` at `offset`, pushed out by the arrow tip. */
function arrowTip(card: Rect, edge: Side, offset: number): { x: number; y: number } {
  switch (edge) {
    case 'top':
      return { x: card.x + offset, y: card.y - ARROW_TIP };
    case 'bottom':
      return { x: card.x + offset, y: bottom(card) + ARROW_TIP };
    case 'left':
      return { x: card.x - ARROW_TIP, y: card.y + offset };
    case 'right':
      return { x: right(card) + ARROW_TIP, y: card.y + offset };
  }
}

function leaderTo(tip: { x: number; y: number }, anchor: Rect): Placement['leader'] {
  const x2 = clamp(tip.x, anchor.x, right(anchor));
  const y2 = clamp(tip.y, anchor.y, bottom(anchor));
  if (Math.hypot(x2 - tip.x, y2 - tip.y) < 6) return null;
  return { x1: tip.x, y1: tip.y, x2, y2 };
}

function withArrow(card: Rect, side: Side, anchor: Rect, mode: 'float' | 'dock'): Placement {
  const edge = OPPOSITE[side];
  const covers = overlaps(card, anchor);
  if (covers) return { mode, side, x: card.x, y: card.y, arrow: null, leader: null, covers };
  const vertical = edge === 'top' || edge === 'bottom';
  const offset = vertical
    ? clamp(cx(anchor) - card.x, ARROW_INSET, card.width - ARROW_INSET)
    : clamp(cy(anchor) - card.y, ARROW_INSET, card.height - ARROW_INSET);
  const leader = leaderTo(arrowTip(card, edge, offset), anchor);
  return { mode, side, x: card.x, y: card.y, arrow: { edge, offset }, leader, covers };
}

/** Free space between the anchor and the viewport edge on each side, minus what the card needs. */
function slack(side: Side, a: Rect, card: Size, vp: Size, margin: number, gap: number): number {
  switch (side) {
    case 'top':
      return a.y - margin - gap - card.height;
    case 'bottom':
      return vp.height - margin - bottom(a) - gap - card.height;
    case 'left':
      return a.x - margin - gap - card.width;
    case 'right':
      return vp.width - margin - right(a) - gap - card.width;
  }
}

function floatRect(side: Side, a: Rect, card: Size, vp: Size, margin: number, gap: number): Rect {
  const maxX = vp.width - margin - card.width;
  const maxY = vp.height - margin - card.height;
  switch (side) {
    case 'top':
      return cardRect(clamp(cx(a) - card.width / 2, margin, maxX), clamp(a.y - gap - card.height, margin, maxY), card);
    case 'bottom':
      return cardRect(clamp(cx(a) - card.width / 2, margin, maxX), clamp(bottom(a) + gap, margin, maxY), card);
    case 'left':
      return cardRect(clamp(a.x - gap - card.width, margin, maxX), clamp(cy(a) - card.height / 2, margin, maxY), card);
    case 'right':
      return cardRect(clamp(right(a) + gap, margin, maxX), clamp(cy(a) - card.height / 2, margin, maxY), card);
  }
}

/**
 * Where the card goes. Wide layers: next to the anchor on the preferred side (or the side
 * with most room), flipping when it doesn't fit, kept `margin` inside the layer, and
 * preferring a side that leaves the other lit targets uncovered. Narrow layers (< 640px):
 * a sheet docked to the bottom, or to the top when the anchor is low. No anchor: centered.
 */
export function computePlacement(input: PlacementInput): Placement {
  const { anchor, card, viewport: vp, placement = 'auto', avoid = [] } = input;
  const margin = input.margin ?? TOUR_MARGIN;
  const gap = input.gap ?? TOUR_GAP;
  const narrowBelow = input.narrowBelow ?? TOUR_NARROW;

  if (!anchor) {
    return {
      mode: 'center',
      side: null,
      x: clamp((vp.width - card.width) / 2, margin, vp.width - margin - card.width),
      y: clamp((vp.height - card.height) / 2, margin, vp.height - margin - card.height),
      arrow: null,
      leader: null,
      covers: false,
    };
  }

  if (vp.width < narrowBelow) {
    const x = clamp((vp.width - card.width) / 2, margin, vp.width - margin - card.width);
    const below = cardRect(x, Math.max(margin, vp.height - margin - card.height), card);
    const above = cardRect(x, margin, card);
    const fitsBelow = bottom(anchor) + gap <= below.y; // card at the bottom, anchor above it
    const fitsAbove = anchor.y - gap >= bottom(above); // card at the top, anchor below it
    let side: Side;
    if (placement === 'top' && fitsAbove) side = 'top';
    else if (placement === 'bottom' && fitsBelow) side = 'bottom';
    else if (fitsBelow !== fitsAbove) side = fitsBelow ? 'bottom' : 'top';
    else if (fitsBelow) side = placement === 'top' ? 'top' : 'bottom';
    else {
      // Neither fits: cover as little of the anchor as possible; a low anchor sends the card up.
      const overBelow = intersect(below, anchor)?.height ?? 0;
      const overAbove = intersect(above, anchor)?.height ?? 0;
      side = overAbove < overBelow || (overAbove === overBelow && cy(anchor) > vp.height / 2) ? 'top' : 'bottom';
    }
    return withArrow(side === 'bottom' ? below : above, side, anchor, 'dock');
  }

  // Room relative to what the card needs on that axis (so a wide screen doesn't always win sideways).
  const room = (s: Side) => slack(s, anchor, card, vp, margin, gap) / Math.max(1, s === 'top' || s === 'bottom' ? card.height : card.width);
  const sides: Side[] = (['bottom', 'top', 'right', 'left'] as Side[]).sort((a, b) => room(b) - room(a));
  const order: Side[] =
    placement === 'auto' ? sides : [placement, OPPOSITE[placement], ...sides.filter((s) => s !== placement && s !== OPPOSITE[placement])];
  const fitting = order.filter((s) => slack(s, anchor, card, vp, margin, gap) >= 0);
  const clear = fitting.find((s) => !avoid.some((r) => overlaps(floatRect(s, anchor, card, vp, margin, gap), r)));
  const side = clear ?? fitting[0] ?? sides[0];
  return withArrow(floatRect(side, anchor, card, vp, margin, gap), side, anchor, 'float');
}

/**
 * How far to scroll a container so `anchor` is centered in `region` (both in viewport
 * coordinates), e.g. a scroller's visible box minus the part a docked card will cover.
 * An anchor taller (wider) than the region is aligned to its top (left). Horizontally it
 * only scrolls when the anchor isn't already fully inside.
 */
export function centerDelta(anchor: Rect, region: Rect): { dx: number; dy: number } {
  const dy = anchor.height <= region.height ? cy(anchor) - cy(region) : anchor.y - region.y;
  const insideX = anchor.x >= region.x && right(anchor) <= right(region);
  const dx = insideX ? 0 : anchor.width <= region.width ? cx(anchor) - cx(region) : anchor.x - region.x;
  return { dx: Math.round(dx), dy: Math.round(dy) };
}
