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

interface SchoolData {
  school: string;
  count: number;
}

interface SchoolBreakdownChartProps {
  data: SchoolData[];
}

const colors = [
  'oklch(0.65 0.20 250)',
  'oklch(0.70 0.18 170)',
  'oklch(0.75 0.20 85)',
  'oklch(0.60 0.22 25)',
  'oklch(0.65 0.15 310)',
  'oklch(0.58 0.18 220)',
  'oklch(0.72 0.16 140)',
];

export function SchoolBreakdownChart({ data }: SchoolBreakdownChartProps) {
  const shortNames = data.map((item) => ({
    ...item,
    shortName: item.school
      .replace('College of ', '')
      .replace('School of ', '')
      .replace(' & ', ' & '),
  }));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Students by School/College
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Distribution across academic units
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={shortNames}
              margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.28 0.01 260)"
                vertical={false}
              />
              <XAxis
                dataKey="shortName"
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={80}
              />
              <YAxis
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
                labelFormatter={(label) =>
                  data.find((d) => d.school.includes(label))?.school || label
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {shortNames.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.school}`}
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
