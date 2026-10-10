import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createApiClient, fileNameFrom } from '@/lib/api/client';
import { createEndpoints } from '@/lib/api/endpoints';
import { ApiError, errorFromResponse, errorKind, isRetryable } from '@/lib/api/errors';
import { isUuid, newUuid } from '@/lib/api/uuid';
import { resolvePortalConfig } from '@/lib/env';

interface Call {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
  credentials: RequestCredentials | undefined;
}
type Reply = { status: number; json?: unknown; headers?: Record<string, string>; text?: string; blob?: string };
type Handler = (call: Call, n: number) => Reply | Promise<Reply>;

/** A scripted fake of the API: handlers per "METHOD /path"; every call is recorded. */
function fakeServer(handlers: Record<string, Handler | Reply>) {
  const calls: Call[] = [];
  const counts = new Map<string, number>();
  const fetchFn: typeof fetch = async (input, init) => {
    const href = String(input);
    const u = new URL(href);
    const key = `${init?.method ?? 'GET'} ${u.pathname.replace('/api/v1', '')}${u.search}`;
    const call: Call = {
      method: init?.method ?? 'GET',
      path: key.split(' ')[1],
      headers: { ...(init?.headers as Record<string, string>) },
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      credentials: init?.credentials,
    };
    calls.push(call);
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    const h = handlers[key];
    if (!h) return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'x' }, requestId: 'r' }), { status: 404 });
    const reply = typeof h === 'function' ? await h(call, n) : h;
    const body = reply.status === 204 ? null : (reply.text ?? (reply.blob ? reply.blob : JSON.stringify(reply.json ?? {})));
    return new Response(body, { status: reply.status, headers: { 'content-type': 'application/json', ...(reply.headers ?? {}) } });
  };
  return { fetchFn, calls, count: (key: string) => counts.get(key) ?? 0 };
}

const err = (status: number, code: string) => ({ status, json: { error: { code, message: 'x' }, requestId: 'req-1' } });
const profile = { id: 'c1', email: 'a@b.co', displayName: null, emailVerified: true };

function make(handlers: Record<string, Handler | Reply>, extra: Partial<Parameters<typeof createApiClient>[0]> = {}) {
  const server = fakeServer(handlers);
  const api = createApiClient({ baseUrl: 'http://localhost:3000/', fetch: server.fetchFn, ...extra });
  return { ...server, api, ep: createEndpoints(api) };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('api client — transport', () => {
  it('always sends credentials and builds /api/v1 URLs from a base without trailing slash', async () => {
    const { api, calls } = make({ 'GET /catalog/plans': { status: 200, json: { ok: true } } });
    await api.request({ path: '/catalog/plans' });
    expect(calls[0].credentials).toBe('include');
    expect(calls[0].path).toBe('/catalog/plans');
  });

  it('maps API errors to a uniform ApiError with code, status and requestId, without bodies', async () => {
    const { api } = make({ 'GET /x': err(409, 'CONFLICT') });
    const e = (await api.request({ path: '/x' }).catch((x) => x)) as ApiError;
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ code: 'CONFLICT', status: 409, requestId: 'req-1' });
    expect(e.message).not.toMatch(/x$/);
  });

  it('reads Retry-After on 429 and classifies it', async () => {
    const { api } = make({ 'GET /x': { ...err(429, 'TOO_MANY_REQUESTS'), headers: { 'retry-after': '30' } } });
    const e = (await api.request({ path: '/x' }).catch((x) => x)) as ApiError;
    expect(e.retryAfter).toBe(30);
    expect(errorKind(e)).toBe('rateLimited');
  });

  it('turns a network failure into NETWORK and a hang into TIMEOUT', async () => {
    const failing = createApiClient({ baseUrl: 'http://x', fetch: async () => Promise.reject(new TypeError('boom')) });
    expect(await failing.request({ path: '/a' }).catch((e) => e.code)).toBe('NETWORK');

    vi.useFakeTimers();
    const hanging = createApiClient({
      baseUrl: 'http://x',
      timeoutMs: 1000,
      fetch: (_url, init) =>
        new Promise((_res, rej) => {
          (init?.signal as AbortSignal).addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')));
        }),
    });
    const pending = hanging.request({ path: '/a' }).catch((e) => e) as Promise<ApiError>;
    await vi.advanceTimersByTimeAsync(1001);
    const e = await pending;
    expect(e.code).toBe('TIMEOUT');
    expect(isRetryable(e)).toBe(true);
  });

  it('distinguishes a caller abort from a timeout', async () => {
    const controller = new AbortController();
    const api = createApiClient({
      baseUrl: 'http://x',
      fetch: (_url, init) =>
        new Promise((_res, rej) => {
          (init?.signal as AbortSignal).addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')));
        }),
    });
    const pending = api.request({ path: '/a', signal: controller.signal }).catch((e) => e) as Promise<ApiError>;
    controller.abort();
    expect((await pending).code).toBe('ABORTED');
  });

  it('flags a non-JSON 200 as INVALID_RESPONSE', async () => {
    const { api } = make({ 'GET /x': { status: 200, text: '<html>' } });
    expect(await api.request({ path: '/x' }).catch((e) => e.code)).toBe('INVALID_RESPONSE');
  });

  it('errorKind covers the contract statuses', () => {
    const k = (s: number) => errorKind(errorFromResponse(s, null));
    expect([k(400), k(401), k(403), k(404), k(409), k(413), k(429), k(503), k(500)]).toEqual([
      'invalid',
      'sessionExpired',
      'forbidden',
      'notFound',
      'conflict',
      'tooLarge',
      'rateLimited',
      'unavailable',
      'unavailable',
    ]);
  });
});

describe('api client — preauth CSRF (anonymous mutations)', () => {
  const routes = (loginStatuses: number[] = [200]) => ({
    'GET /auth/csrf': (_c: Call, n: number) => ({ status: 200, json: { csrfToken: `pre-${n}` } }),
    'POST /auth/client/login': (c: Call, n: number) => {
      const status = loginStatuses[Math.min(n - 1, loginStatuses.length - 1)];
      return status === 200 ? { status, json: { client: profile, csrfToken: 'sess-1' } } : err(status, 'FORBIDDEN');
    },
  });

  it('fetches the token once, caches it and sends it as X-CSRF-Token', async () => {
    const { ep, calls, count } = make(routes());
    await ep.login('a@b.co', 'Password-12345!');
    await ep.login('a@b.co', 'Password-12345!');
    expect(count('GET /auth/csrf')).toBe(1);
    const logins = calls.filter((c) => c.path === '/auth/client/login');
    expect(logins.map((c) => c.headers['X-CSRF-Token'])).toEqual(['pre-1', 'pre-1']);
  });

  it('re-fetches after the TTL', async () => {
    let t = 0;
    const { ep, count } = make(routes(), { now: () => t, preauthTtlMs: 1000 });
    await ep.login('a@b.co', 'Password-12345!');
    t = 2000;
    await ep.login('a@b.co', 'Password-12345!');
    expect(count('GET /auth/csrf')).toBe(2);
  });

  it('on 403 fetches a new token and retries exactly once', async () => {
    const { ep, calls, count } = make(routes([403, 200]));
    await ep.login('a@b.co', 'Password-12345!');
    expect(count('GET /auth/csrf')).toBe(2);
    expect(calls.filter((c) => c.path === '/auth/client/login').map((c) => c.headers['X-CSRF-Token'])).toEqual(['pre-1', 'pre-2']);
  });

  it('does not loop when the 403 persists', async () => {
    const { ep, count } = make(routes([403]));
    const e = await ep.login('a@b.co', 'Password-12345!').catch((x) => x);
    expect(e.code).toBe('FORBIDDEN');
    expect(count('POST /auth/client/login')).toBe(2);
  });

  it('shares one token bootstrap between concurrent calls', async () => {
    const { ep, count } = make({
      ...routes(),
      'POST /auth/client/register': { status: 202, json: { status: 'accepted' } },
    });
    await Promise.all([ep.register({ email: 'a@b.co', password: 'Password-12345!' }), ep.register({ email: 'c@d.co', password: 'Password-12345!' })]);
    expect(count('GET /auth/csrf')).toBe(1);
  });
});

describe('api client — session CSRF, refresh and retry', () => {
  const base = (over: Record<string, Handler | Reply> = {}) => ({
    'GET /auth/csrf': { status: 200, json: { csrfToken: 'pre' } },
    'POST /auth/client/login': { status: 200, json: { client: profile, csrfToken: 'sess-1' } },
    'GET /auth/client/csrf': { status: 200, json: { csrfToken: 'recovered' } },
    ...over,
  });

  it('keeps the session token from login in memory and sends it on authenticated mutations', async () => {
    const { ep, api, calls } = make(base({ 'POST /client/plan-requests': { status: 201, json: { request: { id: 'r1' } } } }));
    await ep.login('a@b.co', 'Password-12345!');
    expect(api.hasSessionCsrf()).toBe(true);
    await ep.createPlanRequest(
      { catalogVersion: 'v1-x', selection: { goals: [], planId: null, items: ['landing'], billing: 'monthly', vertical: null, founder: false }, contact: { name: 'N', phone: '+5491100000000' } },
      'key-1',
    );
    const post = calls.find((c) => c.path === '/client/plan-requests')!;
    expect(post.headers['X-CSRF-Token']).toBe('sess-1');
    expect(post.headers['Idempotency-Key']).toBe('key-1');
  });

  it('recovers the session token with GET /auth/client/csrf after a reload', async () => {
    const { ep, calls } = make(base({ 'POST /client/plan-requests': { status: 201, json: { request: { id: 'r1' } } } }));
    await ep.createPlanRequest(
      { catalogVersion: 'v1-x', selection: { goals: [], planId: null, items: ['landing'], billing: 'monthly', vertical: null, founder: false }, contact: { name: 'N', phone: '+5491100000000' } },
      'key-2',
    );
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual(['GET /auth/client/csrf', 'POST /client/plan-requests']);
    expect(calls[1].headers['X-CSRF-Token']).toBe('recovered');
  });

  it('does one refresh on 401 and retries once with the rotated token', async () => {
    const { ep, calls, count } = make(
      base({
        'GET /client/projects': (_c, n) => (n === 1 ? err(401, 'UNAUTHORIZED') : { status: 200, json: { projects: [], nextCursor: null } }),
        'POST /auth/client/refresh': { status: 200, json: { client: profile, csrfToken: 'sess-2' } },
      }),
    );
    await ep.login('a@b.co', 'Password-12345!');
    const page = await ep.projects();
    expect(page.items).toEqual([]);
    expect(count('POST /auth/client/refresh')).toBe(1);
    expect(count('GET /client/projects')).toBe(2);
    const refresh = calls.find((c) => c.path === '/auth/client/refresh')!;
    expect(refresh.body).toEqual({});
    expect(refresh.headers['X-CSRF-Token']).toBe('sess-1');
  });

  it('shares ONE refresh between concurrent 401s (the API revokes a family that reuses a refresh)', async () => {
    const { ep, count } = make(
      base({
        'GET /client/projects': (_c, n) => (n === 1 ? err(401, 'UNAUTHORIZED') : { status: 200, json: { projects: [], nextCursor: null } }),
        'GET /client/plan-requests?limit=50': (_c, n) => (n === 1 ? err(401, 'UNAUTHORIZED') : { status: 200, json: { requests: [], nextCursor: null } }),
        'POST /auth/client/refresh': async () => {
          await new Promise((r) => setTimeout(r, 10));
          return { status: 200, json: { client: profile, csrfToken: 'sess-2' } };
        },
      }),
    );
    await ep.login('a@b.co', 'Password-12345!');
    await Promise.all([ep.projects(), ep.planRequests()]);
    expect(count('POST /auth/client/refresh')).toBe(1);
  });

  it('does not retry twice: a second 401 after refreshing ends the session', async () => {
    const lost = vi.fn();
    const { ep, api, count } = make(
      base({
        'GET /client/projects': err(401, 'UNAUTHORIZED'),
        'POST /auth/client/refresh': { status: 200, json: { client: profile, csrfToken: 'sess-2' } },
      }),
    );
    api.onSessionLost(lost);
    await ep.login('a@b.co', 'Password-12345!');
    const e = await ep.projects().catch((x) => x);
    expect(e.code).toBe('SESSION_EXPIRED');
    expect(count('GET /client/projects')).toBe(2);
    expect(count('POST /auth/client/refresh')).toBe(1);
    expect(lost).toHaveBeenCalledTimes(1);
  });

  it('refresh refused (401) = session lost: listeners fire, memory is cleared, no retry', async () => {
    const lost = vi.fn();
    const { ep, api, count } = make(
      base({
        'GET /client/projects': err(401, 'UNAUTHORIZED'),
        'POST /auth/client/refresh': err(401, 'UNAUTHORIZED'),
      }),
    );
    api.onSessionLost(lost);
    await ep.login('a@b.co', 'Password-12345!');
    const e = await ep.projects().catch((x) => x);
    expect(e.code).toBe('SESSION_EXPIRED');
    expect(errorKind(e)).toBe('sessionExpired');
    expect(count('GET /client/projects')).toBe(1);
    expect(lost).toHaveBeenCalledTimes(1);
    expect(api.hasSessionCsrf()).toBe(false);
  });

  it('a network failure while refreshing does not log the user out', async () => {
    const lost = vi.fn();
    const { ep, api } = make(
      base({
        'GET /client/projects': err(401, 'UNAUTHORIZED'),
        'POST /auth/client/refresh': () => {
          throw new TypeError('offline');
        },
      }),
    );
    api.onSessionLost(lost);
    await ep.login('a@b.co', 'Password-12345!');
    const e = await ep.projects().catch((x) => x);
    expect(e.code).toBe('NETWORK');
    expect(lost).not.toHaveBeenCalled();
  });

  it('with no session at all (anonymous visit) me() resolves to a session error without looping', async () => {
    const lost = vi.fn();
    const { ep, api, count } = make({
      'GET /auth/client/me': err(401, 'UNAUTHORIZED'),
      'GET /auth/client/csrf': err(401, 'UNAUTHORIZED'),
    });
    api.onSessionLost(lost);
    const e = await ep.me().catch((x) => x);
    expect(e.code).toBe('SESSION_EXPIRED');
    expect(count('GET /auth/client/me')).toBe(1);
    expect(count('GET /auth/client/csrf')).toBe(1);
  });

  it('a 403 on an authenticated mutation retries once with a recovered token, never in a loop', async () => {
    const { ep, count } = make(
      base({
        'POST /client/plan-requests': (c) => (c.headers['X-CSRF-Token'] === 'recovered' ? { status: 201, json: { request: { id: 'r' } } } : err(403, 'FORBIDDEN')),
      }),
    );
    await ep.login('a@b.co', 'Password-12345!');
    const out = await ep.createPlanRequest(
      { catalogVersion: 'v1-x', selection: { goals: [], planId: null, items: ['landing'], billing: 'monthly', vertical: null, founder: false }, contact: { name: 'N', phone: '+5491100000000' } },
      'k',
    );
    expect(out.replay).toBe(false);
    expect(count('POST /client/plan-requests')).toBe(2);
  });

  it('a real 403 (unverified email) is surfaced as forbidden after one CSRF recovery', async () => {
    const { ep, count } = make(
      base({
        'GET /client/projects': err(403, 'FORBIDDEN'),
        'POST /client/plan-requests': err(403, 'FORBIDDEN'),
        'GET /auth/client/csrf': { status: 200, json: { csrfToken: 'sess-1' } },
      }),
    );
    await ep.login('a@b.co', 'Password-12345!');
    expect(errorKind(await ep.projects().catch((x) => x))).toBe('forbidden');
    const e = await ep
      .createPlanRequest(
        { catalogVersion: 'v1-x', selection: { goals: [], planId: null, items: ['landing'], billing: 'monthly', vertical: null, founder: false }, contact: { name: 'N', phone: '+5491100000000' } },
        'k',
      )
      .catch((x) => x);
    expect(errorKind(e)).toBe('forbidden');
    expect(count('POST /client/plan-requests')).toBe(1);
  });

  it('reports 200 as an idempotent replay and 201 as new', async () => {
    const statuses = [201, 200];
    const { ep } = make(
      base({ 'POST /client/plan-requests': (_c, n) => ({ status: statuses[n - 1], json: { request: { id: 'r' } } }) }),
    );
    const input = {
      catalogVersion: 'v1-x',
      selection: { goals: [], planId: null, items: ['landing'], billing: 'monthly' as const, vertical: null, founder: false },
      contact: { name: 'N', phone: '+5491100000000' },
    };
    expect((await ep.createPlanRequest(input, 'same')).replay).toBe(false);
    expect((await ep.createPlanRequest(input, 'same')).replay).toBe(true);
  });

  it('logout posts {} with the session token and always forgets it locally', async () => {
    const { ep, api, calls } = make(base({ 'POST /auth/client/logout': err(401, 'UNAUTHORIZED') }));
    await ep.login('a@b.co', 'Password-12345!');
    await ep.logout().catch(() => undefined);
    const call = calls.find((c) => c.path === '/auth/client/logout')!;
    expect(call.body).toEqual({});
    expect(call.headers['X-CSRF-Token']).toBe('sess-1');
    expect(api.hasSessionCsrf()).toBe(false);
  });

  it('password reset confirm clears the in-memory session (the server revoked it)', async () => {
    const { ep, api } = make(
      base({ 'POST /auth/client/password-reset/confirm': { status: 204 } }),
    );
    await ep.login('a@b.co', 'Password-12345!');
    await ep.confirmPasswordReset('tok', 'New-Password-2026!');
    expect(api.hasSessionCsrf()).toBe(false);
  });
});

describe('api client — idempotency keys', () => {
  it('generates lowercase UUIDv4 keys, different each time', () => {
    const a = newUuid();
    const b = newUuid();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });

  it('the fallback generator (no randomUUID) still produces a valid v4', () => {
    vi.stubGlobal('crypto', { getRandomValues: (b: Uint8Array) => b.fill(7) });
    expect(newUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('is sent as given, so a retry of the same submission reuses it', async () => {
    const { api, calls } = make({
      'GET /auth/client/csrf': { status: 200, json: { csrfToken: 's' } },
      'POST /client/plan-requests': (_c, n) => (n === 1 ? err(503, 'SERVICE_UNAVAILABLE') : { status: 201, json: { request: { id: 'r' } } }),
    });
    const key = api.newIdempotencyKey();
    const send = () => api.request({ method: 'POST', path: '/client/plan-requests', auth: 'session', body: {}, idempotencyKey: key });
    await send().catch(() => undefined);
    await send();
    const keys = calls.filter((c) => c.path === '/client/plan-requests').map((c) => c.headers['Idempotency-Key']);
    expect(keys).toEqual([key, key]);
    expect(isUuid(key)).toBe(true);
  });
});

describe('api client — downloads and ids', () => {
  it('downloads with credentials and returns a Blob + the server file name', async () => {
    const { api, calls } = make({
      'GET /client/documents/9e10c444-4f3e-46c7-87a0-160a83884a9c/content': {
        status: 200,
        blob: '%PDF-1.4',
        headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="p.pdf"; filename*=UTF-8''pro%20puesta.pdf` },
      },
    });
    const file = await api.download('/client/documents/9e10c444-4f3e-46c7-87a0-160a83884a9c/content');
    expect(await file.blob.text()).toBe('%PDF-1.4');
    expect(file.fileName).toBe('pro puesta.pdf');
    expect(calls[0].credentials).toBe('include');
  });

  it('sanitizes file names', () => {
    expect(fileNameFrom(`attachment; filename*=UTF-8''..%2F..%2Fetc%2Fpasswd`)).toBe('.._.._etc_passwd');
    expect(fileNameFrom(null)).toBeNull();
  });

  it('validates UUIDs before calling the API (ids from the URL are untrusted)', async () => {
    const { ep, calls } = make({});
    for (const bad of ['', 'abc', '../../x', '123e4567-e89b-12d3-a456-42661417400', "1' or '1'='1"]) {
      expect(await ep.project(bad).catch((e) => e.code)).toBe('NOT_FOUND');
    }
    expect(calls).toHaveLength(0);
    expect(isUuid('3931ac6f-f567-48a5-8561-604f9b909108')).toBe(true);
    expect(isUuid('3931AC6F-F567-48A5-8561-604F9B909108')).toBe(true);
    expect(isUuid(undefined)).toBe(false);
  });
});

describe('api client — nothing sensitive is stored', () => {
  it('never touches web storage or document.cookie while logging in and calling the API', async () => {
    const trap = new Proxy({}, { get: () => { throw new Error('storage touched'); }, set: () => { throw new Error('storage touched'); } });
    vi.stubGlobal('localStorage', trap);
    vi.stubGlobal('sessionStorage', trap);
    vi.stubGlobal('indexedDB', trap);
    vi.stubGlobal('document', trap);
    const { ep } = make({
      'GET /auth/csrf': { status: 200, json: { csrfToken: 'pre' } },
      'POST /auth/client/login': { status: 200, json: { client: profile, csrfToken: 'sess' } },
      'GET /client/projects': { status: 200, json: { projects: [], nextCursor: null } },
    });
    await ep.login('a@b.co', 'Password-12345!');
    await ep.projects();
  });

  it('the API layer source contains no storage, cookie or logging calls', () => {
    const dir = path.resolve(import.meta.dirname, '../lib/api');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const src = readFileSync(path.join(dir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(src, file).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|console\./);
    }
  });
});

describe('portal config', () => {
  it('is a demo without an API URL, whatever the mode says', () => {
    expect(resolvePortalConfig({ mode: 'live' })).toEqual({ apiBaseUrl: '', mode: 'demo' });
    expect(resolvePortalConfig({ apiBaseUrl: '  ', mode: 'live' }).mode).toBe('demo');
  });
  it('needs both the URL and the explicit live mode', () => {
    expect(resolvePortalConfig({ apiBaseUrl: 'http://localhost:3000/', mode: 'live' })).toEqual({ apiBaseUrl: 'http://localhost:3000', mode: 'live' });
    expect(resolvePortalConfig({ apiBaseUrl: 'http://localhost:3000' }).mode).toBe('demo');
    expect(resolvePortalConfig({ apiBaseUrl: 'http://localhost:3000', mode: 'demo' }).mode).toBe('demo');
  });
  it('rejects URLs with credentials, paths, queries or other schemes', () => {
    for (const bad of ['javascript:alert(1)', 'http://u:p@host', 'https://api.example.com/api/v1', 'https://api.example.com?x=1', 'not a url', 'ftp://x']) {
      expect(resolvePortalConfig({ apiBaseUrl: bad, mode: 'live' }).mode, bad).toBe('demo');
    }
    expect(resolvePortalConfig({ apiBaseUrl: 'https://api.eclipse-business.com', mode: 'LIVE' }).apiBaseUrl).toBe('https://api.eclipse-business.com');
  });
});
