import type { AnalyticsRecord, TrendPoint } from '@/features/metrics/types';

export function selectTrendSeries(data: AnalyticsRecord[]): TrendPoint[] {
  const grouped: Record<
    string,
    { year: number; semester: number; total: number }
  > = {};

  data.forEach((record) => {
    const key = `${record.year}-${record.semester}`;
    if (!grouped[key]) {
      grouped[key] = {
        year: record.year,
        semester: record.semester === 'Fall' ? 1 : 2,
        total: 0,
      };
    }
    grouped[key].total += record.count;
  });

  return Object.values(grouped)
    .map((item) => ({
      period: `${item.semester === 1 ? 'Fall' : 'Spring'} ${item.year}`,
      year: item.year,
      semester: item.semester,
      total: item.total,
    }))
    .sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.semester - b.semester
    );
}
