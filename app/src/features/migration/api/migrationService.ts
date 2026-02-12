import { ServiceError } from '@/lib/api/errors';
import type { MigrationAnalyticsResponse } from '@/lib/api/types';

export async function getMigrationAnalytics(
  _datasetId: string
): Promise<MigrationAnalyticsResponse> {
  throw new ServiceError(
    'NOT_IMPLEMENTED',
    'Not implemented: getMigrationAnalytics (Campaign 3)',
    true
  );
}
