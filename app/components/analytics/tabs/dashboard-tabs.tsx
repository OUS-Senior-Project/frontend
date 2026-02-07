import type { ChangeEvent } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  MajorCohortRecord,
  MigrationRecord,
  SnapshotTotals,
} from '@/types/analytics';
import { ForecastsTab } from './forecasts-tab';
import { MajorsTab } from './majors-tab';
import { MigrationTab } from './migration-tab';
import { OverviewTab } from './overview-tab';

interface DashboardTabsProps {
  dateLabel: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onUploadChange: (event: ChangeEvent<HTMLInputElement>) => void;
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

      <OverviewTab
        dateLabel={props.dateLabel}
        selectedDate={props.selectedDate}
        onDateChange={props.onDateChange}
        onUploadChange={props.onUploadChange}
        breakdownOpen={props.breakdownOpen}
        onBreakdownOpenChange={props.onBreakdownOpenChange}
        snapshotTotals={props.snapshotTotals}
        totalMajors={props.majorData.length}
        totalSchools={props.schoolData.length}
        trendData={props.trendData}
        studentTypeData={props.snapshotStudentTypes}
        schoolData={props.snapshotSchools}
      />
      <MajorsTab
        majorData={props.majorData}
        totalMajors={props.majorData.length}
        cohortData={props.cohortData}
      />
      <MigrationTab
        migrationData={props.migrationData}
        migrationSemester={props.migrationSemester}
        onSemesterChange={props.onMigrationSemesterChange}
      />
      <ForecastsTab
        fiveYearGrowth={props.fiveYearGrowth}
        trendData={props.trendData}
        forecastData={props.forecastData}
      />
    </Tabs>
  );
}
