/**
 * DOM helpers for "a simulation takes you where it happens" (`useBeatFocus`) and for chats.
 * They only ever scroll the scrollers INSIDE a demo (its content, a browser frame's body) and
 * pan the showcase's sideways scroller — never the page or the "Ver demo" layer, unlike
 * `scrollIntoView`, which scrolls every ancestor. Keyboard focus never moves (but see
 * `keepChatFocus`).
 */

const rootOf = (from: Element | null) => from?.closest('.demo-root') ?? null;

/** Scrolls the demo's content back to the top (a new section starts at its top, like a nav click). */
export function contentToTop(from: Element | null, smooth = false) {
  const content = rootOf(from)?.querySelector<HTMLElement>('.demo-content');
  if (content && content.scrollTop > 0) content.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

/** The section's entrance (`.demo-view`, a translateY) may still be running right after a change. */
function entranceLift(el: Element): number {
  const view = el.closest<HTMLElement>('.demo-view');
  const tf = view ? getComputedStyle(view).transform : 'none';
  if (!tf || tf === 'none') return 0;
  const m = tf.match(/matrix(3d)?\(([^)]+)\)/);
  const v = m ? m[2].split(',').map(Number) : [];
  return (m?.[1] ? v[13] : v[5]) || 0;
}

/**
 * Brings the first element matching `selector` (inside the demo around `from`) into view. Each
 * scroller between it and the demo root, innermost first: nothing moves if it's fully visible;
 * otherwise its top comes into view (what a beat adds — messages, rows — grows below it), with
 * room for what floats over the bottom (the dock, via the scroller's bottom padding). Devices
 * may be scaled (CSS transforms): distances are measured in each scroller's own pixels.
 */
export function revealInDemo(from: Element | null, selector: string, { smooth }: { smooth: boolean }) {
  const root = rootOf(from);
  const el = root?.querySelector(selector);
  if (!root || !el) return;
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
  const lift = entranceLift(el);
  let shift = 0; // how far the inner scrollers already moved the element up (screen px)
  for (let p = el.parentElement; p && p !== root && root.contains(p); p = p.parentElement) {
    const style = getComputedStyle(p);
    if (!/(auto|scroll)/.test(style.overflowY) || p.scrollHeight <= p.clientHeight + 1) continue;
    const box = p.getBoundingClientRect();
    const scale = p.offsetHeight ? box.height / p.offsetHeight || 1 : 1;
    const r = el.getBoundingClientRect();
    const pad = 12;
    const padBottom = Math.max(pad, parseFloat(style.paddingBottom) || 0);
    const above = (r.top - shift - box.top) / scale - lift - pad;
    const below = (r.bottom - shift - box.bottom) / scale - lift + padBottom;
    if (above >= 0 && below <= 0) continue;
    const top = Math.max(0, Math.min(p.scrollHeight - p.clientHeight, p.scrollTop + above));
    const d = top - p.scrollTop;
    if (Math.abs(d) < 1) continue;
    p.scrollTo({ top, behavior });
    shift += d * scale;
  }
  // The layer's tabs layout pans the desktop view sideways (showcase «.sc-scroller»): pan to it too.
  const pan = root.closest<HTMLElement>('.sc-scroller');
  if (pan && pan.scrollWidth > pan.clientWidth + 1) {
    const box = pan.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const d = r.right > box.right ? Math.min(r.right - box.right + 12, r.left - box.left - 12) : r.left < box.left ? r.left - box.left - 12 : 0;
    if (Math.abs(d) >= 1) pan.scrollTo({ left: pan.scrollLeft + d, behavior });
  }
}

/**
 * Keeps keyboard focus inside a chat when the quick reply that had it goes away (the chips are
 * replaced by the next step's): focus moves to the next reply (`also`: extra reply selectors),
 * else the conversation log, without scrolling anything. Call it right before storing the pick.
 * `within`: the chat (default: the `.demo-chat` around the focused element). A tap on a touch
 * screen doesn't focus the chip (Safari), so it does nothing there.
 */
export function keepChatFocus(within?: HTMLElement | null, also = '') {
  const box = within ?? document.activeElement?.closest<HTMLElement>('.demo-chat') ?? null;
  if (!box || !box.contains(document.activeElement)) return;
  requestAnimationFrame(() => {
    const a = document.activeElement;
    if (a && a !== document.body && box.contains(a) && !(a as HTMLButtonElement).disabled) return;
    const replies = `.demo-chat-chip, .demo-chat-button:not(:disabled)${also ? `, ${also}` : ''}`;
    const next = box.querySelector<HTMLElement>(replies) ?? box.querySelector<HTMLElement>('.demo-chat-log');
    next?.focus({ preventScroll: true });
  });
}
