/**
 * The showroom's one owner of `pushState` / `replaceState` (lote 1.1 §7, built in 1.3).
 * The selector and the demo layer ask it; neither touches `history` itself.
 *
 * What it writes: the version and the level in `history.state` ({ eclipseShowroom }), and, for
 * the demo view, the contract's query (`?rubro=…&vista=guia`, lib/showroom.ts). Nothing about
 * the visitor. SmoothAnchors' hash entries and the rest of the site's history are not ours.
 *
 * Levels: `selector` keeps the URL (an in-memory state, §5.2.8); `view` carries the query.
 */
import { isShowroomMarker, stripShowroomParams, withShowroomParams, type ShowroomHistoryMarker } from '@/lib/showroom';
import type { VerticalId } from '@/lib/content';
import type { ShowroomRubro } from '@/lib/showroom';

const KEY = 'eclipseShowroom';

interface Stored {
  [KEY]?: unknown;
}

/** The marker of the entry we are standing on, if it is ours. */
export function currentMarker(): ShowroomHistoryMarker | null {
  const value = (window.history.state as Stored | null)?.[KEY];
  return isShowroomMarker(value) ? value : null;
}

const state = (level: ShowroomHistoryMarker['level']): Stored => ({
  [KEY]: { v: 1, level } satisfies ShowroomHistoryMarker,
});

/** Only the home's vertical that has an entry in the contract (the demos in standby have none). */
export function rubroOfVertical(id: VerticalId): ShowroomRubro | null {
  return id === 'inmobiliarias' ? 'inmobiliarias' : null;
}

const hereWith = (search: string) => `${window.location.pathname}${search}${window.location.hash}`;

/** A new entry for the selector (same URL). */
export function pushSelector(): void {
  window.history.pushState(state('selector'), '');
}

/** Marks the entry we are on as the selector's (a direct load, or the hand-off back). */
export function markSelector(): void {
  window.history.replaceState(state('selector'), '', hereWith(window.location.search));
}

/**
 * The demo view's entry. `push`: a new one with the contract's query. `replace`: the same entry
 * with the query written (the selector's, after the hand-off). `mark`: the same entry and URL,
 * only our marker (a direct load, whose URL already says what it says, `area` included).
 */
export function writeView(mode: 'push' | 'replace' | 'mark', rubro: ShowroomRubro | null): void {
  if (mode === 'mark') {
    window.history.replaceState(state('view'), '', hereWith(window.location.search));
    return;
  }
  const search = rubro
    ? withShowroomParams(window.location.search, {
        rubro,
        vista: 'guia',
        area: null,
      })
    : window.location.search;
  const url = hereWith(search);
  if (mode === 'push') window.history.pushState(state('view'), '', url);
  else window.history.replaceState(state('view'), '', url);
}

/** Drops the contract's parameters and our marker from the entry we are on (no new entry). */
export function cleanShowroomUrl(): void {
  window.history.replaceState(null, '', hereWith(stripShowroomParams(window.location.search)));
}

/** The home's H1: where focus goes when there is no opener to return to (direct entry, invalid URL). */
export function focusHomeHeading(): void {
  const h1 = document.querySelector<HTMLElement>('h1');
  if (!h1) return;
  if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
  h1.focus({ preventScroll: true });
}
