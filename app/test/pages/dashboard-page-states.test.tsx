import { fireEvent, screen } from '@testing-library/react';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks/useDashboardMetricsModel';
import { renderDashboard } from '../utils/dashboardPage';

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

describe('DashboardPage states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state', () => {
    renderDashboard(mockUseDashboardMetricsModel, {
      datasetLoading: true,
    });

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  test('renders error state and retries dataset load', () => {
    const retryDataset = jest.fn();
    renderDashboard(mockUseDashboardMetricsModel, {
      datasetError: {
        code: 'UNKNOWN',
        message: 'Unable to load dashboard data.',
        retryable: true,
      },
      retryDataset,
    });

    expect(screen.getByText('Unable to load dashboard')).toBeInTheDocument();
    expect(screen.getByText('Unable to load dashboard data.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retryDataset).toHaveBeenCalledTimes(1);
  });

  test('renders no-dataset state', () => {
    renderDashboard(mockUseDashboardMetricsModel, {
      noDataset: true,
    });

    expect(screen.getByTestId('dashboard-no-dataset')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-tabs')).not.toBeInTheDocument();
  });

  test('renders dashboard tabs when dataset is present', () => {
    renderDashboard(mockUseDashboardMetricsModel, {
      activeDataset: {
        datasetId: 'dataset-1',
        name: 'enrollment.csv',
        status: 'ready',
        isActive: true,
        createdAt: '2026-02-11T00:00:00Z',
        sourceSubmissionId: 'sub-1',
      },
      noDataset: false,
    });

    expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();
    expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    expect(screen.queryByText('Unable to load dashboard')).not.toBeInTheDocument();
  });
});
