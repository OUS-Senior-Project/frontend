export interface ForecastData {
  period: string;
  total: number;
  isForecasted?: boolean;
}

export interface ForecastInsightTexts {
  projectedGrowthText?: string;
  resourcePlanningText?: string;
  recommendationText?: string;
}

export interface ForecastSectionProps {
  historicalData: ForecastData[];
  forecastData: ForecastData[];
  insights?: ForecastInsightTexts;
}
