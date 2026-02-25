import {
  BULK_BACKFILL_JOBS_STORAGE_KEY,
  MAX_TRACKED_BULK_BACKFILL_JOBS,
  clearTrackedBulkBackfillJobs,
  readTrackedBulkBackfillJobs,
  trackBulkBackfillJob,
  untrackBulkBackfillJob,
} from '@/lib/storage/bulkBackfillJobs';

type StorageMock = {
  store: Record<string, string>;
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
  removeItem: jest.Mock<void, [string]>;
};

function createStorageMock(): StorageMock {
  const store: Record<string, string> = {};

  return {
    store,
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
}

describe('bulk backfill jobs storage', () => {
  test('default browser storage handling tolerates missing window and blocked localStorage', () => {
    const originalWindow = globalThis.window;
    const windowDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'window'
    );

    try {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: undefined,
      });

      expect(readTrackedBulkBackfillJobs()).toEqual([]);
      expect(trackBulkBackfillJob('bulk_offline')).toEqual([
        {
          jobId: 'bulk_offline',
          addedAt: expect.any(String),
        },
      ]);

      const blockedWindow: Record<string, unknown> = {};
      Object.defineProperty(blockedWindow, 'localStorage', {
        configurable: true,
        get() {
          throw new Error('blocked');
        },
      });
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: blockedWindow,
      });

      expect(readTrackedBulkBackfillJobs()).toEqual([]);
    } finally {
      if (windowDescriptor) {
        Object.defineProperty(globalThis, 'window', windowDescriptor);
      } else {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: originalWindow ?? globalThis,
        });
      }

      if (!globalThis.window) {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: globalThis,
        });
      }
    }
  });

  test('reads empty list when storage is unavailable or empty', () => {
    expect(readTrackedBulkBackfillJobs(null)).toEqual([]);

    const storage = createStorageMock();
    expect(readTrackedBulkBackfillJobs(storage)).toEqual([]);
  });

  test('ignores invalid JSON and malformed records', () => {
    const storage = createStorageMock();
    storage.store[BULK_BACKFILL_JOBS_STORAGE_KEY] = '{bad json';
    expect(readTrackedBulkBackfillJobs(storage)).toEqual([]);

    storage.store[BULK_BACKFILL_JOBS_STORAGE_KEY] = JSON.stringify({
      jobId: 'bulk_1',
    });
    expect(readTrackedBulkBackfillJobs(storage)).toEqual([]);

    storage.store[BULK_BACKFILL_JOBS_STORAGE_KEY] = JSON.stringify([
      null,
      {},
      { jobId: '   ' },
      { jobId: 'bulk_valid' },
      { jobId: 'bulk_valid_2', addedAt: '2026-02-24T00:00:00.000Z' },
    ]);

    expect(readTrackedBulkBackfillJobs(storage)).toEqual([
      {
        jobId: 'bulk_valid',
        addedAt: '1970-01-01T00:00:00.000Z',
      },
      {
        jobId: 'bulk_valid_2',
        addedAt: '2026-02-24T00:00:00.000Z',
      },
    ]);
  });

  test('tracks jobs with dedupe and most-recent ordering', () => {
    const storage = createStorageMock();
    const nowOne = new Date('2026-02-24T10:00:00.000Z');
    const nowTwo = new Date('2026-02-24T11:00:00.000Z');

    expect(
      trackBulkBackfillJob(' bulk_001 ', { now: nowOne, storage })
    ).toEqual([
      {
        jobId: 'bulk_001',
        addedAt: nowOne.toISOString(),
      },
    ]);

    expect(trackBulkBackfillJob('bulk_002', { now: nowTwo, storage })).toEqual([
      {
        jobId: 'bulk_002',
        addedAt: nowTwo.toISOString(),
      },
      {
        jobId: 'bulk_001',
        addedAt: nowOne.toISOString(),
      },
    ]);

    const deduped = trackBulkBackfillJob('bulk_001', {
      now: new Date('2026-02-24T12:00:00.000Z'),
      storage,
    });

    expect(deduped.map((entry) => entry.jobId)).toEqual([
      'bulk_001',
      'bulk_002',
    ]);
    expect(deduped[0]?.addedAt).toBe('2026-02-24T12:00:00.000Z');
  });

  test('caps tracked jobs and ignores blank track requests', () => {
    const storage = createStorageMock();

    for (
      let index = 0;
      index < MAX_TRACKED_BULK_BACKFILL_JOBS + 3;
      index += 1
    ) {
      trackBulkBackfillJob(`bulk_${index}`, {
        now: new Date(
          `2026-02-${String((index % 27) + 1).padStart(2, '0')}T00:00:00.000Z`
        ),
        storage,
      });
    }

    const tracked = readTrackedBulkBackfillJobs(storage);
    expect(tracked).toHaveLength(MAX_TRACKED_BULK_BACKFILL_JOBS);
    expect(tracked[0]?.jobId).toBe(
      `bulk_${MAX_TRACKED_BULK_BACKFILL_JOBS + 2}`
    );
    expect(tracked.at(-1)?.jobId).toBe('bulk_3');

    expect(trackBulkBackfillJob('   ', { storage })).toEqual(tracked);
  });

  test('uses browser localStorage by default when available', () => {
    window.localStorage.clear();

    const tracked = trackBulkBackfillJob('bulk_default_storage');
    expect(tracked[0]?.jobId).toBe('bulk_default_storage');

    const reloaded = readTrackedBulkBackfillJobs();
    expect(reloaded[0]?.jobId).toBe('bulk_default_storage');

    const unchanged = trackBulkBackfillJob('   ');
    expect(unchanged[0]?.jobId).toBe('bulk_default_storage');
  });

  test('untracks and clears tracked jobs', () => {
    const storage = createStorageMock();
    trackBulkBackfillJob('bulk_a', { storage });
    trackBulkBackfillJob('bulk_b', { storage });

    expect(
      untrackBulkBackfillJob('bulk_a', storage).map((entry) => entry.jobId)
    ).toEqual(['bulk_b']);
    expect(
      untrackBulkBackfillJob('missing', storage).map((entry) => entry.jobId)
    ).toEqual(['bulk_b']);

    clearTrackedBulkBackfillJobs(storage);
    expect(storage.removeItem).toHaveBeenCalledWith(
      BULK_BACKFILL_JOBS_STORAGE_KEY
    );
    expect(readTrackedBulkBackfillJobs(storage)).toEqual([]);

    expect(untrackBulkBackfillJob('bulk_b', null)).toEqual([]);
    expect(clearTrackedBulkBackfillJobs(null)).toBeUndefined();
  });
});
