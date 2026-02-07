import { Building, GraduationCap, Users } from 'lucide-react';
import { CohortSummaryTable } from '@/components/analytics/cohort-summary-table';
import { MajorBreakdownChart } from '@/components/analytics/major-breakdown-chart';
import {
  AvgCreditsByCohortChart,
  AvgCreditsByMajorChart,
  AvgGPAByCohortChart,
  AvgGPAByMajorChart,
} from '@/components/analytics/major-analytics-charts';
import { StatCard } from '@/components/analytics/stat-card';
import { TabsContent } from '@/components/ui/tabs';
import { getTopMajorLabel } from '@/lib/analytics-utils';
import type { MajorCohortRecord } from '@/types/analytics';

interface MajorsTabProps {
  majorData: Array<{ major: string; count: number }>;
  totalMajors: number;
  cohortData: MajorCohortRecord[];
}

export function MajorsTab({
  majorData,
  totalMajors,
  cohortData,
}: MajorsTabProps) {
  const averagePerMajor = Math.round(
    majorData.reduce((sum, major) => sum + major.count, 0) / majorData.length
  );

  return (
    <TabsContent value="majors" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Majors</h2>
        <p className="text-sm text-muted-foreground">
          Major-level analytics and cohort breakdowns
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Top Major"
          value={getTopMajorLabel(majorData)}
          icon={GraduationCap}
          description={`${majorData[0]?.count.toLocaleString()} students`}
        />
        <StatCard
          title="Total Programs"
          value={totalMajors}
          icon={Building}
          description="Active majors"
        />
        <StatCard
          title="Avg per Major"
          value={averagePerMajor}
          icon={Users}
          description="Students per major"
        />
      </div>
      <MajorBreakdownChart data={majorData} title="Top Majors Overview" />
      <div className="grid gap-6 lg:grid-cols-2">
        <AvgGPAByMajorChart data={cohortData} />
        <AvgCreditsByMajorChart data={cohortData} />
      </div>
      <AvgGPAByCohortChart data={cohortData} />
      <AvgCreditsByCohortChart data={cohortData} />
      <CohortSummaryTable data={cohortData} />
    </TabsContent>
  );
}
