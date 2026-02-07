'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

interface TrendData {
  period: string;
  total: number;
  isForecasted?: boolean;
}

interface AnalyticsTrendChartProps {
  data: TrendData[];
  forecastData?: TrendData[];
}

export function AnalyticsTrendChart({
  data,
  forecastData,
}: AnalyticsTrendChartProps) {
  const combinedData = [...data, ...(forecastData || [])];
  const lastHistoricalIndex = data.length - 1;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Student Trends Over Time
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Total student count by semester (2019-2024)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={combinedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.65 0.20 250)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.65 0.20 250)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.28 0.01 260)"
                vertical={false}
              />
              <XAxis
                dataKey="period"
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
                interval={1}
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
                labelStyle={{ color: 'oklch(0.95 0 0)' }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === 'total' ? 'Students' : name,
                ]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="transparent"
                fill="url(#colorTotal)"
              />
              {forecastData && lastHistoricalIndex >= 0 && (
                <ReferenceLine
                  x={data[lastHistoricalIndex]?.period}
                  stroke="oklch(0.65 0 0)"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Forecast',
                    position: 'top',
                    fill: 'oklch(0.65 0 0)',
                    fontSize: 10,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="total"
                stroke="oklch(0.65 0.20 250)"
                strokeWidth={2}
                dot={{ fill: 'oklch(0.65 0.20 250)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'oklch(0.65 0.20 250)' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {forecastData && (
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-4 rounded bg-primary" />
              <span className="text-muted-foreground">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-4 rounded border-2 border-dashed border-primary bg-transparent" />
              <span className="text-muted-foreground">Forecasted</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
