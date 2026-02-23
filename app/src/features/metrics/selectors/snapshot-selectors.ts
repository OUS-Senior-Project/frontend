import type { AnalyticsRecord, SnapshotTotals } from '@/features/metrics/types';
import {
  FALL_SEMESTER_LABEL,
  getSemesterLabelForDate,
} from '@/lib/format/semester';
import { sumBy } from './aggregate';

function getLatestSemesterData(data: AnalyticsRecord[]) {
  const latestYear = Math.max(...data.map((record) => record.year));
  const fallData = data.filter(
    (record) =>
      record.year === latestYear && record.semester === FALL_SEMESTER_LABEL
  );
  return fallData.length > 0
    ? fallData
    : data.filter((record) => record.year === latestYear);
}

export function selectSnapshotForDate(data: AnalyticsRecord[], date: Date) {
  const semester = getSemesterLabelForDate(date);
  const semesterData = data.filter(
    (record) =>
      record.year === date.getFullYear() && record.semester === semester
  );
  return semesterData.length > 0 ? semesterData : getLatestSemesterData(data);
}

export function selectSnapshotTotals(
  snapshotData: AnalyticsRecord[]
): SnapshotTotals {
  const total = sumBy(snapshotData, (record) => record.count);

  return {
    total,
    undergrad: sumBy(
      snapshotData.filter((record) => record.studentType !== 'Dual Enrollment'),
      (record) => record.count
    ),
    ftic: sumBy(
      snapshotData.filter((record) => record.studentType === 'FTIC'),
      (record) => record.count
    ),
    transfer: sumBy(
      snapshotData.filter((record) => record.studentType === 'Transfer'),
      (record) => record.count
    ),
    international: Math.round(total * 0.12),
  };
}
