import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ForecastData } from './types';
import { ForecastChartLegend } from './forecast-chart-legend';

interface ForecastChartCardProps {
  combinedData: ForecastData[];
  lastHistoricalPeriod?: string;
}

export function ForecastChartCard({
  combinedData,
  lastHistoricalPeriod,
}: ForecastChartCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Student Forecast
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Projected student counts for upcoming semesters
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
                <linearGradient
                  id="forecastGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="oklch(0.70 0.18 170)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.70 0.18 170)"
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
                formatter={(value: number, _name, props: any) => [
                  `${value.toLocaleString()} ${props.payload.isForecasted ? '(Projected)' : ''}`,
                  'Students',
                ]}
              />
              <ReferenceLine
                x={lastHistoricalPeriod}
                stroke="oklch(0.65 0 0)"
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="transparent"
                fill="url(#forecastGradient)"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="oklch(0.70 0.18 170)"
                strokeWidth={2}
                dot={{ fill: 'oklch(0.70 0.18 170)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'oklch(0.70 0.18 170)' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <ForecastChartLegend />
      </CardContent>
    </Card>
  );
}
