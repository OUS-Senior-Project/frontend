export function ForecastChartLegend() {
  return (
    <div className="mt-4 flex items-center gap-6 text-xs">
      <div className="flex items-center gap-2">
        <div className="h-2 w-4 rounded bg-chart-2" />
        <span className="text-muted-foreground">Historical</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-4 rounded border-2 border-dashed border-chart-2 bg-transparent" />
        <span className="text-muted-foreground">Forecasted</span>
      </div>
    </div>
  );
}
