'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table } from '@/shared/ui/table';
import type { MajorCohortRecord } from '@/features/metrics/types';
import { CohortTableHeader } from './cohort-summary/cohort-table-header';
import { CohortTableRows } from './cohort-summary/cohort-table-rows';
import { CohortTabs } from './cohort-summary/cohort-tabs';
import { useCohortSummaryTable } from './cohort-summary/use-cohort-summary-table';

interface CohortSummaryTableProps {
  data: MajorCohortRecord[];
}

export function CohortSummaryTable({ data }: CohortSummaryTableProps) {
  const {
    cohorts,
    selectedCohort,
    setSelectedCohort,
    filteredData,
    totalStudents,
    handleSort,
  } = useCohortSummaryTable(data);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium text-foreground">
          Major Level Summary by FTIC Cohort
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          GPA, credits, and student counts by major for each FTIC cohort
        </p>
        <CohortTabs
          cohorts={cohorts}
          selectedCohort={selectedCohort}
          onSelect={setSelectedCohort}
        />
      </CardHeader>

      <CardContent>
        <Table>
          <CohortTableHeader onSort={handleSort} />
          <CohortTableRows rows={filteredData} totalStudents={totalStudents} />
        </Table>
      </CardContent>
    </Card>
  );
}
