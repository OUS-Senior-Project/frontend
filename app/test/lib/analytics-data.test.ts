import {
  cohorts,
  generateAnalyticsData,
  generateForecastData,
  generateMajorCohortData,
  generateMigrationData,
  getDailySnapshot,
  getAnalyticsByMajor,
  getAnalyticsBySchool,
  getAnalyticsByStudentType,
  getSnapshotTotals,
  getTrendData,
  getYearlyAnalytics,
  majors,
  majorToSchool,
  schools,
  semesters,
  studentTypes,
  type AnalyticsRecord,
} from '@/lib/analytics-data';

describe('analytics-data', () => {
  test('generateAnalyticsData is deterministic and sized correctly', () => {
    const data = generateAnalyticsData();
    const dataAgain = generateAnalyticsData();

    expect(data).toHaveLength(6 * 2 * majors.length * studentTypes.length);
    expect(data[0]).toEqual(dataAgain[0]);
    expect(data[data.length - 1]).toEqual(dataAgain[dataAgain.length - 1]);
  });

  test('static lists and mappings are exported', () => {
    expect(schools.length).toBeGreaterThan(0);
    expect(majorToSchool.Biology).toBe('College of Arts & Sciences');
  });

  test('generateMigrationData sizes and semesters', () => {
    const data = generateMigrationData();
    expect(data).toHaveLength(semesters.length * 15);
    expect(new Set(data.map((d) => d.semester)).size).toBe(semesters.length);
  });

  test('generateMajorCohortData sizes and bounds', () => {
    const data = generateMajorCohortData();
    expect(data).toHaveLength(cohorts.length * majors.length);
    const sample = data[0];
    expect(sample.avgGPA).toBeGreaterThanOrEqual(2);
    expect(sample.avgGPA).toBeLessThanOrEqual(3.8);
    expect(sample.avgCredits).toBeGreaterThanOrEqual(3);
    expect(sample.avgCredits).toBeLessThanOrEqual(30);
    expect(sample.studentCount).toBeGreaterThanOrEqual(1);
  });

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
    ];

    const yearly = getYearlyAnalytics(sample);
    expect(yearly).toEqual([
      { year: 2023, total: Math.round(150 / 2) },
      { year: 2024, total: Math.round(80 / 2) },
    ]);

    const majorsAll = getAnalyticsByMajor(sample);
    expect(majorsAll[0].major).toBe('Biology');
    expect(majorsAll[0].count).toBe(Math.round(150 / 12));

    const majors2024 = getAnalyticsByMajor(sample, 2024);
    expect(majors2024).toEqual([{ major: 'Chemistry', count: 80 }]);

    const schools = getAnalyticsBySchool(sample);
    expect(schools[0].count).toBe(Math.round(230 / 12));

    const schools2023 = getAnalyticsBySchool(sample, 2023);
    expect(schools2023[0].count).toBe(150);

    const types = getAnalyticsByStudentType(sample);
    const ftic = types.find((t) => t.type === 'FTIC');
    expect(ftic?.count).toBe(Math.round(180 / 12));

    const types2023 = getAnalyticsByStudentType(sample, 2023);
    const ftic2023 = types2023.find((t) => t.type === 'FTIC');
    expect(ftic2023?.count).toBe(100);
  });

  test('getTrendData produces ordered period labels', () => {
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

    const trend = getTrendData(sample);
    expect(trend).toEqual([
      { period: 'Fall 2023', year: 2023, semester: 1, total: 20 },
      { period: 'Spring 2023', year: 2023, semester: 2, total: 10 },
    ]);
  });

  test('generateForecastData builds 4 forecast points', () => {
    const historical = [
      { period: 'Fall 2023', year: 2023, semester: 1, total: 100 },
      { period: 'Spring 2024', year: 2024, semester: 2, total: 110 },
      { period: 'Fall 2024', year: 2024, semester: 1, total: 120 },
      { period: 'Spring 2025', year: 2025, semester: 2, total: 130 },
    ];
    const forecast = generateForecastData(historical);
    expect(forecast).toHaveLength(4);
    expect(forecast.every((f) => f.isForecasted)).toBe(true);
    expect(forecast[0].period).toContain('Fall');
  });

  test('getDailySnapshot uses semester data or falls back to latest', () => {
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

    const springSnapshot = getDailySnapshot(data, new Date('2024-03-01'));
    expect(springSnapshot).toHaveLength(1);
    expect(springSnapshot[0].year).toBe(2024);

    const fallback = getDailySnapshot(data, new Date('2025-10-01'));
    expect(fallback).toHaveLength(1);
    expect(fallback[0].year).toBe(2024);
  });

  test('getSnapshotTotals computes totals and international count', () => {
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

    const totals = getSnapshotTotals(data);
    expect(totals.total).toBe(150);
    expect(totals.undergrad).toBe(130);
    expect(totals.ftic).toBe(100);
    expect(totals.transfer).toBe(30);
    expect(totals.international).toBe(Math.round(150 * 0.12));
  });
});
