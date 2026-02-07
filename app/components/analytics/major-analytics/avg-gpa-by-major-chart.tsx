'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MajorCohortRecord } from '@/types/analytics';
import { MajorAnalyticsChartCard } from './chart-card';
import { chartTooltipStyle, majorChartColors } from './chart-theme';
import { selectWeightedGpaByMajor } from './selectors';

interface MajorAnalyticsChartsProps {
  data: MajorCohortRecord[];
}

export function AvgGPAByMajorChart({ data }: MajorAnalyticsChartsProps) {
  const chartData = useMemo(() => selectWeightedGpaByMajor(data), [data]);

  return (
    <MajorAnalyticsChartCard
      title="Average GPA by Major"
      subtitle="Weighted average across all cohorts"
    >
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.28 0.01 260)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 4]}
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <YAxis
              dataKey="major"
              type="category"
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={130}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value: number) => [value.toFixed(2), 'Avg GPA']}
            />
            <Bar dataKey="avgGPA" radius={[0, 4, 4, 0]}>
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
    </MajorAnalyticsChartCard>
  );
}
