import { render } from '@testing-library/react';
import { Calendar, CalendarDayButton } from '@/shared/ui/calendar';

describe('Calendar', () => {
  test('renders with different caption layouts', () => {
    render(<Calendar />);
    render(<Calendar captionLayout="label" />);
    render(<Calendar captionLayout="dropdown" />);
  });

  test('CalendarDayButton focuses when modifier focused', () => {
    const focusSpy = jest
      .spyOn(HTMLButtonElement.prototype, 'focus')
      .mockImplementation(() => {});

    render(
      <CalendarDayButton
        day={{ date: new Date('2024-01-01') } as any}
        modifiers={{
          focused: true,
          selected: true,
          range_start: false,
          range_end: false,
          range_middle: false,
        } as any}
      />
    );

    render(
      <CalendarDayButton
        day={{ date: new Date('2024-01-02') } as any}
        modifiers={{
          focused: false,
          selected: false,
          range_start: false,
          range_end: false,
          range_middle: false,
        } as any}
      />
    );

    expect(focusSpy).toHaveBeenCalled();
    focusSpy.mockRestore();
  });
});
