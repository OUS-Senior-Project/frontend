'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { getActiveDataset, getDatasetById } from '@/features/datasets/api';
import { getForecastsAnalytics } from '@/features/forecasts/api';
import { getMajorsAnalytics } from '@/features/majors/api';
import { getMigrationAnalytics } from '@/features/migration/api';
import { getDatasetOverview } from '@/features/overview/api';
import { listSnapshots } from '@/features/snapshots/api';
import {
  createDatasetSubmission,
  getDatasetSubmissionStatus,
} from '@/features/submissions/api';
import { ServiceError, toUIError } from '@/lib/api/errors';
import type {
  DatasetOverviewResponse,
  DatasetSubmission,
  DatasetSummary,
  ForecastsAnalyticsResponse,
  MajorsAnalyticsResponse,
  MigrationAnalyticsResponse,
  SnapshotSummary,
  UIError,
} from '@/lib/api/types';
import {
  createDatasetFailedError,
  getDashboardReadModelStateFromDataset,
  getDashboardReadModelStateFromError,
  getDashboardViewState,
  isActiveDatasetNotFound,
  shouldRetainCurrentReadModelState,
  type DashboardReadModelState,
  type DashboardViewState,
} from './dashboardReadModel';
import {
  resolveSnapshotDateSelection,
  type SnapshotDateSelection,
} from './snapshotSelection';
import {
  formatDateParamValue,
  parseLocalDateFromDateParam,
  useDashboardDateParam,
} from './useDashboardDateParam';

interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  error: UIError | null;
}

type AsyncResourceStateSetter<T> = Dispatch<
  SetStateAction<AsyncResourceState<T>>
>;

const SUBMISSION_POLL_INTERVAL_MIN_MS = 1_000;
const SUBMISSION_POLL_INTERVAL_MAX_MS = 3_000;
const SUBMISSION_POLL_TIMEOUT_MS = 180_000;
export const DATASET_STATUS_POLL_INTERVAL_MS = 3_000;
export const DATASET_STATUS_POLL_MAX_DURATION_MS = 300_000;
const DEFAULT_FORECAST_HORIZON = 4;
const SNAPSHOTS_PAGE_SIZE = 100;
const EMPTY_SNAPSHOT_ITEMS: SnapshotSummary[] = [];

function initialAsyncResourceState<T>(): AsyncResourceState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

function resetAsyncResourceState<T>(setState: AsyncResourceStateSetter<T>) {
  setState(initialAsyncResourceState);
}

function isAbortedRequest(error: unknown) {
  return error instanceof ServiceError && error.code === 'REQUEST_ABORTED';
}

function getSubmissionPollDelayMs(attempt: number) {
  const steppedDelay = SUBMISSION_POLL_INTERVAL_MIN_MS + attempt * 1_000;
  return Math.min(steppedDelay, SUBMISSION_POLL_INTERVAL_MAX_MS);
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(
        new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
      );
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      reject(
        new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
      );
    };

    signal?.addEventListener('abort', onAbort);
  });
}

function canUsePerformanceApi() {
  return (
    typeof window !== 'undefined' &&
    typeof window.performance !== 'undefined' &&
    typeof window.performance.mark === 'function' &&
    typeof window.performance.measure === 'function'
  );
}

function isDashboardPerfMarksEnabled() {
  return process.env.NODE_ENV === 'development';
}

function startPerformanceMeasurement(metricName: string) {
  if (!isDashboardPerfMarksEnabled() || !canUsePerformanceApi()) {
    return () => {};
  }

  const nonce = `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const startMark = `${metricName}:start:${nonce}`;
  const endMark = `${metricName}:end:${nonce}`;

  window.performance.mark(startMark);

  return () => {
    window.performance.mark(endMark);
    window.performance.measure(metricName, startMark, endMark);
    window.performance.clearMarks(startMark);
    window.performance.clearMarks(endMark);
  };
}

export function useDashboardMetricsModel() {
  const { rawDateParam, dateParam, setDateParam } = useDashboardDateParam();
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [migrationSemester, setMigrationSemester] = useState<
    string | undefined
  >(undefined);
  const [forecastHorizon, setForecastHorizon] = useState(
    DEFAULT_FORECAST_HORIZON
  );

  const [datasetState, setDatasetState] = useState<
    AsyncResourceState<DatasetSummary>
  >({
    data: null,
    loading: true,
    error: null,
  });
  const [snapshotsState, setSnapshotsState] = useState<
    AsyncResourceState<SnapshotSummary[]>
  >(initialAsyncResourceState);
  const [overviewState, setOverviewState] = useState<
    AsyncResourceState<DatasetOverviewResponse>
  >(initialAsyncResourceState);
  const [majorsState, setMajorsState] = useState<
    AsyncResourceState<MajorsAnalyticsResponse>
  >(initialAsyncResourceState);
  const [migrationState, setMigrationState] = useState<
    AsyncResourceState<MigrationAnalyticsResponse>
  >(initialAsyncResourceState);
  const [forecastsState, setForecastsState] = useState<
    AsyncResourceState<ForecastsAnalyticsResponse>
  >(initialAsyncResourceState);
  const [readModelState, setReadModelState] = useState<DashboardReadModelState>(
    {
      kind: 'ready',
    }
  );

  const [uploadState, setUploadState] = useState<{
    loading: boolean;
    error: UIError | null;
  }>({
    loading: false,
    error: null,
  });
  const [readModelPollingTimedOut, setReadModelPollingTimedOut] =
    useState(false);

  const inFlightByKeyRef = useRef(new Map<string, Promise<unknown>>());
  const uploadControllerRef = useRef<AbortController | null>(null);
  const bootstrapMeasureStopRef = useRef<(() => void) | null>(null);
  const bootstrapMeasuredRef = useRef(false);

  const runDeduped = useCallback(
    async <T>(key: string, request: () => Promise<T>): Promise<T> => {
      const existing = inFlightByKeyRef.current.get(key) as
        | Promise<T>
        | undefined;
      if (existing) {
        return existing;
      }

      const nextPromise = request().finally(() => {
        if (inFlightByKeyRef.current.get(key) === nextPromise) {
          inFlightByKeyRef.current.delete(key);
        }
      });

      inFlightByKeyRef.current.set(key, nextPromise);
      return nextPromise;
    },
    []
  );

  const applyReadModelState = useCallback(
    (nextState: DashboardReadModelState) => {
      setReadModelState((currentState) => {
        if (shouldRetainCurrentReadModelState(currentState, nextState)) {
          return currentState;
        }

        return nextState;
      });
    },
    []
  );

  const pollSubmissionUntilTerminal = useCallback(
    async (
      submissionId: string,
      signal?: AbortSignal
    ): Promise<DatasetSubmission> => {
      const startedAt = Date.now();
      let pollAttempt = 0;

      while (true) {
        const submission = await getDatasetSubmissionStatus(submissionId, {
          signal,
        });

        if (
          submission.status === 'completed' ||
          submission.status === 'failed'
        ) {
          return submission;
        }

        if (Date.now() - startedAt >= SUBMISSION_POLL_TIMEOUT_MS) {
          throw new ServiceError(
            'SUBMISSION_POLL_TIMEOUT',
            'Dataset processing timed out while polling submission status.',
            true
          );
        }

        await delay(getSubmissionPollDelayMs(pollAttempt), signal);
        pollAttempt += 1;
      }
    },
    []
  );

  const loadDataset = useCallback(
    async (signal?: AbortSignal): Promise<DatasetSummary | null> => {
      const stopMeasure = startPerformanceMeasurement(
        'dashboard:dataset:active:load'
      );
      setDatasetState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      try {
        const dataset = await runDeduped('dataset:active', () =>
          getActiveDataset({ signal })
        );

        setDatasetState({
          data: dataset,
          loading: false,
          error: null,
        });
        applyReadModelState(
          dataset
            ? getDashboardReadModelStateFromDataset(dataset)
            : {
                kind: 'ready',
              }
        );

        return dataset;
      } catch (error) {
        if (isAbortedRequest(error)) {
          return null;
        }

        if (isActiveDatasetNotFound(error)) {
          setDatasetState({
            data: null,
            loading: false,
            error: null,
          });
          applyReadModelState({
            kind: 'ready',
          });
          return null;
        }

        setDatasetState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load active dataset state.'),
        });
        applyReadModelState({
          kind: 'ready',
        });
        return null;
      } finally {
        stopMeasure();
      }
    },
    [applyReadModelState, runDeduped]
  );

  const fetchAllReadySnapshots = useCallback(
    async (signal?: AbortSignal): Promise<SnapshotSummary[]> => {
      const items: SnapshotSummary[] = [];
      let page = 1;

      while (true) {
        const response = await listSnapshots({
          page,
          pageSize: SNAPSHOTS_PAGE_SIZE,
          status: 'ready',
          signal,
        });

        items.push(...response.items);

        if (response.items.length === 0 || items.length >= response.total) {
          return items;
        }

        page += 1;
      }
    },
    []
  );

  const loadSnapshotsCatalog = useCallback(
    async (signal?: AbortSignal): Promise<SnapshotSummary[] | null> => {
      const stopMeasure = startPerformanceMeasurement(
        'dashboard:snapshots:load'
      );
      setSnapshotsState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      try {
        const snapshots = await runDeduped('snapshots:ready:all', () =>
          fetchAllReadySnapshots(signal)
        );

        setSnapshotsState({
          data: snapshots,
          loading: false,
          error: null,
        });

        return snapshots;
      } catch (error) {
        if (isAbortedRequest(error)) {
          return null;
        }

        setSnapshotsState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load available snapshot dates.'),
        });

        return null;
      } finally {
        stopMeasure();
      }
    },
    [fetchAllReadySnapshots, runDeduped]
  );

  interface LoadDashboardResourceOptions<T> {
    datasetId: string;
    requestKey: string;
    measureKey: string;
    fallbackMessage: string;
    setResourceState: AsyncResourceStateSetter<T>;
    request: () => Promise<T>;
    normalizeError?: (error: UIError) => UIError;
  }

  const loadDashboardResource = useCallback(
    async <T>({
      datasetId,
      requestKey,
      measureKey,
      fallbackMessage,
      setResourceState,
      request,
      normalizeError,
    }: LoadDashboardResourceOptions<T>) => {
      const stopMeasure = startPerformanceMeasurement(measureKey);
      setResourceState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      try {
        const data = await runDeduped(requestKey, request);

        setResourceState({
          data,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (isAbortedRequest(error)) {
          return;
        }

        const nextReadModelState = getDashboardReadModelStateFromError(
          error,
          datasetId
        );
        if (nextReadModelState) {
          applyReadModelState(nextReadModelState);
          resetAsyncResourceState(setResourceState);
          return;
        }

        const uiError = toUIError(error, fallbackMessage);
        setResourceState({
          data: null,
          loading: false,
          error: normalizeError ? normalizeError(uiError) : uiError,
        });
      } finally {
        stopMeasure();
      }
    },
    [applyReadModelState, runDeduped]
  );

  const loadOverview = useCallback(
    async (
      datasetId: string | undefined,
      snapshotId: string | undefined,
      signal?: AbortSignal
    ) => {
      if (!datasetId) {
        resetAsyncResourceState(setOverviewState);
        return;
      }

      await loadDashboardResource({
        datasetId,
        requestKey: `overview:${datasetId}:${snapshotId ?? 'none'}`,
        measureKey: 'dashboard:panel:overview:load',
        fallbackMessage: 'Unable to load overview metrics.',
        setResourceState: setOverviewState,
        request: () => getDatasetOverview(datasetId, { signal }),
      });
    },
    [loadDashboardResource]
  );

  const loadMajors = useCallback(
    async (
      datasetId: string | undefined,
      snapshotId: string | undefined,
      signal?: AbortSignal
    ) => {
      if (!datasetId) {
        resetAsyncResourceState(setMajorsState);
        return;
      }

      await loadDashboardResource({
        datasetId,
        requestKey: `majors:${datasetId}:${snapshotId ?? 'none'}`,
        measureKey: 'dashboard:panel:majors:load',
        fallbackMessage: 'Unable to load majors analytics.',
        setResourceState: setMajorsState,
        request: () => getMajorsAnalytics(datasetId, { signal }),
      });
    },
    [loadDashboardResource]
  );

  const loadMigration = useCallback(
    async (
      datasetId: string | undefined,
      snapshotId: string | undefined,
      semester: string | undefined,
      signal?: AbortSignal
    ) => {
      if (!datasetId) {
        resetAsyncResourceState(setMigrationState);
        return;
      }

      await loadDashboardResource({
        datasetId,
        requestKey: `migration:${datasetId}:${snapshotId ?? 'none'}:${semester ?? 'all'}`,
        measureKey: 'dashboard:panel:migration:load',
        fallbackMessage: 'Unable to load migration analytics.',
        setResourceState: setMigrationState,
        request: () =>
          getMigrationAnalytics(datasetId, {
            semester,
            signal,
          }),
      });
    },
    [loadDashboardResource]
  );

  const loadForecasts = useCallback(
    async (
      datasetId: string | undefined,
      snapshotId: string | undefined,
      horizon: number,
      signal?: AbortSignal
    ) => {
      if (!datasetId) {
        resetAsyncResourceState(setForecastsState);
        return;
      }

      await loadDashboardResource({
        datasetId,
        requestKey: `forecasts:${datasetId}:${snapshotId ?? 'none'}:${horizon}`,
        measureKey: 'dashboard:panel:forecasts:load',
        fallbackMessage: 'Unable to load forecast analytics.',
        setResourceState: setForecastsState,
        request: () =>
          getForecastsAnalytics(datasetId, {
            horizon,
            signal,
          }),
        normalizeError: (uiError) =>
          uiError.code === 'NEEDS_REBUILD'
            ? {
                ...uiError,
                message:
                  'Forecasts are not ready yet for this dataset. Rebuild is required before forecast analytics can be shown.',
              }
            : uiError,
      });
    },
    [loadDashboardResource]
  );

  const refreshAnalyticsResources = useCallback(
    async (
      options: {
        datasetId: string;
        snapshotId?: string | null;
      },
      signal?: AbortSignal
    ) => {
      await Promise.all([
        loadOverview(
          options.datasetId,
          options.snapshotId ?? undefined,
          signal
        ),
        loadMajors(options.datasetId, options.snapshotId ?? undefined, signal),
        loadMigration(
          options.datasetId,
          options.snapshotId ?? undefined,
          migrationSemester,
          signal
        ),
        loadForecasts(
          options.datasetId,
          options.snapshotId ?? undefined,
          forecastHorizon,
          signal
        ),
      ]);
    },
    [
      forecastHorizon,
      loadForecasts,
      loadMajors,
      loadMigration,
      loadOverview,
      migrationSemester,
    ]
  );

  const activeDatasetId = datasetState.data?.datasetId;
  const snapshotCatalogLoaded =
    !snapshotsState.loading && snapshotsState.data !== null;
  const snapshotItems = snapshotsState.data ?? EMPTY_SNAPSHOT_ITEMS;
  const hasInvalidDateParamFormat = rawDateParam !== null && dateParam === null;
  const latestSnapshotDateSelection = useMemo(
    () => resolveSnapshotDateSelection(snapshotItems, null),
    [snapshotItems]
  );
  const snapshotDateSelection: SnapshotDateSelection = useMemo(
    () =>
      hasInvalidDateParamFormat
        ? {
            ...latestSnapshotDateSelection,
            selectedSnapshot: null,
          }
        : resolveSnapshotDateSelection(snapshotItems, dateParam),
    [
      dateParam,
      hasInvalidDateParamFormat,
      latestSnapshotDateSelection,
      snapshotItems,
    ]
  );
  const latestSelectableSnapshot =
    snapshotDateSelection.latestSelectableSnapshot;
  const selectedSnapshot = snapshotDateSelection.selectedSnapshot;
  const shouldUseSnapshotSelection =
    snapshotCatalogLoaded && snapshotsState.error === null;
  const requestedDateUnavailable =
    shouldUseSnapshotSelection &&
    rawDateParam !== null &&
    selectedSnapshot === null
      ? rawDateParam
      : null;
  const selectedDate = useMemo(() => {
    if (selectedSnapshot) {
      return parseLocalDateFromDateParam(selectedSnapshot.effectiveDate);
    }
    if (rawDateParam) {
      return parseLocalDateFromDateParam(rawDateParam);
    }
    return null;
  }, [rawDateParam, selectedSnapshot]);
  const defaultDateHydrationPending =
    shouldUseSnapshotSelection &&
    rawDateParam === null &&
    latestSelectableSnapshot !== null;
  const analyticsDatasetId = !activeDatasetId
    ? undefined
    : shouldUseSnapshotSelection
      ? defaultDateHydrationPending
        ? undefined
        : (selectedSnapshot?.datasetId ?? undefined)
      : snapshotsState.error
        ? activeDatasetId
        : undefined;
  const analyticsSnapshotId =
    shouldUseSnapshotSelection && analyticsDatasetId
      ? selectedSnapshot?.snapshotId
      : undefined;
  const selectedSnapshotId = selectedSnapshot?.snapshotId ?? null;

  const setSelectedDate = useCallback(
    (date: Date) => {
      setDateParam(formatDateParamValue(date), {
        mode: 'push',
      });
    },
    [setDateParam]
  );

  const buildSnapshotRefreshTarget = useCallback(
    (
      snapshots: SnapshotSummary[] | null,
      fallbackDatasetId: string
    ): { datasetId: string; snapshotId?: string | null } | null => {
      if (rawDateParam !== null && dateParam === null) {
        return null;
      }

      if (snapshots === null) {
        return {
          datasetId: fallbackDatasetId,
        };
      }

      const selection = resolveSnapshotDateSelection(snapshots, dateParam);
      const snapshotToUse =
        rawDateParam !== null
          ? selection.selectedSnapshot
          : selection.latestSelectableSnapshot;

      if (!snapshotToUse?.datasetId) {
        return rawDateParam === null
          ? {
              datasetId: fallbackDatasetId,
            }
          : null;
      }

      return {
        datasetId: snapshotToUse.datasetId,
        snapshotId: snapshotToUse.snapshotId,
      };
    },
    [dateParam, rawDateParam]
  );

  const refreshReadModelStatus = useCallback(
    async (datasetId: string, signal?: AbortSignal) => {
      const latestDataset = await runDeduped(
        `dataset:detail:${datasetId}`,
        () => getDatasetById(datasetId, { signal })
      );

      setDatasetState((previous) => ({
        ...previous,
        data: latestDataset,
        loading: false,
        error: null,
      }));

      if (latestDataset.status === 'ready') {
        applyReadModelState({
          kind: 'ready',
        });
        const refreshedSnapshots = await loadSnapshotsCatalog(signal);
        // Polling cleanup runs when readModelState flips to "ready"; don't let it abort
        // the one-time analytics refresh that hydrates the panels for the ready state.
        const refreshTarget = buildSnapshotRefreshTarget(
          refreshedSnapshots,
          latestDataset.datasetId
        );

        if (refreshTarget) {
          await refreshAnalyticsResources(refreshTarget);
        }
        return;
      }

      if (latestDataset.status === 'failed') {
        applyReadModelState({
          kind: 'failed',
          datasetId: latestDataset.datasetId,
          status: latestDataset.status,
          error: createDatasetFailedError(latestDataset.datasetId),
        });
        return;
      }

      applyReadModelState({
        kind: 'processing',
        datasetId: latestDataset.datasetId,
        status: latestDataset.status,
      });
    },
    [
      applyReadModelState,
      buildSnapshotRefreshTarget,
      loadSnapshotsCatalog,
      refreshAnalyticsResources,
      runDeduped,
    ]
  );

  const retryReadModelState = useCallback(async () => {
    const datasetId =
      readModelState.kind === 'ready'
        ? activeDatasetId
        : readModelState.datasetId;

    if (!datasetId) {
      return;
    }

    try {
      setReadModelPollingTimedOut(false);
      await refreshReadModelStatus(datasetId);
    } catch (error) {
      if (isAbortedRequest(error)) {
        return;
      }
    }
  }, [activeDatasetId, readModelState, refreshReadModelStatus]);

  const handleDatasetUpload = useCallback(
    async (file: File) => {
      uploadControllerRef.current?.abort();
      const uploadController = new AbortController();
      uploadControllerRef.current = uploadController;

      setUploadState({
        loading: true,
        error: null,
      });

      try {
        const startedSubmission = await createDatasetSubmission(
          {
            file,
            activateOnSuccess: true,
          },
          {
            signal: uploadController.signal,
          }
        );

        const terminalSubmission = await pollSubmissionUntilTerminal(
          startedSubmission.submissionId,
          uploadController.signal
        );

        if (terminalSubmission.status === 'failed') {
          const firstValidationError = terminalSubmission.validationErrors?.[0];
          throw new ServiceError(
            String(firstValidationError?.code ?? 'SUBMISSION_FAILED'),
            String(
              firstValidationError?.message ??
                'Dataset processing failed. Check validation errors and retry.'
            ),
            {
              retryable: true,
              details: {
                submissionId: terminalSubmission.submissionId,
                datasetId: terminalSubmission.datasetId,
                validationErrors: terminalSubmission.validationErrors ?? [],
              },
            }
          );
        }

        const refreshedDataset = await loadDataset(uploadController.signal);
        const refreshedDatasetId =
          refreshedDataset?.datasetId ?? terminalSubmission.datasetId;
        const refreshedSnapshots = await loadSnapshotsCatalog(
          uploadController.signal
        );

        const refreshTarget = buildSnapshotRefreshTarget(
          refreshedSnapshots,
          refreshedDatasetId
        );

        if (refreshTarget) {
          await refreshAnalyticsResources(
            refreshTarget,
            uploadController.signal
          );
        }

        setUploadState({
          loading: false,
          error: null,
        });
      } catch (error) {
        if (isAbortedRequest(error)) {
          return;
        }

        setUploadState({
          loading: false,
          error: toUIError(error, `Unable to upload "${file.name}".`),
        });
      } finally {
        if (uploadControllerRef.current === uploadController) {
          uploadControllerRef.current = null;
        }
      }
    },
    [
      buildSnapshotRefreshTarget,
      loadDataset,
      loadSnapshotsCatalog,
      pollSubmissionUntilTerminal,
      refreshAnalyticsResources,
    ]
  );

  useEffect(() => {
    bootstrapMeasureStopRef.current = startPerformanceMeasurement(
      'dashboard:bootstrap'
    );

    return () => {
      bootstrapMeasureStopRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (datasetState.loading || bootstrapMeasuredRef.current) {
      return;
    }

    bootstrapMeasuredRef.current = true;
    bootstrapMeasureStopRef.current?.();
    bootstrapMeasureStopRef.current = null;
  }, [datasetState.loading]);

  useEffect(() => {
    const controller = new AbortController();
    void loadDataset(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDataset]);

  useEffect(() => {
    const controller = new AbortController();
    void loadSnapshotsCatalog(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadSnapshotsCatalog]);

  useEffect(() => {
    if (!snapshotCatalogLoaded || snapshotsState.error) {
      return;
    }

    if (rawDateParam !== null) {
      return;
    }

    if (!latestSelectableSnapshot) {
      return;
    }

    setDateParam(latestSelectableSnapshot.effectiveDate, {
      mode: 'replace',
    });
  }, [
    latestSelectableSnapshot,
    rawDateParam,
    setDateParam,
    snapshotCatalogLoaded,
    snapshotsState.error,
  ]);

  const processingDatasetId =
    readModelState.kind === 'processing' ? readModelState.datasetId : null;

  useEffect(() => {
    if (!processingDatasetId) {
      return;
    }

    setReadModelPollingTimedOut(false);
    const controller = new AbortController();
    let stopped = false;
    const startedAtMs = Date.now();
    let timeoutId: number | null = null;

    const stopPolling = (reason: 'timeout' | 'cleanup') => {
      if (stopped) {
        return;
      }

      stopped = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      controller.abort();
      if (reason === 'timeout') {
        setReadModelPollingTimedOut(true);
      }
    };

    const pollDatasetStatus = async () => {
      const elapsedMs = Date.now() - startedAtMs;
      if (stopped || elapsedMs >= DATASET_STATUS_POLL_MAX_DURATION_MS) {
        if (!stopped && elapsedMs >= DATASET_STATUS_POLL_MAX_DURATION_MS) {
          stopPolling('timeout');
        }
        return;
      }

      try {
        await refreshReadModelStatus(processingDatasetId, controller.signal);
      } catch (error) {
        if (isAbortedRequest(error)) {
          return;
        }
      } finally {
        if (stopped) {
          return;
        }

        if (Date.now() - startedAtMs >= DATASET_STATUS_POLL_MAX_DURATION_MS) {
          stopPolling('timeout');
          return;
        }

        timeoutId = window.setTimeout(() => {
          void pollDatasetStatus();
        }, DATASET_STATUS_POLL_INTERVAL_MS);
      }
    };

    void pollDatasetStatus();

    return () => {
      stopPolling('cleanup');
    };
  }, [processingDatasetId, refreshReadModelStatus]);

  useEffect(() => {
    const controller = new AbortController();
    void loadOverview(
      analyticsDatasetId,
      analyticsSnapshotId,
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [analyticsDatasetId, analyticsSnapshotId, loadOverview]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMajors(analyticsDatasetId, analyticsSnapshotId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [analyticsDatasetId, analyticsSnapshotId, loadMajors]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMigration(
      analyticsDatasetId,
      analyticsSnapshotId,
      migrationSemester,
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [
    analyticsDatasetId,
    analyticsSnapshotId,
    loadMigration,
    migrationSemester,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    void loadForecasts(
      analyticsDatasetId,
      analyticsSnapshotId,
      forecastHorizon,
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [analyticsDatasetId, analyticsSnapshotId, forecastHorizon, loadForecasts]);

  useEffect(() => {
    if (!migrationSemester || !migrationState.data) {
      return;
    }

    if (!migrationState.data.semesters.includes(migrationSemester)) {
      setMigrationSemester(undefined);
    }
  }, [migrationSemester, migrationState.data]);

  const activeMigrationSemester =
    migrationSemester &&
    migrationState.data?.semesters.includes(migrationSemester)
      ? migrationSemester
      : undefined;

  const dashboardViewState: DashboardViewState = getDashboardViewState(
    datasetState,
    readModelState
  );
  const noDataset = dashboardViewState === 'notFound';
  const readModelError =
    readModelState.kind === 'failed' ? readModelState.error : null;
  const readModelStatus =
    readModelState.kind === 'ready' ? null : readModelState.status;
  const retryDataset = useCallback(() => loadDataset(), [loadDataset]);
  const retryOverview = useCallback(
    () => loadOverview(analyticsDatasetId, analyticsSnapshotId),
    [analyticsDatasetId, analyticsSnapshotId, loadOverview]
  );
  const retryMajors = useCallback(
    () => loadMajors(analyticsDatasetId, analyticsSnapshotId),
    [analyticsDatasetId, analyticsSnapshotId, loadMajors]
  );
  const retryMigration = useCallback(
    () =>
      loadMigration(analyticsDatasetId, analyticsSnapshotId, migrationSemester),
    [analyticsDatasetId, analyticsSnapshotId, loadMigration, migrationSemester]
  );
  const retryForecasts = useCallback(
    () =>
      loadForecasts(analyticsDatasetId, analyticsSnapshotId, forecastHorizon),
    [analyticsDatasetId, analyticsSnapshotId, forecastHorizon, loadForecasts]
  );
  const availableSnapshotDates = snapshotDateSelection.availableDateValues
    .map((value) => parseLocalDateFromDateParam(value))
    .filter((value): value is Date => value !== null);
  const snapshotDateEmptyState =
    requestedDateUnavailable !== null
      ? {
          title: 'Selected date is unavailable',
          description: `No ready snapshot is available for ${requestedDateUnavailable}. Choose another available date or go to the latest available snapshot.`,
        }
      : shouldUseSnapshotSelection &&
          snapshotDateSelection.availableDateValues.length === 0
        ? {
            title: 'No snapshot dates available',
            description:
              'No ready snapshots are available yet. Upload and process a dataset to populate dashboard dates.',
          }
        : null;
  const canGoToLatestAvailableDate =
    requestedDateUnavailable !== null && latestSelectableSnapshot !== null;
  const goToLatestAvailableDate = useCallback(() => {
    if (!latestSelectableSnapshot) {
      return;
    }

    setDateParam(latestSelectableSnapshot.effectiveDate, {
      mode: 'push',
    });
  }, [latestSelectableSnapshot, setDateParam]);

  return {
    selectedDate,
    setSelectedDate,
    selectedSnapshotId,
    currentDataDate: selectedSnapshot?.effectiveDate ?? null,
    latestAvailableSnapshotDate:
      latestSelectableSnapshot?.effectiveDate ?? null,
    canGoToLatestAvailableDate,
    goToLatestAvailableDate,
    availableSnapshotDates,
    snapshotDatesLoading: snapshotsState.loading,
    snapshotDatesError: snapshotsState.error,
    snapshotDateEmptyState,
    breakdownOpen,
    setBreakdownOpen,
    migrationSemester: activeMigrationSemester,
    setMigrationSemester,
    forecastHorizon,
    setForecastHorizon,
    handleDatasetUpload,
    uploadLoading: uploadState.loading,
    uploadError: uploadState.error,
    activeDataset: datasetState.data,
    datasetLoading: datasetState.loading,
    datasetError: datasetState.error,
    noDataset,
    dashboardViewState,
    readModelState: readModelState.kind,
    readModelStatus,
    readModelError,
    readModelPollingTimedOut,
    retryReadModelState,
    retryDataset,
    overviewData: overviewState.data,
    overviewLoading: overviewState.loading,
    overviewError: overviewState.error,
    retryOverview,
    majorsData: majorsState.data,
    majorsLoading: majorsState.loading,
    majorsError: majorsState.error,
    retryMajors,
    migrationData: migrationState.data,
    migrationLoading: migrationState.loading,
    migrationError: migrationState.error,
    retryMigration,
    forecastsData: forecastsState.data,
    forecastsLoading: forecastsState.loading,
    forecastsError: forecastsState.error,
    retryForecasts,
  };
}
