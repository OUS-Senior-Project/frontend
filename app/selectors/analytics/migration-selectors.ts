import type { MigrationRecord } from '@/types/analytics';

export interface AggregatedMigration {
  fromMajor: string;
  toMajor: string;
  totalCount: number;
}

function filterBySemester(data: MigrationRecord[], selectedSemester?: string) {
  return selectedSemester
    ? data.filter((record) => record.semester === selectedSemester)
    : data;
}

export function getTopMigrationFlows(
  data: MigrationRecord[],
  selectedSemester: string | undefined,
  limit: number
): AggregatedMigration[] {
  const aggregated = filterBySemester(data, selectedSemester).reduce<
    Record<string, AggregatedMigration>
  >((acc, current) => {
    const key = `${current.fromMajor}-${current.toMajor}`;
    if (!acc[key]) {
      acc[key] = {
        fromMajor: current.fromMajor,
        toMajor: current.toMajor,
        totalCount: 0,
      };
    }

    acc[key].totalCount += current.count;
    return acc;
  }, {});

  return Object.values(aggregated)
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, limit);
}

export function getMigrationPeriodLabel(selectedSemester?: string) {
  return selectedSemester || 'All Semesters';
}
