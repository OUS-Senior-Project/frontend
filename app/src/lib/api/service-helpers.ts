import type { ApiRequestOptions } from './client';
import { filterQueryParams, type QueryValue } from './queryGuardrails';

export const API_V1_PATH = '/api/v1';

interface BuildQueryOptions {
  endpoint: string;
  params: Record<string, unknown>;
  allowedKeys: readonly string[];
}

interface BuildPaginationQueryOptions extends BuildQueryOptions {
  page?: number;
  pageSize?: number;
}

function warnPositiveIntegerNormalization(
  endpoint: string,
  key: string,
  value: number,
  fallback: number
) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.warn(
    `[api-query-guardrail] Normalized invalid ${key} for ${endpoint}: ${value} -> ${fallback}`
  );
}

export function normalizePositiveInteger(
  endpoint: string,
  key: string,
  value: number | undefined,
  fallback: number
) {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isFinite(value) || value < 1) {
    warnPositiveIntegerNormalization(endpoint, key, value, fallback);
    return fallback;
  }

  return value;
}

export function buildGuardedQuery({
  endpoint,
  params,
  allowedKeys,
}: BuildQueryOptions): Record<string, QueryValue> {
  return filterQueryParams({
    endpoint,
    params,
    allowedKeys,
  });
}

export function buildPaginationQuery({
  endpoint,
  page,
  pageSize,
  params,
  allowedKeys,
}: BuildPaginationQueryOptions): Record<string, QueryValue> {
  const normalizedPage = normalizePositiveInteger(endpoint, 'page', page, 1);
  const normalizedPageSize = normalizePositiveInteger(
    endpoint,
    'pageSize',
    pageSize,
    20
  );

  return buildGuardedQuery({
    endpoint,
    params: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      ...params,
    },
    allowedKeys,
  });
}

export function toApiPath(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === API_V1_PATH || normalized.startsWith(`${API_V1_PATH}/`)) {
    return normalized;
  }

  return `${API_V1_PATH}${normalized}`;
}

export function encodePathSegment(value: string) {
  return encodeURIComponent(value);
}

type RequestOptionsWithoutDatasetCache = Omit<
  ApiRequestOptions,
  'datasetCache'
>;

export function withDatasetCache(
  datasetId: string,
  options: RequestOptionsWithoutDatasetCache = {}
): ApiRequestOptions {
  return {
    ...options,
    datasetCache: { datasetId },
  };
}
