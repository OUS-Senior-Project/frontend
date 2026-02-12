'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MajorCohortRecord } from '@/features/metrics/types';
import { MajorAnalyticsChartCard } from './chart-card';
import { chartTooltipStyle, getCohortColor } from './chart-theme';
import { selectCohortLabels, selectCohortRowsByMajor } from './selectors';

interface MajorAnalyticsChartsProps {
  data: MajorCohortRecord[];
}

export function AvgCreditsByCohortChart({ data }: MajorAnalyticsChartsProps) {
  const cohorts = useMemo(() => selectCohortLabels(data), [data]);
  const chartData = useMemo(
    () => selectCohortRowsByMajor(data, 'avgCredits'),
    [data]
  );
  const chartHeight = Math.max(500, chartData.length * 52);

  return (
    <MajorAnalyticsChartCard
      title="Average Credits Earned by Major and FTIC Cohort"
      subtitle="Comparison across cohort years"
    >
      <div className="flex items-center gap-4 pb-3">
        {cohorts.map((cohort) => (
          <div key={cohort} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: getCohortColor(
                  cohort,
                  cohorts.indexOf(cohort)
                ),
              }}
            />
            <span className="text-xs text-muted-foreground">{cohort}</span>
          </div>
        ))}
      </div>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            barCategoryGap="20%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.28 0.01 260)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <YAxis
              dataKey="major"
              type="category"
              tick={{ fill: 'oklch(0.85 0 0)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={150}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value: number, name: string) => [value, name]}
            />
            {cohorts.map((cohort) => (
              <Bar
                key={cohort}
                dataKey={cohort}
                fill={getCohortColor(cohort, cohorts.indexOf(cohort))}
                radius={[0, 3, 3, 0]}
                barSize={10}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </MajorAnalyticsChartCard>
  );
}
