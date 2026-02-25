import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import AdminConsoleRoute from '@/app/admin-console/page';
import {
  formatNullableText,
  formatValidationError,
  isSnapshotActivatable,
  statusBadgeVariant,
} from '@/features/admin-console/components/AdminConsolePage';
import {
  activateDataset,
  getActiveDataset,
  getDatasetById,
} from '@/features/datasets/api';
import { listSnapshots } from '@/features/snapshots/api';
import { getDatasetSubmissionStatus } from '@/features/submissions/api';
import { ServiceError } from '@/lib/api/errors';
import type {
  DatasetDetail,
  DatasetSubmission,
  DatasetSummary,
  SnapshotListResponse,
  SnapshotSummary,
} from '@/lib/api/types';
import { renderWithProviders } from '../utils/render';

jest.mock('@/features/snapshots/api', () => ({
  listSnapshots: jest.fn(),
}));

jest.mock('@/features/datasets/api', () => ({
  activateDataset: jest.fn(),
  getActiveDataset: jest.fn(),
  getDatasetById: jest.fn(),
}));

jest.mock('@/features/submissions/api', () => ({
  getDatasetSubmissionStatus: jest.fn(),
}));

const mockListSnapshots = listSnapshots as jest.MockedFunction<
  typeof listSnapshots
>;
const mockActivateDataset = activateDataset as jest.MockedFunction<
  typeof activateDataset
>;
const mockGetActiveDataset = getActiveDataset as jest.MockedFunction<
  typeof getActiveDataset
>;
const mockGetDatasetById = getDatasetById as jest.MockedFunction<
  typeof getDatasetById
>;
const mockGetDatasetSubmissionStatus =
  getDatasetSubmissionStatus as jest.MockedFunction<
    typeof getDatasetSubmissionStatus
  >;

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function makeSnapshot(
  overrides: Partial<SnapshotSummary> & Pick<SnapshotSummary, 'snapshotId'>
): SnapshotSummary {
  const hasAcademicPeriodOverride = Object.prototype.hasOwnProperty.call(
    overrides,
    'academicPeriod'
  );
  const hasSubmissionIdOverride = Object.prototype.hasOwnProperty.call(
    overrides,
    'submissionId'
  );
  const hasDatasetIdOverride = Object.prototype.hasOwnProperty.call(
    overrides,
    'datasetId'
  );

  return {
    snapshotId: overrides.snapshotId,
    effectiveDate: overrides.effectiveDate ?? '2026-02-11',
    effectiveDatetime: overrides.effectiveDatetime ?? '2026-02-11T15:00:00Z',
    createdAt: overrides.createdAt ?? '2026-02-11T15:01:00Z',
    ...(hasAcademicPeriodOverride
      ? { academicPeriod: overrides.academicPeriod }
      : { academicPeriod: 'Spring 2026' }),
    status: overrides.status ?? 'ready',
    ...(hasSubmissionIdOverride
      ? { submissionId: overrides.submissionId }
      : { submissionId: 'sub-1' }),
    ...(hasDatasetIdOverride
      ? { datasetId: overrides.datasetId }
      : { datasetId: 'dataset-1' }),
  };
}

function makeCatalog(items: SnapshotSummary[]): SnapshotListResponse {
  return {
    items,
    page: 1,
    pageSize: 20,
    total: items.length,
  };
}

function makeDataset(
  overrides: Partial<DatasetSummary> & Pick<DatasetSummary, 'datasetId'>
): DatasetSummary {
  return {
    datasetId: overrides.datasetId,
    name: overrides.name ?? `${overrides.datasetId}.csv`,
    status: overrides.status ?? 'ready',
    isActive: overrides.isActive ?? false,
    createdAt: overrides.createdAt ?? '2026-02-11T15:01:00Z',
    sourceSubmissionId: overrides.sourceSubmissionId ?? 'sub-1',
  };
}

function makeDatasetDetail(
  overrides: Partial<DatasetDetail> & Pick<DatasetDetail, 'datasetId'>
): DatasetDetail {
  return makeDataset(overrides);
}

function makeSubmission(
  overrides: Partial<DatasetSubmission> &
    Pick<DatasetSubmission, 'submissionId'>
): DatasetSubmission {
  const hasValidationErrorsOverride = Object.prototype.hasOwnProperty.call(
    overrides,
    'validationErrors'
  );

  return {
    submissionId: overrides.submissionId,
    datasetId: overrides.datasetId ?? 'dataset-1',
    status: overrides.status ?? 'completed',
    fileName: overrides.fileName ?? 'snapshot.csv',
    createdAt: overrides.createdAt ?? '2026-02-11T15:00:00Z',
    completedAt: overrides.completedAt ?? '2026-02-11T15:05:00Z',
    ...(hasValidationErrorsOverride
      ? { validationErrors: overrides.validationErrors }
      : { validationErrors: [] }),
  };
}

describe('Admin Console route', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockListSnapshots.mockResolvedValue(
      makeCatalog([
        makeSnapshot({
          snapshotId: 'snap-ready-active',
          effectiveDate: '2026-02-11',
          datasetId: 'dataset-1',
          submissionId: 'sub-1',
          status: 'ready',
        }),
        makeSnapshot({
          snapshotId: 'snap-ready-inactive',
          effectiveDate: '2026-02-10',
          datasetId: 'dataset-2',
          submissionId: 'sub-2',
          status: 'ready',
          createdAt: '2026-02-10T12:01:00Z',
        }),
      ])
    );
    mockGetActiveDataset.mockResolvedValue(
      makeDataset({ datasetId: 'dataset-1', isActive: true })
    );
    mockActivateDataset.mockResolvedValue(
      makeDataset({ datasetId: 'dataset-2', isActive: true })
    );
    mockGetDatasetById.mockResolvedValue(
      makeDatasetDetail({
        datasetId: 'dataset-2',
        name: 'snapshot-2.csv',
        status: 'ready',
        isActive: false,
      })
    );
    mockGetDatasetSubmissionStatus.mockResolvedValue(
      makeSubmission({ submissionId: 'sub-2', validationErrors: [] })
    );
  });

  test('renders snapshot catalog with active indicator and can view snapshot detail errors', async () => {
    const readyCatalog = makeCatalog([
      makeSnapshot({
        snapshotId: 'snap-ready-active',
        datasetId: 'dataset-1',
        submissionId: 'sub-1',
        status: 'ready',
        effectiveDate: '2026-02-11',
      }),
    ]);
    const failedCatalog = makeCatalog([
      makeSnapshot({
        snapshotId: 'snap-failed',
        datasetId: null,
        submissionId: 'sub-failed',
        status: 'failed',
        academicPeriod: null,
        effectiveDate: '2026-02-09',
        createdAt: '2026-02-09T09:01:00Z',
      }),
    ]);

    mockListSnapshots.mockReset();
    mockListSnapshots
      .mockResolvedValueOnce(readyCatalog)
      .mockResolvedValueOnce(failedCatalog);
    mockGetActiveDataset.mockResolvedValue(
      makeDataset({ datasetId: 'dataset-1', isActive: true })
    );

    mockGetDatasetSubmissionStatus.mockResolvedValueOnce(
      makeSubmission({
        submissionId: 'sub-failed',
        datasetId: 'dataset-failed',
        status: 'failed',
        validationErrors: [{ code: 'ROW_INVALID', message: 'Row 12 invalid.' }],
      })
    );

    renderWithProviders(<AdminConsoleRoute />);

    await screen.findByRole('heading', { name: 'Admin Console' });
    await screen.findByTestId('snapshot-row-snap-ready-active');

    expect(mockListSnapshots).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: 'ready',
    });
    expect(screen.getByText('2026-02-11')).toBeInTheDocument();

    const activeRow = screen.getByTestId('snapshot-row-snap-ready-active');
    expect(within(activeRow).getByText('Active')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Snapshot status filter'), {
      target: { value: 'failed' },
    });

    await waitFor(() => {
      expect(mockListSnapshots).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        status: 'failed',
      });
    });

    const failedRow = await screen.findByTestId('snapshot-row-snap-failed');
    expect(screen.getByText('2026-02-09')).toBeInTheDocument();
    expect(screen.getByText('2026-02-09T09:01:00Z')).toBeInTheDocument();
    expect(
      within(failedRow).getByRole('button', {
        name: 'Set active snapshot snap-failed',
      })
    ).toBeDisabled();

    fireEvent.click(
      within(failedRow).getByRole('button', {
        name: 'View snapshot detail snap-failed',
      })
    );

    await screen.findByTestId('snapshot-detail-panel');
    await waitFor(() => {
      expect(mockGetDatasetSubmissionStatus).toHaveBeenCalledWith('sub-failed');
    });

    expect(screen.getByText('Submission validation')).toBeInTheDocument();
    expect(
      screen.getByText('ROW_INVALID: Row 12 invalid.')
    ).toBeInTheDocument();
  });

  test('activates a snapshot dataset and updates the active indicator', async () => {
    const readyCatalog = makeCatalog([
      makeSnapshot({
        snapshotId: 'snap-ready-active',
        effectiveDate: '2026-02-11',
        datasetId: 'dataset-1',
        submissionId: 'sub-1',
        status: 'ready',
      }),
      makeSnapshot({
        snapshotId: 'snap-ready-inactive',
        effectiveDate: '2026-02-10',
        datasetId: 'dataset-2',
        submissionId: 'sub-2',
        status: 'ready',
        createdAt: '2026-02-10T12:01:00Z',
      }),
    ]);

    mockListSnapshots.mockReset();
    mockListSnapshots
      .mockResolvedValueOnce(readyCatalog)
      .mockResolvedValueOnce(readyCatalog);
    mockGetActiveDataset.mockReset();
    mockGetActiveDataset
      .mockResolvedValueOnce(
        makeDataset({ datasetId: 'dataset-1', isActive: true })
      )
      .mockResolvedValueOnce(
        makeDataset({ datasetId: 'dataset-2', isActive: true })
      );
    mockActivateDataset.mockResolvedValueOnce(
      // Deliberately stale payload; UI should update based on refetched server truth.
      makeDataset({ datasetId: 'dataset-1', isActive: true })
    );

    renderWithProviders(<AdminConsoleRoute />);

    await screen.findByTestId('snapshot-row-snap-ready-inactive');

    const targetRow = screen.getByTestId('snapshot-row-snap-ready-inactive');
    fireEvent.click(
      within(targetRow).getByRole('button', {
        name: 'Set active snapshot snap-ready-inactive',
      })
    );

    await waitFor(() => {
      expect(mockActivateDataset).toHaveBeenCalledWith('dataset-2');
    });
    await waitFor(() => {
      expect(mockGetActiveDataset).toHaveBeenCalledTimes(2);
      expect(mockListSnapshots).toHaveBeenCalledTimes(2);
    });

    await screen.findByText('Snapshot activated');
    expect(
      screen.getByText(/Activated snapshot snap-ready-inactive/)
    ).toBeVisible();

    const updatedTargetRow = screen.getByTestId(
      'snapshot-row-snap-ready-inactive'
    );
    const previousActiveRow = screen.getByTestId(
      'snapshot-row-snap-ready-active'
    );

    await waitFor(() => {
      expect(within(updatedTargetRow).getByText('Active')).toBeInTheDocument();
      expect(
        within(previousActiveRow).queryByText('Active')
      ).not.toBeInTheDocument();
    });
  });

  test('surfaces activation errors from the backend', async () => {
    mockActivateDataset.mockRejectedValueOnce(
      new ServiceError(
        'DATASET_NOT_READY',
        'Only ready datasets can be activated.',
        {
          retryable: false,
          status: 409,
        }
      )
    );

    renderWithProviders(<AdminConsoleRoute />);

    const targetRow = await screen.findByTestId(
      'snapshot-row-snap-ready-inactive'
    );
    fireEvent.click(
      within(targetRow).getByRole('button', {
        name: 'Set active snapshot snap-ready-inactive',
      })
    );

    await screen.findByTestId('admin-console-action-alert');
    expect(screen.getByText('Action failed')).toBeInTheDocument();
    expect(
      screen.getByText('Only ready datasets can be activated.')
    ).toBeInTheDocument();
  });

  test('renders catalog load error and retry action', async () => {
    mockListSnapshots.mockRejectedValueOnce(
      new ServiceError(
        'SNAPSHOT_CATALOG_FAILED',
        'Catalog service unavailable.',
        {
          retryable: true,
        }
      )
    );

    renderWithProviders(<AdminConsoleRoute />);

    await screen.findByText('Unable to load snapshot catalog');
    expect(
      screen.getByText('Catalog service unavailable.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  test('allows switching snapshot status filters', async () => {
    const firstResponse = makeCatalog([
      makeSnapshot({
        snapshotId: 'snap-ready',
        status: 'ready',
      }),
    ]);
    const failedSnapshot = makeSnapshot({
      snapshotId: 'snap-failed-filtered',
      status: 'failed',
      datasetId: null,
      submissionId: 'sub-failed',
    });
    const secondResponse = makeCatalog([failedSnapshot]);

    mockListSnapshots.mockReset();
    mockListSnapshots
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);
    mockGetActiveDataset.mockResolvedValue(
      makeDataset({ datasetId: 'dataset-1' })
    );

    renderWithProviders(<AdminConsoleRoute />);

    await screen.findByTestId('snapshot-row-snap-ready');

    fireEvent.change(screen.getByLabelText('Snapshot status filter'), {
      target: { value: 'failed' },
    });

    await waitFor(() => {
      expect(mockListSnapshots).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        status: 'failed',
      });
    });

    await screen.findByTestId('snapshot-row-snap-failed-filtered');
  });

  test('exports helper functions for formatting and activation checks', () => {
    expect(statusBadgeVariant('failed')).toBe('destructive');
    expect(statusBadgeVariant('ready')).toBe('secondary');
    expect(statusBadgeVariant('building')).toBe('outline');

    expect(formatNullableText(null)).toBe('—');
    expect(formatNullableText('')).toBe('—');
    expect(formatNullableText('Spring 2026')).toBe('Spring 2026');

    expect(formatValidationError(undefined, 0)).toBe('Error 1');
    expect(formatValidationError({ code: 'ONLY_CODE' }, 1)).toBe('ONLY_CODE');
    expect(formatValidationError({ message: ' only message ' }, 2)).toBe(
      'only message'
    );
    expect(
      isSnapshotActivatable(
        makeSnapshot({
          snapshotId: 'snap-x',
          status: 'ready',
          datasetId: 'ds-1',
        })
      )
    ).toBe(true);
    expect(
      isSnapshotActivatable(
        makeSnapshot({
          snapshotId: 'snap-y',
          status: 'failed',
          datasetId: null,
        })
      )
    ).toBe(false);
  });

  test('shows active dataset load error without blocking snapshot table', async () => {
    mockGetActiveDataset.mockRejectedValueOnce(
      new ServiceError(
        'ACTIVE_DATASET_FAILED',
        'Unable to load active dataset.',
        {
          retryable: true,
        }
      )
    );

    renderWithProviders(<AdminConsoleRoute />);

    await screen.findByTestId('snapshot-row-snap-ready-active');

    expect(
      screen.getByText('Active indicator may be unavailable')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Unable to load active dataset.')
    ).toBeInTheDocument();
  });

  test('refresh button triggers a refetch and clears notices', async () => {
    const readyCatalog = makeCatalog([
      makeSnapshot({
        snapshotId: 'snap-ready-active',
        datasetId: 'dataset-1',
        submissionId: 'sub-1',
      }),
      makeSnapshot({
        snapshotId: 'snap-ready-inactive',
        datasetId: 'dataset-2',
        submissionId: 'sub-2',
        effectiveDate: '2026-02-10',
      }),
    ]);

    mockListSnapshots.mockReset();
    mockListSnapshots
      .mockResolvedValueOnce(readyCatalog)
      .mockResolvedValueOnce(readyCatalog)
      .mockResolvedValueOnce(readyCatalog);
    mockGetActiveDataset.mockReset();
    mockGetActiveDataset
      .mockResolvedValueOnce(
        makeDataset({ datasetId: 'dataset-1', isActive: true })
      )
      .mockResolvedValueOnce(
        makeDataset({ datasetId: 'dataset-2', isActive: true })
      )
      .mockResolvedValueOnce(
        makeDataset({ datasetId: 'dataset-2', isActive: true })
      );
    mockActivateDataset.mockResolvedValueOnce(
      makeDataset({ datasetId: 'dataset-2', isActive: true })
    );

    renderWithProviders(<AdminConsoleRoute />);

    const targetRow = await screen.findByTestId(
      'snapshot-row-snap-ready-inactive'
    );
    fireEvent.click(
      within(targetRow).getByRole('button', {
        name: 'Set active snapshot snap-ready-inactive',
      })
    );

    await screen.findByText('Snapshot activated');
    expect(
      screen.getByTestId('admin-console-action-alert')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(mockListSnapshots).toHaveBeenCalledTimes(3);
      expect(mockGetActiveDataset).toHaveBeenCalledTimes(3);
    });
    expect(
      screen.queryByTestId('admin-console-action-alert')
    ).not.toBeInTheDocument();
  });

  test('catalog error retry refetches snapshots', async () => {
    mockListSnapshots.mockReset();
    mockListSnapshots
      .mockRejectedValueOnce(
        new ServiceError(
          'SNAPSHOT_CATALOG_FAILED',
          'Catalog service unavailable.',
          {
            retryable: true,
          }
        )
      )
      .mockResolvedValueOnce(
        makeCatalog([makeSnapshot({ snapshotId: 'snap-after-retry' })])
      );

    renderWithProviders(<AdminConsoleRoute />);

    await screen.findByText('Unable to load snapshot catalog');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(mockListSnapshots).toHaveBeenCalledTimes(2);
    });
    await screen.findByTestId('snapshot-row-snap-after-retry');
  });

  test('supports page size changes and pagination navigation', async () => {
    const page1Size20 = {
      items: [
        makeSnapshot({ snapshotId: 'snap-page1', effectiveDate: '2026-02-11' }),
      ],
      page: 1,
      pageSize: 20,
      total: 60,
    } satisfies SnapshotListResponse;
    const page1Size50 = {
      items: [
        makeSnapshot({
          snapshotId: 'snap-page1-size50',
          effectiveDate: '2026-02-11',
        }),
      ],
      page: 1,
      pageSize: 50,
      total: 60,
    } satisfies SnapshotListResponse;
    const page2Size50 = {
      items: [
        makeSnapshot({
          snapshotId: 'snap-page2-size50',
          effectiveDate: '2026-02-10',
        }),
      ],
      page: 2,
      pageSize: 50,
      total: 60,
    } satisfies SnapshotListResponse;

    mockListSnapshots.mockReset();
    mockListSnapshots
      .mockResolvedValueOnce(page1Size20)
      .mockResolvedValueOnce(page1Size50)
      .mockResolvedValueOnce(page2Size50)
      .mockResolvedValueOnce(page1Size50);
    mockGetActiveDataset.mockResolvedValue(
      makeDataset({ datasetId: 'dataset-1' })
    );

    renderWithProviders(<AdminConsoleRoute />);
    await screen.findByTestId('snapshot-row-snap-page1');

    fireEvent.change(screen.getByLabelText('Snapshot page size'), {
      target: { value: '50' },
    });

    await waitFor(() => {
      expect(mockListSnapshots).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 50,
        status: 'ready',
      });
    });
    await screen.findByTestId('snapshot-row-snap-page1-size50');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(mockListSnapshots).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 50,
        status: 'ready',
      });
    });
    await screen.findByTestId('snapshot-row-snap-page2-size50');

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() => {
      expect(mockListSnapshots).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 50,
        status: 'ready',
      });
    });
  });

  test('hides detail, reopens from cache without refetch, and supports forced detail refresh', async () => {
    const firstDataset = createDeferred<DatasetDetail>();
    const firstSubmission = createDeferred<DatasetSubmission>();
    const refreshedDataset = createDeferred<DatasetDetail>();
    const refreshedSubmission = createDeferred<DatasetSubmission>();

    mockGetDatasetById.mockReset();
    mockGetDatasetById
      .mockReturnValueOnce(firstDataset.promise)
      .mockReturnValueOnce(refreshedDataset.promise);
    mockGetDatasetSubmissionStatus.mockReset();
    mockGetDatasetSubmissionStatus
      .mockReturnValueOnce(firstSubmission.promise)
      .mockReturnValueOnce(refreshedSubmission.promise);

    renderWithProviders(<AdminConsoleRoute />);

    const row = await screen.findByTestId('snapshot-row-snap-ready-inactive');
    fireEvent.click(
      within(row).getByRole('button', {
        name: 'View snapshot detail snap-ready-inactive',
      })
    );

    await screen.findByTestId('snapshot-detail-panel');
    expect(screen.getByText('Loading snapshot detail...')).toBeInTheDocument();

    await act(async () => {
      firstDataset.resolve(
        makeDatasetDetail({
          datasetId: 'dataset-2',
          name: 'snapshot-2.csv',
          status: 'ready',
          isActive: false,
        })
      );
      firstSubmission.resolve(
        makeSubmission({ submissionId: 'sub-2', validationErrors: [] })
      );
    });

    await screen.findByText('Read-model readiness');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'View snapshot detail snap-ready-inactive',
      })
    );
    expect(
      screen.queryByTestId('snapshot-detail-panel')
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(screen.getByTestId('snapshot-row-snap-ready-inactive')).getByRole(
        'button',
        {
          name: 'View snapshot detail snap-ready-inactive',
        }
      )
    );

    await screen.findByTestId('snapshot-detail-panel');
    expect(mockGetDatasetById).toHaveBeenCalledTimes(1);
    expect(mockGetDatasetSubmissionStatus).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh detail' }));
    expect(screen.getByText('Refreshing detail...')).toBeInTheDocument();

    await act(async () => {
      refreshedDataset.resolve(
        makeDatasetDetail({
          datasetId: 'dataset-2',
          name: 'snapshot-2-refresh.csv',
          status: 'building',
          isActive: false,
        })
      );
      refreshedSubmission.resolve(
        makeSubmission({
          submissionId: 'sub-2',
          validationErrors: [{} as { code?: string; message?: string }],
        })
      );
    });

    await screen.findByText('snapshot-2-refresh.csv');
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(mockGetDatasetById).toHaveBeenCalledTimes(2);
    expect(mockGetDatasetSubmissionStatus).toHaveBeenCalledTimes(2);
  });

  test('clears selected snapshot detail when filtered snapshot is no longer visible', async () => {
    const readyCatalog = makeCatalog([
      makeSnapshot({
        snapshotId: 'snap-ready-selected',
        datasetId: 'dataset-2',
        submissionId: 'sub-2',
      }),
    ]);
    const failedCatalog = makeCatalog([
      makeSnapshot({
        snapshotId: 'snap-failed-other',
        datasetId: null,
        submissionId: 'sub-failed',
        status: 'failed',
      }),
    ]);

    mockListSnapshots.mockReset();
    mockListSnapshots
      .mockResolvedValueOnce(readyCatalog)
      .mockResolvedValueOnce(failedCatalog);
    mockGetActiveDataset.mockResolvedValue(
      makeDataset({ datasetId: 'dataset-1' })
    );
    mockGetDatasetById.mockResolvedValue(
      makeDatasetDetail({ datasetId: 'dataset-2', name: 'ready.csv' })
    );
    mockGetDatasetSubmissionStatus.mockResolvedValue(
      makeSubmission({ submissionId: 'sub-2', validationErrors: [] })
    );

    renderWithProviders(<AdminConsoleRoute />);

    const row = await screen.findByTestId('snapshot-row-snap-ready-selected');
    fireEvent.click(
      within(row).getByRole('button', {
        name: 'View snapshot detail snap-ready-selected',
      })
    );

    await screen.findByTestId('snapshot-detail-panel');

    fireEvent.change(screen.getByLabelText('Snapshot status filter'), {
      target: { value: 'failed' },
    });

    await screen.findByTestId('snapshot-row-snap-failed-other');
    await waitFor(() => {
      expect(
        screen.queryByTestId('snapshot-detail-panel')
      ).not.toBeInTheDocument();
    });
  });

  test('avoids state updates when initial load resolves after unmount', async () => {
    const snapshotsDeferred = createDeferred<SnapshotListResponse>();
    const activeDeferred = createDeferred<DatasetSummary | null>();

    mockListSnapshots.mockReset();
    mockListSnapshots.mockReturnValueOnce(snapshotsDeferred.promise);
    mockGetActiveDataset.mockReset();
    mockGetActiveDataset.mockReturnValueOnce(activeDeferred.promise);

    const view = renderWithProviders(<AdminConsoleRoute />);

    view.unmount();

    await act(async () => {
      snapshotsDeferred.resolve(
        makeCatalog([makeSnapshot({ snapshotId: 'snap-after-unmount' })])
      );
      activeDeferred.resolve(makeDataset({ datasetId: 'dataset-1' }));
    });

    expect(mockListSnapshots).toHaveBeenCalledTimes(1);
    expect(mockGetActiveDataset).toHaveBeenCalledTimes(1);
  });

  test('renders detail states when snapshot has no linked dataset or submission', async () => {
    mockListSnapshots.mockReset();
    mockListSnapshots.mockResolvedValueOnce(
      makeCatalog([
        {
          snapshotId: 'snap-no-links',
          effectiveDate: '2026-02-11',
          effectiveDatetime: '2026-02-11T15:00:00Z',
          createdAt: '2026-02-11T15:01:00Z',
          academicPeriod: 'Spring 2026',
          status: 'ready',
          datasetId: null,
          submissionId: null,
        },
      ])
    );
    mockGetActiveDataset.mockResolvedValue(
      makeDataset({ datasetId: 'dataset-1' })
    );
    mockGetDatasetById.mockReset();
    mockGetDatasetSubmissionStatus.mockReset();

    renderWithProviders(<AdminConsoleRoute />);

    const row = await screen.findByTestId('snapshot-row-snap-no-links');
    fireEvent.click(
      within(row).getByRole('button', {
        name: 'View snapshot detail snap-no-links',
      })
    );

    const detailPanel = await screen.findByTestId('snapshot-detail-panel');
    await waitFor(() => {
      expect(detailPanel).toHaveTextContent(
        'No dataset linked to this snapshot.'
      );
      expect(detailPanel).toHaveTextContent(
        'No submission is linked to this snapshot.'
      );
    });
    expect(mockGetDatasetById).not.toHaveBeenCalled();
    expect(mockGetDatasetSubmissionStatus).not.toHaveBeenCalled();
  });

  test('renders dataset and submission detail fetch errors in snapshot detail', async () => {
    mockGetDatasetById.mockRejectedValueOnce(
      new ServiceError('DATASET_DETAIL_FAILED', 'Dataset detail failed.', {
        retryable: true,
      })
    );
    mockGetDatasetSubmissionStatus.mockRejectedValueOnce(
      new ServiceError(
        'SUBMISSION_DETAIL_FAILED',
        'Submission detail failed.',
        {
          retryable: true,
        }
      )
    );

    renderWithProviders(<AdminConsoleRoute />);

    const row = await screen.findByTestId('snapshot-row-snap-ready-inactive');
    fireEvent.click(
      within(row).getByRole('button', {
        name: 'View snapshot detail snap-ready-inactive',
      })
    );

    await screen.findByTestId('snapshot-detail-panel');
    await screen.findByText('Dataset detail failed.');
    expect(
      screen.getByText('Unable to load submission detail')
    ).toBeInTheDocument();
    expect(screen.getByText('Submission detail failed.')).toBeInTheDocument();
  });

  test('treats omitted validationErrors as empty in submission detail', async () => {
    mockGetDatasetSubmissionStatus.mockResolvedValueOnce(
      makeSubmission({
        submissionId: 'sub-2',
        validationErrors: undefined,
      })
    );

    renderWithProviders(<AdminConsoleRoute />);

    const row = await screen.findByTestId('snapshot-row-snap-ready-inactive');
    fireEvent.click(
      within(row).getByRole('button', {
        name: 'View snapshot detail snap-ready-inactive',
      })
    );

    await screen.findByTestId('snapshot-detail-panel');
    await screen.findByText('No validation errors reported.');
  });
});
