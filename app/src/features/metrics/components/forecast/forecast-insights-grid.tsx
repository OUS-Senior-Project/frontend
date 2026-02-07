import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';

interface ForecastInsight {
  icon: LucideIcon;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'info';
}

interface ForecastInsightsGridProps {
  insights: ForecastInsight[];
}

function borderClass(type: ForecastInsight['type']) {
  if (type === 'positive') return 'border-l-chart-2';
  if (type === 'warning') return 'border-l-chart-4';
  return 'border-l-primary';
}

function iconClass(type: ForecastInsight['type']) {
  if (type === 'positive') return 'bg-chart-2/20 text-chart-2';
  if (type === 'warning') return 'bg-chart-4/20 text-chart-4';
  return 'bg-primary/20 text-primary';
}

export function ForecastInsightsGrid({ insights }: ForecastInsightsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {insights.map((insight) => (
        <Card
          key={insight.title}
          className={`border-border border-l-4 bg-card ${borderClass(insight.type)}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass(insight.type)}`}
              >
                <insight.icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  {insight.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
