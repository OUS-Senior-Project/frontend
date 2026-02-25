import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { formatUIErrorMessage } from '@/lib/api/errors';
import type { ErrorDetail, UIError } from '@/lib/api/types';
import type { DashboardUploadFeedback } from '@/features/dashboard/types/uploadFeedback';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';

interface DashboardUploadFeedbackProps {
  uploadLoading: boolean;
  uploadError: UIError | null;
  uploadFeedback: DashboardUploadFeedback | null;
  uploadRetryAvailable?: boolean;
  onRetryUpload?: () => void;
}

function formatValidationError(error: ErrorDetail, index: number) {
  const code =
    typeof error.code === 'string' && error.code.trim() !== ''
      ? error.code
      : null;
  const message =
    typeof error.message === 'string' && error.message.trim() !== ''
      ? error.message
      : null;

  if (code && message) {
    return `${code}: ${message}`;
  }

  return code || message || `Validation error ${index + 1}`;
}

function getProgressState(feedback: DashboardUploadFeedback) {
  switch (feedback.phase) {
    case 'queued':
      return { value: 20, label: 'Queued' };
    case 'processing':
      return { value: 60, label: 'Processing' };
    case 'ready':
      return { value: 100, label: 'Ready' };
    case 'failed':
      return { value: 100, label: 'Failed' };
    default:
      return { value: 0, label: 'Pending' };
  }
}

function isConflictUploadError(error: UIError | null | undefined) {
  return error?.code === 'EFFECTIVE_DATE_UPLOAD_LIMIT' || error?.status === 409;
}

function isValidationUploadError(error: UIError | null | undefined) {
  return error?.code === 'VALIDATION_FAILED' || error?.status === 422;
}

function isRecoverableUploadRetryError(error: UIError | null | undefined) {
  if (!error || error.retryable !== true) {
    return false;
  }

  const status = error.status;
  return status === undefined || status >= 500;
}

function getPhaseTitle(feedback: DashboardUploadFeedback) {
  switch (feedback.phase) {
    case 'queued':
      return 'Upload queued';
    case 'processing':
      return 'Upload processing';
    case 'ready':
      return 'Upload ready';
    case 'failed':
      return 'Upload failed';
    default:
      return 'Upload status';
  }
}

function getPhaseSummary(
  feedback: DashboardUploadFeedback,
  uploadLoading: boolean
) {
  if (feedback.phase === 'failed') {
    return 'The backend returned an upload error. Review the code/message and follow the guidance below.';
  }

  if (feedback.phase === 'ready') {
    return 'The submission completed successfully and the dashboard will use the latest processed dataset.';
  }

  if (uploadLoading) {
    return 'Submission was created and is being polled for status updates.';
  }

  return 'Status was updated from the backend submission endpoint.';
}

function getBadgeVariant(feedback: DashboardUploadFeedback) {
  if (feedback.phase === 'failed') {
    return 'destructive' as const;
  }

  if (feedback.phase === 'ready') {
    return 'secondary' as const;
  }

  return 'outline' as const;
}

function hasCurrentMomentHint(feedback: DashboardUploadFeedback) {
  const mentionsCurrentMomentOrDatetime = (value: unknown) =>
    typeof value === 'string' && /(current moment|datetime)/i.test(value);

  const candidates = [
    feedback.error?.message,
    typeof feedback.error?.details === 'string' ? feedback.error.details : null,
    ...feedback.validationErrors.map(
      (error) => `${String(error.code ?? '')} ${String(error.message ?? '')}`
    ),
  ];

  return candidates.some(mentionsCurrentMomentOrDatetime);
}

function getGuidance(feedback: DashboardUploadFeedback) {
  const error = feedback.error;
  if (!error) {
    return [] as string[];
  }

  if (isConflictUploadError(error)) {
    const effectiveDate =
      feedback.inferredEffectiveDate ?? 'this effective date';
    const items = [
      `An upload already exists for ${effectiveDate}.`,
      'Open the Admin Console to inspect the existing submission and snapshot for that date.',
      'Use admin override/backfill actions only if your role is allowed to perform them.',
    ];

    if (feedback.submissionId) {
      items.push(`Existing submission: ${feedback.submissionId}.`);
    }

    return items;
  }

  if (isValidationUploadError(error)) {
    const items = [
      'Fix the source file and upload again using the backend error code/message shown below.',
      'Review row-level validation errors in this panel when provided by the backend.',
    ];

    if (hasCurrentMomentHint(feedback)) {
      items.push(
        'If the error references Current Moment (DateTime), ensure every row has the same value and a valid datetime format.'
      );
    }

    return items;
  }

  if (error.code === 'SUBMISSION_POLL_TIMEOUT') {
    return [
      'The upload may still be processing on the backend.',
      'Retry status checks or retry the upload if the failure persists.',
    ];
  }

  if (isRecoverableUploadRetryError(error)) {
    return [
      'Retry the upload. If it fails again, capture the error code and request ID for investigation.',
    ];
  }

  return [];
}

function getInferredEffectiveDateFallback(feedback: DashboardUploadFeedback) {
  if (feedback.phase === 'queued' || feedback.phase === 'processing') {
    return 'Inferring...';
  }

  return 'Not available yet';
}

function formatNullableText(value: string | null | undefined, fallback = '—') {
  if (!value || value.trim() === '') {
    return fallback;
  }

  return value;
}

export function DashboardUploadFeedbackAlert({
  uploadLoading,
  uploadError,
  uploadFeedback,
  uploadRetryAvailable = false,
  onRetryUpload,
}: DashboardUploadFeedbackProps) {
  if (!uploadLoading && !uploadError && !uploadFeedback) {
    return null;
  }

  if (!uploadFeedback) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Clock3 className="h-4 w-4" />
        {uploadLoading
          ? 'Submitting dataset...'
          : formatUIErrorMessage(uploadError, 'Upload status unavailable.')}
      </p>
    );
  }

  const progress = getProgressState(uploadFeedback);
  const title = getPhaseTitle(uploadFeedback);
  const summary = getPhaseSummary(uploadFeedback, uploadLoading);
  const error = uploadFeedback.error ?? uploadError;
  const guidance = getGuidance(uploadFeedback);
  const Icon =
    uploadFeedback.phase === 'failed'
      ? AlertCircle
      : uploadFeedback.phase === 'ready'
        ? CheckCircle2
        : Clock3;

  return (
    <Alert
      variant={uploadFeedback.phase === 'failed' ? 'destructive' : 'default'}
      className="w-full"
    >
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="w-full gap-3">
        <p>{summary}</p>

        <div className="grid w-full gap-2 sm:grid-cols-2">
          <p>
            <span className="font-medium">File:</span>{' '}
            {formatNullableText(uploadFeedback.fileName)}
          </p>
          <p>
            <span className="font-medium">Inferred effective date:</span>{' '}
            {formatNullableText(
              uploadFeedback.inferredEffectiveDate,
              getInferredEffectiveDateFallback(uploadFeedback)
            )}
          </p>
          <p>
            <span className="font-medium">Submission status:</span>{' '}
            {formatNullableText(uploadFeedback.submissionStatus, 'Not created')}
          </p>
          <p>
            <span className="font-medium">Submission ID:</span>{' '}
            {formatNullableText(uploadFeedback.submissionId)}
          </p>
          <p>
            <span className="font-medium">Dataset ID:</span>{' '}
            {formatNullableText(uploadFeedback.datasetId)}
          </p>
        </div>

        <div className="w-full space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Progress
            </span>
            <Badge variant={getBadgeVariant(uploadFeedback)}>
              {progress.label}
            </Badge>
          </div>
          <Progress
            value={progress.value}
            aria-label={`Upload progress ${progress.label}`}
          />
          <p className="text-xs text-muted-foreground">
            Stage-based upload progress: {progress.value}%.
          </p>
        </div>

        {error && (
          <div className="w-full rounded-md border border-current/20 px-3 py-2">
            <p>
              <span className="font-medium">Error code:</span>{' '}
              <code>{error.code}</code>
            </p>
            <p>
              <span className="font-medium">Message:</span>{' '}
              {formatUIErrorMessage(error)}
            </p>
          </div>
        )}

        {uploadFeedback.validationErrors.length > 0 && (
          <div className="w-full">
            <p className="font-medium">Validation errors</p>
            <ul className="list-disc space-y-1 pl-5">
              {uploadFeedback.validationErrors.map((item, index) => (
                <li key={`${String(item.code ?? 'validation')}-${index}`}>
                  {formatValidationError(item, index)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {guidance.length > 0 && (
          <div className="w-full">
            <p className="font-medium">Next steps</p>
            <ul className="list-disc space-y-1 pl-5">
              {guidance.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {isConflictUploadError(error) && (
          <Button
            asChild
            variant="outline"
            className="cursor-pointer bg-transparent"
          >
            <Link href="/admin-console">Open Admin Console</Link>
          </Button>
        )}

        {uploadFeedback.phase === 'failed' &&
          uploadRetryAvailable &&
          onRetryUpload && (
            <Button
              variant="outline"
              className="cursor-pointer bg-transparent"
              onClick={onRetryUpload}
            >
              Retry upload
            </Button>
          )}
      </AlertDescription>
    </Alert>
  );
}
