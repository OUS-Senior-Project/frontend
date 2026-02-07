import { act, renderHook } from '@testing-library/react';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks/useDashboardMetricsModel';

describe('useDashboardMetricsModel', () => {
  test('exposes derived dashboard data and handles upload interaction', () => {
    const { result } = renderHook(() => useDashboardMetricsModel());

    expect(result.current.majorData.length).toBeGreaterThan(0);
    expect(result.current.schoolData.length).toBeGreaterThan(0);
    expect(result.current.uploadedDatasetName).toBeNull();

    const file = new File(['a,b\n1,2'], 'enrollment.csv', { type: 'text/csv' });

    act(() => {
      result.current.handleDatasetUpload({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.uploadedDatasetName).toBe('enrollment.csv');
  });

  test('ignores upload change when no file is provided', () => {
    const { result } = renderHook(() => useDashboardMetricsModel());

    act(() => {
      result.current.handleDatasetUpload({
        target: { files: undefined },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.uploadedDatasetName).toBeNull();
  });
});
