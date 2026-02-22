import { MigrationFlowChart } from '@/features/metrics/components/charts/MigrationFlowChart';
import { MigrationTopFlowsTable } from '@/features/metrics/components/MigrationTopFlowsTable';
import { SemesterFilterSelect } from '@/features/filters/components/SemesterFilterSelect';
import type { MigrationAnalyticsResponse, UIError } from '@/lib/api/types';
import { TabsContent } from '@/shared/ui/tabs';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelFailedState,
  PanelLoadingState,
  PanelProcessingState,
} from './PanelStates';

interface MigrationPanelProps {
  data: MigrationAnalyticsResponse | null;
  loading: boolean;
  error: UIError | null;
  migrationSemester?: string;
  onSemesterChange: (value: string | undefined) => void;
  onRetry: () => void;
  readModelState: 'ready' | 'processing' | 'failed';
  readModelStatus: string | null;
  readModelError: UIError | null;
  readModelPollingTimedOut: boolean;
  onReadModelRetry: () => void;
}

export function MigrationPanel({
  data,
  loading,
  error,
  migrationSemester,
  onSemesterChange,
  onRetry,
  readModelState,
  readModelStatus,
  readModelError,
  readModelPollingTimedOut,
  onReadModelRetry,
}: MigrationPanelProps) {
  const semesterOptions = data?.semesters ?? [];
  const migrationData = data?.records ?? [];
  const hasMigrationRecords = migrationData.length > 0;

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
          options={semesterOptions}
        />
      </div>
      {readModelState === 'processing' && (
        <PanelProcessingState
          status={readModelStatus}
          message={
            readModelPollingTimedOut
              ? 'Dataset is still processing. Automatic status checks are paused. Use Refresh status to check again.'
              : 'Dataset processing is in progress. Migration analytics will refresh automatically when ready.'
          }
          onRefresh={() => {
            void onReadModelRetry();
          }}
        />
      )}
      {readModelState === 'failed' && (
        <PanelFailedState
          message={
            readModelError?.message ??
            'Dataset processing failed. Upload a new dataset to continue.'
          }
          onRefresh={() => {
            void onReadModelRetry();
          }}
        />
      )}
      {readModelState === 'ready' && loading && (
        <PanelLoadingState message="Loading migration analytics..." />
      )}
      {readModelState === 'ready' && !loading && error && (
        <PanelErrorState
          message={error.message}
          onRetry={() => {
            onRetry();
          }}
        />
      )}
      {readModelState === 'ready' && !loading && !error && !data && (
        <PanelEmptyState
          title="No migration analytics available"
          description="Migration flows will appear here once records are available."
        />
      )}
      {readModelState === 'ready' &&
        !loading &&
        !error &&
        data &&
        !hasMigrationRecords && (
          <PanelEmptyState
            title="No migration detected for selected period"
            description="No major transitions were reported for the current migration selection."
          />
        )}
      {readModelState === 'ready' &&
        !loading &&
        !error &&
        data &&
        hasMigrationRecords && (
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
        )}
    </TabsContent>
  );
}
