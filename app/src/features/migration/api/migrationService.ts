import { apiClient } from '@/lib/api/client';
import type {
  MigrationAnalyticsResponse,
  MigrationOptionsResponse,
  MigrationRecordsResponse,
} from '@/lib/api/types';

const API_PREFIX = '/api/v1';

interface GetMigrationAnalyticsOptions {
  semester?: string;
  signal?: AbortSignal;
}

export async function getMigrationAnalytics(
  datasetId: string,
  options: GetMigrationAnalyticsOptions = {}
): Promise<MigrationAnalyticsResponse> {
  const encodedDatasetId = encodeURIComponent(datasetId);
  const [optionsResponse, recordsResponse] = await Promise.all([
    apiClient.get<MigrationOptionsResponse>(
      `${API_PREFIX}/datasets/${encodedDatasetId}/migration/options`,
      {
        signal: options.signal,
        datasetCache: { datasetId },
      }
    ),
    apiClient.get<MigrationRecordsResponse>(
      `${API_PREFIX}/datasets/${encodedDatasetId}/migration-records`,
      {
        query: { semester: options.semester },
        signal: options.signal,
        datasetCache: { datasetId },
      }
    ),
  ]);

  return {
    datasetId,
    semesters: optionsResponse.semesters,
    records: recordsResponse.records,
  };
}
