'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface TypeData {
  type: string;
  count: number;
}

interface StudentTypeChartProps {
  data: TypeData[];
}

const colors = [
  'oklch(0.65 0.20 250)',
  'oklch(0.70 0.18 170)',
  'oklch(0.75 0.20 85)',
  'oklch(0.60 0.22 25)',
];

const typeLabels: Record<string, string> = {
  FTIC: 'First-Time in College',
  Transfer: 'Transfer Students',
  Continuing: 'Continuing Students',
  'Dual Enrollment': 'Dual Enrollment',
};

export function StudentTypeChart({ data }: StudentTypeChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    name: typeLabels[item.type] || item.type,
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
                    fill={colors[index % colors.length]}
                    stroke="oklch(0.18 0.01 260)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.18 0.01 260)',
                  border: '1px solid oklch(0.28 0.01 260)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
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
