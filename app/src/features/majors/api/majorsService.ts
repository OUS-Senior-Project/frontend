import { ServiceError } from '@/lib/api/errors';
import type { MajorsAnalyticsResponse } from '@/lib/api/types';

export async function getMajorsAnalytics(
  _datasetId: string
): Promise<MajorsAnalyticsResponse> {
  throw new ServiceError(
    'NOT_IMPLEMENTED',
    'Not implemented: getMajorsAnalytics (Campaign 3)',
    true
  );
}
