import { ServiceError } from '@/lib/api/errors';
import type { DatasetSummary } from '@/lib/api/types';

export async function getActiveDataset(): Promise<DatasetSummary | null> {
  throw new ServiceError(
    'DATASET_NOT_FOUND',
    'No active dataset found. Upload a CSV to begin.',
    true
  );
}
