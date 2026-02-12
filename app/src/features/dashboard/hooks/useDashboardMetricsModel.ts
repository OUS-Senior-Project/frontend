'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveDataset } from '@/features/datasets/api/datasetsService';
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
const DEFAULT_FORECAST_HORIZON = 4;

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

function isActiveDatasetNotFound(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: unknown; status?: unknown };
  if (maybeError.code !== 'ACTIVE_DATASET_NOT_FOUND') {
    return false;
  }

  if (
    maybeError.status !== undefined &&
    maybeError.status !== 404
  ) {
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
  const [forecastHorizon, setForecastHorizon] = useState(DEFAULT_FORECAST_HORIZON);

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

  const [uploadState, setUploadState] = useState<{
    loading: boolean;
    error: UIError | null;
  }>({
    loading: false,
    error: null,
  });

  const inFlightByKeyRef = useRef(new Map<string, Promise<unknown>>());
  const uploadControllerRef = useRef<AbortController | null>(null);

  const runDeduped = useCallback(
    async <T,>(key: string, request: () => Promise<T>): Promise<T> => {
      const existing = inFlightByKeyRef.current.get(key) as Promise<T> | undefined;
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

        if (submission.status === 'completed' || submission.status === 'failed') {
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
          return null;
        }

        setDatasetState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load active dataset state.'),
        });
        return null;
      }
    },
    [runDeduped]
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

        setOverviewState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load overview metrics.'),
        });
      }
    },
    [runDeduped, selectedDate]
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

        setMajorsState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load majors analytics.'),
        });
      }
    },
    [runDeduped]
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

        setMigrationState({
          data: null,
          loading: false,
          error: toUIError(error, 'Unable to load migration analytics.'),
        });
      }
    },
    [runDeduped]
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
    [runDeduped]
  );

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

        await Promise.all([
          loadOverview(refreshedDatasetId, uploadController.signal),
          loadMajors(refreshedDatasetId, uploadController.signal),
          loadMigration(
            refreshedDatasetId,
            migrationSemester,
            uploadController.signal
          ),
          loadForecasts(
            refreshedDatasetId,
            forecastHorizon,
            uploadController.signal
          ),
        ]);

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
      forecastHorizon,
      loadDataset,
      loadForecasts,
      loadMajors,
      loadMigration,
      loadOverview,
      migrationSemester,
      pollSubmissionUntilTerminal,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDataset(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDataset]);

  const activeDatasetId = datasetState.data?.datasetId;

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
