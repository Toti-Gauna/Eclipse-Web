import { BASE_PATH } from '@/lib/env';
import { AGENCY_HASHES } from './navLinks';

/** Hash patterns of the v3 home that now live on /agency/: a section id, a level row `plan-<id>`, a pricing anchor `pr-…` (tabs, families). */
const AGENCY_HASH_RE = new RegExp(`^(?:${AGENCY_HASHES.map((h) => h.replace(/[-]/g, '\\-')).join('|')}|plan-[a-z0-9-]+|pr-[a-z0-9-]+)$`);

export function isAgencyHash(hash: string): boolean {
  return AGENCY_HASH_RE.test(hash);
}

/**
 * Links shared before 28/10/2026 point at the v3 home's sections (`/es/#precios`, `/es/#contacto`…).
 * Those sections moved to /agency/ with the same ids. This inline script (first thing in the home's
 * <main>, so it runs before anything paints) sends such a hash there at once — `replace`, so Back
 * doesn't bounce — keeping the query. Any other hash, and the showroom's own query (`?rubro=`), stay.
 */
export function legacyAnchorsScript(locale: string): string {
  const target = JSON.stringify(`${BASE_PATH}/${locale}/agency/`);
  return `(function(){try{var h=decodeURIComponent(location.hash.slice(1));if(h&&${AGENCY_HASH_RE}.test(h))location.replace(${target}+location.search+'#'+encodeURIComponent(h));}catch(e){}})();`;
}
