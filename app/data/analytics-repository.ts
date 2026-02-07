import {
  generateAnalyticsDataFixture,
  generateMajorCohortDataFixture,
  generateMigrationDataFixture,
} from '@/fixtures/analytics';
import type {
  AnalyticsRecord,
  MajorCohortRecord,
  MigrationRecord,
} from '@/types/analytics';

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

export function getAnalyticsRepository(): AnalyticsRepository {
  return fixtureAnalyticsRepository;
}
