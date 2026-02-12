'use client';

import { useCallback, useEffect, useState } from 'react';
import { getActiveDataset } from '@/features/datasets/api/datasetsService';
import { getForecastsAnalytics } from '@/features/forecasts/api/forecastsService';
import { getMajorsAnalytics } from '@/features/majors/api/majorsService';
import { getMigrationAnalytics } from '@/features/migration/api/migrationService';
import { getDatasetOverview } from '@/features/overview/api/overviewService';
import { createDatasetSubmission } from '@/features/submissions/api/submissionsService';
import { toUIError } from '@/lib/api/errors';
import type {
  DatasetOverviewResponse,
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

function initialAsyncResourceState<T>(): AsyncResourceState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

export function useDashboardMetricsModel() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [migrationSemester, setMigrationSemester] = useState<
    string | undefined
  >(undefined);

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

  const loadDataset = useCallback(async () => {
    setDatasetState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const dataset = await getActiveDataset();

      setDatasetState({
        data: dataset,
        loading: false,
        error: null,
      });
    } catch (error) {
      const uiError = toUIError(
        error,
        'Unable to load active dataset state.'
      );

      if (uiError.code === 'DATASET_NOT_FOUND') {
        setDatasetState({
          data: null,
          loading: false,
          error: null,
        });
        return;
      }

      setDatasetState({
        data: null,
        loading: false,
        error: uiError,
      });
    }
  }, []);

  const activeDatasetId = datasetState.data?.id;

  const loadOverview = useCallback(async () => {
    if (!activeDatasetId) {
      setOverviewState(initialAsyncResourceState);
      return;
    }

    setOverviewState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const data = await getDatasetOverview(activeDatasetId, selectedDate);
      setOverviewState({
        data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setOverviewState({
        data: null,
        loading: false,
        error: toUIError(error, 'Unable to load overview metrics.'),
      });
    }
  }, [activeDatasetId, selectedDate]);

  const loadMajors = useCallback(async () => {
    if (!activeDatasetId) {
      setMajorsState(initialAsyncResourceState);
      return;
    }

    setMajorsState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const data = await getMajorsAnalytics(activeDatasetId);
      setMajorsState({
        data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setMajorsState({
        data: null,
        loading: false,
        error: toUIError(error, 'Unable to load majors analytics.'),
      });
    }
  }, [activeDatasetId]);

  const loadMigration = useCallback(async () => {
    if (!activeDatasetId) {
      setMigrationState(initialAsyncResourceState);
      return;
    }

    setMigrationState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const data = await getMigrationAnalytics(activeDatasetId);
      setMigrationState({
        data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setMigrationState({
        data: null,
        loading: false,
        error: toUIError(error, 'Unable to load migration analytics.'),
      });
    }
  }, [activeDatasetId]);

  const loadForecasts = useCallback(async () => {
    if (!activeDatasetId) {
      setForecastsState(initialAsyncResourceState);
      return;
    }

    setForecastsState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const data = await getForecastsAnalytics(activeDatasetId);
      setForecastsState({
        data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setForecastsState({
        data: null,
        loading: false,
        error: toUIError(error, 'Unable to load forecast analytics.'),
      });
    }
  }, [activeDatasetId]);

  const handleDatasetUpload = useCallback(
    async (file: File) => {
      setUploadState({
        loading: true,
        error: null,
      });

      try {
        await createDatasetSubmission({ file });
        await loadDataset();
        setUploadState({
          loading: false,
          error: null,
        });
      } catch (error) {
        setUploadState({
          loading: false,
          error: toUIError(error, `Unable to upload "${file.name}".`),
        });
      }
    },
    [loadDataset]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDataset();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadDataset]);

  useEffect(() => {
    if (!activeDatasetId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadMajors();
      void loadMigration();
      void loadForecasts();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeDatasetId, loadForecasts, loadMajors, loadMigration]);

  useEffect(() => {
    if (!activeDatasetId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeDatasetId, loadOverview]);

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
    handleDatasetUpload,
    uploadLoading: uploadState.loading,
    uploadError: uploadState.error,
    activeDataset: datasetState.data,
    datasetLoading: datasetState.loading,
    datasetError: datasetState.error,
    noDataset,
    retryDataset: loadDataset,
    overviewData: overviewState.data,
    overviewLoading: overviewState.loading,
    overviewError: overviewState.error,
    retryOverview: loadOverview,
    majorsData: majorsState.data,
    majorsLoading: majorsState.loading,
    majorsError: majorsState.error,
    retryMajors: loadMajors,
    migrationData: migrationState.data,
    migrationLoading: migrationState.loading,
    migrationError: migrationState.error,
    retryMigration: loadMigration,
    forecastsData: forecastsState.data,
    forecastsLoading: forecastsState.loading,
    forecastsError: forecastsState.error,
    retryForecasts: loadForecasts,
  };
}
