/**
 * The intro film («Eclipse en 40 segundos») plays on EVERY full load of the home (decision of Ignacio, 28/10/2026:
 * «que se vea por cada refresh»), right after the loading screen, and ends with «Activar Eclipse». Nothing is remembered.
 *
 * This inline script runs before the first paint and turns it on (html[data-intro="on"]): the veil (intro.css) covers the
 * page from the first frame, so the hero never flashes between the loader and the film. It stays off when the visitor came
 * for something specific — a link to a section (`#…`, including the old `/#precios` links that legacyAnchors redirects) or
 * to the showroom (`?rubro=`, `?vista=`, `?area=`) — and with `?intro=0` or localStorage `eclipse:intro` = "off" (QA and
 * the e2e suite). Without JS there is no intro. Client navigations to the home never run it (React does not execute
 * inline scripts it inserts), so the film only follows a real load.
 */
export const INTRO_STORAGE_KEY = 'eclipse:intro';
export const INTRO_ATTR = 'data-intro';

export const introScript = (): string =>
  `(function(){try{var d=document.documentElement,s=location.search;if(location.hash.length>1)return;if(/[?&](?:rubro|vista|area)=/.test(s)||/[?&]intro=0(?:&|$)/.test(s))return;try{if(localStorage.getItem('${INTRO_STORAGE_KEY}')==='off')return;}catch(e){}d.setAttribute('${INTRO_ATTR}','on');}catch(e){}})();`;

/** Is the film on for this load (and not finished yet)? */
export function introOn(): boolean {
  return typeof document !== 'undefined' && document.documentElement.getAttribute(INTRO_ATTR) === 'on';
}

/** Ends the intro for this load: the veil goes and the page is the page again. */
export function introDone() {
  if (typeof document !== 'undefined') document.documentElement.setAttribute(INTRO_ATTR, 'done');
}
