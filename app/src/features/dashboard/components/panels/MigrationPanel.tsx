import { MigrationFlowChart } from '@/features/metrics/components/charts/MigrationFlowChart';
import { MigrationTopFlowsTable } from '@/features/metrics/components/MigrationTopFlowsTable';
import { SemesterFilterSelect } from '@/features/filters/components/SemesterFilterSelect';
import { TabsContent } from '@/shared/ui/tabs';
import type { MigrationRecord } from '@/features/metrics/types';

interface MigrationPanelProps {
  migrationData: MigrationRecord[];
  migrationSemester?: string;
  onSemesterChange: (value: string | undefined) => void;
}

export function MigrationPanel({
  migrationData,
  migrationSemester,
  onSemesterChange,
}: MigrationPanelProps) {
  return (
    <TabsContent value="migration" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Major Migration Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Track student movement between majors by semester
          </p>
        </div>
        <SemesterFilterSelect
          value={migrationSemester}
          onValueChange={onSemesterChange}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MigrationFlowChart
            data={migrationData}
            selectedSemester={migrationSemester}
          />
        </div>
        <MigrationTopFlowsTable
          data={migrationData}
          selectedSemester={migrationSemester}
        />
      </div>
    </TabsContent>
  );
}
