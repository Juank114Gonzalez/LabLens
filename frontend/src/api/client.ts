import { env } from '@/config/env';
import type { ApiResponse } from '@/types/api';
import { ApiClientError } from './errors';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  auth?: boolean;
  retry?: number;
  skipRefresh?: boolean;
  /** Public endpoints send no cookies, so there is no CSRF surface to protect. */
  credentials?: RequestCredentials;
};

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

let getAccessToken: TokenGetter = () => null;
let refreshAccessToken: RefreshHandler = async () => null;
let onUnauthorized: UnauthorizedHandler = () => undefined;

export function configureApiClient(options: {
  getAccessToken: TokenGetter;
  refreshAccessToken: RefreshHandler;
  onUnauthorized: UnauthorizedHandler;
}) {
  getAccessToken = options.getAccessToken;
  refreshAccessToken = options.refreshAccessToken;
  onUnauthorized = options.onUnauthorized;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = (isJson ? await response.json() : null) as ApiResponse<T> | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String(payload.message)
        : `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status);
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (!payload.success) {
      throw new ApiClientError(payload.message, response.status);
    }
    return payload.data;
  }

  return payload as T;
}

async function requestOnce<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    credentials: options.credentials ?? 'include',
  });

  if (response.status === 401 && !options.skipRefresh) {
    const nextToken = await refreshAccessToken();
    if (!nextToken) {
      onUnauthorized();
      throw new ApiClientError('Session expired', 401);
    }

    return requestOnce<T>(path, { ...options, skipRefresh: true });
  }

  return parseResponse<T>(response);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const retries = options.retry ?? 1;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await requestOnce<T>(path, options);
    } catch (error) {
      lastError = error;
      const status = error instanceof ApiClientError ? error.status : 0;
      const retryable = status === 0 || status >= 500;
      if (!retryable || attempt === retries) {
        throw error;
      }
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }

  throw lastError;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
