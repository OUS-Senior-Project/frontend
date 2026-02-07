'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';

interface DateFilterButtonProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DateFilterButton({
  date,
  onDateChange,
}: DateFilterButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-transparent"
          aria-label="Select data date"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) onDateChange(d);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
