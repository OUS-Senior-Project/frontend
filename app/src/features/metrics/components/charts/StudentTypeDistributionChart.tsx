'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  chartTooltipStyle,
  studentTypeColors,
  studentTypeLabels,
} from './student-type-distribution-chart.config';

interface TypeData {
  type: string;
  count: number;
}

interface StudentTypeDistributionChartProps {
  data: TypeData[];
}

export function StudentTypeDistributionChart({ data }: StudentTypeDistributionChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    name: studentTypeLabels[item.type] || item.type,
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Student Type Distribution
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Breakdown by student category
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="name"
              >
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.type}`}
                    fill={studentTypeColors[index % studentTypeColors.length]}
                    stroke="oklch(0.18 0.01 260)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span style={{ color: 'oklch(0.65 0 0)', fontSize: '11px' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
