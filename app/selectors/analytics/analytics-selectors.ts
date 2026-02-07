import type { AnalyticsRecord, TrendPoint } from '@/types/analytics';
import { aggregateCounts } from './aggregate';

const YEARLY_AVERAGE_DIVISOR = 2;
const OVERALL_AVERAGE_DIVISOR = 12;

function filterByYear(data: AnalyticsRecord[], year?: number) {
  return year ? data.filter((record) => record.year === year) : data;
}

export function getYearlyAnalytics(data: AnalyticsRecord[]) {
  const yearlyData = aggregateCounts(
    data,
    (record) => String(record.year),
    (record) => record.count
  );

  return Object.entries(yearlyData)
    .map(([year, total]) => ({
      year: Number.parseInt(year, 10),
      total: Math.round(total / YEARLY_AVERAGE_DIVISOR),
    }))
    .sort((a, b) => a.year - b.year);
}

export function getAnalyticsByMajor(data: AnalyticsRecord[], year?: number) {
  const counts = aggregateCounts(
    filterByYear(data, year),
    (record) => record.major,
    (record) => record.count
  );

  return Object.entries(counts)
    .map(([major, count]) => ({
      major,
      count: year ? count : Math.round(count / OVERALL_AVERAGE_DIVISOR),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getAnalyticsBySchool(data: AnalyticsRecord[], year?: number) {
  const counts = aggregateCounts(
    filterByYear(data, year),
    (record) => record.school,
    (record) => record.count
  );

  return Object.entries(counts)
    .map(([school, count]) => ({
      school,
      count: year ? count : Math.round(count / OVERALL_AVERAGE_DIVISOR),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getAnalyticsByStudentType(
  data: AnalyticsRecord[],
  year?: number
) {
  const counts = aggregateCounts(
    filterByYear(data, year),
    (record) => record.studentType,
    (record) => record.count
  );

  return Object.entries(counts)
    .map(([type, count]) => ({
      type,
      count: year ? count : Math.round(count / OVERALL_AVERAGE_DIVISOR),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getTrendData(data: AnalyticsRecord[]): TrendPoint[] {
  const grouped: Record<
    string,
    { year: number; semester: number; total: number }
  > = {};

  data.forEach((record) => {
    const key = `${record.year}-${record.semester}`;
    if (!grouped[key])
      grouped[key] = {
        year: record.year,
        semester: record.semester === 'Fall' ? 1 : 2,
        total: 0,
      };
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
