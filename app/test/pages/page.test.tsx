import { screen, waitFor } from '@testing-library/react';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks/useDashboardMetricsModel';
import {
  calculateFiveYearGrowthRate,
  selectTopMajorLabel,
} from '@/features/metrics/utils/metrics-summary-utils';
import { renderDashboard } from '../utils/dashboardPage';

jest.mock('@/features/dashboard/hooks/useDashboardMetricsModel', () => ({
  useDashboardMetricsModel: jest.fn(),
}));

const mockUseDashboardMetricsModel =
  useDashboardMetricsModel as jest.MockedFunction<
    typeof useDashboardMetricsModel
  >;

describe('OUS Analytics page', () => {
  test('renders no-dataset state and upload CTA', async () => {
    renderDashboard(mockUseDashboardMetricsModel, {
      dashboardViewState: 'notFound',
      noDataset: true,
    });

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
