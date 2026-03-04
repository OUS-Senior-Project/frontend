import { apiClient } from '@/lib/api/client';
import { ServiceError } from '@/lib/api/errors';
import {
  isRawDatasetForecastResponse,
  normalizeDatasetForecastResponse,
} from '@/lib/api/normalize';
import {
  buildGuardedQuery,
  encodePathSegment,
  toApiPath,
  withDatasetCache,
} from '@/lib/api/service-helpers';
import type {
  ForecastRange,
  ForecastsAnalyticsResponse,
} from '@/lib/api/types';

const FORECASTS_QUERY_ALLOWLIST = ['horizon', 'range'] as const;

interface GetForecastsAnalyticsOptions {
  horizon?: number;
  range?: ForecastRange;
  signal?: AbortSignal;
}

export async function getForecastsAnalytics(
  datasetId: string,
  options: GetForecastsAnalyticsOptions = {}
): Promise<ForecastsAnalyticsResponse> {
  const endpoint = toApiPath(
    `/datasets/${encodePathSegment(datasetId)}/forecasts`
  );

  const rawResponse = await apiClient.get<unknown>(
    endpoint,
    withDatasetCache(datasetId, {
      query: buildGuardedQuery({
        endpoint,
        params:
          options.range !== undefined
            ? { range: options.range }
            : options.horizon !== undefined
              ? { horizon: options.horizon }
              : { range: 'medium' },
        allowedKeys: FORECASTS_QUERY_ALLOWLIST,
      }),
      signal: options.signal,
    })
  );

  if (!isRawDatasetForecastResponse(rawResponse)) {
    throw new ServiceError(
      'INVALID_RESPONSE_SHAPE',
      'Forecast response was malformed.',
      {
        retryable: false,
        details: { endpoint, datasetId },
      }
    );
  }

  return normalizeDatasetForecastResponse(rawResponse);
}
