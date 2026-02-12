import { ApiError, ServiceError } from './errors';
import type { ApiErrorEnvelope } from './types';

type QueryPrimitive = string | number | boolean;
type QueryValue =
  | QueryPrimitive
  | QueryPrimitive[]
  | null
  | undefined;

export interface ApiRequestOptions {
  query?: Record<string, QueryValue>;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  datasetCache?: {
    datasetId: string;
  };
}

interface RequestExecutionOptions extends ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: unknown;
  isMultipart?: boolean;
}

interface RawResponse {
  response: Response;
  body: unknown;
}

interface DatasetCacheEntry {
  etag: string;
  payload: unknown;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_HEADERS = { Accept: 'application/json' };
const API_V1_PREFIX = '/api/v1';

const datasetResponseCache = new Map<string, DatasetCacheEntry>();

export interface ApiClient {
  get<T>(path: string, options?: ApiRequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T>;
  postForm<T>(
    path: string,
    formData: FormData,
    options?: ApiRequestOptions
  ): Promise<T>;
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (
    trimmed === API_V1_PREFIX ||
    trimmed.endsWith(`${API_V1_PREFIX}`)
  ) {
    return trimmed.slice(0, -API_V1_PREFIX.length).replace(/\/+$/, '');
  }

  return trimmed;
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeApiPath(path: string) {
  const normalizedPath = normalizePath(path);
  if (
    normalizedPath === API_V1_PREFIX ||
    normalizedPath.startsWith(`${API_V1_PREFIX}/`)
  ) {
    return normalizedPath;
  }

  return `${API_V1_PREFIX}${normalizedPath}`;
}

function resolveBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    return '';
  }

  return normalizeBaseUrl(trimmed);
}

function buildCanonicalQueryString(query?: Record<string, QueryValue>) {
  if (!query) {
    return '';
  }

  const searchParams = new URLSearchParams();
  const keys = Object.keys(query).sort();

  keys.forEach((key) => {
    const value = query[key];
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value
        .map((entry) => String(entry))
        .sort()
        .forEach((entry) => {
          searchParams.append(key, entry);
        });
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

function buildDatasetCacheKey(
  datasetId: string,
  path: string,
  canonicalQueryString: string
) {
  return `${datasetId}|${normalizeApiPath(path)}|${canonicalQueryString}`;
}

function composeUrl(baseUrl: string, path: string, canonicalQueryString: string) {
  const base = `${baseUrl}${normalizeApiPath(path)}`;
  return canonicalQueryString ? `${base}?${canonicalQueryString}` : base;
}

function createAbortSignal(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortListener = () => {
    controller.abort();
  };

  signal?.addEventListener('abort', abortListener);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup() {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortListener);
    },
  };
}

function asApiErrorEnvelope(value: unknown): ApiErrorEnvelope | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const maybeEnvelope = value as Partial<ApiErrorEnvelope>;
  if (!maybeEnvelope.error || typeof maybeEnvelope.error !== 'object') {
    return null;
  }

  if (
    typeof maybeEnvelope.error.code !== 'string' ||
    typeof maybeEnvelope.error.message !== 'string'
  ) {
    return null;
  }

  return maybeEnvelope as ApiErrorEnvelope;
}

function isRetryableStatus(status: number) {
  return status >= 500 || status === 408 || status === 429;
}

function toApiError(raw: RawResponse): ApiError {
  const envelope = asApiErrorEnvelope(raw.body);
  const requestId = raw.response.headers.get('x-request-id') ?? undefined;
  const status = raw.response.status;
  const code = envelope?.error.code ?? 'HTTP_ERROR';
  const message =
    envelope?.error.message ?? `Request failed with status ${status}.`;
  const details = envelope?.error.details ?? raw.body;

  return new ApiError({
    code,
    message,
    details,
    requestId,
    status,
    retryable: isRetryableStatus(status),
  });
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 304) {
    return undefined;
  }

  const rawText = await response.text();
  if (!rawText) {
    return undefined;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

function createHeaders(
  headers: HeadersInit | undefined,
  includeJsonContentType: boolean
) {
  const merged = new Headers(DEFAULT_HEADERS);
  if (includeJsonContentType) {
    merged.set('Content-Type', 'application/json');
  }

  if (headers) {
    new Headers(headers).forEach((value, key) => {
      merged.set(key, value);
    });
  }

  return merged;
}

async function executeRequest(
  baseUrl: string,
  options: RequestExecutionOptions
): Promise<RawResponse> {
  if (!baseUrl) {
    throw new ServiceError(
      'MISSING_API_BASE_URL',
      'NEXT_PUBLIC_API_BASE_URL is required (example: http://localhost:8000)',
      false
    );
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const canonicalQuery = buildCanonicalQueryString(options.query);
  const request = createAbortSignal(options.signal, timeoutMs);
  const headers = createHeaders(options.headers, Boolean(options.body) && !options.isMultipart);

  const init: RequestInit = {
    method: options.method,
    headers,
    signal: request.signal,
  };

  if (options.body !== undefined) {
    init.body =
      options.isMultipart && options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body);
  }

  const url = composeUrl(baseUrl, options.path, canonicalQuery);

  try {
    const response = await fetch(url, init);
    const body = await parseResponseBody(response);
    return { response, body };
  } catch (error) {
    if (request.signal.aborted) {
      if (request.didTimeout()) {
        throw new ServiceError(
          'REQUEST_TIMEOUT',
          'The request timed out. Please try again.',
          true
        );
      }

      throw new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true);
    }

    throw new ServiceError(
      'NETWORK_ERROR',
      'Unable to reach the backend service.',
      true
    );
  } finally {
    request.cleanup();
  }
}

async function parseSuccessfulResponse<T>(
  baseUrl: string,
  options: RequestExecutionOptions
) {
  const raw = await executeRequest(baseUrl, options);

  if (!raw.response.ok) {
    throw toApiError(raw);
  }

  return raw.body as T;
}

export function createApiClient(
  baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
): ApiClient {
  const normalizedBaseUrl = resolveBaseUrl(baseUrl);

  return {
    async get<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
      const canonicalQuery = buildCanonicalQueryString(options.query);
      const datasetCacheKey = options.datasetCache
        ? buildDatasetCacheKey(
            options.datasetCache.datasetId,
            path,
            canonicalQuery
          )
        : null;
      const cacheEntry = datasetCacheKey
        ? datasetResponseCache.get(datasetCacheKey)
        : null;

      const headers = createHeaders(options.headers, false);
      if (cacheEntry?.etag) {
        headers.set('If-None-Match', cacheEntry.etag);
      }

      const requestOptions: RequestExecutionOptions = {
        ...options,
        method: 'GET',
        path,
        headers,
      };

      const raw = await executeRequest(normalizedBaseUrl, requestOptions);

      if (raw.response.status === 304) {
        if (cacheEntry) {
          return cacheEntry.payload as T;
        }

        headers.delete('If-None-Match');
        const recovery = await executeRequest(normalizedBaseUrl, requestOptions);
        if (recovery.response.status === 304) {
          throw new ServiceError(
            'CACHE_MISS',
            'Received 304 without cached payload for this dataset response.',
            true
          );
        }

        if (!recovery.response.ok) {
          throw toApiError(recovery);
        }

        return recovery.body as T;
      }

      if (!raw.response.ok) {
        throw toApiError(raw);
      }

      if (datasetCacheKey && raw.response.status === 200) {
        const etag = raw.response.headers.get('etag');
        if (etag) {
          datasetResponseCache.set(datasetCacheKey, {
            etag,
            payload: raw.body,
          });
        } else {
          datasetResponseCache.delete(datasetCacheKey);
        }
      }

      return raw.body as T;
    },
    async post<T>(
      path: string,
      body?: unknown,
      options: ApiRequestOptions = {}
    ): Promise<T> {
      return parseSuccessfulResponse<T>(normalizedBaseUrl, {
        ...options,
        method: 'POST',
        path,
        body,
      });
    },
    async put<T>(
      path: string,
      body?: unknown,
      options: ApiRequestOptions = {}
    ): Promise<T> {
      return parseSuccessfulResponse<T>(normalizedBaseUrl, {
        ...options,
        method: 'PUT',
        path,
        body,
      });
    },
    async postForm<T>(
      path: string,
      formData: FormData,
      options: ApiRequestOptions = {}
    ): Promise<T> {
      return parseSuccessfulResponse<T>(normalizedBaseUrl, {
        ...options,
        method: 'POST',
        path,
        body: formData,
        isMultipart: true,
      });
    },
  };
}

export function clearDatasetResponseCache() {
  datasetResponseCache.clear();
}

export const apiClient = createApiClient();
