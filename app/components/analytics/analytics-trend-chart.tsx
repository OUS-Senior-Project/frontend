'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
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
import { TrendChartLegend } from './trend-chart-legend';
import {
  trendGradientStops,
  trendTooltipLabelStyle,
  trendTooltipStyle,
} from './trend-chart-theme';
import type { AnalyticsTrendChartProps } from './analytics-trend-chart.types';

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
                  {trendGradientStops.map((stop) => (
                    <stop key={stop.offset} {...stop} />
                  ))}
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
                contentStyle={trendTooltipStyle}
                labelStyle={trendTooltipLabelStyle}
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
        <TrendChartLegend showForecast={Boolean(forecastData)} />
      </CardContent>
    </Card>
  );
}
