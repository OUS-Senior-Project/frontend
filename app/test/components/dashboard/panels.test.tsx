import { fireEvent, render, screen } from '@testing-library/react';
import { ForecastsPanel } from '@/features/dashboard/components/panels/ForecastsPanel';
import { MajorsPanel } from '@/features/dashboard/components/panels/MajorsPanel';
import { MigrationPanel } from '@/features/dashboard/components/panels/MigrationPanel';
import { OverviewPanel } from '@/features/dashboard/components/panels/OverviewPanel';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelLoadingState,
} from '@/features/dashboard/components/panels/PanelStates';

jest.mock('@/shared/ui/tabs', () => ({
  TabsContent: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => <div {...props}>{children}</div>,
}));

jest.mock('@/features/upload/components/UploadDatasetButton', () => ({
  UploadDatasetButton: ({
    onDatasetUpload,
    buttonLabel = 'Upload CSV',
  }: {
    onDatasetUpload: (file: File) => void;
    buttonLabel?: string;
  }) => (
    <button
      onClick={() => {
        onDatasetUpload(new File(['csv'], 'dataset.csv', { type: 'text/csv' }));
      }}
    >
      {buttonLabel}
    </button>
  ),
}));

jest.mock('@/features/filters/components/DateFilterButton', () => ({
  DateFilterButton: ({ onDateChange }: { onDateChange: (value: Date) => void }) => (
    <button onClick={() => onDateChange(new Date('2026-02-10'))}>
      Change Date
    </button>
  ),
}));

jest.mock('@/features/metrics/components/MetricsSummaryCard', () => ({
  MetricsSummaryCard: ({
    title,
    value,
    onClick,
  }: {
    title: string;
    value: string | number;
    onClick?: () => void;
  }) => <button onClick={onClick}>{`${title}: ${value}`}</button>,
}));

jest.mock('@/features/metrics/components/AnalyticsBreakdownModal', () => ({
  AnalyticsBreakdownModal: ({ open }: { open: boolean }) => (
    <div data-testid="analytics-breakdown-modal">
      {open ? 'open' : 'closed'}
    </div>
  ),
}));

jest.mock('@/features/metrics/components/charts/MetricsTrendChart', () => ({
  MetricsTrendChart: ({ data }: { data: Array<{ period: string; total: number }> }) => (
    <div>{`Trend points: ${data.length}`}</div>
  ),
}));

jest.mock(
  '@/features/metrics/components/charts/StudentTypeDistributionChart',
  () => ({
    StudentTypeDistributionChart: ({
      data,
    }: {
      data: Array<{ type: string; count: number }>;
    }) => <div>{`Student type points: ${data.length}`}</div>,
  })
);

jest.mock('@/features/metrics/components/charts/SchoolDistributionChart', () => ({
  SchoolDistributionChart: ({
    data,
  }: {
    data: Array<{ school: string; count: number }>;
  }) => <div>{`School points: ${data.length}`}</div>,
}));

jest.mock('@/features/metrics/components/CohortSummaryTable', () => ({
  CohortSummaryTable: ({ data }: { data: Array<{ major: string }> }) => (
    <div>{`Cohort rows: ${data.length}`}</div>
  ),
}));

jest.mock('@/features/metrics/components/charts/MajorDistributionChart', () => ({
  MajorDistributionChart: ({
    data,
  }: {
    data: Array<{ major: string; count: number }>;
  }) => <div>{`Major points: ${data.length}`}</div>,
}));

jest.mock('@/features/metrics/components/major-analytics-charts', () => ({
  AvgCreditsByCohortChart: ({ data }: { data: unknown[] }) => (
    <div>{`credits-by-cohort:${data.length}`}</div>
  ),
  AvgCreditsByMajorChart: ({ data }: { data: unknown[] }) => (
    <div>{`credits-by-major:${data.length}`}</div>
  ),
  AvgGPAByCohortChart: ({ data }: { data: unknown[] }) => (
    <div>{`gpa-by-cohort:${data.length}`}</div>
  ),
  AvgGPAByMajorChart: ({ data }: { data: unknown[] }) => (
    <div>{`gpa-by-major:${data.length}`}</div>
  ),
}));

jest.mock('@/features/metrics/components/charts/MigrationFlowChart', () => ({
  MigrationFlowChart: ({ data }: { data: unknown[] }) => (
    <div>{`Migration flow rows: ${data.length}`}</div>
  ),
}));

jest.mock('@/features/metrics/components/MigrationTopFlowsTable', () => ({
  MigrationTopFlowsTable: ({ data }: { data: unknown[] }) => (
    <div>{`Migration table rows: ${data.length}`}</div>
  ),
}));

jest.mock('@/features/filters/components/SemesterFilterSelect', () => ({
  SemesterFilterSelect: ({
    options,
    onValueChange,
  }: {
    options: string[];
    onValueChange: (value: string | undefined) => void;
  }) => (
    <button onClick={() => onValueChange(options[0])}>
      {`Semester options: ${options.length}`}
    </button>
  ),
}));

jest.mock('@/features/metrics/components/ForecastSection', () => ({
  ForecastSection: ({
    historicalData,
    forecastData,
  }: {
    historicalData: unknown[];
    forecastData: unknown[];
  }) => (
    <div>{`Forecast section: ${historicalData.length}/${forecastData.length}`}</div>
  ),
}));

describe('dashboard panel states', () => {
  test('PanelLoadingState, PanelErrorState, and PanelEmptyState render', () => {
    const retry = jest.fn();

    const { rerender } = render(
      <PanelLoadingState message="Loading dashboard segment..." />
    );
    expect(screen.getByText('Loading dashboard segment...')).toBeInTheDocument();

    rerender(<PanelErrorState message="Segment failed" onRetry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);

    rerender(
      <PanelEmptyState
        title="No data"
        description="This panel has no records yet."
      />
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('This panel has no records yet.')).toBeInTheDocument();
  });

  test('OverviewPanel handles loading, error, empty, and populated states', () => {
    const onRetry = jest.fn();
    const onDatasetUpload = jest.fn();
    const onDateChange = jest.fn();
    const onBreakdownOpenChange = jest.fn();

    const baseProps = {
      selectedDate: new Date('2026-02-11'),
      onDateChange,
      onDatasetUpload,
      uploadLoading: false,
      uploadError: null,
      breakdownOpen: false,
      onBreakdownOpenChange,
      onRetry,
    };

    const { rerender } = render(
      <OverviewPanel
        {...baseProps}
        data={null}
        loading={true}
        error={null}
      />
    );
    expect(screen.getByText('Loading overview metrics...')).toBeInTheDocument();

    rerender(
      <OverviewPanel
        {...baseProps}
        data={null}
        loading={false}
        error={{ code: 'UNKNOWN', message: 'Overview failed', retryable: true }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <OverviewPanel
        {...baseProps}
        data={null}
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('No overview metrics available')).toBeInTheDocument();

    rerender(
      <OverviewPanel
        {...baseProps}
        data={{
          datasetId: 'dataset-1',
          asOfDate: '2026-02-10T12:00:00Z',
          snapshotTotals: {
            total: 1200,
            undergrad: 1000,
            ftic: 400,
            transfer: 250,
            international: 144,
          },
          studentTypeDistribution: [{ type: 'FTIC', count: 400 }],
          schoolDistribution: [{ school: 'School of Business', count: 320 }],
          trendSeries: [{ period: 'Fall 2025', year: 2025, semester: 1, total: 1190 }],
          majorCount: 17,
          schoolCount: 6,
        }}
        loading={false}
        error={null}
        uploadLoading={true}
        uploadError={{
          code: 'NOT_IMPLEMENTED',
          message: 'Upload API not ready',
          retryable: true,
        }}
      />
    );

    expect(screen.getByText('Submitting dataset...')).toBeInTheDocument();
    expect(screen.getByText('Upload API not ready')).toBeInTheDocument();
    expect(screen.getByText('Trend points: 1')).toBeInTheDocument();
    expect(screen.getByText('Student type points: 1')).toBeInTheDocument();
    expect(screen.getByText('School points: 1')).toBeInTheDocument();
    expect(screen.getByText('Date: February 10, 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Total Students:/ }));
    expect(onBreakdownOpenChange).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Upload CSV' }));
    expect(onDatasetUpload).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Change Date' }));
    expect(onDateChange).toHaveBeenCalledWith(new Date('2026-02-10'));
  });

  test('MajorsPanel handles loading/error/empty and renders populated data', () => {
    const onRetry = jest.fn();

    const { rerender } = render(
      <MajorsPanel data={null} loading={true} error={null} onRetry={onRetry} />
    );
    expect(screen.getByText('Loading majors analytics...')).toBeInTheDocument();

    rerender(
      <MajorsPanel
        data={null}
        loading={false}
        error={{ code: 'UNKNOWN', message: 'Majors failed', retryable: true }}
        onRetry={onRetry}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <MajorsPanel data={null} loading={false} error={null} onRetry={onRetry} />
    );
    expect(screen.getByText('No majors analytics available')).toBeInTheDocument();

    rerender(
      <MajorsPanel
        data={{
          datasetId: 'dataset-1',
          majorDistribution: [
            { major: 'Biology', count: 150 },
            { major: 'Chemistry', count: 50 },
          ],
          cohortRecords: [
            {
              major: 'Biology',
              cohort: 'FTIC 2024',
              avgGPA: 3.2,
              avgCredits: 14,
              studentCount: 150,
            },
          ],
        }}
        loading={false}
        error={null}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('Top Major: Biology')).toBeInTheDocument();
    expect(screen.getByText('Total Programs: 2')).toBeInTheDocument();
    expect(screen.getByText('Avg per Major: 100')).toBeInTheDocument();
    expect(screen.getByText('Major points: 2')).toBeInTheDocument();
    expect(screen.getByText('Cohort rows: 1')).toBeInTheDocument();

    rerender(
      <MajorsPanel
        data={{
          datasetId: 'dataset-2',
          majorDistribution: [],
          cohortRecords: [],
        }}
        loading={false}
        error={null}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('Top Major: N/A')).toBeInTheDocument();
    expect(screen.getByText('Avg per Major: 0')).toBeInTheDocument();
  });

  test('MigrationPanel handles states and semester change callback', () => {
    const onRetry = jest.fn();
    const onSemesterChange = jest.fn();

    const { rerender } = render(
      <MigrationPanel
        data={null}
        loading={true}
        error={null}
        migrationSemester={undefined}
        onSemesterChange={onSemesterChange}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('Loading migration analytics...')).toBeInTheDocument();

    rerender(
      <MigrationPanel
        data={null}
        loading={false}
        error={{ code: 'UNKNOWN', message: 'Migration failed', retryable: true }}
        migrationSemester={undefined}
        onSemesterChange={onSemesterChange}
        onRetry={onRetry}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <MigrationPanel
        data={null}
        loading={false}
        error={null}
        migrationSemester={undefined}
        onSemesterChange={onSemesterChange}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('No migration analytics available')).toBeInTheDocument();

    rerender(
      <MigrationPanel
        data={{
          datasetId: 'dataset-1',
          semesters: ['Fall 2025'],
          records: [
            {
              fromMajor: 'Biology',
              toMajor: 'Chemistry',
              semester: 'Fall 2025',
              count: 14,
            },
          ],
        }}
        loading={false}
        error={null}
        migrationSemester="Fall 2025"
        onSemesterChange={onSemesterChange}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Semester options: 1')).toBeInTheDocument();
    expect(screen.getByText('Migration flow rows: 1')).toBeInTheDocument();
    expect(screen.getByText('Migration table rows: 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Semester options: 1' }));
    expect(onSemesterChange).toHaveBeenCalledWith('Fall 2025');
  });

  test('ForecastsPanel handles states and both growth sign branches', () => {
    const onRetry = jest.fn();

    const { rerender } = render(
      <ForecastsPanel data={null} loading={true} error={null} onRetry={onRetry} />
    );
    expect(screen.getByText('Loading forecast analytics...')).toBeInTheDocument();

    rerender(
      <ForecastsPanel
        data={null}
        loading={false}
        error={{ code: 'UNKNOWN', message: 'Forecast failed', retryable: true }}
        onRetry={onRetry}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <ForecastsPanel data={null} loading={false} error={null} onRetry={onRetry} />
    );
    expect(screen.getByText('No forecast analytics available')).toBeInTheDocument();

    rerender(
      <ForecastsPanel
        data={{
          datasetId: 'dataset-1',
          historicalSeries: [
            { period: 'Fall 2025', year: 2025, semester: 1, total: 1000 },
          ],
          forecastSeries: [
            {
              period: 'Spring 2026',
              year: 2026,
              semester: 2,
              total: 1010,
              isForecasted: true,
            },
          ],
          fiveYearGrowth: 8,
        }}
        loading={false}
        error={null}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('5-Year Growth: +8%')).toBeInTheDocument();
    expect(screen.getByText('Forecast section: 1/1')).toBeInTheDocument();

    rerender(
      <ForecastsPanel
        data={{
          datasetId: 'dataset-1',
          historicalSeries: [],
          forecastSeries: [],
          fiveYearGrowth: -3,
        }}
        loading={false}
        error={null}
        onRetry={onRetry}
      />
    );
    expect(screen.getByText('5-Year Growth: -3%')).toBeInTheDocument();
  });
});
