'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { getMockAnalyticsRepository } from '@/features/metrics/mocks/analytics-repository';
import {
  selectForecastSeries,
  selectMajorCounts,
  selectSchoolCounts,
  selectStudentTypeCounts,
  selectSnapshotForDate,
  selectSnapshotTotals,
  selectTrendSeries,
  selectYearlyAnalytics,
} from '@/features/metrics/selectors';
import { calculateFiveYearGrowthRate } from '@/features/metrics/utils/metrics-summary-utils';

export function useDashboardMetricsModel() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [migrationSemester, setMigrationSemester] = useState<
    string | undefined
  >();
  const [uploadedDatasetName, setUploadedDatasetName] = useState<string | null>(
    null
  );

  const repository = useMemo(() => getMockAnalyticsRepository(), []);
  const analyticsData = useMemo(
    () => repository.getAnalyticsRecords(),
    [repository]
  );
  const migrationData = useMemo(
    () => repository.getMigrationRecords(),
    [repository]
  );
  const cohortData = useMemo(
    () => repository.getMajorCohortRecords(),
    [repository]
  );

  const snapshotData = useMemo(
    () => selectSnapshotForDate(analyticsData, selectedDate),
    [analyticsData, selectedDate]
  );

  const trendData = useMemo(
    () => selectTrendSeries(analyticsData),
    [analyticsData]
  );
  const forecastData = useMemo(
    () => selectForecastSeries(trendData),
    [trendData]
  );
  const yearlyAnalytics = useMemo(
    () => selectYearlyAnalytics(analyticsData),
    [analyticsData]
  );
  const majorData = useMemo(
    () => selectMajorCounts(analyticsData),
    [analyticsData]
  );
  const schoolData = useMemo(
    () => selectSchoolCounts(analyticsData),
    [analyticsData]
  );

  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDatasetUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedDatasetName(file.name);
    setSelectedDate(new Date());
  };

  return {
    selectedDate,
    setSelectedDate,
    breakdownOpen,
    setBreakdownOpen,
    migrationSemester,
    setMigrationSemester,
    uploadedDatasetName,
    handleDatasetUpload,
    dateLabel,
    snapshotTotals: selectSnapshotTotals(snapshotData),
    snapshotStudentTypes: selectStudentTypeCounts(snapshotData),
    snapshotSchools: selectSchoolCounts(snapshotData),
    trendData,
    forecastData,
    yearlyAnalytics,
    majorData,
    schoolData,
    cohortData,
    migrationData,
    fiveYearGrowth: calculateFiveYearGrowthRate(yearlyAnalytics),
  };
}
