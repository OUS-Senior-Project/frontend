'use client';

import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getMigrationPeriodLabel,
  getTopMigrationFlows,
} from '@/selectors/analytics';
import type { MigrationRecord } from '@/types/analytics';

interface MigrationSankeyProps {
  data: MigrationRecord[];
  selectedSemester?: string;
}

const COLORS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
];

export function MigrationSankey({
  data,
  selectedSemester,
}: MigrationSankeyProps) {
  const sortedMigrations = getTopMigrationFlows(data, selectedSemester, 12);
  const periodLabel = getMigrationPeriodLabel(selectedSemester);

  if (sortedMigrations.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-foreground">
            Major Migration Flow
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Student movement between majors
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            No migration data available for the selected semester.
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = sortedMigrations[0]?.totalCount || 1;

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
        <div className="space-y-3">
          {sortedMigrations.map((migration, index) => (
            <div
              key={`${migration.fromMajor}-${migration.toMajor}`}
              className="group"
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="max-w-[120px] truncate font-medium">
                    {migration.fromMajor}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="max-w-[120px] truncate font-medium">
                    {migration.toMajor}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {migration.totalCount.toLocaleString()} students
                </span>
              </div>
              <div className="h-6 w-full overflow-hidden rounded-md bg-secondary">
                <div
                  className={`h-full ${COLORS[index % COLORS.length]} transition-all duration-500 ease-out group-hover:opacity-80`}
                  style={{
                    width: `${(migration.totalCount / maxCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
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
