/**
 * Typed calls to the backend, one function per endpoint the web uses. They sit on the
 * shared client (CSRF, refresh, timeouts) and validate just enough of each answer that a
 * malformed one fails as INVALID_RESPONSE instead of crashing a screen.
 */
import { ApiError } from './errors';
import type { ApiClient } from './client';
import type {
  ApiCatalog,
  ApiClientProfile,
  ApiDocument,
  ApiPlanRequest,
  ApiPlanSelection,
  ApiProjectDetail,
  ApiProjectSummary,
  Page,
} from './types';
import { isUuid } from './uuid';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function invalid(): never {
  throw new ApiError('INVALID_RESPONSE', 200);
}

function profile(value: unknown): ApiClientProfile {
  const c = isObj(value) && isObj(value.client) ? value.client : invalid();
  if (typeof c.id !== 'string' || typeof c.email !== 'string' || typeof c.emailVerified !== 'boolean') invalid();
  return {
    id: c.id,
    email: c.email,
    displayName: typeof c.displayName === 'string' ? c.displayName : null,
    emailVerified: c.emailVerified,
  };
}

function list<T>(value: unknown, key: string, check: (item: unknown) => boolean): Page<T> {
  if (!isObj(value) || !Array.isArray(value[key]) || !(value[key] as unknown[]).every(check)) invalid();
  const next = value.nextCursor;
  return { items: value[key] as T[], nextCursor: typeof next === 'string' ? next : null };
}

const hasId = (v: unknown) => isObj(v) && typeof v.id === 'string';

export function createEndpoints(api: ApiClient) {
  const guard = (id: string) => {
    if (!isUuid(id)) throw new ApiError('NOT_FOUND', 404);
    return id;
  };

  return {
    // ---- session ------------------------------------------------------------------
    /** Who is signed in. 401 (after one refresh attempt) rejects with SESSION_EXPIRED/UNAUTHORIZED. */
    async me(signal?: AbortSignal): Promise<ApiClientProfile> {
      return profile(await api.request({ path: '/auth/client/me', auth: 'session', signal }));
    },

    async login(email: string, password: string): Promise<ApiClientProfile> {
      const json = await api.request<{ csrfToken?: unknown }>({
        method: 'POST',
        path: '/auth/client/login',
        auth: 'preauth',
        body: { email, password },
      });
      if (!isObj(json) || typeof json.csrfToken !== 'string') invalid();
      api.setSessionCsrf(json.csrfToken);
      return profile(json);
    },

    /** Always 202 for new and existing emails (anti-enumeration). */
    async register(input: { email: string; password: string; displayName?: string }): Promise<void> {
      await api.request({ method: 'POST', path: '/auth/client/register', auth: 'preauth', body: input });
    },

    async logout(): Promise<void> {
      try {
        await api.request({ method: 'POST', path: '/auth/client/logout', auth: 'session', body: {}, noRefresh: true });
      } finally {
        api.clearSession();
      }
    },

    async requestEmailVerification(email: string): Promise<void> {
      await api.request({ method: 'POST', path: '/auth/client/email-verification/request', auth: 'preauth', body: { email } });
    },

    async confirmEmailVerification(token: string): Promise<void> {
      await api.request({ method: 'POST', path: '/auth/client/email-verification/confirm', auth: 'preauth', body: { token } });
    },

    async requestPasswordReset(email: string): Promise<void> {
      await api.request({ method: 'POST', path: '/auth/client/password-reset/request', auth: 'preauth', body: { email } });
    },

    async confirmPasswordReset(token: string, password: string): Promise<void> {
      await api.request({ method: 'POST', path: '/auth/client/password-reset/confirm', auth: 'preauth', body: { token, password } });
      // The server revoked every session of this account.
      api.clearSession();
    },

    // ---- catalog + plan requests ------------------------------------------------------
    async catalog(signal?: AbortSignal): Promise<ApiCatalog> {
      const json = await api.request<unknown>({ path: '/catalog/plans', signal });
      if (!isObj(json) || typeof json.version !== 'string' || !Array.isArray(json.items) || !Array.isArray(json.plans)) invalid();
      return json as unknown as ApiCatalog;
    },

    async createPlanRequest(
      input: { catalogVersion: string; selection: ApiPlanSelection; contact: { name: string; phone: string }; message?: string | null },
      idempotencyKey: string,
    ): Promise<{ request: ApiPlanRequest; replay: boolean }> {
      // The API answers 201 for a new request and 200 for a replay of the same key.
      const { status, data: json } = await api.requestWithStatus<unknown>({
        method: 'POST',
        path: '/client/plan-requests',
        auth: 'session',
        body: input,
        idempotencyKey,
      });
      if (!isObj(json) || !hasId(json.request) || (status !== 200 && status !== 201)) invalid();
      return { request: json.request as unknown as ApiPlanRequest, replay: status === 200 };
    },

    async planRequests(signal?: AbortSignal): Promise<Page<ApiPlanRequest>> {
      const json = await api.request<unknown>({ path: '/client/plan-requests?limit=50', auth: 'session', signal });
      return list<ApiPlanRequest>(json, 'requests', hasId);
    },

    async planRequest(id: string, signal?: AbortSignal): Promise<ApiPlanRequest> {
      const json = await api.request<unknown>({ path: `/client/plan-requests/${guard(id)}`, auth: 'session', signal });
      if (!isObj(json) || !hasId(json.request)) invalid();
      return json.request as unknown as ApiPlanRequest;
    },

    /** Cancels an open request (own, verified account, current `version`). 409 = it changed meanwhile. */
    async cancelPlanRequest(id: string, version: number): Promise<ApiPlanRequest> {
      const json = await api.request<unknown>({
        method: 'POST',
        path: `/client/plan-requests/${guard(id)}/cancel`,
        auth: 'session',
        body: { version },
      });
      if (!isObj(json) || !hasId(json.request)) invalid();
      return json.request as unknown as ApiPlanRequest;
    },

    // ---- projects -------------------------------------------------------------------
    async projects(signal?: AbortSignal): Promise<Page<ApiProjectSummary>> {
      const json = await api.request<unknown>({ path: '/client/projects', auth: 'session', signal });
      return list<ApiProjectSummary>(json, 'projects', hasId);
    },

    async project(id: string, signal?: AbortSignal): Promise<ApiProjectDetail> {
      const json = await api.request<unknown>({ path: `/client/projects/${guard(id)}`, auth: 'session', signal });
      if (!isObj(json) || !hasId(json.project)) invalid();
      return json.project as unknown as ApiProjectDetail;
    },

    async documents(projectId: string, signal?: AbortSignal): Promise<Page<ApiDocument>> {
      const json = await api.request<unknown>({ path: `/client/projects/${guard(projectId)}/documents`, auth: 'session', signal });
      return list<ApiDocument>(json, 'documents', hasId);
    },

    downloadDocument(id: string, signal?: AbortSignal) {
      return api.download(`/client/documents/${guard(id)}/content`, { signal });
    },
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
