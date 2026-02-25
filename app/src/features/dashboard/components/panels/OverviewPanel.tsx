import { memo, useMemo } from 'react';
import { Building, GraduationCap, Users } from 'lucide-react';
import { AnalyticsBreakdownModal } from '@/features/metrics/components/AnalyticsBreakdownModal';
import { MetricsTrendChart } from '@/features/metrics/components/charts/MetricsTrendChart';
import { SchoolDistributionChart } from '@/features/metrics/components/charts/SchoolDistributionChart';
import { MetricsSummaryCard } from '@/features/metrics/components/MetricsSummaryCard';
import { StudentTypeDistributionChart } from '@/features/metrics/components/charts/StudentTypeDistributionChart';
import { UploadDatasetButton } from '@/features/upload/components/UploadDatasetButton';
import { formatUIErrorMessage } from '@/lib/api/errors';
import type { DatasetOverviewResponse, UIError } from '@/lib/api/types';
import { Spinner } from '@/shared/ui/spinner';
import { TabsContent } from '@/shared/ui/tabs';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelFailedState,
  PanelLoadingState,
  PanelProcessingState,
} from './PanelStates';

interface OverviewPanelProps {
  currentDataDate: string | null;
  onDatasetUpload: (file: File) => void;
  uploadLoading: boolean;
  uploadError: UIError | null;
  breakdownOpen: boolean;
  onBreakdownOpenChange: (isOpen: boolean) => void;
  data: DatasetOverviewResponse | null;
  loading: boolean;
  error: UIError | null;
  onRetry: () => void;
  readModelState: 'ready' | 'processing' | 'failed';
  readModelStatus: string | null;
  readModelError: UIError | null;
  readModelPollingTimedOut: boolean;
  onReadModelRetry: () => void;
}

function parseLocalIsoDate(value: string) {
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const day = Number(dayRaw);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  const parsed = new Date(year, monthIndex, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== monthIndex ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function OverviewPanelComponent({
  currentDataDate,
  onDatasetUpload,
  uploadLoading,
  uploadError,
  breakdownOpen,
  onBreakdownOpenChange,
  data,
  loading,
  error,
  onRetry,
  readModelState,
  readModelStatus,
  readModelError,
  readModelPollingTimedOut,
  onReadModelRetry,
}: OverviewPanelProps) {
  const dateLabel = useMemo(() => {
    const parsedCurrentDataDate = currentDataDate
      ? parseLocalIsoDate(currentDataDate)
      : null;
    if (!parsedCurrentDataDate) {
      return 'Unavailable';
    }

    return parsedCurrentDataDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [currentDataDate]);

  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <p className="text-sm text-muted-foreground">
            Current data date: {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UploadDatasetButton onDatasetUpload={onDatasetUpload} />
        </div>
      </div>
      {uploadLoading && (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Submitting dataset...
        </p>
      )}
      {uploadError && (
        <p className="text-sm text-destructive">
          {formatUIErrorMessage(uploadError)}
        </p>
      )}

      {readModelState === 'processing' && (
        <PanelProcessingState
          status={readModelStatus}
          message={
            readModelPollingTimedOut
              ? 'Dataset is still processing. Automatic status checks are paused. Use Refresh status to check again.'
              : 'Dataset processing is in progress. Overview metrics will refresh automatically when ready.'
          }
          onRefresh={() => {
            void onReadModelRetry();
          }}
        />
      )}
      {readModelState === 'failed' && (
        <PanelFailedState
          message={formatUIErrorMessage(
            readModelError,
            'Dataset processing failed. Upload a new dataset to continue.'
          )}
          onRefresh={() => {
            void onReadModelRetry();
          }}
        />
      )}
      {readModelState === 'ready' && loading && (
        <PanelLoadingState message="Loading overview metrics..." />
      )}
      {readModelState === 'ready' && !loading && error && (
        <PanelErrorState
          message={formatUIErrorMessage(error)}
          onRetry={() => {
            onRetry();
          }}
        />
      )}
      {readModelState === 'ready' && !loading && !error && !data && (
        <PanelEmptyState
          title="No overview metrics available"
          description="Upload and process a dataset to populate this tab."
        />
      )}
      {readModelState === 'ready' && !loading && !error && data && (
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

export const OverviewPanel = memo(OverviewPanelComponent);
