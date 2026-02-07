'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import type { MigrationRecord } from '@/lib/enrollment-data';

interface MigrationTableProps {
  data: MigrationRecord[];
  selectedSemester?: string;
}

export function MigrationTable({
  data,
  selectedSemester,
}: MigrationTableProps) {
  const filteredData = selectedSemester
    ? data.filter((d) => d.semester === selectedSemester)
    : data;

  const aggregated = filteredData.reduce(
    (acc, curr) => {
      const key = `${curr.fromMajor}-${curr.toMajor}`;
      if (!acc[key]) {
        acc[key] = {
          fromMajor: curr.fromMajor,
          toMajor: curr.toMajor,
          totalCount: 0,
        };
      }
      acc[key].totalCount += curr.count;
      return acc;
    },
    {} as Record<
      string,
      { fromMajor: string; toMajor: string; totalCount: number }
    >
  );

  const sortedMigrations = Object.values(aggregated)
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 10);

  const periodLabel = selectedSemester || 'All Semesters';

  return (
    <Card className="bg-card border-border">
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
