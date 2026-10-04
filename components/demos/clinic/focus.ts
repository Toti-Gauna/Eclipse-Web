/**
 * Scrolls a demo view's content (`.demo-content`, inside the device — never the page or the
 * layer around it) so the element marked `data-focus="<spot>"` is in view; `top` = the start.
 * Does nothing when the spot is already near the top (don't fight the visitor). Keyboard
 * focus never moves. `smooth`: false right after a section change (the view is new).
 */
export function revealSpot(root: HTMLElement | null, spot: string, smooth: boolean) {
  const content = root?.querySelector<HTMLElement>('.demo-content');
  if (!content) return;
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
  if (spot === 'top') {
    if (content.scrollTop > 0) content.scrollTo({ top: 0, behavior });
    return;
  }
  const el = content.querySelector<HTMLElement>(`[data-focus~="${spot}"]`);
  if (!el) return;
  const box = content.getBoundingClientRect();
  // The device may be scaled (CSS transform): rects are scaled, scrollTop isn't.
  const scale = content.offsetHeight ? box.height / content.offsetHeight : 1;
  // The section's entrance (`.demo-view`, translateY) is still running right after a change.
  const view = el.closest<HTMLElement>('.demo-view');
  let lift = 0;
  if (view) {
    const tf = getComputedStyle(view).transform;
    if (tf && tf !== 'none') {
      const m = tf.match(/matrix(3d)?\(([^)]+)\)/);
      const v = m ? m[2].split(',').map(Number) : [];
      lift = (m?.[1] ? v[13] : v[5]) || 0;
    }
  }
  const r = el.getBoundingClientRect();
  const top = (r.top - box.top) / (scale || 1) - lift;
  // Already near the top: leave it (what happens there grows downwards: calls, lists).
  if (top >= 0 && top <= content.clientHeight * 0.3) return;
  const pad = parseFloat(getComputedStyle(content).fontSize) * 0.6 || 8;
  content.scrollTo({ top: Math.max(0, content.scrollTop + top - pad), behavior });
}
