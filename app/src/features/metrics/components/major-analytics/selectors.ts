import { cohorts } from '@/features/metrics/mocks/fixtures';
import type { MajorCohortRecord } from '@/features/metrics/types';

export function selectWeightedGpaByMajor(data: MajorCohortRecord[]) {
  const majorMap: Record<string, { total: number; count: number }> = {};

  data.forEach((record) => {
    if (!majorMap[record.major])
      majorMap[record.major] = { total: 0, count: 0 };
    majorMap[record.major].total += record.avgGPA * record.studentCount;
    majorMap[record.major].count += record.studentCount;
  });

  return Object.entries(majorMap)
    .map(([major, value]) => ({
      major,
      avgGPA: Math.round((value.total / value.count) * 100) / 100,
    }))
    .sort((a, b) => b.avgGPA - a.avgGPA);
}

export function selectWeightedCreditsByMajor(data: MajorCohortRecord[]) {
  const majorMap: Record<string, { total: number; count: number }> = {};

  data.forEach((record) => {
    if (!majorMap[record.major])
      majorMap[record.major] = { total: 0, count: 0 };
    majorMap[record.major].total += record.avgCredits * record.studentCount;
    majorMap[record.major].count += record.studentCount;
  });

  return Object.entries(majorMap)
    .map(([major, value]) => ({
      major,
      avgCredits: Math.round(value.total / value.count),
    }))
    .sort((a, b) => b.avgCredits - a.avgCredits);
}

export function selectCohortRowsByMajor(
  data: MajorCohortRecord[],
  metric: 'avgGPA' | 'avgCredits'
) {
  const majors = Array.from(new Set(data.map((record) => record.major)));

  return majors.map((major) => {
    const row: Record<string, string | number> = { major };
    cohorts.forEach((cohort) => {
      const match = data.find(
        (record) => record.major === major && record.cohort === cohort
      );
      row[cohort] = match ? match[metric] : 0;
    });
    return row;
  });
}
