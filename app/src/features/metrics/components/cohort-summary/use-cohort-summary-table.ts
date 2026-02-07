import { useMemo, useState } from 'react';
import type { MajorCohortRecord } from '@/features/metrics/types';

export type SortKey = 'major' | 'avgGPA' | 'avgCredits' | 'studentCount';

export function useCohortSummaryTable(data: MajorCohortRecord[]) {
  const [selectedCohort, setSelectedCohort] = useState('FTIC 2024');
  const [sortKey, setSortKey] = useState<SortKey>('studentCount');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredData = useMemo(() => {
    const cohortData = data.filter(
      (record) => record.cohort === selectedCohort
    );

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
  }, [data, selectedCohort, sortAsc, sortKey]);

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
    selectedCohort,
    setSelectedCohort,
    filteredData,
    totalStudents,
    handleSort,
  };
}
