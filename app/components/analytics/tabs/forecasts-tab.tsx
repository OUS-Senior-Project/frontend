import { TrendingUp } from 'lucide-react';
import { ForecastSection } from '@/components/analytics/forecast-section';
import { StatCard } from '@/components/analytics/stat-card';
import { TabsContent } from '@/components/ui/tabs';

interface ForecastsTabProps {
  fiveYearGrowth: number;
  trendData: Array<{ period: string; total: number }>;
  forecastData: Array<{
    period: string;
    total: number;
    isForecasted?: boolean;
  }>;
}

export function ForecastsTab({
  fiveYearGrowth,
  trendData,
  forecastData,
}: ForecastsTabProps) {
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
      <StatCard
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
