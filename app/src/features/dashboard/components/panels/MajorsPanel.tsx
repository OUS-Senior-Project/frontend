import { Building, GraduationCap, Users } from 'lucide-react';
import { CohortSummaryTable } from '@/features/metrics/components/CohortSummaryTable';
import { MajorDistributionChart } from '@/features/metrics/components/charts/MajorDistributionChart';
import {
  AvgCreditsByCohortChart,
  AvgCreditsByMajorChart,
  AvgGPAByCohortChart,
  AvgGPAByMajorChart,
} from '@/features/metrics/components/major-analytics-charts';
import { MetricsSummaryCard } from '@/features/metrics/components/MetricsSummaryCard';
import type { MajorsAnalyticsResponse, UIError } from '@/lib/api/types';
import { TabsContent } from '@/shared/ui/tabs';
import { selectTopMajorLabel } from '@/features/metrics/utils/metrics-summary-utils';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelLoadingState,
} from './PanelStates';

interface MajorsPanelProps {
  data: MajorsAnalyticsResponse | null;
  loading: boolean;
  error: UIError | null;
  onRetry: () => void;
}

export function MajorsPanel({ data, loading, error, onRetry }: MajorsPanelProps) {
  const majorData = data?.majorDistribution ?? [];
  const cohortData = data?.cohortRecords ?? [];
  const totalMajors = majorData.length;
  const averagePerMajor = Math.round(
    totalMajors === 0
      ? 0
      : majorData.reduce((sum, major) => sum + major.count, 0) / totalMajors
  );

  return (
    <TabsContent value="majors" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Majors</h2>
        <p className="text-sm text-muted-foreground">
          Major-level analytics and cohort breakdowns
        </p>
      </div>
      {loading && <PanelLoadingState message="Loading majors analytics..." />}
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
          title="No majors analytics available"
          description="Majors metrics will appear here after dataset processing."
        />
      )}
      {!loading && !error && data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricsSummaryCard
              title="Top Major"
              value={selectTopMajorLabel(majorData)}
              icon={GraduationCap}
              description={`${(majorData[0]?.count ?? 0).toLocaleString()} students`}
            />
            <MetricsSummaryCard
              title="Total Programs"
              value={totalMajors}
              icon={Building}
              description="Active majors"
            />
            <MetricsSummaryCard
              title="Avg per Major"
              value={averagePerMajor}
              icon={Users}
              description="Students per major"
            />
          </div>
          <MajorDistributionChart data={majorData} title="Top Majors Overview" />
          <div className="grid gap-6 lg:grid-cols-2">
            <AvgGPAByMajorChart data={cohortData} />
            <AvgCreditsByMajorChart data={cohortData} />
          </div>
          <AvgGPAByCohortChart data={cohortData} />
          <AvgCreditsByCohortChart data={cohortData} />
          <CohortSummaryTable data={cohortData} />
        </>
      )}
    </TabsContent>
  );
}
