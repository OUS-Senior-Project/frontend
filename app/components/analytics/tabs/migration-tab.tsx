import { MigrationSankey } from '@/components/analytics/migration-sankey';
import { MigrationTable } from '@/components/analytics/migration-table';
import { SemesterDropdown } from '@/components/analytics/semester-dropdown';
import { TabsContent } from '@/components/ui/tabs';
import type { MigrationRecord } from '@/types/analytics';

interface MigrationTabProps {
  migrationData: MigrationRecord[];
  migrationSemester?: string;
  onSemesterChange: (value: string | undefined) => void;
}

export function MigrationTab({
  migrationData,
  migrationSemester,
  onSemesterChange,
}: MigrationTabProps) {
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
        <SemesterDropdown
          value={migrationSemester}
          onValueChange={onSemesterChange}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MigrationSankey
            data={migrationData}
            selectedSemester={migrationSemester}
          />
        </div>
        <MigrationTable
          data={migrationData}
          selectedSemester={migrationSemester}
        />
      </div>
    </TabsContent>
  );
}
