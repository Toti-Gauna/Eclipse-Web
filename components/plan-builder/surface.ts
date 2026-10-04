/**
 * The surface theme of "Armá tu plan": the drawer takes the light of the section it was
 * opened from (dawn → light panel, night → dark panel), so it never clashes with the page.
 * Pure DOM reads, done once when the builder opens.
 */
export type SurfaceTheme = 'light' | 'dark';

/**
 * Floating chrome over the page (the header and its menu, which closes as the builder opens):
 * it says nothing about the section. Other layers (a demo dialog) keep their own theme.
 */
const CHROME = '.site-header, .mobile-menu';

function themeOfElement(el: Element | null): SurfaceTheme | null {
  const zone = el?.closest('.theme-light, .theme-dark');
  if (!zone) return null;
  return zone.classList.contains('theme-light') ? 'light' : 'dark';
}

/** The section the visitor is looking at: what sits in the middle of the viewport, under any chrome. */
function themeInView(doc: Document): SurfaceTheme | null {
  const view = doc.defaultView;
  if (!view || typeof doc.elementsFromPoint !== 'function') return null;
  const hits = doc.elementsFromPoint(view.innerWidth / 2, view.innerHeight / 2);
  for (const hit of hits) {
    if (hit.closest(CHROME)) continue;
    const theme = themeOfElement(hit);
    if (theme) return theme;
  }
  return null;
}

/**
 * The theme for a builder opened from `trigger` (the button pressed, or the focused element).
 * - inside the page: the closest `.theme-light` / `.theme-dark` ancestor;
 * - from the header or its mobile menu, or with no trigger: the section in the
 *   middle of the viewport, then the header's own theme (it follows [data-header-theme] zones);
 * - nothing usable: dark (the site's default sky).
 */
export function surfaceThemeOf(trigger: Element | null, doc: Document | null = typeof document === 'undefined' ? null : document): SurfaceTheme {
  if (!doc) return 'dark';
  const el = trigger && trigger !== doc.body && trigger !== doc.documentElement ? trigger : null;
  if (!el || el.closest(CHROME)) {
    return themeInView(doc) ?? themeOfElement(doc.querySelector('.site-header')) ?? 'dark';
  }
  return themeOfElement(el) ?? 'dark';
}
