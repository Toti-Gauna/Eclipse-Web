/**
 * Browser-only helpers for the builder: clipboard with a fallback, and the
 * sessionStorage copy of the plan (switching language keeps it).
 */
import { decodePlanState, encodePlanState, type PlanState } from '@/lib/plan-url';

export const PLAN_STORAGE_KEY = 'eclipse:plan';

/** Fired by BuilderHost on /plan: the page builder applies the preset instead of opening the drawer. */
export const BUILDER_FOCUS_EVENT = 'eclipse:builder-focus';

export function readStoredPlan(): PlanState | null {
  try {
    const raw = window.sessionStorage.getItem(PLAN_STORAGE_KEY);
    return raw === null ? null : decodePlanState(raw);
  } catch {
    return null;
  }
}

export function writeStoredPlan(state: PlanState): void {
  try {
    window.sessionStorage.setItem(PLAN_STORAGE_KEY, encodePlanState(state));
  } catch {
    // Storage blocked: the plan still lives in memory and in the URL.
  }
}

/**
 * Copies text. Uses the async Clipboard API when available and falls back to a
 * hidden textarea + execCommand. `container` must be inside the open modal (if
 * any): content outside a modal <dialog> is inert and can't be selected.
 */
export async function copyText(text: string, container?: HTMLElement | null): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  const previous = document.activeElement as HTMLElement | null;
  const area = document.createElement('textarea');
  try {
    area.value = text;
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    (container ?? document.body).appendChild(area);
    area.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
    previous?.focus({ preventScroll: true });
  }
}
