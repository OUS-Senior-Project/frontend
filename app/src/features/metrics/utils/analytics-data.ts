export type {
  AnalyticsRecord,
  MajorCohortRecord,
  MigrationRecord,
} from '@/features/metrics/types';

export {
  cohorts,
  majorToSchool,
  majors,
  schools,
  semesters,
  studentTypes,
} from '@/features/metrics/mocks/fixtures';

export {
  generateAnalyticsDataFixture as generateAnalyticsData,
  generateMajorCohortDataFixture as generateMajorCohortData,
  generateMigrationDataFixture as generateMigrationData,
} from '@/features/metrics/mocks/fixtures';

export {
  selectForecastSeries,
  selectMajorCounts,
  selectSchoolCounts,
  selectStudentTypeCounts,
  selectSnapshotForDate,
  selectSnapshotTotals,
  selectTrendSeries,
  selectYearlyAnalytics,
} from '@/features/metrics/selectors';
