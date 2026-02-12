import { ServiceError } from '@/lib/api/errors';
import type {
  CreateSubmissionRequest,
  DatasetSubmission,
} from '@/lib/api/types';

export async function createDatasetSubmission(
  _request: CreateSubmissionRequest
): Promise<DatasetSubmission> {
  throw new ServiceError(
    'NOT_IMPLEMENTED',
    'Not implemented: createDatasetSubmission (Campaign 3)',
    true
  );
}

export async function getDatasetSubmissionStatus(
  _submissionId: string
): Promise<DatasetSubmission> {
  throw new ServiceError(
    'NOT_IMPLEMENTED',
    'Not implemented: getDatasetSubmissionStatus (Campaign 3)',
    true
  );
}
