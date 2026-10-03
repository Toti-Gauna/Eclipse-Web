/**
 * Locks page scroll while a modal (<dialog>) is open. Reference-counted so
 * nested dialogs (menu → builder) work. We avoid a CSS `html:has(dialog[open])`
 * rule on purpose: :has() on the root makes Chrome re-style the whole document
 * on DOM insertions (measured: ~17 full-document recalcs during load).
 */
let locks = 0;
let previous = '';

export function lockScroll(): () => void {
  if (typeof document === 'undefined') return () => {};
  const root = document.documentElement;
  if (locks === 0) {
    previous = root.style.overflow;
    root.style.overflow = 'hidden';
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) root.style.overflow = previous;
  };
}
