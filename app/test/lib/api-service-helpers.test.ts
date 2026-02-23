import {
  API_V1_PATH,
  buildGuardedQuery,
  buildPaginationQuery,
  encodePathSegment,
  normalizePositiveInteger,
  toApiPath,
  withDatasetCache,
} from '@/lib/api/service-helpers';

function withNodeEnv(
  value: string,
  testFn: () => Promise<void> | void
): Promise<void> | void {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = value;

  const cleanup = () => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
      return;
    }

    process.env.NODE_ENV = originalNodeEnv;
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

describe('api service helpers', () => {
  test('normalizePositiveInteger returns fallback for undefined values', () => {
    expect(normalizePositiveInteger('/api/v1/datasets', 'page', undefined, 1)).toBe(
      1
    );
  });

  test('normalizePositiveInteger warns and falls back for invalid values in development', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await withNodeEnv('development', () => {
        expect(normalizePositiveInteger('/api/v1/datasets', 'page', 0, 1)).toBe(
          1
        );
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
        'Normalized invalid page'
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('normalizePositiveInteger suppresses warnings in production', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await withNodeEnv('production', () => {
        expect(
          normalizePositiveInteger('/api/v1/datasets', 'pageSize', Number.NaN, 20)
        ).toBe(20);
      });

      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('normalizePositiveInteger keeps valid values unchanged', () => {
    expect(normalizePositiveInteger('/api/v1/datasets', 'page', 3, 1)).toBe(3);
  });

  test('buildGuardedQuery filters unsupported and omitted params', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await withNodeEnv('production', () => {
        expect(
          buildGuardedQuery({
            endpoint: '/api/v1/submissions',
            params: {
              page: 2,
              pageSize: 10,
              status: undefined,
              limit: 10,
            },
            allowedKeys: ['page', 'pageSize', 'status'],
          })
        ).toEqual({
          page: 2,
          pageSize: 10,
        });
      });

      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('buildPaginationQuery applies defaults, normalization, and allowlists', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await withNodeEnv('development', () => {
        expect(
          buildPaginationQuery({
            endpoint: '/api/v1/submissions',
            page: 0,
            pageSize: Number.POSITIVE_INFINITY,
            params: {
              status: 'failed',
              createdAfter: '',
            },
            allowedKeys: ['page', 'pageSize', 'status', 'createdAfter'],
          })
        ).toEqual({
          page: 1,
          pageSize: 20,
          status: 'failed',
        });
      });

      expect(warnSpy).toHaveBeenCalledTimes(2);
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('toApiPath normalizes api-prefixed and bare paths', () => {
    expect(toApiPath('datasets')).toBe('/api/v1/datasets');
    expect(toApiPath('/datasets')).toBe('/api/v1/datasets');
    expect(toApiPath('/api/v1/datasets')).toBe('/api/v1/datasets');
    expect(toApiPath(API_V1_PATH)).toBe('/api/v1');
  });

  test('encodePathSegment safely escapes path separators', () => {
    expect(encodePathSegment('dataset/with/slash')).toBe(
      'dataset%2Fwith%2Fslash'
    );
  });

  test('withDatasetCache attaches dataset cache metadata to request options', () => {
    const controller = new AbortController();
    expect(
      withDatasetCache('dataset-1', {
        signal: controller.signal,
        query: { page: 1 },
      })
    ).toEqual({
      signal: controller.signal,
      query: { page: 1 },
      datasetCache: { datasetId: 'dataset-1' },
    });
  });

  test('withDatasetCache supports default options', () => {
    expect(withDatasetCache('dataset-2')).toEqual({
      datasetCache: { datasetId: 'dataset-2' },
    });
  });
});
