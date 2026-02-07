export interface TrendData {
  period: string;
  total: number;
  isForecasted?: boolean;
}

export interface MetricsTrendChartProps {
  data: TrendData[];
  forecastData?: TrendData[];
}
