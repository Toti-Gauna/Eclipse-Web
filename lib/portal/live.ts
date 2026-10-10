/**
 * Live portal (v8): routes and small pure helpers shared by the screens that talk to the
 * backend. Demo-mode routes stay in ./routes.ts.
 */
import { isUuid } from '@/lib/api/uuid';

export const livePaths = {
  login: '/portal/',
  register: '/portal/registro/',
  verifyEmail: '/portal/verificar-email/',
  resetPassword: '/portal/recuperar-contrasena/',
  projects: '/portal/proyectos/',
  /** Real ids are only known at runtime: a static page that reads `?id=<uuid>`. */
  project: (id: string) => `/portal/proyecto/?id=${encodeURIComponent(id)}`,
  requests: '/portal/solicitudes/',
  request: (id: string) => `/portal/solicitud/?id=${encodeURIComponent(id)}`,
} as const;

/** Where to send the visitor after login/registration. Allowlist of internal path prefixes only. */
const NEXT_PREFIXES = ['/portal/', '/plan/'];

/**
 * Validates a `next` parameter: a locale-less internal path (optionally with a query) under
 * the allowed prefixes. Anything else (other origins, `//host`, backslashes, control
 * characters, `javascript:`) is dropped, so the login page can never be used to redirect away.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 700) return null;
  if (/[\u0000-\u001f\\]/.test(raw)) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  let url: URL;
  try {
    url = new URL(raw, 'https://placeholder.invalid');
  } catch {
    return null;
  }
  if (url.origin !== 'https://placeholder.invalid') return null;
  if (!NEXT_PREFIXES.some((p) => url.pathname.startsWith(p))) return null;
  // Never bounce back into the auth screens themselves.
  if ([livePaths.login, livePaths.register, livePaths.verifyEmail, livePaths.resetPassword].includes(url.pathname as never)) return null;
  return `${url.pathname}${url.search}`;
}

/** Login URL that returns to `next` afterwards. */
export function loginHref(next?: string | null): string {
  const safe = safeNext(next ?? null);
  return safe ? `${livePaths.login}?next=${encodeURIComponent(safe)}` : livePaths.login;
}

export function registerHref(next?: string | null): string {
  const safe = safeNext(next ?? null);
  return safe ? `${livePaths.register}?next=${encodeURIComponent(safe)}` : livePaths.register;
}

/** The `id` query value if it is a UUID, else null (the screens then show "not found"). */
export function idFromSearch(search: string | URLSearchParams): string | null {
  const params = typeof search === 'string' ? new URLSearchParams(search.replace(/^\?/, '')) : search;
  const id = params.get('id');
  return isUuid(id) ? id : null;
}

/**
 * One-use tokens in links (email verification, password reset) travel in the URL
 * fragment (`#token=…`). Reads it from a hash string. Returns null when absent/odd-shaped.
 */
export function tokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const token = params.get('token');
  // Tokens are url-safe base64 (256 bits); anything else is not worth sending.
  return token && /^[A-Za-z0-9_-]{16,256}$/.test(token) ? token : null;
}

/** Password rules of the API (docs/auth.md): 12–128 characters, no trimming. */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export type PasswordProblem = 'short' | 'long' | null;

export function passwordProblem(password: string): PasswordProblem {
  const length = Array.from(password).length; // Unicode code points, like the API
  if (length < PASSWORD_MIN) return 'short';
  if (length > PASSWORD_MAX) return 'long';
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const looksLikeEmail = (value: string): boolean => value.length <= 254 && EMAIL.test(value);

/** E.164 as the API wants it: "+" and 8–15 digits, first digit not 0. */
export const isE164 = (value: string): boolean => /^\+[1-9][0-9]{7,14}$/.test(value);

/**
 * Normalizes what a person types ("+54 9 223 555-0000", "(011) 4000 1234") into E.164 shape
 * WITHOUT guessing a country: only separators are stripped, a "00" prefix becomes "+".
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  return digits;
}
