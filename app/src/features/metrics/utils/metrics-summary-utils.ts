export const selectTopMajorLabel = (
  majorData: Array<{ major?: string | null }>
) => {
  return majorData[0]?.major || 'N/A';
};
