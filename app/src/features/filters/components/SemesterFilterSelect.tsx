'use client';

import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

interface SemesterFilterSelectProps {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  options: string[];
}

export function SemesterFilterSelect({
  value,
  onValueChange,
  options,
}: SemesterFilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select
        value={value || 'all'}
        onValueChange={(v) => onValueChange(v === 'all' ? undefined : v)}
      >
        <SelectTrigger
          className="w-[160px] bg-secondary border-border"
          aria-label="Select semester"
        >
          <SelectValue placeholder="All Semesters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Semesters</SelectItem>
          {options.map((sem) => (
            <SelectItem key={sem} value={sem}>
              {sem}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
