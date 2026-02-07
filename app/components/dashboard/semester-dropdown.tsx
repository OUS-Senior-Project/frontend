'use client';

import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { semesters } from '@/lib/enrollment-data';

interface SemesterDropdownProps {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
}

export function SemesterDropdown({
  value,
  onValueChange,
}: SemesterDropdownProps) {
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
          {semesters.map((sem) => (
            <SelectItem key={sem} value={sem}>
              {sem}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
