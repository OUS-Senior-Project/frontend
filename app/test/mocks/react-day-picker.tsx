import * as React from 'react';

export const getDefaultClassNames = () => ({
  root: 'rdp-root',
  months: 'rdp-months',
  month: 'rdp-month',
  nav: 'rdp-nav',
  button_previous: 'rdp-button-previous',
  button_next: 'rdp-button-next',
  month_caption: 'rdp-month-caption',
  dropdowns: 'rdp-dropdowns',
  dropdown_root: 'rdp-dropdown-root',
  dropdown: 'rdp-dropdown',
  caption_label: 'rdp-caption-label',
  table: 'rdp-table',
  weekdays: 'rdp-weekdays',
  weekday: 'rdp-weekday',
  week: 'rdp-week',
  week_number_header: 'rdp-week-number-header',
  week_number: 'rdp-week-number',
  day: 'rdp-day',
  range_start: 'rdp-range-start',
  range_middle: 'rdp-range-middle',
  range_end: 'rdp-range-end',
  today: 'rdp-today',
  outside: 'rdp-outside',
  disabled: 'rdp-disabled',
  hidden: 'rdp-hidden',
});

export const DayButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
  ({ children, ...props }, ref) => (
    <button ref={ref} {...props}>
      {children}
    </button>
  )
);
DayButton.displayName = 'DayButton';

export function DayPicker({
  className,
  components,
  formatters,
}: React.ComponentProps<'div'> & {
  components?: Record<string, React.ComponentType<any>>;
  formatters?: Record<string, (...args: any[]) => unknown>;
}) {
  if (formatters?.formatMonthDropdown) {
    formatters.formatMonthDropdown(new Date(2024, 0, 1));
  }

  const Root = components?.Root as React.ComponentType<any> | undefined;
  const Chevron = components?.Chevron as React.ComponentType<any> | undefined;
  const WeekNumber = components?.WeekNumber as React.ComponentType<any> | undefined;
  const DayButtonComponent = components?.DayButton as React.ComponentType<any> | undefined;

  const inner = (
    <div data-testid="day-picker" className={className}>
      {Chevron ? (
        <>
          <Chevron orientation="left" />
          <Chevron orientation="right" />
          <Chevron orientation="down" />
        </>
      ) : null}
      {WeekNumber ? (
        <table>
          <tbody>
            <tr>
              <WeekNumber>1</WeekNumber>
            </tr>
          </tbody>
        </table>
      ) : null}
      {DayButtonComponent ? (
        <DayButtonComponent
          day={{ date: new Date(2024, 0, 1) }}
          modifiers={{
            selected: true,
            range_start: false,
            range_end: false,
            range_middle: false,
            focused: true,
          }}
        />
      ) : null}
    </div>
  );

  if (!Root) {
    return inner;
  }

  const rootRef = React.createRef<HTMLDivElement>();

  return (
    <Root className={className} rootRef={rootRef}>
      {inner}
    </Root>
  );
}
