'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { X } from 'lucide-react';
import { PhaseGlyph } from '@/components/ui/PhaseGlyph';
import { useIsClient } from '@/components/motion/useIsClient';
import { prefersReducedMotion } from '@/components/motion/useReducedMotion';
import {
  centerDelta,
  computePlacement,
  inflate,
  intersect,
  mergeHoles,
  overlaps,
  union,
  veilClipPath,
  TOUR_GAP,
  TOUR_MARGIN,
  TOUR_NARROW,
  TOUR_PAD,
  type Rect,
  type Side,
} from './geometry';
import type { TourCloseReason, TourProps, TourStep } from './types';
import './tour.css';

/** How long the layer stays mounted for its exit fade. */
const EXIT_MS = 240;

/**
 * Guided tour: dims and blurs the UI, lights every visible target of the step with a ring,
 * and points a card at the first one. Contract and options: ./types.ts; usage: ./index.ts.
 *
 * Mounted while `open` (plus a short exit fade). Renders through a portal into `host()`,
 * which must be inside the same <dialog> as the targets when there is one.
 */
export function Tour(props: TourProps) {
  const isClient = useIsClient();
  const [prevOpen, setPrevOpen] = useState(props.open);
  const [session, setSession] = useState(props.open ? 1 : 0);
  const [present, setPresent] = useState(props.open);
  const [host, setHost] = useState<{ session: number; el: HTMLElement } | null>(null);
  if (props.open !== prevOpen) {
    setPrevOpen(props.open);
    if (props.open) {
      setSession((s) => s + 1);
      setPresent(true);
    }
  }

  // Exit fade, then unmount.
  useEffect(() => {
    if (props.open || !present) return;
    const timer = window.setTimeout(() => setPresent(false), prefersReducedMotion() ? 0 : EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [props.open, present]);

  // Resolve the portal host once per session. It may not exist yet (a dialog that is still
  // loading): look for it for up to ~2 s, then fall back to <body>.
  const hostFn = useRef(props.host);
  useLayoutEffect(() => {
    hostFn.current = props.host;
  });
  useEffect(() => {
    if (!present) return;
    let raf = 0;
    let tries = 0;
    const find = () => {
      const fn = hostFn.current;
      const el = fn ? fn() : document.body;
      if (el || tries++ > 120) setHost({ session, el: el ?? document.body });
      else raf = requestAnimationFrame(find);
    };
    raf = requestAnimationFrame(find);
    return () => cancelAnimationFrame(raf);
  }, [present, session]);

  if (!isClient || !present || !host || host.session !== session) return null;
  return createPortal(<TourLayer key={session} {...props} closing={!props.open} />, host.el);
}

interface Api {
  next: () => void;
  prev: () => void;
  finish: (reason: TourCloseReason) => void;
  /** Closing (from either side): stop handling input and give focus back. */
  stop: () => void;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function toRect(r: DOMRect | Rect): Rect {
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

function isEditable(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
}

function TourLayer(props: TourProps & { closing: boolean }) {
  const { steps, copy, closing } = props;
  const total = steps.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(props.initialStep ?? 0, 0), Math.max(total - 1, 0)));
  const ids = useId();
  const layerRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const catchRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const leaderRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const api = useRef<Api | null>(null);
  const propsRef = useRef(props);
  useLayoutEffect(() => {
    propsRef.current = props;
  });

  // The engine: imperative (geometry is written straight to the DOM, no re-render per frame).
  useEffect(() => {
    const layer = layerRef.current;
    const veil = veilRef.current;
    const catcher = catchRef.current;
    const rings = ringsRef.current;
    const leader = leaderRef.current;
    const dot = dotRef.current;
    const card = cardRef.current;
    const live = liveRef.current;
    if (!layer || !veil || !catcher || !rings || !leader || !dot || !card || !live) return;
    const doc = layer.ownerDocument;
    const win = doc.defaultView ?? window;
    const prevFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    const clipCache = new WeakMap<Element, Element[]>();

    let token = 0;
    let current = -1;
    let pending: number | null = null;
    let shown = false;
    let everShown = false;
    let closed = false;
    let closedAt = 0;
    let released = false;
    let raf = 0;
    let lastKey = '';
    let lastSide: Side | null = null;
    let glideAt = -Infinity;

    const frame = () => new Promise<void>((resolve) => win.requestAnimationFrame(() => resolve()));
    const stepAt = (i: number): TourStep | undefined => propsRef.current.steps[i];

    // ---- targets -------------------------------------------------------------------
    function isVisible(el: HTMLElement): boolean {
      if (typeof el.checkVisibility === 'function' && !el.checkVisibility({ visibilityProperty: true })) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }

    function resolve(step: TourStep | undefined): HTMLElement[] {
      const root = propsRef.current.root();
      if (!step || !root) return [];
      const out: HTMLElement[] = [];
      for (const selector of step.targets) {
        let list: NodeListOf<Element>;
        try {
          list = root.querySelectorAll(selector);
        } catch {
          continue; // invalid selector: ignore it rather than crash
        }
        for (const el of list) if (el instanceof HTMLElement && !out.includes(el) && isVisible(el)) out.push(el);
      }
      return out;
    }

    /** Ancestors that clip `el` (overflow other than visible), up to the first fixed one. */
    function clipAncestors(el: Element): Element[] {
      const cached = clipCache.get(el);
      if (cached) return cached;
      const out: Element[] = [];
      for (let p = el.parentElement; p && p !== doc.body && p !== doc.documentElement; p = p.parentElement) {
        const cs = win.getComputedStyle(p);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') out.push(p);
        if (cs.position === 'fixed') break;
      }
      clipCache.set(el, out);
      return out;
    }

    /**
     * The layer's box and the part of it actually visible (the visual viewport: mobile browser
     * bars, on-screen keyboard, pinch zoom), both in viewport coordinates.
     */
    function frameBoxes(): { box: Rect; view: Rect } {
      const box = toRect(layer!.getBoundingClientRect());
      const vv = win.visualViewport;
      const visual = vv ? { x: vv.offsetLeft, y: vv.offsetTop, width: vv.width, height: vv.height } : box;
      return { box, view: intersect(box, visual) ?? box };
    }

    /** Caps the card to the visible height (its text scrolls inside; progress + buttons stay visible). */
    function capCard(view: Rect) {
      card!.style.maxHeight = `${Math.max(0, Math.floor(view.height - 2 * TOUR_MARGIN))}px`;
    }

    /** The part of `el` actually on screen, in layer coordinates (null when none). */
    function visibleRect(el: Element, box: Rect, view: Rect): Rect | null {
      let r: Rect | null = toRect(el.getBoundingClientRect());
      for (const a of clipAncestors(el)) {
        r = intersect(r, toRect(a.getBoundingClientRect()));
        if (!r) return null;
      }
      r = intersect(r, view);
      return r && { x: r.x - box.x, y: r.y - box.y, width: r.width, height: r.height };
    }

    // ---- scrolling -----------------------------------------------------------------
    function isScrollable(el: Element): boolean {
      const cs = win.getComputedStyle(el);
      const y = /(auto|scroll|overlay)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
      const x = /(auto|scroll|overlay)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
      return x || y;
    }

    /** Scroll containers from the target outwards; the window only when no dialog/fixed layer is in between. */
    function scrollChain(el: HTMLElement): (Element | 'window')[] {
      const stop = propsRef.current.scroller?.() ?? null;
      const chain: (Element | 'window')[] = [];
      for (let p = el.parentElement; p && p !== doc.body && p !== doc.documentElement; p = p.parentElement) {
        if (isScrollable(p)) chain.push(p);
        if (p === stop) return chain;
        if (p.tagName === 'DIALOG' || win.getComputedStyle(p).position === 'fixed') return chain;
      }
      chain.push('window');
      return chain;
    }

    /**
     * Scrolls so the anchor is centered in the free part of the screen — or the whole group of
     * targets when they share its scroll container and fit together. Returns whether anything moves.
     */
    function scrollToAnchor(el: HTMLElement, targets: HTMLElement[]): boolean {
      const behavior: ScrollBehavior = prefersReducedMotion() ? 'instant' : 'smooth';
      const { view: box } = frameBoxes();
      capCard(box);
      // On phones the card docks as a sheet: keep the anchor in the part it doesn't cover.
      const reserve = box.width < TOUR_NARROW ? card!.offsetHeight + TOUR_MARGIN + TOUR_GAP : 0;
      const chain = scrollChain(el);
      let a = inflate(toRect(el.getBoundingClientRect()), TOUR_PAD);
      const group = targets.filter((t) => t !== el && scrollChain(t)[0] === chain[0]);
      if (group.length) {
        const all = group.reduce((u, t) => union(u, inflate(toRect(t.getBoundingClientRect()), TOUR_PAD)), a);
        const room = (chain[0] === 'window' || !chain[0] ? box.height : Math.min(box.height, chain[0].clientHeight)) - reserve;
        if (all.height <= room - 2 * TOUR_MARGIN) a = all;
      }
      let moved = false;
      for (const c of chain) {
        const scroller = c === 'window' ? doc.scrollingElement : c;
        if (!scroller) continue;
        let region = c === 'window' ? box : intersect(toRect(c.getBoundingClientRect()), box);
        if (!region) continue;
        // Respect the container's scroll-padding (the page's sticky header sets it on <html>).
        const pad = win.getComputedStyle(c === 'window' ? doc.documentElement : c);
        const padTop = parseFloat(pad.scrollPaddingTop) || 0;
        const freeTop = c === 'window' ? Math.max(region.y, box.y + padTop) : region.y + padTop;
        const freeBottom = Math.min(region.y + region.height, box.y + box.height - reserve);
        if (freeBottom - freeTop > 80) region = { ...region, y: freeTop, height: freeBottom - freeTop };
        else if (freeBottom - region.y > 80) region = { ...region, height: freeBottom - region.y };
        const { dx, dy } = centerDelta(a, region);
        const maxTop = scroller.scrollHeight - scroller.clientHeight;
        const maxLeft = scroller.scrollWidth - scroller.clientWidth;
        const top = Math.min(maxTop, Math.max(0, scroller.scrollTop + dy));
        const left = Math.min(maxLeft, Math.max(0, scroller.scrollLeft + dx));
        const realDy = top - scroller.scrollTop;
        const realDx = left - scroller.scrollLeft;
        if (Math.abs(realDy) < 1 && Math.abs(realDx) < 1) continue;
        if (c === 'window') win.scrollTo({ top, left, behavior });
        else c.scrollTo({ top, left, behavior });
        moved = true;
        a = { ...a, x: a.x - realDx, y: a.y - realDy };
      }
      return moved;
    }

    /** Waits until the anchor stops moving (smooth scroll finished), at most ~1 s. */
    async function settle(el: HTMLElement, my: number) {
      const start = performance.now();
      let last = el.getBoundingClientRect();
      let still = 0;
      while (performance.now() - start < 1000) {
        await frame();
        if (my !== token) return;
        const r = el.getBoundingClientRect();
        if (Math.abs(r.top - last.top) < 0.5 && Math.abs(r.left - last.left) < 0.5) {
          if (++still >= 3) return;
        } else still = 0;
        last = r;
      }
    }

    // ---- drawing -------------------------------------------------------------------
    function syncRings(holes: Rect[]) {
      while (rings!.children.length > holes.length) rings!.lastElementChild?.remove();
      while (rings!.children.length < holes.length) {
        const ring = doc.createElement('div');
        ring.className = 'tour-ring';
        ring.append(doc.createElement('div'));
        rings!.append(ring);
      }
      holes.forEach((h, i) => {
        const ring = rings!.children[i] as HTMLElement;
        ring.style.transform = `translate3d(${h.x}px, ${h.y}px, 0)`;
        ring.style.width = `${h.width}px`;
        ring.style.height = `${h.height}px`;
      });
    }

    function clearSpotlight() {
      veil!.style.clipPath = 'none';
      catcher!.style.clipPath = 'none';
      syncRings([]);
      layer!.dataset.leader = 'off';
      lastKey = '';
      lastSide = null;
    }

    /** Measures targets and card and writes the spotlight, the rings, the card and the leader. */
    function apply(animate: boolean) {
      const { box, view } = frameBoxes();
      const vp = { width: box.width, height: box.height };
      const bounds = { ...view, x: view.x - box.x, y: view.y - box.y };
      const step = stepAt(current);
      const rects: Rect[] = [];
      for (const el of resolve(step)) {
        const r = visibleRect(el, box, view);
        if (r) rects.push(r);
      }
      const holes = mergeHoles(rects);
      const anchor = rects[0] ? inflate(rects[0], TOUR_PAD) : null;
      const anchorHole = anchor ? holes.find((h) => overlaps(h, anchor)) : undefined;
      capCard(view);
      const size = { width: card!.offsetWidth, height: card!.offsetHeight };
      // Text cut by the cap scrolls: then it is a keyboard stop too.
      const main = mainRef.current;
      if (main) main.tabIndex = main.scrollHeight > main.clientHeight + 1 ? 0 : -1;
      // While tracking (scroll, resize, content shifts) keep the current side as long as it fits.
      const placement = !animate && lastSide ? lastSide : step?.placement;
      const input = { card: size, viewport: vp, bounds, placement, avoid: holes.filter((h) => h !== anchorHole) };
      let p = computePlacement({ ...input, anchor });
      // Docked sheet with several lit targets: point at the nearest one so the leader doesn't cross the others.
      if (p.mode === 'dock' && holes.length > 1) {
        const docked = p;
        const gapTo = (h: Rect) => (docked.side === 'bottom' ? docked.y - (h.y + h.height) : h.y - (docked.y + size.height));
        const near = holes.filter((h) => gapTo(h) >= 0).sort((a, b) => gapTo(a) - gapTo(b))[0];
        if (near && near !== anchorHole) {
          const q = computePlacement({ ...input, anchor: near });
          if (q.mode === 'dock' && q.side === docked.side) p = q;
        }
      }
      const clip = veilClipPath(vp, holes);
      const key = `${clip}|${p.maxHeight}|${p.x}|${p.y}|${p.mode}|${p.arrow?.edge}|${p.arrow?.offset}|${JSON.stringify(p.leader)}`;
      if (!animate && key === lastKey) return;
      lastKey = key;
      // A jump to another side glides even while tracking, and so does an update that lands while
      // the card is still gliding (dropping the transition there would make it jump).
      if (!animate && ((lastSide && p.side !== lastSide) || performance.now() - glideAt < 500)) animate = true;
      if (animate) glideAt = performance.now();
      lastSide = p.side;

      if (animate) delete layer!.dataset.tracking;
      else layer!.dataset.tracking = '';
      veil!.style.clipPath = clip;
      catcher!.style.clipPath = propsRef.current.allowTargetInteraction ? clip : 'none';
      syncRings(holes);
      card!.dataset.mode = p.mode;
      card!.dataset.edge = p.arrow?.edge ?? 'none';
      card!.style.setProperty('--tour-arrow', `${Math.round(p.arrow?.offset ?? 0)}px`);
      card!.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
      if (p.leader) {
        const { x1, y1, x2, y2 } = p.leader;
        leader!.style.width = `${Math.hypot(x2 - x1, y2 - y1)}px`;
        leader!.style.transform = `translate3d(${x1}px, ${y1}px, 0) rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
        dot!.style.transform = `translate3d(${x2 - 4.5}px, ${y2 - 4.5}px, 0)`;
        layer!.dataset.leader = 'on';
      } else layer!.dataset.leader = 'off';
    }

    function schedule() {
      if (raf || !shown || closed) return;
      raf = win.requestAnimationFrame(() => {
        raf = 0;
        if (shown && !closed) apply(false);
      });
    }

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;

    function announce(text: string) {
      live!.textContent = '';
      win.setTimeout(() => {
        if (!closed) live!.textContent = text;
      }, 60);
    }

    // ---- navigation ----------------------------------------------------------------
    async function runOnStep(i: number, my: number): Promise<boolean> {
      const step = stepAt(i);
      if (!step) return my === token;
      try {
        await propsRef.current.onStep?.(step, i);
      } catch (error) {
        console.error('[tour] onStep failed', error);
      }
      if (my !== token) return false;
      await frame();
      await frame(); // let the host's state change (a tab switch) paint before measuring
      return my === token;
    }

    async function goTo(target: number, dir: 1 | -1) {
      const my = ++token;
      const count = propsRef.current.steps.length;
      if (!count) {
        finish('skip');
        return;
      }
      const wanted = Math.min(Math.max(target, 0), count - 1);
      pending = wanted;
      shown = false;
      layer!.dataset.phase = 'moving';
      clearSpotlight();

      // Missing targets: skip to the next step (in this direction) that has one.
      let found = -1;
      let ran = -1;
      for (let i = wanted; i >= 0 && i < count; i += dir) {
        if (!(await runOnStep(i, my))) return;
        ran = i;
        if (resolve(stepAt(i)).length) {
          found = i;
          break;
        }
      }
      // None: show the wanted step anyway, centered and without arrow.
      if (found < 0) {
        found = wanted;
        if (ran !== wanted && !(await runOnStep(wanted, my))) return;
      }

      current = found;
      flushSync(() => setIndex(found));

      const targets = resolve(stepAt(found));
      const anchorEl = targets[0];
      if (anchorEl && scrollToAnchor(anchorEl, targets)) await settle(anchorEl, my);
      if (my !== token || closed) return;

      ro?.disconnect();
      ro?.observe(card!);
      for (const el of targets) ro?.observe(el);

      shown = true;
      pending = null;
      layer!.dataset.phase = 'shown';
      apply(everShown); // the first placement appears in place (fade), later ones glide
      if (!everShown) {
        everShown = true;
        layer!.dataset.ready = '';
      }

      // Focus: keep it on the card's own button when the step came from there, otherwise the card.
      const active = doc.activeElement;
      if (!(active instanceof HTMLElement) || !card!.contains(active) || (active as HTMLButtonElement).disabled) {
        card!.focus({ preventScroll: true });
      }
      const step = stepAt(found);
      const copyNow = propsRef.current.copy;
      if (step) announce(`${copyNow.progress(found + 1, count)}. ${step.title}`);
      if (step) propsRef.current.onShown?.(step, found);
    }

    // Input during a step change is ignored (a double click must not skip a step or finish the tour).
    function next() {
      if (pending !== null) return;
      if (current >= propsRef.current.steps.length - 1) finish('done');
      else void goTo(current + 1, 1);
    }

    function prev() {
      if (pending === null && current > 0) void goTo(current - 1, -1);
    }

    function release() {
      if (released) return;
      released = true;
      const active = doc.activeElement;
      const lost = !active || active === doc.body || layer!.contains(active);
      if (lost && prevFocus?.isConnected) prevFocus.focus({ preventScroll: true });
    }

    function finish(reason: TourCloseReason) {
      if (closed) return;
      closed = true;
      closedAt = performance.now();
      token++;
      const last = current >= 0 ? current : (pending ?? 0);
      propsRef.current.onClose(reason, last);
    }

    // ---- input ---------------------------------------------------------------------
    function onKeyDown(e: KeyboardEvent) {
      if (closed || e.isComposing) return;
      if (e.key === 'Escape') {
        // Ours, not the parent <dialog>'s: a canceled keydown makes no close request.
        e.preventDefault();
        e.stopImmediatePropagation();
        finish('escape');
        return;
      }
      if (e.key === 'Tab') {
        const items = [...card!.querySelectorAll<HTMLElement>(FOCUSABLE)];
        const active = doc.activeElement;
        e.preventDefault();
        if (!items.length) return card!.focus({ preventScroll: true });
        const at = items.indexOf(active as HTMLElement);
        const nextIndex = e.shiftKey ? (at <= 0 ? items.length - 1 : at - 1) : at < 0 || at === items.length - 1 ? 0 : at + 1;
        items[nextIndex].focus();
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey || isEditable(e.target)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (current < propsRef.current.steps.length - 1) next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    }

    /** A native <dialog> around us closes on Escape / Android back via `cancel`: keep it open. */
    function onCancel(e: Event) {
      const target = e.target;
      if (!(target instanceof HTMLDialogElement) || !target.contains(layer)) return;
      if (closed && performance.now() - closedAt > 150) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      finish('escape');
    }

    function onFocusIn(e: FocusEvent) {
      if (closed || !shown) return;
      if (e.target instanceof Node && !layer!.contains(e.target)) card!.focus({ preventScroll: true });
    }

    win.addEventListener('keydown', onKeyDown, true);
    win.addEventListener('cancel', onCancel, true);
    doc.addEventListener('focusin', onFocusIn, true);
    win.addEventListener('resize', schedule);
    win.visualViewport?.addEventListener('resize', schedule);
    win.visualViewport?.addEventListener('scroll', schedule);
    doc.addEventListener('scroll', schedule, { capture: true, passive: true });

    function stop() {
      closed = true;
      token++;
      release();
    }

    api.current = { next, prev, finish, stop };
    void goTo(propsRef.current.initialStep ?? 0, 1);

    return () => {
      token++;
      closed = true;
      if (raf) win.cancelAnimationFrame(raf);
      ro?.disconnect();
      win.removeEventListener('keydown', onKeyDown, true);
      win.removeEventListener('cancel', onCancel, true);
      doc.removeEventListener('focusin', onFocusIn, true);
      win.removeEventListener('resize', schedule);
      win.visualViewport?.removeEventListener('resize', schedule);
      win.visualViewport?.removeEventListener('scroll', schedule);
      doc.removeEventListener('scroll', schedule, true);
      release();
      api.current = null;
    };
  }, []);

  // Closed from outside (or by us): give focus back as the fade starts.
  useEffect(() => {
    if (!closing) return;
    // Also when the parent closed us without onClose (e.g. it closed the dialog): stop handling input.
    api.current?.stop();
  }, [closing]);

  const step = steps[index];
  if (!step) return null;
  const last = index === total - 1;
  const progressId = `${ids}-progress`;
  const titleId = `${ids}-title`;
  const bodyId = `${ids}-body`;

  return (
    <div ref={layerRef} className="tour" data-phase="moving" data-state={closing ? 'closing' : 'open'} data-leader="off">
      <div ref={veilRef} className="tour-veil" aria-hidden="true" />
      <div ref={catchRef} className="tour-catch" aria-hidden="true" onPointerDown={(e) => e.preventDefault()} />
      <div ref={ringsRef} className="tour-rings" aria-hidden="true" />
      <div ref={leaderRef} className="tour-leader" aria-hidden="true" />
      <div ref={dotRef} className="tour-dot" aria-hidden="true" />
      <section
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label={copy.label}
        aria-describedby={`${progressId} ${titleId} ${bodyId}`}
        tabIndex={-1}
        className="tour-card theme-light"
        data-mode="center"
        data-edge="none"
      >
        <span className="tour-arrow" aria-hidden="true" />
        <div ref={mainRef} className="tour-main" role="group" aria-labelledby={titleId}>
          <div className="tour-head">
          <PhaseGlyph phase={(index + 1) / total} size={18} className="tour-glyph" />
          <p id={progressId} className="tour-progress">
            {copy.progress(index + 1, total)}
          </p>
          {step.tag ? <span className="tour-tag">{step.tag}</span> : null}
        </div>
        <h2 id={titleId} className="tour-title">
          {step.title}
        </h2>
          <p id={bodyId} className="tour-body">
            {step.body}
          </p>
        </div>
        <div className="tour-scale" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.id} data-state={i < index ? 'past' : i === index ? 'now' : 'next'} />
          ))}
        </div>
        <div className="tour-actions">
          {!last ? (
            <button type="button" className="tour-skip" onClick={() => api.current?.finish('skip')}>
              {copy.skip}
            </button>
          ) : null}
          {index > 0 ? (
            <button type="button" className="btn btn-ghost btn-sm tour-btn" onClick={() => api.current?.prev()}>
              {copy.prev}
            </button>
          ) : null}
          <button type="button" className="btn btn-primary btn-sm tour-btn" onClick={() => api.current?.next()}>
            {last ? copy.done : copy.next}
          </button>
        </div>
        <button type="button" className="tour-close" aria-label={copy.close} onClick={() => api.current?.finish('skip')}>
          <X size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </section>
      <p ref={liveRef} className="tour-sr" aria-live="polite" aria-atomic="true" />
    </div>
  );
}
