'use client';

import {
  useCallback,
  useEffect,
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
    async (datasetId: string | undefined, signal?: AbortSignal) => {
      if (!datasetId) {
        resetAsyncResourceState(setOverviewState);
        return;
      }

      await loadDashboardResource({
        datasetId,
        requestKey: `overview:${datasetId}`,
        measureKey: 'dashboard:panel:overview:load',
        fallbackMessage: 'Unable to load overview metrics.',
        setResourceState: setOverviewState,
        request: () => getDatasetOverview(datasetId, { signal }),
      });
    },
    [loadDashboardResource]
  );

  const loadMajors = useCallback(
    async (datasetId: string | undefined, signal?: AbortSignal) => {
      if (!datasetId) {
        resetAsyncResourceState(setMajorsState);
        return;
      }

      await loadDashboardResource({
        datasetId,
        requestKey: `majors:${datasetId}`,
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
      semester: string | undefined,
      signal?: AbortSignal
    ) => {
      if (!datasetId) {
        resetAsyncResourceState(setMigrationState);
        return;
      }

      await loadDashboardResource({
        datasetId,
        requestKey: `migration:${datasetId}:${semester ?? 'all'}`,
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
      horizon: number,
      signal?: AbortSignal
    ) => {
      if (!datasetId) {
        resetAsyncResourceState(setForecastsState);
        return;
      }

      await loadDashboardResource({
        datasetId,
        requestKey: `forecasts:${datasetId}:${horizon}`,
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
    void loadOverview(activeDatasetId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [activeDatasetId, loadOverview]);

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
    () => loadOverview(activeDatasetId),
    [activeDatasetId, loadOverview]
  );
  const retryMajors = useCallback(
    () => loadMajors(activeDatasetId),
    [activeDatasetId, loadMajors]
  );
  const retryMigration = useCallback(
    () => loadMigration(activeDatasetId, migrationSemester),
    [activeDatasetId, loadMigration, migrationSemester]
  );
  const retryForecasts = useCallback(
    () => loadForecasts(activeDatasetId, forecastHorizon),
    [activeDatasetId, forecastHorizon, loadForecasts]
  );

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
