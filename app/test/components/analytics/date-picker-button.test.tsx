import { render, screen, fireEvent } from '@testing-library/react';

const selectedDate = new Date(2024, 1, 2);
let lastCalendarProps:
  | {
      onSelect?: (date?: Date) => void;
      disabled?: ((date: Date) => boolean) | undefined;
      selected?: Date;
    }
  | null = null;

jest.mock('@/shared/ui/calendar', () => ({
  Calendar: ({
    onSelect,
    disabled,
    selected,
  }: {
    onSelect?: (date?: Date) => void;
    disabled?: (date: Date) => boolean;
    selected?: Date;
  }) => {
    lastCalendarProps = { onSelect, disabled, selected };
    onSelect?.(undefined);
    onSelect?.(selectedDate);
    return <div data-testid="calendar" />;
  },
}));

import { DateFilterButton } from '@/features/filters/components/DateFilterButton';

describe('DateFilterButton', () => {
  beforeEach(() => {
    lastCalendarProps = null;
  });

  test('renders selected date and forwards valid selection', () => {
    const handleChange = jest.fn();
    render(
      <DateFilterButton
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

  test('renders placeholder and restricts calendar selection to available dates', () => {
    render(
      <DateFilterButton
        date={null}
        onDateChange={jest.fn()}
        availableDates={[new Date(2024, 0, 1)]}
      />
    );

    expect(screen.getByText('Select date')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Select data date' }));
    expect(screen.getByTestId('calendar')).toBeInTheDocument();

    expect(lastCalendarProps?.selected).toBeUndefined();
    expect(lastCalendarProps?.disabled).toEqual(expect.any(Function));
    expect(lastCalendarProps?.disabled?.(new Date(2024, 0, 1))).toBe(false);
    expect(lastCalendarProps?.disabled?.(new Date(2024, 0, 2))).toBe(true);
  });

  test('passes button disabled state through', () => {
    render(
      <DateFilterButton
        date={null}
        onDateChange={jest.fn()}
        disabled={true}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Select data date' })
    ).toBeDisabled();
  });
});
