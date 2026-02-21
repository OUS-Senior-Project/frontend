import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/page';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks/useDashboardMetricsModel';
import {
  calculateFiveYearGrowthRate,
  selectTopMajorLabel,
} from '@/features/metrics/utils/metrics-summary-utils';

jest.mock('@/features/dashboard/hooks/useDashboardMetricsModel', () => ({
  useDashboardMetricsModel: jest.fn(),
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
    forecastHorizon: 4,
    setForecastHorizon: noop,
    handleDatasetUpload: noop,
    uploadLoading: false,
    uploadError: null,
    readModelState: 'ready',
    readModelStatus: null,
    readModelError: null,
    readModelPollingTimedOut: false,
    retryReadModelState: noop,
    activeDataset: null,
    datasetLoading: false,
    datasetError: null,
    dashboardViewState: 'notFound',
    noDataset: true,
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

describe('OUS Analytics page', () => {
  test('renders no-dataset state and upload CTA', async () => {
    mockUseDashboardMetricsModel.mockReturnValue(buildModel());
    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText('No dataset uploaded yet')
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Upload file')).toBeInTheDocument();
  });

  test('handles empty yearly totals in growth calculation', () => {
    expect(calculateFiveYearGrowthRate([])).toBe(0);
  });

  test('calculates growth when both first and last yearly totals exist', () => {
    expect(
      calculateFiveYearGrowthRate([{ total: 100 }, { total: 140 }])
    ).toBe(40);
  });

  test('selectTopMajorLabel falls back to N/A', () => {
    expect(selectTopMajorLabel([])).toBe('N/A');
    expect(selectTopMajorLabel([{ major: '' }])).toBe('N/A');
    expect(selectTopMajorLabel([{ major: 'Biology' }])).toBe('Biology');
  });
});
