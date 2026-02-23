'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  getMigrationPeriodLabel,
  getTopMigrationFlows,
} from '@/features/metrics/selectors';
import type { MigrationRecord } from '@/features/metrics/types';
import { MigrationFlowBars } from './MigrationFlowBars';
import { MigrationFlowEmptyState } from './MigrationFlowEmptyState';

interface MigrationFlowChartProps {
  data: MigrationRecord[];
  selectedSemester?: string;
}

function MigrationFlowChartComponent({
  data,
  selectedSemester,
}: MigrationFlowChartProps) {
  const sortedMigrations = useMemo(
    () => getTopMigrationFlows(data, selectedSemester, 12),
    [data, selectedSemester]
  );
  const periodLabel = useMemo(
    () => getMigrationPeriodLabel(selectedSemester),
    [selectedSemester]
  );

  if (sortedMigrations.length === 0) {
    return <MigrationFlowEmptyState />;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Major Migration Flow
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Top student movements between majors ({periodLabel})
        </p>
      </CardHeader>
      <CardContent>
        <MigrationFlowBars flows={sortedMigrations} />
        <div className="mt-6 rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Key Insight:</span>{' '}
            The largest migration flow is from{' '}
            <span className="text-chart-1">
              {sortedMigrations[0]?.fromMajor}
            </span>{' '}
            to{' '}
            <span className="text-chart-2">{sortedMigrations[0]?.toMajor}</span>{' '}
            with {sortedMigrations[0]?.totalCount.toLocaleString()} total
            students over the selected semester.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const MigrationFlowChart = memo(MigrationFlowChartComponent);
