'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  activateDataset,
  getActiveDataset,
  getDatasetById,
} from '@/features/datasets/api';
import { listSnapshots } from '@/features/snapshots/api';
import { getDatasetSubmissionStatus } from '@/features/submissions/api';
import { AdminBulkBackfillMonitor } from '@/features/submissions/components/AdminBulkBackfillMonitor';
import { formatUIErrorMessage, toUIError } from '@/lib/api/errors';
import type {
  DatasetDetail,
  DatasetSummary,
  DatasetSubmission,
  SnapshotListResponse,
  SnapshotStatus,
  SnapshotSummary,
  UIError,
} from '@/lib/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

type SnapshotCatalogState = {
  loading: boolean;
  error: UIError | null;
  data: SnapshotListResponse | null;
};

type ActiveDatasetState = {
  loading: boolean;
  error: UIError | null;
  data: DatasetSummary | null;
};

type SnapshotDetailState = {
  loading: boolean;
  dataset: DatasetDetail | null;
  datasetError: UIError | null;
  submission: DatasetSubmission | null;
  submissionError: UIError | null;
};

type ActionNotice =
  | {
      tone: 'success';
      message: string;
    }
  | {
      tone: 'error';
      message: string;
    }
  | null;

const STATUS_FILTER_OPTIONS: SnapshotStatus[] = ['ready', 'building', 'failed'];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

const INITIAL_CATALOG_STATE: SnapshotCatalogState = {
  loading: true,
  error: null,
  data: null,
};

const INITIAL_ACTIVE_DATASET_STATE: ActiveDatasetState = {
  loading: true,
  error: null,
  data: null,
};

export function statusBadgeVariant(status: string) {
  if (status === 'failed') {
    return 'destructive' as const;
  }

  if (status === 'ready') {
    return 'secondary' as const;
  }

  return 'outline' as const;
}

export function formatNullableText(value: string | null | undefined) {
  if (value === null || value === undefined || value.trim() === '') {
    return '—';
  }

  return value;
}

export function formatValidationError(
  error: { code?: string; message?: string } | undefined,
  index: number
) {
  if (!error) {
    return `Error ${index + 1}`;
  }

  const code = error.code?.trim();
  const message = error.message?.trim();

  if (code && message) {
    return `${code}: ${message}`;
  }

  return code || message || `Error ${index + 1}`;
}

export function isSnapshotActivatable(snapshot: SnapshotSummary) {
  return snapshot.status === 'ready' && snapshot.datasetId != null;
}

export function AdminConsolePage() {
  const [statusFilter, setStatusFilter] = useState<SnapshotStatus>('ready');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshKey, setRefreshKey] = useState(0);
  const [catalogState, setCatalogState] = useState<SnapshotCatalogState>(
    INITIAL_CATALOG_STATE
  );
  const [activeDatasetState, setActiveDatasetState] =
    useState<ActiveDatasetState>(INITIAL_ACTIVE_DATASET_STATE);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    null
  );
  const [detailStateBySnapshotId, setDetailStateBySnapshotId] = useState<
    Record<string, SnapshotDetailState>
  >({});
  const [activationPendingSnapshotId, setActivationPendingSnapshotId] =
    useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadCatalog() {
      setCatalogState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));
      setActiveDatasetState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      const [snapshotsResult, activeDatasetResult] = await Promise.allSettled([
        listSnapshots({ page, pageSize, status: statusFilter }),
        getActiveDataset(),
      ]);

      if (isCancelled) {
        return;
      }

      setCatalogState((previous) => {
        if (snapshotsResult.status === 'fulfilled') {
          return {
            loading: false,
            error: null,
            data: snapshotsResult.value,
          };
        }

        return {
          loading: false,
          error: toUIError(
            snapshotsResult.reason,
            'Unable to load snapshot catalog.'
          ),
          data: previous.data,
        };
      });

      setActiveDatasetState((previous) => {
        if (activeDatasetResult.status === 'fulfilled') {
          return {
            loading: false,
            error: null,
            data: activeDatasetResult.value,
          };
        }

        return {
          loading: false,
          error: toUIError(
            activeDatasetResult.reason,
            'Unable to load active dataset state.'
          ),
          data: previous.data,
        };
      });
    }

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, [page, pageSize, refreshKey, statusFilter]);

  const snapshots = catalogState.data?.items ?? [];
  const total = catalogState.data?.total ?? 0;
  const effectivePage = catalogState.data?.page ?? page;
  const effectivePageSize = catalogState.data?.pageSize ?? pageSize;
  const pageCount = Math.max(1, Math.ceil(total / effectivePageSize));
  const activeDatasetId = activeDatasetState.data?.datasetId ?? null;
  const selectedSnapshot =
    selectedSnapshotId === null
      ? null
      : (snapshots.find(
          (snapshot) => snapshot.snapshotId === selectedSnapshotId
        ) ?? null);
  const selectedSnapshotDetail =
    selectedSnapshotId === null
      ? null
      : detailStateBySnapshotId[selectedSnapshotId];
  const selectedSubmissionValidationErrors =
    selectedSnapshotDetail?.submission?.validationErrors ?? [];

  async function loadSnapshotDetail(
    snapshot: SnapshotSummary,
    options: { force?: boolean } = {}
  ) {
    const existingState = detailStateBySnapshotId[snapshot.snapshotId];
    if (existingState && !options.force) {
      return;
    }

    setDetailStateBySnapshotId((previous) => ({
      ...previous,
      [snapshot.snapshotId]: {
        loading: true,
        dataset: previous[snapshot.snapshotId]?.dataset ?? null,
        datasetError: null,
        submission: previous[snapshot.snapshotId]?.submission ?? null,
        submissionError: null,
      },
    }));

    const [datasetResult, submissionResult] = await Promise.allSettled([
      snapshot.datasetId
        ? getDatasetById(snapshot.datasetId)
        : Promise.resolve(null),
      snapshot.submissionId
        ? getDatasetSubmissionStatus(snapshot.submissionId)
        : Promise.resolve(null),
    ]);

    setDetailStateBySnapshotId((previous) => ({
      ...previous,
      [snapshot.snapshotId]: {
        loading: false,
        dataset:
          datasetResult.status === 'fulfilled'
            ? datasetResult.value
            : (previous[snapshot.snapshotId]?.dataset ?? null),
        datasetError:
          datasetResult.status === 'fulfilled'
            ? null
            : toUIError(datasetResult.reason, 'Unable to load dataset detail.'),
        submission:
          submissionResult.status === 'fulfilled'
            ? submissionResult.value
            : (previous[snapshot.snapshotId]?.submission ?? null),
        submissionError:
          submissionResult.status === 'fulfilled'
            ? null
            : toUIError(
                submissionResult.reason,
                'Unable to load submission detail.'
              ),
      },
    }));
  }

  function handleToggleSnapshotDetail(snapshot: SnapshotSummary) {
    setActionNotice(null);
    if (selectedSnapshotId === snapshot.snapshotId) {
      setSelectedSnapshotId(null);
      return;
    }

    setSelectedSnapshotId(snapshot.snapshotId);
    void loadSnapshotDetail(snapshot);
  }

  async function handleActivateSnapshot(
    snapshotId: string,
    effectiveDate: string,
    datasetId: string
  ) {
    setActionNotice(null);
    setActivationPendingSnapshotId(snapshotId);

    try {
      await activateDataset(datasetId);

      // Re-fetch server truth so active indicators and snapshot catalog stay
      // deterministic even if activation response shape changes.
      setRefreshKey((value) => value + 1);

      setActionNotice({
        tone: 'success',
        message: `Activated snapshot ${snapshotId} (${effectiveDate}).`,
      });
    } catch (error) {
      setActionNotice({
        tone: 'error',
        message: formatUIErrorMessage(
          toUIError(error, 'Unable to activate snapshot dataset.')
        ),
      });
    } finally {
      setActivationPendingSnapshotId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin Console
            </h1>
            <p className="text-muted-foreground text-sm">
              Snapshot catalog for demo control. Activate the dataset linked to
              a snapshot to change the dashboard&apos;s active dataset.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </span>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as SnapshotStatus);
                  setPage(1);
                  setSelectedSnapshotId(null);
                }}
                aria-label="Snapshot status filter"
              >
                {STATUS_FILTER_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Page Size
              </span>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                  setSelectedSnapshotId(null);
                }}
                aria-label="Snapshot page size"
              >
                {PAGE_SIZE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={() => {
                setActionNotice(null);
                setRefreshKey((value) => value + 1);
              }}
              disabled={catalogState.loading || activeDatasetState.loading}
            >
              {catalogState.loading || activeDatasetState.loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </header>

        {actionNotice && (
          <Alert
            variant={actionNotice.tone === 'error' ? 'destructive' : 'default'}
            data-testid="admin-console-action-alert"
          >
            {actionNotice.tone === 'error' ? <AlertCircle /> : <CheckCircle2 />}
            <AlertTitle>
              {actionNotice.tone === 'error'
                ? 'Action failed'
                : 'Snapshot activated'}
            </AlertTitle>
            <AlertDescription>{actionNotice.message}</AlertDescription>
          </Alert>
        )}

        {catalogState.error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Unable to load snapshot catalog</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{formatUIErrorMessage(catalogState.error)}</p>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer bg-transparent"
                onClick={() => {
                  setRefreshKey((value) => value + 1);
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {activeDatasetState.error && (
          <Alert>
            <AlertCircle />
            <AlertTitle>Active indicator may be unavailable</AlertTitle>
            <AlertDescription>
              {formatUIErrorMessage(activeDatasetState.error)}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Snapshots</CardTitle>
            <CardDescription>
              {catalogState.loading
                ? 'Loading snapshots...'
                : `${total} snapshot${total === 1 ? '' : 's'} in ${statusFilter} status.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Academic Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Dataset ID</TableHead>
                  <TableHead>Submission ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogState.loading && snapshots.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground py-8"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Loading snapshots...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : snapshots.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground py-8"
                    >
                      No snapshots found for status filter{' '}
                      <strong>{statusFilter}</strong>.
                    </TableCell>
                  </TableRow>
                ) : (
                  snapshots.map((snapshot) => {
                    const isActive = Boolean(
                      activeDatasetId && snapshot.datasetId === activeDatasetId
                    );
                    const isSelected =
                      snapshot.snapshotId === selectedSnapshotId;
                    const canActivate = isSnapshotActivatable(snapshot);
                    const isActivating =
                      activationPendingSnapshotId === snapshot.snapshotId;

                    return (
                      <TableRow
                        key={snapshot.snapshotId}
                        data-state={isSelected ? 'selected' : undefined}
                        data-testid={`snapshot-row-${snapshot.snapshotId}`}
                      >
                        <TableCell>{snapshot.effectiveDate}</TableCell>
                        <TableCell>
                          {formatNullableText(snapshot.academicPeriod)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(snapshot.status)}>
                            {snapshot.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <time dateTime={snapshot.createdAt}>
                            {snapshot.createdAt}
                          </time>
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatNullableText(snapshot.datasetId)}
                        </TableCell>
                        <TableCell>
                          {formatNullableText(snapshot.submissionId)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? 'secondary' : 'outline'}
                              aria-label={`View snapshot detail ${snapshot.snapshotId}`}
                              onClick={() => {
                                handleToggleSnapshotDetail(snapshot);
                              }}
                            >
                              {isSelected ? 'Hide detail' : 'View detail'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              aria-label={`Set active snapshot ${snapshot.snapshotId}`}
                              disabled={
                                !canActivate ||
                                activationPendingSnapshotId !== null
                              }
                              onClick={() => {
                                void handleActivateSnapshot(
                                  snapshot.snapshotId,
                                  snapshot.effectiveDate,
                                  snapshot.datasetId as string
                                );
                              }}
                            >
                              {isActivating ? 'Activating...' : 'Set active'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Page {effectivePage} of {pageCount} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                    setSelectedSnapshotId(null);
                  }}
                  disabled={catalogState.loading || effectivePage <= 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage((current) => current + 1);
                    setSelectedSnapshotId(null);
                  }}
                  disabled={catalogState.loading || effectivePage >= pageCount}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedSnapshot && (
          <Card data-testid="snapshot-detail-panel">
            <CardHeader>
              <CardTitle>Snapshot Detail</CardTitle>
              <CardDescription>
                {selectedSnapshot.snapshotId} • {selectedSnapshot.effectiveDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Snapshot Status
                  </p>
                  <Badge variant={statusBadgeVariant(selectedSnapshot.status)}>
                    {selectedSnapshot.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Effective DateTime
                  </p>
                  <p className="text-sm">
                    {selectedSnapshot.effectiveDatetime}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Dataset ID
                  </p>
                  <p className="text-sm">
                    {formatNullableText(selectedSnapshot.datasetId)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Submission ID
                  </p>
                  <p className="text-sm">
                    {formatNullableText(selectedSnapshot.submissionId)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void loadSnapshotDetail(selectedSnapshot, { force: true });
                  }}
                  disabled={selectedSnapshotDetail?.loading}
                >
                  {selectedSnapshotDetail?.loading ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Refreshing detail...
                    </>
                  ) : (
                    'Refresh detail'
                  )}
                </Button>
              </div>

              {!selectedSnapshotDetail || selectedSnapshotDetail.loading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Spinner className="h-4 w-4" />
                  Loading snapshot detail...
                </div>
              ) : (
                <>
                  <div className="rounded-lg border p-4">
                    <h2 className="mb-3 text-sm font-semibold">
                      Read-model readiness
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                          Snapshot status
                        </p>
                        <Badge
                          variant={statusBadgeVariant(selectedSnapshot.status)}
                        >
                          {selectedSnapshot.status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                          Dataset status
                        </p>
                        {selectedSnapshot.datasetId === null ? (
                          <p className="text-sm">
                            No dataset linked to this snapshot.
                          </p>
                        ) : selectedSnapshotDetail.datasetError ? (
                          <p className="text-sm text-destructive">
                            {formatUIErrorMessage(
                              selectedSnapshotDetail.datasetError
                            )}
                          </p>
                        ) : selectedSnapshotDetail.dataset ? (
                          <div className="space-y-1 text-sm">
                            <Badge
                              variant={statusBadgeVariant(
                                selectedSnapshotDetail.dataset.status
                              )}
                            >
                              {selectedSnapshotDetail.dataset.status}
                            </Badge>
                            <p className="text-muted-foreground">
                              {selectedSnapshotDetail.dataset.name}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Dataset detail unavailable.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h2 className="mb-3 text-sm font-semibold">
                      Submission validation
                    </h2>

                    {selectedSnapshot.submissionId === null ? (
                      <p className="text-sm text-muted-foreground">
                        No submission is linked to this snapshot.
                      </p>
                    ) : selectedSnapshotDetail.submissionError ? (
                      <Alert variant="destructive">
                        <AlertCircle />
                        <AlertTitle>
                          Unable to load submission detail
                        </AlertTitle>
                        <AlertDescription>
                          {formatUIErrorMessage(
                            selectedSnapshotDetail.submissionError
                          )}
                        </AlertDescription>
                      </Alert>
                    ) : selectedSnapshotDetail.submission ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">
                              Status
                            </p>
                            <Badge
                              variant={statusBadgeVariant(
                                selectedSnapshotDetail.submission.status
                              )}
                            >
                              {selectedSnapshotDetail.submission.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">
                              File
                            </p>
                            <p className="text-sm">
                              {selectedSnapshotDetail.submission.fileName}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">
                              Created At
                            </p>
                            <p className="text-sm">
                              {selectedSnapshotDetail.submission.createdAt}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">
                              Completed At
                            </p>
                            <p className="text-sm">
                              {formatNullableText(
                                selectedSnapshotDetail.submission.completedAt
                              )}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Validation errors
                          </p>
                          {selectedSubmissionValidationErrors.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No validation errors reported.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {selectedSubmissionValidationErrors.map(
                                (error, index) => (
                                  <li
                                    key={`${error.code ?? 'error'}-${index}`}
                                    className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
                                  >
                                    {formatValidationError(error, index)}
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Submission detail unavailable.
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <section
          aria-labelledby="admin-bulk-backfill-monitor-heading"
          className="space-y-2"
        >
          <div className="space-y-1">
            <h2
              id="admin-bulk-backfill-monitor-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Bulk Backfill Monitor
            </h2>
            <p className="text-sm text-muted-foreground">
              Track bulk ingestion jobs, inspect per-file validation failures,
              and export job reports.
            </p>
          </div>
          <AdminBulkBackfillMonitor />
        </section>
      </main>
    </div>
  );
}

export default AdminConsolePage;
