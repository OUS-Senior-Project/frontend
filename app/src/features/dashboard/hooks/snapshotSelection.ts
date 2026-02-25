import type { SnapshotSummary } from '@/lib/api/types';

function compareSnapshotsDesc(left: SnapshotSummary, right: SnapshotSummary) {
  const effectiveDateDiff = right.effectiveDate.localeCompare(
    left.effectiveDate
  );
  if (effectiveDateDiff !== 0) {
    return effectiveDateDiff;
  }

  const createdAtDiff = right.createdAt.localeCompare(left.createdAt);
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return right.snapshotId.localeCompare(left.snapshotId);
}

function warnDuplicateEffectiveDate(
  effectiveDate: string,
  keptSnapshotId: string,
  droppedSnapshotId: string
) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.warn(
    `[dashboard-snapshots] duplicate ready snapshot effectiveDate ${effectiveDate}; keeping ${keptSnapshotId}, ignoring ${droppedSnapshotId}`
  );
}

export function sortSnapshotsDescByEffectiveDate(snapshots: SnapshotSummary[]) {
  return [...snapshots].sort(compareSnapshotsDesc);
}

export interface SnapshotDateSelection {
  sortedSnapshots: SnapshotSummary[];
  latestSelectableSnapshot: SnapshotSummary | null;
  selectedSnapshot: SnapshotSummary | null;
  availableDateValues: string[];
}

export function resolveSnapshotDateSelection(
  snapshots: SnapshotSummary[],
  requestedDateParam: string | null
): SnapshotDateSelection {
  const sortedSnapshots = sortSnapshotsDescByEffectiveDate(snapshots);
  const selectableSnapshotByDate = new Map<string, SnapshotSummary>();

  sortedSnapshots.forEach((snapshot) => {
    if (snapshot.datasetId === null) {
      return;
    }

    const existing = selectableSnapshotByDate.get(snapshot.effectiveDate);
    if (existing) {
      warnDuplicateEffectiveDate(
        snapshot.effectiveDate,
        existing.snapshotId,
        snapshot.snapshotId
      );
      return;
    }

    selectableSnapshotByDate.set(snapshot.effectiveDate, snapshot);
  });

  const availableDateValues = Array.from(selectableSnapshotByDate.keys());
  const latestSelectableSnapshot =
    selectableSnapshotByDate.get(availableDateValues[0] ?? '') ?? null;
  const selectedSnapshot = requestedDateParam
    ? (selectableSnapshotByDate.get(requestedDateParam) ?? null)
    : latestSelectableSnapshot;

  return {
    sortedSnapshots,
    latestSelectableSnapshot,
    selectedSnapshot,
    availableDateValues,
  };
}
