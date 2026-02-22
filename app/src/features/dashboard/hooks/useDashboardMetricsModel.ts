'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getActiveDataset,
  getDatasetById,
} from '@/features/datasets/api/datasetsService';
import { getForecastsAnalytics } from '@/features/forecasts/api/forecastsService';
import { getMajorsAnalytics } from '@/features/majors/api/majorsService';
import { getMigrationAnalytics } from '@/features/migration/api/migrationService';
import { getDatasetOverview } from '@/features/overview/api/overviewService';
import {
  createDatasetSubmission,
  getDatasetSubmissionStatus,
} from '@/features/submissions/api/submissionsService';
import { ServiceError, toUIError } from '@/lib/api/errors';
import type {
  DatasetOverviewResponse,
  DatasetSubmission,
  DatasetSummary,
  ForecastsAnalyticsResponse,
  MajorsAnalyticsResponse,
  MigrationAnalyticsResponse,
  UIError,
} from '@/lib/api/types';

interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  error: UIError | null;
}

const SUBMISSION_POLL_INTERVAL_MIN_MS = 1_000;
const SUBMISSION_POLL_INTERVAL_MAX_MS = 3_000;
const SUBMISSION_POLL_TIMEOUT_MS = 180_000;
export const DATASET_STATUS_POLL_INTERVAL_MS = 3_000;
export const DATASET_STATUS_POLL_MAX_DURATION_MS = 300_000;
const DEFAULT_FORECAST_HORIZON = 4;

type DashboardReadModelState =
  | {
      kind: 'ready';
    }
  | {
      kind: 'processing';
      datasetId: string;
      status: string;
    }
  | {
      kind: 'failed';
      datasetId: string;
      status: string;
      error: UIError;
    };

type DashboardViewState =
  | 'loading'
  | 'ready'
  | 'processing'
  | 'failed'
  | 'notFound'
  | 'genericError';

function initialAsyncResourceState<T>(): AsyncResourceState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

function isAbortedRequest(error: unknown) {
  return error instanceof ServiceError && error.code === 'REQUEST_ABORTED';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function createDatasetFailedError(
  datasetId: string,
  status = 'failed',
  message = 'Dataset processing failed. Upload a new dataset to continue.'
): UIError {
  return {
    code: 'DATASET_FAILED',
    message,
    retryable: false,
    status: 409,
    details: {
      datasetId,
      status,
    },
  };
}

function getDashboardReadModelStateFromDataset(
  dataset: DatasetSummary
): DashboardReadModelState {
  if (dataset.status === 'ready') {
    return {
      kind: 'ready',
    };
  }

  if (dataset.status === 'failed') {
    return {
      kind: 'failed',
      datasetId: dataset.datasetId,
      status: dataset.status,
      error: createDatasetFailedError(dataset.datasetId),
    };
  }

  return {
    kind: 'processing',
    datasetId: dataset.datasetId,
    status: dataset.status,
  };
}

function getDashboardReadModelStateFromError(
  error: unknown,
  fallbackDatasetId: string
): DashboardReadModelState | null {
  if (!(error instanceof ServiceError) || error.status !== 409) {
    return null;
  }

  if (error.code !== 'DATASET_NOT_READY' && error.code !== 'DATASET_FAILED') {
    return null;
  }

  const details = asRecord(error.details);
  const datasetId =
    typeof details?.datasetId === 'string'
      ? details.datasetId
      : fallbackDatasetId;
  const status =
    typeof details?.status === 'string'
      ? details.status
      : error.code === 'DATASET_NOT_READY'
        ? 'building'
        : 'failed';

  if (error.code === 'DATASET_NOT_READY') {
    return {
      kind: 'processing',
      datasetId,
      status,
    };
  }

  const uiError = toUIError(
    error,
    'Dataset processing failed. Upload a new dataset to continue.'
  );

  return {
    kind: 'failed',
    datasetId,
    status,
    error: {
      ...uiError,
      retryable: false,
    },
  };
}

function isActiveDatasetNotFound(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: unknown; status?: unknown };
  if (maybeError.code !== 'ACTIVE_DATASET_NOT_FOUND') {
    return false;
  }

  if (maybeError.status !== undefined && maybeError.status !== 404) {
    return false;
  }

  return true;
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

export function useDashboardMetricsModel() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
        if (
          currentState.kind === 'failed' &&
          nextState.kind === 'processing' &&
          currentState.datasetId === nextState.datasetId
        ) {
          return currentState;
        }

        if (currentState.kind === 'ready' && nextState.kind === 'ready') {
          return currentState;
        }

        if (
          currentState.kind === 'processing' &&
          nextState.kind === 'processing' &&
          currentState.datasetId === nextState.datasetId &&
          currentState.status === nextState.status
        ) {
          return currentState;
        }

        if (
          currentState.kind === 'failed' &&
          nextState.kind === 'failed' &&
          currentState.datasetId === nextState.datasetId &&
          currentState.status === nextState.status &&
          currentState.error.code === nextState.error.code &&
          currentState.error.message === nextState.error.message
        ) {
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
      }
    },
    [applyReadModelState, runDeduped]
  );

  const loadOverview = useCallback(
    async (datasetId: string | undefined, signal?: AbortSignal) => {
      if (!datasetId) {
        setOverviewState(initialAsyncResourceState);
        return;
      }

      setOverviewState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      const dateKey = selectedDate.toISOString().slice(0, 10);
      const requestKey = `overview:${datasetId}:${dateKey}`;

      try {
        const data = await runDeduped(requestKey, () =>
          getDatasetOverview(datasetId, { signal })
        );

        setOverviewState({
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
          setOverviewState({
            data: null,
            loading: false,
            error: null,
          });
          return;
        }

        setOverviewState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load overview metrics.'),
        });
      }
    },
    [applyReadModelState, runDeduped, selectedDate]
  );

  const loadMajors = useCallback(
    async (datasetId: string | undefined, signal?: AbortSignal) => {
      if (!datasetId) {
        setMajorsState(initialAsyncResourceState);
        return;
      }

      setMajorsState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      const requestKey = `majors:${datasetId}`;

      try {
        const data = await runDeduped(requestKey, () =>
          getMajorsAnalytics(datasetId, { signal })
        );

        setMajorsState({
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
          setMajorsState({
            data: null,
            loading: false,
            error: null,
          });
          return;
        }

        setMajorsState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load majors analytics.'),
        });
      }
    },
    [applyReadModelState, runDeduped]
  );

  const loadMigration = useCallback(
    async (
      datasetId: string | undefined,
      semester: string | undefined,
      signal?: AbortSignal
    ) => {
      if (!datasetId) {
        setMigrationState(initialAsyncResourceState);
        return;
      }

      setMigrationState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      const requestKey = `migration:${datasetId}:${semester ?? 'all'}`;

      try {
        const data = await runDeduped(requestKey, () =>
          getMigrationAnalytics(datasetId, {
            semester,
            signal,
          })
        );

        setMigrationState({
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
          setMigrationState({
            data: null,
            loading: false,
            error: null,
          });
          return;
        }

        setMigrationState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load migration analytics.'),
        });
      }
    },
    [applyReadModelState, runDeduped]
  );

  const loadForecasts = useCallback(
    async (
      datasetId: string | undefined,
      horizon: number,
      signal?: AbortSignal
    ) => {
      if (!datasetId) {
        setForecastsState(initialAsyncResourceState);
        return;
      }

      setForecastsState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));

      const requestKey = `forecasts:${datasetId}:${horizon}`;

      try {
        const data = await runDeduped(requestKey, () =>
          getForecastsAnalytics(datasetId, {
            horizon,
            signal,
          })
        );

        setForecastsState({
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
          setForecastsState({
            data: null,
            loading: false,
            error: null,
          });
          return;
        }

        const uiError = toUIError(error, 'Unable to load forecast analytics.');
        const normalizedForecastError =
          uiError.code === 'NEEDS_REBUILD'
            ? {
                ...uiError,
                message:
                  'Forecasts are not ready yet for this dataset. Rebuild is required before forecast analytics can be shown.',
              }
            : uiError;

        setForecastsState({
          data: null,
          loading: false,
          error: normalizedForecastError,
        });
      }
    },
    [applyReadModelState, runDeduped]
  );

  const refreshAnalyticsResources = useCallback(
    async (datasetId: string, signal?: AbortSignal) => {
      await Promise.all([
        loadOverview(datasetId, signal),
        loadMajors(datasetId, signal),
        loadMigration(datasetId, migrationSemester, signal),
        loadForecasts(datasetId, forecastHorizon, signal),
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
        // Polling cleanup runs when readModelState flips to "ready"; don't let it abort
        // the one-time analytics refresh that hydrates the panels for the ready state.
        await refreshAnalyticsResources(latestDataset.datasetId);
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
    [applyReadModelState, refreshAnalyticsResources, runDeduped]
  );

  const activeDatasetId = datasetState.data?.datasetId;

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

        await refreshAnalyticsResources(
          refreshedDatasetId,
          uploadController.signal
        );

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
    [loadDataset, pollSubmissionUntilTerminal, refreshAnalyticsResources]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDataset(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDataset]);

  useEffect(() => {
    if (readModelState.kind !== 'processing') {
      return;
    }

    setReadModelPollingTimedOut(false);
    const controller = new AbortController();
    let inFlight = false;
    let stopped = false;
    const startedAtMs = Date.now();
    let intervalId: number | null = null;

    const stopPolling = (reason: 'timeout' | 'cleanup') => {
      if (stopped) {
        return;
      }

      stopped = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      controller.abort();
      if (reason === 'timeout') {
        setReadModelPollingTimedOut(true);
      }
    };

    const pollDatasetStatus = async () => {
      if (stopped || inFlight) {
        return;
      }

      if (Date.now() - startedAtMs >= DATASET_STATUS_POLL_MAX_DURATION_MS) {
        stopPolling('timeout');
        return;
      }

      inFlight = true;
      try {
        await refreshReadModelStatus(
          readModelState.datasetId,
          controller.signal
        );
      } catch (error) {
        if (isAbortedRequest(error)) {
          return;
        }
      } finally {
        inFlight = false;
        if (
          !stopped &&
          Date.now() - startedAtMs >= DATASET_STATUS_POLL_MAX_DURATION_MS
        ) {
          stopPolling('timeout');
        }
      }
    };

    void pollDatasetStatus();
    intervalId = window.setInterval(() => {
      void pollDatasetStatus();
    }, DATASET_STATUS_POLL_INTERVAL_MS);

    return () => {
      stopPolling('cleanup');
    };
  }, [readModelState, refreshReadModelStatus]);

  useEffect(() => {
    const controller = new AbortController();
    void loadOverview(activeDatasetId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [activeDatasetId, loadOverview, selectedDate]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMajors(activeDatasetId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [activeDatasetId, loadMajors]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMigration(activeDatasetId, migrationSemester, controller.signal);

    return () => {
      controller.abort();
    };
  }, [activeDatasetId, loadMigration, migrationSemester]);

  useEffect(() => {
    const controller = new AbortController();
    void loadForecasts(activeDatasetId, forecastHorizon, controller.signal);

    return () => {
      controller.abort();
    };
  }, [activeDatasetId, forecastHorizon, loadForecasts]);

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

  const noDataset =
    !datasetState.loading && !datasetState.error && !datasetState.data;
  const dashboardViewState: DashboardViewState = datasetState.loading
    ? 'loading'
    : datasetState.error
      ? 'genericError'
      : noDataset
        ? 'notFound'
        : readModelState.kind;
  const readModelError =
    readModelState.kind === 'failed' ? readModelState.error : null;
  const readModelStatus =
    readModelState.kind === 'ready' ? null : readModelState.status;

  return {
    selectedDate,
    setSelectedDate,
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
    retryDataset: () => loadDataset(),
    overviewData: overviewState.data,
    overviewLoading: overviewState.loading,
    overviewError: overviewState.error,
    retryOverview: () => loadOverview(activeDatasetId),
    majorsData: majorsState.data,
    majorsLoading: majorsState.loading,
    majorsError: majorsState.error,
    retryMajors: () => loadMajors(activeDatasetId),
    migrationData: migrationState.data,
    migrationLoading: migrationState.loading,
    migrationError: migrationState.error,
    retryMigration: () => loadMigration(activeDatasetId, migrationSemester),
    forecastsData: forecastsState.data,
    forecastsLoading: forecastsState.loading,
    forecastsError: forecastsState.error,
    retryForecasts: () => loadForecasts(activeDatasetId, forecastHorizon),
  };
}
