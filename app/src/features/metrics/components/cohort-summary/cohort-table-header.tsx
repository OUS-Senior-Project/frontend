import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import type { SortKey } from './use-cohort-summary-table';

interface CohortTableHeaderProps {
  onSort: (key: SortKey) => void;
}

function SortButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="ml-auto flex h-auto bg-transparent p-0 text-xs font-medium text-foreground hover:text-foreground"
      onClick={onClick}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );
}

export function CohortTableHeader({ onSort }: CohortTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="border-border hover:bg-transparent">
        <TableHead>
          <Button
            variant="ghost"
            className="h-auto bg-transparent p-0 text-xs font-medium text-foreground hover:text-foreground"
            onClick={() => onSort('major')}
          >
            Major
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        </TableHead>
        <TableHead className="text-right">
          <SortButton label="Avg GPA" onClick={() => onSort('avgGPA')} />
        </TableHead>
        <TableHead className="text-right">
          <SortButton
            label="Avg Credits"
            onClick={() => onSort('avgCredits')}
          />
        </TableHead>
        <TableHead className="text-right">
          <SortButton label="Students" onClick={() => onSort('studentCount')} />
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
