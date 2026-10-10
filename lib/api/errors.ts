/**
 * Uniform error for every call to the Eclipse backend.
 *
 * `code` is the backend's public code (BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND,
 * CONFLICT, PAYLOAD_TOO_LARGE, TOO_MANY_REQUESTS, SERVICE_UNAVAILABLE, INTERNAL_ERROR) or
 * one of ours for failures that never reached an answer: NETWORK, TIMEOUT, ABORTED,
 * INVALID_RESPONSE, SESSION_EXPIRED. The message is generic on purpose: request and
 * response bodies are never copied into errors or logs.
 */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'TOO_MANY_REQUESTS'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'INVALID_RESPONSE'
  | 'SESSION_EXPIRED';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** HTTP status; 0 when no answer arrived. */
  readonly status: number;
  readonly requestId: string | null;
  /** Seconds from `Retry-After`, when the server sent it. */
  readonly retryAfter: number | null;

  constructor(code: ApiErrorCode, status: number, opts: { requestId?: string | null; retryAfter?: number | null } = {}) {
    super(`${code} (${status})`);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = opts.requestId ?? null;
    this.retryAfter = opts.retryAfter ?? null;
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

const KNOWN = new Set<string>(Object.values(STATUS_CODES).concat('INTERNAL_ERROR'));

/** Builds an ApiError from an HTTP answer (body already parsed, or null). */
export function errorFromResponse(status: number, body: unknown, headers?: { get(name: string): string | null }): ApiError {
  let code: ApiErrorCode = STATUS_CODES[status] ?? 'INTERNAL_ERROR';
  let requestId: string | null = null;
  if (body && typeof body === 'object') {
    const b = body as { error?: { code?: unknown }; requestId?: unknown };
    if (typeof b.error?.code === 'string' && KNOWN.has(b.error.code)) code = b.error.code as ApiErrorCode;
    if (typeof b.requestId === 'string') requestId = b.requestId;
  }
  if (!requestId) requestId = headers?.get('x-request-id') ?? null;
  const retry = Number(headers?.get('retry-after'));
  return new ApiError(code, status, { requestId, retryAfter: Number.isFinite(retry) && retry > 0 ? retry : null });
}

/**
 * What the UI should do about an error. Screens map these kinds to localized copy; none of
 * them depends on server text.
 */
export type ErrorKind =
  | 'offline' // network failure or timeout: safe to retry
  | 'rateLimited' // 429: wait
  | 'unavailable' // 503 / 5xx: try again later
  | 'sessionExpired' // 401 after refresh: back to login
  | 'forbidden' // 403 that is not a CSRF problem (e.g. unverified email)
  | 'notFound'
  | 'conflict'
  | 'invalid' // 400
  | 'tooLarge'
  | 'unknown';

export function errorKind(error: unknown): ErrorKind {
  if (!isApiError(error)) return 'unknown';
  switch (error.code) {
    case 'NETWORK':
    case 'TIMEOUT':
      return 'offline';
    case 'TOO_MANY_REQUESTS':
      return 'rateLimited';
    case 'SERVICE_UNAVAILABLE':
    case 'INTERNAL_ERROR':
      return 'unavailable';
    case 'SESSION_EXPIRED':
    case 'UNAUTHORIZED':
      return 'sessionExpired';
    case 'FORBIDDEN':
      return 'forbidden';
    case 'NOT_FOUND':
      return 'notFound';
    case 'CONFLICT':
      return 'conflict';
    case 'BAD_REQUEST':
      return 'invalid';
    case 'PAYLOAD_TOO_LARGE':
      return 'tooLarge';
    default:
      return 'unknown';
  }
}

/** Failures where sending the same submission again (same Idempotency-Key) is safe and useful. */
export function isRetryable(error: unknown): boolean {
  if (!isApiError(error)) return false;
  return error.code === 'NETWORK' || error.code === 'TIMEOUT' || error.code === 'SERVICE_UNAVAILABLE' || error.code === 'INTERNAL_ERROR';
}
