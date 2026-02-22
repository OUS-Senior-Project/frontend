import { act, renderHook, waitFor } from '@testing-library/react';
import {
  DATASET_STATUS_POLL_INTERVAL_MS,
  DATASET_STATUS_POLL_MAX_DURATION_MS,
  useDashboardMetricsModel,
} from '@/features/dashboard/hooks/useDashboardMetricsModel';
import { ApiError, ServiceError } from '@/lib/api/errors';
import {
  getActiveDataset,
  getDatasetById,
} from '@/features/datasets/api/datasetsService';
import { getDatasetOverview } from '@/features/overview/api/overviewService';
import { getMajorsAnalytics } from '@/features/majors/api/majorsService';
import { getMigrationAnalytics } from '@/features/migration/api/migrationService';
import { getForecastsAnalytics } from '@/features/forecasts/api/forecastsService';
import {
  createDatasetSubmission,
  getDatasetSubmissionStatus,
} from '@/features/submissions/api/submissionsService';
import type { DatasetStatus } from '@/lib/api/types';
import { mockNow } from '../utils/time';

jest.mock('@/features/datasets/api/datasetsService', () => ({
  getActiveDataset: jest.fn(),
  getDatasetById: jest.fn(),
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
  getDatasetSubmissionStatus: jest.fn(),
}));

const mockGetActiveDataset = getActiveDataset as jest.MockedFunction<
  typeof getActiveDataset
>;
const mockGetDatasetById = getDatasetById as jest.MockedFunction<
  typeof getDatasetById
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
const mockGetDatasetSubmissionStatus =
  getDatasetSubmissionStatus as jest.MockedFunction<
    typeof getDatasetSubmissionStatus
  >;
type ActiveDataset = NonNullable<Awaited<ReturnType<typeof getActiveDataset>>>;

function makeActiveDataset(
  datasetId: string,
  status: DatasetStatus
): ActiveDataset {
  return {
    datasetId,
    name: `${datasetId}.csv`,
    status,
    isActive: true,
    createdAt: '2026-02-11T00:00:00Z',
    sourceSubmissionId: `sub-${datasetId}`,
  };
}

function withApiBaseUrlOverride(
  value: string | undefined,
  testFn: () => Promise<void>
) {
  const originalValue = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  } else {
    process.env.NEXT_PUBLIC_API_BASE_URL = value;
  }

  return testFn().finally(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      return;
    }

    process.env.NEXT_PUBLIC_API_BASE_URL = originalValue;
  });
}

describe('useDashboardMetricsModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exposes no-dataset state when active dataset is missing', async () => {
    mockGetActiveDataset.mockResolvedValue(null);

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    expect(result.current.noDataset).toBe(true);
    expect(result.current.activeDataset).toBeNull();
    expect(result.current.datasetError).toBeNull();
  });

  test('treats ACTIVE_DATASET_NOT_FOUND bootstrap errors as empty first-run state', async () => {
    mockGetActiveDataset.mockRejectedValue(
      new ApiError({
        code: 'ACTIVE_DATASET_NOT_FOUND',
        message: 'No active dataset yet.',
        status: 404,
        retryable: false,
      })
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    expect(result.current.noDataset).toBe(true);
    expect(result.current.activeDataset).toBeNull();
    expect(result.current.datasetError).toBeNull();
    expect(mockGetDatasetOverview).not.toHaveBeenCalled();
    expect(mockGetMajorsAnalytics).not.toHaveBeenCalled();
    expect(mockGetMigrationAnalytics).not.toHaveBeenCalled();
    expect(mockGetForecastsAnalytics).not.toHaveBeenCalled();
  });

  test('does not treat ACTIVE_DATASET_NOT_FOUND as empty state when status is non-404', async () => {
    mockGetActiveDataset.mockRejectedValue(
      new ApiError({
        code: 'ACTIVE_DATASET_NOT_FOUND',
        message: 'No active dataset yet.',
        status: 500,
        retryable: false,
      })
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    expect(result.current.noDataset).toBe(false);
    expect(result.current.activeDataset).toBeNull();
    expect(result.current.datasetError).toEqual({
      code: 'ACTIVE_DATASET_NOT_FOUND',
      message: 'No active dataset yet.',
      retryable: false,
      status: 500,
    });
  });

  test('shows CORS guidance when bootstrap fails with a cross-origin browser network error', async () => {
    await withApiBaseUrlOverride('http://localhost:8000', async () => {
      mockGetActiveDataset.mockRejectedValue(new TypeError('Failed to fetch'));

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.datasetLoading).toBe(false);
      });

      expect(result.current.noDataset).toBe(false);
      expect(result.current.datasetError?.code).toBe('NETWORK_ERROR');
      expect(result.current.datasetError?.message).toContain(
        'missing CORS headers'
      );
      expect(result.current.datasetError?.message).toContain(
        'backend that is not running'
      );
      expect(result.current.datasetError?.message).toContain(
        'Access-Control-Allow-Origin'
      );
      expect(result.current.datasetError?.message).toContain(
        window.location.origin
      );
    });
  });

  test('does not treat other 404 codes as empty state during bootstrap', async () => {
    mockGetActiveDataset.mockRejectedValue(
      new ApiError({
        code: 'DATASET_NOT_FOUND',
        message: 'Dataset not found.',
        status: 404,
        retryable: false,
      })
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    expect(result.current.noDataset).toBe(false);
    expect(result.current.activeDataset).toBeNull();
    expect(result.current.datasetError).toEqual({
      code: 'DATASET_NOT_FOUND',
      message: 'Dataset not found.',
      retryable: false,
      status: 404,
    });
  });

  test('surfaces primitive bootstrap failures as non-empty error state', async () => {
    mockGetActiveDataset.mockRejectedValue('bootstrap failed');

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    expect(result.current.noDataset).toBe(false);
    expect(result.current.activeDataset).toBeNull();
    expect(result.current.datasetError).toEqual({
      code: 'UNKNOWN',
      message: 'Unable to load active dataset state.',
      retryable: true,
    });
  });

  test('loads dataset analytics through service boundaries', async () => {
    mockGetActiveDataset.mockResolvedValue({
      datasetId: 'dataset-1',
      name: 'enrollment.csv',
      status: 'ready',
      isActive: true,
      createdAt: '2026-02-11T00:00:00Z',
      sourceSubmissionId: 'sub-1',
    });

    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      snapshotTotals: {
        total: 1000,
        undergrad: 900,
        ftic: 400,
        transfer: 200,
        international: 120,
      },
      activeMajors: 12,
      activeSchools: 6,
      studentTypeDistribution: [{ type: 'FTIC', count: 400 }],
      schoolDistribution: [{ school: 'School of Business', count: 250 }],
      trend: [{ period: 'Fall 2025', year: 2025, semester: 'Fall', total: 950 }],
    });

    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
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
      historical: [
        { period: 'Fall 2025', year: 2025, semester: 'Fall', total: 950 },
      ],
      forecast: [
        {
          period: 'Spring 2026',
          year: 2026,
          semester: 'Spring',
          total: 1000,
          isForecasted: true,
        },
      ],
      fiveYearGrowthPct: 8,
      insights: {
        projectedGrowthText: 'Projected growth.',
        resourcePlanningText: 'Resource planning.',
        recommendationText: 'Recommendation.',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.activeDataset?.datasetId).toBe('dataset-1');
    });

    await waitFor(() => {
      expect(result.current.overviewData?.datasetId).toBe('dataset-1');
      expect(result.current.majorsData?.datasetId).toBe('dataset-1');
      expect(result.current.migrationData?.datasetId).toBe('dataset-1');
      expect(result.current.forecastsData?.datasetId).toBe('dataset-1');
    });

    expect(result.current.noDataset).toBe(false);
  });

  test('maps DATASET_NOT_READY to processing state and refreshes reads when dataset becomes ready', async () => {
    jest.useFakeTimers();
    try {
      mockGetActiveDataset.mockResolvedValue({
        datasetId: 'dataset-1',
        name: 'enrollment.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-11T00:00:00Z',
        sourceSubmissionId: 'sub-1',
      });
      mockGetDatasetById
        .mockResolvedValueOnce({
          datasetId: 'dataset-1',
          name: 'enrollment.csv',
          status: 'building',
          isActive: true,
          createdAt: '2026-02-11T00:00:00Z',
          sourceSubmissionId: 'sub-1',
        })
        .mockResolvedValue({
          datasetId: 'dataset-1',
          name: 'enrollment.csv',
          status: 'ready',
          isActive: true,
          createdAt: '2026-02-11T00:00:00Z',
          sourceSubmissionId: 'sub-1',
        });
      mockGetDatasetOverview
        .mockRejectedValueOnce(
          new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
            retryable: false,
            status: 409,
            details: {
              datasetId: 'dataset-1',
              status: 'building',
              requiredStatus: 'ready',
            },
          })
        )
        .mockResolvedValue({
          datasetId: 'dataset-1',
          snapshotTotals: {
            total: 1000,
            undergrad: 900,
            ftic: 400,
            transfer: 200,
            international: 120,
          },
          activeMajors: 12,
          activeSchools: 6,
          studentTypeDistribution: [{ type: 'FTIC', count: 400 }],
          schoolDistribution: [{ school: 'School of Business', count: 250 }],
          trend: [
            { period: 'Fall 2025', year: 2025, semester: 'Fall', total: 950 },
          ],
        });
      mockGetMajorsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        analyticsRecords: [],
        majorDistribution: [],
        cohortRecords: [],
      });
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('processing');
      });

      expect(result.current.overviewData).toBeNull();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(3_000);
      });

      await waitFor(() => {
        expect(result.current.readModelState).toBe('ready');
      });
      await waitFor(() => {
        expect(result.current.overviewData?.datasetId).toBe('dataset-1');
      });
      expect(mockGetDatasetById).toHaveBeenCalledWith('dataset-1', {
        signal: expect.any(AbortSignal),
      });
    } finally {
      jest.useRealTimers();
    }
  });

  test('processing to ready triggers analytics refresh and renders (no abort race)', async () => {
    jest.useFakeTimers();
    try {
      const readyOverview = {
        datasetId: 'dataset-1',
        snapshotTotals: {
          total: 1000,
          undergrad: 900,
          ftic: 400,
          transfer: 200,
          international: 120,
        },
        activeMajors: 12,
        activeSchools: 6,
        studentTypeDistribution: [{ type: 'FTIC', count: 400 }],
        schoolDistribution: [{ school: 'School of Business', count: 250 }],
        trend: [{ period: 'Fall 2025', year: 2025, semester: 'Fall', total: 950 }],
      };
      let refreshOverviewAborted = false;

      mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
      mockGetDatasetById
        .mockResolvedValueOnce(makeActiveDataset('dataset-1', 'building'))
        .mockResolvedValueOnce(makeActiveDataset('dataset-1', 'ready'));

      mockGetDatasetOverview
        .mockRejectedValueOnce(
          new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
            retryable: false,
            status: 409,
            details: {
              datasetId: 'dataset-1',
              status: 'building',
              requiredStatus: 'ready',
            },
          })
        )
        .mockImplementationOnce((_datasetId, options) => {
          return new Promise((resolve, reject) => {
            const signal = options?.signal;
            const timeoutId = window.setTimeout(() => {
              signal?.removeEventListener('abort', onAbort);
              resolve(readyOverview);
            }, 10);

            const onAbort = () => {
              refreshOverviewAborted = true;
              window.clearTimeout(timeoutId);
              signal?.removeEventListener('abort', onAbort);
              reject(
                new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
              );
            };

            if (signal?.aborted) {
              onAbort();
              return;
            }

            signal?.addEventListener('abort', onAbort);
          });
        });
      mockGetMajorsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        analyticsRecords: [],
        majorDistribution: [],
        cohortRecords: [],
      });
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('processing');
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(DATASET_STATUS_POLL_INTERVAL_MS);
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(10);
      });

      await waitFor(() => {
        expect(result.current.readModelState).toBe('ready');
        expect(result.current.overviewData?.datasetId).toBe('dataset-1');
      });

      expect(result.current.overviewLoading).toBe(false);
      expect(refreshOverviewAborted).toBe(false);
      expect(mockGetDatasetOverview).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  test('maps DATASET_FAILED to terminal failed state and does not poll status indefinitely', async () => {
    jest.useFakeTimers();
    try {
      mockGetActiveDataset.mockResolvedValue({
        datasetId: 'dataset-1',
        name: 'enrollment.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-11T00:00:00Z',
        sourceSubmissionId: 'sub-1',
      });
      mockGetDatasetOverview.mockRejectedValue(
        new ServiceError('DATASET_FAILED', 'Dataset failed.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-1',
            status: 'failed',
          },
        })
      );
      mockGetMajorsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        analyticsRecords: [],
        majorDistribution: [],
        cohortRecords: [],
      });
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('failed');
      });
      expect(result.current.readModelError).toMatchObject({
        code: 'DATASET_FAILED',
        retryable: false,
        status: 409,
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(9_000);
      });

      expect(mockGetDatasetById).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  test('falls back to failed status when DATASET_FAILED details omit status', async () => {
    mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
    mockGetDatasetOverview.mockRejectedValue(
      new ServiceError('DATASET_FAILED', 'Dataset failed.', {
        retryable: false,
        status: 409,
        details: {
          datasetId: 'dataset-1',
        },
      })
    );
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.readModelState).toBe('failed');
    });
    expect(result.current.readModelStatus).toBe('failed');
  });

  test('maps active dataset status failed to terminal failed read-model state', async () => {
    mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'failed'));
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.readModelState).toBe('failed');
    });
    expect(result.current.readModelError).toMatchObject({
      code: 'DATASET_FAILED',
      retryable: false,
      status: 409,
      details: {
        datasetId: 'dataset-1',
        status: 'failed',
      },
    });
  });

  test('falls back to default processing status when DATASET_NOT_READY details payload is not an object', async () => {
    mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
    mockGetDatasetOverview.mockRejectedValue(
      new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
        retryable: false,
        status: 409,
        details: 'bad-shape',
      })
    );
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.readModelState).toBe('processing');
    });
    expect(result.current.readModelStatus).toBe('building');
  });

  test('treats unknown 409 read-model errors as normal panel errors', async () => {
    mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
    mockGetDatasetOverview.mockRejectedValue(
      new ServiceError('UNEXPECTED_CONFLICT', 'Conflict', {
        retryable: false,
        status: 409,
        details: {
          datasetId: 'dataset-1',
        },
      })
    );
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.overviewError?.code).toBe('UNEXPECTED_CONFLICT');
    });
    expect(result.current.readModelState).toBe('ready');
  });

  test('allows failed read-model state to transition to processing when active dataset changes', async () => {
    const queuedDataset = makeActiveDataset('dataset-2', 'queued');

    mockGetActiveDataset
      .mockResolvedValueOnce({
        datasetId: 'dataset-1',
        name: 'failed-upload.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-11T00:00:00Z',
        sourceSubmissionId: 'sub-1',
      })
      .mockResolvedValueOnce(queuedDataset);

    mockGetDatasetById.mockResolvedValue(queuedDataset);

    mockGetDatasetOverview
      .mockRejectedValueOnce(
        new ServiceError('DATASET_FAILED', 'Dataset failed.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-1',
            status: 'failed',
          },
        })
      )
      .mockRejectedValue(
        new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-2',
            status: 'queued',
            requiredStatus: 'ready',
          },
        })
      );
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.readModelState).toBe('failed');
    });
    expect(result.current.activeDataset?.datasetId).toBe('dataset-1');

    await act(async () => {
      await result.current.retryDataset();
    });

    await waitFor(() => {
      expect(result.current.activeDataset?.datasetId).toBe('dataset-2');
      expect(result.current.readModelState).toBe('processing');
      expect(result.current.readModelStatus).toBe('queued');
    });
  });

  test('keeps failed state when same dataset later reports DATASET_NOT_READY from another read-model endpoint', async () => {
    jest.useFakeTimers();
    try {
      mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
      mockGetDatasetOverview.mockRejectedValue(
        new ServiceError('DATASET_FAILED', 'Dataset failed.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-1',
            status: 'failed',
          },
        })
      );
      mockGetMajorsAnalytics.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(
                new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
                  retryable: false,
                  status: 409,
                  details: {
                    datasetId: 'dataset-1',
                    status: 'building',
                    requiredStatus: 'ready',
                  },
                })
              );
            }, 5);
          })
      );
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('failed');
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(5);
      });

      await waitFor(() => {
        expect(result.current.readModelState).toBe('failed');
      });
      expect(result.current.readModelError?.code).toBe('DATASET_FAILED');
      expect(result.current.majorsError).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('deduplicates repeated DATASET_FAILED transitions for the same dataset', async () => {
    jest.useFakeTimers();
    try {
      mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
      mockGetDatasetOverview.mockRejectedValue(
        new ServiceError('DATASET_FAILED', 'Dataset failed.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-1',
            status: 'failed',
          },
        })
      );
      mockGetMajorsAnalytics.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(
                new ServiceError('DATASET_FAILED', 'Dataset failed.', {
                  retryable: false,
                  status: 409,
                  details: {
                    datasetId: 'dataset-1',
                    status: 'failed',
                  },
                })
              );
            }, 5);
          })
      );
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('failed');
      });
      const firstErrorRef = result.current.readModelError;

      await act(async () => {
        await jest.advanceTimersByTimeAsync(5);
      });

      await waitFor(() => {
        expect(result.current.readModelState).toBe('failed');
      });
      expect(result.current.readModelError).toBe(firstErrorRef);
    } finally {
      jest.useRealTimers();
    }
  });

  test('maps DATASET_NOT_READY from majors, migration, and forecasts to processing state with cleared panel errors', async () => {
    mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockRejectedValue(
      new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
        retryable: false,
        status: 409,
        details: {
          datasetId: 'dataset-1',
          status: 'queued',
          requiredStatus: 'ready',
        },
      })
    );
    mockGetMigrationAnalytics.mockRejectedValue(
      new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
        retryable: false,
        status: 409,
        details: {
          datasetId: 'dataset-1',
          status: 'queued',
          requiredStatus: 'ready',
        },
      })
    );
    mockGetForecastsAnalytics.mockRejectedValue(
      new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
        retryable: false,
        status: 409,
        details: {
          datasetId: 'dataset-1',
          status: 'queued',
          requiredStatus: 'ready',
        },
      })
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.readModelState).toBe('processing');
    });
    expect(result.current.readModelStatus).toBe('queued');
    expect(result.current.majorsError).toBeNull();
    expect(result.current.migrationError).toBeNull();
    expect(result.current.forecastsError).toBeNull();
  });

  test('treats queued active dataset status as processing', async () => {
    const queuedDataset = makeActiveDataset('dataset-queued', 'queued');

    mockGetActiveDataset.mockResolvedValue(queuedDataset);
    mockGetDatasetById.mockResolvedValue(queuedDataset);
    mockGetDatasetOverview.mockRejectedValue(
      new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
        retryable: false,
        status: 409,
        details: {
          datasetId: 'dataset-queued',
          status: 'queued',
          requiredStatus: 'ready',
        },
      })
    );
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-queued',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-queued',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-queued',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.readModelState).toBe('processing');
      expect(result.current.readModelStatus).toBe('queued');
    });
  });

  test('stops automatic processing-status polling after timeout', async () => {
    jest.useFakeTimers();
    try {
      const buildingDataset = makeActiveDataset('dataset-1', 'building');

      mockGetActiveDataset.mockResolvedValue({
        datasetId: 'dataset-1',
        name: 'ready-upload.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-14T00:00:00Z',
        sourceSubmissionId: 'sub-building',
      });
      mockGetDatasetById.mockResolvedValue(buildingDataset);
      mockGetDatasetOverview.mockRejectedValue(
        new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-1',
            status: 'building',
            requiredStatus: 'ready',
          },
        })
      );
      mockGetMajorsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        analyticsRecords: [],
        majorDistribution: [],
        cohortRecords: [],
      });
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('processing');
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(
          DATASET_STATUS_POLL_MAX_DURATION_MS + DATASET_STATUS_POLL_INTERVAL_MS
        );
      });

      await waitFor(() => {
        expect(result.current.readModelPollingTimedOut).toBe(true);
      });

      const callsAfterTimeout = mockGetDatasetById.mock.calls.length;

      await act(async () => {
        await jest.advanceTimersByTimeAsync(DATASET_STATUS_POLL_INTERVAL_MS * 3);
      });

      expect(mockGetDatasetById).toHaveBeenCalledTimes(callsAfterTimeout);
    } finally {
      jest.useRealTimers();
    }
  });

  test('polling transitions processing state to failed when dataset status becomes failed', async () => {
    jest.useFakeTimers();
    try {
      mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
      mockGetDatasetOverview.mockRejectedValue(
        new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-1',
            status: 'building',
            requiredStatus: 'ready',
          },
        })
      );
      mockGetDatasetById.mockResolvedValue(makeActiveDataset('dataset-1', 'failed'));
      mockGetMajorsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        analyticsRecords: [],
        majorDistribution: [],
        cohortRecords: [],
      });
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('failed');
      });
      expect(result.current.readModelError).toMatchObject({
        code: 'DATASET_FAILED',
        retryable: false,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  test('retryReadModelState no-ops when there is no active dataset id', async () => {
    mockGetActiveDataset.mockResolvedValue(null);

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    await act(async () => {
      await result.current.retryReadModelState();
    });

    expect(mockGetDatasetById).not.toHaveBeenCalled();
  });

  test('retryReadModelState swallows REQUEST_ABORTED status refresh failures', async () => {
    mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });
    mockGetDatasetById.mockRejectedValue(
      new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
    );

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.activeDataset?.datasetId).toBe('dataset-1');
    });

    await act(async () => {
      await result.current.retryReadModelState();
    });

    expect(mockGetDatasetById).toHaveBeenCalledWith('dataset-1', {
      signal: undefined,
    });
    expect(result.current.readModelState).toBe('ready');
  });

  test('processing polling ignores REQUEST_ABORTED dataset-status responses', async () => {
    jest.useFakeTimers();
    try {
      mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
      mockGetDatasetOverview.mockRejectedValue(
        new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-1',
            status: 'building',
            requiredStatus: 'ready',
          },
        })
      );
      mockGetDatasetById.mockRejectedValue(
        new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
      );
      mockGetMajorsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        analyticsRecords: [],
        majorDistribution: [],
        cohortRecords: [],
      });
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('processing');
      });

      await act(async () => {
        await jest.advanceTimersByTimeAsync(DATASET_STATUS_POLL_INTERVAL_MS);
      });

      expect(result.current.readModelState).toBe('processing');
      expect(result.current.readModelPollingTimedOut).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  test('retryReadModelState uses read-model dataset id when current state is processing', async () => {
    mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
    mockGetDatasetOverview.mockRejectedValue(
      new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
        retryable: false,
        status: 409,
        details: {
          datasetId: 'dataset-1',
          status: 'building',
          requiredStatus: 'ready',
        },
      })
    );
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });
    mockGetDatasetById.mockResolvedValue(makeActiveDataset('dataset-1', 'building'));

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.readModelState).toBe('processing');
    });

    await act(async () => {
      await result.current.retryReadModelState();
    });

    expect(mockGetDatasetById).toHaveBeenCalledWith('dataset-1', {
      signal: undefined,
    });
  });

  test('processing polling avoids overlapping status requests and times out after an in-flight tick completes', async () => {
    jest.useFakeTimers();
    const now = mockNow(0);
    try {
      mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
      mockGetDatasetOverview.mockRejectedValue(
        new ServiceError('DATASET_NOT_READY', 'Dataset is not ready.', {
          retryable: false,
          status: 409,
          details: {
            datasetId: 'dataset-1',
            status: 'building',
            requiredStatus: 'ready',
          },
        })
      );
      mockGetMajorsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        analyticsRecords: [],
        majorDistribution: [],
        cohortRecords: [],
      });
      mockGetMigrationAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        semesters: [],
        records: [],
      });
      mockGetForecastsAnalytics.mockResolvedValue({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [],
        fiveYearGrowthPct: 0,
        insights: {
          projectedGrowthText: '',
          resourcePlanningText: '',
          recommendationText: '',
        },
      });

      let resolveStatusRequest: ((dataset: ActiveDataset) => void) | undefined;
      const pendingStatusRequest = new Promise<ActiveDataset>((resolve) => {
        resolveStatusRequest = resolve;
      });
      mockGetDatasetById.mockReturnValue(pendingStatusRequest);

      const { result } = renderHook(() => useDashboardMetricsModel());

      await waitFor(() => {
        expect(result.current.readModelState).toBe('processing');
      });
      expect(mockGetDatasetById).toHaveBeenCalledTimes(1);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(DATASET_STATUS_POLL_INTERVAL_MS * 2);
      });
      expect(mockGetDatasetById).toHaveBeenCalledTimes(1);

      now.set(DATASET_STATUS_POLL_MAX_DURATION_MS + 1);
      await act(async () => {
        resolveStatusRequest?.(makeActiveDataset('dataset-1', 'building'));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.readModelPollingTimedOut).toBe(true);
      });
    } finally {
      now.restore();
      jest.useRealTimers();
    }
  });

  test('tracks upload errors without fabricating submission state', async () => {
    mockGetActiveDataset.mockResolvedValue(null);
    mockCreateDatasetSubmission.mockRejectedValue(
      new ServiceError('UPLOAD_FAILED', 'Upload failed', true)
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    const file = new File(['a,b\n1,2'], 'enrollment.csv', { type: 'text/csv' });

    await act(async () => {
      await result.current.handleDatasetUpload(file);
    });

    expect(mockCreateDatasetSubmission).toHaveBeenCalledTimes(1);
    expect(mockCreateDatasetSubmission.mock.calls[0]?.[0]).toEqual({
      file,
      activateOnSuccess: true,
    });
    expect(result.current.uploadError?.code).toBe('UPLOAD_FAILED');
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
    mockGetActiveDataset.mockResolvedValue(null);

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
      datasetId: 'dataset-1',
      name: 'enrollment.csv',
      status: 'ready',
      isActive: true,
      createdAt: '2026-02-11T00:00:00Z',
      sourceSubmissionId: 'sub-1',
    });
    mockGetDatasetOverview.mockRejectedValue(new Error('Overview unavailable'));
    mockGetMajorsAnalytics.mockRejectedValue(new Error('Majors unavailable'));
    mockGetMigrationAnalytics.mockRejectedValue(new Error('Migration unavailable'));
    mockGetForecastsAnalytics.mockRejectedValue(new Error('Forecasts unavailable'));

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.activeDataset?.datasetId).toBe('dataset-1');
    });

    await waitFor(() => {
      expect(result.current.overviewError?.message).toBe('Overview unavailable');
      expect(result.current.majorsError?.message).toBe('Majors unavailable');
      expect(result.current.migrationError?.message).toBe('Migration unavailable');
      expect(result.current.forecastsError?.message).toBe('Forecasts unavailable');
    });
  });

  test('keeps migration 500 errors in panel error state with retry metadata', async () => {
    mockGetActiveDataset.mockResolvedValue(makeActiveDataset('dataset-1', 'ready'));
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockRejectedValue(
      new ApiError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Migration endpoint failed',
        status: 500,
        retryable: false,
      })
    );
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.migrationError?.status).toBe(500);
    });

    expect(result.current.readModelState).toBe('ready');
    expect(result.current.migrationError).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Migration endpoint failed',
      retryable: false,
      status: 500,
    });
  });

  test('maps NEEDS_REBUILD forecast errors to a panel-specific message', async () => {
    mockGetActiveDataset.mockResolvedValue({
      datasetId: 'dataset-1',
      name: 'enrollment.csv',
      status: 'ready',
      isActive: true,
      createdAt: '2026-02-11T00:00:00Z',
      sourceSubmissionId: 'sub-1',
    });
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockRejectedValue(
      new ServiceError('NEEDS_REBUILD', 'Rebuild required', false)
    );

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.forecastsError?.code).toBe('NEEDS_REBUILD');
    });

    expect(result.current.forecastsError?.message).toBe(
      'Forecasts are not ready yet for this dataset. Rebuild is required before forecast analytics can be shown.'
    );
  });

  test('ignores REQUEST_ABORTED errors from panel loaders', async () => {
    mockGetActiveDataset.mockResolvedValue({
      datasetId: 'dataset-1',
      name: 'enrollment.csv',
      status: 'ready',
      isActive: true,
      createdAt: '2026-02-11T00:00:00Z',
      sourceSubmissionId: 'sub-1',
    });
    mockGetDatasetOverview.mockRejectedValue(
      new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
    );
    mockGetMajorsAnalytics.mockRejectedValue(
      new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
    );
    mockGetMigrationAnalytics.mockRejectedValue(
      new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
    );
    mockGetForecastsAnalytics.mockRejectedValue(
      new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.activeDataset?.datasetId).toBe('dataset-1');
    });

    await act(async () => {
      await result.current.retryOverview();
      await result.current.retryMajors();
      await result.current.retryMigration();
      await result.current.retryForecasts();
    });

    expect(result.current.overviewError).toBeNull();
    expect(result.current.majorsError).toBeNull();
    expect(result.current.migrationError).toBeNull();
    expect(result.current.forecastsError).toBeNull();
  });

  test('resets invalid migration semester selections when not in loaded options', async () => {
    mockGetActiveDataset.mockResolvedValue({
      datasetId: 'dataset-1',
      name: 'enrollment.csv',
      status: 'ready',
      isActive: true,
      createdAt: '2026-02-11T00:00:00Z',
      sourceSubmissionId: 'sub-1',
    });
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-1',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-1',
      analyticsRecords: [],
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
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.migrationData?.semesters).toEqual(['Spring 2026']);
    });

    await act(async () => {
      result.current.setMigrationSemester('Fall 2025');
    });

    await waitFor(() => {
      expect(result.current.migrationSemester).toBeUndefined();
    });

    await act(async () => {
      result.current.setMigrationSemester('Spring 2026');
    });

    await waitFor(() => {
      expect(result.current.migrationSemester).toBe('Spring 2026');
    });
  });

  test('upload success reloads dataset state and clears upload error', async () => {
    mockGetActiveDataset
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        datasetId: 'dataset-2',
        name: 'latest.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-11T00:00:00Z',
        sourceSubmissionId: 'sub-1',
      });

    mockCreateDatasetSubmission.mockResolvedValue({
      submissionId: 'submission-1',
      datasetId: 'dataset-2',
      status: 'queued',
      fileName: 'latest.csv',
      createdAt: '2026-02-11T00:00:00Z',
    });

    mockGetDatasetSubmissionStatus.mockResolvedValue({
      submissionId: 'submission-1',
      datasetId: 'dataset-2',
      status: 'completed',
      fileName: 'latest.csv',
      createdAt: '2026-02-11T00:00:00Z',
      completedAt: '2026-02-11T00:01:00Z',
      validationErrors: [],
    });

    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-2',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-2',
      analyticsRecords: [],
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
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
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
      expect(result.current.activeDataset?.datasetId).toBe('dataset-2');
    });

    expect(mockGetDatasetSubmissionStatus).toHaveBeenCalledWith('submission-1', {
      signal: expect.any(Object),
    });
    expect(result.current.uploadError).toBeNull();
    expect(result.current.uploadLoading).toBe(false);
  });

  test('deduplicates concurrent active dataset requests', async () => {
    let resolveDataset: ((value: Awaited<ReturnType<typeof getActiveDataset>>) => void) | null =
      null;
    const deferred = new Promise<Awaited<ReturnType<typeof getActiveDataset>>>(
      (resolve) => {
        resolveDataset = resolve;
      }
    );
    mockGetActiveDataset.mockReturnValue(deferred);

    const { result } = renderHook(() => useDashboardMetricsModel());

    await act(async () => {
      const first = result.current.retryDataset();
      const second = result.current.retryDataset();
      resolveDataset?.({
        datasetId: 'dataset-1',
        name: 'enrollment.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-11T00:00:00Z',
        sourceSubmissionId: 'sub-1',
      });
      await Promise.all([first, second]);
    });

    expect(mockGetActiveDataset).toHaveBeenCalledTimes(1);
  });

  test('ignores aborted active dataset requests without surfacing errors', async () => {
    mockGetActiveDataset.mockRejectedValue(
      new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
    );

    const { result } = renderHook(() => useDashboardMetricsModel());

    await waitFor(() => {
      expect(result.current.datasetError).toBeNull();
    });
  });

  test('maps terminal failed submissions to upload error details', async () => {
    mockGetActiveDataset.mockResolvedValue(null);
    mockCreateDatasetSubmission.mockResolvedValue({
      submissionId: 'submission-1',
      datasetId: 'dataset-1',
      status: 'queued',
      fileName: 'bad.csv',
      createdAt: '2026-02-11T00:00:00Z',
    });
    mockGetDatasetSubmissionStatus.mockResolvedValue({
      submissionId: 'submission-1',
      datasetId: 'dataset-1',
      status: 'failed',
      fileName: 'bad.csv',
      createdAt: '2026-02-11T00:00:00Z',
      completedAt: '2026-02-11T00:00:10Z',
      validationErrors: [{ code: 'ROW_INVALID', message: 'Row 12 invalid.' }],
    });

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDatasetUpload(
        new File(['x,y\n1,2'], 'bad.csv', { type: 'text/csv' })
      );
    });

    expect(result.current.uploadError).toMatchObject({
      code: 'ROW_INVALID',
      message: 'Row 12 invalid.',
    });
  });

  test('falls back to default failed-submission error metadata when validation errors are absent', async () => {
    mockGetActiveDataset.mockResolvedValue(null);
    mockCreateDatasetSubmission.mockResolvedValue({
      submissionId: 'submission-1',
      datasetId: 'dataset-1',
      status: 'queued',
      fileName: 'bad.csv',
      createdAt: '2026-02-11T00:00:00Z',
    });
    mockGetDatasetSubmissionStatus.mockResolvedValue({
      submissionId: 'submission-1',
      datasetId: 'dataset-1',
      status: 'failed',
      fileName: 'bad.csv',
      createdAt: '2026-02-11T00:00:00Z',
      completedAt: '2026-02-11T00:00:10Z',
      validationErrors: undefined,
    } as unknown as Awaited<ReturnType<typeof getDatasetSubmissionStatus>>);

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDatasetUpload(
        new File(['x,y\n1,2'], 'bad.csv', { type: 'text/csv' })
      );
    });

    expect(result.current.uploadError).toMatchObject({
      code: 'SUBMISSION_FAILED',
      message: 'Dataset processing failed. Check validation errors and retry.',
      details: {
        validationErrors: [],
      },
    });
  });

  test('times out submission polling with bounded backoff', async () => {
    jest.useFakeTimers();
    const now = mockNow(0);
    try {
      mockGetActiveDataset.mockResolvedValue(null);
      mockCreateDatasetSubmission.mockResolvedValue({
        submissionId: 'submission-timeout',
        datasetId: 'dataset-1',
        status: 'queued',
        fileName: 'slow.csv',
        createdAt: '2026-02-11T00:00:00Z',
      });
      let statusCalls = 0;
      mockGetDatasetSubmissionStatus.mockImplementation(async () => {
        statusCalls += 1;
        if (statusCalls >= 2) {
          now.set(181_000);
        }

        return {
          submissionId: 'submission-timeout',
          datasetId: 'dataset-1',
          status: 'processing',
          fileName: 'slow.csv',
          createdAt: '2026-02-11T00:00:00Z',
          completedAt: null,
          validationErrors: [],
        };
      });

      const { result } = renderHook(() => useDashboardMetricsModel());
      await waitFor(() => {
        expect(result.current.datasetLoading).toBe(false);
      });

      await act(async () => {
        const uploadPromise = result.current.handleDatasetUpload(
          new File(['x,y\n1,2'], 'slow.csv', { type: 'text/csv' })
        );
        await jest.advanceTimersByTimeAsync(1_000);
        await uploadPromise;
      });

      expect(result.current.uploadError?.code).toBe('SUBMISSION_POLL_TIMEOUT');
      expect(mockGetDatasetSubmissionStatus).toHaveBeenCalled();
    } finally {
      now.restore();
      jest.useRealTimers();
    }
  });

  test('aborts in-flight upload polling when a new upload starts', async () => {
    mockGetActiveDataset
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        datasetId: 'dataset-2',
        name: 'latest.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-11T00:00:00Z',
        sourceSubmissionId: 'sub-2',
      });

    mockCreateDatasetSubmission
      .mockResolvedValueOnce({
        submissionId: 'submission-1',
        datasetId: 'dataset-1',
        status: 'queued',
        fileName: 'first.csv',
        createdAt: '2026-02-11T00:00:00Z',
      })
      .mockResolvedValueOnce({
        submissionId: 'submission-2',
        datasetId: 'dataset-2',
        status: 'queued',
        fileName: 'second.csv',
        createdAt: '2026-02-11T00:00:00Z',
      });

    mockGetDatasetSubmissionStatus
      .mockResolvedValueOnce({
        submissionId: 'submission-1',
        datasetId: 'dataset-1',
        status: 'processing',
        fileName: 'first.csv',
        createdAt: '2026-02-11T00:00:00Z',
        completedAt: null,
        validationErrors: [],
      })
      .mockResolvedValueOnce({
        submissionId: 'submission-2',
        datasetId: 'dataset-2',
        status: 'completed',
        fileName: 'second.csv',
        createdAt: '2026-02-11T00:00:00Z',
        completedAt: '2026-02-11T00:01:00Z',
        validationErrors: [],
      });

    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-2',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-2',
      analyticsRecords: [],
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
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    let firstUploadPromise!: Promise<void>;
    await act(async () => {
      firstUploadPromise = result.current.handleDatasetUpload(
        new File(['x,y\n1,2'], 'first.csv', { type: 'text/csv' })
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.handleDatasetUpload(
        new File(['x,y\n1,2'], 'second.csv', { type: 'text/csv' })
      );
    });

    await act(async () => {
      await firstUploadPromise;
    });

    expect(result.current.uploadError).toBeNull();
    expect(result.current.uploadLoading).toBe(false);
    expect(result.current.activeDataset?.datasetId).toBe('dataset-2');
  });

  test('uses submission dataset id when refreshed active dataset is unavailable after upload success', async () => {
    mockGetActiveDataset.mockResolvedValue(null);
    mockCreateDatasetSubmission.mockResolvedValue({
      submissionId: 'submission-9',
      datasetId: 'dataset-9',
      status: 'queued',
      fileName: 'latest.csv',
      createdAt: '2026-02-11T00:00:00Z',
    });
    mockGetDatasetSubmissionStatus.mockResolvedValue({
      submissionId: 'submission-9',
      datasetId: 'dataset-9',
      status: 'completed',
      fileName: 'latest.csv',
      createdAt: '2026-02-11T00:00:00Z',
      completedAt: '2026-02-11T00:00:10Z',
      validationErrors: [],
    });
    mockGetDatasetOverview.mockResolvedValue({
      datasetId: 'dataset-9',
      snapshotTotals: {
        total: 0,
        undergrad: 0,
        ftic: 0,
        transfer: 0,
        international: 0,
      },
      activeMajors: 0,
      activeSchools: 0,
      studentTypeDistribution: [],
      schoolDistribution: [],
      trend: [],
    });
    mockGetMajorsAnalytics.mockResolvedValue({
      datasetId: 'dataset-9',
      analyticsRecords: [],
      majorDistribution: [],
      cohortRecords: [],
    });
    mockGetMigrationAnalytics.mockResolvedValue({
      datasetId: 'dataset-9',
      semesters: [],
      records: [],
    });
    mockGetForecastsAnalytics.mockResolvedValue({
      datasetId: 'dataset-9',
      historical: [],
      forecast: [],
      fiveYearGrowthPct: 0,
      insights: {
        projectedGrowthText: '',
        resourcePlanningText: '',
        recommendationText: '',
      },
    });

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    await act(async () => {
      await result.current.handleDatasetUpload(
        new File(['x,y\n1,2'], 'latest.csv', { type: 'text/csv' })
      );
    });

    expect(mockGetDatasetOverview).toHaveBeenCalledWith('dataset-9', {
      signal: expect.any(Object),
    });
  });

  test('handles uploads aborted before delay wait begins', async () => {
    jest.useFakeTimers();
    try {
    mockGetActiveDataset.mockResolvedValue(null);
    mockCreateDatasetSubmission
      .mockResolvedValueOnce({
        submissionId: 'submission-1',
        datasetId: 'dataset-1',
        status: 'queued',
        fileName: 'first.csv',
        createdAt: '2026-02-11T00:00:00Z',
      })
      .mockRejectedValueOnce(
        new ServiceError('REQUEST_ABORTED', 'The request was cancelled.', true)
      );

    mockGetDatasetSubmissionStatus.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            submissionId: 'submission-1',
            datasetId: 'dataset-1',
            status: 'processing',
            fileName: 'first.csv',
            createdAt: '2026-02-11T00:00:00Z',
            completedAt: null,
            validationErrors: [],
          });
        }, 0);
      });
    });

    const { result } = renderHook(() => useDashboardMetricsModel());
    await waitFor(() => {
      expect(result.current.datasetLoading).toBe(false);
    });

    let firstUploadPromise!: Promise<void>;
    act(() => {
      firstUploadPromise = result.current.handleDatasetUpload(
        new File(['x,y\n1,2'], 'first.csv', { type: 'text/csv' })
      );
    });
    await act(async () => {
      await result.current.handleDatasetUpload(
        new File(['x,y\n1,2'], 'second.csv', { type: 'text/csv' })
      );
      await jest.advanceTimersByTimeAsync(0);
      await firstUploadPromise;
    });

    expect(result.current.uploadError).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
