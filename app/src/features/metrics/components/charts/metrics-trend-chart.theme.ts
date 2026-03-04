const tooltipTextColor = 'oklch(0.95 0 0)';

export const trendTooltipStyle = {
  backgroundColor: 'oklch(0.18 0.01 260)',
  border: '1px solid oklch(0.28 0.01 260)',
  borderRadius: '8px',
  color: tooltipTextColor,
};

export const trendTooltipLabelStyle = { color: tooltipTextColor };
export const trendTooltipItemStyle = { color: tooltipTextColor };

export const trendGradientStops = [
  { offset: '5%', stopColor: 'oklch(0.65 0.20 250)', stopOpacity: 0.3 },
  { offset: '95%', stopColor: 'oklch(0.65 0.20 250)', stopOpacity: 0 },
];
