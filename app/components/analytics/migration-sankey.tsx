'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MigrationRecord } from '@/lib/analytics-data';
import { ArrowRight } from 'lucide-react';

interface MigrationSankeyProps {
  data: MigrationRecord[];
  selectedSemester?: string;
}

export function MigrationSankey({
  data,
  selectedSemester,
}: MigrationSankeyProps) {
  const filteredData = selectedSemester
    ? data.filter((d) => d.semester === selectedSemester)
    : data;

  const aggregatedMigrations = filteredData.reduce(
    (acc, record) => {
      const key = `${record.fromMajor}-${record.toMajor}`;
      if (!acc[key]) {
        acc[key] = { from: record.fromMajor, to: record.toMajor, count: 0 };
      }
      acc[key].count += record.count;
      return acc;
    },
    {} as Record<string, { from: string; to: string; count: number }>
  );

  const sortedMigrations = Object.values(aggregatedMigrations)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const maxCount = sortedMigrations[0]?.count || 1;

  const colors = [
    'bg-chart-1',
    'bg-chart-2',
    'bg-chart-3',
    'bg-chart-4',
    'bg-chart-5',
  ];

  const periodLabel = selectedSemester || 'All Semesters';

  if (sortedMigrations.length === 0) {
    return (
      <Card className="bg-card border-border">
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

  return (
    <Card className="bg-card border-border">
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
          {sortedMigrations.map((migration, index) => {
            const widthPercent = (migration.count / maxCount) * 100;
            const colorClass = colors[index % colors.length];

            return (
              <div key={`${migration.from}-${migration.to}`} className="group">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="max-w-[120px] truncate font-medium">
                      {migration.from}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="max-w-[120px] truncate font-medium">
                      {migration.to}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {migration.count.toLocaleString()} students
                  </span>
                </div>
                <div className="h-6 w-full overflow-hidden rounded-md bg-secondary">
                  <div
                    className={`h-full ${colorClass} transition-all duration-500 ease-out group-hover:opacity-80`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Key Insight:</span>{' '}
            The largest migration flow is from{' '}
            <span className="text-chart-1">{sortedMigrations[0]?.from}</span> to{' '}
            <span className="text-chart-2">{sortedMigrations[0]?.to}</span> with{' '}
            {sortedMigrations[0]?.count.toLocaleString()} total students over
            the selected semester.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
