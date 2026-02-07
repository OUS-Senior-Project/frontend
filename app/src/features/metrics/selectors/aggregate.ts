export function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

export function aggregateCounts<T>(
  items: T[],
  getKey: (item: T) => string,
  getValue: (item: T) => number
) {
  const map: Record<string, number> = {};

  items.forEach((item) => {
    const key = getKey(item);
    map[key] = (map[key] ?? 0) + getValue(item);
  });

  return map;
}
