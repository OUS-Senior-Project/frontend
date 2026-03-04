export const studentTypeColors = [
  'oklch(0.65 0.20 250)',
  'oklch(0.70 0.18 170)',
  'oklch(0.75 0.20 85)',
  'oklch(0.60 0.22 25)',
];

export const studentTypeLabels: Record<string, string> = {
  FTIC: 'First-Time in College',
  Transfer: 'Transfer Students',
  Continuing: 'Continuing Students',
  'Dual Enrollment': 'Dual Enrollment',
};

const tooltipTextColor = 'oklch(0.95 0 0)';

export const chartTooltipStyle = {
  backgroundColor: 'oklch(0.18 0.01 260)',
  border: '1px solid oklch(0.28 0.01 260)',
  borderRadius: '8px',
  color: tooltipTextColor,
};

export const chartTooltipLabelStyle = { color: tooltipTextColor };
export const chartTooltipItemStyle = { color: tooltipTextColor };
