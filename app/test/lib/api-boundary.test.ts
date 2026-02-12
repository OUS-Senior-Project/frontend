import { getActiveDataset } from '@/features/datasets/api/datasetsService';
import { getForecastsAnalytics } from '@/features/forecasts/api/forecastsService';
import { getMajorsAnalytics } from '@/features/majors/api/majorsService';
import { getMigrationAnalytics } from '@/features/migration/api/migrationService';
import { getDatasetOverview } from '@/features/overview/api/overviewService';
import {
  createDatasetSubmission,
  getDatasetSubmissionStatus,
} from '@/features/submissions/api/submissionsService';
import { apiClient, createApiClient } from '@/lib/api/client';
import { ServiceError, toUIError } from '@/lib/api/errors';

describe('api boundaries', () => {
  test('ServiceError preserves code/message/retryable', () => {
    const error = new ServiceError('UPLOAD_FAILED', 'Upload failed', false);
    const defaultRetryable = new ServiceError('UNKNOWN', 'Unknown error');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ServiceError');
    expect(error.code).toBe('UPLOAD_FAILED');
    expect(error.message).toBe('Upload failed');
    expect(error.retryable).toBe(false);
    expect(defaultRetryable.retryable).toBe(true);
  });

  test('toUIError maps ServiceError and generic errors', () => {
    const serviceError = toUIError(
      new ServiceError('NOT_IMPLEMENTED', 'Not implemented', true),
      'Fallback message'
    );
    expect(serviceError).toEqual({
      code: 'NOT_IMPLEMENTED',
      message: 'Not implemented',
      retryable: true,
    });

    const generic = toUIError(new Error('Network unavailable'));
    expect(generic).toEqual({
      code: 'UNKNOWN',
      message: 'Network unavailable',
      retryable: true,
    });
  });

  test('toUIError handles empty messages and unknown errors', () => {
    const emptyMessageError = new Error('');
    const withFallback = toUIError(emptyMessageError, 'Default fallback');
    expect(withFallback).toEqual({
      code: 'UNKNOWN',
      message: 'Default fallback',
      retryable: true,
    });

    const unknown = toUIError({ error: 'bad payload' }, 'Unknown fallback');
    expect(unknown).toEqual({
      code: 'UNKNOWN',
      message: 'Unknown fallback',
      retryable: true,
    });
  });

  test('createApiClient stubs throw for GET/POST', async () => {
    const client = createApiClient('http://localhost:8000');

    await expect(client.get('/api/v1/overview')).rejects.toThrow(
      'Not implemented: API GET client wiring (Campaign 3)'
    );
    await expect(client.post('/api/v1/submissions', {})).rejects.toThrow(
      'Not implemented: API POST client wiring (Campaign 3)'
    );
  });

  test('shared apiClient instance throws for GET/POST', async () => {
    await expect(apiClient.get('/api/v1/overview')).rejects.toThrow(
      'Not implemented: API GET client wiring (Campaign 3)'
    );
    await expect(apiClient.post('/api/v1/submissions')).rejects.toThrow(
      'Not implemented: API POST client wiring (Campaign 3)'
    );
  });

  test('dataset and analytics service stubs fail explicitly', async () => {
    await expect(getActiveDataset()).rejects.toMatchObject({
      code: 'DATASET_NOT_FOUND',
      message: 'No active dataset found. Upload a CSV to begin.',
    });

    await expect(getDatasetOverview('dataset-1', new Date('2026-02-11'))).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      message: 'Not implemented: getDatasetOverview (Campaign 3)',
    });

    await expect(getMajorsAnalytics('dataset-1')).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      message: 'Not implemented: getMajorsAnalytics (Campaign 3)',
    });

    await expect(getMigrationAnalytics('dataset-1')).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      message: 'Not implemented: getMigrationAnalytics (Campaign 3)',
    });

    await expect(getForecastsAnalytics('dataset-1')).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      message: 'Not implemented: getForecastsAnalytics (Campaign 3)',
    });
  });

  test('submission service stubs fail explicitly', async () => {
    const file = new File(['header\nvalue'], 'dataset.csv', { type: 'text/csv' });

    await expect(createDatasetSubmission({ file })).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      message: 'Not implemented: createDatasetSubmission (Campaign 3)',
    });

    await expect(getDatasetSubmissionStatus('submission-1')).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      message: 'Not implemented: getDatasetSubmissionStatus (Campaign 3)',
    });
  });
});
