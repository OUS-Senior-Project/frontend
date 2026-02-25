'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Download, RefreshCw, Trash2 } from 'lucide-react';
import { getBulkSubmissionJobStatus } from '@/features/submissions/api/submissionsService';
import {
  buildBulkJobReportCsv,
  buildBulkJobReportJson,
  countBulkJobItemStatuses,
  downloadTextFile,
  getBulkJobErrorCode,
  getBulkJobErrorMessage,
} from '@/features/submissions/components/adminBulkBackfillMonitorUtils';
import { formatUIErrorMessage, toUIError } from '@/lib/api/errors';
import type {
  BulkJobStatus,
  BulkSubmissionStatusResponse,
  UIError,
} from '@/lib/api/types';
import {
  clearTrackedBulkBackfillJobs,
  readTrackedBulkBackfillJobs,
  trackBulkBackfillJob,
  type TrackedBulkBackfillJob,
  untrackBulkBackfillJob,
} from '@/lib/storage/bulkBackfillJobs';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { cn } from '@/shared/utils/cn';

const POLL_INTERVAL_MS = 5000;

type JobState = {
  detail: BulkSubmissionStatusResponse | null;
  error: UIError | null;
  loading: boolean;
  lastFetchedAt: string | null;
};

type JobStatesById = Record<string, JobState | undefined>;

const BULK_JOB_STATUS_BADGE_VARIANTS: Record<
  BulkJobStatus | 'unknown' | 'error',
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  queued: 'secondary',
  processing: 'secondary',
  completed: 'default',
  failed: 'destructive',
  unknown: 'outline',
  error: 'destructive',
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isInProgressStatus(status: BulkJobStatus | null | undefined) {
  return status === 'queued' || status === 'processing';
}

function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function getJobState(jobStates: JobStatesById, jobId: string): JobState {
  return (
    jobStates[jobId] ?? {
      detail: null,
      error: null,
      loading: false,
      lastFetchedAt: null,
    }
  );
}

function getListItemStatus(
  state: JobState
): BulkJobStatus | 'unknown' | 'error' {
  if (state.error) {
    return 'error';
  }

  return state.detail?.status ?? 'unknown';
}

function getListItemStatusLabel(state: JobState) {
  const status = getListItemStatus(state);
  return status === 'error' ? state.error!.code : status;
}

function getReportFilePrefix(detail: BulkSubmissionStatusResponse) {
  return `bulk-backfill-${detail.jobId}`;
}

export function AdminBulkBackfillMonitor() {
  const [trackedJobs, setTrackedJobs] = useState<TrackedBulkBackfillJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobStates, setJobStates] = useState<JobStatesById>({});
  const [jobIdInput, setJobIdInput] = useState('');
  const [jobIdInputError, setJobIdInputError] = useState<string | null>(null);
  const [refreshAllLoading, setRefreshAllLoading] = useState(false);
  const activeRefreshControllersRef = useRef<
    Record<string, AbortController | undefined>
  >({});
  const latestRefreshRequestIdsRef = useRef<Record<string, number>>({});

  const refreshJob = useCallback(
    async (jobId: string, options: { signal?: AbortSignal } = {}) => {
      const trimmedJobId = jobId.trim();
      /* istanbul ignore next -- UI/state only call refreshJob with normalized non-empty IDs */
      if (!trimmedJobId) {
        return;
      }

      activeRefreshControllersRef.current[trimmedJobId]?.abort();

      const controller = new AbortController();
      activeRefreshControllersRef.current[trimmedJobId] = controller;

      const requestId =
        (latestRefreshRequestIdsRef.current[trimmedJobId] ?? 0) + 1;
      latestRefreshRequestIdsRef.current[trimmedJobId] = requestId;

      const externalSignal = options.signal;
      const handleExternalAbort = () => {
        controller.abort();
      };

      if (externalSignal) {
        if (externalSignal.aborted) {
          /* istanbul ignore next -- defensive race if caller aborts before refreshJob wires listeners */
          controller.abort();
        } else {
          externalSignal.addEventListener('abort', handleExternalAbort, {
            once: true,
          });
        }
      }

      setJobStates((previous) => ({
        ...previous,
        [trimmedJobId]: {
          ...getJobState(previous, trimmedJobId),
          loading: true,
        },
      }));

      try {
        const detail = await getBulkSubmissionJobStatus(trimmedJobId, {
          signal: controller.signal,
        });

        if (
          controller.signal.aborted ||
          latestRefreshRequestIdsRef.current[trimmedJobId] !== requestId
        ) {
          return;
        }

        setJobStates((previous) => ({
          ...previous,
          [trimmedJobId]: {
            detail,
            error: null,
            loading: false,
            lastFetchedAt: new Date().toISOString(),
          },
        }));
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        if (
          controller.signal.aborted ||
          latestRefreshRequestIdsRef.current[trimmedJobId] !== requestId
        ) {
          return;
        }

        setJobStates((previous) => ({
          ...previous,
          [trimmedJobId]: {
            ...getJobState(previous, trimmedJobId),
            error: toUIError(
              error,
              `Unable to load bulk backfill job "${trimmedJobId}".`
            ),
            loading: false,
            lastFetchedAt: new Date().toISOString(),
          },
        }));
      } finally {
        if (externalSignal) {
          externalSignal.removeEventListener('abort', handleExternalAbort);
        }

        if (activeRefreshControllersRef.current[trimmedJobId] === controller) {
          delete activeRefreshControllersRef.current[trimmedJobId];
        }
      }
    },
    []
  );

  const refreshTrackedJobs = useCallback(async () => {
    /* istanbul ignore next -- refresh-all button is disabled when no tracked jobs exist */
    if (!trackedJobs.length) {
      return;
    }

    setRefreshAllLoading(true);
    try {
      await Promise.all(
        trackedJobs.map((trackedJob) => refreshJob(trackedJob.jobId))
      );
    } finally {
      setRefreshAllLoading(false);
    }
  }, [refreshJob, trackedJobs]);

  useEffect(() => {
    const storedJobs = readTrackedBulkBackfillJobs();
    setTrackedJobs(storedJobs);
    setSelectedJobId(storedJobs[0]?.jobId ?? null);

    if (storedJobs.length) {
      void Promise.all(
        storedJobs.map((storedJob) => refreshJob(storedJob.jobId))
      );
    }
  }, [refreshJob]);

  useEffect(() => {
    if (!trackedJobs.length) {
      if (selectedJobId !== null) {
        setSelectedJobId(null);
      }
      return;
    }

    const stillTracked = trackedJobs.some(
      (trackedJob) => trackedJob.jobId === selectedJobId
    );
    if (!stillTracked) {
      setSelectedJobId(trackedJobs[0].jobId);
    }
  }, [selectedJobId, trackedJobs]);

  useEffect(() => {
    return () => {
      Object.values(activeRefreshControllersRef.current).forEach(
        (controller) => {
          controller?.abort();
        }
      );
      activeRefreshControllersRef.current = {};
    };
  }, []);

  const selectedJobState = selectedJobId
    ? getJobState(jobStates, selectedJobId)
    : null;
  const selectedJobDetail = selectedJobState?.detail ?? null;
  const selectedJobError = selectedJobState?.error ?? null;
  const selectedJobStatus = selectedJobDetail?.status ?? null;

  useEffect(() => {
    if (!selectedJobId || !selectedJobStatus) {
      return;
    }

    if (!isInProgressStatus(selectedJobStatus)) {
      return;
    }

    const controller = new AbortController();
    const intervalId = window.setInterval(() => {
      void refreshJob(selectedJobId, { signal: controller.signal });
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshJob, selectedJobId, selectedJobStatus]);

  const failedOrSkippedResults = selectedJobDetail
    ? selectedJobDetail.results.filter(
        (result) => result.status === 'failed' || result.status === 'skipped'
      )
    : [];
  const itemStatusCounts = selectedJobDetail
    ? countBulkJobItemStatuses(selectedJobDetail.results)
    : null;

  const selectedListItemStatus = selectedJobState
    ? getListItemStatus(selectedJobState)
    : 'unknown';

  const trackedJobsWithState = trackedJobs.map((trackedJob) => ({
    trackedJob,
    state: getJobState(jobStates, trackedJob.jobId),
  }));

  async function handleTrackJobSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedJobId = jobIdInput.trim();
    if (!trimmedJobId) {
      setJobIdInputError('Enter a bulk job ID to track.');
      return;
    }

    setJobIdInputError(null);
    const updatedTrackedJobs = trackBulkBackfillJob(trimmedJobId);
    setTrackedJobs(updatedTrackedJobs);
    setSelectedJobId(trimmedJobId);
    setJobIdInput('');
    await refreshJob(trimmedJobId);
  }

  function handleUntrackJob(jobId: string) {
    const updatedTrackedJobs = untrackBulkBackfillJob(jobId);
    setTrackedJobs(updatedTrackedJobs);
    setJobStates((previous) => {
      const next = { ...previous };
      delete next[jobId];
      return next;
    });
  }

  function handleClearTrackedJobs() {
    clearTrackedBulkBackfillJobs();
    setTrackedJobs([]);
    setSelectedJobId(null);
    setJobStates({});
  }

  function handleDownloadReport(format: 'json' | 'csv') {
    /* istanbul ignore next -- download buttons are disabled when no job detail is selected */
    if (!selectedJobDetail) {
      return;
    }

    const filePrefix = getReportFilePrefix(selectedJobDetail);
    if (format === 'json') {
      downloadTextFile(
        `${filePrefix}.json`,
        buildBulkJobReportJson(selectedJobDetail),
        'application/json;charset=utf-8'
      );
      return;
    }

    downloadTextFile(
      `${filePrefix}.csv`,
      buildBulkJobReportCsv(selectedJobDetail),
      'text/csv;charset=utf-8'
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Tracked jobs (this browser)
          </h2>
          <p className="text-sm text-muted-foreground">
            Stored locally in this browser. Paste a job ID from backend
            logs/output to track it. Status details are fetched from the backend
            bulk job status API.
          </p>
        </div>

        <form className="space-y-2" onSubmit={handleTrackJobSubmit}>
          <label
            htmlFor="bulk-job-id"
            className="text-sm font-medium text-foreground"
          >
            Track a job ID
          </label>
          <div className="flex gap-2">
            <Input
              id="bulk-job-id"
              value={jobIdInput}
              onChange={(event) => {
                setJobIdInput(event.target.value);
                if (jobIdInputError) {
                  setJobIdInputError(null);
                }
              }}
              placeholder="bulk_..."
              aria-invalid={Boolean(jobIdInputError)}
            />
            <Button type="submit">Track</Button>
          </div>
          {jobIdInputError && (
            <p className="text-sm text-destructive" role="alert">
              {jobIdInputError}
            </p>
          )}
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void refreshTrackedJobs();
            }}
            disabled={!trackedJobs.length || refreshAllLoading}
            aria-label="Refresh tracked jobs"
          >
            {refreshAllLoading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh all
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearTrackedJobs}
            disabled={!trackedJobs.length}
            aria-label="Clear tracked jobs"
          >
            <Trash2 className="h-4 w-4" />
            Clear list
          </Button>
        </div>

        {!trackedJobs.length ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No tracked jobs in this browser yet. Paste a bulk job ID from
            backend logs/output or bulk command output to monitor progress and
            per-file validation errors.
          </div>
        ) : (
          <div className="space-y-2" aria-label="Tracked bulk jobs list">
            {trackedJobsWithState.map(({ trackedJob, state }) => {
              const status = getListItemStatus(state);
              const isSelected = trackedJob.jobId === selectedJobId;

              return (
                <div
                  key={trackedJob.jobId}
                  className={cn(
                    'rounded-lg border p-3',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background'
                  )}
                >
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-2 text-left"
                    onClick={() => {
                      setSelectedJobId(trackedJob.jobId);
                      if (!state.detail && !state.loading) {
                        void refreshJob(trackedJob.jobId);
                      }
                    }}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs text-foreground">
                        {trackedJob.jobId}
                      </span>
                      <Badge
                        variant={BULK_JOB_STATUS_BADGE_VARIANTS[status]}
                        className="capitalize"
                      >
                        {getListItemStatusLabel(state)}
                      </Badge>
                    </div>

                    <div className="w-full text-xs text-muted-foreground">
                      {state.loading ? (
                        <span className="inline-flex items-center gap-1">
                          <Spinner className="h-3 w-3" />
                          Loading...
                        </span>
                      ) : state.error ? (
                        <span>{formatUIErrorMessage(state.error)}</span>
                      ) : state.detail ? (
                        <span>
                          {state.detail.processedFiles}/
                          {state.detail.totalFiles} processed •{' '}
                          {state.detail.failedFiles} failed
                        </span>
                      ) : (
                        <span>Not loaded yet</span>
                      )}
                    </div>
                  </button>

                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleUntrackJob(trackedJob.jobId);
                      }}
                      aria-label={`Remove ${trackedJob.jobId} from tracked jobs`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              Job Detail
            </h2>
            <p className="text-sm text-muted-foreground">
              Per-file processing status, validation errors, and operator report
              downloads for the selected bulk backfill job.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selectedJobId) {
                  void refreshJob(selectedJobId);
                }
              }}
              disabled={!selectedJobId || Boolean(selectedJobState?.loading)}
              aria-label="Refresh selected job"
            >
              {selectedJobState?.loading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh job
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleDownloadReport('json');
              }}
              disabled={!selectedJobDetail}
            >
              <Download className="h-4 w-4" />
              Export JSON (local)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleDownloadReport('csv');
              }}
              disabled={!selectedJobDetail}
            >
              <Download className="h-4 w-4" />
              Export CSV (local)
            </Button>
          </div>
        </div>

        {!selectedJobId ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            Select a tracked job to inspect per-file status and validation
            errors.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-foreground">
                {selectedJobId}
              </span>
              <Badge
                variant={
                  BULK_JOB_STATUS_BADGE_VARIANTS[
                    selectedListItemStatus === 'error'
                      ? 'error'
                      : selectedListItemStatus
                  ]
                }
                className="capitalize"
              >
                {selectedListItemStatus === 'error'
                  ? selectedJobError!.code
                  : selectedListItemStatus}
              </Badge>
              {selectedJobState?.lastFetchedAt && (
                <span className="text-xs text-muted-foreground">
                  Last checked{' '}
                  {formatDateTimeLabel(selectedJobState.lastFetchedAt)}
                </span>
              )}
            </div>

            {selectedJobError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Unable to load job status</AlertTitle>
                <AlertDescription>
                  <p>{formatUIErrorMessage(selectedJobError)}</p>
                </AlertDescription>
              </Alert>
            )}

            {selectedJobDetail && (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Job
                    </p>
                    <p className="mt-1 text-sm font-medium capitalize text-foreground">
                      {selectedJobDetail.status}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedJobDetail.processedFiles}/
                      {selectedJobDetail.totalFiles} files processed
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Success / Failed
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {selectedJobDetail.succeededFiles} /{' '}
                      {selectedJobDetail.failedFiles}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Activate latest:{' '}
                      {selectedJobDetail.activateLatest ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Timing
                    </p>
                    <p className="mt-1 text-xs text-foreground">
                      Created:{' '}
                      {formatDateTimeLabel(selectedJobDetail.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-foreground">
                      Completed:{' '}
                      {formatDateTimeLabel(selectedJobDetail.completedAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Item Status Counts
                    </p>
                    <p className="mt-1 text-xs text-foreground">
                      Queued {itemStatusCounts!.queued} • Processing{' '}
                      {itemStatusCounts!.processing}
                    </p>
                    <p className="mt-1 text-xs text-foreground">
                      Completed {itemStatusCounts!.completed} • Failed{' '}
                      {itemStatusCounts!.failed} • Skipped{' '}
                      {itemStatusCounts!.skipped}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Operator actions
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Backend report download endpoints are not available yet.
                    Export JSON/CSV (local) generates files in this browser from
                    the current job detail payload.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      aria-label="Retry failed items (not supported yet)"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry failed items (backend pending)
                    </Button>
                  </div>

                  {failedOrSkippedResults.length > 0 ? (
                    <Alert className="mt-3">
                      <AlertCircle />
                      <AlertTitle>
                        Retry failed items is not available yet
                      </AlertTitle>
                      <AlertDescription>
                        <p>
                          Retry is not supported by the backend yet. Re-run the
                          bulk ingestion with the same inputs to retry
                          failed/skipped items. Job ID:{' '}
                          {selectedJobDetail.jobId}
                        </p>
                        <p>
                          Impacted items ({failedOrSkippedResults.length}):{' '}
                          {failedOrSkippedResults
                            .map((result) => result.fileName)
                            .join(', ')}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="mt-3 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                      No failed or skipped items to retry.
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border">
                  <div className="border-b border-border px-3 py-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      Per-file Status
                    </h3>
                  </div>
                  {selectedJobDetail.results.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No file results have been recorded for this job yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Error</TableHead>
                            <TableHead>Validation Errors</TableHead>
                            <TableHead>Submission</TableHead>
                            <TableHead>Dataset</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedJobDetail.results.map((result) => (
                            <TableRow
                              key={`${result.fileOrder}-${result.fileName}`}
                            >
                              <TableCell className="align-top font-mono text-xs">
                                {result.fileOrder}
                              </TableCell>
                              <TableCell className="max-w-[320px] align-top">
                                <div className="truncate font-mono text-xs">
                                  {result.fileName}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Completed:{' '}
                                  {formatDateTimeLabel(result.completedAt)}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                <Badge
                                  variant={
                                    result.status === 'failed'
                                      ? 'destructive'
                                      : result.status === 'completed'
                                        ? 'default'
                                        : 'secondary'
                                  }
                                  className="capitalize"
                                >
                                  {result.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[220px] align-top text-xs">
                                {result.error ? (
                                  <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                      {getBulkJobErrorCode(result.error)}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {getBulkJobErrorMessage(result.error)}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    None
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="min-w-[280px] align-top text-xs text-muted-foreground">
                                {result.validationErrors.length ? (
                                  <details>
                                    <summary className="cursor-pointer text-foreground">
                                      {result.validationErrors.length}{' '}
                                      validation error
                                      {result.validationErrors.length === 1
                                        ? ''
                                        : 's'}
                                    </summary>
                                    <ul className="mt-2 space-y-2">
                                      {result.validationErrors.map(
                                        (validationError, index) => (
                                          <li
                                            key={`${result.fileOrder}-${index}`}
                                          >
                                            <p className="font-medium text-foreground">
                                              {getBulkJobErrorCode(
                                                validationError
                                              )}
                                            </p>
                                            <p>
                                              {getBulkJobErrorMessage(
                                                validationError
                                              )}
                                            </p>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </details>
                                ) : (
                                  'None'
                                )}
                              </TableCell>
                              <TableCell className="align-top font-mono text-xs">
                                {result.submissionId ?? 'None'}
                              </TableCell>
                              <TableCell className="align-top font-mono text-xs">
                                {result.datasetId ?? 'None'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
