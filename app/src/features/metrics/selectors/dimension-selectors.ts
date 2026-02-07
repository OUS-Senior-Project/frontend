import type { AnalyticsRecord } from '@/features/metrics/types';
import { aggregateCounts } from './aggregate';

const YEARLY_AVERAGE_DIVISOR = 2;
const OVERALL_AVERAGE_DIVISOR = 12;

function filterByYear(data: AnalyticsRecord[], year?: number) {
  return year ? data.filter((record) => record.year === year) : data;
}

export function selectYearlyAnalytics(data: AnalyticsRecord[]) {
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

export function selectMajorCounts(data: AnalyticsRecord[], year?: number) {
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

export function selectSchoolCounts(data: AnalyticsRecord[], year?: number) {
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

export function selectStudentTypeCounts(
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
