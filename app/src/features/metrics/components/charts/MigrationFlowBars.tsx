import { ArrowRight } from 'lucide-react';
import type { AggregatedMigration } from '@/features/metrics/selectors/migration-selectors';

interface MigrationFlowBarsProps {
  flows: AggregatedMigration[];
}

const BAR_COLORS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

export function MigrationFlowBars({ flows }: MigrationFlowBarsProps) {
  const maxCount = flows[0]?.totalCount || 1;

  return (
    <div className="space-y-3">
      {flows.map((migration, index) => (
        <div key={`${migration.fromMajor}-${migration.toMajor}`} className="group">
          <div className="mb-1 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <span className="max-w-[120px] truncate font-medium">{migration.fromMajor}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="max-w-[120px] truncate font-medium">{migration.toMajor}</span>
            </div>
            <span className="text-muted-foreground">{migration.totalCount.toLocaleString()} students</span>
          </div>
          <div className="h-6 w-full overflow-hidden rounded-md bg-secondary">
            <div
              className={`h-full ${BAR_COLORS[index % BAR_COLORS.length]} transition-all duration-500 ease-out group-hover:opacity-80`}
              style={{ width: `${(migration.totalCount / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
