import { getActiveDataset } from '@/features/datasets/api/datasetsService';
import { getDatasetOverview } from '@/features/overview/api/overviewService';
import {
  createDatasetSubmission,
  getDatasetSubmissionStatus,
} from '@/features/submissions/api/submissionsService';
import {
  clearDatasetResponseCache,
  createApiClient,
} from '@/lib/api/client';
import {
  ApiError,
  ServiceError,
  formatUIErrorMessage,
  toUIError,
} from '@/lib/api/errors';
import {
  emptyResponse,
  installFetchMock,
  jsonResponse,
  textResponse,
} from '../utils/http';

function withApiBaseUrlOverride(value: string, testFn: () => Promise<void> | void) {
  const originalValue = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = value;

  const cleanup = () => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      return;
    }

    process.env.NEXT_PUBLIC_API_BASE_URL = originalValue;
  };

  try {
    const maybePromise = testFn();
    if (maybePromise instanceof Promise) {
      return maybePromise.finally(cleanup);
    }
    cleanup();
  } catch (error) {
    cleanup();
    throw error;
  }
}

function withApiBaseUrlUnset(testFn: () => Promise<void> | void) {
  const originalValue = process.env.NEXT_PUBLIC_API_BASE_URL;
  delete process.env.NEXT_PUBLIC_API_BASE_URL;

  const cleanup = () => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      return;
    }

    process.env.NEXT_PUBLIC_API_BASE_URL = originalValue;
  };

  try {
    const maybePromise = testFn();
    if (maybePromise instanceof Promise) {
      return maybePromise.finally(cleanup);
    }
    cleanup();
  } catch (error) {
    cleanup();
    throw error;
  }
}

describe('api boundaries', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearDatasetResponseCache();
  });

  test('ServiceError preserves code/message/retryable', () => {
    const error = new ServiceError('UPLOAD_FAILED', 'Upload failed', false);
    const defaultRetryable = new ServiceError('UNKNOWN', 'Unknown error');
    const optionDefaultRetryable = new ServiceError('UNKNOWN', 'Unknown error', {});

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ServiceError');
    expect(error.code).toBe('UPLOAD_FAILED');
    expect(error.message).toBe('Upload failed');
    expect(error.retryable).toBe(false);
    expect(defaultRetryable.retryable).toBe(true);
    expect(optionDefaultRetryable.retryable).toBe(true);
  });

  test('toUIError maps ServiceError and generic errors', () => {
    const serviceError = toUIError(
      new ServiceError('UPLOAD_FAILED', 'Upload failed', {
        retryable: false,
        status: 415,
      })
    );

    expect(serviceError).toEqual({
      code: 'UPLOAD_FAILED',
      message: 'Upload failed',
      retryable: false,
      status: 415,
    });

    const generic = toUIError(new Error('Network unavailable'));
    expect(generic).toEqual({
      code: 'UNKNOWN',
      message: 'Network unavailable',
      retryable: true,
    });

    expect(toUIError({})).toEqual({
      code: 'UNKNOWN',
      message: 'Something went wrong.',
      retryable: true,
    });

    const emptyMessageServiceError = toUIError(
      new ServiceError('EMPTY_MESSAGE', '', {
        retryable: true,
        requestId: '',
      }),
      'Fallback message'
    );
    expect(emptyMessageServiceError).toEqual({
      code: 'EMPTY_MESSAGE',
      message: 'Fallback message',
      retryable: true,
    });

    const genericFallback = toUIError(new Error(''), 'Generic fallback');
    expect(genericFallback).toEqual({
      code: 'UNKNOWN',
      message: 'Generic fallback',
      retryable: true,
    });

    const requestIdError = toUIError(
      new ServiceError('REQUEST_ID_TEST', 'Request id attached', {
        retryable: false,
        requestId: 'req-123',
      })
    );
    expect(requestIdError).toEqual({
      code: 'REQUEST_ID_TEST',
      message: 'Request id attached',
      retryable: false,
      requestId: 'req-123',
    });
  });

  test('formatUIErrorMessage appends request id consistently when available', () => {
    expect(
      formatUIErrorMessage({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach backend.',
        retryable: true,
      })
    ).toBe('Unable to reach backend.');

    expect(
      formatUIErrorMessage({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach backend.',
        retryable: true,
        requestId: 'req-1',
      })
    ).toBe('Unable to reach backend. (Request ID: req-1)');

    expect(
      formatUIErrorMessage({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach backend. (Request ID: req-1)',
        retryable: true,
        requestId: 'req-1',
      })
    ).toBe('Unable to reach backend. (Request ID: req-1)');

    expect(
      formatUIErrorMessage(
        {
          code: 'NETWORK_ERROR',
          message: '   ',
          retryable: true,
        },
        'Fallback'
      )
    ).toBe('Fallback');

    expect(formatUIErrorMessage(null, 'Fallback')).toBe('Fallback');
  });

  test('toUIError adds CORS guidance for cross-origin network errors', async () => {
    await withApiBaseUrlOverride('http://localhost:8000', async () => {
      const serviceNetworkError = toUIError(
        new ServiceError('NETWORK_ERROR', 'Unable to reach the backend service.')
      );

      expect(serviceNetworkError).toMatchObject({
        code: 'NETWORK_ERROR',
        retryable: true,
      });
      expect(serviceNetworkError.message).toContain('missing CORS headers');
      expect(serviceNetworkError.message).toContain(
        'backend that is not running'
      );
      expect(serviceNetworkError.message).toContain('Access-Control-Allow-Origin');
      expect(serviceNetworkError.message).toContain(window.location.origin);

      const browserNetworkError = toUIError(new TypeError('Failed to fetch'));
      expect(browserNetworkError).toMatchObject({
        code: 'NETWORK_ERROR',
        retryable: true,
      });
      expect(browserNetworkError.message).toContain('missing CORS headers');
    });
  });

  test('toUIError only applies UNKNOWN-based CORS guidance for fetch-like messages', async () => {
    await withApiBaseUrlOverride('http://localhost:8000', async () => {
      const unknownFetchLike = toUIError(
        new ServiceError('UNKNOWN', 'Failed to fetch')
      );
      expect(unknownFetchLike).toMatchObject({
        code: 'UNKNOWN',
        retryable: true,
      });
      expect(unknownFetchLike.message).toContain('missing CORS headers');

      const unknownNonFetch = toUIError(
        new ServiceError('UNKNOWN', 'Validation failed')
      );
      expect(unknownNonFetch).toEqual({
        code: 'UNKNOWN',
        message: 'Validation failed',
        retryable: true,
      });
    });
  });

  test('toUIError keeps generic network messages when CORS guidance does not apply', async () => {
    await withApiBaseUrlUnset(async () => {
      const unsetEnv = toUIError(
        new ServiceError('NETWORK_ERROR', 'Unable to reach the backend service.')
      );
      expect(unsetEnv).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the backend service.',
        retryable: true,
      });
    });

    await withApiBaseUrlOverride(window.location.origin, async () => {
      const sameOrigin = toUIError(
        new ServiceError('NETWORK_ERROR', 'Unable to reach the backend service.')
      );
      expect(sameOrigin).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the backend service.',
        retryable: true,
      });
    });

    await withApiBaseUrlOverride('http://[::1', async () => {
      const invalidBaseUrl = toUIError(
        new ServiceError('NETWORK_ERROR', 'Unable to reach the backend service.')
      );
      expect(invalidBaseUrl).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the backend service.',
        retryable: true,
      });
    });
  });

  test('createApiClient executes GET/POST successfully with typed responses', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({ status: 'ok' }, { headers: { 'x-request-id': 'req-1' } })
      )
      .mockResolvedValueOnce(
        jsonResponse({ created: true }, { headers: { 'x-request-id': 'req-2' } })
      );

    const client = createApiClient('http://localhost:8000');
    const health = await client.get<{ status: string }>('/api/v1/health');
    const createResult = await client.post<{ created: boolean }>(
      '/api/v1/example',
      {
        a: 1,
      }
    );

    expect(health).toEqual({ status: 'ok' });
    expect(createResult).toEqual({ created: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('createApiClient normalizes request paths that omit a leading slash', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const client = createApiClient('http://localhost:8000');
    await client.get('datasets');

    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      'http://localhost:8000/api/v1/datasets'
    );
  });

  test('createApiClient supports canonical query serialization for arrays and scalar params', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const client = createApiClient('http://localhost:8000');
    await client.get('/api/v1/example', {
      query: {
        z: 2,
        ids: [3, 1, 2],
        includeArchived: false,
      },
    });

    const url = String(fetchSpy.mock.calls[0]?.[0]);
    expect(url).toContain('/api/v1/example?');
    expect(url).toContain('ids=1');
    expect(url).toContain('ids=2');
    expect(url).toContain('ids=3');
    expect(url).toContain('includeArchived=false');
    expect(url).toContain('z=2');
  });

  test('createApiClient omits null and undefined query values', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const client = createApiClient('http://localhost:8000');
    await client.get('/api/v1/example', {
      query: {
        page: 1,
        status: undefined,
        cursor: null,
      },
    });

    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      'http://localhost:8000/api/v1/example?page=1'
    );
  });

  test('createApiClient canonical query serialization is deterministic for key and array ordering', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const client = createApiClient('http://localhost:8000');
    await client.get('/api/v1/example', {
      query: {
        pageSize: 20,
        page: 2,
        status: ['processing', 'failed', 'queued'],
      },
    });

    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      'http://localhost:8000/api/v1/example?page=2&pageSize=20&status=failed&status=processing&status=queued'
    );
  });

  test.each([
    {
      configuredBaseUrl: 'http://localhost:8000',
      path: '/datasets',
      expectedUrl: 'http://localhost:8000/api/v1/datasets',
    },
    {
      configuredBaseUrl: 'http://localhost:8000/',
      path: '/datasets',
      expectedUrl: 'http://localhost:8000/api/v1/datasets',
    },
    {
      configuredBaseUrl: 'http://localhost:8000/api/v1',
      path: '/datasets',
      expectedUrl: 'http://localhost:8000/api/v1/datasets',
    },
    {
      configuredBaseUrl: 'http://localhost:8000/api/v1/',
      path: '/datasets',
      expectedUrl: 'http://localhost:8000/api/v1/datasets',
    },
    {
      configuredBaseUrl: 'http://localhost:8000',
      path: '/api/v1/datasets',
      expectedUrl: 'http://localhost:8000/api/v1/datasets',
    },
    {
      configuredBaseUrl: 'http://localhost:8000/api/v1',
      path: '/api/v1/datasets',
      expectedUrl: 'http://localhost:8000/api/v1/datasets',
    },
  ])(
    'createApiClient applies /api/v1 exactly once for base URL $configuredBaseUrl and path $path',
    async ({ configuredBaseUrl, path, expectedUrl }) => {
      const fetchSpy = installFetchMock();
      fetchSpy.mockResolvedValueOnce(jsonResponse({ status: 'ok' }));

      const client = createApiClient(configuredBaseUrl);
      await client.get(path);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(expectedUrl);
    }
  );

  test('createApiClient defers missing NEXT_PUBLIC_API_BASE_URL errors until request execution', async () => {
    await withApiBaseUrlOverride('', async () => {
      const fetchSpy = installFetchMock();
      const client = createApiClient();

      await expect(client.get('/datasets')).rejects.toMatchObject({
        code: 'MISSING_API_BASE_URL',
        message:
          'NEXT_PUBLIC_API_BASE_URL is required (example: http://localhost:8000)',
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  test('createApiClient default baseUrl resolves to empty string when env is unset', async () => {
    await withApiBaseUrlUnset(async () => {
      const client = createApiClient();
      await expect(client.get('/datasets')).rejects.toMatchObject({
        code: 'MISSING_API_BASE_URL',
      });
    });
  });

  test('createApiClient surfaces HTTP_ERROR when non-envelope error payload is returned', async () => {
    installFetchMock().mockResolvedValueOnce(textResponse('gateway down', { status: 502 }));

    const client = createApiClient('http://localhost:8000');
    await expect(client.get('/api/v1/failure')).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      status: 502,
      message: 'Request failed with status 502.',
      details: 'gateway down',
    });
  });

  test('createApiClient treats malformed error envelopes as HTTP_ERROR', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: { details: { reason: 'missing fields' } },
          },
          { status: 400 }
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            reason: 'no error envelope',
          },
          { status: 500 }
        )
      );

    const client = createApiClient('http://localhost:8000');
    await expect(client.get('/api/v1/bad-envelope')).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      status: 400,
    });
    await expect(client.get('/api/v1/no-envelope')).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      status: 500,
      details: { reason: 'no error envelope' },
    });
  });

  test('createApiClient handles plain-text success responses and empty responses', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy
      .mockResolvedValueOnce(textResponse('plain-ok', { status: 200 }))
      .mockResolvedValueOnce(emptyResponse({ status: 204 }));

    const client = createApiClient('http://localhost:8000');
    const plain = await client.get<string>('/api/v1/plain');
    const noContent = await client.post<undefined>('/api/v1/no-content', {});

    expect(plain).toBe('plain-ok');
    expect(noContent).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('createApiClient handles successful responses with empty text body', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy.mockResolvedValueOnce(emptyResponse({ status: 200 }));

    const client = createApiClient('http://localhost:8000');
    const response = await client.get<undefined>('/api/v1/empty-text');
    expect(response).toBeUndefined();
  });

  test('createApiClient maps request aborts and timeouts to ServiceError codes', async () => {
    jest.useFakeTimers();
    try {
      const fetchSpy = installFetchMock();
      fetchSpy.mockImplementation((_url, init) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        });
      });

      const client = createApiClient('http://localhost:8000');

      const abortedController = new AbortController();
      const abortedRequest = client.get('/api/v1/abort-me', {
        signal: abortedController.signal,
        timeoutMs: 5_000,
      });
      abortedController.abort();
      await expect(abortedRequest).rejects.toMatchObject({
        code: 'REQUEST_ABORTED',
        message: 'The request was cancelled.',
      });

      const timeoutRequest = client.get('/api/v1/timeout-me', {
        timeoutMs: 10,
      });
      const timeoutAssertion = expect(timeoutRequest).rejects.toMatchObject({
        code: 'REQUEST_TIMEOUT',
        message: 'The request timed out. Please try again.',
      });
      await jest.advanceTimersByTimeAsync(10);
      await timeoutAssertion;
    } finally {
      jest.useRealTimers();
    }
  });

  test('createApiClient maps non-abort fetch failures to NETWORK_ERROR', async () => {
    installFetchMock().mockRejectedValueOnce(new Error('socket hung up'));
    const client = createApiClient('http://localhost:8000');

    await expect(client.get('/api/v1/network-failure')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the backend service.',
    });
  });

  test('createApiClient throws ApiError for backend error envelopes', async () => {
    installFetchMock().mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: 'DATASET_NOT_FOUND',
            message: 'Dataset not found.',
            details: { datasetId: 'missing' },
          },
        },
        { status: 404, headers: { 'x-request-id': 'req-404' } }
      )
    );

    const client = createApiClient('http://localhost:8000');
    const request = client.get('/api/v1/datasets/missing');

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      code: 'DATASET_NOT_FOUND',
      requestId: 'req-404',
      status: 404,
    });
  });

  test.each([
    { status: 400, retryable: false },
    { status: 408, retryable: true },
    { status: 429, retryable: true },
    { status: 500, retryable: true },
  ])(
    'createApiClient classifies retryability from status codes (status: $status)',
    async ({ status, retryable }) => {
      installFetchMock().mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: `HTTP_${status}`,
              message: `Failed with ${status}`,
            },
          },
          { status }
        )
      );

      const client = createApiClient('http://localhost:8000');
      await expect(client.get('/api/v1/retryable-matrix')).rejects.toMatchObject(
        {
          code: `HTTP_${status}`,
          status,
          retryable,
        }
      );
    }
  );

  test('createApiClient preserves 409 DATASET_NOT_READY and DATASET_FAILED envelopes for dataset reads', async () => {
    installFetchMock()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'DATASET_NOT_READY',
              message: 'Dataset is still building.',
              details: {
                datasetId: 'dataset-1',
                status: 'building',
                requiredStatus: 'ready',
              },
            },
          },
          { status: 409, headers: { 'x-request-id': 'req-409-ready' } }
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'DATASET_FAILED',
              message: 'Dataset processing failed.',
              details: {
                datasetId: 'dataset-1',
                status: 'failed',
              },
            },
          },
          { status: 409, headers: { 'x-request-id': 'req-409-failed' } }
        )
      );

    const client = createApiClient('http://localhost:8000');

    await expect(
      client.get('/api/v1/datasets/dataset-1/overview')
    ).rejects.toMatchObject({
      code: 'DATASET_NOT_READY',
      status: 409,
      requestId: 'req-409-ready',
      details: {
        datasetId: 'dataset-1',
        status: 'building',
        requiredStatus: 'ready',
      },
    });
    await expect(
      client.get('/api/v1/datasets/dataset-1/overview')
    ).rejects.toMatchObject({
      code: 'DATASET_FAILED',
      status: 409,
      requestId: 'req-409-failed',
      details: {
        datasetId: 'dataset-1',
        status: 'failed',
      },
    });
  });

  test('getActiveDataset maps ACTIVE_DATASET_NOT_FOUND to null', async () => {
    installFetchMock().mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: 'ACTIVE_DATASET_NOT_FOUND',
            message: 'Active dataset not found.',
            details: {},
          },
        },
        { status: 404, headers: { 'x-request-id': 'req-404' } }
      )
    );

    await expect(getActiveDataset()).resolves.toBeNull();
  });

  test('dataset overview request uses dataset ETag cache and handles 304', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(
          {
            datasetId: 'dataset-1',
            snapshotTotals: {
              total: 10,
              undergrad: 10,
              ftic: 3,
              transfer: 2,
              international: 1,
            },
            activeMajors: 2,
            activeSchools: 1,
            trend: [],
            studentTypeDistribution: [],
            schoolDistribution: [],
          },
          { status: 200, headers: { etag: '"etag-1"', 'x-request-id': 'req-1' } }
        )
      )
      .mockResolvedValueOnce(
        emptyResponse({
          status: 304,
          headers: { etag: '"etag-1"', 'x-request-id': 'req-2' },
        })
      );

    const first = await getDatasetOverview('dataset-1');
    const second = await getDatasetOverview('dataset-1');

    expect(first.datasetId).toBe('dataset-1');
    expect(second.datasetId).toBe('dataset-1');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const secondHeaders = fetchSpy.mock.calls[1]?.[1]?.headers as Headers;
    expect(secondHeaders.get('If-None-Match')).toBe('"etag-1"');
  });

  test('dataset cache serves the original cached payload instance on a 304 response', async () => {
    const fetchSpy = installFetchMock();
    const payload = {
      datasetId: 'dataset-1',
      snapshotTotals: { total: 10 },
    };

    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(payload, { status: 200, headers: { etag: '"etag-1"' } })
      )
      .mockResolvedValueOnce(emptyResponse({ status: 304 }));

    const client = createApiClient('http://localhost:8000');
    const first = await client.get<typeof payload>(
      '/api/v1/datasets/dataset-1/overview',
      {
        datasetCache: { datasetId: 'dataset-1' },
      }
    );
    const second = await client.get<typeof payload>(
      '/api/v1/datasets/dataset-1/overview',
      {
        datasetCache: { datasetId: 'dataset-1' },
      }
    );

    expect(second).toBe(first);
  });

  test('dataset cache recovery throws CACHE_MISS when server repeatedly returns 304 without payload', async () => {
    installFetchMock()
      .mockResolvedValueOnce(emptyResponse({ status: 304 }))
      .mockResolvedValueOnce(emptyResponse({ status: 304 }));

    const client = createApiClient('http://localhost:8000');
    await expect(
      client.get('/api/v1/datasets/dataset-1/overview', {
        datasetCache: { datasetId: 'dataset-1' },
      })
    ).rejects.toMatchObject({
      code: 'CACHE_MISS',
    });
  });

  test('dataset cache recovery surfaces API errors when re-fetch after 304 fails', async () => {
    installFetchMock()
      .mockResolvedValueOnce(emptyResponse({ status: 304 }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'DATASET_NOT_FOUND',
              message: 'Dataset not found.',
              details: { datasetId: 'dataset-1' },
            },
          },
          { status: 404 }
        )
      );

    const client = createApiClient('http://localhost:8000');
    await expect(
      client.get('/api/v1/datasets/dataset-1/overview', {
        datasetCache: { datasetId: 'dataset-1' },
      })
    ).rejects.toMatchObject({
      code: 'DATASET_NOT_FOUND',
      status: 404,
    });
  });

  test('dataset cache recovery returns payload when second fetch succeeds after a 304 cache miss', async () => {
    installFetchMock()
      .mockResolvedValueOnce(emptyResponse({ status: 304 }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            datasetId: 'dataset-1',
            snapshotTotals: {
              total: 10,
              undergrad: 10,
              ftic: 3,
              transfer: 2,
              international: 1,
            },
            activeMajors: 2,
            activeSchools: 1,
            trend: [],
            studentTypeDistribution: [],
            schoolDistribution: [],
          },
          { status: 200 }
        )
      );

    const client = createApiClient('http://localhost:8000');
    const response = await client.get('/api/v1/datasets/dataset-1/overview', {
      datasetCache: { datasetId: 'dataset-1' },
    });
    expect(response).toMatchObject({
      datasetId: 'dataset-1',
    });
  });

  test('dataset cache drops stale etag when subsequent 200 response has no etag header', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(
          { datasetId: 'dataset-1', trend: [] },
          { status: 200, headers: { etag: '"etag-1"' } }
        )
      )
      .mockResolvedValueOnce(
        jsonResponse({ datasetId: 'dataset-1', trend: [] }, { status: 200 })
      )
      .mockResolvedValueOnce(
        jsonResponse({ datasetId: 'dataset-1', trend: [] }, { status: 200 })
      );

    const client = createApiClient('http://localhost:8000');
    await client.get('/api/v1/datasets/dataset-1/overview', {
      datasetCache: { datasetId: 'dataset-1' },
    });
    await client.get('/api/v1/datasets/dataset-1/overview', {
      datasetCache: { datasetId: 'dataset-1' },
    });
    await client.get('/api/v1/datasets/dataset-1/overview', {
      datasetCache: { datasetId: 'dataset-1' },
    });

    const secondHeaders = fetchSpy.mock.calls[1]?.[1]?.headers as Headers;
    expect(secondHeaders.get('If-None-Match')).toBe('"etag-1"');
    const thirdHeaders = fetchSpy.mock.calls[2]?.[1]?.headers as Headers;
    expect(thirdHeaders.get('If-None-Match')).toBeNull();
  });

  test('createApiClient put method uses JSON body and maps API errors', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: 'DATASET_NOT_READY',
            message: 'Dataset is not ready.',
            details: { datasetId: 'dataset-1' },
          },
        },
        { status: 409, headers: { 'x-request-id': 'req-put-1' } }
      )
    );

    const client = createApiClient('http://localhost:8000');
    await expect(
      client.put('/api/v1/datasets/dataset-1/active', { force: true })
    ).rejects.toMatchObject({
      code: 'DATASET_NOT_READY',
      status: 409,
      requestId: 'req-put-1',
    });

    const requestInit = fetchSpy.mock.calls[0]?.[1];
    expect(requestInit?.method).toBe('PUT');
    expect(requestInit?.body).toBe(JSON.stringify({ force: true }));
  });

  test('createApiClient postForm defaults options and sends FormData body', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const client = createApiClient('http://localhost:8000');
    const formData = new FormData();
    formData.append('file', new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' }));

    const response = await client.postForm<{ ok: boolean }>('/api/v1/upload', formData);
    expect(response).toEqual({ ok: true });

    const requestInit = fetchSpy.mock.calls[0]?.[1];
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.body).toBe(formData);
    const headers = requestInit?.headers as Headers;
    expect(headers.get('Content-Type')).toBeNull();
  });

  test('submission service uses multipart file field and status polling endpoint', async () => {
    const fetchSpy = installFetchMock();
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse({
          submissionId: 'sub-1',
          datasetId: 'dataset-1',
          status: 'queued',
          fileName: 'dataset.csv',
          createdAt: '2026-02-11T00:00:00Z',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          submissionId: 'sub-1',
          datasetId: 'dataset-1',
          status: 'completed',
          fileName: 'dataset.csv',
          createdAt: '2026-02-11T00:00:00Z',
          completedAt: '2026-02-11T00:01:00Z',
          validationErrors: [],
        })
      );

    const file = new File(['header\nvalue'], 'dataset.csv', { type: 'text/csv' });
    const created = await createDatasetSubmission({ file });
    const status = await getDatasetSubmissionStatus('sub-1');

    expect(created.submissionId).toBe('sub-1');
    expect(status.status).toBe('completed');

    const createUrl = String(fetchSpy.mock.calls[0]?.[0]);
    expect(createUrl).toContain('/api/v1/submissions?activate_on_success=true');
    const createBody = fetchSpy.mock.calls[0]?.[1]?.body as FormData;
    expect(createBody.get('file')).toBe(file);

    const statusUrl = String(fetchSpy.mock.calls[1]?.[0]);
    expect(statusUrl).toContain('/api/v1/submissions/sub-1');
  });
});
