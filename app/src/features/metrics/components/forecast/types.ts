export interface ForecastData {
  period: string;
  total: number;
  isForecasted?: boolean;
}

export interface ForecastSectionProps {
  historicalData: ForecastData[];
  forecastData: ForecastData[];
}
