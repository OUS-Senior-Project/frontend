'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Users, GraduationCap, ArrowRightLeft, Globe } from 'lucide-react';

interface BreakdownData {
  total: number;
  undergrad: number;
  ftic: number;
  transfer: number;
  international: number;
}

interface AnalyticsBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BreakdownData;
  dateLabel: string;
}

const metrics = [
  { key: 'undergrad' as const, label: 'Undergraduate Students', icon: Users },
  { key: 'ftic' as const, label: 'FTIC Students', icon: GraduationCap },
  {
    key: 'transfer' as const,
    label: 'Transfer Students',
    icon: ArrowRightLeft,
  },
  {
    key: 'international' as const,
    label: 'International Students',
    icon: Globe,
  },
];

export function AnalyticsBreakdownModal({
  open,
  onOpenChange,
  data,
  dateLabel,
}: AnalyticsBreakdownModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enrollment Breakdown</DialogTitle>
          <DialogDescription>
            Detailed student composition for the selected data date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className="flex items-center justify-between rounded-lg bg-secondary/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <metric.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {metric.label}
                </span>
              </div>
              <span className="text-lg font-bold text-foreground">
                {data[metric.key].toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Counts reflect selected Data Date: {dateLabel}
        </p>
      </DialogContent>
    </Dialog>
  );
}
