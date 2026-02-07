interface TrendChartLegendProps {
  showForecast: boolean;
}

export function TrendChartLegend({ showForecast }: TrendChartLegendProps) {
  if (!showForecast) return null;

  return (
    <div className="mt-3 flex items-center gap-4 text-xs">
      <div className="flex items-center gap-2">
        <div className="h-2 w-4 rounded bg-primary" />
        <span className="text-muted-foreground">Historical</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-4 rounded border-2 border-dashed border-primary bg-transparent" />
        <span className="text-muted-foreground">Forecasted</span>
      </div>
    </div>
  );
}
