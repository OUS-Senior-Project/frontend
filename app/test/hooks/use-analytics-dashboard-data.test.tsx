import { act, renderHook } from '@testing-library/react';
import { useAnalyticsDashboardData } from '@/hooks/use-analytics-dashboard-data';

describe('useAnalyticsDashboardData', () => {
  test('exposes derived dashboard data and handles upload interaction', () => {
    const { result } = renderHook(() => useAnalyticsDashboardData());

    expect(result.current.majorData.length).toBeGreaterThan(0);
    expect(result.current.schoolData.length).toBeGreaterThan(0);
    expect(result.current.uploadedFile).toBeNull();

    const file = new File(['a,b\n1,2'], 'enrollment.csv', { type: 'text/csv' });

    act(() => {
      result.current.onUploadChange({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.uploadedFile).toBe('enrollment.csv');
  });

  test('ignores upload change when no file is provided', () => {
    const { result } = renderHook(() => useAnalyticsDashboardData());

    act(() => {
      result.current.onUploadChange({
        target: { files: undefined },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.uploadedFile).toBeNull();
  });
});
