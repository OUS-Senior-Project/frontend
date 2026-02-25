import type { SnapshotSummary } from '@/lib/api/types';
import {
  resolveSnapshotDateSelection,
  sortSnapshotsDescByEffectiveDate,
} from '@/features/dashboard/hooks/snapshotSelection';

function makeSnapshot(
  effectiveDate: string,
  datasetId: string | null,
  overrides: Partial<SnapshotSummary> = {}
): SnapshotSummary {
  return {
    snapshotId: `snap-${effectiveDate}-${datasetId ?? 'none'}`,
    effectiveDate,
    effectiveDatetime: `${effectiveDate}T15:00:00Z`,
    createdAt: `${effectiveDate}T15:01:00Z`,
    academicPeriod: 'Spring 2026',
    status: 'ready',
    submissionId: datasetId ? `sub-${datasetId}` : null,
    datasetId,
    ...overrides,
  };
}

describe('snapshotSelection helpers', () => {
  test('sortSnapshotsDescByEffectiveDate sorts by effectiveDate, then createdAt, then snapshotId', () => {
    const snapshots = [
      makeSnapshot('2026-02-11', 'dataset-1', {
        snapshotId: 'snap-a',
        createdAt: '2026-02-11T10:00:00Z',
      }),
      makeSnapshot('2026-03-01', 'dataset-2', {
        snapshotId: 'snap-b',
        createdAt: '2026-03-01T10:00:00Z',
      }),
      makeSnapshot('2026-03-01', 'dataset-3', {
        snapshotId: 'snap-c',
        createdAt: '2026-03-01T11:00:00Z',
      }),
      makeSnapshot('2026-03-01', 'dataset-4', {
        snapshotId: 'snap-d',
        createdAt: '2026-03-01T11:00:00Z',
      }),
    ];

    const sorted = sortSnapshotsDescByEffectiveDate(snapshots);

    expect(sorted.map((snapshot) => snapshot.snapshotId)).toEqual([
      'snap-d',
      'snap-c',
      'snap-b',
      'snap-a',
    ]);
  });

  test('resolveSnapshotDateSelection filters non-selectable snapshots, deduplicates by date, and warns in non-production', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const selection = resolveSnapshotDateSelection(
        [
          makeSnapshot('2026-03-01', null, { snapshotId: 'snap-null' }),
          makeSnapshot('2026-03-01', 'dataset-new', {
            snapshotId: 'snap-keep',
            createdAt: '2026-03-01T12:00:00Z',
          }),
          makeSnapshot('2026-03-01', 'dataset-old', {
            snapshotId: 'snap-drop',
            createdAt: '2026-03-01T10:00:00Z',
          }),
          makeSnapshot('2026-02-11', 'dataset-older'),
        ],
        '2026-02-11'
      );

      expect(selection.availableDateValues).toEqual(['2026-03-01', '2026-02-11']);
      expect(selection.latestSelectableSnapshot?.snapshotId).toBe('snap-keep');
      expect(selection.selectedSnapshot?.datasetId).toBe('dataset-older');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('duplicate ready snapshot effectiveDate 2026-03-01')
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('resolveSnapshotDateSelection returns null selection when requested date is unavailable and skips warning in production', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const selection = resolveSnapshotDateSelection(
        [
          makeSnapshot('2026-03-01', 'dataset-2', {
            snapshotId: 'snap-keep',
            createdAt: '2026-03-01T12:00:00Z',
          }),
          makeSnapshot('2026-03-01', 'dataset-1', {
            snapshotId: 'snap-drop',
            createdAt: '2026-03-01T10:00:00Z',
          }),
        ],
        '1900-01-01'
      );

      expect(selection.latestSelectableSnapshot?.snapshotId).toBe('snap-keep');
      expect(selection.selectedSnapshot).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      warnSpy.mockRestore();
    }
  });
});
