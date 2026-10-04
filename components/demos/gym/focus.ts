/**
 * Small DOM helpers for the beat → screen jumps and the chats (local to this demo; candidates
 * for the kit). They only ever scroll the scrollers INSIDE the demo (its content, a browser
 * frame's body) and pan the showcase's sideways scroller — never the page or the "Ver demo"
 * layer, unlike `scrollIntoView`.
 */

/** Scrolls the demo's content back to the top (a new section starts at its top, like a nav click). */
export function contentToTop(from: Element | null) {
  from?.closest('.demo-root')?.querySelector('.demo-content')?.scrollTo({ top: 0 });
}

/**
 * Brings `[data-beat="<mark>"]` into view: every scroller between it and the demo root moves
 * just enough (innermost first), with room for what floats over the content's bottom (the dock).
 */
export function revealInDemo(from: Element | null, mark: string, reduced: boolean) {
  const root = from?.closest('.demo-root');
  const el = root?.querySelector(`[data-beat="${mark}"]`);
  if (!root || !el) return;
  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
  let shift = 0; // how far the inner scrolls already moved the element up
  for (let p = el.parentElement; p && p !== root && root.contains(p); p = p.parentElement) {
    const style = getComputedStyle(p);
    if (!/(auto|scroll)/.test(style.overflowY) || p.scrollHeight <= p.clientHeight + 1) continue;
    const box = p.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const pad = 12;
    const padBottom = Math.max(pad, parseFloat(style.paddingBottom) || 0);
    const above = r.top - shift - box.top - pad;
    const below = r.bottom - shift - box.bottom + padBottom;
    let d = above < 0 ? above : below > 0 ? Math.min(below, above) : 0;
    const top = Math.max(0, Math.min(p.scrollHeight - p.clientHeight, p.scrollTop + d));
    d = top - p.scrollTop;
    if (Math.abs(d) < 1) continue;
    p.scrollTo({ top, behavior });
    shift += d;
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
 * replaced by the next step's): focus moves to the next reply, else the conversation log —
 * (the chat is `within`, or the `.demo-chat` around the focused element)
 * without scrolling anything. Call it right before storing the pick. A tap on a touch screen
 * doesn't focus the chip (Safari), so it does nothing there.
 */
export function keepChatFocus(within?: HTMLElement | null) {
  const box = within ?? document.activeElement?.closest<HTMLElement>('.demo-chat') ?? null;
  if (!box || !box.contains(document.activeElement)) return;
  requestAnimationFrame(() => {
    const a = document.activeElement;
    if (a && a !== document.body && box.contains(a) && !(a as HTMLButtonElement).disabled) return;
    const next =
      box.querySelector<HTMLElement>('.demo-chat-chip, .demo-chat-button:not(:disabled)') ?? box.querySelector<HTMLElement>('.demo-chat-log');
    next?.focus({ preventScroll: true });
  });
}
