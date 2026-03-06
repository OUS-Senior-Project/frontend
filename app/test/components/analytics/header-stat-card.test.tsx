import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { MetricsSummaryCard } from '@/features/metrics/components/MetricsSummaryCard';
import { ActiveMajorsBreakdownModal } from '@/features/metrics/components/ActiveMajorsBreakdownModal';
import { AnalyticsBreakdownModal } from '@/features/metrics/components/AnalyticsBreakdownModal';
import { SchoolsBreakdownModal } from '@/features/metrics/components/SchoolsBreakdownModal';
import { Users } from 'lucide-react';

describe('analytics header and stat card', () => {
  test('renders header content', () => {
    render(<DashboardHeader />);
    expect(screen.getByText('OUS Analytics')).toBeInTheDocument();
    expect(
      screen.getByText('Howard University OUS Office')
    ).toBeInTheDocument();
  });

  test('stat card handles change states and click interactions', () => {
    const handleClick = jest.fn();
    const { rerender } = render(
      <MetricsSummaryCard
        title="Total Students"
        value={1234}
        icon={Users}
        description="Current data"
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(3);

    rerender(
      <MetricsSummaryCard
        title="Change Up"
        value="N/A"
        icon={Users}
        change={5}
      />
    );
    expect(screen.getByText('5.0%')).toBeInTheDocument();

    rerender(
      <MetricsSummaryCard
        title="Change Down"
        value={500}
        icon={Users}
        change={-2.5}
      />
    );
    expect(screen.getByText('2.5%')).toBeInTheDocument();

    rerender(
      <MetricsSummaryCard
        title="No Change"
        value={0}
        icon={Users}
        change={0}
      />
    );
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  test('breakdown modal renders metrics', () => {
    render(
      <AnalyticsBreakdownModal
        open={true}
        onOpenChange={jest.fn()}
        dateLabel="Jan 1, 2024"
        data={{
          total: 1000,
          undergrad: 900,
        }}
        undergraduateBreakdown={[
          {
            studentType: 'FTIC',
            total: 400,
            international: 120,
            nonInternational: 280,
          },
          {
            studentType: 'Transfer',
            total: 200,
            international: 20,
            nonInternational: 180,
          },
          {
            studentType: 'Continuing',
            total: 300,
            international: 10,
            nonInternational: 290,
          },
        ]}
        undergraduateBreakdownInsights={[
          {
            studentType: 'FTIC',
            total: 400,
            shareOfUndergradPct: 44.4,
            international: 120,
            nonInternational: 280,
            avgCumulativeGPA: 3.1,
            avgCumulativeCreditsEarned: 18.4,
            topMajors: [
              { label: 'Biology', count: 120, pctOfGroup: 30 },
              { label: 'Computer Science', count: 90, pctOfGroup: 22.5 },
            ],
            topSchools: [
              { label: 'College of Arts & Sciences', count: 180, pctOfGroup: 45 },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText('Student Breakdown')).toBeInTheDocument();
    expect(
      screen.queryByText('Undergraduate Students')
    ).not.toBeInTheDocument();
    expect(screen.getByText('FTIC Students')).toBeInTheDocument();
    expect(screen.getByText('International: 120')).toBeInTheDocument();
    expect(screen.getByText(/Top majors: Biology/)).toBeInTheDocument();
  });

  test('active majors breakdown modal renders insight sections', () => {
    render(
      <ActiveMajorsBreakdownModal
        open={true}
        onOpenChange={jest.fn()}
        activeMajors={3}
        dateLabel="Jan 1, 2024"
        activeMajorInsights={[
          {
            major: 'Computer Science',
            total: 80,
            shareOfActivePct: 40,
            international: 4,
            nonInternational: 76,
            internationalPct: 5,
            avgCumulativeGPA: 3.12,
            avgCumulativeCreditsEarned: 61.2,
            topSchools: [
              { label: 'College of Engineering', count: 80, pctOfGroup: 100 },
            ],
            studentTypeMix: [
              { label: 'Continuing', count: 70, pctOfGroup: 87.5 },
            ],
          },
          {
            major: 'Biology',
            total: 60,
            shareOfActivePct: 30,
            international: 3,
            nonInternational: 57,
            internationalPct: 5,
            avgCumulativeGPA: 3.01,
            avgCumulativeCreditsEarned: 59.4,
            topSchools: [
              { label: 'College of Arts & Sciences', count: 60, pctOfGroup: 100 },
            ],
            studentTypeMix: [{ label: 'Transfer', count: 20, pctOfGroup: 33.3 }],
          },
        ]}
      />
    );

    expect(screen.getByText('Active Majors Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Top Active Majors')).toBeInTheDocument();
    expect(screen.getAllByText('Computer Science').length).toBeGreaterThan(0);
    expect(screen.getByText(/Top 3 majors account for/)).toBeInTheDocument();
  });

  test('schools breakdown modal renders school cards', () => {
    render(
      <SchoolsBreakdownModal
        open={true}
        onOpenChange={jest.fn()}
        activeSchools={2}
        dateLabel="Jan 1, 2024"
        schoolInsights={[
          {
            school: 'College of Arts & Sciences',
            total: 300,
            shareOfUndergradPct: 45,
            international: 8,
            nonInternational: 292,
            internationalPct: 2.7,
            avgCumulativeGPA: 3.02,
            avgCumulativeCreditsEarned: 62.1,
            activeMajorsCount: 20,
            topMajors: [{ label: 'Biology', count: 50, pctOfGroup: 16.7 }],
            studentTypeMix: [{ label: 'Continuing', count: 290, pctOfGroup: 96.7 }],
          },
        ]}
      />
    );

    expect(screen.getByText('Schools/Colleges Breakdown')).toBeInTheDocument();
    expect(screen.getByText('College of Arts & Sciences')).toBeInTheDocument();
    expect(screen.getByText(/Active majors: 20/)).toBeInTheDocument();
    expect(screen.getByText(/Top major: Biology/)).toBeInTheDocument();
  });
});
