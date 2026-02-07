import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/analytics/header';
import { StatCard } from '@/components/analytics/stat-card';
import { AnalyticsBreakdownModal } from '@/components/analytics/analytics-breakdown-modal';
import { Users } from 'lucide-react';

describe('analytics header and stat card', () => {
  test('renders header content', () => {
    render(<Header />);
    expect(screen.getByText('OUS Analytics')).toBeInTheDocument();
    expect(
      screen.getByText('OUS Analytics Dashboard')
    ).toBeInTheDocument();
  });

  test('stat card handles change states and click interactions', () => {
    const handleClick = jest.fn();
    const { rerender } = render(
      <StatCard
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
      <StatCard
        title="Change Up"
        value="N/A"
        icon={Users}
        change={5}
      />
    );
    expect(screen.getByText('5.0%')).toBeInTheDocument();

    rerender(
      <StatCard
        title="Change Down"
        value={500}
        icon={Users}
        change={-2.5}
      />
    );
    expect(screen.getByText('2.5%')).toBeInTheDocument();

    rerender(
      <StatCard
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
          ftic: 400,
          transfer: 200,
          international: 120,
        }}
      />
    );

    expect(screen.getByText('Student Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Undergraduate Students')).toBeInTheDocument();
    expect(screen.getByText('International Students')).toBeInTheDocument();
  });
});
