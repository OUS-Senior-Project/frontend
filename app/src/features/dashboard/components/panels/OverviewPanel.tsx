import type { ChangeEvent } from 'react';
import { Building, GraduationCap, Users } from 'lucide-react';
import { AnalyticsBreakdownModal } from '@/features/metrics/components/AnalyticsBreakdownModal';
import { MetricsTrendChart } from '@/features/metrics/components/charts/MetricsTrendChart';
import { DateFilterButton } from '@/features/filters/components/DateFilterButton';
import { SchoolDistributionChart } from '@/features/metrics/components/charts/SchoolDistributionChart';
import { MetricsSummaryCard } from '@/features/metrics/components/MetricsSummaryCard';
import { StudentTypeDistributionChart } from '@/features/metrics/components/charts/StudentTypeDistributionChart';
import { UploadDatasetButton } from '@/features/upload/components/UploadDatasetButton';
import { TabsContent } from '@/shared/ui/tabs';
import type { SnapshotTotals } from '@/features/metrics/types';

interface OverviewPanelProps {
  dateLabel: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDatasetUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  breakdownOpen: boolean;
  onBreakdownOpenChange: (isOpen: boolean) => void;
  snapshotTotals: SnapshotTotals;
  totalMajors: number;
  totalSchools: number;
  trendData: Array<{ period: string; total: number }>;
  studentTypeData: Array<{ type: string; count: number }>;
  schoolData: Array<{ school: string; count: number }>;
}

export function OverviewPanel({
  dateLabel,
  selectedDate,
  onDateChange,
  onDatasetUpload,
  breakdownOpen,
  onBreakdownOpenChange,
  snapshotTotals,
  totalMajors,
  totalSchools,
  trendData,
  studentTypeData,
  schoolData,
}: OverviewPanelProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <p className="text-sm text-muted-foreground">Date: {dateLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <UploadDatasetButton onDatasetUpload={onDatasetUpload} />
          <DateFilterButton date={selectedDate} onDateChange={onDateChange} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricsSummaryCard
          title="Total Students"
          value={snapshotTotals.total}
          icon={Users}
          description="Current data date"
          onClick={() => onBreakdownOpenChange(true)}
        />
        <MetricsSummaryCard
          title="Active Majors"
          value={totalMajors}
          icon={GraduationCap}
          description="Across all schools"
        />
        <MetricsSummaryCard
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
        <MetricsTrendChart data={trendData} />
        <StudentTypeDistributionChart data={studentTypeData} />
      </div>
      <SchoolDistributionChart data={schoolData} />
    </TabsContent>
  );
}
