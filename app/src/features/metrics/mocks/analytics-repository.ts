import {
  generateAnalyticsDataFixture,
  generateMajorCohortDataFixture,
  generateMigrationDataFixture,
} from '@/features/metrics/mocks/fixtures';
import type {
  AnalyticsRecord,
  MajorCohortRecord,
  MigrationRecord,
} from '@/features/metrics/types';

export interface AnalyticsRepository {
  getAnalyticsRecords: () => AnalyticsRecord[];
  getMigrationRecords: () => MigrationRecord[];
  getMajorCohortRecords: () => MajorCohortRecord[];
}

const fixtureData = {
  analytics: generateAnalyticsDataFixture(),
  migration: generateMigrationDataFixture(),
  cohorts: generateMajorCohortDataFixture(),
};

const fixtureAnalyticsRepository: AnalyticsRepository = {
  getAnalyticsRecords: () => fixtureData.analytics,
  getMigrationRecords: () => fixtureData.migration,
  getMajorCohortRecords: () => fixtureData.cohorts,
};

export function getMockAnalyticsRepository(): AnalyticsRepository {
  return fixtureAnalyticsRepository;
}
