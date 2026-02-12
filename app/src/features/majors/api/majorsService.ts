import { apiClient } from '@/lib/api/client';
import type {
  AnalyticsRecord,
  AnalyticsRecordsResponse,
  MajorCohortRecordsResponse,
  MajorsAnalyticsResponse,
} from '@/lib/api/types';

const API_PREFIX = '/api/v1';

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
  const encodedDatasetId = encodeURIComponent(datasetId);
  const [analyticsRecordsResponse, majorCohortResponse] = await Promise.all([
    apiClient.get<AnalyticsRecordsResponse>(
      `${API_PREFIX}/datasets/${encodedDatasetId}/analytics-records`,
      {
        signal: options.signal,
        datasetCache: { datasetId },
      }
    ),
    apiClient.get<MajorCohortRecordsResponse>(
      `${API_PREFIX}/datasets/${encodedDatasetId}/major-cohort-records`,
      {
        signal: options.signal,
        datasetCache: { datasetId },
      }
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
