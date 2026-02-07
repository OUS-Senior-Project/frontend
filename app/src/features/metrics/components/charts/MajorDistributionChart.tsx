'use client';

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

export function MajorDistributionChart({
  data,
  title = 'Students by Major',
}: MajorDistributionChartProps) {
  const top10 = data.slice(0, 10);

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
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top10}
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
                formatter={(value: number) => [
                  value.toLocaleString(),
                  'Students',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {top10.map((entry, index) => (
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
      </CardContent>
    </Card>
  );
}
