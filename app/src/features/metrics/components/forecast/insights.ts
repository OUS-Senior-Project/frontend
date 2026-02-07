import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';

interface BuildInsightsInput {
  projectedGrowth: number;
}

export function buildForecastInsights({ projectedGrowth }: BuildInsightsInput) {
  return [
    {
      icon: TrendingUp,
      title: 'Projected Growth',
      description: `Expected ${projectedGrowth.toFixed(1)}% student count increase over the next 2 years based on current trends.`,
      type: 'positive' as const,
    },
    {
      icon: AlertTriangle,
      title: 'Resource Planning',
      description:
        'Current growth trajectory may require additional advisors and support staff by Fall 2025.',
      type: 'warning' as const,
    },
    {
      icon: Lightbulb,
      title: 'Recommendation',
      description:
        'Consider expanding Computer Science and Nursing programs based on migration patterns and demand.',
      type: 'info' as const,
    },
  ];
}
