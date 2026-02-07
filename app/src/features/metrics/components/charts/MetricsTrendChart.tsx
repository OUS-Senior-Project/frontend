'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { TrendChartLegend } from './TrendChartLegend';
import type { MetricsTrendChartProps } from './metrics-trend-chart.types';
import { MetricsTrendChartPlot } from './MetricsTrendChartPlot';

export function MetricsTrendChart({
  data,
  forecastData,
}: MetricsTrendChartProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          Student Trends Over Time
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Total student count by semester (2019-2024)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <MetricsTrendChartPlot data={data} forecastData={forecastData} />
        </div>
        <TrendChartLegend showForecast={Boolean(forecastData)} />
      </CardContent>
    </Card>
  );
}
