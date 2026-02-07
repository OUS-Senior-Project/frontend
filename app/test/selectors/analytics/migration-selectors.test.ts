import {
  getMigrationPeriodLabel,
  getTopMigrationFlows,
} from '@/features/metrics/selectors/migration-selectors';
import type { MigrationRecord } from '@/features/metrics/types';

const records: MigrationRecord[] = [
  {
    fromMajor: 'Biology',
    toMajor: 'Chemistry',
    semester: 'Fall 2023',
    count: 10,
  },
  {
    fromMajor: 'Biology',
    toMajor: 'Chemistry',
    semester: 'Fall 2023',
    count: 5,
  },
  { fromMajor: 'Math', toMajor: 'Biology', semester: 'Fall 2023', count: 7 },
  { fromMajor: 'Math', toMajor: 'Physics', semester: 'Spring 2024', count: 8 },
];

describe('migration selectors', () => {
  test('aggregates and sorts top flows for selected semester', () => {
    const flows = getTopMigrationFlows(records, 'Fall 2023', 10);
    expect(flows[0]).toEqual({
      fromMajor: 'Biology',
      toMajor: 'Chemistry',
      totalCount: 15,
    });
    expect(flows).toHaveLength(2);
  });

  test('uses all semesters when no semester is selected', () => {
    const flows = getTopMigrationFlows(records, undefined, 10);
    expect(flows).toHaveLength(3);
    expect(getMigrationPeriodLabel(undefined)).toBe('All Semesters');
    expect(getMigrationPeriodLabel('Fall 2023')).toBe('Fall 2023');
  });
});
