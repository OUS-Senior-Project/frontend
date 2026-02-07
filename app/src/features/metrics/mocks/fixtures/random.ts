export function seededRandom(seed: number): () => number {
  let s = seed;

  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}
