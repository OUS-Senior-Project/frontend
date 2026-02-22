import { apiClient } from '@/lib/api/client';
import {
  encodePathSegment,
  toApiPath,
  withDatasetCache,
} from '@/lib/api/service-helpers';
import type {
  AnalyticsRecord,
  AnalyticsRecordsResponse,
  MajorCohortRecordsResponse,
  MajorsAnalyticsResponse,
} from '@/lib/api/types';

interface GetMajorsAnalyticsOptions {
  signal?: AbortSignal;
}

function buildMajorDistribution(records: AnalyticsRecord[]) {
  const countsByMajor = records.reduce<Record<string, number>>(
    (acc, record) => {
      acc[record.major] = (acc[record.major] ?? 0) + record.count;
      return acc;
    },
    {}
  );

  return Object.entries(countsByMajor)
    .map(([major, count]) => ({ major, count }))
    .sort((left, right) => right.count - left.count);
}

export async function getMajorsAnalytics(
  datasetId: string,
  options: GetMajorsAnalyticsOptions = {}
): Promise<MajorsAnalyticsResponse> {
  const encodedDatasetId = encodePathSegment(datasetId);
  const [analyticsRecordsResponse, majorCohortResponse] = await Promise.all([
    apiClient.get<AnalyticsRecordsResponse>(
      toApiPath(`/datasets/${encodedDatasetId}/analytics-records`),
      withDatasetCache(datasetId, {
        signal: options.signal,
      })
    ),
    apiClient.get<MajorCohortRecordsResponse>(
      toApiPath(`/datasets/${encodedDatasetId}/major-cohort-records`),
      withDatasetCache(datasetId, {
        signal: options.signal,
      })
    ),
  ]);

  return {
    datasetId,
    analyticsRecords: analyticsRecordsResponse.records,
    majorDistribution: buildMajorDistribution(analyticsRecordsResponse.records),
    cohortRecords: majorCohortResponse.records.map((record) => ({
      ...record,
      avgGPA: record.avgGPA ?? 0,
      avgCredits: record.avgCredits ?? 0,
    })),
  };
}
