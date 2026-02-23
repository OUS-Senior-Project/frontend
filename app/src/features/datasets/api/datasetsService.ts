import { apiClient, clearDatasetResponseCache } from '@/lib/api/client';
import { ServiceError } from '@/lib/api/errors';
import {
  buildPaginationQuery,
  encodePathSegment,
  toApiPath,
  withDatasetCache,
} from '@/lib/api/service-helpers';
import type {
  DatasetDetail,
  DatasetListResponse,
  DatasetSummary,
} from '@/lib/api/types';

const DATASETS_ENDPOINT = toApiPath('/datasets');
const ACTIVE_DATASET_ENDPOINT = `${DATASETS_ENDPOINT}/active`;
const LIST_DATASETS_QUERY_ALLOWLIST = ['page', 'pageSize'] as const;

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

function buildListDatasetsQuery(options: ListDatasetsOptions) {
  return buildPaginationQuery({
    endpoint: DATASETS_ENDPOINT,
    page: options.page,
    pageSize: options.pageSize,
    params: {},
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
    return await apiClient.get<DatasetSummary>(ACTIVE_DATASET_ENDPOINT, {
      signal: options.signal,
    });
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
  return apiClient.get<DatasetDetail>(
    toApiPath(`/datasets/${encodePathSegment(datasetId)}`),
    withDatasetCache(datasetId, {
      signal: options.signal,
    })
  );
}

export async function activateDataset(
  datasetId: string,
  options: RequestOptions = {}
): Promise<DatasetSummary> {
  const activated = await apiClient.put<DatasetSummary>(
    toApiPath(`/datasets/${encodePathSegment(datasetId)}/active`),
    undefined,
    {
      signal: options.signal,
    }
  );

  // Active dataset changes can invalidate any dataset-scoped GET cache entries.
  clearDatasetResponseCache();

  return activated;
}
