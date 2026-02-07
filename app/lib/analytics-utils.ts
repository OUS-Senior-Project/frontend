export const computeFiveYearGrowth = (
  yearlyAnalytics: Array<{ total: number }>
) => {
  const firstYear = yearlyAnalytics[0];
  const lastYear = yearlyAnalytics[yearlyAnalytics.length - 1];
  return firstYear && lastYear
    ? Math.round(((lastYear.total - firstYear.total) / firstYear.total) * 100)
    : 0;
};

export const getTopMajorLabel = (
  majorData: Array<{ major?: string | null }>
) => {
  return majorData[0]?.major || 'N/A';
};
