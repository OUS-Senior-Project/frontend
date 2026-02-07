const noisyPatterns = [
  /Browserslist: caniuse-lite is outdated/i,
  /baseline browser mapping/i,
  /BROWSERSLIST_IGNORE_OLD_DATA/i,
];

const shouldFilter = (args) =>
  args.some(
    (arg) =>
      typeof arg === 'string' &&
      noisyPatterns.some((pattern) => pattern.test(arg))
  );

const wrap =
  (fn) =>
  (...args) => {
    if (shouldFilter(args)) return;
    fn(...args);
  };

console.warn = wrap(console.warn.bind(console));
console.error = wrap(console.error.bind(console));
