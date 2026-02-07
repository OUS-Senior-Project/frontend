import type { ChangeEvent } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import type {
  MajorCohortRecord,
  MigrationRecord,
  SnapshotTotals,
} from '@/features/metrics/types';
import { ForecastsPanel } from './panels/ForecastsPanel';
import { MajorsPanel } from './panels/MajorsPanel';
import { MigrationPanel } from './panels/MigrationPanel';
import { OverviewPanel } from './panels/OverviewPanel';

interface DashboardTabsProps {
  dateLabel: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDatasetUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  breakdownOpen: boolean;
  onBreakdownOpenChange: (isOpen: boolean) => void;
  snapshotTotals: SnapshotTotals;
  snapshotStudentTypes: Array<{ type: string; count: number }>;
  snapshotSchools: Array<{ school: string; count: number }>;
  trendData: Array<{ period: string; total: number }>;
  majorData: Array<{ major: string; count: number }>;
  schoolData: Array<{ school: string; count: number }>;
  cohortData: MajorCohortRecord[];
  migrationData: MigrationRecord[];
  migrationSemester?: string;
  onMigrationSemesterChange: (value: string | undefined) => void;
  fiveYearGrowth: number;
  forecastData: Array<{
    period: string;
    total: number;
    isForecasted?: boolean;
  }>;
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
        dateLabel={props.dateLabel}
        selectedDate={props.selectedDate}
        onDateChange={props.onDateChange}
        onDatasetUpload={props.onDatasetUpload}
        breakdownOpen={props.breakdownOpen}
        onBreakdownOpenChange={props.onBreakdownOpenChange}
        snapshotTotals={props.snapshotTotals}
        totalMajors={props.majorData.length}
        totalSchools={props.schoolData.length}
        trendData={props.trendData}
        studentTypeData={props.snapshotStudentTypes}
        schoolData={props.snapshotSchools}
      />
      <MajorsPanel
        majorData={props.majorData}
        totalMajors={props.majorData.length}
        cohortData={props.cohortData}
      />
      <MigrationPanel
        migrationData={props.migrationData}
        migrationSemester={props.migrationSemester}
        onSemesterChange={props.onMigrationSemesterChange}
      />
      <ForecastsPanel
        fiveYearGrowth={props.fiveYearGrowth}
        trendData={props.trendData}
        forecastData={props.forecastData}
      />
    </Tabs>
  );
}
