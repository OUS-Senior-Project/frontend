'use client';

import { useMemo } from 'react';
import { ForecastChartCard } from './forecast/forecast-chart-card';
import { ForecastInsightsGrid } from './forecast/forecast-insights-grid';
import { ForecastNumbersCard } from './forecast/forecast-numbers-card';
import { buildForecastInsights } from './forecast/insights';
import type { ForecastSectionProps } from './forecast/types';

export function ForecastSection({
  historicalData,
  forecastData,
}: ForecastSectionProps) {
  const combinedData = useMemo(
    () => [...historicalData.slice(-6), ...forecastData],
    [historicalData, forecastData]
  );

  const projectedGrowth = useMemo(() => {
    const lastHistorical = historicalData[historicalData.length - 1];
    const lastForecast = forecastData[forecastData.length - 1];
    if (!lastHistorical || !lastForecast) return 0;
    return (
      ((lastForecast.total - lastHistorical.total) / lastHistorical.total) * 100
    );
  }, [forecastData, historicalData]);

  const insights = useMemo(
    () => buildForecastInsights({ projectedGrowth }),
    [projectedGrowth]
  );

  return (
    <div className="space-y-6">
      <ForecastChartCard
        combinedData={combinedData}
        lastHistoricalPeriod={historicalData[historicalData.length - 1]?.period}
      />
      <ForecastInsightsGrid insights={insights} />
      <ForecastNumbersCard forecastData={forecastData} />
    </div>
  );
}
