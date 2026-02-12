import { fireEvent, render, screen } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/page';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks/useDashboardMetricsModel';

jest.mock('@/features/dashboard/hooks/useDashboardMetricsModel', () => ({
  useDashboardMetricsModel: jest.fn(),
}));

jest.mock('@/features/dashboard/components/DashboardTabs', () => ({
  DashboardTabs: () => <div data-testid="dashboard-tabs">Dashboard Tabs</div>,
}));

jest.mock('@/features/dashboard/components/DashboardNoDatasetState', () => ({
  DashboardNoDatasetState: () => (
    <div data-testid="dashboard-no-dataset">No dataset state</div>
  ),
}));

const mockUseDashboardMetricsModel =
  useDashboardMetricsModel as jest.MockedFunction<
    typeof useDashboardMetricsModel
  >;

function buildModel(overrides: Partial<ReturnType<typeof useDashboardMetricsModel>> = {}) {
  const noop = jest.fn();
  return {
    selectedDate: new Date('2026-02-11'),
    setSelectedDate: noop,
    breakdownOpen: false,
    setBreakdownOpen: noop,
    migrationSemester: undefined,
    setMigrationSemester: noop,
    handleDatasetUpload: noop,
    uploadLoading: false,
    uploadError: null,
    activeDataset: null,
    datasetLoading: false,
    datasetError: null,
    noDataset: false,
    retryDataset: noop,
    overviewData: null,
    overviewLoading: false,
    overviewError: null,
    retryOverview: noop,
    majorsData: null,
    majorsLoading: false,
    majorsError: null,
    retryMajors: noop,
    migrationData: null,
    migrationLoading: false,
    migrationError: null,
    retryMigration: noop,
    forecastsData: null,
    forecastsLoading: false,
    forecastsError: null,
    retryForecasts: noop,
    ...overrides,
  } as ReturnType<typeof useDashboardMetricsModel>;
}

describe('DashboardPage states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state', () => {
    mockUseDashboardMetricsModel.mockReturnValue(
      buildModel({
        datasetLoading: true,
      })
    );

    render(<DashboardPage />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  test('renders error state and retries dataset load', () => {
    const retryDataset = jest.fn();
    mockUseDashboardMetricsModel.mockReturnValue(
      buildModel({
        datasetError: {
          code: 'UNKNOWN',
          message: 'Unable to load dashboard data.',
          retryable: true,
        },
        retryDataset,
      })
    );

    render(<DashboardPage />);

    expect(screen.getByText('Unable to load dashboard')).toBeInTheDocument();
    expect(screen.getByText('Unable to load dashboard data.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retryDataset).toHaveBeenCalledTimes(1);
  });

  test('renders no-dataset state', () => {
    mockUseDashboardMetricsModel.mockReturnValue(
      buildModel({
        noDataset: true,
      })
    );

    render(<DashboardPage />);

    expect(screen.getByTestId('dashboard-no-dataset')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-tabs')).not.toBeInTheDocument();
  });

  test('renders dashboard tabs when dataset is present', () => {
    mockUseDashboardMetricsModel.mockReturnValue(
      buildModel({
        activeDataset: {
          id: 'dataset-1',
          name: 'enrollment.csv',
          uploadedAt: '2026-02-11T00:00:00Z',
          status: 'ready',
        },
        noDataset: false,
      })
    );

    render(<DashboardPage />);

    expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    expect(screen.queryByText('Unable to load dashboard')).not.toBeInTheDocument();
  });
});
