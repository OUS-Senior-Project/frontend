import type { ErrorDetail, SubmissionStatus, UIError } from '@/lib/api/types';

export type DashboardUploadPhase = 'queued' | 'processing' | 'ready' | 'failed';

export interface DashboardUploadFeedback {
  phase: DashboardUploadPhase;
  fileName: string;
  submissionStatus: SubmissionStatus | null;
  submissionId: string | null;
  datasetId: string | null;
  inferredEffectiveDate: string | null;
  inferredEffectiveDatetime: string | null;
  validationErrors: ErrorDetail[];
  error: UIError | null;
}
