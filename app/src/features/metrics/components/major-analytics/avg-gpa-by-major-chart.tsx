'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MajorCohortRecord } from '@/features/metrics/types';
import { MajorAnalyticsChartCard } from './chart-card';
import {
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
  majorChartColors,
} from './chart-theme';
import { selectWeightedGpaByMajor } from './selectors';

interface MajorAnalyticsChartsProps {
  data: MajorCohortRecord[];
}

function shortenMajorLabel(value: string, maxLength = 44) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function AvgGPAByMajorChart({ data }: MajorAnalyticsChartsProps) {
  const chartData = useMemo(
    () =>
      selectWeightedGpaByMajor(data)
        .slice(0, 12)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          shortMajor: shortenMajorLabel(entry.major),
        })),
    [data]
  );

  return (
    <MajorAnalyticsChartCard
      title="Average GPA by Major"
      subtitle="Weighted average across all cohorts"
    >
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 20, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.28 0.01 260)"
              vertical={false}
            />
            <XAxis
              dataKey="rank"
              tickFormatter={(value) => `#${value}`}
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <YAxis
              type="number"
              domain={[0, 4]}
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <ReferenceLine
              y={3}
              stroke="oklch(0.78 0.05 170)"
              strokeDasharray="4 4"
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelStyle={chartTooltipLabelStyle}
              itemStyle={chartTooltipItemStyle}
              formatter={(value: number) => [value.toFixed(2), 'Avg GPA']}
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.major ?? '')
              }
            />
            <Bar dataKey="avgGPA" radius={[6, 6, 0, 0]} maxBarSize={38}>
              {chartData.map((_, index) => (
                <Cell
                  key={`gpa-cell-${index}`}
                  fill={majorChartColors[index % majorChartColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 pt-4 sm:grid-cols-2">
        {chartData.map((entry) => (
          <div
            key={`avg-gpa-major-${entry.major}`}
            className="flex items-center justify-between rounded-md border border-border/80 bg-secondary/20 px-3 py-2 text-xs"
          >
            <span className="text-muted-foreground">
              #{entry.rank} {entry.shortMajor}
            </span>
            <span className="font-medium text-foreground">
              {entry.avgGPA.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </MajorAnalyticsChartCard>
  );
}
