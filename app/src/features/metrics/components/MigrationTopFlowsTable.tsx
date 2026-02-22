'use client';

import { memo, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  getMigrationPeriodLabel,
  getTopMigrationFlows,
} from '@/features/metrics/selectors';
import type { MigrationRecord } from '@/features/metrics/types';

interface MigrationTopFlowsTableProps {
  data: MigrationRecord[];
  selectedSemester?: string;
}

function MigrationTopFlowsTableComponent({
  data,
  selectedSemester,
}: MigrationTopFlowsTableProps) {
  const sortedMigrations = useMemo(
    () => getTopMigrationFlows(data, selectedSemester, 10),
    [data, selectedSemester]
  );
  const periodLabel = useMemo(
    () => getMigrationPeriodLabel(selectedSemester),
    [selectedSemester]
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Top Migration Paths
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Most common major changes ({periodLabel})
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedMigrations.length === 0 && (
            <p className="rounded-lg bg-secondary/30 px-3 py-6 text-sm text-muted-foreground">
              No migration paths available for this selection.
            </p>
          )}
          {sortedMigrations.map((migration, index) => (
            <div
              key={`${migration.fromMajor}-${migration.toMajor}`}
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <span className="text-foreground">{migration.fromMajor}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground">{migration.toMajor}</span>
              </div>
              <span className="text-sm font-medium text-chart-1">
                {migration.totalCount.toLocaleString()} students
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const MigrationTopFlowsTable = memo(MigrationTopFlowsTableComponent);
