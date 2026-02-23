import type { AnalyticsRecord, TrendPoint } from '@/features/metrics/types';
import {
  type SemesterOrder,
  toSemesterLabel,
  toSemesterOrder,
} from '@/lib/format/semester';

export function selectTrendSeries(data: AnalyticsRecord[]): TrendPoint[] {
  const grouped: Record<
    string,
    { year: number; semester: SemesterOrder; total: number }
  > = {};

  data.forEach((record) => {
    const semesterOrder = toSemesterOrder(record.semester) ?? 2;
    const key = `${record.year}-${record.semester}`;
    if (!grouped[key]) {
      grouped[key] = {
        year: record.year,
        semester: semesterOrder,
        total: 0,
      };
    }
    grouped[key].total += record.count;
  });

  return Object.values(grouped)
    .map((item) => ({
      period: `${toSemesterLabel(item.semester)} ${item.year}`,
      year: item.year,
      semester: item.semester,
      total: item.total,
    }))
    .sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.semester - b.semester
    );
}
