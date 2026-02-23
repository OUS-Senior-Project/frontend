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
      setSelectedDate: jest.fn(),
      handleDatasetUpload: jest.fn(),
      uploadLoading: false,
      uploadError: null,
      readModelState: 'ready',
      readModelStatus: null,
      readModelError: null,
      readModelPollingTimedOut: false,
      retryReadModelState: jest.fn(),
      breakdownOpen: false,
      setBreakdownOpen: jest.fn(),
      overviewData: null,
      overviewLoading: true,
      overviewError: null,
      retryOverview: jest.fn(),
      majorsData: null,
      majorsLoading: false,
      majorsError: { code: 'UNKNOWN', message: 'majors err', retryable: true },
      retryMajors: jest.fn(),
      migrationData: null,
      migrationLoading: false,
      migrationError: null,
      migrationSemester: 'Fall 2025',
      setMigrationSemester: jest.fn(),
      retryMigration: jest.fn(),
      forecastsData: null,
      forecastsLoading: false,
      forecastsError: null,
      forecastHorizon: 4,
      setForecastHorizon: jest.fn(),
      retryForecasts: jest.fn(),
    } as const;

    render(<DashboardTabs model={props} />);

    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Majors' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Migration' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Forecasts' })).toBeInTheDocument();

    expect(overviewPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedDate: props.selectedDate,
        onDateChange: props.setSelectedDate,
        onDatasetUpload: props.handleDatasetUpload,
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
        onSemesterChange: props.setMigrationSemester,
      })
    );

    await user.click(screen.getByRole('tab', { name: 'Forecasts' }));
    expect(forecastsPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: props.forecastsData,
        loading: props.forecastsLoading,
        error: props.forecastsError,
        onReadModelRetry: props.retryReadModelState,
      })
    );
  });
});
