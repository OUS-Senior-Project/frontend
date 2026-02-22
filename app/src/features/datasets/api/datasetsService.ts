import { apiClient, clearDatasetResponseCache } from '@/lib/api/client';
import { ServiceError } from '@/lib/api/errors';
import { filterQueryParams } from '@/lib/api/queryGuardrails';
import type {
  DatasetDetail,
  DatasetListResponse,
  DatasetSummary,
} from '@/lib/api/types';

const API_PREFIX = '/api/v1';
const DATASETS_ENDPOINT = `${API_PREFIX}/datasets`;
const LIST_DATASETS_QUERY_ALLOWLIST = ['page', 'pageSize'] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

type PaginationParams = {
  page?: number;
  pageSize?: number;
};

interface ListDatasetsOptions extends PaginationParams {
  signal?: AbortSignal;
}

interface RequestOptions {
  signal?: AbortSignal;
}

function warnPaginationNormalization(
  endpoint: string,
  key: 'page' | 'pageSize',
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

function normalizePaginationValue(
  endpoint: string,
  key: 'page' | 'pageSize',
  value: number | undefined,
  fallback: number
) {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isFinite(value) || value < 1) {
    warnPaginationNormalization(endpoint, key, value, fallback);
    return fallback;
  }

  return value;
}

function buildListDatasetsQuery(options: ListDatasetsOptions) {
  const page = normalizePaginationValue(
    DATASETS_ENDPOINT,
    'page',
    options.page,
    DEFAULT_PAGE
  );
  const pageSize = normalizePaginationValue(
    DATASETS_ENDPOINT,
    'pageSize',
    options.pageSize,
    DEFAULT_PAGE_SIZE
  );

  return filterQueryParams({
    endpoint: DATASETS_ENDPOINT,
    params: {
      page,
      pageSize,
    },
    allowedKeys: LIST_DATASETS_QUERY_ALLOWLIST,
  });
}

export async function listDatasets(
  options: ListDatasetsOptions = {}
): Promise<DatasetListResponse> {
  return apiClient.get<DatasetListResponse>(DATASETS_ENDPOINT, {
    query: buildListDatasetsQuery(options),
    signal: options.signal,
  });
}

export async function getActiveDataset(
  options: RequestOptions = {}
): Promise<DatasetSummary | null> {
  try {
    return await apiClient.get<DatasetSummary>(
      `${API_PREFIX}/datasets/active`,
      {
        signal: options.signal,
      }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      if (error.status === 404) {
        // Expected on first run: no active dataset yet. Treat 404 as empty-state.
        return null;
      }

      if (
        error.code === 'ACTIVE_DATASET_NOT_FOUND' &&
        error.status === undefined
      ) {
        return null;
      }
    }

    throw error;
  }
}

export async function getDatasetById(
  datasetId: string,
  options: RequestOptions = {}
): Promise<DatasetDetail> {
  const encodedDatasetId = encodeURIComponent(datasetId);
  return apiClient.get<DatasetDetail>(
    `${API_PREFIX}/datasets/${encodedDatasetId}`,
    {
      signal: options.signal,
      datasetCache: { datasetId },
    }
  );
}

export async function activateDataset(
  datasetId: string,
  options: RequestOptions = {}
): Promise<DatasetSummary> {
  const encodedDatasetId = encodeURIComponent(datasetId);
  const activated = await apiClient.put<DatasetSummary>(
    `${API_PREFIX}/datasets/${encodedDatasetId}/active`,
    undefined,
    {
      signal: options.signal,
    }
  );

  // Active dataset changes can invalidate any dataset-scoped GET cache entries.
  clearDatasetResponseCache();

  return activated;
}
