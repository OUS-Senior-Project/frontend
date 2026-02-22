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
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDatasetUpload: (file: File) => void;
  uploadLoading: boolean;
  uploadError: UIError | null;
  readModelState: 'ready' | 'processing' | 'failed';
  readModelStatus: string | null;
  readModelError: UIError | null;
  readModelPollingTimedOut: boolean;
  onReadModelRetry: () => void;
  breakdownOpen: boolean;
  onBreakdownOpenChange: (isOpen: boolean) => void;
  overviewData: DatasetOverviewResponse | null;
  overviewLoading: boolean;
  overviewError: UIError | null;
  onOverviewRetry: () => void;
  majorsData: MajorsAnalyticsResponse | null;
  majorsLoading: boolean;
  majorsError: UIError | null;
  onMajorsRetry: () => void;
  migrationData: MigrationAnalyticsResponse | null;
  migrationLoading: boolean;
  migrationError: UIError | null;
  migrationSemester?: string;
  onMigrationSemesterChange: (value: string | undefined) => void;
  onMigrationRetry: () => void;
  forecastsData: ForecastsAnalyticsResponse | null;
  forecastsLoading: boolean;
  forecastsError: UIError | null;
  forecastHorizon: number;
  onForecastHorizonChange: (horizon: number) => void;
  onForecastsRetry: () => void;
}

export function DashboardTabs(props: DashboardTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
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

      <OverviewPanel
        selectedDate={props.selectedDate}
        onDateChange={props.onDateChange}
        onDatasetUpload={props.onDatasetUpload}
        uploadLoading={props.uploadLoading}
        uploadError={props.uploadError}
        breakdownOpen={props.breakdownOpen}
        onBreakdownOpenChange={props.onBreakdownOpenChange}
        data={props.overviewData}
        loading={props.overviewLoading}
        error={props.overviewError}
        onRetry={props.onOverviewRetry}
        readModelState={props.readModelState}
        readModelStatus={props.readModelStatus}
        readModelError={props.readModelError}
        readModelPollingTimedOut={props.readModelPollingTimedOut}
        onReadModelRetry={props.onReadModelRetry}
      />
      <MajorsPanel
        data={props.majorsData}
        loading={props.majorsLoading}
        error={props.majorsError}
        onRetry={props.onMajorsRetry}
        readModelState={props.readModelState}
        readModelStatus={props.readModelStatus}
        readModelError={props.readModelError}
        readModelPollingTimedOut={props.readModelPollingTimedOut}
        onReadModelRetry={props.onReadModelRetry}
      />
      <MigrationPanel
        data={props.migrationData}
        loading={props.migrationLoading}
        error={props.migrationError}
        migrationSemester={props.migrationSemester}
        onSemesterChange={props.onMigrationSemesterChange}
        onRetry={props.onMigrationRetry}
        readModelState={props.readModelState}
        readModelStatus={props.readModelStatus}
        readModelError={props.readModelError}
        readModelPollingTimedOut={props.readModelPollingTimedOut}
        onReadModelRetry={props.onReadModelRetry}
      />
      <ForecastsPanel
        data={props.forecastsData}
        loading={props.forecastsLoading}
        error={props.forecastsError}
        horizon={props.forecastHorizon}
        onHorizonChange={props.onForecastHorizonChange}
        onRetry={props.onForecastsRetry}
        readModelState={props.readModelState}
        readModelStatus={props.readModelStatus}
        readModelError={props.readModelError}
        readModelPollingTimedOut={props.readModelPollingTimedOut}
        onReadModelRetry={props.onReadModelRetry}
      />
    </Tabs>
  );
}
