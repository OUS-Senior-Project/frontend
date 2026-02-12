import { ServiceError } from '@/lib/api/errors';
import type { DatasetOverviewResponse } from '@/lib/api/types';

export async function getDatasetOverview(
  _datasetId: string,
  _asOfDate: Date
): Promise<DatasetOverviewResponse> {
  throw new ServiceError(
    'NOT_IMPLEMENTED',
    'Not implemented: getDatasetOverview (Campaign 3)',
    true
  );
}
