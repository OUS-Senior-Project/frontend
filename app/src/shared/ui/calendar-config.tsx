'use client';

import type React from 'react';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { type DayPickerProps, getDefaultClassNames } from 'react-day-picker';
import { Button, buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/utils/cn';
import { CalendarDayButton } from './calendar-day-button';

export function getCalendarFormatters(
  formatters?: DayPickerProps['formatters']
): DayPickerProps['formatters'] {
  return {
    formatMonthDropdown: (date) =>
      date.toLocaleString('default', { month: 'short' }),
    ...formatters,
  };
}

export function getCalendarClassNames({
  classNames,
  captionLayout,
  buttonVariant,
}: {
  classNames?: DayPickerProps['classNames'];
  captionLayout: DayPickerProps['captionLayout'];
  buttonVariant: React.ComponentProps<typeof Button>['variant'];
}) {
  const defaults = getDefaultClassNames();
  return {
    root: cn('w-fit', defaults.root),
    months: cn('flex gap-4 flex-col md:flex-row relative', defaults.months),
    month: cn('flex flex-col w-full gap-4', defaults.month),
    nav: cn(
      'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between',
      defaults.nav
    ),
    button_previous: cn(
      buttonVariants({ variant: buttonVariant }),
      'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none',
      defaults.button_previous
    ),
    button_next: cn(
      buttonVariants({ variant: buttonVariant }),
      'size-(--cell-size) aria-disabled:opacity-50 p-0 select-none',
      defaults.button_next
    ),
    month_caption: cn(
      'flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)',
      defaults.month_caption
    ),
    dropdowns: cn(
      'w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5',
      defaults.dropdowns
    ),
    dropdown_root: cn(
      'relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md',
      defaults.dropdown_root
    ),
    dropdown: cn('absolute bg-popover inset-0 opacity-0', defaults.dropdown),
    caption_label: cn(
      'select-none font-medium',
      captionLayout === 'label'
        ? 'text-sm'
        : 'rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5',
      defaults.caption_label
    ),
    table: 'w-full border-collapse',
    weekdays: cn('flex', defaults.weekdays),
    weekday: cn(
      'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none',
      defaults.weekday
    ),
    week: cn('flex w-full mt-2', defaults.week),
    week_number_header: cn(
      'select-none w-(--cell-size)',
      defaults.week_number_header
    ),
    week_number: cn(
      'text-[0.8rem] select-none text-muted-foreground',
      defaults.week_number
    ),
    day: cn(
      'relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
      defaults.day
    ),
    range_start: cn('rounded-l-md bg-accent', defaults.range_start),
    range_middle: cn('rounded-none', defaults.range_middle),
    range_end: cn('rounded-r-md bg-accent', defaults.range_end),
    today: cn(
      'bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none',
      defaults.today
    ),
    outside: cn(
      'text-muted-foreground aria-selected:text-muted-foreground',
      defaults.outside
    ),
    disabled: cn('text-muted-foreground opacity-50', defaults.disabled),
    hidden: cn('invisible', defaults.hidden),
    ...classNames,
  };
}

export function getCalendarComponents(
  components?: DayPickerProps['components']
): DayPickerProps['components'] {
  return {
    Root: ({ className, rootRef, ...props }) => (
      <div
        data-slot="calendar"
        ref={rootRef}
        className={cn(className)}
        {...props}
      />
    ),
    Chevron: ({ className, orientation, ...props }) => {
      if (orientation === 'left')
        return (
          <ChevronLeftIcon className={cn('size-4', className)} {...props} />
        );
      if (orientation === 'right')
        return (
          <ChevronRightIcon className={cn('size-4', className)} {...props} />
        );
      return <ChevronDownIcon className={cn('size-4', className)} {...props} />;
    },
    DayButton: CalendarDayButton,
    WeekNumber: ({ children, ...props }) => (
      <td {...props}>
        <div className="flex size-(--cell-size) items-center justify-center text-center">
          {children}
        </div>
      </td>
    ),
    ...components,
  };
}
