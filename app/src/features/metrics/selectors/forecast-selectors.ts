import type { ForecastPoint, TrendPoint } from '@/features/metrics/types';

export function selectForecastSeries(
  historicalData: TrendPoint[]
): ForecastPoint[] {
  const lastFewPoints = historicalData.slice(-4);
  const avgGrowth =
    lastFewPoints.reduce((sum, point, index, arr) => {
      if (index === 0) return 0;
      return sum + (point.total - arr[index - 1].total) / arr[index - 1].total;
    }, 0) / 3;

  const lastPoint = historicalData[historicalData.length - 1];
  if (!lastPoint) return [];

  const forecasts: ForecastPoint[] = [];

  for (let i = 1; i <= 4; i += 1) {
    const year = lastPoint.year + Math.floor((lastPoint.semester + i - 1) / 2);
    const semester = ((lastPoint.semester + i - 1) % 2) + 1;

    forecasts.push({
      period: `${semester === 1 ? 'Fall' : 'Spring'} ${year}`,
      year,
      semester,
      total: Math.round(lastPoint.total * Math.pow(1 + avgGrowth, i)),
      isForecasted: true,
    });
  }

  return forecasts;
}
