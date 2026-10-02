/**
 * Public runtime configuration. All values are inlined at build time.
 * See .env.example — every value has a safe placeholder default.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://toti-gauna.github.io/Eclipse-Web').replace(
  /\/$/,
  '',
);

export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP ?? '5492230000000').replace(/\D/g, '');

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_EMAIL ?? 'hola@eclipse.example';

/**
 * Prefixes a root-relative path with the basePath. Use it for anything Next does not
 * prefix on its own: <video src>, <img src> in /public, window.location, absolute
 * fetches to /public files. (next/link, next/font and the router handle it already.)
 */
export function asset(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${clean}`;
}

/** Absolute public URL (canonical, hreflang, OG, JSON-LD). */
export function absoluteUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
