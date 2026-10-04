import type { EstateSpot } from './data';

/** The element each beat target points at (BEAT_FOCUS → `spot`). */
export const SPOTS: Record<EstateSpot, string> = {
  transcript: '.re-transcript',
  chat: '.re-live-chat, .re-live-empty',
  key: '.re-key',
  calendar: 'section[data-tour="visits"]',
  preview: '.re-preview',
  card: '[data-flip="carolina"]',
};

/**
 * Brings a beat's element (`selector`) into view inside the device's own scroller (`.demo-content`), never
 * the page or the "Ver demo" layer (no `scrollIntoView`, which scrolls every ancestor).
 * - `top`: the section just changed — start from the top, as the shell's nav does;
 * - the element already fully visible → nothing moves; otherwise its top comes into view (what
 *   the beat adds — messages, rows — grows below it).
 */
export function revealSpot(root: Element | null, selector: string | null, { top, smooth }: { top: boolean; smooth: boolean }) {
  const box = root?.querySelector<HTMLElement>('.demo-content');
  if (!box) return;
  if (top) box.scrollTop = 0;
  const el = selector ? box.querySelector<HTMLElement>(selector) : null;
  if (!el) return;
  const b = box.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  // The device may be scaled (CSS transforms): measure in the scroller's own pixels.
  const scale = box.clientHeight ? b.height / box.offsetHeight || 1 : 1;
  const pad = 12;
  const above = (r.top - b.top) / scale;
  const below = (r.bottom - b.bottom) / scale;
  // Fully visible: stay. Otherwise its top (what a beat adds grows below: messages, rows).
  const delta = above >= 0 && below <= 0 ? 0 : above - pad;
  if (Math.abs(delta) < 1) return;
  box.scrollTo({ top: box.scrollTop + delta, behavior: smooth && !top ? 'smooth' : 'auto' });
}
