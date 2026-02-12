import { TableBody, TableCell, TableRow } from '@/shared/ui/table';
import type { MajorCohortRecord } from '@/features/metrics/types';

interface CohortTableRowsProps {
  rows: MajorCohortRecord[];
  totalStudents: number;
}

export function CohortTableRows({ rows, totalStudents }: CohortTableRowsProps) {
  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.major} className="border-border">
          <TableCell className="text-sm font-medium text-foreground">
            {row.major}
          </TableCell>
          <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
            {(row.avgGPA ?? 0).toFixed(2)}
          </TableCell>
          <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
            {row.avgCredits ?? 0}
          </TableCell>
          <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">
            {row.studentCount.toLocaleString()}
          </TableCell>
        </TableRow>
      ))}
      <TableRow className="border-border bg-secondary/30">
        <TableCell className="text-sm font-semibold text-foreground">
          Total
        </TableCell>
        <TableCell className="text-right text-sm text-muted-foreground">
          &mdash;
        </TableCell>
        <TableCell className="text-right text-sm text-muted-foreground">
          &mdash;
        </TableCell>
        <TableCell className="text-right text-sm font-semibold tabular-nums text-foreground">
          {totalStudents.toLocaleString()}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}
