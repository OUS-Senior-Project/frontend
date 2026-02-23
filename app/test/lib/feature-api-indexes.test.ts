import {
  getActiveDataset,
  getDatasetById,
} from '@/features/datasets/api';
import {
  getActiveDataset as getActiveDatasetService,
  getDatasetById as getDatasetByIdService,
} from '@/features/datasets/api/datasetsService';
import { getForecastsAnalytics } from '@/features/forecasts/api';
import { getForecastsAnalytics as getForecastsAnalyticsService } from '@/features/forecasts/api/forecastsService';
import { getMajorsAnalytics } from '@/features/majors/api';
import { getMajorsAnalytics as getMajorsAnalyticsService } from '@/features/majors/api/majorsService';
import { getMigrationAnalytics } from '@/features/migration/api';
import { getMigrationAnalytics as getMigrationAnalyticsService } from '@/features/migration/api/migrationService';
import { getDatasetOverview } from '@/features/overview/api';
import { getDatasetOverview as getDatasetOverviewService } from '@/features/overview/api/overviewService';
import {
  createDatasetSubmission,
  getDatasetSubmissionStatus,
} from '@/features/submissions/api';
import {
  createDatasetSubmission as createDatasetSubmissionService,
  getDatasetSubmissionStatus as getDatasetSubmissionStatusService,
} from '@/features/submissions/api/submissionsService';

describe('feature API public entrypoints', () => {
  test('datasets API index re-exports service functions', () => {
    expect(getActiveDataset).toBe(getActiveDatasetService);
    expect(getDatasetById).toBe(getDatasetByIdService);
  });

  test('forecasts API index re-exports service functions', () => {
    expect(getForecastsAnalytics).toBe(getForecastsAnalyticsService);
  });

  test('majors API index re-exports service functions', () => {
    expect(getMajorsAnalytics).toBe(getMajorsAnalyticsService);
  });

  test('migration API index re-exports service functions', () => {
    expect(getMigrationAnalytics).toBe(getMigrationAnalyticsService);
  });

  test('overview API index re-exports service functions', () => {
    expect(getDatasetOverview).toBe(getDatasetOverviewService);
  });

  test('submissions API index re-exports service functions', () => {
    expect(createDatasetSubmission).toBe(createDatasetSubmissionService);
    expect(getDatasetSubmissionStatus).toBe(getDatasetSubmissionStatusService);
  });
});
