import { TrendingUp } from 'lucide-react';
import { ForecastSection } from '@/features/metrics/components/ForecastSection';
import { MetricsSummaryCard } from '@/features/metrics/components/MetricsSummaryCard';
import type { ForecastsAnalyticsResponse, UIError } from '@/lib/api/types';
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
  onRetry: () => void;
}

export function ForecastsPanel({
  data,
  loading,
  error,
  onRetry,
}: ForecastsPanelProps) {
  return (
    <TabsContent value="forecasts" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Predictive Analytics
        </h2>
        <p className="text-sm text-muted-foreground">
          Student forecasts and data-driven insights
        </p>
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
            value={`${data.fiveYearGrowth >= 0 ? '+' : ''}${data.fiveYearGrowth}%`}
            change={data.fiveYearGrowth}
            icon={TrendingUp}
            description="Since 2019"
          />
          <ForecastSection
            historicalData={data.historicalSeries}
            forecastData={data.forecastSeries}
          />
        </>
      )}
    </TabsContent>
  );
}
