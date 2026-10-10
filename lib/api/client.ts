/**
 * Browser client for the Eclipse backend (/api/v1). One instance per page.
 *
 * Security model (see docs/integration.md):
 * - The session lives in HttpOnly cookies set by the API; this code never sees or stores
 *   them. Every request is `credentials: 'include'` and the browser sends the Origin.
 * - CSRF: anonymous POSTs carry the preauth token from `GET /auth/csrf`; authenticated
 *   POSTs carry the session token from login/refresh (or `GET /auth/client/csrf` after a
 *   reload). Both live in memory only — never in storage, cookies we set or URLs.
 * - A 401 on an authenticated call triggers ONE refresh (single-flight, so concurrent
 *   calls share it: the backend revokes a family that reuses a refresh) and ONE retry.
 *   If the refresh is refused the session is gone: listeners are told and the call fails
 *   with SESSION_EXPIRED.
 * - Bodies are never logged, and errors carry no response text.
 */
import { ApiError, errorFromResponse } from './errors';
import { newUuid } from './uuid';

export type AuthMode = 'none' | 'preauth' | 'session';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Path under /api/v1, starting with "/". */
  path: string;
  body?: unknown;
  /** none: public read · preauth: anonymous mutation · session: needs the client session. */
  auth?: AuthMode;
  /** UUIDv4. The caller keeps it to retry the same submission and renews it for a new one. */
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Do not refresh on 401 (used by the session calls themselves). */
  noRefresh?: boolean;
}

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Default per-request timeout. */
  timeoutMs?: number;
  /** How long a preauth token is reused (the API's cookie lasts 10 min). */
  preauthTtlMs?: number;
  now?: () => number;
  uuid?: () => string;
}

export interface Download {
  blob: Blob;
  fileName: string | null;
  mediaType: string;
}

const API_PREFIX = '/api/v1';
const DEFAULT_TIMEOUT_MS = 15_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const PREAUTH_TTL_MS = 5 * 60_000;

const isMutation = (method: string) => method !== 'GET';

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const doFetch: typeof fetch = options.fetch ?? ((...args) => globalThis.fetch(...args));
  const now = options.now ?? Date.now;
  const uuid = options.uuid ?? newUuid;
  const defaultTimeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const preauthTtl = options.preauthTtlMs ?? PREAUTH_TTL_MS;

  // In-memory only. Never persisted anywhere.
  let preauth: { token: string; at: number } | null = null;
  let preauthInFlight: Promise<string> | null = null;
  let sessionCsrf: string | null = null;
  let csrfInFlight: Promise<string | null> | null = null;
  let refreshInFlight: Promise<void> | null = null;
  const lostListeners = new Set<() => void>();

  const url = (path: string) => `${baseUrl}${API_PREFIX}${path}`;

  function emitLost() {
    sessionCsrf = null;
    for (const listener of [...lostListeners]) {
      try {
        listener();
      } catch {
        /* a listener must not break the others */
      }
    }
  }

  /** One fetch with timeout + caller abort. Returns the raw Response or throws ApiError. */
  async function send(
    path: string,
    init: { method: string; headers: Record<string, string>; body?: string },
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<Response> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }
    try {
      return await doFetch(url(path), {
        method: init.method,
        headers: init.headers,
        body: init.body,
        credentials: 'include',
        cache: 'no-store',
        redirect: 'error',
        signal: controller.signal,
      });
    } catch {
      if (timedOut) throw new ApiError('TIMEOUT', 0);
      if (signal?.aborted) throw new ApiError('ABORTED', 0);
      throw new ApiError('NETWORK', 0);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  async function readJson(res: Response): Promise<unknown> {
    if (res.status === 204) return undefined;
    const text = await res.text().catch(() => '');
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError('INVALID_RESPONSE', res.status, { requestId: res.headers.get('x-request-id') });
    }
  }

  async function toError(res: Response): Promise<ApiError> {
    let body: unknown = null;
    try {
      body = JSON.parse(await res.text());
    } catch {
      body = null;
    }
    return errorFromResponse(res.status, body, res.headers);
  }

  // ---- CSRF ------------------------------------------------------------------------

  async function fetchPreauth(): Promise<string> {
    const res = await send('/auth/csrf', { method: 'GET', headers: { Accept: 'application/json' } }, defaultTimeout);
    if (!res.ok) throw await toError(res);
    const json = (await readJson(res)) as { csrfToken?: unknown } | undefined;
    if (!json || typeof json.csrfToken !== 'string' || !json.csrfToken) throw new ApiError('INVALID_RESPONSE', res.status);
    preauth = { token: json.csrfToken, at: now() };
    return json.csrfToken;
  }

  async function getPreauth(force = false): Promise<string> {
    if (!force && preauth && now() - preauth.at < preauthTtl) return preauth.token;
    preauthInFlight ??= fetchPreauth().finally(() => {
      preauthInFlight = null;
    });
    return preauthInFlight;
  }

  /** `GET /auth/client/csrf`: the session token again after a reload (cookie-based). null = no session. */
  async function recoverCsrf(): Promise<string | null> {
    csrfInFlight ??= (async () => {
      const res = await send('/auth/client/csrf', { method: 'GET', headers: { Accept: 'application/json' } }, defaultTimeout);
      if (res.status === 401 || res.status === 403) return null;
      if (!res.ok) throw await toError(res);
      const json = (await readJson(res)) as { csrfToken?: unknown } | undefined;
      if (!json || typeof json.csrfToken !== 'string' || !json.csrfToken) throw new ApiError('INVALID_RESPONSE', res.status);
      sessionCsrf = json.csrfToken;
      return json.csrfToken;
    })().finally(() => {
      csrfInFlight = null;
    });
    return csrfInFlight;
  }

  // ---- Refresh (single flight) -----------------------------------------------------

  async function doRefresh(): Promise<void> {
    const token = sessionCsrf ?? (await recoverCsrf());
    if (!token) {
      emitLost();
      throw new ApiError('SESSION_EXPIRED', 401);
    }
    const res = await send(
      '/auth/client/refresh',
      { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: '{}' },
      defaultTimeout,
    );
    if (res.status === 401 || res.status === 403) {
      // 403 can be a stale CSRF after a reload in another tab: one cookie-based recovery before giving up.
      if (res.status === 403) {
        const fresh = await recoverCsrf();
        if (fresh && fresh !== token) return doRefresh();
      }
      emitLost();
      throw new ApiError('SESSION_EXPIRED', 401, { requestId: res.headers.get('x-request-id') });
    }
    if (!res.ok) throw await toError(res);
    const json = (await readJson(res)) as { csrfToken?: unknown } | undefined;
    if (json && typeof json.csrfToken === 'string' && json.csrfToken) sessionCsrf = json.csrfToken;
    else if (!(await recoverCsrf())) {
      emitLost();
      throw new ApiError('SESSION_EXPIRED', 401);
    }
  }

  function refresh(): Promise<void> {
    refreshInFlight ??= doRefresh().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  // ---- Core request ----------------------------------------------------------------

  interface Attempt {
    preauthRetried: boolean;
    refreshed: boolean;
    csrfRetried: boolean;
  }

  async function execute(opts: RequestOptions, raw: boolean, attempt: Attempt): Promise<Response> {
    const method = opts.method ?? 'GET';
    const auth = opts.auth ?? 'none';
    const headers: Record<string, string> = { Accept: raw ? '*/*' : 'application/json' };
    let body: string | undefined;
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

    let sentCsrf: string | null = null;
    if (auth === 'preauth') {
      sentCsrf = await getPreauth();
      headers['X-CSRF-Token'] = sentCsrf;
    } else if (auth === 'session' && isMutation(method)) {
      sentCsrf = sessionCsrf ?? (await recoverCsrf());
      if (!sentCsrf) {
        emitLost();
        throw new ApiError('SESSION_EXPIRED', 401);
      }
      headers['X-CSRF-Token'] = sentCsrf;
    }

    const res = await send(opts.path, { method, headers, body }, opts.timeoutMs ?? defaultTimeout, opts.signal);
    if (res.ok) return res;

    if (auth === 'preauth' && res.status === 403 && !attempt.preauthRetried) {
      // Expired or missing preauth pair: fetch a new one and try once more.
      preauth = null;
      await getPreauth(true);
      return execute(opts, raw, { ...attempt, preauthRetried: true });
    }

    if (auth === 'session') {
      if (res.status === 401 && !opts.noRefresh && !attempt.refreshed) {
        await refresh(); // throws SESSION_EXPIRED when the session is really gone
        return execute(opts, raw, { ...attempt, refreshed: true });
      }
      if (res.status === 403 && isMutation(method) && !attempt.csrfRetried) {
        const fresh = await recoverCsrf();
        if (fresh && fresh !== sentCsrf) return execute(opts, raw, { ...attempt, csrfRetried: true });
      }
      if (res.status === 401) {
        emitLost();
        throw new ApiError('SESSION_EXPIRED', 401, { requestId: res.headers.get('x-request-id') });
      }
    }
    throw await toError(res);
  }

  /** Like `request`, but also returns the HTTP status (201 created vs 200 replay). */
  async function requestWithStatus<T = unknown>(opts: RequestOptions): Promise<{ status: number; data: T }> {
    const res = await execute(opts, false, { preauthRetried: false, refreshed: false, csrfRetried: false });
    return { status: res.status, data: (await readJson(res)) as T };
  }

  async function request<T = unknown>(opts: RequestOptions): Promise<T> {
    return (await requestWithStatus<T>(opts)).data;
  }

  /** Authenticated file download (fetch with credentials → Blob). The URL is never exposed as a link. */
  async function download(path: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<Download> {
    const res = await execute(
      { path, auth: 'session', signal: opts.signal, timeoutMs: opts.timeoutMs ?? DOWNLOAD_TIMEOUT_MS },
      true,
      { preauthRetried: false, refreshed: false, csrfRetried: false },
    );
    let blob: Blob;
    try {
      blob = await res.blob();
    } catch {
      throw new ApiError('NETWORK', 0);
    }
    return {
      blob,
      fileName: fileNameFrom(res.headers.get('content-disposition')),
      mediaType: res.headers.get('content-type') ?? blob.type ?? 'application/octet-stream',
    };
  }

  return {
    request,
    requestWithStatus,
    download,
    newIdempotencyKey: uuid,
    /** Called by the auth endpoints after login/refresh responses. */
    setSessionCsrf(token: string | null) {
      sessionCsrf = token;
    },
    hasSessionCsrf: () => sessionCsrf !== null,
    /** Forget everything held in memory (logout, session lost). */
    clearSession() {
      sessionCsrf = null;
    },
    /** Drop the cached preauth token (e.g. after the preauth cookie may have changed). */
    resetPreauth() {
      preauth = null;
    },
    /** Told when the session is gone for good (refresh refused / no session). */
    onSessionLost(listener: () => void) {
      lostListeners.add(listener);
      return () => {
        lostListeners.delete(listener);
      };
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Reads `filename*=UTF-8''…` or `filename="…"` (RFC 6266); never trusts path separators. */
export function fileNameFrom(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  let name: string | null = null;
  if (star) {
    try {
      name = decodeURIComponent(star[1].trim());
    } catch {
      name = null;
    }
  }
  if (!name) {
    const plain = /filename\s*=\s*"([^"]*)"/i.exec(header) ?? /filename\s*=\s*([^;]+)/i.exec(header);
    name = plain ? plain[1].trim() : null;
  }
  if (!name) return null;
  const clean = name.replace(/[\\/\u0000-\u001f]/g, '_').trim();
  return clean || null;
}
