import { ServiceError } from '@/lib/api/errors';
import type { ForecastsAnalyticsResponse } from '@/lib/api/types';

export async function getForecastsAnalytics(
  _datasetId: string
): Promise<ForecastsAnalyticsResponse> {
  throw new ServiceError(
    'NOT_IMPLEMENTED',
    'Not implemented: getForecastsAnalytics (Campaign 3)',
    true
  );
}
