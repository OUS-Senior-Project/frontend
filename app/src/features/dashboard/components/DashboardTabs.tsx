import { useCallback, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import type {
  DatasetOverviewResponse,
  ForecastsAnalyticsResponse,
  MajorsAnalyticsResponse,
  MigrationAnalyticsResponse,
  UIError,
} from '@/lib/api/types';
import { ForecastsPanel } from './panels/ForecastsPanel';
import { MajorsPanel } from './panels/MajorsPanel';
import { MigrationPanel } from './panels/MigrationPanel';
import { OverviewPanel } from './panels/OverviewPanel';

interface DashboardTabsProps {
  model: DashboardTabsModel;
}

interface DashboardTabsModel {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  handleDatasetUpload: (file: File) => void;
  uploadLoading: boolean;
  uploadError: UIError | null;
  readModelState: 'ready' | 'processing' | 'failed';
  readModelStatus: string | null;
  readModelError: UIError | null;
  readModelPollingTimedOut: boolean;
  retryReadModelState: () => void;
  breakdownOpen: boolean;
  setBreakdownOpen: (isOpen: boolean) => void;
  overviewData: DatasetOverviewResponse | null;
  overviewLoading: boolean;
  overviewError: UIError | null;
  retryOverview: () => void;
  majorsData: MajorsAnalyticsResponse | null;
  majorsLoading: boolean;
  majorsError: UIError | null;
  retryMajors: () => void;
  migrationData: MigrationAnalyticsResponse | null;
  migrationLoading: boolean;
  migrationError: UIError | null;
  migrationSemester?: string;
  setMigrationSemester: (value: string | undefined) => void;
  retryMigration: () => void;
  forecastsData: ForecastsAnalyticsResponse | null;
  forecastsLoading: boolean;
  forecastsError: UIError | null;
  forecastHorizon: number;
  setForecastHorizon: (horizon: number) => void;
  retryForecasts: () => void;
}

const DASHBOARD_TAB_VALUES = [
  'overview',
  'majors',
  'migration',
  'forecasts',
] as const;

type DashboardTabValue = (typeof DASHBOARD_TAB_VALUES)[number];

function isDashboardTabValue(value: string): value is DashboardTabValue {
  return DASHBOARD_TAB_VALUES.includes(value as DashboardTabValue);
}

export function DashboardTabs(props: DashboardTabsProps) {
  const { model } = props;
  const [activeTab, setActiveTab] = useState<DashboardTabValue>('overview');
  const onTabChange = useCallback((nextValue: string) => {
    if (isDashboardTabValue(nextValue)) {
      setActiveTab(nextValue);
    }
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="bg-secondary">
        <TabsTrigger
          value="overview"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="majors"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Majors
        </TabsTrigger>
        <TabsTrigger
          value="migration"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Migration
        </TabsTrigger>
        <TabsTrigger
          value="forecasts"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Forecasts
        </TabsTrigger>
      </TabsList>

      {activeTab === 'overview' && (
        <OverviewPanel
          selectedDate={model.selectedDate}
          onDateChange={model.setSelectedDate}
          onDatasetUpload={model.handleDatasetUpload}
          uploadLoading={model.uploadLoading}
          uploadError={model.uploadError}
          breakdownOpen={model.breakdownOpen}
          onBreakdownOpenChange={model.setBreakdownOpen}
          data={model.overviewData}
          loading={model.overviewLoading}
          error={model.overviewError}
          onRetry={model.retryOverview}
          readModelState={model.readModelState}
          readModelStatus={model.readModelStatus}
          readModelError={model.readModelError}
          readModelPollingTimedOut={model.readModelPollingTimedOut}
          onReadModelRetry={model.retryReadModelState}
        />
      )}
      {activeTab === 'majors' && (
        <MajorsPanel
          data={model.majorsData}
          loading={model.majorsLoading}
          error={model.majorsError}
          onRetry={model.retryMajors}
          readModelState={model.readModelState}
          readModelStatus={model.readModelStatus}
          readModelError={model.readModelError}
          readModelPollingTimedOut={model.readModelPollingTimedOut}
          onReadModelRetry={model.retryReadModelState}
        />
      )}
      {activeTab === 'migration' && (
        <MigrationPanel
          data={model.migrationData}
          loading={model.migrationLoading}
          error={model.migrationError}
          migrationSemester={model.migrationSemester}
          onSemesterChange={model.setMigrationSemester}
          onRetry={model.retryMigration}
          readModelState={model.readModelState}
          readModelStatus={model.readModelStatus}
          readModelError={model.readModelError}
          readModelPollingTimedOut={model.readModelPollingTimedOut}
          onReadModelRetry={model.retryReadModelState}
        />
      )}
      {activeTab === 'forecasts' && (
        <ForecastsPanel
          data={model.forecastsData}
          loading={model.forecastsLoading}
          error={model.forecastsError}
          horizon={model.forecastHorizon}
          onHorizonChange={model.setForecastHorizon}
          onRetry={model.retryForecasts}
          readModelState={model.readModelState}
          readModelStatus={model.readModelStatus}
          readModelError={model.readModelError}
          readModelPollingTimedOut={model.readModelPollingTimedOut}
          onReadModelRetry={model.retryReadModelState}
        />
      )}
    </Tabs>
  );
}
