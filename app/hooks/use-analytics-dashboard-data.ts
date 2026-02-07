'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { getAnalyticsRepository } from '@/data/analytics-repository';
import {
  generateForecastData,
  getAnalyticsByMajor,
  getAnalyticsBySchool,
  getAnalyticsByStudentType,
  getDailySnapshot,
  getSnapshotTotals,
  getTrendData,
  getYearlyAnalytics,
} from '@/selectors/analytics';
import { computeFiveYearGrowth } from '@/lib/analytics-utils';

export function useAnalyticsDashboardData() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [migrationSemester, setMigrationSemester] = useState<
    string | undefined
  >();
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const repository = useMemo(() => getAnalyticsRepository(), []);
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
    () => getDailySnapshot(analyticsData, selectedDate),
    [analyticsData, selectedDate]
  );

  const trendData = useMemo(() => getTrendData(analyticsData), [analyticsData]);
  const forecastData = useMemo(
    () => generateForecastData(trendData),
    [trendData]
  );
  const yearlyAnalytics = useMemo(
    () => getYearlyAnalytics(analyticsData),
    [analyticsData]
  );
  const majorData = useMemo(
    () => getAnalyticsByMajor(analyticsData),
    [analyticsData]
  );
  const schoolData = useMemo(
    () => getAnalyticsBySchool(analyticsData),
    [analyticsData]
  );

  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const onUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFile(file.name);
    setSelectedDate(new Date());
  };

  return {
    selectedDate,
    setSelectedDate,
    breakdownOpen,
    setBreakdownOpen,
    migrationSemester,
    setMigrationSemester,
    uploadedFile,
    onUploadChange,
    dateLabel,
    snapshotTotals: getSnapshotTotals(snapshotData),
    snapshotStudentTypes: getAnalyticsByStudentType(snapshotData),
    snapshotSchools: getAnalyticsBySchool(snapshotData),
    trendData,
    forecastData,
    yearlyAnalytics,
    majorData,
    schoolData,
    cohortData,
    migrationData,
    fiveYearGrowth: computeFiveYearGrowth(yearlyAnalytics),
  };
}
