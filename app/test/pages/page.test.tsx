import { render, screen, fireEvent, act } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/page';
import {
  calculateFiveYearGrowthRate,
  selectTopMajorLabel,
} from '@/features/metrics/utils/metrics-summary-utils';

describe('OUS Analytics page', () => {
  test('renders and handles file upload and breakdown modal', () => {
    render(<DashboardPage />);

    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);

    const fileInput = screen.getByLabelText('Upload CSV') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(
      screen.getByText('Successfully loaded: data.csv')
    ).toBeInTheDocument();

    const totalCard = screen.getByText('Total Students');
    fireEvent.click(totalCard.closest('[role="button"]') as HTMLElement);
    expect(screen.getByText('Student Breakdown')).toBeInTheDocument();
  });

  test('handles empty yearly totals in growth calculation', () => {
    expect(calculateFiveYearGrowthRate([])).toBe(0);
  });

  test('selectTopMajorLabel falls back to N/A', () => {
    expect(selectTopMajorLabel([])).toBe('N/A');
    expect(selectTopMajorLabel([{ major: '' }])).toBe('N/A');
    expect(selectTopMajorLabel([{ major: 'Biology' }])).toBe('Biology');
  });
});
