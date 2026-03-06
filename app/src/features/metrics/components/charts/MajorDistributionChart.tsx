'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
  majorDistributionColors,
} from './major-distribution-chart.config';

interface MajorData {
  major: string;
  count: number;
}

interface MajorDistributionChartProps {
  data: MajorData[];
  title?: string;
}

function shortenMajorLabel(value: string, maxLength = 44) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function MajorDistributionChartComponent({
  data,
  title = 'Students by Major',
}: MajorDistributionChartProps) {
  const topMajors = useMemo(
    () =>
      data.slice(0, 10).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        shortMajor: shortenMajorLabel(entry.major),
      })),
    [data]
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Top 10 majors by student count
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topMajors} margin={{ top: 8, right: 20, left: 0 }}>
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
                allowDecimals={false}
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelStyle={chartTooltipLabelStyle}
                itemStyle={chartTooltipItemStyle}
                formatter={(value: number) => [
                  value.toLocaleString(),
                  'Students',
                ]}
                labelFormatter={(_, payload) =>
                  String(payload?.[0]?.payload?.major ?? '')
                }
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {topMajors.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.major}`}
                    fill={
                      majorDistributionColors[
                        index % majorDistributionColors.length
                      ]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-2 pt-4 sm:grid-cols-2">
          {topMajors.map((entry) => (
            <div
              key={`major-rank-${entry.major}`}
              className="flex items-center justify-between rounded-md border border-border/80 bg-secondary/20 px-3 py-2 text-xs"
            >
              <span className="text-muted-foreground">
                #{entry.rank} {entry.shortMajor}
              </span>
              <span className="font-medium text-foreground">
                {entry.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const MajorDistributionChart = memo(MajorDistributionChartComponent);
