'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui/button';
import { CalendarDayButton } from './calendar-day-button';
import { getCalendarClassNames, getCalendarComponents, getCalendarFormatters } from './calendar-config';

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & { buttonVariant?: React.ComponentProps<typeof Button>['variant'] }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent', String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`, String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`, className)}
      captionLayout={captionLayout}
      formatters={getCalendarFormatters(formatters)}
      classNames={getCalendarClassNames({ classNames, captionLayout, buttonVariant })}
      components={getCalendarComponents(components)}
      {...props}
    />
  );
}

export { CalendarDayButton };
