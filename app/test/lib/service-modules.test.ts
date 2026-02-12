import {
  activateDataset,
  getActiveDataset,
  getDatasetById,
  listDatasets,
} from '@/features/datasets/api/datasetsService';
import { getForecastsAnalytics } from '@/features/forecasts/api/forecastsService';
import { getMajorsAnalytics } from '@/features/majors/api/majorsService';
import { getMigrationAnalytics } from '@/features/migration/api/migrationService';
import {
  createBulkSubmissionJob,
  createDatasetSubmission,
  getBulkSubmissionJobStatus,
  getDatasetSubmissionStatus,
  listSubmissions,
} from '@/features/submissions/api/submissionsService';
import { ServiceError } from '@/lib/api/errors';
import { apiClient } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    postForm: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('service modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('datasetsService uses expected endpoints and query defaults', async () => {
    mockApiClient.get
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
      })
      .mockResolvedValueOnce({
        datasetId: 'dataset-1',
        name: 'ready.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-10T00:00:00Z',
        sourceSubmissionId: 'sub-1',
      })
      .mockResolvedValueOnce({
        datasetId: 'dataset/1',
        name: 'ready.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-10T00:00:00Z',
        sourceSubmissionId: 'sub-1',
      });
    mockApiClient.put.mockResolvedValueOnce({
      datasetId: 'dataset-1',
      name: 'ready.csv',
      status: 'ready',
      isActive: true,
      createdAt: '2026-02-10T00:00:00Z',
      sourceSubmissionId: 'sub-1',
    });

    await listDatasets();
    await getActiveDataset();
    await getDatasetById('dataset/1');
    await activateDataset('dataset-1');

    expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/api/v1/datasets', {
      query: { page: 1, pageSize: 20 },
      signal: undefined,
    });
    expect(mockApiClient.get).toHaveBeenNthCalledWith(
      2,
      '/api/v1/datasets/active',
      { signal: undefined }
    );
    expect(mockApiClient.get).toHaveBeenNthCalledWith(
      3,
      '/api/v1/datasets/dataset%2F1',
      {
        signal: undefined,
        datasetCache: { datasetId: 'dataset/1' },
      }
    );
    expect(mockApiClient.put).toHaveBeenCalledWith(
      '/api/v1/datasets/dataset-1/active',
      undefined,
      { signal: undefined }
    );
  });

  test('getActiveDataset maps ACTIVE_DATASET_NOT_FOUND to null and rethrows other errors', async () => {
    mockApiClient.get.mockRejectedValueOnce(
      new ServiceError(
        'ACTIVE_DATASET_NOT_FOUND',
        'Active dataset not found.',
        false
      )
    );
    await expect(getActiveDataset()).resolves.toBeNull();

    mockApiClient.get.mockRejectedValueOnce(new ServiceError('NETWORK_ERROR', 'nope'));
    await expect(getActiveDataset()).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  test('getMajorsAnalytics aggregates and normalizes cohort records', async () => {
    mockApiClient.get
      .mockResolvedValueOnce({
        datasetId: 'dataset-1',
        records: [
          {
            year: 2024,
            semester: 'Fall',
            major: 'Biology',
            school: 'Science',
            studentType: 'FTIC',
            count: 3,
          },
          {
            year: 2024,
            semester: 'Fall',
            major: 'Biology',
            school: 'Science',
            studentType: 'Transfer',
            count: 1,
          },
          {
            year: 2024,
            semester: 'Fall',
            major: 'Chemistry',
            school: 'Science',
            studentType: 'FTIC',
            count: 2,
          },
        ],
      })
      .mockResolvedValueOnce({
        datasetId: 'dataset-1',
        records: [
          {
            major: 'Biology',
            cohort: 'FTIC 2024',
            avgGPA: null,
            avgCredits: null,
            studentCount: 4,
          },
        ],
      });

    const response = await getMajorsAnalytics('dataset-1');
    expect(response.majorDistribution).toEqual([
      { major: 'Biology', count: 4 },
      { major: 'Chemistry', count: 2 },
    ]);
    expect(response.cohortRecords[0]).toMatchObject({
      avgGPA: 0,
      avgCredits: 0,
    });
  });

  test('getMigrationAnalytics combines options and records with semester filter', async () => {
    mockApiClient.get
      .mockResolvedValueOnce({
        datasetId: 'dataset-1',
        semesters: ['Fall 2024'],
      })
      .mockResolvedValueOnce({
        datasetId: 'dataset-1',
        records: [{ fromMajor: 'A', toMajor: 'B', semester: 'Fall 2024', count: 1 }],
      });

    const response = await getMigrationAnalytics('dataset-1', {
      semester: 'Fall 2024',
    });

    expect(response.semesters).toEqual(['Fall 2024']);
    expect(response.records).toHaveLength(1);
    expect(mockApiClient.get).toHaveBeenNthCalledWith(
      2,
      '/api/v1/datasets/dataset-1/migration-records',
      {
        query: { semester: 'Fall 2024' },
        signal: undefined,
        datasetCache: { datasetId: 'dataset-1' },
      }
    );
  });

  test('getMigrationAnalytics supports default options argument', async () => {
    mockApiClient.get
      .mockResolvedValueOnce({
        datasetId: 'dataset-1',
        semesters: [],
      })
      .mockResolvedValueOnce({
        datasetId: 'dataset-1',
        records: [],
      });

    await getMigrationAnalytics('dataset-1');

    expect(mockApiClient.get).toHaveBeenNthCalledWith(
      2,
      '/api/v1/datasets/dataset-1/migration-records',
      {
        query: { semester: undefined },
        signal: undefined,
        datasetCache: { datasetId: 'dataset-1' },
      }
    );
  });

  test('getForecastsAnalytics normalizes semester anomalies', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      datasetId: 'dataset-1',
      fiveYearGrowthPct: 1.5,
      historical: [{ period: 'Unknown', year: 2024, semester: 2, total: 10 }],
      forecast: [
        {
          period: 'Unknown',
          year: 2025,
          semester: null,
          total: 12,
          isForecasted: true,
        },
      ],
      insights: {
        projectedGrowthText: 'a',
        resourcePlanningText: 'b',
        recommendationText: 'c',
      },
    });

    const response = await getForecastsAnalytics('dataset-1');
    expect(response.historical[0]?.semester).toBe('2');
    expect(response.forecast[0]?.semester).toBe('Unknown');
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/api/v1/datasets/dataset-1/forecasts',
      {
        query: { horizon: 4 },
        signal: undefined,
        datasetCache: { datasetId: 'dataset-1' },
      }
    );
  });

  test('submissionsService handles single submission, status, list, and bulk endpoints', async () => {
    mockApiClient.postForm
      .mockResolvedValueOnce({
        submissionId: 'sub-1',
        datasetId: 'dataset-1',
        status: 'queued',
        fileName: 'latest.csv',
        createdAt: '2026-02-10T00:00:00Z',
      })
      .mockResolvedValueOnce({
        jobId: 'job-1',
        status: 'queued',
        totalFiles: 2,
        activateLatest: true,
        continueOnError: true,
        dryRun: false,
        createdAt: '2026-02-10T00:00:00Z',
      });

    mockApiClient.get
      .mockResolvedValueOnce({
        submissionId: 'sub-1',
        datasetId: 'dataset-1',
        status: 'failed',
        fileName: 'latest.csv',
        createdAt: '2026-02-10T00:00:00Z',
        completedAt: '2026-02-10T00:02:00Z',
        validationErrors: [{ code: 'VALIDATION_FAILED', message: 'Bad row' }],
      })
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
      })
      .mockResolvedValueOnce({
        jobId: 'job-1',
        status: 'completed',
        totalFiles: 2,
        processedFiles: 2,
        succeededFiles: 2,
        failedFiles: 0,
        activateLatest: true,
        continueOnError: true,
        dryRun: false,
        activatedDatasetId: 'dataset-1',
        createdAt: '2026-02-10T00:00:00Z',
        startedAt: '2026-02-10T00:00:10Z',
        completedAt: '2026-02-10T00:01:00Z',
        results: [],
      });

    const file = new File(['a,b\n1,2'], 'latest.csv', { type: 'text/csv' });
    const created = await createDatasetSubmission({ file, activateOnSuccess: false });
    const status = await getDatasetSubmissionStatus('sub/1');
    await listSubmissions({
      page: 2,
      pageSize: 25,
      status: 'failed',
      createdAfter: '2026-01-01T00:00:00Z',
      createdBefore: '2026-01-31T00:00:00Z',
    });
    await createBulkSubmissionJob({
      files: [file, new File(['x,y\n1,2'], 'next.csv', { type: 'text/csv' })],
      activateLatest: false,
      continueOnError: false,
      dryRun: true,
    });
    const job = await getBulkSubmissionJobStatus('job/1');

    expect(created).toMatchObject({
      submissionId: 'sub-1',
      datasetId: 'dataset-1',
      status: 'queued',
    });
    expect(status).toMatchObject({
      completedAt: '2026-02-10T00:02:00Z',
      validationErrors: [{ code: 'VALIDATION_FAILED', message: 'Bad row' }],
    });
    expect(job.jobId).toBe('job-1');

    const createCall = mockApiClient.postForm.mock.calls[0];
    expect(createCall?.[0]).toBe('/api/v1/submissions');
    expect(createCall?.[2]).toMatchObject({
      query: { activate_on_success: false },
      signal: undefined,
    });
    const createBody = createCall?.[1] as FormData;
    expect(createBody.get('file')).toBe(file);

    expect(mockApiClient.get).toHaveBeenNthCalledWith(
      1,
      '/api/v1/submissions/sub%2F1',
      { signal: undefined }
    );
    expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/api/v1/submissions', {
      query: {
        page: 2,
        pageSize: 25,
        status: 'failed',
        createdAfter: '2026-01-01T00:00:00Z',
        createdBefore: '2026-01-31T00:00:00Z',
      },
      signal: undefined,
    });
    expect(mockApiClient.get).toHaveBeenNthCalledWith(
      3,
      '/api/v1/submissions/bulk/job%2F1',
      { signal: undefined }
    );
  });

  test('submissionsService applies default query and form flags when optional fields are omitted', async () => {
    const file = new File(['a,b\n1,2'], 'latest.csv', { type: 'text/csv' });

    mockApiClient.postForm
      .mockResolvedValueOnce({
        submissionId: 'sub-default',
        datasetId: 'dataset-default',
        status: 'queued',
        fileName: 'latest.csv',
        createdAt: '2026-02-10T00:00:00Z',
      })
      .mockResolvedValueOnce({
        jobId: 'job-default',
        status: 'queued',
        totalFiles: 1,
        activateLatest: true,
        continueOnError: true,
        dryRun: false,
        createdAt: '2026-02-10T00:00:00Z',
      });
    mockApiClient.get.mockResolvedValueOnce({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });

    await createDatasetSubmission({ file });
    await listSubmissions();
    await createBulkSubmissionJob({ files: [file] });

    expect(mockApiClient.postForm).toHaveBeenNthCalledWith(
      1,
      '/api/v1/submissions',
      expect.any(FormData),
      {
        query: { activate_on_success: true },
        signal: undefined,
      }
    );
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/submissions', {
      query: {
        page: 1,
        pageSize: 20,
        status: undefined,
        createdAfter: undefined,
        createdBefore: undefined,
      },
      signal: undefined,
    });

    const bulkCall = mockApiClient.postForm.mock.calls[1];
    const bulkBody = bulkCall?.[1] as FormData;
    expect(bulkBody.get('activate_latest')).toBe('true');
    expect(bulkBody.get('continue_on_error')).toBe('true');
    expect(bulkBody.get('dry_run')).toBe('false');
  });
});
