import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/lib/api/errors';
import { BULK_BACKFILL_JOBS_STORAGE_KEY } from '@/lib/storage/bulkBackfillJobs';
import type { BulkSubmissionStatusResponse } from '@/lib/api/types';
import { AdminBulkBackfillMonitor } from '@/features/submissions/components/AdminBulkBackfillMonitor';
import {
  buildBulkJobReportCsv,
  buildBulkJobReportJson,
  countBulkJobItemStatuses,
  downloadTextFile,
} from '@/features/submissions/components/adminBulkBackfillMonitorUtils';
import { getBulkSubmissionJobStatus } from '@/features/submissions/api/submissionsService';
import { renderWithProviders } from '../../utils/render';

jest.mock('@/features/submissions/api/submissionsService', () => ({
  getBulkSubmissionJobStatus: jest.fn(),
}));

const mockGetBulkSubmissionJobStatus =
  getBulkSubmissionJobStatus as jest.MockedFunction<
    typeof getBulkSubmissionJobStatus
  >;

const ORIGINAL_CREATE_OBJECT_URL = URL.createObjectURL;
const ORIGINAL_REVOKE_OBJECT_URL = URL.revokeObjectURL;
const POLL_INTERVAL_MS = 5000;

afterEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: ORIGINAL_CREATE_OBJECT_URL,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: ORIGINAL_REVOKE_OBJECT_URL,
  });
  jest.useRealTimers();
});

function buildJobStatus(
  overrides: Partial<BulkSubmissionStatusResponse> = {}
): BulkSubmissionStatusResponse {
  return {
    jobId: 'bulk_123',
    status: 'failed',
    totalFiles: 4,
    processedFiles: 4,
    succeededFiles: 1,
    failedFiles: 2,
    activateLatest: true,
    continueOnError: true,
    dryRun: false,
    activatedDatasetId: 'ds_001',
    createdAt: '2026-02-24T14:00:00.000Z',
    startedAt: '2026-02-24T14:00:02.000Z',
    completedAt: '2026-02-24T14:10:00.000Z',
    results: [
      {
        fileOrder: 1,
        fileName: 'fall_2025.csv',
        status: 'completed',
        submissionId: 'sub_001',
        datasetId: 'ds_001',
        completedAt: '2026-02-24T14:03:00.000Z',
        validationErrors: [],
        error: null,
      },
      {
        fileOrder: 2,
        fileName: 'spring_2026.csv',
        status: 'failed',
        submissionId: 'sub_002',
        datasetId: 'ds_002',
        completedAt: null,
        validationErrors: [
          {
            code: 'VALIDATION_FAILED',
            message: 'Missing required columns',
            details: {
              columns: ['Student ID'],
            },
          },
          {
            code: 'ROW_PARSE_ERROR',
            message: 'Unable to parse row 17',
            details: {
              row: 17,
            },
          },
        ],
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Submission failed validation',
          details: {
            reason: 'required columns missing',
          },
        },
      },
      {
        fileOrder: 3,
        fileName: 'bundle.zip::notes.txt',
        status: 'failed',
        submissionId: null,
        datasetId: null,
        completedAt: null,
        validationErrors: [
          {
            code: 'UNSUPPORTED_FILE_TYPE',
            message: 'Only CSV and XLSX uploads are supported.',
            details: {
              fileName: 'notes.txt',
              sourceArchive: 'bundle.zip',
            },
          },
        ],
        error: {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: 'Only CSV and XLSX uploads are supported.',
          details: {
            fileName: 'notes.txt',
            sourceArchive: 'bundle.zip',
          },
        },
      },
      {
        fileOrder: 4,
        fileName: 'summer_2026.csv',
        status: 'skipped',
        submissionId: null,
        datasetId: null,
        completedAt: 'not-a-date',
        validationErrors: [],
        error: {
          code: 'SKIPPED_AFTER_FAILURE',
          message: 'Skipped because continue_on_error=false',
          details: {},
        },
      },
    ],
    ...overrides,
  };
}

describe('AdminBulkBackfillMonitor helpers', () => {
  test('counts item statuses and serializes JSON/CSV reports', () => {
    const detail = buildJobStatus({
      status: 'completed',
      failedFiles: 0,
      results: [
        {
          fileOrder: 1,
          fileName: 'roster,"quoted".csv',
          status: 'completed',
          submissionId: 'sub_001',
          datasetId: 'ds_001',
          completedAt: '2026-02-24T14:00:00.000Z',
          validationErrors: [],
          error: null,
        },
        {
          fileOrder: 2,
          fileName: 'bad\nfile.csv',
          status: 'processing',
          submissionId: null,
          datasetId: null,
          completedAt: null,
          validationErrors: [
            {
              message: '',
            },
          ],
          error: {
            details: {
              nested: true,
            },
          },
        },
      ],
    });

    expect(countBulkJobItemStatuses(detail.results)).toEqual({
      queued: 0,
      processing: 1,
      completed: 1,
      failed: 0,
      skipped: 0,
    });

    expect(buildBulkJobReportJson(detail)).toContain('"jobId": "bulk_123"');

    const csv = buildBulkJobReportCsv(detail);
    expect(csv).toContain('jobId,jobStatus,fileOrder,fileName,itemStatus');
    expect(csv).toContain('"roster,""quoted"".csv"');
    expect(csv).toContain('"bad\nfile.csv"');
    expect(csv).toContain('UNKNOWN_ERROR');
    expect(csv).toContain('No error message provided.');
  });

  test('downloads text files in supported browsers and fails gracefully otherwise', () => {
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    try {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: jest.fn(() => 'blob:mock-url'),
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: jest.fn(),
      });

      expect(
        downloadTextFile('report.json', '{"ok":true}', 'application/json')
      ).toBe(true);
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(clickSpy).toHaveBeenCalledTimes(1);

      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: undefined,
      });

      expect(downloadTextFile('report.csv', 'a,b', 'text/csv')).toBe(false);
    } finally {
      clickSpy.mockRestore();
    }
  });
});

describe('AdminBulkBackfillMonitor', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('renders empty state and validates blank job IDs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminBulkBackfillMonitor />);

    expect(
      screen.getByText(/No tracked jobs in this browser yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Stored locally in this browser/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Select a tracked job to inspect/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Track' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a bulk job ID to track.'
    );

    await user.type(screen.getByLabelText('Track a job ID'), 'bulk_fix');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockGetBulkSubmissionJobStatus).not.toHaveBeenCalled();
  });

  test('tracks a job, renders detail counts and per-file failures, and exports reports', async () => {
    const user = userEvent.setup();
    mockGetBulkSubmissionJobStatus.mockResolvedValueOnce(buildJobStatus());

    renderWithProviders(<AdminBulkBackfillMonitor />);

    const input = screen.getByLabelText('Track a job ID');
    await user.type(input, 'bulk_123');
    await user.click(screen.getByRole('button', { name: 'Track' }));

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledWith(
        'bulk_123',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Per-file Status')).toBeInTheDocument();
    });

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText(/Queued 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Skipped 1/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Retry failed items is not available yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Retry failed items \(not supported yet\)/i,
      })
    ).toBeDisabled();
    expect(screen.getByText(/Job ID: bulk_123/i)).toBeInTheDocument();
    expect(screen.getAllByText(/spring_2026\.csv/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('UNSUPPORTED_FILE_TYPE').length).toBeGreaterThan(
      0
    );
    expect(screen.getByText(/not-a-date/i)).toBeInTheDocument();

    const createObjectURLSpy = jest.fn(() => 'blob:report');
    const revokeObjectURLSpy = jest.fn();
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    try {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: createObjectURLSpy,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: revokeObjectURLSpy,
      });

      await user.click(
        screen.getByRole('button', { name: /Export JSON \(local\)/i })
      );
      await user.click(
        screen.getByRole('button', { name: /Export CSV \(local\)/i })
      );

      expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);
      expect(clickSpy).toHaveBeenCalledTimes(2);
    } finally {
      clickSpy.mockRestore();
    }

    const tracked = JSON.parse(
      window.localStorage.getItem(BULK_BACKFILL_JOBS_STORAGE_KEY) ?? '[]'
    );
    expect(tracked).toHaveLength(1);
    expect(tracked[0].jobId).toBe('bulk_123');
  });

  test('renders empty-result jobs, shows activateLatest false, and refreshes the selected job', async () => {
    const user = userEvent.setup();
    mockGetBulkSubmissionJobStatus
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_empty',
          status: 'completed',
          activateLatest: false,
          totalFiles: 0,
          processedFiles: 0,
          succeededFiles: 0,
          failedFiles: 0,
          results: [],
        })
      )
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_empty',
          status: 'completed',
          activateLatest: false,
          totalFiles: 0,
          processedFiles: 0,
          succeededFiles: 0,
          failedFiles: 0,
          results: [],
        })
      );

    renderWithProviders(<AdminBulkBackfillMonitor />);

    await user.type(screen.getByLabelText('Track a job ID'), 'bulk_empty');
    await user.click(screen.getByRole('button', { name: 'Track' }));

    await waitFor(() => {
      expect(
        screen.getByText(/No file results have been recorded for this job yet/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Activate latest: No/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Refresh selected job/i })
    );

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
    });
  });

  test('shows backend error details for unknown jobs', async () => {
    const user = userEvent.setup();
    mockGetBulkSubmissionJobStatus.mockRejectedValueOnce(
      new ApiError({
        code: 'BULK_JOB_NOT_FOUND',
        message: 'Bulk submission job not found.',
        status: 404,
        retryable: false,
        details: {
          jobId: 'bulk_missing',
        },
      })
    );

    renderWithProviders(<AdminBulkBackfillMonitor />);

    await user.type(screen.getByLabelText('Track a job ID'), 'bulk_missing');
    await user.click(screen.getByRole('button', { name: 'Track' }));

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to load job status/i)
      ).toBeInTheDocument();
    });

    expect(screen.getAllByText(/BULK_JOB_NOT_FOUND/i).length).toBeGreaterThan(
      0
    );
    expect(
      screen.getAllByText(/Bulk submission job not found/i).length
    ).toBeGreaterThan(0);

    mockGetBulkSubmissionJobStatus.mockResolvedValueOnce(
      buildJobStatus({
        jobId: 'bulk_missing',
        status: 'completed',
        failedFiles: 0,
        results: [],
      })
    );

    const trackedList = screen.getByLabelText('Tracked bulk jobs list');
    await user.click(
      within(trackedList).getAllByRole('button', { name: /bulk_missing/i })[0]
    );

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
    });
  });

  test('treats abort errors as silent refresh cancellations', async () => {
    const user = userEvent.setup();
    mockGetBulkSubmissionJobStatus.mockRejectedValueOnce(
      new DOMException('Aborted', 'AbortError')
    );

    renderWithProviders(<AdminBulkBackfillMonitor />);

    await user.type(screen.getByLabelText('Track a job ID'), 'bulk_abort');
    await user.click(screen.getByRole('button', { name: 'Track' }));

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByText(/Unable to load job status/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Loading\.\.\./i) ??
        screen.queryByText(/Not loaded yet/i)
    ).toBeTruthy();
  });

  test('ignores stale successful responses after a newer refresh replaces them', async () => {
    const user = userEvent.setup();

    let resolveFirstRequest:
      | ((value: BulkSubmissionStatusResponse) => void)
      | null = null;
    let resolveSecondRequest:
      | ((value: BulkSubmissionStatusResponse) => void)
      | null = null;

    mockGetBulkSubmissionJobStatus
      .mockImplementationOnce(
        async () =>
          new Promise<BulkSubmissionStatusResponse>((resolve) => {
            resolveFirstRequest = resolve;
          })
      )
      .mockImplementationOnce(
        async () =>
          new Promise<BulkSubmissionStatusResponse>((resolve) => {
            resolveSecondRequest = resolve;
          })
      );

    renderWithProviders(<AdminBulkBackfillMonitor />);

    await user.type(screen.getByLabelText('Track a job ID'), 'bulk_race');
    await user.click(screen.getByRole('button', { name: 'Track' }));

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(1);
    });

    await user.click(
      screen.getByRole('button', { name: /Refresh tracked jobs/i })
    );

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
    });

    resolveSecondRequest?.(
      buildJobStatus({
        jobId: 'bulk_race',
        status: 'completed',
        failedFiles: 0,
        succeededFiles: 1,
        processedFiles: 1,
        results: [
          {
            fileOrder: 1,
            fileName: 'latest.csv',
            status: 'completed',
            submissionId: 'sub_latest',
            datasetId: 'ds_latest',
            completedAt: '2026-02-24T16:00:00.000Z',
            validationErrors: [],
            error: null,
          },
        ],
      })
    );

    await waitFor(() => {
      expect(screen.getByText('latest.csv')).toBeInTheDocument();
    });

    resolveFirstRequest?.(
      buildJobStatus({
        jobId: 'bulk_race',
        status: 'completed',
        failedFiles: 1,
        succeededFiles: 0,
        processedFiles: 1,
        results: [
          {
            fileOrder: 1,
            fileName: 'stale.csv',
            status: 'failed',
            submissionId: null,
            datasetId: null,
            completedAt: null,
            validationErrors: [],
            error: {
              code: 'STALE_RESPONSE',
              message: 'Should not render',
              details: {},
            },
          },
        ],
      })
    );

    await act(async () => {});

    expect(screen.getByText('latest.csv')).toBeInTheDocument();
    expect(screen.queryByText('stale.csv')).not.toBeInTheDocument();
  });

  test('ignores stale non-abort errors from superseded refresh requests', async () => {
    const user = userEvent.setup();

    let rejectFirstRequest: ((reason?: unknown) => void) | null = null;
    let resolveSecondRequest:
      | ((value: BulkSubmissionStatusResponse) => void)
      | null = null;

    mockGetBulkSubmissionJobStatus
      .mockImplementationOnce(
        async () =>
          new Promise<BulkSubmissionStatusResponse>((_resolve, reject) => {
            rejectFirstRequest = reject;
          })
      )
      .mockImplementationOnce(
        async () =>
          new Promise<BulkSubmissionStatusResponse>((resolve) => {
            resolveSecondRequest = resolve;
          })
      );

    renderWithProviders(<AdminBulkBackfillMonitor />);

    await user.type(screen.getByLabelText('Track a job ID'), 'bulk_race_error');
    await user.click(screen.getByRole('button', { name: 'Track' }));

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(1);
    });

    await user.click(
      screen.getByRole('button', { name: /Refresh tracked jobs/i })
    );

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
    });

    resolveSecondRequest?.(
      buildJobStatus({
        jobId: 'bulk_race_error',
        status: 'completed',
        failedFiles: 0,
        results: [],
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No file results have been recorded for this job yet/i)
      ).toBeInTheDocument();
    });

    rejectFirstRequest?.(new Error('late failure should be ignored'));

    await act(async () => {});

    expect(
      screen.queryByText(/Unable to load job status/i)
    ).not.toBeInTheDocument();
  });

  test('loads tracked jobs from localStorage, refreshes all, removes entries, and clears list', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      BULK_BACKFILL_JOBS_STORAGE_KEY,
      JSON.stringify([
        {
          jobId: 'bulk_a',
          addedAt: '2026-02-24T10:00:00.000Z',
        },
        {
          jobId: 'bulk_b',
          addedAt: '2026-02-24T09:00:00.000Z',
        },
      ])
    );

    mockGetBulkSubmissionJobStatus
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_a',
          status: 'completed',
          failedFiles: 0,
          results: [
            {
              fileOrder: 1,
              fileName: 'a.csv',
              status: 'completed',
              submissionId: 'sub_a',
              datasetId: 'ds_a',
              completedAt: '2026-02-24T10:01:00.000Z',
              validationErrors: [],
              error: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_b',
          status: 'queued',
          processedFiles: 0,
          succeededFiles: 0,
          failedFiles: 0,
          results: [
            {
              fileOrder: 1,
              fileName: 'b.csv',
              status: 'queued',
              submissionId: null,
              datasetId: null,
              completedAt: null,
              validationErrors: [],
              error: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_a',
          status: 'completed',
          failedFiles: 0,
          results: [
            {
              fileOrder: 1,
              fileName: 'a.csv',
              status: 'completed',
              submissionId: 'sub_a',
              datasetId: 'ds_a',
              completedAt: '2026-02-24T10:01:00.000Z',
              validationErrors: [],
              error: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_b',
          status: 'completed',
          failedFiles: 0,
          processedFiles: 1,
          succeededFiles: 1,
          results: [
            {
              fileOrder: 1,
              fileName: 'b.csv',
              status: 'completed',
              submissionId: 'sub_b',
              datasetId: 'ds_b',
              completedAt: '2026-02-24T10:06:00.000Z',
              validationErrors: [],
              error: null,
            },
          ],
        })
      );

    renderWithProviders(<AdminBulkBackfillMonitor />);

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByLabelText('Tracked bulk jobs list')).toBeInTheDocument();
    expect(screen.getAllByText(/bulk_[ab]/).length).toBeGreaterThanOrEqual(2);

    await user.click(
      screen.getByRole('button', { name: /Refresh tracked jobs/i })
    );

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(4);
    });

    const trackedList = screen.getByLabelText('Tracked bulk jobs list');
    const firstRemoveButton = within(trackedList).getAllByRole('button', {
      name: /Remove .* from tracked jobs/i,
    })[0];
    await user.click(firstRemoveButton);

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(BULK_BACKFILL_JOBS_STORAGE_KEY) ?? '[]'
      );
      expect(stored).toHaveLength(1);
    });

    await user.click(
      screen.getByRole('button', { name: /Clear tracked jobs/i })
    );

    expect(
      window.localStorage.getItem(BULK_BACKFILL_JOBS_STORAGE_KEY)
    ).toBeNull();
    expect(
      screen.getByText(/No tracked jobs in this browser yet/i)
    ).toBeInTheDocument();
  });

  test('clears selected state after removing the last tracked job', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      BULK_BACKFILL_JOBS_STORAGE_KEY,
      JSON.stringify([
        {
          jobId: 'bulk_one',
          addedAt: '2026-02-24T10:00:00.000Z',
        },
      ])
    );

    mockGetBulkSubmissionJobStatus.mockResolvedValueOnce(
      buildJobStatus({
        jobId: 'bulk_one',
        status: 'completed',
        failedFiles: 0,
        results: [],
      })
    );

    renderWithProviders(<AdminBulkBackfillMonitor />);

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(1);
    });

    await user.click(
      screen.getByRole('button', {
        name: /Remove bulk_one from tracked jobs/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Select a tracked job to inspect/i)
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/No tracked jobs in this browser yet/i)
    ).toBeInTheDocument();
  });

  test('aborts active refresh requests when the component unmounts', async () => {
    const user = userEvent.setup();
    let requestSignal: AbortSignal | undefined;

    mockGetBulkSubmissionJobStatus.mockImplementationOnce(
      async (_jobId, options) => {
        requestSignal = options?.signal;
        return new Promise<BulkSubmissionStatusResponse>(() => {});
      }
    );

    const view = renderWithProviders(<AdminBulkBackfillMonitor />);

    await user.type(screen.getByLabelText('Track a job ID'), 'bulk_unmount');
    await user.click(screen.getByRole('button', { name: 'Track' }));

    await waitFor(() => {
      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(1);
    });
    expect(requestSignal).toBeDefined();
    expect(requestSignal!.aborted).toBe(false);

    view.unmount();

    expect(requestSignal!.aborted).toBe(true);
  });

  test('polls in-progress selected jobs and stops after completed', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    mockGetBulkSubmissionJobStatus
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_poll',
          status: 'processing',
          processedFiles: 1,
          succeededFiles: 0,
          failedFiles: 0,
          results: [
            {
              fileOrder: 1,
              fileName: 'poll.csv',
              status: 'processing',
              submissionId: null,
              datasetId: null,
              completedAt: null,
              validationErrors: [],
              error: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_poll',
          status: 'completed',
          processedFiles: 1,
          succeededFiles: 1,
          failedFiles: 0,
          results: [
            {
              fileOrder: 1,
              fileName: 'poll.csv',
              status: 'completed',
              submissionId: 'sub_poll',
              datasetId: 'ds_poll',
              completedAt: '2026-02-24T15:00:00.000Z',
              validationErrors: [],
              error: null,
            },
          ],
        })
      );

    try {
      renderWithProviders(<AdminBulkBackfillMonitor />);

      await user.type(screen.getByLabelText('Track a job ID'), 'bulk_poll');
      await user.click(screen.getByRole('button', { name: 'Track' }));

      await waitFor(() => {
        expect(screen.getByText('poll.csv')).toBeInTheDocument();
      });

      await act(async () => {
        jest.advanceTimersByTime(POLL_INTERVAL_MS);
      });

      await waitFor(() => {
        expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(
          screen.getByText(/No failed or skipped items to retry/i)
        ).toBeInTheDocument();
      });

      await act(async () => {
        jest.advanceTimersByTime(POLL_INTERVAL_MS * 2);
      });

      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  test('polling stops when a selected job becomes failed', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    mockGetBulkSubmissionJobStatus
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_poll_fail',
          status: 'processing',
          processedFiles: 0,
          succeededFiles: 0,
          failedFiles: 0,
          results: [
            {
              fileOrder: 1,
              fileName: 'poll-fail.csv',
              status: 'processing',
              submissionId: null,
              datasetId: null,
              completedAt: null,
              validationErrors: [],
              error: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_poll_fail',
          status: 'failed',
          processedFiles: 1,
          succeededFiles: 0,
          failedFiles: 1,
          results: [
            {
              fileOrder: 1,
              fileName: 'poll-fail.csv',
              status: 'failed',
              submissionId: null,
              datasetId: null,
              completedAt: null,
              validationErrors: [],
              error: {
                code: 'VALIDATION_FAILED',
                message: 'Failed in polling',
                details: {},
              },
            },
          ],
        })
      );

    try {
      renderWithProviders(<AdminBulkBackfillMonitor />);

      await user.type(
        screen.getByLabelText('Track a job ID'),
        'bulk_poll_fail'
      );
      await user.click(screen.getByRole('button', { name: 'Track' }));

      await waitFor(() => {
        expect(screen.getByText('poll-fail.csv')).toBeInTheDocument();
      });

      await act(async () => {
        jest.advanceTimersByTime(POLL_INTERVAL_MS);
      });

      await waitFor(() => {
        expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(
          screen.getByText(/Retry failed items is not available yet/i)
        ).toBeInTheDocument();
      });

      await act(async () => {
        jest.advanceTimersByTime(POLL_INTERVAL_MS * 2);
      });

      expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  test('switching selected jobs aborts the in-flight polling request', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    window.localStorage.setItem(
      BULK_BACKFILL_JOBS_STORAGE_KEY,
      JSON.stringify([
        {
          jobId: 'bulk_processing',
          addedAt: '2026-02-24T10:00:00.000Z',
        },
        {
          jobId: 'bulk_complete',
          addedAt: '2026-02-24T09:00:00.000Z',
        },
      ])
    );

    let pollingSignal: AbortSignal | undefined;
    let rejectPollingRequest: ((reason?: unknown) => void) | null = null;

    mockGetBulkSubmissionJobStatus
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_processing',
          status: 'processing',
          processedFiles: 0,
          succeededFiles: 0,
          failedFiles: 0,
          results: [
            {
              fileOrder: 1,
              fileName: 'polling.csv',
              status: 'processing',
              submissionId: null,
              datasetId: null,
              completedAt: null,
              validationErrors: [],
              error: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        buildJobStatus({
          jobId: 'bulk_complete',
          status: 'completed',
          failedFiles: 0,
          succeededFiles: 1,
          processedFiles: 1,
          results: [
            {
              fileOrder: 1,
              fileName: 'complete.csv',
              status: 'completed',
              submissionId: 'sub_complete',
              datasetId: 'ds_complete',
              completedAt: '2026-02-24T12:00:00.000Z',
              validationErrors: [],
              error: null,
            },
          ],
        })
      )
      .mockImplementationOnce(async (_jobId, options) => {
        pollingSignal = options?.signal;
        return new Promise<BulkSubmissionStatusResponse>((_resolve, reject) => {
          rejectPollingRequest = reject;
        });
      });

    try {
      renderWithProviders(<AdminBulkBackfillMonitor />);

      await waitFor(() => {
        expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(2);
      });
      await waitFor(() => {
        expect(screen.getByText('polling.csv')).toBeInTheDocument();
      });

      await act(async () => {
        jest.advanceTimersByTime(POLL_INTERVAL_MS);
      });

      await waitFor(() => {
        expect(mockGetBulkSubmissionJobStatus).toHaveBeenCalledTimes(3);
      });
      expect(pollingSignal).toBeDefined();
      expect(pollingSignal!.aborted).toBe(false);

      const trackedList = screen.getByLabelText('Tracked bulk jobs list');
      await user.click(
        within(trackedList).getAllByRole('button', {
          name: /bulk_complete/i,
        })[0]
      );

      await waitFor(() => {
        expect(pollingSignal!.aborted).toBe(true);
      });

      rejectPollingRequest?.(new DOMException('Aborted', 'AbortError'));
    } finally {
      jest.useRealTimers();
    }
  });
});
