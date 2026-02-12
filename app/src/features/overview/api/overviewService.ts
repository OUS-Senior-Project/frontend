import { apiClient } from '@/lib/api/client';
import {
  normalizeDatasetOverviewResponse,
  type RawDatasetOverviewResponse,
} from '@/lib/api/normalize';
import type { DatasetOverviewResponse } from '@/lib/api/types';

const API_PREFIX = '/api/v1';

interface GetDatasetOverviewOptions {
  asOfSubmissionId?: string;
  signal?: AbortSignal;
}

export async function getDatasetOverview(
  datasetId: string,
  options: GetDatasetOverviewOptions = {}
): Promise<DatasetOverviewResponse> {
  const encodedDatasetId = encodeURIComponent(datasetId);

  const response = await apiClient.get<RawDatasetOverviewResponse>(
    `${API_PREFIX}/datasets/${encodedDatasetId}/overview`,
    {
      query: {
        asOfSubmissionId: options.asOfSubmissionId,
      },
      signal: options.signal,
      datasetCache: { datasetId },
    }
  );

  return normalizeDatasetOverviewResponse(response);
}
