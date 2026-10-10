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

export interface PortalConfig {
  /** Absolute API origin without trailing slash, or '' when there is no backend. */
  apiBaseUrl: string;
  /** `live` only when an API URL is configured AND NEXT_PUBLIC_PORTAL_MODE=live. */
  mode: 'live' | 'demo';
}

/**
 * Resolves the backend wiring from the raw env values (pure, so it is unit-tested).
 * No API URL (or an invalid one) = the site behaves as a static demo: fixtures labelled
 * "Demo" and the WhatsApp flow. `live` needs both the URL and the explicit mode.
 */
export function resolvePortalConfig(env: { apiBaseUrl?: string; mode?: string }): PortalConfig {
  const raw = (env.apiBaseUrl ?? '').trim().replace(/\/+$/, '');
  let apiBaseUrl = '';
  if (raw) {
    try {
      const url = new URL(raw);
      if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password && !url.search && !url.hash && (url.pathname === '/' || url.pathname === '')) {
        apiBaseUrl = url.origin;
      }
    } catch {
      apiBaseUrl = '';
    }
  }
  const mode = apiBaseUrl && (env.mode ?? '').trim().toLowerCase() === 'live' ? 'live' : 'demo';
  return { apiBaseUrl, mode };
}

const portalConfig = resolvePortalConfig({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  mode: process.env.NEXT_PUBLIC_PORTAL_MODE,
});

/** Backend origin (e.g. http://localhost:3000), '' when the site runs without one. */
export const API_BASE_URL = portalConfig.apiBaseUrl;

/** `live`: the portal and plan requests talk to the real backend. `demo`: fixtures, never the network. */
export const PORTAL_MODE = portalConfig.mode;
export const IS_LIVE = PORTAL_MODE === 'live';

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
