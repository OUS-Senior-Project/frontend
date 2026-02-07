import { render, screen, fireEvent } from '@testing-library/react';

const selectedDate = new Date(2024, 1, 2);

jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect?: (date?: Date) => void }) => {
    onSelect?.(undefined);
    onSelect?.(selectedDate);
    return <div data-testid="calendar" />;
  },
}));

import { DatePickerButton } from '@/components/analytics/date-picker-button';

describe('DatePickerButton', () => {
  test('renders selected date and forwards valid selection', () => {
    const handleChange = jest.fn();
    render(
      <DatePickerButton
        date={new Date(2024, 0, 1)}
        onDateChange={handleChange}
      />
    );

    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select data date' }));
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(selectedDate);
  });
});
