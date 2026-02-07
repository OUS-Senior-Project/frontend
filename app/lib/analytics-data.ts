export type {
  AnalyticsRecord,
  MajorCohortRecord,
  MigrationRecord,
} from '@/types/analytics';

export {
  cohorts,
  majorToSchool,
  majors,
  schools,
  semesters,
  studentTypes,
} from '@/fixtures/analytics';

export {
  generateAnalyticsDataFixture as generateAnalyticsData,
  generateMajorCohortDataFixture as generateMajorCohortData,
  generateMigrationDataFixture as generateMigrationData,
} from '@/fixtures/analytics';

export {
  generateForecastData,
  getAnalyticsByMajor,
  getAnalyticsBySchool,
  getAnalyticsByStudentType,
  getDailySnapshot,
  getSnapshotTotals,
  getTrendData,
  getYearlyAnalytics,
} from '@/selectors/analytics';
