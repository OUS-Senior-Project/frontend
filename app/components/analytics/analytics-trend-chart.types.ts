export interface TrendData {
  period: string;
  total: number;
  isForecasted?: boolean;
}

export interface AnalyticsTrendChartProps {
  data: TrendData[];
  forecastData?: TrendData[];
}
