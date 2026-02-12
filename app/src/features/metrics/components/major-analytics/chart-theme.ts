export const majorChartColors = [
  'oklch(0.65 0.20 250)',
  'oklch(0.70 0.18 170)',
  'oklch(0.75 0.20 85)',
  'oklch(0.60 0.22 25)',
  'oklch(0.65 0.15 310)',
  'oklch(0.58 0.18 220)',
  'oklch(0.72 0.16 140)',
  'oklch(0.68 0.19 50)',
  'oklch(0.62 0.17 280)',
  'oklch(0.70 0.14 200)',
];

export const cohortColors: Record<string, string> = {
  'FTIC 2021': 'oklch(0.65 0.20 250)',
  'FTIC 2022': 'oklch(0.70 0.18 170)',
  'FTIC 2023': 'oklch(0.75 0.20 85)',
  'FTIC 2024': 'oklch(0.60 0.22 25)',
};

export function getCohortColor(cohort: string, index: number) {
  return (
    cohortColors[cohort] ?? majorChartColors[index % majorChartColors.length]
  );
}

export const chartTooltipStyle = {
  backgroundColor: 'oklch(0.18 0.01 260)',
  border: '1px solid oklch(0.28 0.01 260)',
  borderRadius: '8px',
  color: 'oklch(0.95 0 0)',
};
