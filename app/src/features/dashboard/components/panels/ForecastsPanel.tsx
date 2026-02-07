import { TrendingUp } from 'lucide-react';
import { ForecastSection } from '@/features/metrics/components/ForecastSection';
import { MetricsSummaryCard } from '@/features/metrics/components/MetricsSummaryCard';
import { TabsContent } from '@/shared/ui/tabs';

interface ForecastsPanelProps {
  fiveYearGrowth: number;
  trendData: Array<{ period: string; total: number }>;
  forecastData: Array<{
    period: string;
    total: number;
    isForecasted?: boolean;
  }>;
}

export function ForecastsPanel({
  fiveYearGrowth,
  trendData,
  forecastData,
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
      <MetricsSummaryCard
        title="5-Year Growth"
        value={`+${fiveYearGrowth}%`}
        change={fiveYearGrowth}
        icon={TrendingUp}
        description="Since 2019"
      />
      <ForecastSection historicalData={trendData} forecastData={forecastData} />
    </TabsContent>
  );
}
