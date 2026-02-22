import type { AnalyticsRecord } from '@/features/metrics/types';
import {
  selectForecastSeries,
  selectMajorCounts,
  selectSchoolCounts,
  selectSnapshotForDate,
  selectSnapshotTotals,
  selectStudentTypeCounts,
  selectTrendSeries,
  selectYearlyAnalytics,
} from '@/features/metrics/selectors';

describe('analytics selectors', () => {
  test('aggregate helpers compute by year, major, school, and student type', () => {
    const sample: AnalyticsRecord[] = [
      {
        year: 2023,
        semester: 'Fall',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 100,
      },
      {
        year: 2023,
        semester: 'Spring',
        major: 'Biology',
        school: 'Science',
        studentType: 'Transfer',
        count: 50,
      },
      {
        year: 2024,
        semester: 'Fall',
        major: 'Chemistry',
        school: 'Science',
        studentType: 'FTIC',
        count: 80,
      },
      {
        year: 2024,
        semester: 'Spring',
        major: 'Math',
        school: 'Arts',
        studentType: 'Continuing',
        count: 20,
      },
    ];

    const yearly = selectYearlyAnalytics(sample);
    expect(yearly).toEqual([
      { year: 2023, total: Math.round(150 / 2) },
      { year: 2024, total: Math.round(100 / 2) },
    ]);

    const majorsAll = selectMajorCounts(sample);
    expect(majorsAll[0].major).toBe('Biology');
    expect(majorsAll[0].count).toBe(Math.round(150 / 12));

    const majors2024 = selectMajorCounts(sample, 2024);
    expect(majors2024).toEqual([
      { major: 'Chemistry', count: 80 },
      { major: 'Math', count: 20 },
    ]);

    const schools = selectSchoolCounts(sample);
    expect(schools[0].count).toBe(Math.round(230 / 12));
    expect(schools[1].count).toBe(Math.round(20 / 12));

    const schools2023 = selectSchoolCounts(sample, 2023);
    expect(schools2023[0].count).toBe(150);

    const types = selectStudentTypeCounts(sample);
    const ftic = types.find((record) => record.type === 'FTIC');
    expect(ftic?.count).toBe(Math.round(180 / 12));

    const types2023 = selectStudentTypeCounts(sample, 2023);
    const ftic2023 = types2023.find((record) => record.type === 'FTIC');
    expect(ftic2023?.count).toBe(100);
  });

  test('selectTrendSeries produces ordered period labels', () => {
    const sample: AnalyticsRecord[] = [
      {
        year: 2023,
        semester: 'Spring',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 10,
      },
      {
        year: 2023,
        semester: 'Fall',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 20,
      },
    ];

    const trend = selectTrendSeries(sample);
    expect(trend).toEqual([
      { period: 'Fall 2023', year: 2023, semester: 1, total: 20 },
      { period: 'Spring 2023', year: 2023, semester: 2, total: 10 },
    ]);
  });

  test('selectTrendSeries sorts across multiple years', () => {
    const sample: AnalyticsRecord[] = [
      {
        year: 2024,
        semester: 'Spring',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 30,
      },
      {
        year: 2023,
        semester: 'Fall',
        major: 'Biology',
        school: 'Science',
        studentType: 'Transfer',
        count: 20,
      },
    ];

    const trend = selectTrendSeries(sample);
    expect(trend[0]).toEqual({
      period: 'Fall 2023',
      year: 2023,
      semester: 1,
      total: 20,
    });
    expect(trend[1]).toEqual({
      period: 'Spring 2024',
      year: 2024,
      semester: 2,
      total: 30,
    });
  });

  test('selectTrendSeries aggregates duplicate semester keys and defaults unknown semesters to Spring order', () => {
    const sample = [
      {
        year: 2024,
        semester: 'Fall',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 10,
      },
      {
        year: 2024,
        semester: 'Fall',
        major: 'Biology',
        school: 'Science',
        studentType: 'Transfer',
        count: 5,
      },
      {
        year: 2024,
        semester: 'Winter',
        major: 'Biology',
        school: 'Science',
        studentType: 'Transfer',
        count: 7,
      },
    ] as unknown as AnalyticsRecord[];

    const trend = selectTrendSeries(sample);
    expect(trend).toEqual([
      { period: 'Fall 2024', year: 2024, semester: 1, total: 15 },
      { period: 'Spring 2024', year: 2024, semester: 2, total: 7 },
    ]);
  });

  test('selectForecastSeries builds 4 forecast points', () => {
    const historical = [
      { period: 'Fall 2023', year: 2023, semester: 1, total: 100 },
      { period: 'Spring 2024', year: 2024, semester: 2, total: 110 },
      { period: 'Fall 2024', year: 2024, semester: 1, total: 120 },
      { period: 'Spring 2025', year: 2025, semester: 2, total: 130 },
    ];
    const forecast = selectForecastSeries(historical);
    expect(forecast).toHaveLength(4);
    expect(forecast.every((point) => point.isForecasted)).toBe(true);
    expect(forecast[0].period).toContain('Fall');
  });

  test('selectForecastSeries returns empty for no historical data', () => {
    expect(selectForecastSeries([])).toEqual([]);
  });

  test('selectSnapshotForDate uses semester data or falls back to latest', () => {
    const data: AnalyticsRecord[] = [
      {
        year: 2024,
        semester: 'Spring',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 10,
      },
      {
        year: 2023,
        semester: 'Fall',
        major: 'Chemistry',
        school: 'Science',
        studentType: 'Transfer',
        count: 5,
      },
    ];

    const springSnapshot = selectSnapshotForDate(data, new Date('2024-03-01'));
    expect(springSnapshot).toHaveLength(1);
    expect(springSnapshot[0].year).toBe(2024);

    const fallback = selectSnapshotForDate(data, new Date('2025-10-01'));
    expect(fallback).toHaveLength(1);
    expect(fallback[0].year).toBe(2024);
  });

  test('selectSnapshotForDate fallback prefers latest Fall records when available', () => {
    const data: AnalyticsRecord[] = [
      {
        year: 2024,
        semester: 'Fall',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 50,
      },
      {
        year: 2024,
        semester: 'Spring',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 10,
      },
    ];

    const fallback = selectSnapshotForDate(data, new Date('2025-03-01'));
    expect(fallback).toHaveLength(1);
    expect(fallback[0].semester).toBe('Fall');
    expect(fallback[0].count).toBe(50);
  });

  test('selectSnapshotForDate returns empty array for empty data', () => {
    expect(selectSnapshotForDate([], new Date('2025-10-01'))).toEqual([]);
  });

  test('selectSnapshotTotals computes totals and international count', () => {
    const data: AnalyticsRecord[] = [
      {
        year: 2024,
        semester: 'Fall',
        major: 'Biology',
        school: 'Science',
        studentType: 'FTIC',
        count: 100,
      },
      {
        year: 2024,
        semester: 'Fall',
        major: 'Chemistry',
        school: 'Science',
        studentType: 'Dual Enrollment',
        count: 20,
      },
      {
        year: 2024,
        semester: 'Fall',
        major: 'Biology',
        school: 'Science',
        studentType: 'Transfer',
        count: 30,
      },
    ];

    const totals = selectSnapshotTotals(data);
    expect(totals.total).toBe(150);
    expect(totals.undergrad).toBe(130);
    expect(totals.ftic).toBe(100);
    expect(totals.transfer).toBe(30);
    expect(totals.international).toBe(Math.round(150 * 0.12));
  });
});
