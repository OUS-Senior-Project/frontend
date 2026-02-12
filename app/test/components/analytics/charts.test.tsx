import { render, screen } from '@testing-library/react';
import {
  MetricsTrendChart,
} from '@/features/metrics/components/charts/MetricsTrendChart';
import { MajorDistributionChart } from '@/features/metrics/components/charts/MajorDistributionChart';
import { StudentTypeDistributionChart } from '@/features/metrics/components/charts/StudentTypeDistributionChart';
import { SchoolDistributionChart } from '@/features/metrics/components/charts/SchoolDistributionChart';
import { ForecastSection } from '@/features/metrics/components/ForecastSection';
import {
  AvgCreditsByCohortChart,
  AvgCreditsByMajorChart,
  AvgGPAByCohortChart,
  AvgGPAByMajorChart,
} from '@/features/metrics/components/major-analytics-charts';
import type { MajorCohortRecord } from '@/features/metrics/types';

const trendData = [
  { period: 'Fall 2023', total: 1000 },
  { period: 'Spring 2024', total: 1100 },
];

const forecastData = [
  { period: 'Fall 2024', total: 1200, isForecasted: true },
];

const majorData = [
  { major: 'Biology', count: 200 },
  { major: 'Chemistry', count: 150 },
];

const schoolData = [
  { school: 'College of Arts & Sciences', count: 300 },
  { school: 'School of Business', count: 200 },
];

const typeData = [
  { type: 'FTIC', count: 400 },
  { type: 'Transfer', count: 200 },
  { type: 'Other', count: 50 },
];

const cohortData: MajorCohortRecord[] = [
  {
    major: 'Biology',
    cohort: 'FTIC 2021',
    avgGPA: 3.1,
    avgCredits: 12,
    studentCount: 100,
  },
  {
    major: 'Biology',
    cohort: 'FTIC 2022',
    avgGPA: 3.2,
    avgCredits: 14,
    studentCount: 80,
  },
  {
    major: 'Chemistry',
    cohort: 'FTIC 2021',
    avgGPA: 2.9,
    avgCredits: 13,
    studentCount: 50,
  },
];

describe('analytics charts', () => {
  test('AnalyticsTrendChart renders with and without forecasts', () => {
    const { rerender } = render(<MetricsTrendChart data={trendData} />);
    expect(
      screen.getByText('Student Trends Over Time')
    ).toBeInTheDocument();
    expect(screen.queryByText('Forecasted')).not.toBeInTheDocument();

    rerender(
      <MetricsTrendChart data={trendData} forecastData={forecastData} />
    );
    expect(screen.getByText('Forecasted')).toBeInTheDocument();
  });

  test('Major and student charts render', () => {
    render(<MajorDistributionChart data={majorData} />);
    expect(screen.getByText('Students by Major')).toBeInTheDocument();

    render(<StudentTypeDistributionChart data={typeData} />);
    expect(
      screen.getByText('Student Type Distribution')
    ).toBeInTheDocument();

    render(<SchoolDistributionChart data={schoolData} />);
    expect(
      screen.getByText('Students by School/College')
    ).toBeInTheDocument();
  });

  test('ForecastSection and analytics charts render', () => {
    render(
      <ForecastSection historicalData={trendData} forecastData={forecastData} />
    );
    expect(screen.getByText('Student Forecast')).toBeInTheDocument();
    expect(screen.getByText('Projected Growth')).toBeInTheDocument();

    render(<ForecastSection historicalData={[]} forecastData={[]} />);
    expect(screen.getAllByText('Student Forecast').length).toBeGreaterThan(1);

    render(<AvgGPAByMajorChart data={cohortData} />);
    render(<AvgCreditsByMajorChart data={cohortData} />);
    render(<AvgGPAByCohortChart data={cohortData} />);
    render(<AvgCreditsByCohortChart data={cohortData} />);

    expect(
      screen.getByText('Average GPA by Major')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Average Credits Earned by Major')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Average GPA by Major and FTIC Cohort')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Average Credits Earned by Major and FTIC Cohort')
    ).toBeInTheDocument();
  });
});
