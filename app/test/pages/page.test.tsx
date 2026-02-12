import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/page';
import {
  calculateFiveYearGrowthRate,
  selectTopMajorLabel,
} from '@/features/metrics/utils/metrics-summary-utils';

describe('OUS Analytics page', () => {
  test('renders no-dataset state and upload CTA', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText('No dataset uploaded yet')
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Upload dataset CSV')).toBeInTheDocument();
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
