import type { MajorCohortRecord } from '@/features/metrics/types';

function cohortYearValue(cohort: string) {
  const match = cohort.match(/\d{4}/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

export function selectCohortLabels(data: MajorCohortRecord[]) {
  return Array.from(new Set(data.map((record) => record.cohort))).sort(
    (left, right) => {
      const yearDelta = cohortYearValue(right) - cohortYearValue(left);
      return yearDelta !== 0 ? yearDelta : right.localeCompare(left);
    }
  );
}

export function selectWeightedGpaByMajor(data: MajorCohortRecord[]) {
  const majorMap: Record<string, { total: number; count: number }> = {};

  data.forEach((record) => {
    if (!majorMap[record.major])
      majorMap[record.major] = { total: 0, count: 0 };
    majorMap[record.major].total += (record.avgGPA ?? 0) * record.studentCount;
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
    majorMap[record.major].total +=
      (record.avgCredits ?? 0) * record.studentCount;
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
  const cohorts = selectCohortLabels(data);
  const majors = Array.from(new Set(data.map((record) => record.major)));

  return majors.map((major) => {
    const row: Record<string, string | number> = { major };
    cohorts.forEach((cohort) => {
      const match = data.find(
        (record) => record.major === major && record.cohort === cohort
      );
      row[cohort] = match ? (match[metric] ?? 0) : 0;
    });
    return row;
  });
}
