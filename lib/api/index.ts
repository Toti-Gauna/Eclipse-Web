import { API_BASE_URL } from '@/lib/env';
import { createApiClient } from './client';
import { createEndpoints } from './endpoints';

export { ApiError, errorKind, isApiError, isRetryable, type ErrorKind } from './errors';
export { isUuid, newUuid } from './uuid';
export type * from './types';

/** The page's single client. Only used in live mode; demo mode never calls it. */
export const apiClient = createApiClient({ baseUrl: API_BASE_URL });
export const endpoints = createEndpoints(apiClient);
