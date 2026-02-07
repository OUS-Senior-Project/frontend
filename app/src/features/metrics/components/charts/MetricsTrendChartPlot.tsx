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
import type { MetricsTrendChartProps } from './metrics-trend-chart.types';
import {
  trendGradientStops,
  trendTooltipLabelStyle,
  trendTooltipStyle,
} from './metrics-trend-chart.theme';

export function MetricsTrendChartPlot({ data, forecastData }: MetricsTrendChartProps) {
  const combinedData = [...data, ...(forecastData || [])];
  const lastHistoricalIndex = data.length - 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            {trendGradientStops.map((stop) => (
              <stop key={stop.offset} {...stop} />
            ))}
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 260)" vertical={false} />
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
        <Area type="monotone" dataKey="total" stroke="transparent" fill="url(#colorTotal)" />
        {forecastData && lastHistoricalIndex >= 0 && (
          <ReferenceLine
            x={data[lastHistoricalIndex]?.period}
            stroke="oklch(0.65 0 0)"
            strokeDasharray="5 5"
            label={{ value: 'Forecast', position: 'top', fill: 'oklch(0.65 0 0)', fontSize: 10 }}
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
  );
}
