import { TrendingUp } from 'lucide-react';
import { ForecastSection } from '@/features/metrics/components/ForecastSection';
import { MetricsSummaryCard } from '@/features/metrics/components/MetricsSummaryCard';
import type { ForecastsAnalyticsResponse, UIError } from '@/lib/api/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { TabsContent } from '@/shared/ui/tabs';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelLoadingState,
} from './PanelStates';

interface ForecastsPanelProps {
  data: ForecastsAnalyticsResponse | null;
  loading: boolean;
  error: UIError | null;
  horizon: number;
  onHorizonChange: (horizon: number) => void;
  onRetry: () => void;
}

export function ForecastsPanel({
  data,
  loading,
  error,
  horizon,
  onHorizonChange,
  onRetry,
}: ForecastsPanelProps) {
  const horizonOptions = [2, 4, 6, 8, 12];

  return (
    <TabsContent value="forecasts" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Predictive Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Student forecasts and data-driven insights
          </p>
        </div>
        <div className="w-full sm:w-[170px]">
          <Select
            value={String(horizon)}
            onValueChange={(value) => {
              onHorizonChange(Number(value));
            }}
          >
            <SelectTrigger aria-label="Select forecast horizon">
              <SelectValue placeholder="Forecast horizon" />
            </SelectTrigger>
            <SelectContent>
              {horizonOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} semesters
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {loading && <PanelLoadingState message="Loading forecast analytics..." />}
      {!loading && error && (
        <PanelErrorState
          message={error.message}
          onRetry={() => {
            onRetry();
          }}
        />
      )}
      {!loading && !error && !data && (
        <PanelEmptyState
          title="No forecast analytics available"
          description="Forecast metrics will appear here when historical data is ready."
        />
      )}
      {!loading && !error && data && (
        <>
          <MetricsSummaryCard
            title="5-Year Growth"
            value={`${data.fiveYearGrowthPct >= 0 ? '+' : ''}${data.fiveYearGrowthPct}%`}
            change={data.fiveYearGrowthPct}
            icon={TrendingUp}
            description="Since 2019"
          />
          <ForecastSection
            historicalData={data.historical}
            forecastData={data.forecast}
            insights={data.insights}
          />
        </>
      )}
    </TabsContent>
  );
}
