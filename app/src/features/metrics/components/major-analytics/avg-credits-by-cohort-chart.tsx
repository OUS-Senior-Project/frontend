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
import {
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
  getCohortColor,
} from './chart-theme';
import { selectCohortOptions, selectCohortRowsByMajor } from './selectors';

interface MajorAnalyticsChartsProps {
  data: MajorCohortRecord[];
}

type CohortChartRow = Record<string, string | number> & {
  major: string;
  rank: number;
  shortMajor: string;
};

export function AvgCreditsByCohortChart({ data }: MajorAnalyticsChartsProps) {
  const cohorts = useMemo(() => selectCohortOptions(data), [data]);
  const chartData = useMemo<CohortChartRow[]>(() => {
    return selectCohortRowsByMajor(data, 'avgCredits', 12).map((row) => {
      const major = String(row.major);
      const rank = Number(row.rank);

      return {
        ...row,
        major,
        rank,
        shortMajor:
          major.length > 44 ? `${major.slice(0, 43).trimEnd()}…` : major,
      };
    });
  }, [data]);
  const cohortLabelByKey = useMemo(
    () =>
      cohorts.reduce<Record<string, string>>((acc, cohort) => {
        acc[cohort.cohortKey] = cohort.cohortLabel;
        return acc;
      }, {}),
    [cohorts]
  );

  return (
    <MajorAnalyticsChartCard
      title="Average Credits Earned by Major and FTIC Cohort"
      subtitle="Comparison across cohort years"
    >
      <div data-testid="cohort-legend" className="flex items-center gap-4 pb-3">
        {cohorts.map((cohort, index) => (
          <div key={cohort.cohortKey} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: getCohortColor(cohort.cohortLabel, index),
              }}
            />
            <span
              data-testid="cohort-legend-label"
              className="text-xs text-muted-foreground"
            >
              {cohort.cohortLabel}
            </span>
          </div>
        ))}
      </div>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 20, left: 0 }}
            barCategoryGap="28%"
            barGap={2}
          >
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
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelStyle={chartTooltipLabelStyle}
              itemStyle={chartTooltipItemStyle}
              formatter={(value: number, name: string) => [
                value,
                cohortLabelByKey[name] ?? name,
              ]}
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.major ?? '')
              }
            />
            {cohorts.map((cohort, index) => (
              <Bar
                key={cohort.cohortKey}
                dataKey={cohort.cohortKey}
                fill={getCohortColor(cohort.cohortLabel, index)}
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 pt-4 sm:grid-cols-2">
        {chartData.map((row) => (
          <div
            key={`credits-cohort-major-${row.major}`}
            className="flex items-center justify-between rounded-md border border-border/80 bg-secondary/20 px-3 py-2 text-xs"
          >
            <span className="text-muted-foreground">
              #{row.rank} {row.shortMajor}
            </span>
            <span className="font-medium text-foreground">
              {cohorts.length} cohorts
            </span>
          </div>
        ))}
      </div>
    </MajorAnalyticsChartCard>
  );
}
