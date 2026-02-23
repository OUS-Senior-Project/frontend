import { apiClient } from '@/lib/api/client';
import {
  buildGuardedQuery,
  encodePathSegment,
  toApiPath,
  withDatasetCache,
} from '@/lib/api/service-helpers';
import type {
  MigrationAnalyticsResponse,
  MigrationOptionsResponse,
  MigrationRecordsResponse,
} from '@/lib/api/types';

const MIGRATION_RECORDS_QUERY_ALLOWLIST = ['semester'] as const;

interface GetMigrationAnalyticsOptions {
  semester?: string;
  signal?: AbortSignal;
}

export async function getMigrationAnalytics(
  datasetId: string,
  options: GetMigrationAnalyticsOptions = {}
): Promise<MigrationAnalyticsResponse> {
  const encodedDatasetId = encodePathSegment(datasetId);
  const optionsEndpoint = toApiPath(
    `/datasets/${encodedDatasetId}/migration/options`
  );
  const recordsEndpoint = toApiPath(
    `/datasets/${encodedDatasetId}/migration-records`
  );

  const [optionsResponse, recordsResponse] = await Promise.all([
    apiClient.get<MigrationOptionsResponse>(
      optionsEndpoint,
      withDatasetCache(datasetId, {
        signal: options.signal,
      })
    ),
    apiClient.get<MigrationRecordsResponse>(
      recordsEndpoint,
      withDatasetCache(datasetId, {
        query: buildGuardedQuery({
          endpoint: recordsEndpoint,
          params: { semester: options.semester },
          allowedKeys: MIGRATION_RECORDS_QUERY_ALLOWLIST,
        }),
        signal: options.signal,
      })
    ),
  ]);

  return {
    datasetId,
    semesters: optionsResponse.semesters,
    records: recordsResponse.records,
  };
}
