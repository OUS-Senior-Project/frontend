'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface MajorData {
  major: string;
  count: number;
}

interface MajorBreakdownChartProps {
  data: MajorData[];
  title?: string;
}

const colors = [
  'oklch(0.65 0.20 250)',
  'oklch(0.70 0.18 170)',
  'oklch(0.75 0.20 85)',
  'oklch(0.60 0.22 25)',
  'oklch(0.65 0.15 310)',
  'oklch(0.58 0.18 220)',
  'oklch(0.72 0.16 140)',
  'oklch(0.68 0.19 50)',
  'oklch(0.62 0.17 280)',
  'oklch(0.70 0.14 200)',
];

export function MajorBreakdownChart({
  data,
  title = 'Enrollment by Major',
}: MajorBreakdownChartProps) {
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
                contentStyle={{
                  backgroundColor: 'oklch(0.18 0.01 260)',
                  border: '1px solid oklch(0.28 0.01 260)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
                formatter={(value: number) => [
                  value.toLocaleString(),
                  'Students',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {top10.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.major}`}
                    fill={colors[index % colors.length]}
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
