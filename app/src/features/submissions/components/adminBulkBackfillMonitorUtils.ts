import type {
  BulkJobItemStatus,
  BulkSubmissionFileResult,
  BulkSubmissionStatusResponse,
  ErrorDetail,
} from '@/lib/api/types';

export type BulkJobItemStatusCounts = Record<BulkJobItemStatus, number>;

export function getBulkJobErrorCode(value: ErrorDetail | null | undefined) {
  return typeof value?.code === 'string' ? value.code : 'UNKNOWN_ERROR';
}

export function getBulkJobErrorMessage(value: ErrorDetail | null | undefined) {
  return typeof value?.message === 'string' && value.message.trim()
    ? value.message
    : 'No error message provided.';
}

function summarizeValidationErrors(validationErrors: ErrorDetail[]) {
  if (!validationErrors.length) {
    return 'None';
  }

  return validationErrors
    .map((validationError) => {
      const code = getBulkJobErrorCode(validationError);
      const message = getBulkJobErrorMessage(validationError);
      return `${code}: ${message}`;
    })
    .join(' | ');
}

function escapeCsvValue(value: string) {
  const escaped = value.replaceAll('"', '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function countBulkJobItemStatuses(
  results: BulkSubmissionFileResult[]
): BulkJobItemStatusCounts {
  const counts: BulkJobItemStatusCounts = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  results.forEach((result) => {
    counts[result.status] += 1;
  });

  return counts;
}

export function buildBulkJobReportJson(detail: BulkSubmissionStatusResponse) {
  return JSON.stringify(detail, null, 2);
}

export function buildBulkJobReportCsv(detail: BulkSubmissionStatusResponse) {
  const header = [
    'jobId',
    'jobStatus',
    'fileOrder',
    'fileName',
    'itemStatus',
    'submissionId',
    'datasetId',
    'completedAt',
    'errorCode',
    'errorMessage',
    'validationErrorCount',
    'validationErrors',
  ];

  const rows = detail.results.map((result) => [
    detail.jobId,
    detail.status,
    result.fileOrder,
    result.fileName,
    result.status,
    result.submissionId ?? '',
    result.datasetId ?? '',
    result.completedAt ?? '',
    result.error ? getBulkJobErrorCode(result.error) : '',
    result.error ? getBulkJobErrorMessage(result.error) : '',
    result.validationErrors.length,
    summarizeValidationErrors(result.validationErrors),
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCsvValue(String(cell))).join(','))
    .join('\n');
}

export function downloadTextFile(
  fileName: string,
  contents: string,
  mimeType: string
) {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return false;
  }

  const blob = new Blob([contents], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
  return true;
}
