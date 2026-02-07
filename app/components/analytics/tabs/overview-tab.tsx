import type { ChangeEvent } from 'react';
import { Building, GraduationCap, Upload, Users } from 'lucide-react';
import { AnalyticsBreakdownModal } from '@/components/analytics/analytics-breakdown-modal';
import { AnalyticsTrendChart } from '@/components/analytics/analytics-trend-chart';
import { DatePickerButton } from '@/components/analytics/date-picker-button';
import { SchoolBreakdownChart } from '@/components/analytics/school-breakdown-chart';
import { StatCard } from '@/components/analytics/stat-card';
import { StudentTypeChart } from '@/components/analytics/student-type-chart';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import type { SnapshotTotals } from '@/types/analytics';

interface OverviewTabProps {
  dateLabel: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onUploadChange: (event: ChangeEvent<HTMLInputElement>) => void;
  breakdownOpen: boolean;
  onBreakdownOpenChange: (isOpen: boolean) => void;
  snapshotTotals: SnapshotTotals;
  totalMajors: number;
  totalSchools: number;
  trendData: Array<{ period: string; total: number }>;
  studentTypeData: Array<{ type: string; count: number }>;
  schoolData: Array<{ school: string; count: number }>;
}

export function OverviewTab({
  dateLabel,
  selectedDate,
  onDateChange,
  onUploadChange,
  breakdownOpen,
  onBreakdownOpenChange,
  snapshotTotals,
  totalMajors,
  totalSchools,
  trendData,
  studentTypeData,
  schoolData,
}: OverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <p className="text-sm text-muted-foreground">Date: {dateLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="csv-upload">
            <Button
              variant="outline"
              className="cursor-pointer bg-transparent"
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </span>
            </Button>
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={onUploadChange}
            className="sr-only"
          />
          <DatePickerButton date={selectedDate} onDateChange={onDateChange} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value={snapshotTotals.total}
          icon={Users}
          description="Current data date"
          onClick={() => onBreakdownOpenChange(true)}
        />
        <StatCard
          title="Active Majors"
          value={totalMajors}
          icon={GraduationCap}
          description="Across all schools"
        />
        <StatCard
          title="Schools/Colleges"
          value={totalSchools}
          icon={Building}
          description="Academic units"
        />
      </div>

      <AnalyticsBreakdownModal
        open={breakdownOpen}
        onOpenChange={onBreakdownOpenChange}
        data={snapshotTotals}
        dateLabel={dateLabel}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsTrendChart data={trendData} />
        <StudentTypeChart data={studentTypeData} />
      </div>
      <SchoolBreakdownChart data={schoolData} />
    </TabsContent>
  );
}
