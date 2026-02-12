import { apiClient } from '@/lib/api/client';
import { ServiceError } from '@/lib/api/errors';
import type {
  DatasetDetail,
  DatasetListResponse,
  DatasetSummary,
} from '@/lib/api/types';

const API_PREFIX = '/api/v1';

interface ListDatasetsOptions {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

interface RequestOptions {
  signal?: AbortSignal;
}

export async function listDatasets(
  options: ListDatasetsOptions = {}
): Promise<DatasetListResponse> {
  return apiClient.get<DatasetListResponse>(`${API_PREFIX}/datasets`, {
    query: {
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 20,
    },
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
    if (
      error instanceof ServiceError &&
      error.code === 'ACTIVE_DATASET_NOT_FOUND'
    ) {
      return null;
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
  return apiClient.put<DatasetSummary>(
    `${API_PREFIX}/datasets/${encodedDatasetId}/active`,
    undefined,
    {
      signal: options.signal,
    }
  );
}
