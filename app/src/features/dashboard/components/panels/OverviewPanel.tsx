import { Building, GraduationCap, Users } from 'lucide-react';
import { AnalyticsBreakdownModal } from '@/features/metrics/components/AnalyticsBreakdownModal';
import { MetricsTrendChart } from '@/features/metrics/components/charts/MetricsTrendChart';
import { DateFilterButton } from '@/features/filters/components/DateFilterButton';
import { SchoolDistributionChart } from '@/features/metrics/components/charts/SchoolDistributionChart';
import { MetricsSummaryCard } from '@/features/metrics/components/MetricsSummaryCard';
import { StudentTypeDistributionChart } from '@/features/metrics/components/charts/StudentTypeDistributionChart';
import { UploadDatasetButton } from '@/features/upload/components/UploadDatasetButton';
import type { DatasetOverviewResponse, UIError } from '@/lib/api/types';
import { Spinner } from '@/shared/ui/spinner';
import { TabsContent } from '@/shared/ui/tabs';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelLoadingState,
} from './PanelStates';

interface OverviewPanelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDatasetUpload: (file: File) => void;
  uploadLoading: boolean;
  uploadError: UIError | null;
  breakdownOpen: boolean;
  onBreakdownOpenChange: (isOpen: boolean) => void;
  data: DatasetOverviewResponse | null;
  loading: boolean;
  error: UIError | null;
  onRetry: () => void;
}

export function OverviewPanel({
  selectedDate,
  onDateChange,
  onDatasetUpload,
  uploadLoading,
  uploadError,
  breakdownOpen,
  onBreakdownOpenChange,
  data,
  loading,
  error,
  onRetry,
}: OverviewPanelProps) {
  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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
      {uploadLoading && (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Submitting dataset...
        </p>
      )}
      {uploadError && (
        <p className="text-sm text-destructive">{uploadError.message}</p>
      )}

      {loading && <PanelLoadingState message="Loading overview metrics..." />}
      {!loading && error && (
        <PanelErrorState
          message={error.message}
          onRetry={() => {
            onRetry();
          }}
        />
      )}
      {!loading && !error && !data && (
        <PanelEmptyState
          title="No overview metrics available"
          description="Upload and process a dataset to populate this tab."
        />
      )}
      {!loading && !error && data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricsSummaryCard
              title="Total Students"
              value={data.snapshotTotals.total}
              icon={Users}
              description="Current data date"
              onClick={() => onBreakdownOpenChange(true)}
            />
            <MetricsSummaryCard
              title="Active Majors"
              value={data.activeMajors}
              icon={GraduationCap}
              description="Across all schools"
            />
            <MetricsSummaryCard
              title="Schools/Colleges"
              value={data.activeSchools}
              icon={Building}
              description="Academic units"
            />
          </div>

          <AnalyticsBreakdownModal
            open={breakdownOpen}
            onOpenChange={onBreakdownOpenChange}
            data={data.snapshotTotals}
            dateLabel={dateLabel}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <MetricsTrendChart data={data.trend} />
            <StudentTypeDistributionChart data={data.studentTypeDistribution} />
          </div>
          <SchoolDistributionChart data={data.schoolDistribution} />
        </>
      )}
    </TabsContent>
  );
}
