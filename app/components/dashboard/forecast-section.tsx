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
import { TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface ForecastData {
  period: string;
  total: number;
  isForecasted?: boolean;
}

interface ForecastSectionProps {
  historicalData: ForecastData[];
  forecastData: ForecastData[];
}

export function ForecastSection({
  historicalData,
  forecastData,
}: ForecastSectionProps) {
  const combinedData = [...historicalData.slice(-6), ...forecastData];
  const lastHistorical = historicalData[historicalData.length - 1];
  const lastForecast = forecastData[forecastData.length - 1];

  const projectedGrowth =
    lastHistorical && lastForecast
      ? ((lastForecast.total - lastHistorical.total) / lastHistorical.total) *
        100
      : 0;

  const insights = [
    {
      icon: TrendingUp,
      title: 'Projected Growth',
      description: `Expected ${projectedGrowth.toFixed(1)}% enrollment increase over the next 2 years based on current trends.`,
      type: 'positive' as const,
    },
    {
      icon: AlertTriangle,
      title: 'Resource Planning',
      description:
        'Current growth trajectory may require additional advisors and support staff by Fall 2025.',
      type: 'warning' as const,
    },
    {
      icon: Lightbulb,
      title: 'Recommendation',
      description:
        'Consider expanding Computer Science and Nursing programs based on migration patterns and demand.',
      type: 'info' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-foreground">
            Enrollment Forecast
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Projected enrollment for upcoming semesters
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
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toLocaleString()} ${props.payload.isForecasted ? '(Projected)' : ''}`,
                    'Students',
                  ]}
                />
                <ReferenceLine
                  x={lastHistorical?.period}
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
          <div className="mt-4 flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-4 rounded bg-chart-2" />
              <span className="text-muted-foreground">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-4 rounded border-2 border-dashed border-chart-2 bg-transparent" />
              <span className="text-muted-foreground">Forecasted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight) => (
          <Card
            key={insight.title}
            className={`border-border bg-card ${
              insight.type === 'positive'
                ? 'border-l-4 border-l-chart-2'
                : insight.type === 'warning'
                  ? 'border-l-4 border-l-chart-4'
                  : 'border-l-4 border-l-primary'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    insight.type === 'positive'
                      ? 'bg-chart-2/20'
                      : insight.type === 'warning'
                        ? 'bg-chart-4/20'
                        : 'bg-primary/20'
                  }`}
                >
                  <insight.icon
                    className={`h-4 w-4 ${
                      insight.type === 'positive'
                        ? 'text-chart-2'
                        : insight.type === 'warning'
                          ? 'text-chart-4'
                          : 'text-primary'
                    }`}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {insight.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-foreground">
            Forecasted Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {forecastData.map((forecast) => (
              <div
                key={forecast.period}
                className="rounded-lg bg-secondary/50 p-4 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  {forecast.period}
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {forecast.total.toLocaleString()}
                </p>
                <p className="text-xs text-chart-2">Projected</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
