import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardTabs } from '@/features/dashboard/components/DashboardTabs';

const overviewPanelMock = jest.fn(() => <div>Overview Panel Mock</div>);
const majorsPanelMock = jest.fn(() => <div>Majors Panel Mock</div>);
const migrationPanelMock = jest.fn(() => <div>Migration Panel Mock</div>);
const forecastsPanelMock = jest.fn(() => <div>Forecasts Panel Mock</div>);

jest.mock('@/features/dashboard/components/panels/OverviewPanel', () => ({
  OverviewPanel: (props: unknown) => overviewPanelMock(props),
}));

jest.mock('@/features/dashboard/components/panels/MajorsPanel', () => ({
  MajorsPanel: (props: unknown) => majorsPanelMock(props),
}));

jest.mock('@/features/dashboard/components/panels/MigrationPanel', () => ({
  MigrationPanel: (props: unknown) => migrationPanelMock(props),
}));

jest.mock('@/features/dashboard/components/panels/ForecastsPanel', () => ({
  ForecastsPanel: (props: unknown) => forecastsPanelMock(props),
}));

describe('DashboardTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders tab triggers and only mounts the active panel', async () => {
    const props = {
      selectedDate: new Date('2026-02-11'),
      onDateChange: jest.fn(),
      onDatasetUpload: jest.fn(),
      uploadLoading: false,
      uploadError: null,
      readModelState: 'ready',
      readModelStatus: null,
      readModelError: null,
      readModelPollingTimedOut: false,
      onReadModelRetry: jest.fn(),
      breakdownOpen: false,
      onBreakdownOpenChange: jest.fn(),
      overviewData: null,
      overviewLoading: true,
      overviewError: null,
      onOverviewRetry: jest.fn(),
      majorsData: null,
      majorsLoading: false,
      majorsError: { code: 'UNKNOWN', message: 'majors err', retryable: true },
      onMajorsRetry: jest.fn(),
      migrationData: null,
      migrationLoading: false,
      migrationError: null,
      migrationSemester: 'Fall 2025',
      onMigrationSemesterChange: jest.fn(),
      onMigrationRetry: jest.fn(),
      forecastsData: null,
      forecastsLoading: false,
      forecastsError: null,
      forecastHorizon: 4,
      onForecastHorizonChange: jest.fn(),
      onForecastsRetry: jest.fn(),
    } as const;

    render(<DashboardTabs {...props} />);

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Majors' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Migration' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Forecasts' })).toBeInTheDocument();

    expect(overviewPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedDate: props.selectedDate,
        onDateChange: props.onDateChange,
        onDatasetUpload: props.onDatasetUpload,
        uploadLoading: props.uploadLoading,
        data: props.overviewData,
        readModelState: props.readModelState,
        readModelPollingTimedOut: props.readModelPollingTimedOut,
      })
    );
    expect(majorsPanelMock).not.toHaveBeenCalled();
    expect(migrationPanelMock).not.toHaveBeenCalled();
    expect(forecastsPanelMock).not.toHaveBeenCalled();

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Majors' }));

    expect(majorsPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: props.majorsData,
        loading: props.majorsLoading,
        error: props.majorsError,
        readModelStatus: props.readModelStatus,
      })
    );
    expect(overviewPanelMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('tab', { name: 'Migration' }));
    expect(migrationPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: props.migrationData,
        migrationSemester: props.migrationSemester,
        onSemesterChange: props.onMigrationSemesterChange,
      })
    );

    await user.click(screen.getByRole('tab', { name: 'Forecasts' }));
    expect(forecastsPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: props.forecastsData,
        loading: props.forecastsLoading,
        error: props.forecastsError,
        onReadModelRetry: props.onReadModelRetry,
      })
    );
  });
});
