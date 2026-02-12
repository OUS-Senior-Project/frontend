import { useMemo, useState } from 'react';
import type { MajorCohortRecord } from '@/features/metrics/types';
import { selectCohortLabels } from '../major-analytics/selectors';

export type SortKey = 'major' | 'avgGPA' | 'avgCredits' | 'studentCount';

export function useCohortSummaryTable(data: MajorCohortRecord[]) {
  const cohorts = useMemo(() => selectCohortLabels(data), [data]);
  const [selectedCohort, setSelectedCohort] = useState<string | undefined>(
    undefined
  );
  const [sortKey, setSortKey] = useState<SortKey>('studentCount');
  const [sortAsc, setSortAsc] = useState(false);

  const activeCohort =
    selectedCohort && cohorts.includes(selectedCohort)
      ? selectedCohort
      : cohorts[0];

  const filteredData = useMemo(() => {
    if (!activeCohort) {
      return [];
    }

    const cohortData = data.filter((record) => record.cohort === activeCohort);

    return [...cohortData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortAsc
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortAsc
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [activeCohort, data, sortAsc, sortKey]);

  const totalStudents = filteredData.reduce(
    (sum, record) => sum + record.studentCount,
    0
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
      return;
    }

    setSortKey(key);
    setSortAsc(key === 'major');
  };

  return {
    cohorts,
    selectedCohort: activeCohort,
    setSelectedCohort,
    filteredData,
    totalStudents,
    handleSort,
  };
}
