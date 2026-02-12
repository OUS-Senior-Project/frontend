import { act, renderHook, waitFor } from '@testing-library/react';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks/useDashboardMetricsModel';
import { ServiceError } from '@/lib/api/errors';
import { getActiveDataset } from '@/features/datasets/api/datasetsService';
import { getDatasetOverview } from '@/features/overview/api/overviewService';
import { getMajorsAnalytics } from '@/features/majors/api/majorsService';
import { getMigrationAnalytics } from '@/features/migration/api/migrationService';
import { getForecastsAnalytics } from '@/features/forecasts/api/forecastsService';
import { createDatasetSubmission } from '@/features/submissions/api/submissionsService';

jest.mock('@/features/datasets/api/datasetsService', () => ({
  getActiveDataset: jest.fn(),
}));

jest.mock('@/features/overview/api/overviewService', () => ({
  getDatasetOverview: jest.fn(),
}));

jest.mock('@/features/majors/api/majorsService', () => ({
  getMajorsAnalytics: jest.fn(),
}));

jest.mock('@/features/migration/api/migrationService', () => ({
  getMigrationAnalytics: jest.fn(),
}));

jest.mock('@/features/forecasts/api/forecastsService', () => ({
  getForecastsAnalytics: jest.fn(),
}));

jest.mock('@/features/submissions/api/submissionsService', () => ({
  createDatasetSubmission: jest.fn(),
}));

const mockGetActiveDataset = getActiveDataset as jest.MockedFunction<
  typeof getActiveDataset
>;
const mockGetDatasetOverview = getDatasetOverview as jest.MockedFunction<
  typeof getDatasetOverview
>;
const mockGetMajorsAnalytics = getMajorsAnalytics as jest.MockedFunction<
  typeof getMajorsAnalytics
>;
const mockGetMigrationAnalytics = getMigrationAnalytics as jest.MockedFunction<
  typeof getMigrationAnalytics
>;
const mockGetForecastsAnalytics = getForecastsAnalytics as jest.MockedFunction<
  typeof getForecastsAnalytics
>;
const mockCreateDatasetSubmission =
  createDatasetSubmission as jest.MockedFunction<typeof createDatasetSubmission>;

describe('useDashboardMetricsModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exposes no-dataset state when active dataset is missing', async () => {
    mockGetActiveDataset.mockRejectedValue(
      new ServiceError(
        'DATASET_NOT_FOUND',
        'No active dataset found. Upload a CSV to begin.',
        true
      )
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    expect(result.current.noDataset).toBe(true);
    expect(result.current.activeDataset).toBeNull();
    expect(result.current.datasetError).toBeNull();
  });

  test('loads dataset analytics through service boundaries', async () => {
    mockGetActiveDataset.mockResolvedValue({
      id: 'dataset-1',
      name: 'enrollment.csv',
      uploadedAt: '2026-02-11T00:00:00Z',
      status: 'ready',
    });

    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      asOfDate: '2026-02-11',
      snapshotTotals: {
        total: 1000,
        undergrad: 900,
        ftic: 400,
        transfer: 200,
        international: 120,
      },
      studentTypeDistribution: [{ type: 'FTIC', count: 400 }],
      schoolDistribution: [{ school: 'School of Business', count: 250 }],
      trendSeries: [
        { period: 'Fall 2025', year: 2025, semester: 1, total: 950 },
        { period: 'Spring 2026', year: 2026, semester: 2, total: 1000 },
      ],
      majorCount: 12,
      schoolCount: 6,
    });

    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      majorDistribution: [{ major: 'Biology', count: 200 }],
      cohortRecords: [
        {
          major: 'Biology',
          cohort: 'FTIC 2024',
          avgGPA: 3.2,
          avgCredits: 14,
          studentCount: 200,
        },
      ],
    });

    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: ['Fall 2025'],
      records: [
        {
          fromMajor: 'Biology',
          toMajor: 'Chemistry',
          semester: 'Fall 2025',
          count: 22,
        },
      ],
    });

    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historicalSeries: [
        { period: 'Fall 2025', year: 2025, semester: 1, total: 950 },
      ],
      forecastSeries: [
        {
          period: 'Spring 2026',
          year: 2026,
          semester: 2,
          total: 1000,
          isForecasted: true,
        },
      ],
      fiveYearGrowth: 8,
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.activeDataset?.id).toBe('dataset-1');
    });

    await waitFor(() => {
      expect(result.current.overviewData?.datasetId).toBe('dataset-1');
      expect(result.current.majorsData?.datasetId).toBe('dataset-1');
      expect(result.current.migrationData?.datasetId).toBe('dataset-1');
      expect(result.current.forecastsData?.datasetId).toBe('dataset-1');
    });

    expect(result.current.noDataset).toBe(false);
  });

  test('tracks upload errors without fabricating submission state', async () => {
    mockGetActiveDataset.mockRejectedValue(
      new ServiceError('DATASET_NOT_FOUND', 'No dataset', true)
    );
    mockCreateDatasetSubmission.mockRejectedValue(
      new ServiceError(
        'NOT_IMPLEMENTED',
        'Not implemented: createDatasetSubmission (Campaign 3)',
        true
      )
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    const file = new File(['a,b\n1,2'], 'enrollment.csv', { type: 'text/csv' });

    await act(async () => {
      await result.current.handleDatasetUpload(file);
    });

    expect(mockCreateDatasetSubmission).toHaveBeenCalledWith({ file });
    expect(result.current.uploadError?.code).toBe('NOT_IMPLEMENTED');
  });

  test('surfaces non-dataset-not-found errors from active dataset loading', async () => {
    mockGetActiveDataset.mockRejectedValue(new Error('Dataset service unavailable'));

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    expect(result.current.datasetError).toEqual({
      code: 'UNKNOWN',
      message: 'Dataset service unavailable',
      retryable: true,
    });
    expect(result.current.noDataset).toBe(false);
  });

  test('retry handlers no-op to empty state when no active dataset is available', async () => {
    mockGetActiveDataset.mockRejectedValue(
      new ServiceError('DATASET_NOT_FOUND', 'No active dataset found', true)
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    await act(async () => {
      await result.current.retryOverview();
      await result.current.retryMajors();
      await result.current.retryMigration();
      await result.current.retryForecasts();
    });

    expect(result.current.overviewData).toBeNull();
    expect(result.current.majorsData).toBeNull();
    expect(result.current.migrationData).toBeNull();
    expect(result.current.forecastsData).toBeNull();
    expect(result.current.overviewError).toBeNull();
    expect(result.current.majorsError).toBeNull();
    expect(result.current.migrationError).toBeNull();
    expect(result.current.forecastsError).toBeNull();
  });

  test('captures overview/majors/migration/forecast errors when active dataset exists', async () => {
    mockGetActiveDataset.mockResolvedValue({
      id: 'dataset-1',
      name: 'enrollment.csv',
      uploadedAt: '2026-02-11T00:00:00Z',
      status: 'ready',
    });
    mockGetDatasetOverview.mockRejectedValue(new Error('Overview unavailable'));
    mockGetMajorsAnalytics.mockRejectedValue(new Error('Majors unavailable'));
    mockGetMigrationAnalytics.mockRejectedValue(new Error('Migration unavailable'));
    mockGetForecastsAnalytics.mockRejectedValue(new Error('Forecasts unavailable'));

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.activeDataset?.id).toBe('dataset-1');
    });

    await waitFor(() => {
      expect(result.current.overviewError?.message).toBe('Overview unavailable');
      expect(result.current.majorsError?.message).toBe('Majors unavailable');
      expect(result.current.migrationError?.message).toBe('Migration unavailable');
      expect(result.current.forecastsError?.message).toBe('Forecasts unavailable');
    });
  });

  test('resets invalid migration semester selections when not in loaded options', async () => {
    mockGetActiveDataset.mockResolvedValue({
      id: 'dataset-1',
      name: 'enrollment.csv',
      uploadedAt: '2026-02-11T00:00:00Z',
      status: 'ready',
    });
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      asOfDate: '2026-02-11',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      studentTypeDistribution: [],
      schoolDistribution: [],
      trendSeries: [],
      majorCount: 0,
      schoolCount: 0,
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: ['Spring 2026'],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historicalSeries: [],
      forecastSeries: [],
      fiveYearGrowth: 0,
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.migrationData?.semesters).toEqual(['Spring 2026']);
    });

    act(() => {
      result.current.setMigrationSemester('Fall 2025');
    });

    expect(result.current.migrationSemester).toBeUndefined();

    act(() => {
      result.current.setMigrationSemester('Spring 2026');
    });

    expect(result.current.migrationSemester).toBe('Spring 2026');
  });

  test('upload success reloads dataset state and clears upload error', async () => {
    mockGetActiveDataset
      .mockRejectedValueOnce(new ServiceError('DATASET_NOT_FOUND', 'No dataset', true))
      .mockResolvedValue({
        id: 'dataset-2',
        name: 'latest.csv',
        uploadedAt: '2026-02-11T00:00:00Z',
        status: 'processing',
      });
    mockCreateDatasetSubmission.mockResolvedValue({
      id: 'submission-1',
      datasetName: 'latest.csv',
      status: 'queued',
      createdAt: '2026-02-11T00:00:00Z',
    });
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-2',
      asOfDate: '2026-02-11',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      studentTypeDistribution: [],
      schoolDistribution: [],
      trendSeries: [],
      majorCount: 0,
      schoolCount: 0,
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-2',
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-2',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-2',
      historicalSeries: [],
      forecastSeries: [],
      fiveYearGrowth: 0,
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });
    expect(result.current.noDataset).toBe(true);

    const file = new File(['a,b\n1,2'], 'latest.csv', { type: 'text/csv' });

    await act(async () => {
      await result.current.handleDatasetUpload(file);
    });

    await waitFor(() => {
      expect(result.current.activeDataset?.id).toBe('dataset-2');
    });

    expect(mockGetActiveDataset).toHaveBeenCalledTimes(2);
    expect(result.current.uploadError).toBeNull();
    expect(result.current.uploadLoading).toBe(false);
  });
});
