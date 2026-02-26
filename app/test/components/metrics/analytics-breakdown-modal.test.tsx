import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsBreakdownModal } from '@/features/metrics/components/AnalyticsBreakdownModal';

const sampleData = {
  total: 5200,
  undergrad: 4100,
  ftic: 1800,
  transfer: 950,
  international: 620,
};

describe('AnalyticsBreakdownModal', () => {
  test('renders all breakdown categories with correct values when open', () => {
    render(
      <AnalyticsBreakdownModal
        open={true}
        onOpenChange={jest.fn()}
        data={sampleData}
        dateLabel="February 11, 2026"
      />
    );

    expect(screen.getByText('Enrollment Breakdown')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Detailed student composition for the selected data date.'
      )
    ).toBeInTheDocument();

    expect(screen.getByText('Undergraduate Students')).toBeInTheDocument();
    expect(screen.getByText('4,100')).toBeInTheDocument();

    expect(screen.getByText('FTIC Students')).toBeInTheDocument();
    expect(screen.getByText('1,800')).toBeInTheDocument();

    expect(screen.getByText('Transfer Students')).toBeInTheDocument();
    expect(screen.getByText('950')).toBeInTheDocument();

    expect(screen.getByText('International Students')).toBeInTheDocument();
    expect(screen.getByText('620')).toBeInTheDocument();

    expect(
      screen.getByText('Counts reflect selected Data Date: February 11, 2026')
    ).toBeInTheDocument();
  });

  test('does not render content when closed', () => {
    render(
      <AnalyticsBreakdownModal
        open={false}
        onOpenChange={jest.fn()}
        data={sampleData}
        dateLabel="February 11, 2026"
      />
    );

    expect(screen.queryByText('Enrollment Breakdown')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Undergraduate Students')
    ).not.toBeInTheDocument();
  });

  test('calls onOpenChange when close button is clicked', () => {
    const onOpenChange = jest.fn();

    render(
      <AnalyticsBreakdownModal
        open={true}
        onOpenChange={onOpenChange}
        data={sampleData}
        dateLabel="February 11, 2026"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('renders zero values correctly', () => {
    const zeroData = {
      total: 0,
      undergrad: 0,
      ftic: 0,
      transfer: 0,
      international: 0,
    };

    render(
      <AnalyticsBreakdownModal
        open={true}
        onOpenChange={jest.fn()}
        data={zeroData}
        dateLabel="January 1, 2026"
      />
    );

    const zeroValues = screen.getAllByText('0');
    expect(zeroValues).toHaveLength(4);
  });
});
