import {
  selectCohortLabels,
  selectCohortRowsByMajor,
  selectWeightedCreditsByMajor,
  selectWeightedGpaByMajor,
} from '@/features/metrics/components/major-analytics/selectors';
import {
  chartTooltipStyle,
  cohortColors,
  getCohortColor,
  majorChartColors,
} from '@/features/metrics/components/major-analytics/chart-theme';

const sample = [
  {
    major: 'Biology',
    cohort: 'FTIC 2024',
    avgGPA: 3.2,
    avgCredits: 16,
    studentCount: 100,
  },
  {
    major: 'Biology',
    cohort: 'Transfer 2024',
    avgGPA: 2.9,
    avgCredits: 14,
    studentCount: 20,
  },
  {
    major: 'Chemistry',
    cohort: 'FTIC 2023',
    avgGPA: 3.4,
    avgCredits: 18,
    studentCount: 80,
  },
  {
    major: 'Chemistry',
    cohort: 'Legacy Cohort',
    avgGPA: 3.1,
    avgCredits: 12,
    studentCount: 10,
  },
];

describe('major analytics selectors', () => {
  test('selectCohortLabels sorts by year descending then label', () => {
    expect(selectCohortLabels(sample)).toEqual([
      'Transfer 2024',
      'FTIC 2024',
      'FTIC 2023',
      'Legacy Cohort',
    ]);
  });

  test('weighted selectors aggregate by major', () => {
    const gpa = selectWeightedGpaByMajor(sample);
    expect(gpa[0]).toEqual({ major: 'Chemistry', avgGPA: 3.37 });

    const credits = selectWeightedCreditsByMajor(sample);
    expect(credits[0]).toEqual({ major: 'Chemistry', avgCredits: 17 });
  });

  test('weighted selectors handle null GPA and credits as zero', () => {
    const withNullMetrics = [
      {
        major: 'Math',
        cohort: 'FTIC 2024',
        avgGPA: null,
        avgCredits: null,
        studentCount: 10,
      },
      {
        major: 'Math',
        cohort: 'Transfer 2024',
        avgGPA: 3.0,
        avgCredits: 12,
        studentCount: 5,
      },
    ];

    const gpa = selectWeightedGpaByMajor(withNullMetrics);
    const credits = selectWeightedCreditsByMajor(withNullMetrics);

    expect(gpa).toEqual([{ major: 'Math', avgGPA: 1 }]);
    expect(credits).toEqual([{ major: 'Math', avgCredits: 4 }]);
  });

  test('selectCohortRowsByMajor includes missing cohort metrics as zero', () => {
    const rows = selectCohortRowsByMajor(sample, 'avgCredits');
    const chemistry = rows.find((row) => row.major === 'Chemistry');

    expect(chemistry?.['Transfer 2024']).toBe(0);
    expect(chemistry?.['FTIC 2023']).toBe(18);
  });

  test('selectCohortRowsByMajor supports avgGPA metric and null fallback values', () => {
    const withNulls = [
      ...sample,
      {
        major: 'Math',
        cohort: 'FTIC 2024',
        avgGPA: null,
        avgCredits: 9,
        studentCount: 5,
      },
    ];
    const rows = selectCohortRowsByMajor(withNulls, 'avgGPA');
    const math = rows.find((row) => row.major === 'Math');

    expect(math?.['FTIC 2024']).toBe(0);
    expect(math?.['Transfer 2024']).toBe(0);
  });

  test('getCohortColor uses fixed color when known and fallback palette when unknown', () => {
    expect(getCohortColor('FTIC 2024', 3)).toBe('oklch(0.60 0.22 25)');
    expect(getCohortColor('Custom Cohort', 11)).toBe(
      majorChartColors[11 % majorChartColors.length]
    );
  });

  test('chart theme constants are exported for tooltip and legacy cohorts', () => {
    expect(cohortColors['FTIC 2021']).toBe('oklch(0.65 0.20 250)');
    expect(chartTooltipStyle).toEqual({
      backgroundColor: 'oklch(0.18 0.01 260)',
      border: '1px solid oklch(0.28 0.01 260)',
      borderRadius: '8px',
      color: 'oklch(0.95 0 0)',
    });
  });
});
