/**
 * The surface theme of "Armá tu plan": the drawer takes the light of the section it was
 * opened from (dawn → light panel, night → dark panel), so it never clashes with the page.
 * Pure DOM reads, done once when the builder opens.
 */
export type SurfaceTheme = 'light' | 'dark';

/** Floating chrome over the page: it says nothing about the section, the header mirrors it. */
const CHROME = '.site-header, .mobile-menu';

function themeOfElement(el: Element | null): SurfaceTheme | null {
  const zone = el?.closest('.theme-light, .theme-dark');
  if (!zone) return null;
  return zone.classList.contains('theme-light') ? 'light' : 'dark';
}

/**
 * The theme for a builder opened from `trigger` (the button pressed, or the focused element).
 * - inside the page: the closest `.theme-light` / `.theme-dark` ancestor;
 * - from the header or its mobile menu: the header's own theme, which already follows the
 *   section under it ([data-header-theme="light"] zones);
 * - nothing usable: dark (the site's default sky).
 */
export function surfaceThemeOf(trigger: Element | null, doc: Document | null = typeof document === 'undefined' ? null : document): SurfaceTheme {
  if (!doc) return 'dark';
  const el = trigger && trigger !== doc.body && trigger !== doc.documentElement ? trigger : null;
  if (!el || el.closest(CHROME)) {
    return themeOfElement(doc.querySelector('.site-header')) ?? 'dark';
  }
  return themeOfElement(el) ?? 'dark';
}
