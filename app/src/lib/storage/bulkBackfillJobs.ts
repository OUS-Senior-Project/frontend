export interface TrackedBulkBackfillJob {
  jobId: string;
  addedAt: string;
}

export const BULK_BACKFILL_JOBS_STORAGE_KEY = 'ous.admin.bulkBackfillJobs.v1';
export const MAX_TRACKED_BULK_BACKFILL_JOBS = 20;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    /* istanbul ignore next -- browser privacy/sandbox modes can throw on localStorage access */
    return null;
  }
}

function normalizeTrackedJob(value: unknown): TrackedBulkBackfillJob | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Partial<TrackedBulkBackfillJob>;
  if (typeof record.jobId !== 'string') {
    return null;
  }

  const jobId = record.jobId.trim();
  if (!jobId) {
    return null;
  }

  return {
    jobId,
    addedAt:
      typeof record.addedAt === 'string' && record.addedAt.trim()
        ? record.addedAt
        : new Date(0).toISOString(),
  };
}

function writeTrackedJobs(
  jobs: TrackedBulkBackfillJob[],
  storage: StorageLike | null
) {
  if (!storage) {
    return;
  }

  storage.setItem(BULK_BACKFILL_JOBS_STORAGE_KEY, JSON.stringify(jobs));
}

export function readTrackedBulkBackfillJobs(
  storage: StorageLike | null = getBrowserStorage()
): TrackedBulkBackfillJob[] {
  if (!storage) {
    return [];
  }

  const rawValue = storage.getItem(BULK_BACKFILL_JOBS_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => normalizeTrackedJob(entry))
      .filter((entry): entry is TrackedBulkBackfillJob => entry !== null)
      .slice(0, MAX_TRACKED_BULK_BACKFILL_JOBS);
  } catch {
    return [];
  }
}

export function trackBulkBackfillJob(
  jobId: string,
  options: {
    now?: Date;
    storage?: StorageLike | null;
  } = {}
): TrackedBulkBackfillJob[] {
  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    return readTrackedBulkBackfillJobs(options.storage ?? getBrowserStorage());
  }

  const storage = options.storage ?? getBrowserStorage();
  const existing = readTrackedBulkBackfillJobs(storage).filter(
    (entry) => entry.jobId !== trimmedJobId
  );
  const updated: TrackedBulkBackfillJob[] = [
    {
      jobId: trimmedJobId,
      addedAt: (options.now ?? new Date()).toISOString(),
    },
    ...existing,
  ].slice(0, MAX_TRACKED_BULK_BACKFILL_JOBS);

  writeTrackedJobs(updated, storage);
  return updated;
}

export function untrackBulkBackfillJob(
  jobId: string,
  storage: StorageLike | null = getBrowserStorage()
): TrackedBulkBackfillJob[] {
  const trimmedJobId = jobId.trim();
  if (!storage) {
    return [];
  }

  const updated = readTrackedBulkBackfillJobs(storage).filter(
    (entry) => entry.jobId !== trimmedJobId
  );
  writeTrackedJobs(updated, storage);
  return updated;
}

export function clearTrackedBulkBackfillJobs(
  storage: StorageLike | null = getBrowserStorage()
) {
  if (!storage) {
    return;
  }

  storage.removeItem(BULK_BACKFILL_JOBS_STORAGE_KEY);
}
