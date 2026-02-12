import { apiClient } from '@/lib/api/client';
import {
  normalizeDatasetForecastResponse,
  type RawDatasetForecastResponse,
} from '@/lib/api/normalize';
import type { ForecastsAnalyticsResponse } from '@/lib/api/types';

const API_PREFIX = '/api/v1';

interface GetForecastsAnalyticsOptions {
  horizon?: number;
  signal?: AbortSignal;
}

export async function getForecastsAnalytics(
  datasetId: string,
  options: GetForecastsAnalyticsOptions = {}
): Promise<ForecastsAnalyticsResponse> {
  const encodedDatasetId = encodeURIComponent(datasetId);

  const response = await apiClient.get<RawDatasetForecastResponse>(
    `${API_PREFIX}/datasets/${encodedDatasetId}/forecasts`,
    {
      query: {
        horizon: options.horizon ?? 4,
      },
      signal: options.signal,
      datasetCache: { datasetId },
    }
  );

  return normalizeDatasetForecastResponse(response);
}
