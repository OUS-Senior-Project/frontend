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
import type { ForecastData } from './types';

interface ForecastTrendChartPlotProps {
  combinedData: ForecastData[];
  lastHistoricalPeriod?: string;
}

interface TooltipFormatterContext {
  payload?: ForecastData;
}

const tooltipStyle = {
  backgroundColor: 'oklch(0.18 0.01 260)',
  border: '1px solid oklch(0.28 0.01 260)',
  borderRadius: '8px',
  color: 'oklch(0.95 0 0)',
};

export function ForecastTrendChartPlot({
  combinedData,
  lastHistoricalPeriod,
}: ForecastTrendChartPlotProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={combinedData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
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
          contentStyle={tooltipStyle}
          formatter={(
            value: number,
            _name,
            context: TooltipFormatterContext
          ) => [
            `${value.toLocaleString()} ${context.payload?.isForecasted ? '(Projected)' : ''}`,
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
  );
}
