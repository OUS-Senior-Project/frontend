'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MajorCohortRecord } from '@/lib/analytics-data';
import { cohorts } from '@/lib/analytics-data';

interface CohortSummaryTableProps {
  data: MajorCohortRecord[];
}

type SortKey = 'major' | 'avgGPA' | 'avgCredits' | 'studentCount';

export function CohortSummaryTable({ data }: CohortSummaryTableProps) {
  const [selectedCohort, setSelectedCohort] = useState('FTIC 2024');
  const [sortKey, setSortKey] = useState<SortKey>('studentCount');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredData = useMemo(() => {
    const cohortData = data.filter((d) => d.cohort === selectedCohort);
    return [...cohortData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, selectedCohort, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'major');
    }
  };

  const totalStudents = filteredData.reduce(
    (sum, d) => sum + d.studentCount,
    0
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium text-foreground">
          Major Level Summary by FTIC Cohort
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          GPA, credits, and student counts by major for each FTIC cohort
        </p>

        <div
          className="mt-3 flex gap-1 rounded-lg bg-secondary p-1"
          role="tablist"
          aria-label="Select FTIC cohort"
        >
          {cohorts.map((cohort) => (
            <button
              key={cohort}
              role="tab"
              aria-selected={selectedCohort === cohort}
              onClick={() => setSelectedCohort(cohort)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCohort === cohort
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cohort}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 text-xs font-medium text-foreground hover:text-foreground bg-transparent"
                  onClick={() => handleSort('major')}
                >
                  Major
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="ml-auto flex h-auto p-0 text-xs font-medium text-foreground hover:text-foreground bg-transparent"
                  onClick={() => handleSort('avgGPA')}
                >
                  Avg GPA
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="ml-auto flex h-auto p-0 text-xs font-medium text-foreground hover:text-foreground bg-transparent"
                  onClick={() => handleSort('avgCredits')}
                >
                  Avg Credits
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="ml-auto flex h-auto p-0 text-xs font-medium text-foreground hover:text-foreground bg-transparent"
                  onClick={() => handleSort('studentCount')}
                >
                  Students
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.major} className="border-border">
                <TableCell className="text-sm font-medium text-foreground">
                  {row.major}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {row.avgGPA.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {row.avgCredits}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-foreground font-medium">
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
        </Table>
      </CardContent>
    </Card>
  );
}
