import type { KeyboardEvent } from 'react';

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab / Shift+Tab cycling inside the layer (a modal <dialog> lets focus reach the
 * browser UI after its last control). The guide's card handles its own Tab first.
 */
export function cycleFocus(e: KeyboardEvent<HTMLDialogElement>) {
  if (e.key !== 'Tab' || e.defaultPrevented) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) => !el.closest('[inert]') && el.getClientRects().length > 0 && (el.checkVisibility?.({ visibilityProperty: true }) ?? true),
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !e.currentTarget.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !e.currentTarget.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}
